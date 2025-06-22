export class LandingPage {
    constructor() {
        this.container = null
    }

    render() {
        return `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
                <!-- Hero Section -->
                <section class="relative overflow-hidden">
                    <div class="max-w-7xl mx-auto">
                        <div class="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                            <!-- Navigation -->
                            <nav class="relative max-w-7xl mx-auto flex items-center justify-between pt-6 px-4 sm:px-6 lg:px-8">
                                <div class="flex items-center">
                                    <div class="h-10 w-10 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
                                        <span class="text-white font-black text-lg transform -rotate-12">B</span>
                                    </div>
                                    <span class="text-xl font-bold text-gray-900 dark:text-white">Busy <span class="text-orange-500">BOB</span></span>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <button id="landing-login-btn" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                                        Sign In
                                    </button>
                                    <button id="landing-signup-btn" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                                        Get Started Free
                                    </button>
                                </div>
                            </nav>

                            <!-- Hero Content -->
                            <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                                <div class="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                                    <div>
                                        <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                                            <span class="block">Get busy,</span>
                                            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">get organized</span>
                                        </h1>
                                        <p class="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                            The productivity powerhouse for busy students. Track tasks, monitor your mood, and maintain a journal—all in one place. Because busy students need smart solutions.
                                        </p>
                                        
                                        <!-- CTA Buttons -->
                                        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                                            <button id="hero-signup-btn" class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl">
                                                Start Your Journey Free
                                                <svg class="ml-2 w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                                </svg>
                                            </button>
                                            <button id="hero-demo-btn" class="w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                                                See How It Works
                                            </button>
                                            <button id="hero-guest-btn" class="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105 border border-yellow-300">
                                                Try Demo
                                            </button>
                                        </div>

                                        <!-- Social Proof -->
                                        <div class="mt-8">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">Launching soon! Be among the first to get organized</p>
                                            <div class="flex items-center mt-2 space-x-4">
                                                <div class="flex items-center space-x-1">
                                                    <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <span class="text-sm text-gray-600 dark:text-gray-400">Free forever</span>
                                                </div>
                                                <div class="flex items-center space-x-1">
                                                    <span class="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                    <span class="text-sm text-gray-600 dark:text-gray-400">No credit card needed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Hero Image/Animation -->
                                    <div class="mt-12 lg:mt-0 relative">
                                        <div class="relative mx-auto w-full max-w-lg">
                                            <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                                            <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                                            <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                                            <div class="relative">
                                                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                                    <div class="space-y-4">
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="font-semibold text-gray-800 dark:text-white">Today's Tasks</h3>
                                                            <span class="text-sm text-green-600 dark:text-green-400">75% Complete</span>
                                                        </div>
                                                        <div class="space-y-2">
                                                            <div class="flex items-center space-x-3">
                                                                <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                                                                <span class="text-sm text-gray-600 dark:text-gray-300 line-through">Finish math homework</span>
                                                            </div>
                                                            <div class="flex items-center space-x-3">
                                                                <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                                                                <span class="text-sm text-gray-600 dark:text-gray-300 line-through">Read chapter 5</span>
                                                            </div>
                                                            <div class="flex items-center space-x-3">
                                                                <div class="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                                                <span class="text-sm text-gray-600 dark:text-gray-300">Study for exam</span>
                                                            </div>
                                                        </div>
                                                        <div class="pt-4 border-t border-gray-200 dark:border-gray-600">
                                                            <div class="flex items-center justify-between">
                                                                <span class="text-sm text-gray-600 dark:text-gray-300">Mood Today</span>
                                                                <div class="flex space-x-1">
                                                                    <span class="text-sm text-gray-500">Good</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="text-center">
                            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                                Everything busy students need to stay organized
                            </h2>
                            <p class="mt-4 text-xl text-gray-600 dark:text-gray-300">
                                Smart tools for the hustle. Built for students who get things done.
                            </p>
                        </div>

                        <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <!-- Feature 1 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Task Management</h3>
                                <p class="text-gray-600 dark:text-gray-300">Organize assignments with priorities, categories, and stress levels. Never miss a deadline again.</p>
                            </div>

                            <!-- Feature 2 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mood Tracking</h3>
                                <p class="text-gray-600 dark:text-gray-300">Monitor your emotional well-being with daily mood logs and identify patterns that affect your productivity.</p>
                            </div>

                            <!-- Feature 3 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reflective Journaling</h3>
                                <p class="text-gray-600 dark:text-gray-300">Build self-awareness through guided journaling that helps you process experiences and grow.</p>
                            </div>

                            <!-- Feature 4 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics & Insights</h3>
                                <p class="text-gray-600 dark:text-gray-300">Understand your productivity patterns and emotional trends with beautiful, actionable charts.</p>
                            </div>

                            <!-- Feature 5 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interactive Calendar</h3>
                                <p class="text-gray-600 dark:text-gray-300">Visualize your schedule and mood patterns in a beautiful, intuitive calendar interface.</p>
                            </div>

                            <!-- Feature 6 -->
                            <div class="text-center p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div class="h-12 w-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mobile Ready</h3>
                                <p class="text-gray-600 dark:text-gray-300">Install as a PWA on your phone. Works offline and feels like a native mobile app.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- CTA Section -->
                <section class="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
                    <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                        <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
                            Ready to level up your productivity game?
                        </h2>
                        <p class="mt-4 text-xl text-blue-100">
                            Be among the first to experience the ultimate student productivity platform.
                        </p>
                        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <button id="cta-signup-btn" class="bg-white text-purple-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl">
                                Start Free Today
                                <svg class="ml-2 w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                </svg>
                            </button>
                            <button id="cta-login-btn" class="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-700 transition-all">
                                Already have an account? Sign In
                            </button>
                            <button id="cta-guest-btn" class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105 border border-yellow-300">
                                Try Demo
                            </button>
                        </div>
                        <p class="mt-4 text-sm text-blue-200">
                            No credit card required • Free forever • 2-minute setup
                        </p>
                    </div>
                </section>

                <!-- Footer -->
                <footer class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex flex-col md:flex-row justify-between items-center">
                            <div class="flex items-center mb-4 md:mb-0">
                                <div class="h-8 w-8 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-2 shadow-lg transform rotate-12">
                                    <span class="text-white font-black text-sm transform -rotate-12">B</span>
                                </div>
                                <span class="text-lg font-semibold text-gray-900 dark:text-white">Busy <span class="text-orange-500">BOB</span></span>
                            </div>
                            <div class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                                <div class="flex space-x-4 text-sm">
                                    <button id="landing-privacy-link" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        Privacy Policy
                                    </button>
                                    <button id="landing-terms-link" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        Terms of Service
                                    </button>
                                </div>
                                <div class="text-center text-gray-600 dark:text-gray-400">
                                    <p>&copy; 2025 Busy BOB. Made for students who hustle.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        `
    }

    mount(container) {
        this.container = container
        container.innerHTML = this.render()
        this.setupEventListeners()
    }

    setupEventListeners() {
        // All signup buttons lead to signup
        const signupButtons = this.container.querySelectorAll('#landing-signup-btn, #hero-signup-btn, #cta-signup-btn')
        signupButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showSignup'))
            })
        })

        // All login buttons lead to login
        const loginButtons = this.container.querySelectorAll('#landing-login-btn, #cta-login-btn')
        loginButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showLogin'))
            })
        })

        // Demo button (could show a demo or just trigger signup)
        const demoBtn = this.container.querySelector('#hero-demo-btn')
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showSignup'))
            })
        }

        // Add event listeners for Try Demo buttons
        const guestBtns = this.container.querySelectorAll('#hero-guest-btn, #cta-guest-btn')
        guestBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('demoLogin'))
            })
        })

        // Legal links
        const privacyLink = this.container.querySelector('#landing-privacy-link')
        if (privacyLink) {
            privacyLink.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showLegalPage', { detail: { page: 'privacy-policy' } }))
            })
        }

        const termsLink = this.container.querySelector('#landing-terms-link')
        if (termsLink) {
            termsLink.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showLegalPage', { detail: { page: 'terms-of-service' } }))
            })
        }
    }
} 


