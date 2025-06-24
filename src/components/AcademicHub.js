import { auth, db, supabase } from '../lib/supabase.js'
import districts from '../lib/districts.js'
import { 
    parseGradebook, 
    parseAssignments, 
    parseAttendance, 
    parseSchedule,
    calculateGPA,
    getGradeColor 
} from '../utils/grades-parser.js'

export class AcademicHub {
    constructor() {
        // Canvas properties
        this.canvasClient = null
        this.canvasCourses = null
        this.canvasAssignments = null
        this.canvasGrades = null
        this.canvasDiscussions = null
        this.canvasAnnouncements = null
        this.canvasCalendarEvents = null
        this.canvasUpcomingAssignments = null
        this.canvasDashboard = null
        this.isCanvasConnected = false
        this.canvasUrl = ''
        this.canvasAccessToken = ''

        // StudentVue properties
        this.studentVueClient = null
        this.studentVueGrades = null
        this.studentVueAssignments = null
        this.studentVueAttendance = null
        this.studentVueSchedule = null
        this.studentVueSchoolInfo = null
        this.isStudentVueConnected = false
        this.districtUrl = ''
        this.username = ''
        this.password = ''

        // UI state
        this.activeTab = 'overview'
        this.activeSystem = 'both' // 'canvas', 'studentvue', 'both'
    }

    async init() {
        console.log('🎓 Initializing Academic Hub...')
        
        await this.loadStoredCredentials()
        
        // Only try to load data if we have actual credentials
        if ((this.isCanvasConnected && this.canvasUrl && this.canvasAccessToken) || 
            (this.isStudentVueConnected && this.districtUrl && this.username && this.password)) {
            await this.loadAllData()
        } else {
            console.log('No academic credentials found, showing connection form')
            this.render()
            this.setupEventListeners()
        }
    }

    async loadStoredCredentials() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            // Load Canvas credentials
            const { data: canvasData } = await supabase
                .from('canvas_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (canvasData && canvasData.canvas_url && canvasData.access_token) {
                this.canvasUrl = canvasData.canvas_url
                this.canvasAccessToken = canvasData.access_token
                this.isCanvasConnected = true
                console.log('Canvas credentials loaded successfully')
            } else {
                this.isCanvasConnected = false
                console.log('No valid Canvas credentials found')
            }

