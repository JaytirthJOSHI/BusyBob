import { auth, supabase } from '../lib/supabase.js'
import districts from '../lib/districts.js'
import { kidMode } from '../utils/kid-mode.js'
import { db } from '../lib/offline-db.js'

export class Settings {
    constructor(calendar) {
        this.calendar = calendar;
        this.studentVueConnected = false
        this.studentVueCredentials = null
        this.canvasConnected = false
        this.canvasCredentials = null
        this.googleConnected = false
        this.outlookConnected = false
        this.spotifyConnected = false
        this.spotifyProfile = null
        this.kidModeSettings = null
    }

    async init() {
        console.log('Initializing Settings component...')
        await this.loadConnectedAccounts()
        await this.loadKidModeSettings()
        this.render()
        this.setupEventListeners()
    }

    async loadConnectedAccounts() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

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

            const { data: spotifyData } = await supabase
                .from('music_connections')
                .select('*')
                .eq('user_id', user.id)
                .eq('provider', 'spotify')
                .single()

            this.spotifyConnected = !!spotifyData
            if (spotifyData) {
                try {
                    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
                        headers: {
                            'Authorization': `Bearer ${spotifyData.access_token}`
                        }
                    })
                    if (profileResponse.ok) {
                        this.spotifyProfile = await profileResponse.json()
                    }
                } catch (profileError) {
                    console.warn('Could not fetch Spotify profile:', profileError)
                }
            }

            if (this.calendar) {
                this.googleConnected = this.calendar.connectedCalendars.some(c => c.type === 'google');
                this.outlookConnected = this.calendar.connectedCalendars.some(c => c.type === 'outlook');
            }

        } catch (error) {
            if (error.code !== 'PGRST116') {
                console.error('Error loading connected accounts:', error)
            }
        }
    }

    async loadKidModeSettings() {
        try {
            await kidMode.init()
            this.kidModeSettings = {
                enabled: kidMode.isEnabled,
                userAge: kidMode.userAge,
                dateOfBirth: kidMode.dateOfBirth,
                settings: kidMode.settings
            }
        } catch (error) {
            console.error('Error loading Kid Mode settings:', error)
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
                        
                        <!-- StudentVue Connection (temporarily disabled) -->
                        <!-- <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderStudentVueConnection()}
                        </div> -->

                        <!-- Canvas Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderCanvasConnection()}
                        </div>

                        <!-- Google Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderGoogleConnection()}
                        </div>

                        <!-- Outlook Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderOutlookConnection()}
                        </div>

                        <!-- Spotify Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            ${this.renderSpotifyConnection()}
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

                <!-- Kid Mode Settings -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">🛡️ Kid Mode</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">Safe mode for users under 13 with restricted features and parental controls.</p>
                        ${this.renderKidModeSettings()}
                    </div>
                </div>

                <!-- Interface Customization -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interface Customization</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">Customize which tabs and sections are visible in your app.</p>
                        
                        <div class="space-y-4">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Visible Tabs</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-home" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">🏠 Home</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-tasks" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">✓ Tasks</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-calendar" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">📅 Calendar</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-journal" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">📔 Journal</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-academic-hub" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">🎓 Academic Hub</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-music" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">🎵 Music</span>
                                </label>
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" id="tab-ai-notes" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">🤖 AI Notes</span>
                                </label>
                            </div>
                            
                            <div class="mt-6">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Home Page Sections</h3>
                                <div class="grid grid-cols-2 gap-4">
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="section-upcoming-tasks" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">Upcoming Tasks</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="section-mood-logging" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">Mood Logging</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="section-pomodoro-widget" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">Pomodoro Widget</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="section-statistics" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">Statistics</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mt-6">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">🛠️ Toolbox Tools</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose which tools appear in your toolbox</p>
                                <div class="grid grid-cols-2 gap-4">
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="toolbox-academic-hub" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">📚 Academic Hub</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="toolbox-ai-notes" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">🤖 AI Notes</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="toolbox-music" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">🎵 Music Player</span>
                                    </label>
                                    <label class="flex items-center space-x-3">
                                        <input type="checkbox" id="toolbox-dev-tools" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <span class="text-sm text-gray-700 dark:text-gray-300">🔧 Development Tools</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button id="save-interface-settings" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Save Interface Settings
                                </button>
                                <button id="reset-interface-settings" class="ml-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    Reset to Default
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
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 mb-6">
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

                <!-- Legal -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Legal</h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Learn how we collect, use, and protect your data</p>
                                </div>
                                <button id="privacy-policy-link" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                    View Policy
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Terms of Service</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Read our terms and conditions of service</p>
                                </div>
                                <button id="terms-of-service-link" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                                    View Terms
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Offline Storage Status -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Offline Storage Status</h2>
                        <div id="offline-storage-status">
                            Loading storage information...
                        </div>
                    </div>
                </div>
            </div>
        `

        this.loadUserEmail();
        this.loadTimezones();
        this.updateGradesToggleVisual();
        this.loadOfflineStorageStatus();
        this.loadInterfaceSettings();
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

    renderGoogleConnection() {
        if (this.googleConnected) {
            return `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">Google Calendar</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Sync your Google Calendar events.</p>
                        </div>
                    </div>
                    <button id="disconnect-google-btn" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Remove
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                           <svg class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">Google Calendar</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Sync your Google Calendar events.</p>
                        </div>
                    </div>
                    <button id="connect-google-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Connect
                    </button>
                </div>
            `;
        }
    }

    renderOutlookConnection() {
        if (this.outlookConnected) {
            return `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M21.59 12.794a.996.996 0 0 0-.857-.457H20V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5.337H3.267a.996.996 0 0 0-.857.457A1 1 0 0 0 2.5 14v4a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-4a1 1 0 0 0-.41-1.206zM7 7h10v5H7V7z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">Outlook Calendar</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Sync your Outlook Calendar events.</p>
                        </div>
                    </div>
                    <button id="disconnect-outlook-btn" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Remove
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M21.59 12.794a.996.996 0 0 0-.857-.457H20V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5.337H3.267a.996.996 0 0 0-.857.457A1 1 0 0 0 2.5 14v4a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-4a1 1 0 0 0-.41-1.206zM7 7h10v5H7V7z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">Outlook Calendar</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Sync your Outlook Calendar events.</p>
                        </div>
                    </div>
                    <button id="connect-outlook-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Connect
                    </button>
                </div>
            `;
        }
    }

    renderSpotifyConnection() {
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">Spotify</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${this.spotifyConnected ? `Connected as: ${this.spotifyProfile?.display_name || 'Spotify User'}` : 'Connect for music integration and playlists'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${this.spotifyConnected ? `
                        <button id="disconnect-spotify" class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">Disconnect</button>
                    ` : `
                        <button id="connect-spotify" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Connect</button>
                    `}
                </div>
            </div>
        `;
    }

    renderKidModeSettings() {
        const settings = this.kidModeSettings || {}
        const isEnabled = settings.enabled || false
        const userAge = settings.userAge
        const dateOfBirth = settings.dateOfBirth

        return `
            <div class="space-y-6">
                <!-- Date of Birth Section -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">Date of Birth</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Required to enable Kid Mode (under 13 only)</p>
                        </div>
                        ${userAge !== null ? `<span class="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Age: ${userAge}</span>` : ''}
                    </div>
                    <div class="flex items-center space-x-3">
                        <input 
                            type="date" 
                            id="kid-mode-dob" 
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value="${dateOfBirth || ''}"
                            max="${new Date().toISOString().split('T')[0]}"
                        >
                        <button 
                            id="save-dob-btn" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                            Save
                        </button>
                    </div>
                </div>

                <!-- Kid Mode Toggle Section -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${isEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : ''}">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white flex items-center">
                                Kid Mode 
                                ${isEnabled ? '<span class="ml-2 text-green-600 dark:text-green-400">✓ Active</span>' : ''}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                ${isEnabled ? 'Safe browsing with restricted features' : 'Enable safe mode for users under 13'}
                            </p>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${isEnabled ? `
                                <button 
                                    id="disable-kid-mode-btn" 
                                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                >
                                    Disable
                                </button>
                            ` : `
                                <button 
                                    id="enable-kid-mode-btn" 
                                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                    ${!dateOfBirth || (userAge && userAge >= 13) ? 'disabled' : ''}
                                >
                                    Enable
                                </button>
                            `}
                        </div>
                    </div>

                    ${isEnabled ? `
                        <div class="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <h4 class="font-medium text-green-800 dark:text-green-200 mb-2">Active Restrictions:</h4>
                            <ul class="text-sm text-green-700 dark:text-green-300 space-y-1">
                                <li>• Music streaming disabled</li>
                                <li>• External links removed</li>
                                <li>• File uploads restricted</li>
                                <li>• Simplified interface</li>
                                <li>• Content filtering active</li>
                            </ul>
                        </div>
                    ` : ''}

                    ${!dateOfBirth ? `
                        <div class="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <p class="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Note:</strong> Please set your date of birth above to enable Kid Mode.
                            </p>
                        </div>
                    ` : userAge && userAge >= 13 ? `
                        <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <p class="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> Kid Mode is only available for users under 13 years old.
                            </p>
                        </div>
                    ` : ''}
                </div>

                ${isEnabled ? `
                    <!-- Auto-disable Info -->
                    <div class="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <div class="flex items-start space-x-3">
                            <div class="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                            <div>
                                <h4 class="font-medium text-blue-800 dark:text-blue-200">Auto-disable Information</h4>
                                <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Kid Mode will automatically turn off when you turn 13. You can also disable it manually using the admin code (0013).
                                </p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `
    }

    setupEventListeners() {
        const container = document.getElementById('settings-container')
        if (!container) return

        container.addEventListener('click', (event) => {
            if (event.target.id === 'connect-studentvue') this.showStudentVueConnectionModal();
            if (event.target.id === 'disconnect-studentvue') this.disconnectStudentVue();
            if (event.target.id === 'connect-canvas') this.showCanvasConnectionModal();
            if (event.target.id === 'disconnect-canvas') this.disconnectCanvas();
            if (event.target.id === 'connect-spotify') this.connectSpotify();
            if (event.target.id === 'disconnect-spotify') this.disconnectSpotify();
            if (event.target.id === 'privacy-policy-link') this.showPrivacyPolicy();
            if (event.target.id === 'terms-of-service-link') this.showTermsOfService();
            
            if (event.target.id === 'save-dob-btn') this.saveDateOfBirth();
            if (event.target.id === 'enable-kid-mode-btn') this.enableKidMode();
            if (event.target.id === 'disable-kid-mode-btn') this.showDisableKidModeModal();
        });

        this.loadUserEmail()

        const themeToggle = container.querySelector('#settings-theme-toggle')
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark')
                const isDark = document.documentElement.classList.contains('dark')
                localStorage.setItem('theme', isDark ? 'dark' : 'light')
            })
        }

        const timezoneSelector = container.querySelector('#timezone-selector');
        if (timezoneSelector) {
            timezoneSelector.addEventListener('change', (e) => {
                localStorage.setItem('timezone', e.target.value);
                window.dispatchEvent(new Event('timezoneChange'));
            });
        }

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

        document.getElementById('connect-google-btn')?.addEventListener('click', () => this.connectGoogle())
        document.getElementById('disconnect-google-btn')?.addEventListener('click', () => this.disconnectGoogle())

        document.getElementById('connect-outlook-btn')?.addEventListener('click', () => this.connectOutlook())
        document.getElementById('disconnect-outlook-btn')?.addEventListener('click', () => this.disconnectOutlook())
        
        document.getElementById('save-interface-settings')?.addEventListener('click', () => this.saveInterfaceSettings())
        document.getElementById('reset-interface-settings')?.addEventListener('click', () => this.resetInterfaceSettings())
        
        document.getElementById('toolbox-academic-hub')?.addEventListener('change', (e) => {
            if (window.toolbox) {
                window.toolbox.setToolVisibility('academic-hub', e.target.checked)
            }
        })
        document.getElementById('toolbox-ai-notes')?.addEventListener('change', (e) => {
            if (window.toolbox) {
                window.toolbox.setToolVisibility('ai-notes', e.target.checked)
            }
        })
        document.getElementById('toolbox-music')?.addEventListener('change', (e) => {
            if (window.toolbox) {
                window.toolbox.setToolVisibility('music', e.target.checked)
            }
        })
        document.getElementById('toolbox-dev-tools')?.addEventListener('change', (e) => {
            if (window.toolbox) {
                window.toolbox.setToolVisibility('dev-tools', e.target.checked)
            }
        })
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
                                   placeholder="https:
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

        setTimeout(() => {
            document.getElementById('canvas-modal-content')?.classList.remove('scale-95', 'opacity-0');
        }, 10);

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
                canvas_url: baseUrl,
                access_token: accessToken
            })

            if (error) throw error

            this.showMessage('Successfully connected to Canvas!', 'success')
            this.loadConnectedAccounts().then(() => this.render())
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
            this.loadConnectedAccounts().then(() => this.render())

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

    showPrivacyPolicy() {
        document.dispatchEvent(new CustomEvent('pageChange', { detail: { page: 'privacy-policy' } }));
    }

    showTermsOfService() {
        document.dispatchEvent(new CustomEvent('pageChange', { detail: { page: 'terms-of-service' } }));
    }

    async connectGoogle() {
        if (this.calendar) {
            this.calendar.addGoogleCalendar();
        }
    }

    async disconnectGoogle() {
        if (this.calendar) {
            const googleCalendar = this.calendar.connectedCalendars.find(c => c.type === 'google');
            if (googleCalendar) {
                this.calendar.removeCalendar(googleCalendar.id);
                this.showMessage('Google Calendar disconnected.', 'success');
                await this.init();
            }
        }
    }

    async connectOutlook() {
        if (this.calendar) {
            this.calendar.addOutlookCalendar();
        }
    }

    async disconnectOutlook() {
        if (this.calendar) {
            const outlookCalendar = this.calendar.connectedCalendars.find(c => c.type === 'outlook');
            if (outlookCalendar) {
                this.calendar.removeCalendar(outlookCalendar.id);
                this.showMessage('Outlook Calendar disconnected.', 'success');
                await this.init();
            }
        }
    }

    async connectSpotify() {
        try {
            console.log('🎵 Connecting to Spotify from settings...')
            
            const state = Math.random().toString(36).substring(2, 15)
            localStorage.setItem('spotify_settings_state', state)

            const scope = 'user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-library-read user-top-read user-read-recently-played playlist-read-private'
            
            const authUrl = new URL('https://accounts.spotify.com/authorize')
            authUrl.searchParams.append('response_type', 'code')
            authUrl.searchParams.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID')
            authUrl.searchParams.append('scope', scope)
            authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/spotify/callback`)
            authUrl.searchParams.append('state', state)
            authUrl.searchParams.append('show_dialog', 'false')

            window.location.href = authUrl.toString()
        } catch (error) {
            console.error('❌ Error connecting to Spotify:', error)
            this.showMessage('Failed to connect to Spotify', 'error')
        }
    }

    async disconnectSpotify() {
        try {
            console.log('🎵 Disconnecting from Spotify...')
            
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('music_connections')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', 'spotify')

            if (error) throw error

            this.spotifyConnected = false
            this.spotifyProfile = null
            
            this.init()

            this.showMessage('Spotify disconnected successfully', 'success')
        } catch (error) {
            console.error('❌ Error disconnecting Spotify:', error)
            this.showMessage('Failed to disconnect Spotify', 'error')
        }
    }

    async saveDateOfBirth() {
        const dobInput = document.getElementById('kid-mode-dob')
        if (!dobInput) return

        const dateOfBirth = dobInput.value
        if (!dateOfBirth) {
            this.showMessage('Please select your date of birth', 'error')
            return
        }

        try {
            await kidMode.setDateOfBirth(dateOfBirth)
            await this.loadKidModeSettings()
            this.render()
            this.showMessage('Date of birth saved successfully', 'success')
        } catch (error) {
            console.error('Error saving date of birth:', error)
            this.showMessage('Failed to save date of birth: ' + error.message, 'error')
        }
    }

    async enableKidMode() {
        const dobInput = document.getElementById('kid-mode-dob')
        if (!dobInput || !dobInput.value) {
            this.showMessage('Please set your date of birth first', 'error')
            return
        }

        try {
            await kidMode.enableKidMode(dobInput.value)
            await this.loadKidModeSettings()
            this.render()
            this.showMessage('Kid Mode enabled successfully', 'success')
            
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } catch (error) {
            console.error('Error enabling Kid Mode:', error)
            this.showMessage('Failed to enable Kid Mode: ' + error.message, 'error')
        }
    }

    showDisableKidModeModal() {
        const modalId = 'disable-kid-mode-modal'
        if (document.getElementById(modalId)) return

        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">🔒 Disable Kid Mode</h2>
                        <button id="close-disable-modal-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl">&times;</button>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-gray-700 dark:text-gray-300 mb-4">
                            To disable Kid Mode, please enter the admin code:
                        </p>
                        
                        <div class="space-y-4">
                            <div>
                                <label for="admin-code-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Admin Code
                                </label>
                                <input 
                                    type="password" 
                                    id="admin-code-input" 
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono"
                                    placeholder="Enter 4-digit code"
                                    maxlength="4"
                                >
                            </div>
                            
                            <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                                <p class="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Warning:</strong> Disabling Kid Mode will remove all safety restrictions and give access to all features.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button 
                            id="cancel-disable-btn" 
                            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            id="confirm-disable-btn" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                        >
                            Disable Kid Mode
                        </button>
                    </div>
                </div>
            </div>
        `
        
        document.body.insertAdjacentHTML('beforeend', modalHtml)
        
        const modal = document.getElementById(modalId)
        const adminCodeInput = modal.querySelector('#admin-code-input')
        
        adminCodeInput.focus()
        
        modal.querySelector('#close-disable-modal-btn').addEventListener('click', () => modal.remove())
        modal.querySelector('#cancel-disable-btn').addEventListener('click', () => modal.remove())
        
        modal.querySelector('#confirm-disable-btn').addEventListener('click', () => {
            this.disableKidMode(adminCodeInput.value)
            modal.remove()
        })
        
        adminCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.disableKidMode(adminCodeInput.value)
                modal.remove()
            }
        })
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        })
    }

    async disableKidMode(adminCode) {
        try {
            if (adminCode !== '1337') {
                throw new Error('Invalid admin code')
            }

            await kidMode.disableKidMode()
            this.kidModeSettings.enabled = false

            this.render()
            this.showMessage('Kid Mode disabled successfully', 'success')

        } catch (error) {
            console.error('Error disabling Kid Mode:', error)
            this.showMessage(error.message || 'Failed to disable Kid Mode', 'error')
        }
    }

    async loadOfflineStorageStatus() {
        try {
            const status = await db.getStatus()
            const diagnostics = await db.getDiagnostics()
            
            const statusContainer = document.getElementById('offline-storage-status')
            if (!statusContainer) return

            const formatBytes = (bytes) => {
                if (bytes === 0) return '0 B'
                const k = 1024
                const sizes = ['B', 'KB', 'MB', 'GB']
                const i = Math.floor(Math.log(bytes) / Math.log(k))
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
            }

            const connectionStatus = status.isOnline ? 
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Online</span>' :
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Offline</span>'

            const syncStatus = status.syncQueueLength > 0 ?
                `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">${status.syncQueueLength} pending</span>` :
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Synced</span>'

            statusContainer.innerHTML = `
                <div class="space-y-4">
                    <!-- Connection and Sync Status -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Connection</span>
                                ${connectionStatus}
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Status</span>
                                ${syncStatus}
                            </div>
                        </div>
                    </div>

                    <!-- Storage Usage -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Usage</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">${status.storage.percentage}% used</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${status.storage.percentage}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>${formatBytes(status.storage.used)} used</span>
                            <span>${formatBytes(status.storage.maxSize)} total</span>
                        </div>
                    </div>

                    <!-- Performance Info -->
                    ${status.performance.averageOperationTime > 0 ? `
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Average Operation Time</span>
                                <span class="text-sm text-gray-600 dark:text-gray-400">${status.performance.averageOperationTime}ms</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="flex space-x-3">
                        ${status.syncQueueLength > 0 && status.isOnline ? `
                            <button id="force-sync-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                Sync Now
                            </button>
                        ` : ''}
                        <button id="clear-offline-data-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Clear Offline Data
                        </button>
                        <button id="refresh-storage-status-btn" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                            Refresh
                        </button>
                    </div>
                </div>
            `

            this.setupOfflineStorageActions()

        } catch (error) {
            console.error('Error loading offline storage status:', error)
            const statusContainer = document.getElementById('offline-storage-status')
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div class="text-red-600 dark:text-red-400 text-sm">
                        Failed to load storage status: ${error.message}
                    </div>
                `
            }
        }
    }

    setupOfflineStorageActions() {
        const forceSyncBtn = document.getElementById('force-sync-btn')
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', async () => {
                try {
                    forceSyncBtn.disabled = true
                    forceSyncBtn.textContent = 'Syncing...'
                    
                    await db.syncOfflineData()
                    await this.loadOfflineStorageStatus()
                    
                    this.showMessage('Sync completed successfully', 'success')
                } catch (error) {
                    console.error('Manual sync failed:', error)
                    this.showMessage('Sync failed: ' + error.message, 'error')
                } finally {
                    if (forceSyncBtn) {
                        forceSyncBtn.disabled = false
                        forceSyncBtn.textContent = 'Sync Now'
                    }
                }
            })
        }

        const clearDataBtn = document.getElementById('clear-offline-data-btn')
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
                    try {
                        clearDataBtn.disabled = true
                        clearDataBtn.textContent = 'Clearing...'
                        
                        await db.clearCurrentUserData()
                        await this.loadOfflineStorageStatus()
                        
                        this.showMessage('Offline data cleared successfully', 'success')
                    } catch (error) {
                        console.error('Failed to clear offline data:', error)
                        this.showMessage('Failed to clear data: ' + error.message, 'error')
                    } finally {
                        if (clearDataBtn) {
                            clearDataBtn.disabled = false
                            clearDataBtn.textContent = 'Clear Offline Data'
                        }
                    }
                }
            })
        }

        const refreshBtn = document.getElementById('refresh-storage-status-btn')
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadOfflineStorageStatus()
            })
        }
    }

    saveInterfaceSettings() {
        try {
            const settings = {
                home: document.getElementById('tab-home')?.checked ?? true,
                tasks: document.getElementById('tab-tasks')?.checked ?? true,
                calendar: document.getElementById('tab-calendar')?.checked ?? true,
                journal: document.getElementById('tab-journal')?.checked ?? true,
                academicHub: document.getElementById('tab-academic-hub')?.checked ?? true,
                music: document.getElementById('tab-music')?.checked ?? true,
                aiNotes: document.getElementById('tab-ai-notes')?.checked ?? true,
                
                upcomingTasks: document.getElementById('section-upcoming-tasks')?.checked ?? true,
                moodLogging: document.getElementById('section-mood-logging')?.checked ?? true,
                pomodoroWidget: document.getElementById('section-pomodoro-widget')?.checked ?? true,
                statistics: document.getElementById('section-statistics')?.checked ?? true,
                
                toolboxAcademicHub: document.getElementById('toolbox-academic-hub')?.checked ?? true,
                toolboxAiNotes: document.getElementById('toolbox-ai-notes')?.checked ?? true,
                toolboxMusic: document.getElementById('toolbox-music')?.checked ?? true,
                toolboxDevTools: document.getElementById('toolbox-dev-tools')?.checked ?? true
            }
            
            localStorage.setItem('interface-settings', JSON.stringify(settings))
            
            this.applyInterfaceSettings(settings)
            
            if (window.toolbox) {
                window.toolbox.setToolVisibility('academic-hub', settings.toolboxAcademicHub)
                window.toolbox.setToolVisibility('ai-notes', settings.toolboxAiNotes)
                window.toolbox.setToolVisibility('music', settings.toolboxMusic)
                window.toolbox.setToolVisibility('dev-tools', settings.toolboxDevTools)
            }
            
            this.showMessage('Interface settings saved successfully!', 'success')
        } catch (error) {
            console.error('Error saving interface settings:', error)
            this.showMessage('Error saving settings. Please try again.', 'error')
        }
    }

    resetInterfaceSettings() {
        try {
            const defaultSettings = {
                home: true,
                tasks: true,
                calendar: true,
                journal: true,
                academicHub: true,
                music: true,
                aiNotes: true,
                
                upcomingTasks: true,
                moodLogging: true,
                pomodoroWidget: true,
                statistics: true,
                
                toolboxAcademicHub: true,
                toolboxAiNotes: true,
                toolboxMusic: true,
                toolboxDevTools: true
            }
            
            let el;
            el = document.getElementById('tab-home'); if (el) el.checked = defaultSettings.home;
            el = document.getElementById('tab-tasks'); if (el) el.checked = defaultSettings.tasks;
            el = document.getElementById('tab-calendar'); if (el) el.checked = defaultSettings.calendar;
            el = document.getElementById('tab-journal'); if (el) el.checked = defaultSettings.journal;
            el = document.getElementById('tab-academic-hub'); if (el) el.checked = defaultSettings.academicHub;
            el = document.getElementById('tab-music'); if (el) el.checked = defaultSettings.music;
            el = document.getElementById('tab-ai-notes'); if (el) el.checked = defaultSettings.aiNotes;
            el = document.getElementById('section-upcoming-tasks'); if (el) el.checked = defaultSettings.upcomingTasks;
            el = document.getElementById('section-mood-logging'); if (el) el.checked = defaultSettings.moodLogging;
            el = document.getElementById('section-pomodoro-widget'); if (el) el.checked = defaultSettings.pomodoroWidget;
            el = document.getElementById('section-statistics'); if (el) el.checked = defaultSettings.statistics;
            el = document.getElementById('toolbox-academic-hub'); if (el) el.checked = defaultSettings.toolboxAcademicHub;
            el = document.getElementById('toolbox-ai-notes'); if (el) el.checked = defaultSettings.toolboxAiNotes;
            el = document.getElementById('toolbox-music'); if (el) el.checked = defaultSettings.toolboxMusic;
            el = document.getElementById('toolbox-dev-tools'); if (el) el.checked = defaultSettings.toolboxDevTools;
            
            localStorage.setItem('interface-settings', JSON.stringify(defaultSettings))
            this.applyInterfaceSettings(defaultSettings)
            
            if (window.toolbox) {
                window.toolbox.toolVisibility = {
                    'academic-hub': true,
                    'ai-notes': true,
                    'music': true,
                    'dev-tools': true
                }
                window.toolbox.saveToolVisibility()
                window.toolbox.updateToolVisibility()
            }
            
            this.showMessage('Interface settings reset to default!', 'success')
        } catch (error) {
            console.error('Error resetting interface settings:', error)
            this.showMessage('Error resetting settings. Please try again.', 'error')
        }
    }

    applyInterfaceSettings(settings) {
        
        window.dispatchEvent(new CustomEvent('interfaceSettingsChanged', { detail: settings }))
    }

    loadInterfaceSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('interface-settings') || '{}')
            let el;
            el = document.getElementById('tab-home'); if (el) el.checked = settings.home ?? true;
            el = document.getElementById('tab-tasks'); if (el) el.checked = settings.tasks ?? true;
            el = document.getElementById('tab-calendar'); if (el) el.checked = settings.calendar ?? true;
            el = document.getElementById('tab-journal'); if (el) el.checked = settings.journal ?? true;
            el = document.getElementById('tab-academic-hub'); if (el) el.checked = settings.academicHub ?? true;
            el = document.getElementById('tab-music'); if (el) el.checked = settings.music ?? true;
            el = document.getElementById('tab-ai-notes'); if (el) el.checked = settings.aiNotes ?? true;
            el = document.getElementById('section-upcoming-tasks'); if (el) el.checked = settings.upcomingTasks ?? true;
            el = document.getElementById('section-mood-logging'); if (el) el.checked = settings.moodLogging ?? true;
            el = document.getElementById('section-pomodoro-widget'); if (el) el.checked = settings.pomodoroWidget ?? true;
            el = document.getElementById('section-statistics'); if (el) el.checked = settings.statistics ?? true;
            if (window.toolbox) {
                el = document.getElementById('toolbox-academic-hub'); if (el) el.checked = window.toolbox.toolVisibility['academic-hub'] ?? true;
                el = document.getElementById('toolbox-ai-notes'); if (el) el.checked = window.toolbox.toolVisibility['ai-notes'] ?? true;
                el = document.getElementById('toolbox-music'); if (el) el.checked = window.toolbox.toolVisibility['music'] ?? true;
                el = document.getElementById('toolbox-dev-tools'); if (el) el.checked = window.toolbox.toolVisibility['dev-tools'] ?? true;
            }
        } catch (error) {
            console.error('Error loading interface settings:', error)
        }
    }
}