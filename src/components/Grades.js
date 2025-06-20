import { auth, db } from '../lib/supabase.js'

export class Grades {
    constructor() {
        this.studentVueClient = null
        this.grades = []
        this.assignments = []
        this.isConnected = false
        this.districtUrl = ''
        this.username = ''
        this.password = ''
    }

    async init() {
        console.log('📊 Initializing Grades component...')
        
        // Check if user has StudentVue credentials stored
        const storedCredentials = await this.getStoredCredentials()
        if (storedCredentials) {
            this.districtUrl = storedCredentials.districtUrl
            this.username = storedCredentials.username
            this.password = storedCredentials.password
            await this.connect()
        }
        
        this.render()
        this.setupEventListeners()
    }

    async getStoredCredentials() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return null
            
            const { data, error } = await db.from('studentvue_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()
            
            if (error || !data) return null
            
            return {
                districtUrl: data.district_url,
                username: data.username,
                password: data.password
            }
        } catch (error) {
            console.error('Error fetching stored credentials:', error)
            return null
        }
    }

    async storeCredentials(districtUrl, username, password) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')
            
            const { error } = await db.from('studentvue_credentials')
                .upsert({
                    user_id: user.id,
                    district_url: districtUrl,
                    username: username,
                    password: password,
                    updated_at: new Date().toISOString()
                })
            
            if (error) throw error
            
            console.log('✅ Credentials stored successfully')
        } catch (error) {
            console.error('Error storing credentials:', error)
            throw error
        }
    }

    async connect() {
        try {
            console.log('🔗 Connecting to StudentVue...')
            
            const StudentVue = await import('studentvue.js')
            
            this.studentVueClient = await StudentVue.login(
                this.districtUrl,
                this.username,
                this.password
            )
            
            this.isConnected = true
            console.log('✅ Connected to StudentVue successfully')
            
            await this.loadGrades()
            await this.loadAssignments()
            
            return true
        } catch (error) {
            console.error('❌ Failed to connect to StudentVue:', error)
            this.isConnected = false
            throw error
        }
    }

    async loadGrades() {
        try {
            if (!this.studentVueClient) return
            
            const gradebook = await this.studentVueClient.getGradebook()
            this.grades = this.parseGradebook(gradebook)
            console.log('📊 Grades loaded:', this.grades)
        } catch (error) {
            console.error('Error loading grades:', error)
            throw error
        }
    }

    async loadAssignments() {
        try {
            if (!this.studentVueClient) return
            
            const calendar = await this.studentVueClient.getCalendar()
            this.assignments = this.parseAssignments(calendar)
            console.log('📝 Assignments loaded:', this.assignments)
        } catch (error) {
            console.error('Error loading assignments:', error)
            throw error
        }
    }

    parseGradebook(gradebook) {
        const grades = []
        
        try {
            if (gradebook && gradebook.Gradebook) {
                const courses = gradebook.Gradebook.Courses?.Course || []
                
                courses.forEach(course => {
                    const courseData = {
                        name: course.Title || 'Unknown Course',
                        teacher: course.Teacher || 'Unknown Teacher',
                        period: course.Period || '',
                        grade: course.Marks?.Mark?.[0]?.CalculatedScoreString || 'N/A',
                        percentage: course.Marks?.Mark?.[0]?.CalculatedScoreRaw || 0,
                        assignments: []
                    }
                    
                    if (course.Assignments?.Assignment) {
                        const assignments = Array.isArray(course.Assignments.Assignment) 
                            ? course.Assignments.Assignment 
                            : [course.Assignments.Assignment]
                        
                        courseData.assignments = assignments.map(assignment => ({
                            name: assignment.Name || 'Unknown Assignment',
                            score: assignment.Score || 'N/A',
                            maxScore: assignment.MaxScore || 'N/A',
                            dueDate: assignment.DueDate || '',
                            category: assignment.Category || 'General'
                        }))
                    }
                    
                    grades.push(courseData)
                })
            }
        } catch (error) {
            console.error('Error parsing gradebook:', error)
        }
        
        return grades
    }

    parseAssignments(calendar) {
        const assignments = []
        
        try {
            if (calendar && calendar.StudentCalendar) {
                const events = calendar.StudentCalendar.Events?.Event || []
                
                events.forEach(event => {
                    if (event.Type === 'Assignment' || event.Type === 'Homework') {
                        assignments.push({
                            name: event.Title || 'Unknown Assignment',
                            dueDate: event.StartDate || '',
                            course: event.Course || 'Unknown Course',
                            description: event.Description || '',
                            type: event.Type || 'Assignment'
                        })
                    }
                })
            }
        } catch (error) {
            console.error('Error parsing assignments:', error)
        }
        
        return assignments
    }

    render() {
        const container = document.getElementById('grades-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="grades-section bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
                    <p class="font-bold">Under Development</p>
                    <p>This feature is still being tested. Some functionality may not work as expected.</p>
                </div>
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        📊 Grades & Assignments
                    </h2>
                    <div class="flex items-center space-x-2">
                        ${this.isConnected ? 
                            '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Connected</span>' :
                            '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Disconnected</span>'
                        }
                        <button id="refresh-grades" class="btn-secondary">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                ${!this.isConnected ? this.renderConnectionForm() : this.renderGradesContent()}
            </div>
        `
    }

    renderConnectionForm() {
        return `
            <div class="connection-form">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Connect to StudentVue
                    </h3>
                    <p class="text-blue-700 dark:text-blue-300 text-sm">
                        Enter your StudentVue credentials to view your grades and assignments. You can find your district URL using your ZIP code.
                    </p>
                </div>
                
                <form id="studentvue-form" class="space-y-4">
                    <div class="space-y-2 p-4 border rounded-lg dark:border-gray-700">
                        <label for="zip-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Find your district with a ZIP code
                        </label>
                        <div class="flex items-center gap-2">
                            <input type="text" id="zip-code" name="zipCode" pattern="[0-9]{5}"
                                   placeholder="e.g., 90210"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                            <button type="button" id="find-district-btn" class="btn-secondary">Find</button>
                        </div>
                        <div id="district-select-container" class="hidden mt-2">
                            <label for="district-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select your district
                            </label>
                            <select id="district-select" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                                <!-- Options will be populated here -->
                            </select>
                        </div>
                    </div>

                    <div>
                        <label for="district-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            District URL
                        </label>
                        <input type="url" id="district-url" name="districtUrl" required
                               placeholder="https://your-district.studentvue.com"
                               value="${this.districtUrl}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>
                    
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <input type="text" id="username" name="username" required
                               placeholder="Your StudentVue username"
                               value="${this.username}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input type="password" id="password" name="password" required
                               placeholder="Your StudentVue password"
                               value="${this.password}"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <button type="submit" class="btn-primary">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            Connect
                        </button>
                        <label class="flex items-center">
                            <input type="checkbox" id="save-credentials" checked
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Save credentials</span>
                        </label>
                    </div>
                </form>
            </div>
        `
    }

    renderGradesContent() {
        return `
            <div class="grades-content">
                <div class="mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-blue-100 text-sm">Current GPA</p>
                                    <p class="text-2xl font-bold">${this.calculateGPA()}</p>
                                </div>
                                <svg class="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-green-100 text-sm">Classes</p>
                                    <p class="text-2xl font-bold">${this.grades.length}</p>
                                </div>
                                <svg class="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-purple-100 text-sm">Assignments</p>
                                    <p class="text-2xl font-bold">${this.assignments.length}</p>
                                </div>
                                <svg class="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Grades</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.grades.map(course => this.renderCourseCard(course)).join('')}
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Assignments</h3>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        ${this.assignments.length > 0 ? 
                            this.assignments.map(assignment => this.renderAssignmentItem(assignment)).join('') :
                            '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming assignments found.</p>'
                        }
                    </div>
                </div>
            </div>
        `
    }

    renderCourseCard(course) {
        const gradeColor = this.getGradeColor(course.percentage)
        const gradeClass = `text-${gradeColor}-600 dark:text-${gradeColor}-400`
        
        return `
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900 dark:text-white text-sm">${course.name}</h4>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${course.period}</span>
                </div>
                
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-gray-600 dark:text-gray-400">${course.teacher}</span>
                    <span class="text-lg font-bold ${gradeClass}">${course.grade}</span>
                </div>
                
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-${gradeColor}-500 h-2 rounded-full" style="width: ${Math.min(course.percentage, 100)}%"></div>
                </div>
                
                ${course.assignments.length > 0 ? `
                    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent Assignments:</p>
                        ${course.assignments.slice(0, 3).map(assignment => `
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-gray-600 dark:text-gray-400 truncate">${assignment.name}</span>
                                <span class="text-gray-900 dark:text-white font-medium">${assignment.score}/${assignment.maxScore}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderAssignmentItem(assignment) {
        const dueDate = new Date(assignment.dueDate)
        const isOverdue = dueDate < new Date()
        const isDueSoon = dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        
        let statusClass = 'text-gray-600 dark:text-gray-400'
        if (isOverdue) statusClass = 'text-red-600 dark:text-red-400'
        else if (isDueSoon) statusClass = 'text-yellow-600 dark:text-yellow-400'
        
        return `
            <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-white text-sm">${assignment.name}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${assignment.course}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm ${statusClass} font-medium">
                        ${isOverdue ? 'Overdue' : dueDate.toLocaleDateString()}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${assignment.type}</p>
                </div>
            </div>
        `
    }

    getGradeColor(percentage) {
        if (percentage >= 90) return 'green'
        if (percentage >= 80) return 'blue'
        if (percentage >= 70) return 'yellow'
        if (percentage >= 60) return 'orange'
        return 'red'
    }

    calculateGPA() {
        if (this.grades.length === 0) return 'N/A'
        
        const totalPoints = this.grades.reduce((sum, course) => {
            const percentage = course.percentage
            if (percentage >= 90) return sum + 4.0
            if (percentage >= 80) return sum + 3.0
            if (percentage >= 70) return sum + 2.0
            if (percentage >= 60) return sum + 1.0
            return sum + 0.0
        }, 0)
        
        return (totalPoints / this.grades.length).toFixed(2)
    }

    setupEventListeners() {
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'studentvue-form') {
                e.preventDefault()
                await this.handleConnection(e.target)
            }
        })
        
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'refresh-grades') {
                await this.refreshData()
            }
            if (e.target.id === 'find-district-btn') {
                await this.handleFindDistrict()
            }
        })

        document.addEventListener('change', (e) => {
            if (e.target.id === 'district-select') {
                const districtUrlInput = document.getElementById('district-url')
                if (districtUrlInput) {
                    districtUrlInput.value = e.target.value
                }
            }
        })
    }

    async handleFindDistrict() {
        const zipCodeInput = document.getElementById('zip-code')
        const zipCode = zipCodeInput.value
        if (!/^\d{5}$/.test(zipCode)) {
            this.showMessage('Please enter a valid 5-digit ZIP code.', 'error')
            return
        }

        this.showMessage('Searching for districts...', 'info')

        try {
            const StudentVue = await import('studentvue.js')
            const districtList = await StudentVue.findDistricts(zipCode)

            const selectContainer = document.getElementById('district-select-container')
            const select = document.getElementById('district-select')

            if (districtList && districtList.length > 0) {
                select.innerHTML = '<option value="">-- Select a district --</option>'
                districtList.forEach(d => {
                    const option = document.createElement('option')
                    option.value = d.parentVueUrl
                    option.textContent = d.name
                    select.appendChild(option)
                })
                selectContainer.classList.remove('hidden')
                this.showMessage(`Found ${districtList.length} districts.`, 'success')
            } else {
                selectContainer.classList.add('hidden')
                this.showMessage('No districts found for that ZIP code.', 'warning')
            }
        } catch (error) {
            console.error('Error finding districts:', error)
            this.showMessage('Could not fetch districts. Please check the ZIP code or enter the URL manually.', 'error')
        }
    }

    async handleConnection(form) {
        try {
            const formData = new FormData(form)
            this.districtUrl = formData.get('districtUrl')
            this.username = formData.get('username')
            this.password = formData.get('password')
            const saveCredentials = form.querySelector('#save-credentials').checked
            
            if (!this.districtUrl || !this.username || !this.password) {
                this.showMessage('Please fill out all fields.', 'error')
                return
            }
            
            await this.connect()
            
            if (saveCredentials) {
                await this.storeCredentials(this.districtUrl, this.username, this.password)
            }
            
            this.render()
            this.showMessage('Successfully connected to StudentVue!', 'success')
            
        } catch (error) {
            console.error('Connection error:', error)
            this.showMessage('Failed to connect: ' + error.message, 'error')
        }
    }

    async refreshData() {
        try {
            await this.loadGrades()
            await this.loadAssignments()
            this.render()
            this.showMessage('Grades refreshed successfully!', 'success')
        } catch (error) {
            console.error('Refresh error:', error)
            this.showMessage('Failed to refresh grades: ' + error.message, 'error')
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
}