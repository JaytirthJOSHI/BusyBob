import { auth, supabase } from './lib/supabase.js'
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
import { MultiAgentSystem, MultiAgentWidgets } from './components/MultiAgentSystem.js'
// Import agentic AI system
import './agentic-ai/agents.js'
import './agentic-ai/agentic-ai.js'
import './styles/agentic-ai.css'

console.log('🚀 Main.js loaded - starting initialization...')

// Utility function to ensure profile exists
async function ensureProfileExists(userId) {
    try {
        console.log('🔍 Checking if profile exists for user:', userId)
        
        if (!userId) {
            throw new Error('User ID is required to ensure profile exists')
        }

        // Check if profile exists using maybeSingle to handle no results gracefully
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id, email, username')
            .eq('id', userId)
            .maybeSingle()

        if (checkError) {
            console.error('❌ Error checking profile existence:', checkError)
            throw new Error(`Failed to check profile existence: ${checkError.message}`)
        }

        if (!existingProfile) {
            // Profile doesn't exist, create it
            console.log('📝 Creating missing profile for user:', userId)
            
            // Get user info from auth
            const { data: { user }, error: userError } = await auth.getCurrentUser()
            
            if (userError) {
                console.error('❌ Error getting current user for profile creation:', userError)
                throw new Error(`Failed to get user info: ${userError.message}`)
            }

            if (!user) {
                throw new Error('No authenticated user found for profile creation')
            }
            
            const profileData = {
                id: userId,
                email: user.email || null,
                username: user.user_metadata?.name || user.email?.split('@')[0] || null,
                points: 0,
                lifetime_points: 0,
                level: 1,
                unlocked_rewards: [],
                settings: {}
            }

            console.log('📝 Inserting profile data:', profileData)

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([profileData])
                .select()
                .single()

            if (createError) {
                console.error('❌ Error creating profile:', createError)
                throw new Error(`Failed to create profile: ${createError.message}`)
            }
            
            console.log('✅ Profile created successfully:', newProfile)
        } else {
            console.log('✅ Profile already exists for user:', userId)
        }
        
        return true
    } catch (error) {
        console.error('❌ Error ensuring profile exists:', error)
        throw error
    }
}

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
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            // Load full history of user's mood data
            const { data, error } = await supabase
                .from('feelings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            
            if (error) throw error
            this.feelings = data || []
            console.log(`📊 Loaded ${this.feelings.length} mood entries from full history`)
        } catch (error) {
            console.error("Error loading feelings:", error)
            ui.showMessage("Failed to load mood data.", "error")
        }
    },

    async log(rating, date) {
        try {
            console.log('🎭 Starting mood logging with rating:', rating, 'date:', date)
            
            // Validate rating
            if (!rating || rating < 1 || rating > 5) {
                throw new Error('Invalid mood rating. Must be between 1 and 5.')
            }

            const { data: { user }, error: authError } = await auth.getCurrentUser()
            
            if (authError) {
                console.error('❌ Auth error while logging mood:', authError)
                throw new Error(`Authentication error: ${authError.message}`)
            }
            
            if (!user) {
                ui.showMessage("Please sign in to log your mood.", "error")
                return
            }

            console.log('👤 User authenticated for mood logging:', user.id)

            // Ensure profile exists before creating feeling
            console.log('🔍 Ensuring user profile exists...')
            await ensureProfileExists(user.id)

            const feelingData = { 
                rating: parseInt(rating),
                mood: this.ui.getRatingText(rating),
                intensity: rating * 20, // Convert 1-5 to 20-100 scale
                notes: '', // Ensure notes field exists
                user_id: user.id,
                created_at: date ? date.toISOString() : new Date().toISOString()
            }

            console.log('💾 Inserting feeling data:', feelingData)

            const { data, error } = await supabase
                .from('feelings')
                .insert(feelingData)
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error inserting feeling:', error)
                throw new Error(`Database error: ${error.message}`)
            }

            console.log('✅ Feeling saved successfully:', data)

            await this.load() // Reload all feelings
            this.ui.render()
            ui.showMessage("Mood logged successfully!", "success")

            // Award points for mood logging
            if (window.pointsSystem) {
                try {
                    const points = window.pointsSystem.getPointValue('moodLogged')
                    await window.pointsSystem.awardPoints(points, 'Mood logged', 'mood')
                    console.log('🎯 Points awarded for mood logging:', points)
                } catch (pointsError) {
                    console.error('Error awarding points for mood:', pointsError)
                }
            }

            if (window.loadHomeData) window.loadHomeData()

        } catch (error) {
            console.error("❌ Error logging mood:", error)
            ui.showMessage(`Failed to save mood: ${error.message}`, "error")
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
        calendar = new Calendar('calendar-container', onDateSelect)
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

        // Initialize Agentic AI system
        if (!agenticAI) {
            console.log('🤖 Initializing Agentic AI system for authenticated user...')
            agenticAI = new BusyBobAgenticAI()
            window.agenticAI = agenticAI // Make globally available for debugging/extensions
        }

        // Database exposed globally for debugging removed - using direct Supabase calls

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

            // Ensure user profile exists first
            console.log('👤 Ensuring user profile exists...')
            try {
                await ensureProfileExists(user.id)
                console.log('✅ User profile verified')
            } catch (error) {
                console.error('❌ Failed to ensure profile exists:', error)
                ui.showMessage('Failed to initialize user profile. Please try refreshing.', 'error')
            }

            // Database connection test
            try {
                console.log('💾 Testing database connection...')
                const { data: { user } } = await auth.getCurrentUser()
                if (user) {
                    console.log('✅ Database connection test passed')
                } else {
                    console.warn('⚠️ No authenticated user found')
                }
            } catch (dbError) {
                console.error('❌ Error testing database connection:', dbError)
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

                // Ensure user profile exists for new sign-in
                console.log('👤 Ensuring user profile exists for new sign-in...')
                try {
                    await ensureProfileExists(session.user.id)
                    console.log('✅ User profile verified for new sign-in')
                } catch (error) {
                    console.error('❌ Failed to ensure profile exists for new sign-in:', error)
                }

                // Database connection test for new sign-in
                try {
                    console.log('💾 Testing database connection for new sign-in...')
                    const { data: { user } } = await auth.getCurrentUser()
                    if (user) {
                        console.log('✅ Database connection test passed')
                    } else {
                        console.warn('⚠️ No authenticated user found')
                    }
                } catch (dbError) {
                    console.error('❌ Error testing database connection for new sign-in:', dbError)
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

                // Database connection test for demo user
                try {
                    console.log('💾 Testing database connection for demo user...')
                    const { data: { user } } = await auth.getCurrentUser()
                    if (user) {
                        console.log('✅ Database connection test passed')
                    } else {
                        console.warn('⚠️ No authenticated user found')
                    }
                } catch (dbError) {
                    console.error('❌ Error testing database connection for demo user:', dbError)
                }

                // Demo data population removed - using direct Supabase calls

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

    const emailInput = document.getElementById('login-email')
    const passwordInput = document.getElementById('login-password')
    
    if (!emailInput || !passwordInput) {
        console.warn('Login form elements not found in DOM')
        ui.showMessage('Login form not available. Please try again.', 'error')
        return
    }
    
    const email = emailInput.value
    const password = passwordInput.value

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

    const nameInput = document.getElementById('signup-name')
    const emailInput = document.getElementById('signup-email')
    const passwordInput = document.getElementById('signup-password')
    
    if (!nameInput || !emailInput || !passwordInput) {
        console.warn('Signup form elements not found in DOM')
        ui.showMessage('Signup form not available. Please try again.', 'error')
        return
    }
    
    const name = nameInput.value
    const email = emailInput.value
    const password = passwordInput.value

    try {
        console.log('📝 Attempting signup...')
        const { data, error } = await auth.signUp(email, password, name)
        if (error) throw error

        console.log('✅ Signup successful')
        ui.showMessage('Signup successful! Please check your email for a verification link.', 'success')
        showAuthPages('login')
    } catch (error) {
        console.error('❌ Signup error:', error)
        ui.showMessage('Signup failed: ' + error.message, 'error')
    }
}

async function signOut() {
    const isConfirmed = await ui.showConfirmation(
        'Are you sure you want to sign out?',
        'This will clear all your local data. This action cannot be undone.'
    )

    if (!isConfirmed) {
        return
    }

    try {
        console.log('🚪 Signing out and clearing all user data...')
        await auth.signOut()
        currentUser = null

        // Full cleanup for security
        console.log('🧹 Clearing all user data from device...')
        // Offline data clearing removed - using direct Supabase calls
        
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Local and session storage cleared.')

        // Reset UI components
        if (calendar) calendar.destroy()
        calendar = null
        if (pomodoroTimer) pomodoroTimer.destroy()
        pomodoroTimer = null
        if (pointsSystem) pointsSystem.destroy()
        pointsSystem = null
        if (aiAgent) aiAgent.destroy()
        aiAgent = null
        if (multiAgentSystem) multiAgentSystem.destroy()
        multiAgentSystem = null
        if(window.kidMode) window.kidMode.destroy()
        if (window.multiAgentWidgets) window.multiAgentWidgets.destroy()
        
        // Remove Kid Mode elements if they exist
        const kidModeIndicator = document.getElementById('kid-mode-indicator')
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
        authUrl.search_params.append('state', state)
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

        // Initialize components that need it once
        console.log('🔧 Initializing main components...')
        if (academicHub) academicHub.init()
        if (music) music.init()
        if (aiNotes) aiNotes.init()
        if (settings) settings.init()
        console.log('✅ Main components initialized.')

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
            break
        case 'music':
            break
        case 'ai-notes':
            break
        case 'settings':
            break
        case 'privacy-policy':
            if(privacyPolicy) {
                privacyPolicy.init(document.getElementById('privacy-policy-page'))
            }
            break
        case 'terms-of-service':
            if(termsOfService) {
                termsOfService.init(document.getElementById('terms-of-service-page'))
            }
            break
    }
}

// Data loading functions
async function loadAllData() {
    try {
        console.log('🔄 Loading all user data...')
        const dataPromises = [
            loadTasks(),
            loadJournalData(),
            moodManager.init(),
            pointsSystem.init(),
            pomodoroTimer.init(),
            kidMode.init(),
        ]

        await Promise.all(dataPromises)
        console.log('✅ All user data loaded successfully')

        loadHomeData()
        loadCalendar()
        loadCharts()
    } catch (error) {
        console.error('❌ Error loading all data:', error)
        ui.showMessage('Failed to load some of your data. Please try refreshing.', 'error')
    }
}

function loadHomeData() {
    // Update current date
    document.getElementById('current-date').textContent = dateUtils.getCurrentDate()

    // Update greeting time
    updateGreetingTime()

    // Update task count
    const pendingTasks = tasks.filter(t => !t.completed)
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
}

function updateGreetingTime() {
    const greetingElement = document.getElementById('greeting-time')
    if (greetingElement) {
        const hour = new Date().getHours()
        let greeting = 'Hello'
        if (hour < 12) {
            greeting = 'Good morning'
        } else if (hour < 18) {
            greeting = 'Good afternoon'
        } else {
            greeting = 'Good evening'
        }
        greetingElement.textContent = greeting
    }
}

function loadUpcomingTasks() {
    const upcomingTasksList = document.getElementById('upcoming-tasks-list')
    if (!upcomingTasksList) return

    upcomingTasksList.innerHTML = '' // Clear list

    const upcoming = tasks
        .filter(t => !t.completed)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5)

    if (upcoming.length === 0) {
        upcomingTasksList.innerHTML = '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No upcoming tasks. Great job!</p>'
        return
    }

    upcoming.forEach(task => {
        const li = document.createElement('li')
        li.className = 'py-3 flex items-center'
        li.innerHTML = createSimpleTaskHTML(task)
        upcomingTasksList.appendChild(li)
    })
}

// Task management functions
async function loadTasks() {
    try {
        console.log('📋 Loading tasks from database...')
        
        const { data: { user }, error: authError } = await auth.getCurrentUser()
        
        if (authError) {
            console.error('❌ Auth error while loading tasks:', authError)
            throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!user) {
            console.log('👤 No user authenticated, skipping task load')
            return
        }

        console.log('👤 Loading tasks for user:', user.id)

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true })
        
        if (error) {
            console.error('❌ Supabase error loading tasks:', error)
            throw new Error(`Database error: ${error.message}`)
        }
        
        tasks = data || []
        console.log(`✅ Loaded ${tasks.length} tasks from database`)
        renderTasks()
        
    } catch (error) {
        console.error('❌ Error loading tasks:', error)
        ui.showMessage(`Failed to load tasks: ${error.message}`, 'error')
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list')
    if (!taskList) return
    taskList.innerHTML = '' // Clear list

    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">No tasks yet. Add one to get started!</p>'
        return
    }

    tasks.forEach(task => {
        const li = document.createElement('li')
        li.className = 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow'
        li.innerHTML = createSimpleTaskHTML(task)
        taskList.appendChild(li)
    })
}

