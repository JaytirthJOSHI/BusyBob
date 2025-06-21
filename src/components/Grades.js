import { auth, db, supabase } from '../lib/supabase.js'
import districts from '../lib/districts.js'

export class Grades {
    constructor() {
        this.studentVueClient = null
        this.grades = null
        this.assignments = null
        this.attendance = null
        this.schedule = null
        this.schoolInfo = null
        this.isConnected = false
        this.districtUrl = ''
        this.username = ''
        this.password = ''
    }

    async init() {
        console.log('📊 Initializing Grades component...')
        
        const storedCredentials = await this.getStoredCredentials()
        if (storedCredentials) {
            this.districtUrl = storedCredentials.districtUrl
            this.username = storedCredentials.username
            this.password = storedCredentials.password
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
            
            const { data, error } = await supabase.from('studentvue_credentials')
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
            console.log('🔐 Attempting to store credentials...')
            
            // First, check if we have a current user
            const authResult = await auth.getCurrentUser()
            console.log('Auth result:', authResult)
            
            if (!authResult || !authResult.data || !authResult.data.user) {
                console.error('❌ No authenticated user found')
                throw new Error('You must be logged in to save StudentVue credentials. Please log in and try again.')
            }
            
            const { data: { user } } = authResult
            console.log('User from auth:', user)
            
            if (!user) {
                console.error('❌ User not authenticated')
                throw new Error('User not authenticated')
            }
            
            console.log('✅ User authenticated, storing credentials for user:', user.id)
            
            const { error } = await supabase.from('studentvue_credentials')
                .upsert({
                    user_id: user.id,
                    district_url: districtUrl,
                    username: username,
                    password: password,
                    updated_at: new Date().toISOString()
                })
            
            if (error) {
                console.error('❌ Supabase error:', error)
                throw error
            }
            
            console.log('✅ Credentials stored successfully')
        } catch (error) {
            console.error('❌ Error storing credentials:', error)
            throw error
        }
    }

