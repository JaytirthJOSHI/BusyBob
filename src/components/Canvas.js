import { auth, db, supabase } from '../lib/supabase.js'
import { 
    parseGradebook, 
    parseAssignments, 
    calculateGPA,
    getGradeColor 
} from '../utils/grades-parser.js'

export class Canvas {
    constructor() {
        this.canvasClient = null
        this.courses = null
        this.assignments = null
        this.grades = null
        this.discussions = null
        this.announcements = null
        this.calendarEvents = null
        this.upcomingAssignments = null
        this.dashboard = null
        this.isConnected = false
        this.canvasUrl = ''
        this.accessToken = ''
        this.activeTab = 'dashboard'
    }

    async init() {
        console.log('🎨 Initializing Canvas component...')
        
        const storedCredentials = await this.getStoredCredentials()
        if (storedCredentials) {
            this.canvasUrl = storedCredentials.canvasUrl
            this.accessToken = storedCredentials.accessToken
            this.isConnected = true
            await this.loadAllData()
        } else {
            this.render()
            this.setupEventListeners()
        }
    }

    async getStoredCredentials() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return null
            
            const { data, error } = await supabase.from('canvas_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()
            
            if (error || !data) return null
            
            return {
                canvasUrl: data.canvas_url,
                accessToken: data.access_token
            }
        } catch (error) {
            console.error('Error fetching stored Canvas credentials:', error)
            return null
        }
    }

    async storeCredentials(canvasUrl, accessToken) {
        try {
            console.log('🔐 Attempting to store Canvas credentials...')
            
            const authResult = await auth.getCurrentUser()
            if (!authResult || !authResult.data || !authResult.data.user) {
                throw new Error('You must be logged in to save Canvas credentials. Please log in and try again.')
            }
            
            const { data: { user } } = authResult
            
            const { error } = await supabase.from('canvas_credentials')
                .upsert({
                    user_id: user.id,
                    canvas_url: canvasUrl,
                    access_token: accessToken,
                    updated_at: new Date().toISOString()
                })
            
            if (error) {
                throw error
            }
            
            console.log('✅ Canvas credentials stored successfully')
        } catch (error) {
            console.error('❌ Error storing Canvas credentials:', error)
            throw error
        }
    }

    async fetchCanvasData(action, params = {}, retries = 3) {
        if (!this.canvasUrl || !this.accessToken) {
            throw new Error('Canvas credentials are not set.');
        }
        
        const { data: { session } } = await auth.getSession()
        if (!session) {
            throw new Error('User not authenticated');
        }
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch('/api/canvas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        action: action,
                        ...params
                    }),
                });

                if (!response.ok) {
                    let errorMessage = `Request failed with status ${response.status}`;
                    try {
                        const errorBody = await response.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        errorMessage = response.statusText || errorMessage;
                    }
                    
                    if (attempt === retries) {
                        throw new Error(errorMessage);
                    }
                    
                    console.log(`Attempt ${attempt} failed for ${action}, retrying in ${attempt * 1000}ms...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                    continue;
                }

                const text = await response.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }

                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse JSON response:', text);
                    throw new Error('Invalid response format from server');
                }
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                
                console.log(`Attempt ${attempt} failed for ${action}, retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }

    async loadAllData() {
        this.showMessage('Loading Canvas data...', 'info');

        const dataPromises = [
            this.loadDashboard(),
            this.loadCourses(),
            this.loadUpcomingAssignments(),
            this.loadCalendarEvents()
        ];

        await Promise.all(dataPromises.map(p => p.catch(e => {
            console.error('Data loading failed for one of the items:', e);
            return e; 
        })));

        this.render();
        this.setupEventListeners();
        this.showMessage('Canvas data loaded.', 'success');
    }

    async loadDashboard() {
        try {
            console.log('Fetching Canvas dashboard...');
            this.dashboard = await this.fetchCanvasData('getDashboard');
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showMessage(`Failed to load dashboard: ${error.message}`, 'error');
        }
    }

    async loadCourses() {
        try {
            console.log('Fetching Canvas courses...');
            this.courses = await this.fetchCanvasData('getCourses');
        } catch (error) {
            console.error('Failed to load courses:', error);
            this.showMessage(`Failed to load courses: ${error.message}`, 'error');
        }
    }

    async loadUpcomingAssignments() {
        try {
            console.log('Fetching upcoming assignments...');
            this.upcomingAssignments = await this.fetchCanvasData('getUpcomingAssignments');
        } catch (error) {
            console.error('Failed to load upcoming assignments:', error);
            this.showMessage(`Failed to load upcoming assignments: ${error.message}`, 'error');
        }
    }

    async loadCalendarEvents() {
        try {
            console.log('Fetching calendar events...');
            this.calendarEvents = await this.fetchCanvasData('getCalendarEvents');
        } catch (error) {
            console.error('Failed to load calendar events:', error);
            this.showMessage(`Failed to load calendar events: ${error.message}`, 'error');
        }
    }

    async loadCourseDetails(courseId) {
        try {
            const [assignments, submissions, discussions, announcements] = await Promise.all([
                this.fetchCanvasData('getAssignments', { courseId }),
                this.fetchCanvasData('getSubmissions', { courseId }),
                this.fetchCanvasData('getDiscussions', { courseId }),
                this.fetchCanvasData('getAnnouncements', { courseId })
            ]);
            
            return { assignments, submissions, discussions, announcements };
        } catch (error) {
            console.error('Failed to load course details:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        if (!this.isConnected) {
            this.renderConnectionForm();
        } else {
            this.renderCanvasContent();
        }
    }

    renderConnectionForm() {
        const container = document.getElementById('canvas-container');
        container.innerHTML = `
            <div class="canvas-connection-form">
                <h2>Connect to Canvas</h2>
                <p>Follow the steps below to connect your Canvas account to BusyBob.</p>
                
                <div class="connection-steps">
                    <div class="step active" data-step="1">
                        <div class="step-header">
                            <span class="step-number">1</span>
                            <h3>Find Your Canvas URL</h3>
                        </div>
                        <div class="step-content">
                            <p>Enter any Canvas URL. We'll automatically extract the base domain and create the settings link for you.</p>
                            <div class="url-examples">
                                <div class="url-example">
                                    <strong>Examples:</strong>
                                    <ul>
                                        <li><code>https://your-school.instructure.com/login</code></li>
                                        <li><code>https://canvas.your-school.edu/courses/123</code></li>
                                        <li><code>https://your-school.canvas.com/dashboard</code></li>
                                        <li><code>https://canvas.instructure.com/courses/11026154</code></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="canvas-login-url">Canvas URL</label>
                                <input type="url" id="canvas-login-url" name="canvasLoginUrl" required 
                                       placeholder="https://canvas.instructure.com/courses/11026154">
                                <small>Enter any Canvas URL - we'll extract the base domain automatically</small>
                            </div>
                            <div class="extracted-url-display" style="display: none;">
                                <strong>Extracted Canvas URL:</strong>
                                <span id="extracted-canvas-url" class="url-display">-</span>
                            </div>
                            <div class="settings-link-display" style="display: none;">
                                <strong>Settings Link:</strong>
                                <span id="settings-link" class="url-display">-</span>
                            </div>
                            <button class="btn btn-primary next-step" data-next="2">Next: Get Access Token</button>
                        </div>
                    </div>

                    <div class="step" data-step="2">
                        <div class="step-header">
                            <span class="step-number">2</span>
                            <h3>Generate Access Token</h3>
                        </div>
                        <div class="step-content">
                            <p>Now we'll help you create an access token in Canvas. This is a secure way to connect BusyBob to your account.</p>
                            
                            <div class="canvas-url-display">
                                <strong>Your Canvas URL:</strong>
                                <span id="display-canvas-url" class="url-display">-</span>
                                <a href="#" id="open-canvas-settings" class="btn btn-secondary btn-sm" target="_blank">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                    </svg>
                                    Open Canvas Settings
                                </a>
                            </div>
                            
                            <div class="canvas-link-display">
                                <strong>Canvas Settings Link:</strong>
                                <span id="display-canvas-link" class="url-display">-</span>
                            </div>
                            
                            <div class="token-instructions">
                                <div class="instruction-step">
                                    <div class="step-icon">1</div>
                                    <div class="step-text">
                                        <strong>Log into Canvas</strong>
                                        <p>Click the "Open Canvas Settings" button above to go directly to your Canvas settings</p>
                                    </div>
                                </div>
                                
                                <div class="instruction-step">
                                    <div class="step-icon">2</div>
                                    <div class="step-text">
                                        <strong>Find Approved Integrations</strong>
                                        <p>Scroll down to the "Approved Integrations" section</p>
                                    </div>
                                </div>
                                
                                <div class="instruction-step">
                                    <div class="step-icon">3</div>
                                    <div class="step-text">
                                        <strong>Create New Token</strong>
                                        <p>Click "+ New Access Token"</p>
                                    </div>
                                </div>
                                
                                <div class="instruction-step">
                                    <div class="step-icon">4</div>
                                    <div class="step-text">
                                        <strong>Enter Details</strong>
                                        <p>Description: <code>BusyBob Integration</code></p>
                                        <p>Expires: <code>Never</code> (or choose a date)</p>
                                    </div>
                                </div>
                                
                                <div class="instruction-step">
                                    <div class="step-icon">5</div>
                                    <div class="step-text">
                                        <strong>Copy Token</strong>
                                        <p>Click "Generate Token" and copy the generated token</p>
                                        <div class="warning">
                                            <strong>⚠️ Important:</strong> Copy the token immediately - you won't be able to see it again!
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="canvas-token">Access Token</label>
                                <input type="password" id="canvas-token" name="accessToken" required 
                                       placeholder="Paste your Canvas access token here">
                                <small>Paste the token you just generated in Canvas</small>
                            </div>
                            
                            <div class="step-buttons">
                                <button class="btn btn-secondary prev-step" data-prev="1">Back</button>
                                <button class="btn btn-primary next-step" data-next="3">Next: Test Connection</button>
                            </div>
                        </div>
                    </div>

                    <div class="step" data-step="3">
                        <div class="step-header">
                            <span class="step-number">3</span>
                            <h3>Test & Connect</h3>
                        </div>
                        <div class="step-content">
                            <p>Let's test your connection and save your credentials securely.</p>
                            
                            <div class="connection-summary">
                                <div class="summary-item">
                                    <strong>Canvas URL:</strong>
                                    <span id="summary-url">-</span>
                                </div>
                                <div class="summary-item">
                                    <strong>Access Token:</strong>
                                    <span id="summary-token">••••••••••••••••</span>
                                </div>
                            </div>
                            
                            <div class="step-buttons">
                                <button class="btn btn-secondary prev-step" data-prev="2">Back</button>
                                <button type="submit" class="btn btn-primary" id="connect-canvas-btn">
                                    <span class="btn-text">Connect to Canvas</span>
                                    <span class="btn-loading hidden">Connecting...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="help-section">
                    <h4>Need Help?</h4>
                    <div class="help-links">
                        <a href="#" id="show-token-help" class="help-link">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            How to get your access token
                        </a>
                        <a href="#" id="show-security-info" class="help-link">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                            Security information
                        </a>
                    </div>
                </div>
                
                <!-- Help Modals -->
                <div id="token-help-modal" class="help-modal" style="display: none;">
                    <div class="help-content">
                        <h3>How to Get Your Canvas Access Token</h3>
                        <div class="help-steps">
                            <div class="help-step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h4>Log into Canvas</h4>
                                    <p>Go to your Canvas website and log in with your credentials.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h4>Access Settings</h4>
                                    <p>Click on your profile picture in the top-right corner, then select "Account" → "Settings".</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h4>Find Approved Integrations</h4>
                                    <p>Scroll down the settings page until you see the "Approved Integrations" section.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h4>Create New Token</h4>
                                    <p>Click the "+ New Access Token" button.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">5</div>
                                <div class="step-content">
                                    <h4>Configure Token</h4>
                                    <p>Enter "BusyBob Integration" as the description and set expiration to "Never" or choose a date.</p>
                                </div>
                            </div>
                            <div class="help-step">
                                <div class="step-number">6</div>
                                <div class="step-content">
                                    <h4>Copy Token</h4>
                                    <p>Click "Generate Token" and immediately copy the generated token. You won't be able to see it again!</p>
                                </div>
                            </div>
                        </div>
                        <button id="close-token-help" class="btn btn-secondary">Close</button>
                    </div>
                </div>

                <div id="security-info-modal" class="help-modal" style="display: none;">
                    <div class="help-content">
                        <h3>Security Information</h3>
                        <div class="security-info">
                            <div class="security-item">
                                <h4>🔒 Secure Storage</h4>
                                <p>Your Canvas credentials are encrypted and stored securely in our database. We never store your actual Canvas password.</p>
                            </div>
                            <div class="security-item">
                                <h4>🎯 Limited Access</h4>
                                <p>Access tokens only grant the permissions you explicitly approve. You can revoke access at any time from your Canvas settings.</p>
                            </div>
                            <div class="security-item">
                                <h4>🔄 Token Management</h4>
                                <p>You can update or remove your Canvas connection at any time from the Settings page. Old tokens are automatically invalidated.</p>
                            </div>
                            <div class="security-item">
                                <h4>📊 Data Usage</h4>
                                <p>BusyBob only accesses your course data, assignments, and grades to display them in your dashboard. We don't share or sell your data.</p>
                            </div>
                        </div>
                        <button id="close-security-info" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCanvasContent() {
        const container = document.getElementById('canvas-container');
        container.innerHTML = `
            <div class="canvas-content">
                <div class="canvas-header">
                    <h2>Canvas Dashboard</h2>
                    <button id="refresh-canvas" class="btn btn-secondary">Refresh</button>
                </div>
                
                <div class="canvas-tabs">
                    <button class="tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                        Dashboard
                    </button>
                    <button class="tab-btn ${this.activeTab === 'courses' ? 'active' : ''}" data-tab="courses">
                        Courses
                    </button>
                    <button class="tab-btn ${this.activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">
                        Upcoming
                    </button>
                    <button class="tab-btn ${this.activeTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
                        Calendar
                    </button>
                </div>
                
                <div class="canvas-tab-content">
                    ${this.renderActiveTab()}
                </div>
            </div>
        `;
    }

    renderActiveTab() {
        switch (this.activeTab) {
            case 'dashboard':
                return this.renderDashboardTab();
            case 'courses':
                return this.renderCoursesTab();
            case 'assignments':
                return this.renderAssignmentsTab();
            case 'calendar':
                return this.renderCalendarTab();
            default:
                return this.renderDashboardTab();
        }
    }

    renderDashboardTab() {
        if (!this.dashboard) {
            return this.renderDataNotFound('dashboard');
        }

        return `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Active Courses (${this.dashboard.courses?.length || 0})</h3>
                    <div class="course-list">
                        ${this.dashboard.courses?.map(course => `
                            <div class="course-item">
                                <span class="course-name">${course.name}</span>
                                <span class="course-code">${course.course_code}</span>
                            </div>
                        `).join('') || 'No active courses'}
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <h3>Upcoming Assignments (${this.dashboard.upcoming_assignments?.length || 0})</h3>
                    <div class="assignment-list">
                        ${this.dashboard.upcoming_assignments?.slice(0, 5).map(assignment => `
                            <div class="assignment-item">
                                <span class="assignment-name">${assignment.name}</span>
                                <span class="assignment-course">${assignment.course_name}</span>
                                <span class="assignment-due">${new Date(assignment.due_at).toLocaleDateString()}</span>
                            </div>
                        `).join('') || 'No upcoming assignments'}
                    </div>
                </div>
            </div>
        `;
    }

    renderCoursesTab() {
        if (!this.courses?.courses) {
            return this.renderDataNotFound('courses');
        }

        return `
            <div class="courses-grid">
                ${this.courses.courses.map(course => `
                    <div class="course-card" data-course-id="${course.id}">
                        <div class="course-header">
                            <h3>${course.name}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-details">
                            <p><strong>Status:</strong> ${course.enrollment_state}</p>
                            <p><strong>Students:</strong> ${course.total_students || 'N/A'}</p>
                            <p><strong>Needs Grading:</strong> ${course.needs_grading_count || 0}</p>
                        </div>
                        <button class="btn btn-primary view-course-btn" data-course-id="${course.id}">
                            View Details
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAssignmentsTab() {
        if (!this.upcomingAssignments?.upcoming_assignments) {
            return this.renderDataNotFound('assignments');
        }

        return `
            <div class="assignments-list">
                ${this.upcomingAssignments.upcoming_assignments.map(assignment => `
                    <div class="assignment-card">
                        <div class="assignment-header">
                            <h3>${assignment.name}</h3>
                            <span class="assignment-course">${assignment.course_name}</span>
                        </div>
                        <div class="assignment-details">
                            <p><strong>Due:</strong> ${new Date(assignment.due_at).toLocaleString()}</p>
                            <p><strong>Points:</strong> ${assignment.points_possible}</p>
                            <p><strong>Type:</strong> ${assignment.submission_types?.join(', ') || 'N/A'}</p>
                        </div>
                        <a href="${assignment.html_url}" target="_blank" class="btn btn-primary">
                            View in Canvas
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCalendarTab() {
        if (!this.calendarEvents?.events) {
            return this.renderDataNotFound('calendar events');
        }

        return `
            <div class="calendar-list">
                ${this.calendarEvents.events.slice(0, 10).map(event => `
                    <div class="calendar-event">
                        <div class="event-header">
                            <h3>${event.title}</h3>
                            <span class="event-date">${new Date(event.start_at).toLocaleDateString()}</span>
                        </div>
                        <div class="event-details">
                            ${event.description ? `<p>${event.description}</p>` : ''}
                            ${event.location_name ? `<p><strong>Location:</strong> ${event.location_name}</p>` : ''}
                        </div>
                        <a href="${event.html_url}" target="_blank" class="btn btn-secondary">
                            View in Canvas
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDataNotFound(item) {
        return `
            <div class="data-not-found">
                <p>No ${item} data available.</p>
            </div>
        `;
    }

    setupEventListeners() {
        if (!this.isConnected) {
            this.setupConnectionEventListeners();
        } else {
            this.setupCanvasEventListeners();
        }
    }

    setupConnectionEventListeners() {
        // Step navigation
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');
        const connectButton = document.getElementById('connect-canvas-btn');
        
        // Help modal elements
        const tokenHelpLink = document.getElementById('show-token-help');
        const tokenHelpModal = document.getElementById('token-help-modal');
        const closeTokenHelp = document.getElementById('close-token-help');
        
        const securityInfoLink = document.getElementById('show-security-info');
        const securityInfoModal = document.getElementById('security-info-modal');
        const closeSecurityInfo = document.getElementById('close-security-info');

        // Step navigation
        nextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentStep = parseInt(btn.closest('.step').dataset.step);
                const nextStep = parseInt(btn.dataset.next);
                
                // Validate current step before proceeding
                if (currentStep === 1) {
                    const canvasLoginUrl = document.getElementById('canvas-login-url').value.trim();
                    
                    if (!canvasLoginUrl) {
                        this.showMessage('Please enter your Canvas login URL.', 'error');
                        return;
                    }
                    if (!this.isValidCanvasUrl(canvasLoginUrl)) {
                        this.showMessage('Please enter a valid Canvas login URL.', 'error');
                        return;
                    }
                    
                    // Extract base URL and create settings link
                    const baseUrl = this.extractBaseUrl(canvasLoginUrl);
                    const settingsLink = `${baseUrl}/profile/settings#:~:text=Approved%20Integrations`;
                    
                    // Update summary and display
                    document.getElementById('summary-url').textContent = baseUrl;
                    document.getElementById('display-canvas-url').textContent = baseUrl;
                    document.getElementById('display-canvas-link').textContent = settingsLink;
                    
                    // Update Canvas settings link
                    const settingsLinkElement = document.getElementById('open-canvas-settings');
                    if (settingsLinkElement) {
                        settingsLinkElement.href = settingsLink;
                    }
                } else if (currentStep === 2) {
                    const accessToken = document.getElementById('canvas-token').value.trim();
                    if (!accessToken) {
                        this.showMessage('Please enter your access token.', 'error');
                        return;
                    }
                }
                
                this.showStep(nextStep);
            });
        });

        // Real-time URL processing
        const loginUrlInput = document.getElementById('canvas-login-url');
        if (loginUrlInput) {
            loginUrlInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (url && this.isValidCanvasUrl(url)) {
                    const baseUrl = this.extractBaseUrl(url);
                    const settingsLink = `${baseUrl}/profile/settings#:~:text=Approved%20Integrations`;
                    
                    // Show the extracted displays
                    document.querySelector('.extracted-url-display').style.display = 'flex';
                    document.querySelector('.settings-link-display').style.display = 'flex';
                    
                    // Update the displays
                    document.getElementById('extracted-canvas-url').textContent = baseUrl;
                    document.getElementById('settings-link').textContent = settingsLink;
                } else {
                    // Hide the displays if URL is invalid
                    document.querySelector('.extracted-url-display').style.display = 'none';
                    document.querySelector('.settings-link-display').style.display = 'none';
                }
            });
        }

        prevButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const prevStep = parseInt(btn.dataset.prev);
                this.showStep(prevStep);
            });
        });

        // Connection button
        if (connectButton) {
            connectButton.addEventListener('click', (e) => this.handleConnection(e));
        }

        // Help modals
        if (tokenHelpLink) {
            tokenHelpLink.addEventListener('click', (e) => {
                e.preventDefault();
                tokenHelpModal.style.display = 'block';
            });
        }

        if (closeTokenHelp) {
            closeTokenHelp.addEventListener('click', () => {
                tokenHelpModal.style.display = 'none';
            });
        }

        if (securityInfoLink) {
            securityInfoLink.addEventListener('click', (e) => {
                e.preventDefault();
                securityInfoModal.style.display = 'block';
            });
        }

        if (closeSecurityInfo) {
            closeSecurityInfo.addEventListener('click', () => {
                securityInfoModal.style.display = 'none';
            });
        }

        // Close modals when clicking outside
        [tokenHelpModal, securityInfoModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }

    showStep(stepNumber) {
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === stepNumber);
        });
    }

    isValidCanvasUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        } catch {
            // If URL parsing fails, check if it looks like a URL
            return /^https?:\/\/.+/.test(url);
        }
    }

    isValidCanvasLink(link) {
        try {
            const urlObj = new URL(link);
            return urlObj.protocol === 'https:' && 
                   (urlObj.hostname.includes('instructure.com') || 
                    urlObj.hostname.includes('canvas') ||
                    urlObj.hostname.includes('edu'));
        } catch {
            return false;
        }
    }

    setupCanvasEventListeners() {
        const refreshBtn = document.getElementById('refresh-canvas');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const viewCourseBtns = document.querySelectorAll('.view-course-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.activeTab = e.target.dataset.tab;
                this.updateTabs();
                this.render();
            });
        });

        viewCourseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.target.dataset.courseId;
                this.viewCourseDetails(courseId);
            });
        });
    }

    updateTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
        });
    }

    async handleConnection(e) {
        e.preventDefault();
        
        const canvasLoginUrl = document.getElementById('canvas-login-url').value.trim();
        const accessToken = document.getElementById('canvas-token').value.trim();

        if (!canvasLoginUrl || !accessToken) {
            this.showMessage('Please fill in all fields.', 'error');
            return;
        }

        if (!this.isValidCanvasUrl(canvasLoginUrl)) {
            this.showMessage('Please enter a valid Canvas login URL.', 'error');
            return;
        }

        try {
            // Show loading state
            const connectBtn = document.getElementById('connect-canvas-btn');
            const btnText = connectBtn.querySelector('.btn-text');
            const btnLoading = connectBtn.querySelector('.btn-loading');
            
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            connectBtn.disabled = true;

            this.showMessage('Connecting to Canvas...', 'info');
            
            // Extract base URL from login URL
            const baseUrl = this.extractBaseUrl(canvasLoginUrl);
            await this.storeCredentials(baseUrl, accessToken);
            
            this.canvasUrl = baseUrl;
            this.accessToken = accessToken;
            this.isConnected = true;
            
            await this.loadAllData();
            
            this.showMessage('Successfully connected to Canvas!', 'success');
        } catch (error) {
            console.error('Connection failed:', error);
            this.showMessage(`Connection failed: ${error.message}`, 'error');
            
            // Reset button state
            const connectBtn = document.getElementById('connect-canvas-btn');
            const btnText = connectBtn.querySelector('.btn-text');
            const btnLoading = connectBtn.querySelector('.btn-loading');
            
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            connectBtn.disabled = false;
        }
    }

    async viewCourseDetails(courseId) {
        try {
            this.showMessage('Loading course details...', 'info');
            const details = await this.loadCourseDetails(courseId);
            
            // Create a modal to display course details
            this.showCourseModal(courseId, details);
        } catch (error) {
            console.error('Failed to load course details:', error);
            this.showMessage(`Failed to load course details: ${error.message}`, 'error');
        }
    }

    showCourseModal(courseId, details) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Course Details</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="course-tabs">
                        <button class="course-tab active" data-tab="assignments">Assignments</button>
                        <button class="course-tab" data-tab="discussions">Discussions</button>
                        <button class="course-tab" data-tab="announcements">Announcements</button>
                    </div>
                    <div class="course-tab-content">
                        ${this.renderCourseAssignments(details.assignments, details.submissions)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal event listeners
        const closeBtn = modal.querySelector('.close');
        const tabBtns = modal.querySelectorAll('.course-tab');

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.updateCourseModalTab(modal, tab, details);
            });
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    renderCourseAssignments(assignments, submissions) {
        if (!assignments?.assignments) {
            return '<p>No assignments found.</p>';
        }

        return `
            <div class="assignments-list">
                ${assignments.assignments.map(assignment => {
                    const submission = submissions?.submissions?.find(s => s.assignment_id === assignment.id);
                    return `
                        <div class="assignment-item">
                            <h3>${assignment.name}</h3>
                            <p><strong>Due:</strong> ${assignment.due_at ? new Date(assignment.due_at).toLocaleString() : 'No due date'}</p>
                            <p><strong>Points:</strong> ${assignment.points_possible}</p>
                            ${submission ? `
                                <p><strong>Status:</strong> ${submission.workflow_state}</p>
                                ${submission.score ? `<p><strong>Score:</strong> ${submission.score}/${assignment.points_possible}</p>` : ''}
                            ` : '<p><strong>Status:</strong> Not submitted</p>'}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateCourseModalTab(modal, tab, details) {
        const tabBtns = modal.querySelectorAll('.course-tab');
        const content = modal.querySelector('.course-tab-content');

        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        switch (tab) {
            case 'assignments':
                content.innerHTML = this.renderCourseAssignments(details.assignments, details.submissions);
                break;
            case 'discussions':
                content.innerHTML = this.renderCourseDiscussions(details.discussions);
                break;
            case 'announcements':
                content.innerHTML = this.renderCourseAnnouncements(details.announcements);
                break;
        }
    }

    renderCourseDiscussions(discussions) {
        if (!discussions?.discussions) {
            return '<p>No discussions found.</p>';
        }

        return `
            <div class="discussions-list">
                ${discussions.discussions.map(discussion => `
                    <div class="discussion-item">
                        <h3>${discussion.title}</h3>
                        <p><strong>Author:</strong> ${discussion.author?.display_name || 'Unknown'}</p>
                        <p><strong>Created:</strong> ${new Date(discussion.created_at).toLocaleString()}</p>
                        <p><strong>Replies:</strong> ${discussion.discussion_subentry_count}</p>
                        <a href="${discussion.html_url}" target="_blank" class="btn btn-primary">View Discussion</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCourseAnnouncements(announcements) {
        if (!announcements?.announcements) {
            return '<p>No announcements found.</p>';
        }

        return `
            <div class="announcements-list">
                ${announcements.announcements.map(announcement => `
                    <div class="announcement-item">
                        <h3>${announcement.title}</h3>
                        <p><strong>Author:</strong> ${announcement.author?.display_name || 'Unknown'}</p>
                        <p><strong>Posted:</strong> ${new Date(announcement.created_at).toLocaleString()}</p>
                        <div class="announcement-message">${announcement.message}</div>
                        <a href="${announcement.html_url}" target="_blank" class="btn btn-primary">View Announcement</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async refreshData() {
        this.showMessage('Refreshing Canvas data...', 'info');
        await this.loadAllData();
        this.showMessage('Canvas data refreshed.', 'success');
    }

    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    extractBaseUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            // If URL parsing fails, try to extract domain manually
            const match = url.match(/^https?:\/\/([^\/]+)/);
            if (match) {
                return `https://${match[1]}`;
            }
            return url; // Return original if we can't parse it
        }
    }
} 