function createSimpleTaskHTML(task) {
    return `
        <div class="flex items-center w-full">
            <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" class="h-5 w-5 rounded-full border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer">
            <label for="task-${task.id}" class="ml-3 block text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}">${task.title}</label>
            <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">${dateUtils.formatDateTime(task.due_date)}</span>
            <button onclick="deleteTask('${task.id}')" class="ml-2 text-gray-400 hover:text-red-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `
}

function loadCalendar() {
    if (calendar) {
        calendar.render(tasks)
    }
}

function loadSelectedDateTasks(date) {
    const selectedTasks = tasks.filter(task => {
        const taskDate = new Date(task.due_date).toDateString()
        return taskDate === date.toDateString()
    })

    const selectedDateTasksList = document.getElementById('selected-date-tasks')
    if (!selectedDateTasksList) return

    selectedDateTasksList.innerHTML = '' // Clear list
    if (selectedTasks.length === 0) {
        selectedDateTasksList.innerHTML = '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No tasks for this day.</p>'
        return
    }

    selectedTasks.forEach(task => {
        const li = document.createElement('li')
        li.innerHTML = createCalendarTaskHTML(task)
        selectedDateTasksList.appendChild(li)
    })
}

function createCalendarTaskHTML(task) {
    return `
        <div class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
            <div>
                <p class="font-medium text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-300'}">${task.title}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${task.category || 'General'}</p>
            </div>
            <div class="flex items-center space-x-2">
                <input type="checkbox" id="cal-task-${task.id}" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" class="h-4 w-4 rounded-full border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer">
                <button onclick="deleteTask('${task.id}')" class="text-gray-400 hover:text-red-500">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    `
}

