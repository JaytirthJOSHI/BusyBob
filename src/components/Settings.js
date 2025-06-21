import { auth, supabase } from '../lib/supabase.js'
import districts from '../lib/districts.js'

export class Settings {
    constructor() {
        this.studentVueConnected = false
        this.studentVueCredentials = null
    }

    async init() {
        console.log('Initializing Settings component...')
        await this.loadConnectedAccounts()
        this.render()
        this.setupEventListeners()
    }

    async loadConnectedAccounts() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            // Check if StudentVue credentials exist
            const { data, error } = await supabase.from('studentvue_credentials')
                .select('district_url, username')
                .eq('user_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No record found, which is fine
                    this.studentVueConnected = false
                    this.studentVueCredentials = null
                } else {
                    console.error('Error loading StudentVue credentials:', error)
                }
                return
            }

            if (data) {
                this.studentVueConnected = true
                this.studentVueCredentials = {
                    districtUrl: data.district_url,
                    username: data.username
                }
            }
        } catch (error) {
            console.error('Error loading connected accounts:', error)
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
                        
                        <!-- StudentVue Connection -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-medium text-gray-900 dark:text-white">StudentVue</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            ${this.studentVueConnected ? 'Connected' : 'Connect your school account to view grades, assignments, and attendance'}
                                        </p>
                                        ${this.studentVueConnected ? `
                                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Connected as: ${this.studentVueCredentials?.username || 'Unknown'}
                                            </p>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    ${this.studentVueConnected ? `
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Connected
                                        </span>
                                        <button id="disconnect-studentvue" class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                                            Disconnect
                                        </button>
                                    ` : `
                                        <button id="connect-studentvue" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Connect
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- More connected accounts can be added here -->
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-medium text-gray-900 dark:text-white">Canvas LMS</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Connect your Canvas account to sync assignments and grades</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Coming Soon
                                    </button>
                                </div>
                            </div>
                        </div>

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
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
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
            </div>
        `
    }

    setupEventListeners() {
        const container = document.getElementById('settings-container')
        if (!container) return

        // Load user email
        this.loadUserEmail()

        // Connect StudentVue button
        const connectBtn = container.querySelector('#connect-studentvue')
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.showStudentVueConnectionModal()
            })
        }

        // Disconnect StudentVue button
        const disconnectBtn = container.querySelector('#disconnect-studentvue')
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.disconnectStudentVue()
            })
        }

        // Theme toggle
        const themeToggle = container.querySelector('#settings-theme-toggle')
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark')
                const isDark = document.documentElement.classList.contains('dark')
                localStorage.setItem('theme', isDark ? 'dark' : 'light')
            })
        }
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
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Connect StudentVue</h3>
                        <button id="close-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Connect to StudentVue
                        </h4>
                        <p class="text-blue-700 dark:text-blue-300 text-sm">
                            Select your school district and enter your credentials to view your grades, assignments, and attendance.
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
                                <button type="button" id="find-by-zip-btn" class="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Find</button>
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

                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" id="cancel-connect" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                            <button type="submit" id="connect-studentvue-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Connect and Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `

        document.body.appendChild(modal)

        // Set up form functionality
        this.setupConnectionForm(modal)

        // Event listeners
        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(modal)
        })

        modal.querySelector('#cancel-connect').addEventListener('click', () => {
            document.body.removeChild(modal)
        })

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal)
            }
        })
    }

    setupConnectionForm(modal) {
        const form = modal.querySelector('#studentvue-form')
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

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            await this.handleStudentVueConnection(form, modal)
        })
    }

    async handleStudentVueConnection(form, modal) {
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
            // Import the Grades component to use its storeCredentials method
            const { Grades } = await import('./Grades.js')
            const gradesInstance = new Grades()
            
            // Store credentials
            await gradesInstance.storeCredentials(districtUrl, username, password)
            
            // Update local state
            this.studentVueConnected = true
            this.studentVueCredentials = {
                districtUrl: districtUrl,
                username: username
            }
            
            // Close modal and update UI
            document.body.removeChild(modal)
            this.showMessage('StudentVue connected successfully!', 'success')
            this.render()
            this.setupEventListeners()
            
        } catch (error) {
            console.error('Error connecting StudentVue:', error)
            this.showMessage(`Failed to connect StudentVue: ${error.message}`, 'error')
        } finally {
            connectBtn.disabled = false
            connectBtn.textContent = 'Connect and Save'
        }
    }

    async disconnectStudentVue() {
        const confirmed = confirm('Are you sure you want to disconnect your StudentVue account? This will remove all stored credentials.')
        if (!confirmed) return

        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase.from('studentvue_credentials')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            this.studentVueConnected = false
            this.studentVueCredentials = null
            this.showMessage('StudentVue account disconnected successfully', 'success')
            this.render()
            this.setupEventListeners()
        } catch (error) {
            console.error('Error disconnecting StudentVue:', error)
            this.showMessage('Failed to disconnect StudentVue account', 'error')
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