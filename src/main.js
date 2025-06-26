import { auth, supabase } from './lib/supabase.js'
import { db } from './lib/offline-db.js'
import { Calendar } from './components/Calendar.js'
import { EnhancedAIAgent } from './components/EnhancedAIAgent.js'
import { PomodoroTimer } from './components/PomodoroTimer.js'
import { PointsSystem } from './components/PointsSystem.js'
import { AuthPages } from './components/AuthPages.js'
import { Navigation } from './components/Navigation.js'
import { LandingPage } from './components/LandingPage.js'
import { AcademicHub } from './components/AcademicHub.js'
import { Music } from './components/Music.js'
import { AINotes } from './components/AINotes.js'
import { Settings } from './components/Settings.js'
import { PrivacyPolicy } from './components/PrivacyPolicy.js'
import { TermsOfService } from './components/TermsOfService.js'
import { theme, dateUtils, taskUtils, ui, animations, validation } from './utils/helpers.js'
import { kidMode } from './utils/kid-mode.js'
import { offlineStatus } from './components/OfflineStatus.js'
import { MultiAgentSystem, MultiAgentWidgets } from './components/MultiAgentSystem.js'
// Import agentic AI system
import './agentic-ai/agents.js'
import './agentic-ai/agentic-ai.js'
import './styles/agentic-ai.css'
// Import Voice AI
import VoiceAI from './components/VoiceAI.js'
import './lib/elevenlabs-voice.js'

console.log('🚀 Main.js loaded - starting initialization...')

// Global state
let currentUser = null
let tasks = []
let journalEntries = []
let calendar = null 
let aiAgent = null
let pomodoroTimer = null
let pointsSystem = null
let navigation = null
let authPages = null
let landingPage = null
let academicHub = null
let music = null
let aiNotes = null
let settings = null
let privacyPolicy = null
let termsOfService = null
let multiAgentSystem = null
let voiceAI = null

const moodManager = {
    feelings: [],
    lastCheckedDate: null,

    async init() {
        await this.load()
        this.ui.render()
        this.checkPrompt()
    },

    async load() {
        try {
            const { data, error } = await db.getFeelings()
            if (error) throw error
            this.feelings = data || []
        } catch (error) {
            console.error("Error loading feelings:", error)
            ui.showMessage("Failed to load mood data.", "error")
        }
    },

    async log(rating, date) {
        try {
            const feelingData = { rating }
            if (date) {
                feelingData.created_at = date.toISOString()
            }
            const { data, error } = await db.createFeeling(feelingData)
            if (error) throw error

            await this.load() // Reload all feelings
            this.ui.render()
            ui.showMessage("Mood logged successfully!", "success")

            // Award points for mood logging
            if (window.pointsSystem) {
                try {
                    const points = window.pointsSystem.getPointValue('moodLogged')
                    await window.pointsSystem.awardPoints(points, 'Mood logged', 'mood')
                } catch (pointsError) {
                    console.error('Error awarding points for mood:', pointsError)
                }
            }

            if (window.loadHomeData) window.loadHomeData()

        } catch (error) {
            console.error("Error logging mood:", error)
            ui.showMessage("Failed to save mood.", "error")
        }
    },

    checkPrompt() {
        const today = new Date().toDateString()
        if (this.lastCheckedDate === today) return

        this.lastCheckedDate = today
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const yesterdayFeeling = this.feelings.find(f => f.created_at.startsWith(yesterdayStr))
        const todayFeeling = this.feelings.find(f => f.created_at.startsWith(new Date().toISOString().split('T')[0]))

        if (!todayFeeling && !yesterdayFeeling) {
            const lastFeelingDate = this.feelings.length > 0 ? new Date(this.feelings[0].created_at) : null
            if (lastFeelingDate) {
                const daysSinceLastLog = (new Date() - lastFeelingDate) / (1000 * 60 * 60 * 24)
                if (daysSinceLastLog > 1) {
                    this.ui.showYesterdayPrompt()
                }
            } else {
                 this.ui.showYesterdayPrompt()
            }
        }
    },

    ui: {
        render() {
            const container = document.getElementById('mood-logging-section')
            if (!container) return

            const today = new Date().toISOString().split('T')[0]
            const todaysFeeling = moodManager.feelings.find(f => f.created_at.startsWith(today))

            if (todaysFeeling) {
                container.innerHTML = this.renderLoggedState(todaysFeeling)
            } else {
                container.innerHTML = this.renderLoggingForm()
                this.addFormEventListeners()
            }
        },

        renderLoggingForm() {
            return `
                <div class="space-y-4">
                    <div class="flex justify-around">
                        ${[1, 2, 3, 4, 5].map(rating => this.renderMoodButton(rating)).join('')}
                    </div>
                    <button id="save-mood-btn" class="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" disabled>
                        Save Mood
                    </button>
                </div>
            `
        },

        renderMoodButton(rating) {
            const emojis = ['😞', '😕', '😐', '🙂', '😄']
            return `
                <button data-rating="${rating}" class="mood-btn w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                    ${emojis[rating-1]}
                </button>
            `
        },

        renderLoggedState(feeling) {
            const emojis = ['😞', '😕', '😐', '🙂', '😄']
            return `
                <div class="text-center">
                    <p class="text-sm text-white/80 mb-3">Today's Mood:</p>
                    <div class="text-6xl mb-3">${emojis[feeling.rating - 1]}</div>
                    <p class="font-semibold text-white text-lg">You felt ${this.getRatingText(feeling.rating)}</p>
                    <p class="text-white/60 text-sm mt-2">Thanks for checking in!</p>
                </div>
            `
        },

        getRatingText(rating) {
            return ['Very Bad', 'Bad', 'Okay', 'Good', 'Excellent'][rating - 1]
        },

        addFormEventListeners() {
            let selectedRating = 0
            const saveBtn = document.getElementById('save-mood-btn')

            document.querySelectorAll('#mood-logging-section .mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#mood-logging-section .mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'))
                    btn.classList.add('ring-2', 'ring-blue-500')
                    selectedRating = parseInt(btn.dataset.rating)
                    saveBtn.disabled = false
                })
            })

            saveBtn.addEventListener('click', () => {
                if (selectedRating > 0) {
                    moodManager.log(selectedRating)
                }
            })
        },

        showYesterdayPrompt() {
            const promptHTML = `
                <div id="yesterday-mood-prompt" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">How was yesterday?</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">You didn't log your mood. Taking a moment to reflect can be helpful.</p>
                        <div class="flex justify-around mb-4">
                            ${[1, 2, 3, 4, 5].map(rating => this.renderMoodButton(rating)).join('')}
                        </div>
                        <div class="flex gap-2">
                            <button id="save-yesterday-mood" class="flex-1 btn-gradient text-white py-2 px-4 rounded-lg text-sm" disabled>Save</button>
                            <button id="dismiss-yesterday-prompt" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg text-sm">Dismiss</button>
                        </div>
                    </div>
                </div>
            `
            document.body.insertAdjacentHTML('beforeend', promptHTML)

            let selectedRating = 0
            const saveBtn = document.getElementById('save-yesterday-mood')
            const promptEl = document.getElementById('yesterday-mood-prompt')

            promptEl.querySelectorAll('.mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    promptEl.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'))
                    btn.classList.add('ring-2', 'ring-blue-500')
                    selectedRating = parseInt(btn.dataset.rating)
                    saveBtn.disabled = false
                })
            })

            saveBtn.addEventListener('click', async () => {
                if (selectedRating > 0) {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    await moodManager.log(selectedRating, yesterday)
                    promptEl.remove()
                }
            })

            document.getElementById('dismiss-yesterday-prompt').addEventListener('click', () => {
                promptEl.remove()
            })
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, calling initializeApp...')
    initializeApp()
})

