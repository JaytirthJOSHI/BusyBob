import { auth, db } from './lib/supabase.js'
import { Calendar } from './components/Calendar.js'
import { Chatbot } from './components/Chatbot.js'
import { AuthPages } from './components/AuthPages.js'
import { Navigation } from './components/Navigation.js'
import { LandingPage } from './components/LandingPage.js'
import { Grades } from './components/Grades.js'
import { theme, dateUtils, taskUtils, ui, animations, validation } from './utils/helpers.js'

console.log('🚀 Main.js loaded - starting initialization...')

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
let grades = null
let selectedMoodTags = []

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, calling initializeApp...')
    initializeApp()
})

async function initializeApp() {
    try {
        console.log('🔧 Starting app initialization...')
        
        // Initialize theme
        console.log('🎨 Initializing theme...')
        theme.initialize()
        
        // Initialize components
        console.log('📦 Creating components...')
        authPages = new AuthPages()
        navigation = new Navigation()
        landingPage = new LandingPage()
        grades = new Grades()
        console.log('✅ Components created successfully')
        
        // Set up theme toggle
        console.log('🌙 Setting up theme toggle...')
        document.getElementById('theme-toggle').addEventListener('click', theme.toggle)
        
        // Check authentication state
        console.log('🔐 Checking authentication state...')
        const { data: { user } } = await auth.getCurrentUser()
        
        if (user) {
            console.log('👤 User is authenticated, showing main app')
            currentUser = user
            showMainApp()
        } else {
            console.log('🏠 No user found, showing landing page')
            showLandingPage()
        }

        // Set up auth state listener
        auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session)
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user
                // Don't auto-redirect - let user choose when to enter the app
                console.log('User signed in:', currentUser.email)
            } else if (event === 'SIGNED_OUT') {
                currentUser = null
                // Remove chatbot when user signs out
                if (chatbot) {
                    const chatbotToggle = document.getElementById('chatbot-toggle')
                    const chatbotWindow = document.getElementById('chatbot-window')
                    if (chatbotToggle) chatbotToggle.remove()
                    if (chatbotWindow) chatbotWindow.remove()
                    chatbot = null
                }
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
        
        // Update current date
        updateCurrentDate()
        
        // Listen for demo login event
        document.addEventListener('demoLogin', async () => {
            // Demo credentials (should match a user in your Supabase or be created on the fly)
            const demoEmail = 'demo@busybob.com'
            const demoPassword = 'busybobdemo'
            try {
                // Try to sign in
                const { data, error } = await auth.signIn(demoEmail, demoPassword)
                if (error && error.message.includes('Invalid login credentials')) {
                    // If user doesn't exist, sign up
                    const { error: signupError } = await auth.signUp(demoEmail, demoPassword, 'Demo User')
                    if (signupError) throw signupError
                    // Try sign in again
                    await auth.signIn(demoEmail, demoPassword)
                } else if (error) {
                    throw error
                }
                
                // Ensure user record exists in users table
                await db.ensureUser()
                
                // Populate demo data
                await db.populateDemoData()
                
                // Show main app
                showMainApp()
                
                // Load data after a short delay to ensure demo data is processed
                setTimeout(async () => {
                    try {
                        await loadAllData()
                        ui.showMessage('Logged in as demo user with sample data!', 'success')
                    } catch (loadError) {
                        console.error('Error loading demo data:', loadError)
                        ui.showMessage('Demo data loaded, but some items may not appear. Please refresh if needed.', 'warning')
                    }
                }, 1000)
                
            } catch (err) {
                console.error('Demo login error:', err)
                ui.showMessage('Demo login failed: ' + err.message, 'error')
            }
        })
        
        console.log('🎉 App initialization complete!')
        
    } catch (error) {
        console.error('❌ Error during app initialization:', error)
        // Show error message to user
        document.body.innerHTML = `
            <div class="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div class="text-red-600 text-center mb-4">
                        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                        <h2 class="text-xl font-bold text-gray-900">Oops! Something went wrong</h2>
                        <p class="text-gray-600 mt-2">There was an error loading the app. Please refresh the page and try again.</p>
                        <p class="text-sm text-gray-500 mt-4">Error: ${error.message}</p>
                        <button onclick="window.location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        `
    }
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
        } else if (e.target.id === 'reflection-form') {
            handleReflectionSubmit(e)
        }
    })
    
    // Sign out button (exists in main app)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'sign-out-btn') {
            signOut()
        } else if (e.target.id === 'google-login' || e.target.id === 'google-signup') {
            handleGoogleAuth()
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
        
        // Show success message with continue button
        showSignInSuccess()
    } catch (error) {
        ui.showMessage(error.message, 'error')
    }
}

