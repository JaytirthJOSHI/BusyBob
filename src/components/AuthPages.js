export class AuthPages {
  constructor() {
    this.initializeHTML()
  }

  initializeHTML() {
    const authContainer = document.getElementById('auth-container')
    if (authContainer) {
      authContainer.innerHTML = this.getAuthHTML()
    }
  }

  getAuthHTML() {
    return `
      <!-- Login Page -->
      <div id="login-page" class="max-w-md w-full space-y-8">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Mindful Student
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your personal companion for productivity and wellness
          </p>
        </div>

        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 card-hover">
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
          <div class="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start your mindful journey today
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

  showSignUp() {
    document.getElementById('login-page').classList.add('hidden')
    document.getElementById('signup-page').classList.remove('hidden')
  }
}

// Global access for onclick handlers
window.authPages = new AuthPages() 