    async fetchStudentVueData(action) {
        if (!this.districtUrl || !this.username || !this.password) {
            throw new Error('User credentials are not set.');
        }
        
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
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async loadAllData() {
        this.showMessage('Loading student data...', 'info');

        const dataPromises = [
            this.loadGrades(),
            this.loadAssignments(),
            this.loadAttendance(),
            this.loadSchedule(),
            this.loadSchoolInfo()
        ];

        await Promise.all(dataPromises.map(p => p.catch(e => {
            console.error('Data loading failed for one of the items:', e);
            // The error is handled inside each load function
            return e; 
        })));

        this.render();
        this.setupEventListeners();
        this.showMessage('Data loaded.', 'success');
    }

    async loadGrades() {
        try {
            console.log('Fetching gradebook via proxy...');
            const gradebook = await this.fetchStudentVueData('getGradebook');
            this.grades = this.parseGradebook(gradebook);
            console.log('📊 Grades loaded:', this.grades);
        } catch (error) {
            console.error('Error loading grades:', error);
            this.grades = -1; // -1 indicates an error
            this.showMessage(`Could not load grades: ${error.message}`, 'error');
        }
    }

    async loadAssignments() {
        try {
            console.log('Fetching calendar via proxy...');
            const calendar = await this.fetchStudentVueData('getCalendar');
            this.assignments = this.parseAssignments(calendar);
            console.log('📝 Assignments loaded:', this.assignments);
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.assignments = -1;
            this.showMessage(`Could not load assignments: ${error.message}`, 'error');
        }
    }

    async loadAttendance() {
        try {
            console.log('Fetching attendance via proxy...');
            const attendance = await this.fetchStudentVueData('getAttendance');
            this.attendance = this.parseAttendance(attendance);
            console.log('📋 Attendance loaded:', this.attendance);
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.attendance = -1;
            this.showMessage(`Could not load attendance: ${error.message}`, 'error');
        }
    }

    async loadSchedule() {
        try {
            console.log('Fetching schedule via proxy...');
            const schedule = await this.fetchStudentVueData('getSchedule');
            this.schedule = this.parseSchedule(schedule);
            console.log('🗓️ Schedule loaded:', this.schedule);
        } catch (error) {
            console.error('Error loading schedule:', error);
            this.schedule = -1;
            this.showMessage(`Could not load schedule: ${error.message}`, 'error');
        }
    }

    async loadSchoolInfo() {
        try {
            console.log('Fetching school info via proxy...');
            const schoolInfo = await this.fetchStudentVueData('getSchoolInfo');
            this.schoolInfo = schoolInfo?.SchoolInfo?.[0];
            console.log('🏫 School info loaded:', this.schoolInfo);
        } catch (error) {
            console.error('Error loading school info:', error);
            this.schoolInfo = -1;
            this.showMessage(`Could not load school info: ${error.message}`, 'error');
        }
    }

    parseGradebook(gradebook) {
        const grades = []
        
        try {
            if (!gradebook || !gradebook.Gradebook || !gradebook.Gradebook.Courses || !Array.isArray(gradebook.Gradebook.Courses.Course)) {
                console.warn('Gradebook data is not in the expected format.', gradebook)
                return []
            }

            const courses = gradebook.Gradebook.Courses.Course || []
            
            courses.forEach(course => {
                const mark = course.Marks?.Mark?.[0]
                const courseData = {
                    name: course.Title || 'Unknown Course',
                    teacher: course.Teacher || 'Unknown Teacher',
                    period: course.Period || '',
                    grade: mark?.CalculatedScoreString || 'N/A',
                    percentage: mark?.CalculatedScoreRaw || 0,
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
        } catch (error) {
            console.error('Error parsing gradebook:', error)
            this.showMessage('There was an error parsing your gradebook data.', 'error')
        }
        
        return grades
    }

    parseAssignments(calendar) {
        const assignments = []
        
        try {
            if (!calendar || !calendar.StudentCalendar || !calendar.StudentCalendar.Events || !Array.isArray(calendar.StudentCalendar.Events.Event)) {
                console.warn('Calendar data is not in the expected format.', calendar)
                return []
            }

            const events = calendar.StudentCalendar.Events.Event || []
            
            events.forEach(event => {
                if (event && (event.Type === 'Assignment' || event.Type === 'Homework')) {
                    assignments.push({
                        name: event.Title || 'Unknown Assignment',
                        dueDate: event.StartDate || '',
                        course: event.Course || 'Unknown Course',
                        description: event.Description || '',
                        type: event.Type || 'Assignment'
                    })
                }
            })
        } catch (error) {
            console.error('Error parsing assignments:', error)
            this.showMessage('There was an error parsing your assignments data.', 'error')
        }
        
        return assignments
    }

    parseAttendance(attendanceData) {
        if (!attendanceData?.Attendance || !Array.isArray(attendanceData.Attendance.Absences?.Absence)) {
            console.warn('Attendance data is not in the expected format.', attendanceData)
            return null
        }
        return attendanceData.Attendance
    }

    parseSchedule(scheduleData) {
        if (!scheduleData?.ClassSchedule || !Array.isArray(scheduleData.ClassSchedule.Classes?.Class)) {
            console.warn('Schedule data is not in the expected format.', scheduleData)
            return null
        }
        return scheduleData.ClassSchedule.Classes.Class
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
                        Select your school district and enter your credentials to view your grades and assignments.
                    </p>
                </div>
                
                <form id="studentvue-form" class="space-y-4">
                    <div class="space-y-2 p-4 border rounded-lg dark:border-gray-700">
                        <label for="district-search" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Find by District Name
                        </label>
                        <div class="relative">
                            <input type="text" id="district-search" name="district-search"
                                   placeholder="Start typing your district name..."
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                        </div>

                        <div class="flex items-center my-4">
                            <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            <span class="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
                            <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        </div>

                        <label for="zip-code-search" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Find by ZIP Code
                        </label>
                        <div class="flex items-center gap-2">
                            <input type="text" id="zip-code-search" name="zipCodeSearch" pattern="[0-9]{5}"
                                   placeholder="e.g., 90210"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                            <button type="button" id="find-by-zip-btn" class="btn-secondary">Find</button>
                        </div>
                        
                        <div id="district-results" class="relative z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-2 max-h-60 overflow-y-auto hidden"></div>

                        <input type="hidden" id="district-url" name="districtUrl">
                        <p id="selected-district" class="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium"></p>
                        
                        <p class="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                            Can't find your school? 
                            <a href="mailto:support@busybob.com?subject=Missing%20School%20District" class="text-blue-500 hover:underline">
                                Let us know!
                            </a>
                        </p>
                    </div>

                    <div class="space-y-2 p-4 border rounded-lg dark:border-gray-700">
                        <label for="studentvue-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username
                        </label>
                        <input type="text" id="studentvue-username" name="username" required
                               placeholder="Your StudentVue username"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>

                    <div class="space-y-2 p-4 border rounded-lg dark:border-gray-700">
                        <label for="studentvue-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input type="password" id="studentvue-password" name="password" required
                               placeholder="Your StudentVue password"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>

                    <div class="flex justify-end">
                        <button type="submit" id="connect-studentvue-btn" class="btn-primary">Connect and Save</button>
                    </div>
                </form>
            </div>
        `
    }

    renderGradesContent() {
        // Tab navigation
        return `
            <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="studentvue-tabs" role="tablist">
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg" id="gradebook-tab" data-tabs-target="#gradebook" type="button" role="tab" aria-controls="gradebook" aria-selected="false">Gradebook</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg" id="schedule-tab" data-tabs-target="#schedule" type="button" role="tab" aria-controls="schedule" aria-selected="false">Schedule</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg" id="attendance-tab" data-tabs-target="#attendance" type="button" role="tab" aria-controls="attendance" aria-selected="false">Attendance</button>
                    </li>
                    <li role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg" id="documents-tab" data-tabs-target="#documents" type="button" role="tab" aria-controls="documents" aria-selected="false">Documents</button>
                    </li>
                </ul>
            </div>
            <div id="studentvue-tab-content">
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="gradebook" role="tabpanel" aria-labelledby="gradebook-tab">
                    ${this.renderGradebookTab()}
                </div>
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="schedule" role="tabpanel" aria-labelledby="schedule-tab">
                    ${this.renderScheduleTab()}
                </div>
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="attendance" role="tabpanel" aria-labelledby="attendance-tab">
                    ${this.renderAttendanceTab()}
                </div>
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="documents" role="tabpanel" aria-labelledby="documents-tab">
                    ${this.renderDocumentsTab()}
                </div>
            </div>
        `
    }

    renderGradebookTab() {
        if (this.grades === -1) return this.renderDataError('gradebook data')
        if (!this.grades || this.grades.length === 0) return this.renderDataNotFound('grades')

        const gpa = this.calculateGPA()
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.grades.map(course => this.renderCourseCard(course)).join('')}
            </div>
            <div class="mt-6 text-right font-bold text-lg text-gray-800 dark:text-white">
                GPA: ${gpa}
            </div>
        `
    }

    renderScheduleTab() {
        if (this.schedule === -1) return this.renderDataError('schedule data')
        if (!this.schedule) return this.renderDataNotFound('schedule')

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teacher</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${this.schedule.map(cls => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${cls.Period}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${cls.CourseTitle}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${cls.Teacher}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${cls.RoomName}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `
    }

    renderAttendanceTab() {
        if (this.attendance === -1) return this.renderDataError('attendance data')
        if (!this.attendance) return this.renderDataNotFound('attendance')
        
        const { Absences, DailyTotals, PeriodTotals } = this.attendance

        return `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Summary</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-2xl font-bold">${DailyTotals?.Total || 0}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Total Days Absent</div>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-2xl font-bold">${PeriodTotals?.Tardies || 0}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Total Tardies</div>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-2xl font-bold">${PeriodTotals?.Unexcused || 0}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Unexcused Absences</div>
                        </div>
                         <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-2xl font-bold">${PeriodTotals?.Excused || 0}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Excused Absences</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Absences</h3>
                    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${Absences.Absence.map(absence => `
                            <li class="py-3 flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">${absence.AbsenceDate}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${absence.Reason}</p>
                                </div>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${absence.Excused ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${absence.Excused ? 'Excused' : 'Unexcused'}
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `
    }

    renderDocumentsTab() {
        return this.renderDataNotFound("Documents feature is not yet available.")
    }

    renderDataNotFound(item) {
        return `<div class="text-center py-10"><p class="text-gray-500 dark:text-gray-400">No ${item} found.</p></div>`
    }

    renderDataError(item) {
        return `<div class="text-center py-10"><p class="text-red-500 dark:text-red-400">Could not load ${item}. It may not be available from your school district.</p></div>`
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
        const container = document.getElementById('grades-container')
        if (!container) return

        // Use event delegation for dynamically added elements
        container.addEventListener('click', (event) => {
            if (event.target.id === 'refresh-grades') {
                this.refreshData()
            }
        })

        if (this.isConnected) {
            // Tab switching logic
            const tabs = new Tabs(document.getElementById('studentvue-tabs'), {
                defaultTabId: 'gradebook-tab',
                activeClasses: 'text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-500 border-blue-600 dark:border-blue-500',
                inactiveClasses: 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
            })
        }

        if (!this.isConnected) {
            const form = container.querySelector('#studentvue-form')
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault()
                    this.handleConnection(form)
                })

                const districtSearch = form.querySelector('#district-search')
                const zipCodeSearch = form.querySelector('#zip-code-search')
                const findByZipBtn = form.querySelector('#find-by-zip-btn')
                const districtResults = form.querySelector('#district-results')

                const displayResults = (filteredDistricts) => {
                    if (filteredDistricts.length > 0) {
                        districtResults.innerHTML = filteredDistricts.map(d => 
                            `<div class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-url="${d.parentVueUrl}" data-name="${d.name}">${d.name} <span class='text-xs text-gray-500'>(${d.address})</span></div>`
                        ).join('')
                    } else {
                        districtResults.innerHTML = '<div class="p-2 text-gray-500">No districts found</div>'
                    }
                    districtResults.classList.remove('hidden')
                }

                districtSearch.addEventListener('input', () => {
                    const query = districtSearch.value.toLowerCase()
                    zipCodeSearch.value = '' // Clear other search
                    if (query.length < 3) {
                        districtResults.innerHTML = ''
                        districtResults.classList.add('hidden')
                        return
                    }
                    const filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(query)).slice(0, 50)
                    displayResults(filteredDistricts)
                })
                
                findByZipBtn.addEventListener('click', () => {
                    const zipCode = zipCodeSearch.value
                    districtSearch.value = '' // Clear other search
                    if (!/^\d{5}$/.test(zipCode)) {
                        this.showMessage('Please enter a valid 5-digit ZIP code.', 'error')
                        return
                    }
                    const filteredDistricts = districts.filter(d => d.address.includes(zipCode))
                    displayResults(filteredDistricts)
                })

                districtResults.addEventListener('click', (event) => {
                    const target = event.target.closest('[data-url]')
                    if (target) {
                        const url = target.dataset.url
                        const name = target.dataset.name
                        form.querySelector('#district-url').value = url
                        form.querySelector('#selected-district').textContent = `Selected: ${name}`
                        districtSearch.value = ''
                        zipCodeSearch.value = ''
                        districtResults.classList.add('hidden')
                    }
                })

                // Hide results when clicking outside
                document.addEventListener('click', (event) => {
                    if (!form.contains(event.target)) {
                        districtResults.classList.add('hidden')
                    }
                })
            }
        }
    }

    async handleConnection(form) {
        // First check if user is authenticated
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                this.showMessage('You must be logged in to connect StudentVue. Please log in and try again.', 'error')
                return
            }
        } catch (error) {
            console.error('Error checking authentication:', error)
            this.showMessage('Authentication error. Please log in and try again.', 'error')
            return
        }

        const districtUrl = form.querySelector('#district-url').value
        const username = form.querySelector('#studentvue-username').value
        const password = form.querySelector('#studentvue-password').value

        if (!districtUrl) {
            this.showMessage('Please select your school district from the list.', 'error')
            return
        }
        if (!username || !password) {
            this.showMessage('Please enter your username and password.', 'error')
            return
        }

        const connectBtn = form.querySelector('#connect-studentvue-btn')
        connectBtn.disabled = true
        connectBtn.textContent = 'Connecting...'

        try {
            // Set credentials for the fetch calls
            this.districtUrl = districtUrl
            this.username = username
            this.password = password
            this.isConnected = true // Tentatively set to true

            // Store credentials first
            await this.storeCredentials(districtUrl, username, password)
            
            // Now, load all data using the new proxy
            await this.loadAllData()

        } catch (error) {
            // This catch is for storing credentials. Load errors are handled in loadAllData.
            this.showMessage(`Failed to save credentials: ${error.message}`, 'error')
            this.isConnected = false
        } finally {
            // loadAllData will re-render, so we don't need to reset the button here
            // It will be gone on the next render.
        }
    }

    async refreshData() {
        this.showMessage('Refreshing data...', 'info')
        try {
            await this.loadAllData()
            this.showMessage('Data refreshed successfully!', 'success')
        } catch (error) {
            this.showMessage('Failed to refresh data.', 'error')
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