// Journaling functions
async function loadJournalData() {
    try {
        const { data: { user } } = await auth.getCurrentUser()
        if (!user) return

        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        journalEntries = data || []
        renderTodaysReflection()
        renderPastJournalEntries()
        calculateAndRenderStreak()
        setupJournalListeners()
    } catch (error) {
        console.error('Error loading journal data:', error)
        ui.showMessage('Failed to load journal entries', 'error')
    }
}

function renderTodaysReflection() {
    const today = new Date().toDateString()
    const todaysEntry = journalEntries.find(entry => new Date(entry.created_at).toDateString() === today)
    const reflectionContainer = document.getElementById('todays-reflection')
    
    if (!reflectionContainer) {
        console.warn('todays-reflection element not found in DOM')
        return
    }

    if (todaysEntry) {
        reflectionContainer.innerHTML = `
            <h3 class="font-bold text-lg mb-2">Today's Reflection</h3>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p class="text-gray-700 dark:text-gray-300">${todaysEntry.content}</p>
                <p class="text-right text-xs text-gray-500 mt-2">${new Date(todaysEntry.created_at).toLocaleTimeString()}</p>
            </div>
        `
    } else {
        const template = document.getElementById('reflection-form-template')
        if (template) {
            reflectionContainer.innerHTML = template.innerHTML;
        }
    }
}