async function initializeApp() {
    try {
        console.log('🔧 Starting app initialization...')

        // Check for direct URL access to legal pages
        const path = window.location.pathname
        if (path === '/privacy-policy' || path === '/terms-of-service') {
            const page = path === '/privacy-policy' ? 'privacy-policy' : 'terms-of-service'
            console.log(`📄 Direct access to ${page} detected`)

            // Initialize components needed for legal pages
            console.log('📦 Creating components...')
            authPages = new AuthPages()
            navigation = new Navigation()
            landingPage = new LandingPage()
            academicHub = new AcademicHub()
            calendar = new Calendar('calendar-container', onDateSelect)
            music = new Music()
            aiNotes = new AINotes()
            settings = new Settings(calendar)
            privacyPolicy = new PrivacyPolicy()
            termsOfService = new TermsOfService()

            // Initialize theme
            console.log('🎨 Initializing theme...')
            theme.initialize()

            // Set up theme toggle
            console.log('🌙 Setting up theme toggle...')
            document.getElementById('theme-toggle').addEventListener('click', theme.toggle)

            // Show main app and navigate to legal page
            await showMainApp()
            setTimeout(() => {
                showPage(page)
                console.log(`✅ Navigated to ${page} page`)
            }, 100)

            // Set up event listeners
            setupFormListeners()
            setupNavigationListeners()

            console.log('🎉 Legal page initialization complete!')
            return
        }

        // Initialize theme
        console.log('🎨 Initializing theme...')
        theme.initialize()

        // Initialize components
        console.log('📦 Creating components...')
        authPages = new AuthPages()
        navigation = new Navigation()
        landingPage = new LandingPage()
        academicHub = new AcademicHub()
        music = new Music()
        aiNotes = new AINotes()
        settings = new Settings(calendar)
        privacyPolicy = new PrivacyPolicy()
        termsOfService = new TermsOfService()
        console.log('✅ Components created successfully')

        // Initialize gamification systems
        console.log('🎮 Initializing gamification systems...')
        try {
            pointsSystem = new PointsSystem()
            await pointsSystem.init()
            window.pointsSystem = pointsSystem
            console.log('✅ Points System initialized')

            pomodoroTimer = new PomodoroTimer()
            await pomodoroTimer.init()
            window.pomodoroTimer = pomodoroTimer
            console.log('✅ Pomodoro Timer initialized')
        } catch (gameError) {
            console.error('❌ Error initializing gamification systems:', gameError)
        }

        // Initialize Enhanced AI Agent
        console.log('🤖 Initializing Enhanced AI Agent...')
        try {
            aiAgent = new EnhancedAIAgent()
            await aiAgent.init()
            window.enhancedAI = aiAgent
            console.log('✅ Enhanced AI Agent initialized')
        } catch (aiError) {
            console.error('❌ Error initializing AI Agent:', aiError)
        }

        // Initialize Voice AI
        console.log('🎤 Initializing Voice AI...')
        try {
            const voiceAIContainer = document.getElementById('voice-ai-container')
            if (voiceAIContainer) {
                voiceAI = new VoiceAI(voiceAIContainer)
                window.voiceAI = voiceAI
                console.log('✅ Voice AI initialized')
            } else {
                console.log('⚠️ Voice AI container not found, skipping initialization')
            }
        } catch (voiceError) {
            console.error('❌ Error initializing Voice AI:', voiceError)
        }

        // Initialize Agentic AI system
        if (!agenticAI) {
            console.log('🤖 Initializing Agentic AI system for authenticated user...')
            agenticAI = new BusyBobAgenticAI()
            window.agenticAI = agenticAI // Make globally available for debugging/extensions
        }

        // Expose database globally for debugging
        window.db = db

        // Set up theme toggle
        console.log('🌙 Setting up theme toggle...')
        document.getElementById('theme-toggle').addEventListener('click', theme.toggle)

        // Check for Spotify auth completion
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('spotify_auth') === 'success') {
            console.log('🎵 Spotify auth detected, completing sign-in...')
            await handleSpotifyAuthCompletion()
            return
        }

        // Check authentication state
        console.log('🔐 Checking authentication state...')
        const { data: { user } } = await auth.getCurrentUser()

        if (user) {
            console.log('👤 User is authenticated, showing main app')
            currentUser = user

            // Initialize offline database for existing user
            try {
                console.log('💾 Initializing offline database for existing user...')
                await db.ensureUser()
                console.log('✅ Offline database initialized for existing user')
                
                // Test database connection
                const dbTest = await db.testDatabaseConnection()
                if (dbTest) {
                    console.log('✅ Database connection test passed')
                } else {
                    console.warn('⚠️ Database connection test failed')
                }
            } catch (dbError) {
                console.error('❌ Error initializing offline database for existing user:', dbError)
            }

            // Initialize Kid Mode
            console.log('🛡️ Initializing Kid Mode...')
            await kidMode.init()
            await applyKidModeStyles()

            // Initialize Enhanced Multi-Agent System
            console.log('🤖 Initializing Enhanced Multi-Agent System...')
            multiAgentSystem = new MultiAgentSystem()
            await multiAgentSystem.init()

            // Initialize Multi-Agent System Widgets
            console.log('🎨 Initializing Multi-Agent System Widgets...')
            window.multiAgentWidgets = new MultiAgentWidgets(multiAgentSystem)

            // Initialize Toolbox
            console.log('🛠️ Initializing Toolbox...')
            window.toolbox.init()

            showMainApp()
        } else {
            console.log('🏠 No user found, showing landing page')
            showLandingPage()
        }

        // Set up auth state listener
        auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session)
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user

                // Initialize offline database for new sign-in
                try {
                    console.log('💾 Initializing offline database for new sign-in...')
                    await db.ensureUser()
                    console.log('✅ Offline database initialized for new sign-in')
                    
                    // Test database connection
                    const dbTest = await db.testDatabaseConnection()
                    if (dbTest) {
                        console.log('✅ Database connection test passed')
                    } else {
                        console.warn('⚠️ Database connection test failed')
                    }
                } catch (dbError) {
                    console.error('❌ Error initializing offline database for new sign-in:', dbError)
                }

                // Initialize Kid Mode for new session
                console.log('🛡️ Initializing Kid Mode for new session...')
                await kidMode.init()
                await applyKidModeStyles()

                // Initialize Enhanced Multi-Agent System for new session
                console.log('🤖 Initializing Enhanced Multi-Agent System for new session...')
                multiAgentSystem = new MultiAgentSystem()
                await multiAgentSystem.init()

                // Don't auto-redirect - let user choose when to enter the app
                console.log('User signed in:', currentUser.email)
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

        // Legal page event listeners
        document.addEventListener('showLegalPage', (e) => {
            const { page } = e.detail
            showMainApp()
            setTimeout(() => {
                showPage(page)
            }, 100)
        })

        // Set up form listeners
        setupFormListeners()
        setupNavigationListeners()

        // Initialize calendar
        calendar = new Calendar('calendar-container', onDateSelect)

        // Update current date
        updateCurrentDate()

        // Start live clock
        updateLiveClock()
        setInterval(updateLiveClock, 1000)

        // Listen for demo login event
        document.addEventListener('demoLogin', async () => {
            // Demo credentials (should match a user in your Supabase or be created on the fly)
            const demoEmail = 'demo@busybob.com'
            const demoPassword = 'busybobdemo'
            try {
                console.log('🎮 Starting demo login...')
                
                // Try to sign in
                const { data, error } = await auth.signIn(demoEmail, demoPassword)
                if (error && error.message.includes('Invalid login credentials')) {
                    console.log('📝 Demo user not found, creating...')
                    // If user doesn't exist, sign up
                    const { error: signupError } = await auth.signUp(demoEmail, demoPassword, 'Demo User')
                    if (signupError) throw signupError
                    // Try sign in again
                    await auth.signIn(demoEmail, demoPassword)
                } else if (error) {
                    throw error
                }

                console.log('✅ Demo login successful')

                // Initialize offline database for demo user
                try {
                    console.log('💾 Initializing offline database for demo user...')
                    await db.ensureUser()
                    console.log('✅ Offline database initialized for demo user')
                    
                    // Test database connection
                    const dbTest = await db.testDatabaseConnection()
                    if (dbTest) {
                        console.log('✅ Database connection test passed')
                    } else {
                        console.warn('⚠️ Database connection test failed')
                    }
                } catch (dbError) {
                    console.error('❌ Error initializing offline database for demo user:', dbError)
                }

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
                console.error('❌ Demo login error:', err)
                ui.showMessage('Demo login failed: ' + err.message, 'error')
            }
        })

        console.log('🎉 App initialization complete!')

        // Add global function for Multi-Agent System
        window.getMultiAgentSystemStatus = () => {
            if (multiAgentSystem) {
                const status = multiAgentSystem.getSystemStatus()
                console.log('🤖 Multi-Agent System Status:', status)
                return status
            } else {
                console.log('❌ Multi-Agent System not initialized')
                return null
            }
        }

        // Add global function to test Multi-Agent System
        window.testMultiAgentSystem = async function(prompt) {
            try {
                if (!window.multiAgentSystem) {
                    console.error('Multi-agent system not initialized')
                    ui.showMessage('AI system not ready. Please refresh the page.', 'error')
                    return
                }

                console.log('🤖 Testing multi-agent system with prompt:', prompt)

                // Show loading state
                ui.showMessage('🤖 AI team is working on your request...', 'info')

                const result = await window.multiAgentSystem.processRequest(prompt)

                console.log('✅ Multi-agent system result:', result)

                // Show result in a nice format
                const message = result.success
                    ? `✅ ${result.response}`
                    : `❌ ${result.error || 'Something went wrong'}`

                ui.showMessage(message, result.success ? 'success' : 'error')

                // Update metrics
                if (window.multiAgentWidgets) {
                    window.multiAgentWidgets.updateMetrics()
                }

            } catch (error) {
                console.error('❌ Error testing multi-agent system:', error)
                ui.showMessage('Error testing AI system. Please try again.', 'error')
            }
        }

        // Add global database testing functions
        window.testDatabaseConnection = db.testDatabaseConnection
        window.testAllDatabaseOperations = db.testAllOperations
        window.getDatabaseStatus = db.getStatus

    } catch (error) {
        console.error('❌ Error during app initialization:', error)
        ui.showMessage('Failed to initialize app. Please refresh the page.', 'error')
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
        } else if (e.target.id === 'spotify-login' || e.target.id === 'spotify-signup') {
            handleSpotifyAuth()
        }
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

    // Settings navigation from components
    document.addEventListener('showSettings', () => {
        navigation.setActivePage('settings')
        showPage('settings')
    })
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault()

    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value

    try {
        console.log('🔐 Attempting login...')
        const { data, error } = await auth.signIn(email, password)
        if (error) throw error

        console.log('✅ Login successful')
        showSignInSuccess()
    } catch (error) {
        console.error('❌ Login error:', error)
        ui.showMessage('Login failed: ' + error.message, 'error')
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

    const email = document.getElementById('signup-email').value
    const password = document.getElementById('signup-password').value
    const name = document.getElementById('signup-name').value

    try {
        console.log('📝 Attempting signup...')
        const { data, error } = await auth.signUp(email, password, name)
        if (error) throw error

        console.log('✅ Signup successful')
        showSignInSuccess()
    } catch (error) {
        console.error('❌ Signup error:', error)
        ui.showMessage('Signup failed: ' + error.message, 'error')
    }
}