function showSignInSuccess() {
    const authContainer = document.getElementById('auth-container')
    authContainer.innerHTML = `
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <div class="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <span class="text-white font-black text-2xl">✓</span>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back to Busy <span class="text-orange-500">BOB</span>!
                </h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Ready to get productive? Let's dive into your dashboard.
                </p>
            </div>

            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 card-hover space-y-4">
                <button id="continue-to-dashboard" class="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                    Continue to Dashboard →
                </button>
                
                <button id="back-to-home" class="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    ← Back to Home
                </button>
            </div>
        </div>
    `
    
    // Add event listeners after the HTML is inserted
    setTimeout(() => {
        const continueBtn = document.getElementById('continue-to-dashboard')
        const backBtn = document.getElementById('back-to-home')
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                console.log('Continue to dashboard clicked')
                showMainApp()
            })
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('Back to home clicked')
                showLandingPage()
            })
        }
    }, 0)
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
        currentUser = null
        
        // Remove chatbot when user signs out
        if (chatbot) {
            const chatbotToggle = document.getElementById('chatbot-toggle')
            const chatbotWindow = document.getElementById('chatbot-window')
            if (chatbotToggle) chatbotToggle.remove()
            if (chatbotWindow) chatbotWindow.remove()
            chatbot = null
        }
        
        showLandingPage()
        ui.showMessage('Signed out successfully', 'success')
    } catch (error) {
        console.error('Error signing out:', error)
        ui.showMessage('Error signing out', 'error')
    }
}

// Social Authentication functions
async function handleGoogleAuth() {
    try {
        ui.showMessage('Redirecting to Google...', 'info')
        const { data, error } = await auth.signInWithGoogle()
        
        if (error) throw error
        
        // OAuth will redirect, so we don't need to handle success here
    } catch (error) {
        ui.showMessage(error.message, 'error')
    }
}

// UI Navigation
function showLandingPage() {
    console.log('🏠 Showing landing page...')
    const authContainer = document.getElementById('auth-container')
    const mainApp = document.getElementById('main-app')
    
    if (!authContainer) {
        console.error('❌ auth-container element not found!')
        return
    }
    
    if (!mainApp) {
        console.error('❌ main-app element not found!')
        return
    }
    
    // Clean up any existing chatbot elements
    const existingChatbotToggle = document.getElementById('chatbot-toggle')
    const existingChatbotWindow = document.getElementById('chatbot-window')
    if (existingChatbotToggle) existingChatbotToggle.remove()
    if (existingChatbotWindow) existingChatbotWindow.remove()
    
    authContainer.classList.remove('hidden')
    mainApp.classList.add('hidden')
    
    // Load landing page content
    console.log('📄 Mounting landing page content...')
    landingPage.mount(authContainer)
    console.log('✅ Landing page mounted successfully!')
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
    
    // Initialize chatbot only when showing main app
    if (!chatbot) {
        console.log('🤖 Initializing chatbot for authenticated user...')
        chatbot = new Chatbot()
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
            loadJournalData()
            break
        case 'grades':
            if (grades) {
                grades.init()
            }
            break
    }
}

// Data loading functions
async function loadAllData() {
    try {
        console.log('🔄 Starting to load all data...')
        
        const results = await Promise.allSettled([
            loadTasks(),
            loadFeelings(),
            loadJournalData()
        ])
        
        // Check for any failures
        const failures = results.filter(result => result.status === 'rejected')
        if (failures.length > 0) {
            console.error('Some data loading failed:', failures)
            failures.forEach(failure => {
                console.error('Data loading error:', failure.reason)
            })
        }
        
        console.log('✅ Data loading completed')
        loadHomeData()
        loadCharts()
        
    } catch (error) {
        console.error('❌ Error in loadAllData:', error)
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
        <div class="task-item border rounded-lg p-3 sm:p-4 ${priorityClass} ${statusClass} card-hover" data-task-id="${task.id}">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})"
                           class="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-75' : ''} text-sm sm:text-base break-words">${task.title}</h3>
                        <div class="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
                            <span class="text-xs px-2 py-1 rounded-full ${taskUtils.getCategoryColor(task.category)} whitespace-nowrap">${task.category}</span>
                            <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                ${dateUtils.formatDateTime(task.due_date, task.due_time)}
                            </span>
                            <span class="text-xs ${taskUtils.getPriorityColor(task.priority)} whitespace-nowrap">
                                ${taskUtils.getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                            </span>
                        </div>
                        ${task.description ? `<p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 break-words">${task.description}</p>` : ''}
                    </div>
                </div>
                <button onclick="deleteTask(${task.id})" class="text-red-500 hover:text-red-700 p-2 ml-2 flex-shrink-0">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    
    if (dayTasks.length > 0) {
        selectedTasksContainer.innerHTML = dayTasks.map(task => createTaskHTML(task)).join('')
    } else {
        selectedTasksContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No tasks for this date.</p>'
    }
}

async function loadFeelings() {
    try {
        const { data, error } = await db.getFeelings()
        if (error) throw error
        
        feelings = data || []
    } catch (error) {
        console.error('Error loading feelings:', error)
        ui.showMessage('Error loading mood data', 'error')
    }
}

async function loadJournalData() {
    try {
        const { data, error } = await db.getJournalEntries()
        if (error) throw error
        journalEntries = data || []
        
        renderPastJournalEntries()
        renderTodaysReflection()
        calculateAndRenderStreak()
        setupJournalListeners()
    } catch (error) {
        console.error('Error loading journal entries:', error)
        ui.showMessage('Error loading journal entries', 'error')
    }
}