function renderPastJournalEntries() {
    const pastEntriesList = document.getElementById('past-journal-entries')
    if (!pastEntriesList) {
        console.warn('past-journal-entries element not found in DOM')
        return
    }
    pastEntriesList.innerHTML = ''

    const pastEntries = journalEntries.slice(1, 6) // Get next 5 entries
    if (pastEntries.length === 0) {
        pastEntriesList.innerHTML = '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No past entries to show.</p>'
        return
    }

    pastEntries.forEach(entry => {
        const li = document.createElement('li')
        li.className = 'mb-4'
        li.innerHTML = `
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p class="text-sm text-gray-700 dark:text-gray-300">${entry.content}</p>
                <div class="flex justify-between items-center mt-2">
                    <p class="text-xs text-gray-500">${dateUtils.format(new Date(entry.created_at))}</p>
                    <button onclick="deleteJournalEntry('${entry.id}')" class="text-gray-400 hover:text-red-500 text-xs">Delete</button>
                </div>
            </div>
        `
        pastEntriesList.appendChild(li)
    })
}

function calculateAndRenderStreak() {
    let streak = 0
    const journalStreakEl = document.getElementById('journal-streak')
    if (!journalStreakEl) {
        console.warn('journal-streak element not found in DOM')
        return
    }

    if (journalEntries.length === 0) {
        journalStreakEl.textContent = 0
        return
    }

    const dates = journalEntries.map(e => new Date(e.created_at).toDateString()).reverse()
    const uniqueDates = [...new Set(dates)]

    let currentDate = new Date()
    // Check if today is in the list
    if (uniqueDates.includes(currentDate.toDateString())) {
        streak++
    }
    
    // Check for consecutive days
    for (let i = 0; i < uniqueDates.length; i++) {
        const entryDate = new Date(uniqueDates[i])
        const prevDate = new Date()
        prevDate.setDate(currentDate.getDate() - (i + 1))

        if (entryDate.toDateString() === prevDate.toDateString()) {
            streak++
        } else {
            break;
        }
    }
    
    journalStreakEl.textContent = streak
}