async function signOut() {
    try {
        console.log('🚪 Signing out user...')

        // Clear offline data first
        await db.clearUserData()
        console.log('🧹 Cleared offline user data')

        await auth.signOut()
        currentUser = null

        // Clear application state
        tasks = []
        journalEntries = []

        // Remove AI agent when user signs out
        if (aiAgent) {
            const aiAgentToggle = document.getElementById('ai-agent-toggle')
            const aiAgentWindow = document.getElementById('ai-agent-window')
            if (aiAgentToggle) aiAgentToggle.remove()
            if (aiAgentWindow) aiAgentWindow.remove()
            aiAgent = null
        }

        // Remove kid mode indicators and styles
        const kidModeIndicator = document.querySelector('.kid-mode-indicator')
        if (kidModeIndicator) kidModeIndicator.remove()

        const kidModeStyles = document.getElementById('kid-mode-styles')
        if (kidModeStyles) kidModeStyles.remove()

        document.body.classList.remove('kid-mode-active')

        // Offline status is only shown in Settings, no need to destroy

        showLandingPage()
        ui.showMessage('Signed out successfully - all offline data cleared', 'success')

        console.log('✅ User signed out successfully with data cleanup')
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

async function handleSpotifyAuth() {
    try {
        console.log('🎵 Starting Spotify authentication...')
        ui.showMessage('Redirecting to Spotify...', 'info')

        // Generate a random state for security
        const state = Math.random().toString(36).substring(2, 15)
        localStorage.setItem('spotify_auth_state', state)

        const scope = 'user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-library-read user-top-read user-read-recently-played playlist-read-private'

        const authUrl = new URL('https://accounts.spotify.com/authorize')
        authUrl.searchParams.append('response_type', 'code')
        authUrl.searchParams.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID')
        authUrl.searchParams.append('scope', scope)
        authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/spotify/callback`)
        authUrl.searchParams.append('state', state)
        authUrl.searchParams.append('show_dialog', 'true') // Force reauth for sign-in vs integration

        window.location.href = authUrl.toString()
    } catch (error) {
        console.error('❌ Error starting Spotify authentication:', error)
        ui.showMessage('Failed to start Spotify authentication', 'error')
    }
}

async function handleSpotifyAuthCompletion() {
    try {
        console.log('🎵 Completing Spotify authentication...')
        ui.showMessage('Completing Spotify sign-in...', 'info')

        // Get auth data from server
        const response = await fetch('/api/spotify/auth-data')
        if (!response.ok) {
            throw new Error('Failed to get auth data from server')
        }

        const authData = await response.json()
        console.log('🎵 Retrieved Spotify auth data:', authData.profile)

        // Create or sign in user with Spotify data
        const { data, error } = await auth.signInWithSpotify({
            email: authData.profile.email,
            name: authData.profile.display_name,
            spotifyId: authData.profile.id,
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            expiresAt: authData.expires_at
        })

        if (error) {
            throw error
        }

        console.log('✅ Spotify authentication completed successfully!')

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Show success and redirect to main app
        currentUser = data.user
        ui.showMessage('Welcome to BusyBob! Your Spotify account is connected.', 'success')
        showMainApp()

    } catch (error) {
        console.error('❌ Error completing Spotify authentication:', error)
        ui.showMessage(`Spotify sign-in failed: ${error.message}`, 'error')

        // Clean up URL and redirect to landing page
        window.history.replaceState({}, document.title, window.location.pathname)
        showLandingPage()
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

    // Clean up any existing AI elements
    const existingAIToggle = document.getElementById('ai-agent-toggle')
    const existingAIWindow = document.getElementById('ai-agent-window')
    if (existingAIToggle) existingAIToggle.remove()
    if (existingAIWindow) existingAIWindow.remove()

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

async function showMainApp() {
    try {
        console.log('🏠 Showing main app...')
        
        // Hide auth container and show main app
        const authContainer = document.getElementById('auth-container')
        const mainApp = document.getElementById('main-app')
        
        if (authContainer) {
            authContainer.classList.add('hidden')
        }
        
        if (mainApp) {
            mainApp.classList.remove('hidden')
        }
        
        // Update user info
        if (currentUser) {
            const userName = currentUser.user_metadata?.name || currentUser.email
            const userNameElement = document.getElementById('user-name')
            const welcomeNameElement = document.getElementById('welcome-name')
            
            if (userNameElement) {
                userNameElement.textContent = userName
            }
            
            if (welcomeNameElement) {
                welcomeNameElement.textContent = userName.split(' ')[0]
            }
        }

        // Initialize calendar if not already done
        if (!calendar) {
            console.log('📅 Initializing calendar...')
            calendar = new Calendar('calendar-container', onDateSelect)
        }

        // Load all data
        console.log('📊 Loading all application data...')
        await loadAllData()

        // Show home page by default
        showPage('home')

        console.log('✅ Main app displayed successfully')
    } catch (error) {
        console.error('❌ Error showing main app:', error)
        ui.showMessage('Failed to load main app', 'error')
    }
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

    // Control points widget visibility
    if (window.pointsSystem) {
        window.pointsSystem.showInSection(pageName)
    }

    // Cleanup development widgets if leaving home page
    if (pageName !== 'home' && window.cleanupDevelopmentWidgets) {
        window.cleanupDevelopmentWidgets()
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
        case 'academic-hub':
            if (academicHub) {
                academicHub.init()
            }
            break
        case 'music':
            if (music) {
                music.init()
            }
            break
        case 'ai-notes':
            if (aiNotes) {
                aiNotes.init()
            }
            break
        case 'agentic-ai':
            if (agenticAI) {
                // Initialize the agentic AI component if not already done
                if (!window.agenticAIComponent) {
                    window.agenticAIComponent = new AgenticAIComponent('agenticAI')
                }
            }
            break
        case 'settings':
            if (settings) {
                settings.init()
            }
            break
        case 'privacy-policy':
            if (privacyPolicy) {
                privacyPolicy.initializeHTML()
            }
            break
        case 'terms-of-service':
            if (termsOfService) {
                termsOfService.initializeHTML()
            }
            break
    }
}

// Data loading functions
async function loadAllData() {
    try {
        console.log('📊 Loading all application data...')
        
        // Load tasks
        console.log('📋 Loading tasks...')
        await loadTasks()
        
        // Load journal data
        console.log('📔 Loading journal data...')
        await loadJournalData()
        
        // Load mood data
        console.log('😊 Loading mood data...')
        await moodManager.load()
        
        // Load home data and charts
        console.log('🏠 Loading home data...')
        loadHomeData()
        loadCharts()
        
        console.log('✅ All data loaded successfully')
    } catch (error) {
        console.error('❌ Error loading all data:', error)
        ui.showMessage('Failed to load some data. Please refresh the page.', 'error')
    }
}

function loadHomeData() {
    // Update current date
    document.getElementById('current-date').textContent = dateUtils.getCurrentDate()

    // Update greeting time
    updateGreetingTime()

    // Update task count
    const pendingTasks = tasks.filter(task => !task.completed)
    document.getElementById('tasks-count').textContent = pendingTasks.length

    // Update mood average
    const feelings = moodManager.feelings;
    if (feelings.length > 0) {
        const recentFeelings = feelings.slice(0, 7) // Last 7 entries
        const average = recentFeelings.reduce((sum, feeling) => sum + feeling.rating, 0) / recentFeelings.length
        document.getElementById('mood-average').textContent = average.toFixed(1)
    } else {
        document.getElementById('mood-average').textContent = '-';
    }

    // Update streak (simplified calculation)
    document.getElementById('streak-count').textContent = Math.min(feelings.length, 30)

    // Load upcoming tasks
    loadUpcomingTasks()

    // Load development widgets
    loadDevelopmentWidgets()
}

function updateGreetingTime() {
    const hour = new Date().getHours()
    let greeting = 'morning'
    
    if (hour >= 12 && hour < 17) {
        greeting = 'afternoon'
    } else if (hour >= 17 && hour < 22) {
        greeting = 'evening'
    } else if (hour >= 22 || hour < 5) {
        greeting = 'night'
    }
    
    const greetingElement = document.getElementById('greeting-time')
    if (greetingElement) {
        greetingElement.textContent = greeting
    }
}

function loadDevelopmentWidgets() {
    const container = document.getElementById('development-widgets-container')
    if (!container || !window.multiAgentWidgets) return

    try {
        container.innerHTML = window.multiAgentWidgets.generateDevelopmentWidgets()

        // Update metrics after a short delay to ensure DOM is ready
        setTimeout(() => {
            window.multiAgentWidgets.updateMetrics()
        }, 100)

        // Set up periodic metrics updates
        if (window.developmentMetricsInterval) {
            clearInterval(window.developmentMetricsInterval)
        }
        window.developmentMetricsInterval = setInterval(() => {
            window.multiAgentWidgets.updateMetrics()
        }, 10000) // Update every 10 seconds
    } catch (error) {
        console.error('Error loading development widgets:', error)
        container.innerHTML = '<div class="text-red-500 p-4">Error loading development features</div>'
    }
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
            <div class="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200">
                <div class="flex-1">
                    <div class="font-semibold text-sm text-gray-900 dark:text-white">${task.title}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ${dateUtils.formatDateTime(task.due_date, task.due_time)}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs px-3 py-1 rounded-full ${taskUtils.getPriorityColor(task.priority)} font-medium">
                        ${task.priority}
                    </span>
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
            </div>
        `).join('')
        : `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400 text-sm">No upcoming tasks</p>
                <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Add some tasks to get started!</p>
            </div>
        `
}

async function loadTasks() {
    try {
        console.log('📋 Loading tasks from database...')
        const { data, error } = await db.getTasks()
        
        if (error) {
            console.error('❌ Error loading tasks:', error)
            ui.showMessage('Failed to load tasks', 'error')
            return
        }
        
        tasks = data || []
        console.log(`✅ Loaded ${tasks.length} tasks`)
        renderTasks()
        
        // Update calendar with tasks
        if (calendar) {
            calendar.setTasks(tasks)
        }
    } catch (error) {
        console.error('❌ Error in loadTasks:', error)
        ui.showMessage('Failed to load tasks', 'error')
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list')
    if (!taskList) return

    taskList.innerHTML = tasks.length > 0
        ? tasks.map(task => createSimpleTaskHTML(task)).join('')
        : '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No tasks yet. Add your first task above!</p>'
}

function createSimpleTaskHTML(task) {
    return `
        <div class="todo-item border rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-700 card-hover" data-task-id="${task.id}">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}
                           onchange="toggleTask(${task.id})"
                           class="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-75' : ''} text-sm sm:text-base break-words">${task.title}</h3>
                        ${task.description ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${task.description}</p>` : ''}
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

    // Show all tasks instead of just selected date tasks
    titleElement.textContent = "All Tasks"

    if (tasks.length > 0) {
        selectedTasksContainer.innerHTML = tasks.map(task => createCalendarTaskHTML(task)).join('')
    } else {
        selectedTasksContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet. Add tasks from the Calendar!</p>'
    }
}

function createCalendarTaskHTML(task) {
    const isOverdue = task.due_date && dateUtils.isOverdue(task.due_date, task.due_time) && !task.completed
    const priorityClass = task.priority === 'high' ? 'border-l-4 border-l-red-500' :
                         task.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'

    return `
        <div class="task-item border rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-700 ${priorityClass} card-hover" data-task-id="${task.id}">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}
                           onchange="toggleTask(${task.id})"
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-75' : ''} text-sm break-words">${task.title}</h3>
                        ${task.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${task.description}</p>` : ''}
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            <span class="text-xs px-2 py-1 rounded-full ${taskUtils.getCategoryColor(task.category)} whitespace-nowrap">${task.category}</span>
                            ${task.due_date ? `<span class="text-xs text-gray-500 dark:text-gray-400">
                                ${dateUtils.formatDateTime(task.due_date, task.due_time)}
                            </span>` : ''}
                            ${isOverdue ? '<span class="text-xs text-red-500 font-medium">OVERDUE</span>' : ''}
                        </div>
                    </div>
                </div>
                <button onclick="deleteTask(${task.id})" class="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    `
}

async function loadJournalData() {
    try {
        console.log('📔 Loading journal data from database...')
        const { data, error } = await db.getJournalEntries()
        
        if (error) {
            console.error('❌ Error loading journal data:', error)
            ui.showMessage('Failed to load journal entries', 'error')
            return
        }
        
        journalEntries = data || []
        console.log(`✅ Loaded ${journalEntries.length} journal entries`)
        
        renderTodaysReflection()
        renderPastJournalEntries()
        calculateAndRenderStreak()
        setupJournalListeners()
    } catch (error) {
        console.error('❌ Error in loadJournalData:', error)
        ui.showMessage('Failed to load journal entries', 'error')
    }
}

function renderTodaysReflection() {
    const contentTextarea = document.getElementById('reflection-content')
    const charCount = document.getElementById('reflection-char-count')
    const saveButton = document.getElementById('save-reflection-btn')

    // Always start with a blank slate for a new entry
    contentTextarea.value = ''
    saveButton.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
    saveButton.disabled = true; // Initially disabled

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
            <div class="bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl shadow border border-white/20 relative card-hover">
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">${new Date(entry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p class="text-gray-600 dark:text-gray-400 text-sm mt-2">${entry.content}</p>
                <button onclick="deleteJournalEntry('${entry.id}')" class="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 opacity-50 hover:opacity-100 transition-opacity">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `).join('')
    } else {
        listContainer.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No entries yet</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by writing your first reflection.</p>
            </div>
        `
    }
}

