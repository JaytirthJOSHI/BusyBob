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

    async fetchStudentVueData(action, retries = 3) {
        if (!this.districtUrl || !this.username || !this.password) {
            throw new Error('User credentials are not set.');
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
                });

                if (!response.ok) {
                    let errorMessage = `Request failed with status ${response.status}`;
                    try {
                        const errorBody = await response.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        // If we can't parse the error response, use the status text
                        errorMessage = response.statusText || errorMessage;
                    }
                    
                    // If it's the last attempt, throw the error
                    if (attempt === retries) {
                        throw new Error(errorMessage);
                    }
                    
                    // Otherwise, wait and retry
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
                // If it's the last attempt, throw the error
                if (attempt === retries) {
                    throw error;
                }
                
                // Otherwise, wait and retry
                console.log(`Attempt ${attempt} failed for ${action}, retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
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
            if (!gradebook || !gradebook.Gradebook || !gradebook.Gradebook.Courses || !gradebook.Gradebook.Courses.Course) {
                console.warn('Gradebook data is not in the expected format.', gradebook)
                return []
            }

            // Always treat Course as an array
            const courses = Array.isArray(gradebook.Gradebook.Courses.Course)
                ? gradebook.Gradebook.Courses.Course
                : [gradebook.Gradebook.Courses.Course]

            courses.forEach(course => {
                // Always treat Mark as an array
                let marks = course.Marks?.Mark
                if (marks && !Array.isArray(marks)) marks = [marks]
                const mark = marks && marks.length > 0 ? marks[0] : null

                // Always treat Assignment as an array
                let assignments = []
                if (mark && mark.Assignments && mark.Assignments.Assignment) {
                    assignments = Array.isArray(mark.Assignments.Assignment)
                        ? mark.Assignments.Assignment
                        : [mark.Assignments.Assignment]
                }

                grades.push({
                    name: course.Title || course.CourseName || 'Unknown Course',
                    teacher: course.Staff || course.Teacher || 'Unknown Teacher',
                    period: course.Period || '',
                    grade: mark?.CalculatedScoreString || 'N/A',
                    percentage: parseFloat(mark?.CalculatedScoreRaw) || 0,
                    assignments: assignments.map(assignment => ({
                        name: assignment.Measure || assignment.Name || 'Unknown Assignment',
                        score: assignment.ScoreCalValue || assignment.DisplayScore || assignment.Point || 'N/A',
                        maxScore: assignment.ScoreMaxValue || assignment.PointPossible || 'N/A',
                        dueDate: assignment.DueDate || assignment.Date || '',
                        category: assignment.Type || assignment.Category || 'General',
                        notes: assignment.Notes || '',
                    }))
                })
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
            // Handle CalendarListing format (what we're actually getting)
            if (calendar?.CalendarListing?.EventLists?.EventList) {
                const eventLists = Array.isArray(calendar.CalendarListing.EventLists.EventList) 
                    ? calendar.CalendarListing.EventLists.EventList 
                    : [calendar.CalendarListing.EventLists.EventList]
                
                eventLists.forEach(eventList => {
                    if (eventList && Array.isArray(eventList)) {
                        eventList.forEach(event => {
                            if (event && (event.DayType === 'Assignment' || event.DayType === 'Homework' || event.Title?.includes('Assignment'))) {
                                assignments.push({
                                    name: event.Title || 'Unknown Assignment',
                                    dueDate: event.Date || '',
                                    course: event.Course || 'Unknown Course',
                                    description: event.Description || '',
                                    type: event.DayType || 'Assignment'
                                })
                            }
                        })
                    }
                })
                return assignments
            }
            
            // Handle StudentCalendar format (original expected format)
            if (calendar?.StudentCalendar?.Events?.Event) {
                const events = Array.isArray(calendar.StudentCalendar.Events.Event) 
                    ? calendar.StudentCalendar.Events.Event 
                    : [calendar.StudentCalendar.Events.Event]
                
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
                return assignments
            }
            
            console.warn('Calendar data is not in the expected format.', calendar)
            return []
        } catch (error) {
            console.error('Error parsing assignments:', error)
            this.showMessage('There was an error parsing your assignments data.', 'error')
            return []
        }
    }

    parseAttendance(attendanceData) {
        if (!attendanceData || !attendanceData.Attendance) {
            console.warn('Attendance data not in any expected format.', attendanceData)
            return null
        }
        return attendanceData.Attendance
    }

    parseSchedule(scheduleData) {
        try {
            console.log('Parsing schedule data:', scheduleData);
            
            const schedule = scheduleData?.StudentClassSchedule;
            if (!schedule) {
                console.warn('Schedule data is missing the "StudentClassSchedule" property.', scheduleData);
                return null;
            }

            const classLists = schedule.ClassLists;
            if (!classLists) {
                console.warn('Schedule data is missing the "ClassLists" property.', schedule);
                return null;
            }

            // The actual class list can be nested under different keys, so we check for them.
            // It could be ClassListing, Class, or just an array.
            let classes = [];
            if (classLists.ClassListing) {
                classes = Array.isArray(classLists.ClassListing) ? classLists.ClassListing : [classLists.ClassListing];
            } else if (classLists.Class) {
                classes = Array.isArray(classLists.Class) ? classLists.Class : [classLists.Class];
            } else if (Array.isArray(classLists)) {
                classes = classLists;
            } else {
                console.warn('Could not find a class list in "ClassLists".', classLists);
                return null;
            }
            
            console.log('Found and parsed schedule with classes:', classes);
            
            return {
                type: 'StudentClassSchedule',
                classes: classes.map(cls => ({
                    period: cls['@Period'] || 'N/A',
                    name: cls['@CourseTitle'] || 'Unknown Course',
                    teacher: cls['@Teacher'] || 'Unknown Teacher',
                    room: cls['@RoomName'] || 'N/A',
                    email: cls['@TeacherEmail'] || '',
                })),
                schoolName: schedule['@SchoolName'] || 'Unknown School',
            };

        } catch (error) {
            console.error('Error parsing schedule:', error);
            return null;
        }
    }

    render() {
        const container = document.getElementById('grades-container')
        if (!container) return

        if (!this.isConnected) {
            container.innerHTML = this.renderConnectionForm()
        } else if (this.grades === -1 || this.assignments === -1) {
            container.innerHTML = this.renderConnectionError()
        } else {
            container.innerHTML = this.renderGradesContent()
        }
    }

    renderConnectionForm() {
        const container = document.getElementById('grades-container')
        if (!container) return

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <div class="text-center py-12">
                    <div class="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your StudentVue Account</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        To view your grades, assignments, attendance, and schedule, you need to connect your StudentVue account first.
                    </p>
                    <div class="space-y-4">
                        <button id="go-to-settings" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
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

        const { classes, schoolName, term } = this.schedule

        if (!classes || classes.length === 0) {
            return `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Schedule Found</h3>
                    <p class="text-gray-600 dark:text-gray-400">No schedule data is available for the current term.</p>
                </div>
            `
        }

        return `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">School: ${schoolName || 'N/A'}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Term: ${term || 'Current Term'}</p>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teacher</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${classes.map(cls => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        ${cls.period}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                        ${cls.name}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        ${cls.teacher}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        ${cls.room}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        ${cls.email ? `<a href="mailto:${cls.email}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">${cls.email}</a>` : 'N/A'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    }

    renderAttendanceTab() {
        if (this.attendance === -1) return this.renderDataError('attendance data')
        if (!this.attendance) return this.renderDataNotFound('attendance')
        
        const { Absences, TotalExcused, TotalTardies, TotalUnexcused, TotalActivities, TotalUnexcusedTardies, SchoolName } = this.attendance

        // Helper function to get total from period totals
        const getTotal = (periodTotals, type = '0') => {
            if (!periodTotals || !Array.isArray(periodTotals)) return '0'
            const total = periodTotals.find(p => p.Number === type || p.Number === '0')
            return total ? total.Total || '0' : '0'
        }

        return `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">School: ${SchoolName || 'N/A'}</h3>
                </div>
                
                <!-- Attendance Summary -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${getTotal(TotalActivities?.PeriodTotal)}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Activities</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            ${getTotal(TotalTardies?.PeriodTotal)}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Tardies</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                            ${getTotal(TotalUnexcused?.PeriodTotal)}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Unexcused</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            ${getTotal(TotalUnexcusedTardies?.PeriodTotal)}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Unexcused Tardies</div>
                    </div>
                </div>

                <!-- Absences Detail -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Absence Details</h3>
                    ${Absences?.Absence && Absences.Absence.length > 0 ? `
                        <div class="space-y-4">
                            ${Absences.Absence.map(absence => `
                                <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-3">
                                        <div>
                                            <p class="text-lg font-medium text-gray-900 dark:text-white">
                                                ${absence.AbsenceDate || 'Unknown Date'}
                                            </p>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                                ${absence.Reason || 'No reason provided'}
                                            </p>
                                            ${absence.Note ? `
                                                <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                    Note: ${absence.Note}
                                                </p>
                                            ` : ''}
                                        </div>
                                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                                            absence.CodeAllDayDescription?.includes('Activity') 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }">
                                            ${absence.CodeAllDayDescription || 'Absent'}
                                        </span>
                                    </div>
                                    
                                    ${absence.Periods?.Period && absence.Periods.Period.length > 0 ? `
                                        <div class="mt-4">
                                            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period Details:</h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                ${absence.Periods.Period.map(period => `
                                                    <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded border-l-4 ${
                                                        period.Name?.includes('Absent') 
                                                            ? 'border-red-400' 
                                                            : period.Name?.includes('Tardy') 
                                                                ? 'border-yellow-400'
                                                                : 'border-gray-400'
                                                    }">
                                                        <div class="flex justify-between items-start">
                                                            <div>
                                                                <p class="text-sm font-medium text-gray-900 dark:text-white">
                                                                    Period ${period.Number || 'N/A'}
                                                                </p>
                                                                <p class="text-xs text-gray-600 dark:text-gray-400">
                                                                    ${period.Course || 'N/A'}
                                                                </p>
                                                                <p class="text-xs text-gray-500 dark:text-gray-500">
                                                                    ${period.Staff || 'N/A'}
                                                                </p>
                                                            </div>
                                                            ${period.Name && period.Name !== 'Not Included' ? `
                                                                <span class="text-xs px-2 py-1 rounded ${
                                                                    period.Name.includes('Absent') 
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                        : period.Name.includes('Tardy')
                                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                }">
                                                                    ${period.Name}
                                                                </span>
                                                            ` : ''}
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            No period details available
                                        </div>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <div class="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Perfect Attendance!</h3>
                            <p class="text-gray-600 dark:text-gray-400">No absences recorded for this period.</p>
                        </div>
                    `}
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
        return `<div class="text-center p-4"><p class="text-red-500">Error loading ${item}. Please try again.</p></div>`
    }

    renderConnectionError() {
        return `
            <div class="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div class="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Connection Problem</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    We couldn't connect to StudentVue with your saved credentials. Your password may have changed. Please update your credentials in the settings.
                </p>
                <button id="go-to-settings-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Go to Settings
                </button>
            </div>
        `
    }

    renderCourseCard(course) {
        const mark = course.marks[0] // Assuming one mark per course for simplicity
        const percentage = parseFloat(mark?.percentage) || 0
        const gradeColor = this.getGradeColor(percentage)
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
                    <div class="bg-${gradeColor}-500 h-2 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
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
        if (!container) {
            console.error('Grades container not found')
            return
        }

        console.log('Setting up event listeners for grades component')

        // Use event delegation for dynamically added elements
        container.addEventListener('click', (event) => {
            if (event.target.id === 'refresh-grades') {
                this.refreshData()
            } else if (event.target.id === 'go-to-settings') {
                // Navigate to settings page
                window.location.hash = '#settings'
            }
        })

        if (this.isConnected) {
            console.log('User is connected, setting up tab switching')
            
            // Tab switching logic - using the correct data attributes
            const tabsContainer = document.getElementById('studentvue-tabs')
            if (tabsContainer) {
                console.log('Found tabs container')
                const tabButtons = tabsContainer.querySelectorAll('[data-tabs-target]')
                console.log('Found tab buttons:', tabButtons.length)
                
                // Hide all tab contents initially
                const allTabContents = document.querySelectorAll('#studentvue-tab-content > div')
                console.log('Found tab contents:', allTabContents.length)
                allTabContents.forEach(content => {
                    content.classList.add('hidden')
                })
                
                // Show first tab by default
                const firstTab = tabButtons[0]
                if (firstTab) {
                    const firstTabTarget = firstTab.getAttribute('data-tabs-target')
                    console.log('First tab target:', firstTabTarget)
                    const firstTabContent = document.querySelector(firstTabTarget)
                    
                    if (firstTabContent) {
                        console.log('Found first tab content, setting as active')
                        // Set first tab as active
                        firstTab.classList.add('text-blue-600', 'border-blue-600', 'dark:text-blue-500', 'dark:border-blue-500')
                        firstTab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300')
                        firstTab.setAttribute('aria-selected', 'true')
                        firstTabContent.classList.remove('hidden')
                    } else {
                        console.error('First tab content not found:', firstTabTarget)
                    }
                }
                
                tabButtons.forEach((button, index) => {
                    console.log(`Setting up click listener for tab ${index}:`, button.getAttribute('data-tabs-target'))
                    button.addEventListener('click', () => {
                        console.log('Tab clicked:', button.getAttribute('data-tabs-target'))
                        const targetSelector = button.getAttribute('data-tabs-target')
                        const targetContent = document.querySelector(targetSelector)
                        
                        if (!targetContent) {
                            console.error('Target content not found:', targetSelector)
                            return
                        }
                        
                        console.log('Found target content, switching tabs')
                        
                        // Update active button
                        tabButtons.forEach(btn => {
                            btn.classList.remove('text-blue-600', 'border-blue-600', 'dark:text-blue-500', 'dark:border-blue-500')
                            btn.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300')
                            btn.setAttribute('aria-selected', 'false')
                        })
                        button.classList.add('text-blue-600', 'border-blue-600', 'dark:text-blue-500', 'dark:border-blue-500')
                        button.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300')
                        button.setAttribute('aria-selected', 'true')
                        
                        // Show target content
                        allTabContents.forEach(content => {
                            content.classList.add('hidden')
                        })
                        targetContent.classList.remove('hidden')
                        
                        console.log('Successfully switched to tab:', targetSelector)
                    })
                })
            } else {
                console.error('Tabs container not found')
            }
        } else {
            console.log('User is not connected, skipping tab setup')
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