function setupJournalListeners() {
    const form = document.getElementById('reflection-form')
    if(form) {
        form.addEventListener('submit', handleReflectionSubmit)
    }

    const content = document.getElementById('journal-content')
    const charCount = document.getElementById('journal-char-count')

    if(content && charCount) {
        content.addEventListener('input', () => {
            charCount.textContent = `${content.value.length} / 500`
        })
    }
}

// Form submission handlers
async function handleTaskSubmit(event) {
    event.preventDefault()
    
    console.log('📝 Starting task submission...')
    
    const titleInput = document.getElementById('task-title')
    const dueDateInput = document.getElementById('task-due-date')
    
    if (!titleInput || !dueDateInput) {
        console.error('❌ Task form elements not found in DOM')
        ui.showMessage('Task form not available. Please try again.', 'error')
        return
    }
    
    const title = titleInput.value.trim()
    const dueDate = dueDateInput.value

    console.log('📝 Form data - Title:', title, 'Due Date:', dueDate)

    // Validate input
    if (!title || title.length === 0) {
        ui.showMessage('Please provide a task title.', 'error')
        return
    }

    if (!dueDate) {
        ui.showMessage('Please provide a due date.', 'error')
        return
    }

    // Validate date
    const dueDateObj = new Date(dueDate)
    if (isNaN(dueDateObj.getTime())) {
        ui.showMessage('Please provide a valid due date.', 'error')
        return
    }

    try {
        console.log('🔐 Getting current user...')
        const { data: { user }, error: authError } = await auth.getCurrentUser()
        
        if (authError) {
            console.error('❌ Auth error while creating task:', authError)
            throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!user) {
            ui.showMessage('Please sign in to add tasks.', 'error')
            return
        }

        console.log('👤 User authenticated for task creation:', user.id)

        // Ensure profile exists before creating task
        console.log('🔍 Ensuring user profile exists...')
        await ensureProfileExists(user.id)

        const taskData = {
            title: title,
            due_date: dueDateObj.toISOString(),
            completed: false,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        console.log('💾 Inserting task data:', taskData)

        const { data, error } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single()

        if (error) {
            console.error('❌ Supabase error inserting task:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        console.log('✅ Task saved successfully:', data)

        // Update local state
        tasks.push(data)
        
        // Update UI
        renderTasks()
        loadUpcomingTasks()
        loadCalendar()
        
        // Clear form
        titleInput.value = ''
        dueDateInput.value = ''
        
        // Award points for task creation
        if (window.pointsSystem) {
            try {
                const points = window.pointsSystem.getPointValue('taskCreated') || 5
                await window.pointsSystem.awardPoints(points, `Created: ${title}`, 'task')
                console.log('🎯 Points awarded for task creation:', points)
            } catch (pointsError) {
                console.error('Error awarding points for task creation:', pointsError)
            }
        }
        
        ui.showMessage('Task added successfully!', 'success')
        
    } catch (error) {
        console.error('❌ Error adding task:', error)
        ui.showMessage(`Failed to add task: ${error.message}`, 'error')
    }
}

async function handleReflectionSubmit(event) {
    event.preventDefault()
    const contentInput = document.getElementById('journal-content')
    
    if (!contentInput) {
        console.warn('journal-content element not found in DOM')
        ui.showMessage('Journal form not available. Please try again.', 'error')
        return
    }
    
    const content = contentInput.value.trim()

    if (!content) {
        ui.showMessage('Please write something for your reflection.', 'error')
        return
    }

    try {
        const { data: { user } } = await auth.getCurrentUser()
        if (!user) {
            ui.showMessage('Please sign in to save reflections.', 'error')
            return
        }

        // Ensure profile exists before creating journal entry
        await ensureProfileExists(user.id)

        const { error } = await supabase
            .from('journal_entries')
            .insert({
                content,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        if (error) throw error
        contentInput.value = ''
        ui.showMessage('Reflection saved!', 'success')
        await loadJournalData()
    } catch (error) {
        console.error('Error saving reflection:', error)
        ui.showMessage('Failed to save reflection.', 'error')
    }
}

// Data modification functions
async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
        const { data, error } = await supabase
            .from('tasks')
            .update({ 
                completed: !task.completed,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error
        
        // Update local state
        task.completed = !task.completed
        
        // Re-render UI
        renderTasks()
        loadUpcomingTasks()
        loadCalendar()
        loadSelectedDateTasks(calendar.currentDate)

        // Award points if task completed
        if (task.completed && window.pointsSystem) {
            try {
                const points = window.pointsSystem.getPointValue('taskCompleted')
                await window.pointsSystem.awardPoints(points, `Completed: ${task.title}`, 'task')
            } catch (pointsError) {
                console.error('Error awarding points for task:', pointsError)
            }
        }
        
        ui.showMessage(`Task "${task.title}" updated.`, 'success')
    } catch (error) {
        console.error('Error toggling task:', error)
        ui.showMessage('Failed to update task.', 'error')
    }
}

async function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const confirmed = await ui.showConfirmation(`Delete task "${task.title}"?`)
    if (!confirmed) return

    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) throw error
        tasks = tasks.filter(t => t.id !== taskId)
        renderTasks()
        loadUpcomingTasks()
        loadCalendar()
        ui.showMessage('Task deleted.', 'success')
    } catch (error) {
        console.error('Error deleting task:', error)
        ui.showMessage('Failed to delete task.', 'error')
    }
}

async function deleteJournalEntry(entryId) {
    const confirmed = await ui.showConfirmation('Delete this journal entry permanently?')
    if (!confirmed) return

    try {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', entryId)

        if (error) throw error
        journalEntries = journalEntries.filter(e => e.id !== entryId)
        renderTodaysReflection()
        renderPastJournalEntries()
        calculateAndRenderStreak()
        ui.showMessage('Journal entry deleted.', 'success')
    } catch (error) {
        console.error('Error deleting journal entry:', error)
        ui.showMessage('Failed to delete journal entry.', 'error')
    }
}

// Calendar callback
function onDateSelect(date) {
    loadSelectedDateTasks(date)
}

// Charting functions
function loadCharts() {
    // Example chart: Mood over time
    const moodChartCtx = document.getElementById('mood-chart')?.getContext('2d')
    if (moodChartCtx && moodManager.feelings.length > 0) {
        new Chart(moodChartCtx, {
            type: 'line',
            data: {
                labels: moodManager.feelings.map(f => dateUtils.format(new Date(f.created_at))).reverse(),
                datasets: [{
                    label: 'Mood Rating',
                    data: moodManager.feelings.map(f => f.rating).reverse(),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        })
    }

    // Example chart: Task completion
    const taskChartCtx = document.getElementById('task-chart')?.getContext('2d')
    if (taskChartCtx && tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.completed).length
        const pendingTasks = tasks.length - completedTasks

        new Chart(taskChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completedTasks, pendingTasks],
                    backgroundColor: ['#4ade80', '#f87171']
                }]
            },
            options: {
                responsive: true
            }
        })
    }
}

