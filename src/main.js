import { auth, db } from './lib/supabase.js'
import { Calendar } from './components/Calendar.js'
import { Chatbot } from './components/Chatbot.js'
import { AuthPages } from './components/AuthPages.js'
import { Navigation } from './components/Navigation.js'
import { LandingPage } from './components/LandingPage.js'
import { theme, dateUtils, taskUtils, ui, animations, validation } from './utils/helpers.js'

// Global state
let currentUser = null
let tasks = []
let feelings = []
let journalEntries = []
let calendar = null
let chatbot = null
let navigation = null
let authPages = null
let landingPage = null
let selectedMoodTags = []

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp()
})

async function initializeApp() {
    // Initialize theme
    theme.initialize()
    
    // Initialize components
    authPages = new AuthPages()
    navigation = new Navigation()
    landingPage = new LandingPage()
    
    // Set up theme toggle
    document.getElementById('theme-toggle').addEventListener('click', theme.toggle)
    
    // Check authentication state
    const { data: { user } } = await auth.getCurrentUser()
    
    if (user) {
        currentUser = user
        showMainApp()
    } else {
        showLandingPage()
    }

    // Set up auth state listener
    auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session)
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user
            // Small delay to let user see welcome message
            setTimeout(() => {
                showMainApp()
            }, 1500)
        } else if (event === 'SIGNED_OUT') {
            currentUser = null
            showLandingPage()
        }
    })

    // Landing page event listeners
    document.addEventListener('showSignup', () => {
        showAuthPages('signup')
    })
    
    document.addEventListener('showLogin', () => {
        showAuthPages('login')
    })

    // Set up form listeners
    setupFormListeners()
    
    // Set up navigation listeners
    setupNavigationListeners()
    
    // Initialize calendar
    calendar = new Calendar('calendar-container', onDateSelect)
    
    // Initialize chatbot
    chatbot = new Chatbot()
    
    // Update current date
    updateCurrentDate()
}

function setupFormListeners() {
    // Use event delegation for forms that get mounted dynamically
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            handleLogin(e)
        } else if (e.target.id === 'signup-form') {
            handleSignup(e)
        } else if (e.target.id === 'task-form') {
            handleTaskSubmit(e)
        } else if (e.target.id === 'feeling-form') {
            handleFeelingSubmit(e)
        } else if (e.target.id === 'journal-form') {
            handleJournalSubmit(e)
        }
    })
    
    // Sign out button (exists in main app)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'sign-out-btn') {
            signOut()
        }
    })
    
    // Mood tags
    document.querySelectorAll('.mood-tag').forEach(tag => {
        tag.addEventListener('click', toggleMoodTag)
    })
    
    // Journal character counter
    const journalContent = document.getElementById('journal-content')
    const charCount = document.getElementById('journal-char-count')
    
    if (journalContent && charCount) {
        journalContent.addEventListener('input', function() {
            charCount.textContent = this.value.length
        })
    }
}

function setupNavigationListeners() {
    // Listen for page change events from Navigation component
    document.addEventListener('pageChange', (e) => {
        const { page } = e.detail
        showPage(page)
    })
    
    // Quick action buttons
    document.addEventListener('click', (e) => {
        const quickActionBtn = e.target.closest('.quick-action-btn')
        if (quickActionBtn) {
            const page = quickActionBtn.dataset.page
            if (page) {
                navigation.setActivePage(page)
                showPage(page)
            }
        }
    })
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    const email = formData.get('email')
    const password = formData.get('password')
    
    // Validate inputs
    if (!validation.email(email)) {
        ui.showMessage('Please enter a valid email address', 'error')
        return
    }
    
    if (!validation.password(password)) {
        ui.showMessage('Password must be at least 6 characters long', 'error')
        return
    }
    
    try {
        const { data, error } = await auth.signIn(email, password)
        
        if (error) throw error
        
        ui.showMessage('Welcome back!', 'success')
    } catch (error) {
        ui.showMessage(error.message, 'error')
    }
}

async function handleSignup(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')
    
    // Validate inputs
    if (!validation.required(name)) {
        ui.showMessage('Please enter your full name', 'error')
        return
    }
    
    if (!validation.email(email)) {
        ui.showMessage('Please enter a valid email address', 'error')
        return
    }
    
    if (!validation.password(password)) {
        ui.showMessage('Password must be at least 6 characters long', 'error')
        return
    }
    
    try {
        const { data, error } = await auth.signUp(email, password, name)
        
        if (error) throw error
        
        // Check if user needs email confirmation
        if (data.user && !data.session) {
            ui.showMessage('Account created! Please check your email to verify your account, then sign in.', 'success')
            authPages.showLogin()
        } else if (data.user && data.session) {
            // Auto sign-in is enabled in Supabase
            ui.showMessage('Welcome to Busy BOB! Let\'s get you organized.', 'success')
            // The auth state change listener will handle the redirect
        } else {
            ui.showMessage('Account created successfully! You can now sign in.', 'success')
            authPages.showLogin()
        }
    } catch (error) {
        ui.showMessage(error.message, 'error')
    }
}

