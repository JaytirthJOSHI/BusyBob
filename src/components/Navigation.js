export class Navigation {
  constructor() {
    this.currentPage = 'home'
    this.initializeHTML()
    this.attachEventListeners()

    // Listen for settings changes to re-render the nav
    window.addEventListener('settingsChange', () => this.initializeHTML());
  }

  initializeHTML() {
    const navContainer = document.querySelector('nav')
    if (navContainer) {
      navContainer.innerHTML = this.getNavigationHTML()
    }
  }

  getNavigationHTML() {
    return `
      <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex justify-between">
          <a href="#" data-page="home" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="text-xs">Home</span>
          </a>

          <a href="#" data-page="tasks" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <span class="text-xs">Tasks</span>
          </a>

          <a href="#" data-page="academic-hub" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span class="text-xs">Academic</span>
          </a>

          <a href="#" data-page="calendar" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-xs">Calendar</span>
          </a>

          <a href="#" data-page="journal" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="text-xs">Journal</span>
          </a>

          <a href="#" data-page="music" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            <span class="text-xs">Music</span>
          </a>

          <a href="#" data-page="ai-notes" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span class="text-xs">AI Notes</span>
          </a>

          <a href="#" data-page="agentic-ai" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <span class="text-xs">AI Agents</span>
          </a>

          <a href="#" data-page="settings" class="nav-link flex-1 flex flex-col items-center py-2 sm:py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-xs">Settings</span>
          </a>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link')
      if (navLink) {
        e.preventDefault()
        const page = navLink.dataset.page
        if (page) {
          this.setActivePage(page)
          // Dispatch custom event for page change
          document.dispatchEvent(new CustomEvent('pageChange', { detail: { page } }))
        }
      }
    })
  }

  setActivePage(page) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link')
    navLinks.forEach(link => {
      link.classList.remove('active')
      link.classList.add('text-gray-600', 'dark:text-gray-400')
      link.classList.remove('text-blue-500', 'dark:text-blue-400')
    })

    // Add active class to current page
    const activeLink = document.querySelector(`[data-page="${page}"]`)
    if (activeLink) {
      activeLink.classList.add('active')
      activeLink.classList.remove('text-gray-600', 'dark:text-gray-400')
      activeLink.classList.add('text-blue-500', 'dark:text-blue-400')
    }

    this.currentPage = page
  }

  getCurrentPage() {
    return this.currentPage
  }
}