// Utility functions
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date')
    if(dateElement) {
        dateElement.textContent = dateUtils.getCurrentDate()
    }
}

function updateLiveClock() {
    const clockElement = document.getElementById('live-clock')
    if(clockElement) {
        clockElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}


// Kid Mode
async function applyKidModeStyles() {
    if (kidMode.isActive) {
        document.body.classList.add('kid-mode-active');
        const styleSheet = document.createElement("style");
        styleSheet.id = 'kid-mode-styles';
        styleSheet.innerText = kidMode.getKidModeStyles();
        document.head.appendChild(styleSheet);
    }
}

function applyKidModeRestrictions() {
    if (kidMode.isActive) {
        // Feature restrictions
        if (kidMode.isFeatureRestricted('settings')) {
            document.querySelector('[data-page="settings"]')?.classList.add('hidden');
        }
        if (kidMode.isFeatureRestricted('academic-hub')) {
            document.querySelector('[data-page="academic-hub"]')?.classList.add('hidden');
        }
        // ... add more restrictions as needed

        // Time restrictions
        if (kidMode.isTimeRestricted()) {
            // Disable the whole app except for a message
            const mainApp = document.getElementById('main-app');
            mainApp.innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold">Screen time is over for now!</h2>
                    <p>Come back later to continue your tasks.</p>
                </div>
            `;
        }
    }
}

function applyKidModeContentFiltering() {
    // This function will be called by the observer
    if (kidMode.isActive) {
        const allTextNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let currentNode;
        while (currentNode = allTextNodes.nextNode()) {
            currentNode.nodeValue = kidMode.sanitizeContent(currentNode.nodeValue);
        }
    }
}

function initKidModeObserver() {
    if (kidMode.isActive && kidMode.settings?.contentFiltering) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    applyKidModeContentFiltering();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

window.toolbox = {
    isOpen: false,
    
    init() {
        this.setupEventListeners();
        this.loadToolVisibility();
    },
    
    setupEventListeners() {
        const toggleBtn = document.getElementById('toolbox-toggle');
        const toolboxPanel = document.getElementById('toolbox-panel');

        toggleBtn?.addEventListener('click', () => this.toggle());
        
        document.addEventListener('keydown', (e) => {
            if(e.key === 't' && e.metaKey) {
                this.toggle();
            }
        });

        toolboxPanel?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.setToolVisibility(e.target.id, e.target.checked);
            }
        });
    },
    
    toggle() {
        const toolboxPanel = document.getElementById('toolbox-panel');
        if (toolboxPanel) {
            this.isOpen = !this.isOpen;
            toolboxPanel.classList.toggle('hidden', !this.isOpen);
        }
    },

    show() {
        const toolboxPanel = document.getElementById('toolbox-panel');
        if (toolboxPanel) {
            toolboxPanel.classList.remove('hidden');
            this.isOpen = true;
        }
    },

    hide() {
        const toolboxPanel = document.getElementById('toolbox-panel');
        if (toolboxPanel) {
            toolboxPanel.classList.add('hidden');
            this.isOpen = false;
        }
    },
    
    loadToolVisibility() {
        const visibility = JSON.parse(localStorage.getItem('toolboxVisibility')) || {};
        Object.keys(visibility).forEach(toolId => {
            const checkbox = document.getElementById(toolId);
            if(checkbox) checkbox.checked = visibility[toolId];
        });
        this.updateToolVisibility();
    },
    
    saveToolVisibility() {
        const checkboxes = document.querySelectorAll('#toolbox-panel input[type="checkbox"]');
        const visibility = {};
        checkboxes.forEach(cb => {
            visibility[cb.id] = cb.checked;
        });
        localStorage.setItem('toolboxVisibility', JSON.stringify(visibility));
    },
    
    updateToolVisibility() {
        const checkboxes = document.querySelectorAll('#toolbox-panel input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const toolElement = document.getElementById(cb.dataset.tool);
            if(toolElement) {
                toolElement.style.display = cb.checked ? '' : 'none';
            }
        });
    },

    setToolVisibility(toolId, isVisible) {
        this.toolVisibility[toolId] = isVisible;
        this.saveToolVisibility();
        this.updateToolVisibility();
    }
};

window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.deleteJournalEntry = deleteJournalEntry;
window.onDateSelect = onDateSelect;