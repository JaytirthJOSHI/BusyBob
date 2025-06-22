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
            
            <button id="spotify-login" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-green-300 dark:border-green-600 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
              </svg>
              Continue with Spotify
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
          <!-- Social Login Options -->
          <div class="space-y-3 mb-6">
            <button id="google-signup" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            
            <button id="spotify-signup" type="button" class="w-full flex justify-center items-center py-3 px-4 border border-green-300 dark:border-green-600 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.2.3-.5.4-.8.4-.2 0-.4-.1-.5-.2-1.5-.9-3.4-1.1-5.6-.6-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 2.5-.5 4.6-.3 6.4.7.3.2.4.6.2.8zm1.1-2.7c-.2.4-.6.5-1 .3-1.7-1-4.4-1.3-6.4-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.3-.7 5.4-.4 7.4.8.4.2.5.6.4 1zm.1-2.8c-2.1-1.2-5.5-1.3-7.5-.7-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 2.3-.7 6.1-.5 8.6.8.4.2.6.8.3 1.2-.2.4-.8.6-1.2.3z"/>
              </svg>
              Sign up with Spotify
            </button>
            

          </div>
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or sign up with email</span>
            </div>
          </div>

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
