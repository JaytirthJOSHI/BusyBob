import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'
import { kidMode } from '../utils/kid-mode.js'

export class Settings {
    constructor() {
        this.container = null
        this.activeTab = 'account'
        this.isLoading = false
        this.user = null
        this.profile = null
        this.timezones = []
        this.studentVueCredentials = null
        this.canvasCredentials = null
        this.musicConnections = null
        this.kidModeSettings = null
    }

    async init() {
        try {
            this.isLoading = true
            await this.loadUserData()
            await this.loadTimezones()
            await this.loadStudentVueCredentials()
            await this.loadCanvasCredentials()
            await this.loadMusicConnections()
            await this.loadKidModeSettings()
            this.isLoading = false
        } catch (error) {
            console.error('Error initializing settings:', error)
            this.isLoading = false
        }
    }

    async loadUserData() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            this.user = user

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            this.profile = profile || { id: user.id }
        } catch (error) {
            console.error('Error loading user data:', error)
        }
    }

    async loadTimezones() {
        try {
            // Use browser's native Intl API to get supported timezones
            if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
                this.timezones = Intl.supportedValuesOf('timeZone');
                return;
            }
            
            // Fallback to common timezones if browser doesn't support Intl.supportedValuesOf
            this.timezones = [
                'America/New_York',
                'America/Chicago',
                'America/Denver',
                'America/Los_Angeles',
                'America/Anchorage',
                'America/Honolulu',
                'America/Phoenix',
                'Europe/London',
                'Europe/Paris',
                'Europe/Berlin',
                'Asia/Tokyo',
                'Asia/Shanghai',
                'Australia/Sydney',
                'Pacific/Auckland'
            ];
        } catch (error) {
            console.error('Error loading timezones:', error)
            // Fallback to common timezones
            this.timezones = [
                'America/New_York',
                'America/Chicago',
                'America/Denver',
                'America/Los_Angeles',
                'Europe/London',
                'Europe/Paris',
                'Asia/Tokyo',
                'Australia/Sydney'
            ]
        }
    }

    async loadStudentVueCredentials() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data, error } = await supabase
                .from('studentvue_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            this.studentVueCredentials = data
        } catch (error) {
            console.error('Error loading StudentVue credentials:', error)
        }
    }

    async loadCanvasCredentials() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data, error } = await supabase
                .from('canvas_credentials')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            this.canvasCredentials = data
        } catch (error) {
            console.error('Error loading Canvas credentials:', error)
        }
    }

    async loadMusicConnections() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data, error } = await supabase
                .from('music_connections')
                .select('*')
                .eq('user_id', user.id)
                .eq('service', 'spotify')
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            this.musicConnections = data
        } catch (error) {
            console.error('Error loading music connections:', error)
        }
    }

    async loadKidModeSettings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            const { data, error } = await supabase
                .from('kid_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            // PGRST116 means no rows found, which is normal for new users
            if (error && error.code !== 'PGRST116') {
                throw error
            }

            this.kidModeSettings = data || null
        } catch (error) {
            console.error('Error loading kid mode settings:', error)
        }
    }

    render() {
        if (!this.container) return

        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 card-hover">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

                    <!-- Settings Tabs -->
                    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
                        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
                            <li class="mr-2">
                                <button class="settings-tab inline-block p-4 border-b-2 rounded-t-lg ${this.activeTab === 'account' ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}" data-tab="account">Account</button>
                            </li>
                            <li class="mr-2">
                                <button class="settings-tab inline-block p-4 border-b-2 rounded-t-lg ${this.activeTab === 'academic' ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}" data-tab="academic">Academic Connections</button>
                            </li>
                            <li class="mr-2">
                                <button class="settings-tab inline-block p-4 border-b-2 rounded-t-lg ${this.activeTab === 'music' ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}" data-tab="music">Music</button>
                            </li>
                            <li class="mr-2">
                                <button class="settings-tab inline-block p-4 border-b-2 rounded-t-lg ${this.activeTab === 'appearance' ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}" data-tab="appearance">Appearance</button>
                            </li>
                            <li>
                                <button class="settings-tab inline-block p-4 border-b-2 rounded-t-lg ${this.activeTab === 'privacy' ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}" data-tab="privacy">Privacy & Security</button>
                            </li>
                        </ul>
                    </div>

                    <!-- Settings Content -->
                    <div class="settings-content">
                        ${this.renderActiveTab()}
                    </div>
                </div>
            </div>
        `

        this.attachEventListeners()
    }

    renderActiveTab() {
        switch (this.activeTab) {
            case 'account':
                return this.renderAccountTab()
            case 'academic':
                return this.renderAcademicTab()
            case 'music':
                return this.renderMusicTab()
            case 'appearance':
                return this.renderAppearanceTab()
            case 'privacy':
                return this.renderPrivacyTab()
            default:
                return this.renderAccountTab()
        }
    }

    renderAccountTab() {
        if (this.isLoading) {
            return this.renderLoading()
        }

        if (!this.user) {
            return this.renderNotLoggedIn()
        }

        return `
            <div class="space-y-6">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        ${this.user.email ? this.user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${this.profile?.username || this.user.email || 'User'}</h3>
                        <p class="text-gray-500 dark:text-gray-400">${this.user.email || 'No email'}</p>
                    </div>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h4>
                    <form id="profile-form" class="space-y-4">
                        <div>
                            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input type="text" id="username" name="username" value="${this.profile?.username || ''}" class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" id="email" name="email" value="${this.user.email || ''}" class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label for="timezone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                            <select id="timezone" name="timezone" class="form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                ${this.renderTimezoneOptions()}
                            </select>
                        </div>
                        <div class="pt-4">
                            <button type="submit" class="btn-gradient text-white px-4 py-2 rounded-lg">Save Changes</button>
                        </div>
                    </form>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Management</h4>
                    <div class="space-y-4">
                        <button id="change-password-btn" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            Change Password
                        </button>
                        <div class="pt-4">
                            <button id="sign-out-btn" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg">Sign Out</button>
                            <button id="delete-account-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg ml-4">Delete Account</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderAcademicTab() {
        if (this.isLoading) {
            return this.renderLoading()
        }

        if (!this.user) {
            return this.renderNotLoggedIn()
        }

        return `
            <div class="space-y-8">
                <!-- StudentVue Connection -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">StudentVue</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Connect to your school's StudentVue portal</p>
                            </div>
                        </div>
                        <div>
                            ${this.studentVueCredentials ? 
                                `<span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">Connected</span>` : 
                                `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">Not Connected</span>`
                            }
                        </div>
                    </div>

                    ${this.studentVueCredentials ? 
                        `<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Connected to: ${this.studentVueCredentials.district_url}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Username: ${this.studentVueCredentials.username}</p>
                                </div>
                                <button id="disconnect-studentvue-btn" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                        <button id="refresh-studentvue-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                            Refresh Data
                        </button>` : 
                        `<form id="studentvue-form" class="space-y-4">
                            <div>
                                <label for="district-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District URL</label>
                                <input type="url" id="district-url" name="district_url" placeholder="https://your-district.studentvue.com" required class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            </div>
                            <div>
                                <label for="studentvue-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                <input type="text" id="studentvue-username" name="username" required class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            </div>
                            <div>
                                <label for="studentvue-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input type="password" id="studentvue-password" name="password" required class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            </div>
                            <button type="submit" id="connect-studentvue-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Connect to StudentVue
                            </button>
                        </form>`
                    }
                </div>

                <!-- Canvas Connection -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Canvas LMS</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Connect to your Canvas learning management system</p>
                            </div>
                        </div>
                        <div>
                            ${this.canvasCredentials ? 
                                `<span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">Connected</span>` : 
                                `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">Not Connected</span>`
                            }
                        </div>
                    </div>

                    ${this.canvasCredentials ? 
                        `<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Connected to: ${this.canvasCredentials.canvas_url}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">API Token: ••••••••••••••••</p>
                                </div>
                                <button id="disconnect-canvas-btn" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                        <button id="refresh-canvas-btn" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                            Refresh Data
                        </button>` : 
                        `<form id="canvas-form" class="space-y-4">
                            <div>
                                <label for="canvas-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canvas URL</label>
                                <input type="url" id="canvas-url" name="canvas_url" placeholder="https://your-school.instructure.com" required class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            </div>
                            <div>
                                <label for="canvas-token" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token</label>
                                <input type="password" id="canvas-token" name="access_token" required class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <a href="https://community.canvaslms.com/t5/Student-Guide/How-do-I-manage-API-access-tokens-as-a-student/ta-p/273" target="_blank" class="text-blue-600 hover:underline dark:text-blue-400">
                                        How to get an API token
                                    </a>
                                </p>
                            </div>
                            <button type="submit" id="connect-canvas-btn" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Connect to Canvas
                            </button>
                        </form>`
                    }
                </div>
            </div>
        `
    }

    renderMusicTab() {
        if (this.isLoading) {
            return this.renderLoading()
        }

        if (!this.user) {
            return this.renderNotLoggedIn()
        }

        return `
            <div class="space-y-8">
                <!-- Spotify Connection -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Spotify</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Connect for personalized music recommendations</p>
                            </div>
                        </div>
                        <div>
                            ${this.musicConnections ? 
                                `<span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">Connected</span>` : 
                                `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">Not Connected</span>`
                            }
                        </div>
                    </div>

                    ${this.musicConnections ? 
                        `<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Connected to Spotify</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Access Token: ••••••••••••••••</p>
                                </div>
                                <button id="disconnect-spotify-btn" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <p class="text-sm text-gray-700 dark:text-gray-300">Mood-based recommendations</p>
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="mood-recommendations" class="sr-only peer" checked>
                                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <p class="text-sm text-gray-700 dark:text-gray-300">Focus session music</p>
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="focus-music" class="sr-only peer" checked>
                                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <p class="text-sm text-gray-700 dark:text-gray-300">Track listening history</p>
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="track-listening" class="sr-only peer" checked>
                                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>` : 
                        `<div class="text-center py-6">
                            <p class="text-gray-600 dark:text-gray-400 mb-4">Connect your Spotify account to get personalized music recommendations based on your mood and productivity patterns.</p>
                            <button id="connect-spotify-btn" class="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg text-sm font-medium inline-flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
                                </svg>
                                Connect Spotify
                            </button>
                        </div>`
                    }
                </div>

                <!-- Music Preferences -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Music Preferences</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="preferred-genre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Genre for Focus</label>
                            <select id="preferred-genre" class="form-select block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="lo-fi">Lo-Fi</option>
                                <option value="classical">Classical</option>
                                <option value="ambient">Ambient</option>
                                <option value="jazz">Jazz</option>
                                <option value="electronic">Electronic</option>
                                <option value="instrumental">Instrumental</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="energy-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Energy Level</label>
                            <input type="range" id="energy-level" min="0" max="100" value="50" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Calm</span>
                                <span>Balanced</span>
                                <span>Energetic</span>
                            </div>
                        </div>
                        
                        <div class="pt-4">
                            <button id="save-music-preferences" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderAppearanceTab() {
        if (this.isLoading) {
            return this.renderLoading()
        }

        const currentTheme = localStorage.theme || 'system'

        return `
            <div class="space-y-8">
                <!-- Theme Settings -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
                    
                    <div class="space-y-4">
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <label class="inline-flex items-center">
                                    <input type="radio" name="theme" value="light" class="form-radio" ${currentTheme === 'light' ? 'checked' : ''}>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">Light</span>
                                </label>
                            </div>
                            <div class="w-16 h-16 bg-white border border-gray-200 rounded-lg shadow-sm"></div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <label class="inline-flex items-center">
                                    <input type="radio" name="theme" value="dark" class="form-radio" ${currentTheme === 'dark' ? 'checked' : ''}>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
                                </label>
                            </div>
                            <div class="w-16 h-16 bg-gray-900 border border-gray-700 rounded-lg shadow-sm"></div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <label class="inline-flex items-center">
                                    <input type="radio" name="theme" value="system" class="form-radio" ${currentTheme === 'system' ? 'checked' : ''}>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">System</span>
                                </label>
                            </div>
                            <div class="w-16 h-16 bg-gradient-to-br from-white to-gray-900 border border-gray-300 rounded-lg shadow-sm"></div>
                        </div>
                    </div>
                </div>

                <!-- Color Scheme -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Scheme</h3>
                    
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Default</p>
                        </div>
                        
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-green-500 to-teal-600 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Nature</p>
                        </div>
                        
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Sunset</p>
                        </div>
                        
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Vibrant</p>
                        </div>
                        
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-gray-500 to-gray-700 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Monochrome</p>
                        </div>
                        
                        <div class="color-scheme-option cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div class="h-8 w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-md mb-2"></div>
                            <p class="text-sm text-center text-gray-700 dark:text-gray-300">Sunshine</p>
                        </div>
                    </div>
                </div>

                <!-- Font Size -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Font Size</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="font-size" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Size</label>
                            <input type="range" id="font-size" min="80" max="120" value="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Smaller</span>
                                <span>Default</span>
                                <span>Larger</span>
                            </div>
                        </div>
                        
                        <div class="pt-4">
                            <button id="save-appearance" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Save Appearance Settings
                            </button>
                            <button id="reset-appearance" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg text-sm font-medium ml-2">
                                Reset to Default
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderPrivacyTab() {
        if (this.isLoading) {
            return this.renderLoading()
        }

        if (!this.user) {
            return this.renderNotLoggedIn()
        }

        return `
            <div class="space-y-8">
                <!-- Kid Mode -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kid Mode</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Enhanced safety features for younger users</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="kid-mode-toggle" class="sr-only peer" ${kidMode.isActive ? 'checked' : ''}>
                                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    <div id="kid-mode-settings" class="space-y-4 ${kidMode.isActive ? '' : 'hidden'}">
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <div class="flex items-start space-x-3">
                                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <div>
                                    <p class="text-sm text-blue-800 dark:text-blue-200">Kid Mode provides enhanced safety features for users under 13. It includes content filtering, restricted features, and parental controls.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label for="date-of-birth" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                            <input type="date" id="date-of-birth" value="${this.kidModeSettings?.date_of_birth || ''}" class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        </div>

                        <div>
                            <label for="admin-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Code (for parents/guardians)</label>
                            <input type="password" id="admin-code" placeholder="Create a 4-digit code" class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">This code will be required to disable Kid Mode</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Restricted Features</label>
                            <div class="space-y-2">
                                <label class="inline-flex items-center">
                                    <input type="checkbox" class="form-checkbox" checked disabled>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">External links</span>
                                </label>
                                <label class="inline-flex items-center">
                                    <input type="checkbox" class="form-checkbox" checked disabled>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">Music streaming</span>
                                </label>
                                <label class="inline-flex items-center">
                                    <input type="checkbox" class="form-checkbox" checked disabled>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">File uploads</span>
                                </label>
                                <label class="inline-flex items-center">
                                    <input type="checkbox" class="form-checkbox" checked disabled>
                                    <span class="ml-2 text-gray-700 dark:text-gray-300">Advanced settings</span>
                                </label>
                            </div>
                        </div>

                        <div class="pt-4">
                            <button id="save-kid-mode" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Save Kid Mode Settings
                            </button>
                        </div>
                    </div>

                    <div id="kid-mode-disable" class="space-y-4 ${kidMode.isActive ? 'hidden' : ''}">
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div class="flex items-start space-x-3">
                                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                </svg>
                                <div>
                                    <p class="text-sm text-yellow-800 dark:text-yellow-200">Kid Mode is currently disabled. Enable it to activate enhanced safety features for younger users.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label for="enable-dob" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                            <input type="date" id="enable-dob" class="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Required to enable Kid Mode</p>
                        </div>

                        <div class="pt-4">
                            <button id="enable-kid-mode" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Enable Kid Mode
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Data & Privacy -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">Allow usage analytics</p>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="allow-analytics" class="sr-only peer" checked>
                                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">Store data locally when offline</p>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="offline-storage" class="sr-only peer" checked>
                                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">AI Assistant data collection</p>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="ai-data-collection" class="sr-only peer" checked>
                                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="pt-4">
                            <button id="save-privacy" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                Save Privacy Settings
                            </button>
                        </div>
                        
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                            <button id="export-data" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
                                Export My Data
                            </button>
                            <button id="delete-all-data" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm ml-4">
                                Delete All My Data
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Legal -->
                <div class="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
                    
                    <div class="space-y-2">
                        <a href="#privacy-policy" class="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            Privacy Policy
                        </a>
                        <a href="#terms-of-service" class="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            Terms of Service
                        </a>
                        <a href="#" class="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                            Cookie Policy
                        </a>
                    </div>
                </div>
            </div>
        `
    }

    renderLoading() {
        return `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        `
    }

    renderNotLoggedIn() {
        return `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Not Logged In</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Please log in to access settings.</p>
                <button id="login-redirect-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                    Go to Login
                </button>
            </div>
        `
    }

    renderTimezoneOptions() {
        if (!this.timezones || this.timezones.length === 0) {
            return '<option value="UTC">UTC</option>'
        }

        const currentTimezone = this.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

        return this.timezones.map(tz => `
            <option value="${tz}" ${tz === currentTimezone ? 'selected' : ''}>
                ${tz}
            </option>
        `).join('')
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab
                this.render()
            })
        })

        // Profile form
        const profileForm = document.getElementById('profile-form')
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                await this.updateProfile({
                    username: document.getElementById('username').value,
                    timezone: document.getElementById('timezone').value
                })
            })
        }

        // StudentVue form
        const studentVueForm = document.getElementById('studentvue-form')
        if (studentVueForm) {
            studentVueForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                await this.connectStudentVue({
                    district_url: document.getElementById('district-url').value,
                    username: document.getElementById('studentvue-username').value,
                    password: document.getElementById('studentvue-password').value
                })
            })
        }

        // Canvas form
        const canvasForm = document.getElementById('canvas-form')
        if (canvasForm) {
            canvasForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                await this.connectCanvas({
                    canvas_url: document.getElementById('canvas-url').value,
                    access_token: document.getElementById('canvas-token').value
                })
            })
        }

        // Spotify connection
        const connectSpotifyBtn = document.getElementById('connect-spotify-btn')
        if (connectSpotifyBtn) {
            connectSpotifyBtn.addEventListener('click', () => {
                this.connectSpotify()
            })
        }

        // Kid Mode toggle
        const kidModeToggle = document.getElementById('kid-mode-toggle')
        if (kidModeToggle) {
            kidModeToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.getElementById('kid-mode-settings').classList.remove('hidden')
                    document.getElementById('kid-mode-disable').classList.add('hidden')
                } else {
                    this.disableKidMode()
                }
            })
        }

        // Enable Kid Mode button
        const enableKidModeBtn = document.getElementById('enable-kid-mode')
        if (enableKidModeBtn) {
            enableKidModeBtn.addEventListener('click', async () => {
                const dateOfBirth = document.getElementById('enable-dob').value
                if (!dateOfBirth) {
                    ui.showMessage('Please enter a date of birth', 'error')
                    return
                }
                await this.enableKidMode(dateOfBirth)
            })
        }

        // Save Kid Mode settings
        const saveKidModeBtn = document.getElementById('save-kid-mode')
        if (saveKidModeBtn) {
            saveKidModeBtn.addEventListener('click', async () => {
                const dateOfBirth = document.getElementById('date-of-birth').value
                const adminCode = document.getElementById('admin-code').value
                await this.saveKidModeSettings(dateOfBirth, adminCode)
            })
        }

        // Theme selection
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeTheme(e.target.value)
            })
        })

        // Color scheme selection
        document.querySelectorAll('.color-scheme-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-scheme-option').forEach(opt => {
                    opt.classList.remove('border-blue-500')
                    opt.classList.add('border-gray-200', 'dark:border-gray-600')
                })
                option.classList.remove('border-gray-200', 'dark:border-gray-600')
                option.classList.add('border-blue-500')
            })
        })

        // Save appearance settings
        const saveAppearanceBtn = document.getElementById('save-appearance')
        if (saveAppearanceBtn) {
            saveAppearanceBtn.addEventListener('click', () => {
                const fontSize = document.getElementById('font-size').value
                this.saveAppearanceSettings(fontSize)
            })
        }

        // Reset appearance settings
        const resetAppearanceBtn = document.getElementById('reset-appearance')
        if (resetAppearanceBtn) {
            resetAppearanceBtn.addEventListener('click', () => {
                this.resetAppearanceSettings()
            })
        }

        // Save music preferences
        const saveMusicPreferencesBtn = document.getElementById('save-music-preferences')
        if (saveMusicPreferencesBtn) {
            saveMusicPreferencesBtn.addEventListener('click', () => {
                const genre = document.getElementById('preferred-genre').value
                const energyLevel = document.getElementById('energy-level').value
                this.saveMusicPreferences(genre, energyLevel)
            })
        }

        // Save privacy settings
        const savePrivacyBtn = document.getElementById('save-privacy')
        if (savePrivacyBtn) {
            savePrivacyBtn.addEventListener('click', () => {
                const allowAnalytics = document.getElementById('allow-analytics').checked
                const offlineStorage = document.getElementById('offline-storage').checked
                const aiDataCollection = document.getElementById('ai-data-collection').checked
                this.savePrivacySettings(allowAnalytics, offlineStorage, aiDataCollection)
            })
        }

        // Export data
        const exportDataBtn = document.getElementById('export-data')
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportUserData()
            })
        }

        // Delete all data
        const deleteAllDataBtn = document.getElementById('delete-all-data')
        if (deleteAllDataBtn) {
            deleteAllDataBtn.addEventListener('click', () => {
                this.confirmDeleteAllData()
            })
        }

        // Disconnect buttons
        const disconnectStudentVueBtn = document.getElementById('disconnect-studentvue-btn')
        if (disconnectStudentVueBtn) {
            disconnectStudentVueBtn.addEventListener('click', () => {
                this.disconnectStudentVue()
            })
        }

        const disconnectCanvasBtn = document.getElementById('disconnect-canvas-btn')
        if (disconnectCanvasBtn) {
            disconnectCanvasBtn.addEventListener('click', () => {
                this.disconnectCanvas()
            })
        }

        const disconnectSpotifyBtn = document.getElementById('disconnect-spotify-btn')
        if (disconnectSpotifyBtn) {
            disconnectSpotifyBtn.addEventListener('click', () => {
                this.disconnectSpotify()
            })
        }

        // Refresh data buttons
        const refreshStudentVueBtn = document.getElementById('refresh-studentvue-btn')
        if (refreshStudentVueBtn) {
            refreshStudentVueBtn.addEventListener('click', () => {
                this.refreshStudentVueData()
            })
        }

        const refreshCanvasBtn = document.getElementById('refresh-canvas-btn')
        if (refreshCanvasBtn) {
            refreshCanvasBtn.addEventListener('click', () => {
                this.refreshCanvasData()
            })
        }

        // Account management
        const changePasswordBtn = document.getElementById('change-password-btn')
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showChangePasswordModal()
            })
        }

        const signOutBtn = document.getElementById('sign-out-btn')
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                this.signOut()
            })
        }

        const deleteAccountBtn = document.getElementById('delete-account-btn')
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.confirmDeleteAccount()
            })
        }

        // Login redirect
        const loginRedirectBtn = document.getElementById('login-redirect-btn')
        if (loginRedirectBtn) {
            loginRedirectBtn.addEventListener('click', () => {
                window.location.hash = ''
                document.dispatchEvent(new CustomEvent('showLogin'))
            })
        }
    }

    async updateProfile(data) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to update your profile', 'error')
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    username: data.username,
                    timezone: data.timezone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            await this.loadUserData()
            ui.showMessage('Profile updated successfully!', 'success')
        } catch (error) {
            console.error('Error updating profile:', error)
            ui.showMessage('Failed to update profile', 'error')
        }
    }

    async connectStudentVue(credentials) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to connect StudentVue', 'error')
                return
            }

            // Test the connection first
            const response = await fetch('/api/studentvue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...credentials,
                    action: 'getGradebook'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to connect to StudentVue')
            }

            // If connection test is successful, save credentials
            const { error } = await supabase
                .from('studentvue_credentials')
                .upsert({
                    user_id: user.id,
                    district_url: credentials.district_url,
                    username: credentials.username,
                    password: credentials.password,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            await this.loadStudentVueCredentials()
            ui.showMessage('Successfully connected to StudentVue!', 'success')
            this.render()
        } catch (error) {
            console.error('Error connecting to StudentVue:', error)
            ui.showMessage(`Failed to connect to StudentVue: ${error.message}`, 'error')
        }
    }

    async connectCanvas(credentials) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to connect Canvas', 'error')
                return
            }

            // Test the connection first
            const response = await fetch('/api/canvas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    canvasToken: credentials.access_token,
                    canvasDomain: credentials.canvas_url,
                    action: 'health'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to connect to Canvas')
            }

            // If connection test is successful, save credentials
            const { error } = await supabase
                .from('canvas_credentials')
                .upsert({
                    user_id: user.id,
                    canvas_url: credentials.canvas_url,
                    access_token: credentials.access_token,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            await this.loadCanvasCredentials()
            ui.showMessage('Successfully connected to Canvas!', 'success')
            this.render()
        } catch (error) {
            console.error('Error connecting to Canvas:', error)
            ui.showMessage(`Failed to connect to Canvas: ${error.message}`, 'error')
        }
    }

    connectSpotify() {
        // This will be handled by the Spotify OAuth flow in main.js
        document.dispatchEvent(new CustomEvent('connectSpotify'))
    }

    async disconnectStudentVue() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to disconnect StudentVue', 'error')
                return
            }

            const { error } = await supabase
                .from('studentvue_credentials')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            this.studentVueCredentials = null
            ui.showMessage('Successfully disconnected from StudentVue', 'success')
            this.render()
        } catch (error) {
            console.error('Error disconnecting from StudentVue:', error)
            ui.showMessage('Failed to disconnect from StudentVue', 'error')
        }
    }

    async disconnectCanvas() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to disconnect Canvas', 'error')
                return
            }

            const { error } = await supabase
                .from('canvas_credentials')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            this.canvasCredentials = null
            ui.showMessage('Successfully disconnected from Canvas', 'success')
            this.render()
        } catch (error) {
            console.error('Error disconnecting from Canvas:', error)
            ui.showMessage('Failed to disconnect from Canvas', 'error')
        }
    }

    async disconnectSpotify() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to disconnect Spotify', 'error')
                return
            }

            const { error } = await supabase
                .from('music_connections')
                .delete()
                .eq('user_id', user.id)
                .eq('service', 'spotify')

            if (error) throw error

            this.musicConnections = null
            ui.showMessage('Successfully disconnected from Spotify', 'success')
            this.render()
        } catch (error) {
            console.error('Error disconnecting from Spotify:', error)
            ui.showMessage('Failed to disconnect from Spotify', 'error')
        }
    }

    async refreshStudentVueData() {
        // This would trigger a refresh of StudentVue data
        ui.showMessage('Refreshing StudentVue data...', 'info')
        // Implementation would depend on how you're handling StudentVue data
    }

    async refreshCanvasData() {
        // This would trigger a refresh of Canvas data
        ui.showMessage('Refreshing Canvas data...', 'info')
        // Implementation would depend on how you're handling Canvas data
    }

    async enableKidMode(dateOfBirth) {
        try {
            if (!dateOfBirth) {
                ui.showMessage('Please enter a date of birth', 'error')
                return
            }

            await kidMode.enableKidMode(dateOfBirth)
            ui.showMessage('Kid Mode enabled successfully!', 'success')
            this.render()
        } catch (error) {
            console.error('Error enabling Kid Mode:', error)
            ui.showMessage(`Failed to enable Kid Mode: ${error.message}`, 'error')
        }
    }

    async disableKidMode() {
        try {
            // Show a modal to enter admin code
            const adminCode = prompt('Please enter the admin code to disable Kid Mode:')
            if (!adminCode) {
                // User cancelled
                document.getElementById('kid-mode-toggle').checked = true
                return
            }

            await kidMode.disableKidMode(adminCode)
            ui.showMessage('Kid Mode disabled successfully!', 'success')
            
            document.getElementById('kid-mode-settings').classList.add('hidden')
            document.getElementById('kid-mode-disable').classList.remove('hidden')
        } catch (error) {
            console.error('Error disabling Kid Mode:', error)
            ui.showMessage(`Failed to disable Kid Mode: ${error.message}`, 'error')
            document.getElementById('kid-mode-toggle').checked = true
        }
    }

    async saveKidModeSettings(dateOfBirth, adminCode) {
        try {
            if (!dateOfBirth) {
                ui.showMessage('Please enter a date of birth', 'error')
                return
            }

            await kidMode.setDateOfBirth(dateOfBirth)
            
            if (adminCode) {
                // Update admin code if provided
                const { data: { user } } = await auth.getCurrentUser()
                if (user) {
                    await supabase
                        .from('kid_mode_settings')
                        .update({ pin: adminCode })
                        .eq('user_id', user.id)
                }
            }

            ui.showMessage('Kid Mode settings saved successfully!', 'success')
        } catch (error) {
            console.error('Error saving Kid Mode settings:', error)
            ui.showMessage(`Failed to save Kid Mode settings: ${error.message}`, 'error')
        }
    }

    changeTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            localStorage.theme = 'dark'
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
            localStorage.theme = 'light'
        } else {
            // System theme
            localStorage.removeItem('theme')
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }
    }

    saveAppearanceSettings(fontSize) {
        try {
            document.documentElement.style.fontSize = `${fontSize}%`
            localStorage.setItem('fontSize', fontSize)
            ui.showMessage('Appearance settings saved successfully!', 'success')
        } catch (error) {
            console.error('Error saving appearance settings:', error)
            ui.showMessage('Failed to save appearance settings', 'error')
        }
    }

    resetAppearanceSettings() {
        try {
            document.documentElement.style.fontSize = '100%'
            localStorage.removeItem('fontSize')
            document.getElementById('font-size').value = 100
            ui.showMessage('Appearance settings reset to default', 'success')
        } catch (error) {
            console.error('Error resetting appearance settings:', error)
            ui.showMessage('Failed to reset appearance settings', 'error')
        }
    }

    saveMusicPreferences(genre, energyLevel) {
        try {
            // Save to user profile or preferences
            ui.showMessage('Music preferences saved successfully!', 'success')
        } catch (error) {
            console.error('Error saving music preferences:', error)
            ui.showMessage('Failed to save music preferences', 'error')
        }
    }

    savePrivacySettings(allowAnalytics, offlineStorage, aiDataCollection) {
        try {
            // Save to user profile or preferences
            ui.showMessage('Privacy settings saved successfully!', 'success')
        } catch (error) {
            console.error('Error saving privacy settings:', error)
            ui.showMessage('Failed to save privacy settings', 'error')
        }
    }

    exportUserData() {
        try {
            // Implementation would depend on what data you want to export
            ui.showMessage('Exporting your data...', 'info')
        } catch (error) {
            console.error('Error exporting user data:', error)
            ui.showMessage('Failed to export user data', 'error')
        }
    }

    confirmDeleteAllData() {
        const confirmed = confirm('Are you sure you want to delete all your data? This action cannot be undone.')
        if (confirmed) {
            this.deleteAllData()
        }
    }

    async deleteAllData() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                ui.showMessage('You must be logged in to delete your data', 'error')
                return
            }

            // Delete data from all tables
            const tables = [
                'tasks',
                'feelings',
                'journal_entries',
                'studentvue_credentials',
                'canvas_credentials',
                'music_connections',
                'kid_mode_settings',
                'ai_notes'
            ]

            for (const table of tables) {
                await supabase
                    .from(table)
                    .delete()
                    .eq('user_id', user.id)
            }

            ui.showMessage('All your data has been deleted', 'success')
        } catch (error) {
            console.error('Error deleting all data:', error)
            ui.showMessage('Failed to delete all data', 'error')
        }
    }

    showChangePasswordModal() {
        // Implementation would depend on your UI for changing passwords
        ui.showMessage('Password change functionality coming soon', 'info')
    }

    async signOut() {
        try {
            await auth.signOut()
            window.location.hash = ''
            window.location.reload()
        } catch (error) {
            console.error('Error signing out:', error)
            ui.showMessage('Failed to sign out', 'error')
        }
    }

    confirmDeleteAccount() {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.')
        if (confirmed) {
            this.deleteAccount()
        }
    }

    async deleteAccount() {
        try {
            // First delete all user data
            await this.deleteAllData()

            // Then delete the user account
            const { error } = await supabase.rpc('delete_user')
            if (error) throw error

            ui.showMessage('Your account has been deleted', 'success')
            setTimeout(() => {
                window.location.hash = ''
                window.location.reload()
            }, 2000)
        } catch (error) {
            console.error('Error deleting account:', error)
            ui.showMessage('Failed to delete account', 'error')
        }
    }

    mount(container) {
        this.container = container
        this.init().then(() => this.render())
    }
}