function calculateAndRenderStreak() {
    const streakContainer = document.getElementById('journal-streak-count');
    if (!streakContainer) return;

    if (journalEntries.length === 0) {
        streakContainer.innerHTML = `
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M4 17v4m-2-2h4m1-12a9 9 0 011 17.928M15 3a9 9 0 011 17.928m-3.5 1.072L12 21l-1-4-4 1 1-4-4-1 4-1-1-4 4 1 1-4 1 4 4-1-4 4 1 4-1-4z"></path></svg>
            0 Day Streak
        `
        return
    }

    const entryDates = [...new Set(journalEntries.map(e => e.created_at.split('T')[0]))].sort().reverse();

    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
                break;
            }
        }
    }

    streakContainer.innerHTML = `
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10s5 2 7 0l2.657-2.657a8 8 0 010 11.314z"></path></svg>
        ${streak} Day Streak
    `
}

function setupJournalListeners() {
    const contentTextarea = document.getElementById('reflection-content');
    const charCount = document.getElementById('reflection-char-count');
    const saveButton = document.getElementById('save-reflection-btn');

    if(contentTextarea && charCount && saveButton) {
        contentTextarea.addEventListener('input', () => {
            const count = contentTextarea.value.length;
            charCount.textContent = `${count}`;
            saveButton.disabled = count === 0 || count > 280;
        });
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.target)

    const taskData = {
        title: formData.get('title'),
        description: formData.get('description') || '',
        category: 'general',
        priority: 'medium',
        due_date: null,
        due_time: null,
        stress_level: 3,
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

        ui.showMessage('Task added!', 'success')
        event.target.reset()

        // Add success animation
        const taskList = document.getElementById('task-list')
        if (taskList.firstElementChild) {
            animations.slideIn(taskList.firstElementChild, 'down', 300)
        }
    } catch (error) {
        console.error('Error creating task:', error)
        ui.showMessage(`Error adding task: ${error.message || 'Unknown error'}`, 'error')
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
        // Always create a new entry
        await db.addJournalEntry(content)

        // Award points for journal entry
        if (window.pointsSystem) {
            try {
                const wordCount = content.trim().split(/\s+/).length
                let points = window.pointsSystem.getPointValue('journalEntry')
                let reason = 'Journal entry created'

                // Bonus points for longer entries
                if (wordCount >= 50) {
                    points = window.pointsSystem.getPointValue('longJournalEntry')
                    reason = 'Long journal entry created'
                }

                await window.pointsSystem.awardPoints(points, reason, 'journal')
            } catch (pointsError) {
                console.error('Error awarding points for journal:', pointsError)
            }
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
        const { data, error } = await db.updateTask(taskId, { completed: !task.completed });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error("Update failed. No rows were updated. This might be due to security policies.");
        }

        const updatedTask = data[0];
        const taskIndex = tasks.findIndex(t => t.id === updatedTask.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
        }

        renderTasks();

        // Update calendar
        if (calendar) {
            calendar.setTasks(tasks);
            calendar.refreshTaskSidebar();
        }

        // Refresh home data
        loadHomeData();

        // Show feedback
        if (updatedTask.completed) {
            ui.showMessage('Task completed! Great job! 🎉', 'success');
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                animations.pulse(taskElement, 600);
            }
        } else {
            // Optional: show a message for marking task as incomplete
            ui.showMessage('Task marked as not complete.', 'info');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        ui.showMessage('Error updating task: ' + error.message, 'error');
        // No need to revert state as we are not doing optimistic updates anymore
        renderTasks(); // Re-render to ensure UI is consistent with data
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
            calendar.refreshTaskSidebar()
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
        renderPastJournalEntries()
        calculateAndRenderStreak()

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

function loadCharts() {
    // Mood chart
    const moodCtx = document.getElementById('moodChart')
    const feelings = moodManager.feelings;
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

function updateLiveClock() {
    const clockElement = document.getElementById('live-clock');
    if (clockElement) {
        const now = new Date();
        const timezone = localStorage.getItem('timezone');

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true // Or false for 24-hour format
        };

        if (timezone) {
            options.timeZone = timezone;
        }

        const timeString = now.toLocaleTimeString([], options);
        clockElement.textContent = timeString;
    }
}

// Listen for timezone changes from settings
window.addEventListener('timezoneChange', updateLiveClock);

// Kid Mode Functions
async function applyKidModeStyles() {
    if (!kidMode.isEnabled) return

    console.log('🎨 Applying Kid Mode styles...')

    // Add Kid Mode styles to the page
    const existingStyles = document.getElementById('kid-mode-styles')
    if (existingStyles) {
        existingStyles.remove()
    }

    const styleSheet = document.createElement('style')
    styleSheet.id = 'kid-mode-styles'
    styleSheet.textContent = kidMode.getKidModeStyles()
    document.head.appendChild(styleSheet)

    // Add Kid Mode indicator
    const existingIndicator = document.querySelector('.kid-mode-indicator')
    if (existingIndicator) {
        existingIndicator.remove()
    }

    const indicatorHtml = kidMode.renderKidModeIndicator()
    if (indicatorHtml) {
        document.body.insertAdjacentHTML('afterbegin', indicatorHtml)
    }

    // Apply Kid Mode class to body
    document.body.classList.add('kid-mode-active')

    // Restrict certain features
    applyKidModeRestrictions()

    // Initialize content filtering observer
    initKidModeObserver()

    console.log('✅ Kid Mode styles applied successfully')
}

function applyKidModeRestrictions() {
    if (!kidMode.isEnabled) return

    console.log('🚫 Applying Kid Mode restrictions...')

    // Hide Spotify integration if restricted
    if (kidMode.isFeatureRestricted('spotify_integration')) {
        const musicTab = document.querySelector('[data-page="music"]')
        if (musicTab) {
            musicTab.style.display = 'none'
        }
    }

    // Remove external links
    if (kidMode.isFeatureRestricted('external_links')) {
        const externalLinks = document.querySelectorAll('a[href*="http"]:not([href*="' + window.location.hostname + '"])')
        externalLinks.forEach(link => {
            link.setAttribute('href', '#')
            link.setAttribute('title', 'External links are disabled in Kid Mode')
            link.style.opacity = '0.5'
            link.style.pointerEvents = 'none'
        })
    }

    // Restrict file upload inputs
    if (kidMode.isFeatureRestricted('file_uploads')) {
        const fileInputs = document.querySelectorAll('input[type="file"]')
        fileInputs.forEach(input => {
            input.disabled = true
            input.style.opacity = '0.5'
        })
    }

    // Hide advanced settings
    if (kidMode.isFeatureRestricted('advanced_settings')) {
        const advancedSettings = document.querySelectorAll('.advanced-setting, .danger-zone')
        advancedSettings.forEach(setting => {
            setting.style.display = 'none'
        })
    }

    console.log('✅ Kid Mode restrictions applied')
}

// Apply content filtering
function applyKidModeContentFiltering() {
    if (!kidMode.isEnabled) return

    // Filter content in real-time
    const contentElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6')
    contentElements.forEach(element => {
        if (element.textContent) {
            element.textContent = kidMode.sanitizeContent(element.textContent)
        }
    })
}

// Initialize Kid Mode content filtering observer
function initKidModeObserver() {
    if (!kidMode.isEnabled) return

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Apply restrictions to new elements
                        if (kidMode.isFeatureRestricted('external_links')) {
                            const newLinks = node.querySelectorAll?.('a[href*="http"]:not([href*="' + window.location.hostname + '"])')
                            newLinks?.forEach(link => {
                                link.setAttribute('href', '#')
                                link.setAttribute('title', 'External links are disabled in Kid Mode')
                                link.style.opacity = '0.5'
                                link.style.pointerEvents = 'none'
                            })
                        }

                        // Apply content filtering
                        if (node.textContent) {
                            node.textContent = kidMode.sanitizeContent(node.textContent)
                        }
                    }
                })
            }
        })
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