async function signOut() {
    try {
        await auth.signOut()
        ui.showMessage('Signed out successfully', 'success')
    } catch (error) {
        ui.showMessage(error.message, 'error')
    }
}

// UI Navigation
function showLandingPage() {
    document.getElementById('auth-container').classList.remove('hidden')
    document.getElementById('main-app').classList.add('hidden')
    
    // Load landing page content
    landingPage.mount(document.getElementById('auth-container'))
}

function showAuthPages(page = 'login') {
    document.getElementById('auth-container').classList.remove('hidden')
    document.getElementById('main-app').classList.add('hidden')
    
    // Load auth pages content
    authPages.mount(document.getElementById('auth-container'))
    
    // Show specific page
    if (page === 'signup') {
        authPages.showSignup()
    } else {
        authPages.showLogin()
    }
}

function showMainApp() {
    document.getElementById('auth-container').classList.add('hidden')
    document.getElementById('main-app').classList.remove('hidden')
    
    // Update user info
    if (currentUser) {
        const userName = currentUser.user_metadata?.name || currentUser.email
        document.getElementById('user-name').textContent = userName
        document.getElementById('welcome-name').textContent = userName.split(' ')[0]
    }
    
    // Load data and show home page
    loadAllData()
    showPage('home')
}

function showPage(pageName) {
    // Hide all pages with animation
    const pages = document.querySelectorAll('.page-content')
    pages.forEach(page => {
        page.classList.add('hidden')
    })
    
    // Show selected page with animation
    const targetPage = document.getElementById(pageName + '-page')
    if (targetPage) {
        targetPage.classList.remove('hidden')
        animations.fadeIn(targetPage, 300)
    }
    
    // Update navigation active state
    if (navigation) {
        navigation.setActivePage(pageName)
    }
    
    // Load page-specific data
    switch (pageName) {
        case 'home':
            loadHomeData()
            break
        case 'tasks':
            loadTasks()
            break
        case 'calendar':
            loadCalendar()
            break
        case 'journal':
            loadJournalEntries()
            break
    }
}

// Data loading functions
async function loadAllData() {
    try {
        await Promise.all([
            loadTasks(),
            loadFeelings(),
            loadJournalEntries()
        ])
        
        loadHomeData()
        loadCharts()
    } catch (error) {
        console.error('Error loading data:', error)
        ui.showMessage('Error loading data. Please refresh the page.', 'error')
    }
}

function loadHomeData() {
    // Update current date
    document.getElementById('current-date').textContent = dateUtils.getCurrentDate()
    
    // Update task count
    const pendingTasks = tasks.filter(task => !task.completed)
    document.getElementById('tasks-count').textContent = pendingTasks.length
    
    // Update mood average
    if (feelings.length > 0) {
        const recentFeelings = feelings.slice(0, 7) // Last 7 entries
        const average = recentFeelings.reduce((sum, feeling) => sum + feeling.rating, 0) / recentFeelings.length
        document.getElementById('mood-average').textContent = average.toFixed(1)
    }
    
    // Update streak (simplified calculation)
    document.getElementById('streak-count').textContent = Math.min(feelings.length, 30)
    
    // Load upcoming tasks
    loadUpcomingTasks()
}

function loadUpcomingTasks() {
    const upcomingContainer = document.getElementById('upcoming-tasks')
    if (!upcomingContainer) return
    
    const upcoming = tasks
        .filter(task => !task.completed)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5)
    
    upcomingContainer.innerHTML = upcoming.length > 0 
        ? upcoming.map(task => `
        <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1">
                    <div class="font-medium text-sm text-gray-900 dark:text-white">${task.title}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        ${dateUtils.formatDateTime(task.due_date, task.due_time)}
                    </div>
            </div>
                <div class="text-xs px-2 py-1 rounded-full ${taskUtils.getPriorityColor(task.priority)}">
                    ${task.priority}
            </div>
        </div>
    `).join('')
        : '<p class="text-gray-500 dark:text-gray-400 text-sm">No upcoming tasks</p>'
}