function renderTodaysReflection() {
    const today = new Date().toISOString().split('T')[0]
    const todaysEntry = journalEntries.find(entry => entry.created_at.startsWith(today))
    
    const contentTextarea = document.getElementById('reflection-content')
    const charCount = document.getElementById('reflection-char-count')
    const saveButton = document.getElementById('save-reflection-btn')

    if (todaysEntry) {
        contentTextarea.value = todaysEntry.content
        saveButton.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        saveButton.disabled = true
    } else {
        contentTextarea.value = ''
        saveButton.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        saveButton.disabled = false
    }

    const count = contentTextarea.value.length
    charCount.textContent = `${count}`
    document.getElementById('reflection-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function renderPastJournalEntries() {
    const listContainer = document.getElementById('journal-entries-list')
    if (!listContainer) return

    const sortedEntries = journalEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    if (sortedEntries.length > 0) {
        listContainer.innerHTML = sortedEntries.map(entry => `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${new Date(entry.created_at).toLocaleDateString()}</p>
                <p class="text-gray-800 dark:text-gray-200">${entry.content}</p>
            </div>
        `).join('')
    } else {
        listContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No past entries yet.</p>'
    }
}

function calculateAndRenderStreak() {
    if (journalEntries.length === 0) {
        document.getElementById('journal-streak-count').textContent = '0'
        return
    }

    const entryDates = [...new Set(journalEntries.map(e => e.created_at.split('T')[0]))].sort().reverse();
    
    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if the most recent entry is today or yesterday
    if (entryDates[0] === todayStr || entryDates[0] === yesterdayStr) {
        streak = 1;
        for (let i = 0; i < entryDates.length - 1; i++) {
            const current = new Date(entryDates[i]);
            const next = new Date(entryDates[i+1]);
            
            const diffTime = current - next;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else {
                break; // Streak is broken
            }
        }
    }
    
    document.getElementById('journal-streak-count').textContent = streak.toString()

    // Update streak badges
    document.querySelectorAll('.streak-badge').forEach(badge => {
        if (streak >= parseInt(badge.dataset.streak, 10)) {
            badge.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200', 'font-semibold', 'p-2', 'rounded-lg');
        } else {
            badge.classList.remove('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200', 'font-semibold', 'p-2', 'rounded-lg');
        }
    });
}

function setupJournalListeners() {
    const todayTab = document.getElementById('journal-today-tab');
    const pastTab = document.getElementById('journal-past-tab');
    const todayView = document.getElementById('journal-today-view');
    const pastView = document.getElementById('journal-past-view');

    todayTab.addEventListener('click', () => {
        todayTab.classList.add('active-tab', 'border-blue-500', 'text-gray-800', 'dark:text-white');
        todayTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        pastTab.classList.remove('active-tab', 'border-blue-500', 'text-gray-800', 'dark:text-white');
        pastTab.classList.add('text-gray-500', 'dark:text-gray-400');
        todayView.classList.remove('hidden');
        pastView.classList.add('hidden');
    });

    pastTab.addEventListener('click', () => {
        pastTab.classList.add('active-tab', 'border-blue-500', 'text-gray-800', 'dark:text-white');
        pastTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        todayTab.classList.remove('active-tab', 'border-blue-500', 'text-gray-800', 'dark:text-white');
        todayTab.classList.add('text-gray-500', 'dark:text-gray-400');
        pastView.classList.remove('hidden');
        todayView.classList.add('hidden');
    });

    const contentTextarea = document.getElementById('reflection-content');
    const charCount = document.getElementById('reflection-char-count');
    contentTextarea.addEventListener('input', () => {
        const count = contentTextarea.value.length;
        charCount.textContent = `${count}`;
        document.getElementById('save-reflection-btn').disabled = false;
    });
}

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
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        ui.showMessage(`Error creating task: ${error.message || 'Unknown error'}`, 'error')
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
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        ui.showMessage(`Error logging mood: ${error.message || 'Unknown error'}`, 'error')
    }
}

async function handleReflectionSubmit(event) {
    event.preventDefault()
    const form = event.target
    const content = form.querySelector('#reflection-content').value
    
    if (content.length < 1 || content.length > 280) {
        ui.showMessage('Reflection must be between 1 and 280 characters.', 'error')
        return
    }
    
    try {
        const today = new Date().toISOString().split('T')[0]
        const todaysEntry = journalEntries.find(entry => entry.created_at.startsWith(today))

        if (todaysEntry) {
            // Update existing entry
            await db.updateJournalEntry(todaysEntry.id, content)
        } else {
            // Create new entry
            await db.addJournalEntry(content)
        }
        
        ui.showMessage('Reflection saved!', 'success')
        await loadJournalData() // Reload all journal data to update streak and views
        
    } catch (error) {
        console.error('Error saving journal entry:', error)
        ui.showMessage('Could not save reflection.', 'error')
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

