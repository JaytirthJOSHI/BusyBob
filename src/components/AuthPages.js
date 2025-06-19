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




