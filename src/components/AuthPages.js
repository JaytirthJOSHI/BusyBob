export class AuthPages {
  constructor() {
    this.container = null
  }

  mount(container) {
    this.container = container
    container.innerHTML = this.getAuthHTML()
    
    // Store reference globally for onclick handlers
    window.authPages = this
  }

  getAuthHTML() {
    return `
      <!-- Login Page -->
      <div id="login-page" class="max-w-md w-full space-y-8">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <span class="text-white font-black text-2xl transform -rotate-12">B</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Busy <span class="text-orange-500">BOB</span>
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your productivity powerhouse for getting things done
          </p>
        </div>

        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 card-hover">
          <!-- Social Login Options -->
          <div class="space-y-3 mb-6">
            <button id="google-login" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button id="github-login" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
            
            <button id="discord-login" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3" fill="#5865F2" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Continue with Discord
            </button>
          </div>
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form id="login-form" class="space-y-6">
            <div>
              <label for="login-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input id="login-email" name="email" type="email" required 
                class="form-input mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email">
            </div>
            <div>
              <label for="login-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input id="login-password" name="password" type="password" required 
                class="form-input mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password">
            </div>
            <button type="submit" class="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Sign In
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account? 
              <button onclick="window.authPages.showSignUp()" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      <!-- Sign Up Page -->
      <div id="signup-page" class="max-w-md w-full space-y-8 hidden">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <span class="text-white font-black text-2xl transform -rotate-12">B</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Join Busy <span class="text-orange-500">BOB</span>
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start your productivity journey today
          </p>
        </div>

        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 card-hover">
          <form id="signup-form" class="space-y-6">
            <div>
              <label for="signup-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input id="signup-name" name="name" type="text" required 
                class="form-input mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your full name">
            </div>
            <div>
              <label for="signup-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input id="signup-email" name="email" type="email" required 
                class="form-input mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email">
            </div>
            <div>
              <label for="signup-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input id="signup-password" name="password" type="password" required 
                class="form-input mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Create a password (min 6 characters)" minlength="6">
            </div>
            <button type="submit" class="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Create Account
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Already have an account? 
              <button onclick="window.authPages.showLogin()" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    `
  }

  showLogin() {
    document.getElementById('login-page').classList.remove('hidden')
    document.getElementById('signup-page').classList.add('hidden')
  }

  showSignup() {
    document.getElementById('login-page').classList.add('hidden')
    document.getElementById('signup-page').classList.remove('hidden')
  }

  showSignUp() {
    this.showSignup()
  }
}




