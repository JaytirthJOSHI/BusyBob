import { auth, supabase } from '../lib/supabase.js'
import districts from '../lib/districts.js'

export class Settings {
    constructor() {
        this.studentVueConnected = false
        this.studentVueCredentials = null
        this.canvasConnected = false
        this.canvasCredentials = null
    }

    async init() {
        console.log('Initializing Settings component...')
        await this.loadConnectedAccounts()
        this.render()
        this.setupEventListeners()
    }

    async loadConnectedAccounts() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            // Check for StudentVue
            const { data: studentVueData } = await supabase
                .from('studentvue_credentials')
                .select('district_url, username')
                .eq('user_id', user.id)
                .single()

            this.studentVueConnected = !!studentVueData
            if (studentVueData) {
                this.studentVueCredentials = {
                    districtUrl: studentVueData.district_url,
                    username: studentVueData.username
                }
            }

            // Check for Canvas
            const { data: canvasData } = await supabase
                .from('canvas_credentials')
                .select('canvas_url')
                .eq('user_id', user.id)
                .single()

            this.canvasConnected = !!canvasData
            if (canvasData) {
                this.canvasCredentials = {
                    canvasUrl: canvasData.canvas_url
                }
            }

        } catch (error) {
            // It's normal for queries to fail if no record is found (PGRST116), so we can often ignore those.
            if (error.code !== 'PGRST116') {
                console.error('Error loading connected accounts:', error)
            }
        }
    }

    render() {
        const container = document.getElementById('settings-container')
        if (!container) return

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                    <p class="text-gray-600 dark:text-gray-400">Manage your account and connected services</p>
                </div>

                <!-- Account Information -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                                    <p class="text-gray-900 dark:text-white" id="user-email">Loading...</p>
                                </div>
                                <button class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                    Change
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Password</p>
                                    <p class="text-gray-900 dark:text-white">••••••••</p>
                                </div>
                                <button class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                    Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Connected Accounts -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connected Accounts</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">Connect your accounts to sync data and enhance your experience.</p>
                        
                        <!-- StudentVue Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderStudentVueConnection()}
                        </div>

                        <!-- Canvas Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderCanvasConnection()}
                        </div>

                        <!-- More connected accounts can be added here -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 opacity-50">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-medium text-gray-900 dark:text-white">More Integrations</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Coming soon - more integrations will be available</p>
                                    </div>
                                </div>
                                <button class="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button id="settings-theme-toggle" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <svg class="w-6 h-6 text-gray-800 dark:text-gray-200 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                        </svg>
                                        <svg class="w-6 h-6 text-gray-800 dark:text-gray-200 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Timezone</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Select your local timezone</p>
                                </div>
                                <select id="timezone-selector" class="form-input mt-1 block w-full max-w-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                                    <option>Loading timezones...</option>
                                </select>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Show Grades Tab</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Show or hide the Grades tab in the navigation bar</p>
                                </div>
                                <button id="grades-tab-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Manage your notification preferences</p>
                                </div>
                                <button class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                    Configure
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
                                </div>
                                <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderStudentVueConnection() {
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">StudentVue</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${this.studentVueConnected ? `Connected as: ${this.studentVueCredentials.username}` : 'Connect your school account.'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${this.studentVueConnected ? `
                        <button id="disconnect-studentvue" class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">Disconnect</button>
                    ` : `
                        <button id="connect-studentvue" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Connect</button>
                    `}
                </div>
            </div>
        `;
    }

    renderCanvasConnection() {
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m14-2v-2a4 4 0 00-4-4h-1m-4 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">Canvas LMS</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${this.canvasConnected ? `Connected to: ${this.canvasCredentials.canvasUrl}` : 'Connect your Canvas account.'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${this.canvasConnected ? `
                        <button id="disconnect-canvas" class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">Disconnect</button>
                    ` : `
                        <button id="connect-canvas" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Connect</button>
                    `}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const container = document.getElementById('settings-container')
        if (!container) return

        container.addEventListener('click', (event) => {
            if (event.target.id === 'connect-studentvue') this.showStudentVueConnectionModal();
            if (event.target.id === 'disconnect-studentvue') this.disconnectStudentVue();
            if (event.target.id === 'connect-canvas') this.showCanvasConnectionModal();
            if (event.target.id === 'disconnect-canvas') this.disconnectCanvas();
        });

        // Load user email
        this.loadUserEmail()

        // Theme toggle
        const themeToggle = container.querySelector('#settings-theme-toggle')
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark')
                const isDark = document.documentElement.classList.contains('dark')
                localStorage.setItem('theme', isDark ? 'dark' : 'light')
            })
        }

        // Timezone selector
        const timezoneSelector = container.querySelector('#timezone-selector');
        if (timezoneSelector) {
            timezoneSelector.addEventListener('change', (e) => {
                localStorage.setItem('timezone', e.target.value);
                // Optionally, dispatch an event to notify the clock to update immediately
                window.dispatchEvent(new Event('timezoneChange'));
            });
        }

        // Grades tab toggle
        const gradesTabToggle = container.querySelector('#grades-tab-toggle');
        if (gradesTabToggle) {
            this.updateGradesToggleVisual();
            gradesTabToggle.addEventListener('click', () => {
                const isEnabled = localStorage.getItem('showGradesTab') !== 'false';
                localStorage.setItem('showGradesTab', !isEnabled);
                this.updateGradesToggleVisual();
                window.dispatchEvent(new Event('settingsChange'));
            });
        }
    }

    async loadUserEmail() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (user) {
                const emailElement = document.getElementById('user-email')
                if (emailElement) {
                    emailElement.textContent = user.email
                }
            }
        } catch (error) {
            console.error('Error loading user email:', error)
        }
    }

    showStudentVueConnectionModal() {
        const modalId = 'studentvue-modal';
        if (document.getElementById(modalId)) return;

        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Connect to StudentVue</h2>
                        <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-white">&times;</button>
                    </div>
                    <form id="studentvue-connection-form">
                        <div class="space-y-4">
                            <div>
                                <label for="district-search" class="block text-sm font-medium text-gray-700 dark:text-gray-300">School District</label>
                                <input type="text" id="district-search" placeholder="Search for your district..." class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600">
                                <input type="hidden" id="district-url">
                                <div id="district-results" class="mt-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto"></div>
                            </div>
                            <div>
                                <label for="studentvue-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <input type="text" id="studentvue-username" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600">
                            </div>
                            <div>
                                <label for="studentvue-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input type="password" id="studentvue-password" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600">
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Connect</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById(modalId);
        modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.remove());
        this.setupDistrictSearch(modal);
        modal.querySelector('#studentvue-connection-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStudentVueConnection(e.target, modal);
        });
    }
    
    setupDistrictSearch(modal) {
        const searchInput = modal.querySelector('#district-search');
        const urlInput = modal.querySelector('#district-url');
        const resultsContainer = modal.querySelector('#district-results');

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            resultsContainer.innerHTML = '';
            if (query.length < 3) return;

            const filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(query));
            
            filteredDistricts.forEach(d => {
                const div = document.createElement('div');
                div.textContent = d.name;
                div.className = 'p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700';
                div.onclick = () => {
                    searchInput.value = d.name;
                    urlInput.value = d.url;
                    resultsContainer.innerHTML = '';
                };
                resultsContainer.appendChild(div);
            });
        });
    }

    async handleStudentVueConnection(form, modal) {
        const districtUrl = form.querySelector('#district-url').value;
        const username = form.querySelector('#studentvue-username').value;
        const password = form.querySelector('#studentvue-password').value;
        const connectBtn = form.querySelector('button[type="submit"]');

        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';

        try {
            const { data: { user } } = await auth.getCurrentUser();
            if (!user) throw new Error("User not authenticated.");

            const { error } = await supabase.from('studentvue_credentials').upsert({
                user_id: user.id,
                district_url: districtUrl,
                username: username,
                password: password,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            if (error) throw error;
            this.showMessage('StudentVue connected successfully!', 'success');
            modal.remove();
            this.init();
        } catch (error) {
            this.showMessage(`Failed to connect StudentVue: ${error.message}`, 'error');
            connectBtn.disabled = false;
            connectBtn.textContent = 'Connect';
        }
    }

    async disconnectStudentVue() {
        if (!confirm('Are you sure you want to disconnect your StudentVue account?')) return;
        try {
            const { data: { user } } = await auth.getCurrentUser();
            if (!user) throw new Error("User not authenticated.");
            const { error } = await supabase.from('studentvue_credentials').delete().eq('user_id', user.id);
            if (error) throw error;
            this.showMessage('StudentVue disconnected successfully.', 'success');
            this.init();
        } catch (error) {
            this.showMessage(`Failed to disconnect StudentVue: ${error.message}`, 'error');
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div')
        messageEl.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`
        messageEl.textContent = message
        
        document.body.appendChild(messageEl)
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl)
            }
        }, 3000)
    }

    updateGradesToggleVisual() {
        const gradesTabToggle = document.getElementById('grades-tab-toggle');
        if (!gradesTabToggle) return;

        const isEnabled = localStorage.getItem('showGradesTab') !== 'false';
        const slider = gradesTabToggle.querySelector('span');

        if (isEnabled) {
            gradesTabToggle.classList.add('bg-blue-600');
            gradesTabToggle.classList.remove('bg-gray-200');
            slider.classList.add('translate-x-6');
            slider.classList.remove('translate-x-1');
        } else {
            gradesTabToggle.classList.add('bg-gray-200');
            gradesTabToggle.classList.remove('bg-blue-600');
            slider.classList.add('translate-x-1');
            slider.classList.remove('translate-x-6');
        }
    }

    async loadTimezones() {
        const selector = document.getElementById('timezone-selector');
        if (!selector) return;

        try {
            const response = await fetch('http://worldtimeapi.org/api/timezone');
            if (!response.ok) throw new Error('Failed to fetch timezones');
            
            const timezones = await response.json();
            const savedTimezone = localStorage.getItem('timezone');

            selector.innerHTML = timezones.map(tz => {
                const isSelected = tz === savedTimezone ? 'selected' : '';
                return `<option value="${tz}" ${isSelected}>${tz.replace(/_/g, ' ')}</option>`;
            }).join('');

        } catch (error) {
            console.error('Error loading timezones:', error);
            selector.innerHTML = '<option>Could not load timezones</option>';
        }
    }

    showCanvasConnectionModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all duration-300 scale-95 opacity-0" id="canvas-modal-content">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Connect to Canvas</h2>
                    <button id="close-canvas-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="canvas-connection-form">
                    <!-- Step 1: Get URL -->
                    <div id="canvas-step-1" class="step active">
                        <p class="text-gray-600 dark:text-gray-400 mb-6">First, enter any URL from your Canvas instance, like a link to a course or your dashboard.</p>
                        <div class="form-group">
                            <label for="canvas-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canvas URL</label>
                            <input type="url" id="canvas-url" name="canvas_url" required
                                   placeholder="https://yourschool.instructure.com/courses/123"
                                   class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button type="button" id="canvas-next-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                Next
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: Get Token -->
                    <div id="canvas-step-2" class="step" style="display: none;">
                        <p class="text-gray-600 dark:text-gray-400 mb-4">Great! Now, open the link below to generate an access token.</p>
                        <div class="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                             <a href="#" id="generated-settings-link" target="_blank" class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline break-all">
                                 Your settings link will appear here
                             </a>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Click "+ New Access Token", give it a name like "BusyBob", and <strong class="text-gray-800 dark:text-gray-200">leave the expiration date blank</strong>. Then, copy the token and paste it below.</p>
                        <div class="form-group">
                            <label for="canvas-token" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token</label>
                            <input type="password" id="canvas-token" name="access_token" required
                                   autocomplete="new-password"
                                   placeholder="Paste your generated token here"
                                   class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                        </div>
                         <div class="mt-6 flex justify-between items-center">
                            <button type="button" id="canvas-back-btn" class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline">Back</button>
                            <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                Connect
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate modal in
        setTimeout(() => {
            document.getElementById('canvas-modal-content')?.classList.remove('scale-95', 'opacity-0');
        }, 10);

        // Event listeners
        const step1 = modal.querySelector('#canvas-step-1');
        const step2 = modal.querySelector('#canvas-step-2');

        modal.querySelector('#close-canvas-modal').addEventListener('click', () => modal.remove());

        modal.querySelector('#canvas-next-btn').addEventListener('click', () => {
            const canvasUrlInput = modal.querySelector('#canvas-url');
            const url = canvasUrlInput.value.trim();
            if (!url) {
                this.showMessage('Please enter a Canvas URL.', 'error');
                return;
            }
            try {
                const baseUrl = this.extractBaseUrl(url);
                const settingsLink = `${baseUrl}/profile/settings#:~:text=Approved%20Integrations`;
                modal.querySelector('#generated-settings-link').href = settingsLink;
                modal.querySelector('#generated-settings-link').textContent = settingsLink;

                step1.style.display = 'none';
                step2.style.display = 'block';
            } catch (e) {
                this.showMessage('Please enter a valid Canvas URL.', 'error');
            }
        });

        modal.querySelector('#canvas-back-btn').addEventListener('click', () => {
            step2.style.display = 'none';
            step1.style.display = 'block';
        });

        modal.querySelector('#canvas-connection-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCanvasConnection(e.target, modal);
        });
    }

    async handleCanvasConnection(form, modal) {
        const formData = new FormData(form)
        const canvasUrl = formData.get('canvas_url')
        const accessToken = formData.get('access_token')

        if (!canvasUrl || !accessToken) {
            this.showMessage('Please provide both a Canvas URL and an access token.', 'error')
            return
        }

        try {
            const baseUrl = this.extractBaseUrl(canvasUrl)
            const { data: { user } } = await auth.getCurrentUser()

            const { error } = await supabase.from('canvas_credentials').upsert({
                user_id: user.id,
                canvas_url: baseUrl, // This is now correct
                access_token: accessToken
            })

            if (error) throw error

            this.showMessage('Successfully connected to Canvas!', 'success')
            this.loadConnectedAccounts().then(() => this.render()) // Reload and re-render
            modal.remove()

        } catch (error) {
            console.error('Error connecting to Canvas:', error)
            this.showMessage(`Connection failed: ${error.message}`, 'error')
        }
    }

    async disconnectCanvas() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { error } = await supabase
                .from('canvas_credentials')
                .delete()
                .eq('user_id', user.id)
            
            if (error) throw error

            this.showMessage('Disconnected from Canvas.', 'info')
            this.loadConnectedAccounts().then(() => this.render()) // Reload and re-render

        } catch (error) {
            console.error('Error disconnecting from Canvas:', error)
            this.showMessage(`Disconnection failed: ${error.message}`, 'error')
        }
    }

    extractBaseUrl(url) {
        const match = url.match(/https?:\/\/[^/]+/);
        if (match) {
            return match[0];
        }
        throw new Error('Invalid URL format');
    }
}