// Make functions globally available for onclick handlers
window.toggleTask = toggleTask
window.deleteTask = deleteTask
window.deleteJournalEntry = deleteJournalEntry
window.loadHomeData = loadHomeData

// Global Kid Mode functions
window.kidMode = kidMode
window.applyKidModeStyles = applyKidModeStyles

// Toolbox functionality
window.toolbox = {
    isVisible: false,
    toolVisibility: {
        'academic-hub': true,
        'ai-notes': true,
        'music': true,
        'dev-tools': true
    },

    init() {
        this.loadToolVisibility()
        this.setupEventListeners()
        this.updateToolVisibility()
    },

    setupEventListeners() {
        // Toggle button
        document.getElementById('toolbox-toggle')?.addEventListener('click', () => this.toggle())

        // Close button
        document.getElementById('close-toolbox')?.addEventListener('click', () => this.hide())

        // Close on outside click
        document.addEventListener('click', (e) => {
            const toolbox = document.getElementById('toolbox-window')
            const toggle = document.getElementById('toolbox-toggle')
            if (this.isVisible && !toolbox?.contains(e.target) && !toggle?.contains(e.target)) {
                this.hide()
            }
        })
    },

    toggle() {
        this.isVisible = !this.isVisible
        const toolbox = document.getElementById('toolbox-window')
        if (this.isVisible) {
            toolbox?.classList.remove('hidden')
        } else {
            toolbox?.classList.add('hidden')
        }
    },

    show() {
        this.isVisible = true
        document.getElementById('toolbox-window')?.classList.remove('hidden')
    },

    hide() {
        this.isVisible = false
        document.getElementById('toolbox-window')?.classList.add('hidden')
    },

    loadToolVisibility() {
        try {
            const saved = localStorage.getItem('toolbox-visibility')
            if (saved) {
                this.toolVisibility = { ...this.toolVisibility, ...JSON.parse(saved) }
            }
        } catch (error) {
            console.error('Error loading tool visibility:', error)
        }
    },

    saveToolVisibility() {
        try {
            localStorage.setItem('toolbox-visibility', JSON.stringify(this.toolVisibility))
        } catch (error) {
            console.error('Error saving tool visibility:', error)
        }
    },

    updateToolVisibility() {
        Object.entries(this.toolVisibility).forEach(([toolId, isVisible]) => {
            const toolElement = document.getElementById(`${toolId}-tool`)
            if (toolElement) {  
                toolElement.style.display = isVisible ? 'block' : 'none'
            }
        })
    },

    setToolVisibility(toolId, isVisible) {
        this.toolVisibility[toolId] = isVisible
        this.saveToolVisibility()
        this.updateToolVisibility()
    }
}