            // Load StudentVue credentials
            const { data: studentVueData } = await supabase
                .from('studentvue_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (studentVueData && studentVueData.district_url && studentVueData.username && studentVueData.password) {
                this.districtUrl = studentVueData.district_url
                this.username = studentVueData.username
                this.password = studentVueData.password
                this.isStudentVueConnected = true
                console.log('StudentVue credentials loaded successfully')
            } else {
                this.isStudentVueConnected = false
                console.log('No valid StudentVue credentials found')
            }

        } catch (error) {
            if (error.code !== 'PGRST116') {
                console.error('Error loading stored credentials:', error)
            }
            this.isCanvasConnected = false
            this.isStudentVueConnected = false
        }
    }

    async loadAllData() {
        this.showMessage('Loading academic data...', 'info')

        const dataPromises = []

        if (this.isCanvasConnected) {
            dataPromises.push(
                this.loadCanvasDashboard(),
                this.loadCanvasCourses(),
                this.loadCanvasAssignments(),
                this.loadCanvasGrades(),
                this.loadCanvasUpcomingAssignments(),
                this.loadCanvasCalendarEvents(),
                this.loadCanvasDiscussions(),
                this.loadCanvasAnnouncements()
            )
        }

        if (this.isStudentVueConnected && this.districtUrl && this.username && this.password) {
            dataPromises.push(
                this.loadStudentVueGrades(),
                this.loadStudentVueAssignments(),
                this.loadStudentVueAttendance(),
                this.loadStudentVueSchedule(),
                this.loadStudentVueSchoolInfo()
            )
        }

        if (dataPromises.length === 0) {
            this.render()
            this.setupEventListeners()
            return
        }

        await Promise.all(dataPromises.map(p => p.catch(e => {
            console.error('Data loading failed for one of the items:', e)
            return e
        })))

        this.render()
        this.setupEventListeners()
        this.showMessage('Academic data loaded successfully.', 'success')
    }

    // Canvas data loading methods
    async fetchCanvasData(endpoint, params = {}, retries = 3) {
        if (!this.canvasUrl || !this.canvasAccessToken) {
            throw new Error('Canvas credentials are not set.')
        }
        
        // Additional validation
        if (!this.isCanvasConnected) {
            throw new Error('Canvas is not connected.')
        }
        
        const { data: { user } } = await auth.getCurrentUser()
        if (!user) {
            throw new Error('User not authenticated')
        }
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`/api/canvas/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        canvasToken: this.canvasAccessToken,
                        canvasDomain: this.canvasUrl,
                        ...params
                    }),
                })

                if (!response.ok) {
                    let errorMessage = `Request failed with status ${response.status}`
                    try {
                        const errorBody = await response.json()
                        errorMessage = errorBody.error || errorBody.message || errorMessage
                    } catch (e) {
                        errorMessage = response.statusText || errorMessage
                    }
                    
                    if (attempt === retries) {
                        throw new Error(errorMessage)
                    }
                    
                    console.log(`Attempt ${attempt} failed for ${endpoint}, retrying in ${attempt * 1000}ms...`)
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000))
                    continue
                }

                const data = await response.json()
                return data
            } catch (error) {
                if (attempt === retries) {
                    console.error(`Canvas API error for ${endpoint}:`, error)
                    throw error
                }
                
                console.log(`Attempt ${attempt} failed for ${endpoint}, retrying in ${attempt * 1000}ms...`)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000))
            }
        }
    }

    async loadCanvasDashboard() {
        try {
            this.canvasDashboard = await this.fetchCanvasData('dashboard')
            console.log('Canvas dashboard loaded:', this.canvasDashboard)
        } catch (error) {
            console.error('Failed to load Canvas dashboard:', error)
            this.showMessage('Failed to load Canvas dashboard: ' + error.message, 'error')
        }
    }

    async loadCanvasCourses() {
        try {
            this.canvasCourses = await this.fetchCanvasData('courses', { includeEnded: false })
            console.log('Canvas courses loaded:', this.canvasCourses)
        } catch (error) {
            console.error('Failed to load Canvas courses:', error)
            this.showMessage('Failed to load Canvas courses: ' + error.message, 'error')
        }
    }

    async loadCanvasAssignments() {
        try {
            if (!this.canvasCourses || this.canvasCourses.length === 0) {
                console.log('No Canvas courses available for assignments')
                return
            }

            const allAssignments = []
            for (const course of this.canvasCourses) {
                try {
                    const assignments = await this.fetchCanvasData('assignments', { 
                        courseId: course.id,
                        includeSubmissions: true 
                    })
                    allAssignments.push(...assignments)
                } catch (error) {
                    console.error(`Failed to load assignments for course ${course.id}:`, error)
                }
            }
            
            this.canvasAssignments = allAssignments
            console.log('Canvas assignments loaded:', this.canvasAssignments)
        } catch (error) {
            console.error('Failed to load Canvas assignments:', error)
            this.showMessage('Failed to load Canvas assignments: ' + error.message, 'error')
        }
    }

    async loadCanvasGrades() {
        try {
            this.canvasGrades = await this.fetchCanvasData('grades')
            console.log('Canvas grades loaded:', this.canvasGrades)
        } catch (error) {
            console.error('Failed to load Canvas grades:', error)
            this.showMessage('Failed to load Canvas grades: ' + error.message, 'error')
        }
    }

    async loadCanvasUpcomingAssignments() {
        try {
            this.canvasUpcomingAssignments = await this.fetchCanvasData('upcoming', { limit: 10 })
            console.log('Canvas upcoming assignments loaded:', this.canvasUpcomingAssignments)
        } catch (error) {
            console.error('Failed to load Canvas upcoming assignments:', error)
            this.showMessage('Failed to load Canvas upcoming assignments: ' + error.message, 'error')
        }
    }

    async loadCanvasCalendarEvents() {
        try {
            const now = new Date()
            const endDate = new Date()
            endDate.setDate(now.getDate() + 30) // Next 30 days
            
            this.canvasCalendarEvents = await this.fetchCanvasData('calendar', {
                startDate: now.toISOString(),
                endDate: endDate.toISOString()
            })
            console.log('Canvas calendar events loaded:', this.canvasCalendarEvents)
        } catch (error) {
            console.error('Failed to load Canvas calendar events:', error)
            this.showMessage('Failed to load Canvas calendar events: ' + error.message, 'error')
        }
    }

    async loadCanvasDiscussions() {
        try {
            if (!this.canvasCourses || this.canvasCourses.length === 0) {
                console.log('No Canvas courses available for discussions')
                return
            }

            const allDiscussions = []
            for (const course of this.canvasCourses) {
                try {
                    const discussions = await this.fetchCanvasData('discussions', { courseId: course.id })
                    allDiscussions.push(...discussions)
                } catch (error) {
                    console.error(`Failed to load discussions for course ${course.id}:`, error)
                }
            }
            
            this.canvasDiscussions = allDiscussions
            console.log('Canvas discussions loaded:', this.canvasDiscussions)
        } catch (error) {
            console.error('Failed to load Canvas discussions:', error)
            this.showMessage('Failed to load Canvas discussions: ' + error.message, 'error')
        }
    }

    async loadCanvasAnnouncements() {
        try {
            if (!this.canvasCourses || this.canvasCourses.length === 0) {
                console.log('No Canvas courses available for announcements')
                return
            }

            const allAnnouncements = []
            for (const course of this.canvasCourses) {
                try {
                    const announcements = await this.fetchCanvasData('announcements', { courseId: course.id })
                    allAnnouncements.push(...announcements)
                } catch (error) {
                    console.error(`Failed to load announcements for course ${course.id}:`, error)
                }
            }
            
            this.canvasAnnouncements = allAnnouncements
            console.log('Canvas announcements loaded:', this.canvasAnnouncements)
        } catch (error) {
            console.error('Failed to load Canvas announcements:', error)
            this.showMessage('Failed to load Canvas announcements: ' + error.message, 'error')
        }
    }

    // StudentVue data loading methods
    async fetchStudentVueData(action, retries = 3) {
        if (!this.districtUrl || !this.username || !this.password) {
            throw new Error('StudentVue credentials are not set.')
        }
        
        // Additional validation
        if (!this.isStudentVueConnected) {
            throw new Error('StudentVue is not connected.')
        }
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch('/api/studentvue', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        districtUrl: this.districtUrl,
                        username: this.username,
                        password: this.password,
                        action: action,
                    }),
                })

                if (!response.ok) {
                    let errorMessage = `Request failed with status ${response.status}`
                    try {
                        const errorBody = await response.json()
                        errorMessage = errorBody.error || errorMessage
                    } catch (e) {
                        errorMessage = response.statusText || errorMessage
                    }
                    
                    if (attempt === retries) {
                        throw new Error(errorMessage)
                    }
                    
                    console.log(`Attempt ${attempt} failed for ${action}, retrying in ${attempt * 1000}ms...`)
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000))
                    continue
                }

                const text = await response.text()
                if (!text) {
                    throw new Error('Empty response from server')
                }

                try {
                    return JSON.parse(text)
                } catch (e) {
                    console.error('Failed to parse JSON response:', text)
                    throw new Error('Invalid response format from server')
                }
            } catch (error) {
                if (attempt === retries) {
                    throw error
                }
                
                console.log(`Attempt ${attempt} failed for ${action}, retrying in ${attempt * 1000}ms...`)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000))
            }
        }
    }

    async loadStudentVueGrades() {
        try {
            console.log('Fetching StudentVue gradebook...')
            const gradebook = await this.fetchStudentVueData('getGradebook')
            this.studentVueGrades = parseGradebook(gradebook)
        } catch (error) {
            console.error('Failed to load StudentVue grades:', error)
            this.studentVueGrades = -1
            this.showMessage(`Failed to load StudentVue grades: ${error.message}`, 'error')
        }
    }

    async loadStudentVueAssignments() {
        try {
            console.log('Fetching StudentVue calendar...')
            const calendar = await this.fetchStudentVueData('getCalendar')
            this.studentVueAssignments = parseAssignments(calendar)
        } catch (error) {
            console.error('Failed to load StudentVue assignments:', error)
            this.studentVueAssignments = -1
            this.showMessage(`Failed to load StudentVue assignments: ${error.message}`, 'error')
        }
    }

    async loadStudentVueAttendance() {
        try {
            console.log('Fetching StudentVue attendance...')
            const attendance = await this.fetchStudentVueData('getAttendance')
            this.studentVueAttendance = parseAttendance(attendance)
        } catch (error) {
            console.error('Failed to load StudentVue attendance:', error)
            this.studentVueAttendance = -1
            this.showMessage(`Failed to load StudentVue attendance: ${error.message}`, 'error')
        }
    }

    async loadStudentVueSchedule() {
        try {
            console.log('Fetching StudentVue schedule...')
            const schedule = await this.fetchStudentVueData('getSchedule')
            this.studentVueSchedule = parseSchedule(schedule)
        } catch (error) {
            console.error('Failed to load StudentVue schedule:', error)
            this.studentVueSchedule = -1
            this.showMessage(`Failed to load StudentVue schedule: ${error.message}`, 'error')
        }
    }

    async loadStudentVueSchoolInfo() {
        try {
            console.log('Fetching StudentVue school info...')
            const schoolInfo = await this.fetchStudentVueData('getSchoolInfo')
            this.studentVueSchoolInfo = schoolInfo?.SchoolInfo?.[0]
        } catch (error) {
            console.error('Failed to load StudentVue school info:', error)
            this.studentVueSchoolInfo = -1
            this.showMessage(`Failed to load StudentVue school info: ${error.message}`, 'error')
        }
    }

    render() {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        if (!this.isCanvasConnected && !this.isStudentVueConnected) {
            this.renderConnectionForm()
            return
        }

        container.innerHTML = `
            <div class="max-w-7xl mx-auto p-6">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Academic Hub</h1>
                    <p class="text-gray-600 dark:text-gray-400">Manage all your academic data in one place</p>
                    
                    <!-- Connection Status -->
                    <div class="flex items-center space-x-4 mt-4">
                        ${this.isCanvasConnected ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span class="text-sm text-gray-600 dark:text-gray-400">Canvas Connected</span>
                            </div>
                        ` : ''}
                        ${this.isStudentVueConnected ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span class="text-sm text-gray-600 dark:text-gray-400">StudentVue Connected</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- System Selector -->
                <div class="mb-6">
                    <div class="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button id="system-both" class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${this.activeSystem === 'both' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}">
                            All Systems
                        </button>
                        ${this.isCanvasConnected ? `
                            <button id="system-canvas" class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${this.activeSystem === 'canvas' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}">
                                Canvas
                            </button>
                        ` : ''}
                        ${this.isStudentVueConnected ? `
                            <button id="system-studentvue" class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${this.activeSystem === 'studentvue' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}">
                                StudentVue
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="academic-tabs" role="tablist">
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="overview-tab" data-tabs-target="#overview" type="button" role="tab" aria-controls="overview" aria-selected="false">Overview</button>
                        </li>
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="grades-tab" data-tabs-target="#grades" type="button" role="tab" aria-controls="grades" aria-selected="false">Grades</button>
                        </li>
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="assignments-tab" data-tabs-target="#assignments" type="button" role="tab" aria-controls="assignments" aria-selected="false">Assignments</button>
                        </li>
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="discussions-tab" data-tabs-target="#discussions" type="button" role="tab" aria-controls="discussions" aria-selected="false">Discussions</button>
                        </li>
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="schedule-tab" data-tabs-target="#schedule" type="button" role="tab" aria-controls="schedule" aria-selected="false">Schedule</button>
                        </li>
                        <li class="mr-2" role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="attendance-tab" data-tabs-target="#attendance" type="button" role="tab" aria-controls="attendance" aria-selected="false">Attendance</button>
                        </li>
                        <li role="presentation">
                            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="calendar-tab" data-tabs-target="#calendar" type="button" role="tab" aria-controls="calendar" aria-selected="false">Calendar</button>
                        </li>
                    </ul>
                </div>

                <!-- Tab Content -->
                <div id="academic-tab-content">
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="overview" role="tabpanel" aria-labelledby="overview-tab">
                        ${this.renderOverviewTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="grades" role="tabpanel" aria-labelledby="grades-tab">
                        ${this.renderGradesTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="assignments" role="tabpanel" aria-labelledby="assignments-tab">
                        ${this.renderAssignmentsTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="discussions" role="tabpanel" aria-labelledby="discussions-tab">
                        ${this.renderDiscussionsTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="schedule" role="tabpanel" aria-labelledby="schedule-tab">
                        ${this.renderScheduleTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="attendance" role="tabpanel" aria-labelledby="attendance-tab">
                        ${this.renderAttendanceTab()}
                    </div>
                    <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="calendar" role="tabpanel" aria-labelledby="calendar-tab">
                        ${this.renderCalendarTab()}
                    </div>
                </div>
            </div>
        `
    }

    renderConnectionForm() {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <div class="text-center py-12">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Academic Accounts</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Connect your Canvas and/or StudentVue accounts to view all your academic data in one unified dashboard.
                    </p>
                    <div class="space-y-4">
                        <button id="go-to-settings" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105">
                            Go to Settings to Connect
                        </button>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            You can manage all your connected accounts in the Settings page
                        </p>
                    </div>
                </div>
            </div>
        `
    }

    renderOverviewTab() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Canvas Overview -->
                ${this.isCanvasConnected ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Canvas</h3>
                            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        ${this.canvasDashboard ? `
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Courses</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasCourses?.length || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Assignments</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasAssignments?.length || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Upcoming Assignments</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasUpcomingAssignments?.length || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Discussions</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasDiscussions?.length || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Announcements</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasAnnouncements?.length || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">Calendar Events</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${this.canvasCalendarEvents?.length || 0}</span>
                                </div>
                            </div>
                        ` : `
                            <p class="text-sm text-gray-500 dark:text-gray-400">Loading Canvas data...</p>
                        `}
                    </div>
                ` : ''}

                <!-- StudentVue Overview -->
                ${this.isStudentVueConnected ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">StudentVue</h3>
                            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Classes</span>
                                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.studentVueGrades?.classes?.length || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Assignments</span>
                                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.studentVueAssignments?.length || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Schedule Periods</span>
                                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.studentVueSchedule?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <button id="refresh-data" class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors">
                            🔄 Refresh All Data
                        </button>
                        <button id="go-to-settings-overview" class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors">
                            ⚙️ Manage Connections
                        </button>
                        <button id="export-data" class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors">
                            📊 Export Data
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    renderGradesTab() {
        return `
            <div class="space-y-6">
                ${this.isStudentVueConnected && this.studentVueGrades ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">StudentVue Grades</h3>
                        ${this.renderStudentVueGrades()}
                    </div>
                ` : ''}
                
                ${this.isCanvasConnected && this.canvasGrades ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canvas Grades</h3>
                        ${this.renderCanvasGrades()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderStudentVueGrades() {
        if (!this.studentVueGrades || this.studentVueGrades === -1) {
            return '<p class="text-gray-500 dark:text-gray-400">No grade data available</p>'
        }

        return `
            <div class="space-y-4">
                ${this.studentVueGrades.classes?.map(course => `
                    <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-900 dark:text-white">${course.name}</h4>
                            <span class="text-sm font-medium ${getGradeColor(course.grade)}">${course.grade}</span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            Teacher: ${course.teacher || 'N/A'}
                        </div>
                    </div>
                `).join('') || '<p class="text-gray-500 dark:text-gray-400">No classes found</p>'}
            </div>
        `
    }

    renderCanvasGrades() {
        if (!this.canvasGrades || this.canvasGrades.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No grade data available</p>'
        }

        return `
            <div class="space-y-4">
                ${this.canvasGrades.map(enrollment => `
                    <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium text-gray-900 dark:text-white">${enrollment.course?.name || `Course ${enrollment.course_id}`}</h4>
                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                ${enrollment.grades?.final_grade || enrollment.grades?.current_grade || 'N/A'}
                            </span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            Score: ${enrollment.grades?.final_score || enrollment.grades?.current_score || 'N/A'}%
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            Status: ${enrollment.enrollment_state}
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderAssignmentsTab() {
        return `
            <div class="space-y-6">
                ${this.isStudentVueConnected && this.studentVueAssignments ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">StudentVue Assignments</h3>
                        ${this.renderStudentVueAssignments()}
                    </div>
                ` : ''}
                
                ${this.isCanvasConnected && this.canvasAssignments ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canvas Assignments</h3>
                        ${this.renderCanvasAssignments()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderStudentVueAssignments() {
        if (!this.studentVueAssignments || this.studentVueAssignments === -1 || this.studentVueAssignments.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No assignments available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.studentVueAssignments.slice(0, 10).map(assignment => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${assignment.title}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${assignment.course}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${assignment.dueDate}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${assignment.type}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderCanvasAssignments() {
        if (!this.canvasAssignments || this.canvasAssignments.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No assignments available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.canvasAssignments.slice(0, 10).map(assignment => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${assignment.name}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Course ID: ${assignment.course_id}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'No due date'}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                ${assignment.points_possible ? `${assignment.points_possible} pts` : 'No points'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderScheduleTab() {
        return `
            <div class="space-y-6">
                ${this.isStudentVueConnected && this.studentVueSchedule ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">StudentVue Schedule</h3>
                        ${this.renderStudentVueSchedule()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderStudentVueSchedule() {
        if (!this.studentVueSchedule || this.studentVueSchedule === -1 || this.studentVueSchedule.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No schedule available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.studentVueSchedule.map(period => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${period.course}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${period.teacher}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${period.period}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${period.room}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderAttendanceTab() {
        return `
            <div class="space-y-6">
                ${this.isStudentVueConnected && this.studentVueAttendance ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">StudentVue Attendance</h3>
                        ${this.renderStudentVueAttendance()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderStudentVueAttendance() {
        if (!this.studentVueAttendance || this.studentVueAttendance === -1 || this.studentVueAttendance.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No attendance data available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.studentVueAttendance.slice(0, 10).map(record => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${record.date}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${record.course}</div>
                        </div>
                        <div class="text-right">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
                                ${record.status}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderCalendarTab() {
        return `
            <div class="space-y-6">
                ${this.isCanvasConnected && this.canvasCalendarEvents ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canvas Calendar Events</h3>
                        ${this.renderCanvasCalendar()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderCanvasCalendar() {
        if (!this.canvasCalendarEvents || this.canvasCalendarEvents.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No calendar events available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.canvasCalendarEvents.slice(0, 10).map(event => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${event.title}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">${event.context_name}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${new Date(event.start_at).toLocaleDateString()}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${event.type}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderDiscussionsTab() {
        return `
            <div class="space-y-6">
                ${this.isCanvasConnected && this.canvasDiscussions ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canvas Discussions</h3>
                        ${this.renderCanvasDiscussions()}
                    </div>
                ` : ''}
                
                ${this.isCanvasConnected && this.canvasAnnouncements ? `
                    <div class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Canvas Announcements</h3>
                        ${this.renderCanvasAnnouncements()}
                    </div>
                ` : ''}
            </div>
        `
    }

    renderCanvasDiscussions() {
        if (!this.canvasDiscussions || this.canvasDiscussions.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No discussions available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.canvasDiscussions.slice(0, 10).map(discussion => `
                    <div class="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900 dark:text-white">${discussion.title}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${discussion.message?.substring(0, 100)}${discussion.message?.length > 100 ? '...' : ''}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Course ID: ${discussion.context_id} • Posts: ${discussion.discussion_subentry_count || 0}
                            </div>
                        </div>
                        <div class="text-right ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${discussion.posted_at ? new Date(discussion.posted_at).toLocaleDateString() : 'No date'}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                ${discussion.discussion_type || 'Discussion'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    renderCanvasAnnouncements() {
        if (!this.canvasAnnouncements || this.canvasAnnouncements.length === 0) {
            return '<p class="text-gray-500 dark:text-gray-400">No announcements available</p>'
        }

        return `
            <div class="space-y-3">
                ${this.canvasAnnouncements.slice(0, 10).map(announcement => `
                    <div class="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900 dark:text-white">${announcement.title}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${announcement.message?.substring(0, 100)}${announcement.message?.length > 100 ? '...' : ''}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Course ID: ${announcement.context_id} • Posts: ${announcement.discussion_subentry_count || 0}
                            </div>
                        </div>
                        <div class="text-right ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${announcement.posted_at ? new Date(announcement.posted_at).toLocaleDateString() : 'No date'}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                Announcement
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }

    setupEventListeners() {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        // Tab navigation
        const tabs = container.querySelectorAll('#academic-tabs button')
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.updateTab(tab.id)
            })
        })

        // System selector
        const systemButtons = container.querySelectorAll('#system-both, #system-canvas, #system-studentvue')
        systemButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeSystem = btn.id.replace('system-', '')
                this.updateSystemButtons()
                this.renderActiveTab()
            })
        })

        // Quick actions
        const refreshBtn = container.querySelector('#refresh-data')
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData())
        }

        const settingsBtn = container.querySelector('#go-to-settings-overview')
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showSettings'))
            })
        }

        const exportBtn = container.querySelector('#export-data')
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData())
        }

        // Connection form
        const goToSettingsBtn = container.querySelector('#go-to-settings')
        if (goToSettingsBtn) {
            goToSettingsBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showSettings'))
            })
        }

        // Set initial tab
        this.updateTab('overview-tab')
    }

    updateTab(tabId) {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        const tabs = container.querySelectorAll('#academic-tabs button')
        const tabContents = container.querySelectorAll('#academic-tab-content > div')

        tabs.forEach(tab => {
            const isSelected = tab.id === tabId
            tab.setAttribute('aria-selected', isSelected)
            if (isSelected) {
                tab.classList.add('text-blue-600', 'border-blue-600', 'dark:text-blue-500', 'dark:border-blue-500')
                tab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300')
            } else {
                tab.classList.remove('text-blue-600', 'border-blue-600', 'dark:text-blue-500', 'dark:border-blue-500')
                tab.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300')
            }
        })

        tabContents.forEach(content => {
            if (content.id === tabId.replace('-tab', '')) {
                content.classList.remove('hidden')
            } else {
                content.classList.add('hidden')
            }
        })

        this.activeTab = tabId.replace('-tab', '')
    }

    updateSystemButtons() {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        const systemButtons = container.querySelectorAll('#system-both, #system-canvas, #system-studentvue')
        systemButtons.forEach(btn => {
            const isActive = btn.id === `system-${this.activeSystem}`
            if (isActive) {
                btn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm')
                btn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-white')
            } else {
                btn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm')
                btn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-white')
            }
        })
    }

    renderActiveTab() {
        const container = document.getElementById('academic-hub-container')
        if (!container) return

        // Re-render the active tab content based on the selected system
        const activeTabContent = container.querySelector(`#${this.activeTab}`)
        if (activeTabContent) {
            switch (this.activeTab) {
                case 'overview':
                    activeTabContent.innerHTML = this.renderOverviewTab()
                    break
                case 'grades':
                    activeTabContent.innerHTML = this.renderGradesTab()
                    break
                case 'assignments':
                    activeTabContent.innerHTML = this.renderAssignmentsTab()
                    break
                case 'schedule':
                    activeTabContent.innerHTML = this.renderScheduleTab()
                    break
                case 'attendance':
                    activeTabContent.innerHTML = this.renderAttendanceTab()
                    break
                case 'calendar':
                    activeTabContent.innerHTML = this.renderCalendarTab()
                    break
                case 'discussions':
                    activeTabContent.innerHTML = this.renderDiscussionsTab()
                    break
            }
        }
    }

    async refreshData() {
        this.showMessage('Refreshing data...', 'info')
        await this.loadAllData()
        this.showMessage('Data refreshed successfully.', 'success')
    }

    async exportData() {
        const data = {
            canvas: this.isCanvasConnected ? {
                courses: this.canvasCourses,
                assignments: this.canvasAssignments,
                calendar: this.canvasCalendarEvents
            } : null,
            studentVue: this.isStudentVueConnected ? {
                grades: this.studentVueGrades,
                assignments: this.studentVueAssignments,
                attendance: this.studentVueAttendance,
                schedule: this.studentVueSchedule
            } : null,
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `academic-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        this.showMessage('Data exported successfully.', 'success')
    }

    showMessage(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`
        toast.textContent = message

        document.body.appendChild(toast)

        setTimeout(() => {
            toast.remove()
        }, 3000)
    }
}