async function loadTasks() {
    try {
        const { data, error } = await db.getTasks()
        if (error) throw error
        
        tasks = data || []
        renderTasks()
        
        // Update calendar with tasks
        if (calendar) {
            calendar.setTasks(tasks)
        }
    } catch (error) {
        console.error('Error loading tasks:', error)
        ui.showMessage('Error loading tasks', 'error')
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list')
    if (!taskList) return
    
    taskList.innerHTML = tasks.length > 0 
        ? tasks.map(task => createTaskHTML(task)).join('')
        : '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No tasks yet. Create your first task above!</p>'
}

function createTaskHTML(task) {
    const isOverdue = dateUtils.isOverdue(task.due_date, task.due_time) && !task.completed
    const priorityClass = task.priority === 'high' ? 'priority-high' : 
                         task.priority === 'medium' ? 'priority-medium' : 'priority-low'
    const statusClass = task.completed ? 'status-completed' : isOverdue ? 'status-overdue' : ''
    
    return `
        <div class="task-item border rounded-lg p-4 ${priorityClass} ${statusClass} card-hover" data-task-id="${task.id}">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})"
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <div class="flex-1">
                        <h3 class="font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-75' : ''}">${task.title}</h3>
                        <div class="flex items-center space-x-4 mt-1">
                            <span class="text-xs px-2 py-1 rounded-full ${taskUtils.getCategoryColor(task.category)}">${task.category}</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                ${dateUtils.formatDateTime(task.due_date, task.due_time)}
                            </span>
                            <span class="text-xs ${taskUtils.getPriorityColor(task.priority)}">
                                ${taskUtils.getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                            </span>
                        </div>
                        ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${task.description}</p>` : ''}
                    </div>
                </div>
                <button onclick="deleteTask(${task.id})" class="text-red-500 hover:text-red-700 p-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `
}

function loadCalendar() {
    if (calendar) {
        calendar.setTasks(tasks)
    }
    loadSelectedDateTasks(new Date())
}

function loadSelectedDateTasks(date) {
    const selectedTasksContainer = document.getElementById('selected-date-tasks')
    const titleElement = document.getElementById('selected-date-title')
    
    if (!selectedTasksContainer || !titleElement) return
    
    const dateStr = date.toISOString().split('T')[0]
    const dayTasks = tasks.filter(task => task.due_date === dateStr)
    
    titleElement.textContent = date.toDateString() === new Date().toDateString() 
        ? "Today's Tasks" 
        : `Tasks for ${dateUtils.formatDate(dateStr)}`
    
    selectedTasksContainer.innerHTML = dayTasks.length > 0
        ? dayTasks.map(task => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center space-x-3">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})"
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <div>
                        <div class="font-medium text-sm text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-75' : ''}">${task.title}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${dateUtils.formatDateTime(task.due_date, task.due_time)}</div>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${taskUtils.getPriorityColor(task.priority)}">${task.priority}</span>
        </div>
    `).join('')
        : '<p class="text-gray-500 dark:text-gray-400 text-sm">No tasks for this date</p>'
}

async function loadFeelings() {
    try {
        const { data, error } = await db.getFeelings()
        if (error) throw error
        
        feelings = data || []
    } catch (error) {
        console.error('Error loading feelings:', error)
    }
}

async function loadJournalEntries() {
    try {
        const { data, error } = await db.getJournalEntries()
        if (error) throw error
        
        journalEntries = data || []
        renderJournalEntries()
    } catch (error) {
        console.error('Error loading journal entries:', error)
        ui.showMessage('Error loading journal entries', 'error')
    }
}

function renderJournalEntries() {
    const entriesContainer = document.getElementById('journal-entries')
    if (!entriesContainer) return
    
    entriesContainer.innerHTML = journalEntries.length > 0
        ? journalEntries.map(entry => `
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 card-hover">
            <div class="flex justify-between items-start mb-4">
                <div>
                        ${entry.title ? `<h3 class="text-lg font-semibold text-gray-900 dark:text-white">${entry.title}</h3>` : ''}
                        <p class="text-sm text-gray-500 dark:text-gray-400">${dateUtils.formatDate(entry.created_at)}</p>
                    </div>
                    <button onclick="deleteJournalEntry(${entry.id})" class="text-red-500 hover:text-red-700 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${entry.content}</div>
        </div>
    `).join('')
        : '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No journal entries yet. Start writing your first entry above!</p>'
}

// Form handlers
async function handleTaskSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        due_date: formData.get('due_date'),
        due_time: formData.get('due_time'),
        stress_level: parseInt(formData.get('stress_level')),
        completed: false
    }
    
    try {
        const { data, error } = await db.createTask(taskData)
        if (error) throw error
        
        tasks.push(data[0])
        renderTasks()
        
        // Update calendar
        if (calendar) {
            calendar.setTasks(tasks)
        }
        
        ui.showMessage('Task created successfully!', 'success')
        event.target.reset()
        
        // Add success animation
        const taskList = document.getElementById('task-list')
        if (taskList.firstElementChild) {
            animations.slideIn(taskList.firstElementChild, 'down', 300)
        }
    } catch (error) {
        console.error('Error creating task:', error)
        ui.showMessage('Error creating task', 'error')
    }
}

async function handleFeelingSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    
    const feelingData = {
        rating: parseInt(formData.get('rating')),
        mood_tags: selectedMoodTags.join(','),
        comments: formData.get('comments')
    }
    
    try {
        const { data, error } = await db.createFeeling(feelingData)
        if (error) throw error
        
        feelings.unshift(data[0])
        
        ui.showMessage('Mood logged successfully!', 'success')
        event.target.reset()
        selectedMoodTags = []
        updateMoodTagsDisplay()
        
        // Refresh home data
        loadHomeData()
    } catch (error) {
        console.error('Error logging feeling:', error)
        ui.showMessage('Error logging mood', 'error')
    }
}

async function handleJournalSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    
    const entryData = {
        title: formData.get('title'),
        content: formData.get('content')
    }
    
    try {
        const { data, error } = await db.createJournalEntry(entryData)
        if (error) throw error
        
        journalEntries.unshift(data[0])
        renderJournalEntries()
        
        ui.showMessage('Journal entry saved!', 'success')
        event.target.reset()
        
        // Reset character counter
        const charCount = document.getElementById('journal-char-count')
        if (charCount) {
            charCount.textContent = '0'
        }
    } catch (error) {
        console.error('Error saving journal entry:', error)
        ui.showMessage('Error saving journal entry', 'error')
    }
}

// Action handlers
async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    try {
        const { data, error } = await db.updateTask(taskId, { completed: !task.completed })
        if (error) throw error
        
        task.completed = !task.completed
        renderTasks()
        
        // Update calendar
        if (calendar) {
            calendar.setTasks(tasks)
        }
        
        // Refresh home data
        loadHomeData()
        
        // Show feedback
        if (task.completed) {
            ui.showMessage('Task completed! Great job! 🎉', 'success')
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`)
            if (taskElement) {
                animations.pulse(taskElement, 600)
            }
        }
    } catch (error) {
        console.error('Error updating task:', error)
        ui.showMessage('Error updating task', 'error')
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
        const { error } = await db.deleteTask(taskId)
        if (error) throw error
        
        tasks = tasks.filter(t => t.id !== taskId)
        renderTasks()
        
        // Update calendar
        if (calendar) {
            calendar.setTasks(tasks)
        }
        
        ui.showMessage('Task deleted', 'success')
    } catch (error) {
        console.error('Error deleting task:', error)
        ui.showMessage('Error deleting task', 'error')
    }
}