// Global function to open tools
window.openTool = function(toolId) {
    console.log('🛠️ Opening tool:', toolId)

    // Hide toolbox first
    window.toolbox.hide()

    switch (toolId) {
        case 'academic-hub':
            showPage('academic-hub')
            break
        case 'ai-notes':
            showPage('ai-notes')
            break
        case 'music':
            showPage('music')
            break
        case 'dev-tools':
            // Show development widgets on home page
            showPage('home')
            // Scroll to development section
            setTimeout(() => {
                const devSection = document.getElementById('development-widgets-container')
                devSection?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
            break
        default:
            console.warn('Unknown tool:', toolId)
    }
}

// Cleanup function for development widgets.
window.cleanupDevelopmentWidgets = function() {
    if (window.developmentMetricsInterval) {
        clearInterval(window.developmentMetricsInterval)
        window.developmentMetricsInterval = null
    }
}

// Global debugging functions for Voice AI
window.testVoiceAI = async () => {
    if (window.voiceAI) {
        console.log('🎤 Testing Voice AI...');
        try {
            await window.voiceAI.speak('Hello! This is a test of the Voice AI system.');
            console.log('✅ Voice AI test successful');
        } catch (error) {
            console.error('❌ Voice AI test failed:', error);
        }
    } else {
        console.log('⚠️ Voice AI not initialized');
    }
};

window.testVoiceRecording = async () => {
    if (window.voiceAI) {
        console.log('🎤 Testing voice recording...');
        try {
            const result = await window.voiceAI.recordAndTranscribe();
            console.log('✅ Voice recording test successful:', result);
        } catch (error) {
            console.error('❌ Voice recording test failed:', error);
        }
    } else {
        console.log('⚠️ Voice AI not initialized');
    }
};

window.getVoiceAIVoices = () => {
    if (window.voiceAI) {
        const voices = window.voiceAI.getVoices();
        console.log('🎵 Available voices:', voices);
        return voices;
    } else {
        console.log('⚠️ Voice AI not initialized');
        return [];
    }
};

// Expose Voice AI globally for debugging
window.voiceAIDebug = {
    test: window.testVoiceAI,
    record: window.testVoiceRecording,
    getVoices: window.getVoiceAIVoices,
    speak: (text) => window.voiceAI?.speak(text),
    setVoice: (voiceId) => window.voiceAI?.setVoice(voiceId)
};