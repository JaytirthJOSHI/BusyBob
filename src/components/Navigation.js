export class Navigation {
  constructor() {
    this.currentPage = 'home'
    this.initializeHTML()
    this.attachEventListeners()
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
          <a href="#" data-page="home" class="nav-link flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="text-xs">Home</span>
          </a>

          <a href="#" data-page="tasks" class="nav-link flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <span class="text-xs">Tasks</span>
          </a>

          <a href="#" data-page="calendar" class="nav-link flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-xs">Calendar</span>
          </a>

          <a href="#" data-page="feelings" class="nav-link flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-xs">Mindfulness</span>
          </a>

          <a href="#" data-page="journal" class="nav-link flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="text-xs">Journal</span>
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