async function deleteJournalEntry(entryId) {
    if (!confirm('Are you sure you want to delete this journal entry?')) return
    
    try {
        const { error } = await db.deleteJournalEntry(entryId)
        if (error) throw error
        
        journalEntries = journalEntries.filter(e => e.id !== entryId)
        renderJournalEntries()
        
        ui.showMessage('Journal entry deleted', 'success')
    } catch (error) {
        console.error('Error deleting journal entry:', error)
        ui.showMessage('Error deleting journal entry', 'error')
    }
}

// Event handlers
function onDateSelect(date) {
    loadSelectedDateTasks(date)
}

function toggleMoodTag(event) {
    event.preventDefault()
    const tag = event.target.dataset.tag
    
    if (selectedMoodTags.includes(tag)) {
        selectedMoodTags = selectedMoodTags.filter(t => t !== tag)
        event.target.classList.remove('bg-blue-500', 'text-white')
        event.target.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300')
    } else {
        selectedMoodTags.push(tag)
        event.target.classList.add('bg-blue-500', 'text-white')
        event.target.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300')
    }
    
    updateMoodTagsDisplay()
}

function updateMoodTagsDisplay() {
    const hiddenInput = document.getElementById('mood-tags')
    if (hiddenInput) {
        hiddenInput.value = selectedMoodTags.join(',')
    }
}

function loadCharts() {
    // Mood chart
    const moodCtx = document.getElementById('moodChart')
    if (moodCtx && feelings.length > 0) {
        const recentFeelings = feelings.slice(0, 7).reverse()
        new Chart(moodCtx, {
            type: 'line',
            data: {
                labels: recentFeelings.map(f => new Date(f.created_at).toLocaleDateString()),
                datasets: [{
                    label: 'Mood Rating',
                    data: recentFeelings.map(f => f.rating),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        })
    }

    // Task chart
    const taskCtx = document.getElementById('taskChart')
    if (taskCtx) {
        const completedTasks = tasks.filter(t => t.completed).length
        const pendingTasks = tasks.length - completedTasks
        
        new Chart(taskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completedTasks, pendingTasks],
                    backgroundColor: ['#10B981', '#F59E0B']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        })
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date')
    if (dateElement) {
        dateElement.textContent = dateUtils.getCurrentDate()
    }
}

// Make functions globally available for onclick handlers
window.toggleTask = toggleTask
window.deleteTask = deleteTask
window.deleteJournalEntry = deleteJournalEntry