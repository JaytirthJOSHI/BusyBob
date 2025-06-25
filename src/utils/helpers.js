// Theme management utilities
export const theme = {
  toggle() {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    } else {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    }
  },

  initialize() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// Date formatting utilities
export const dateUtils = {
  formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  formatDateTime(dateStr, timeStr = null) {
    const date = new Date(dateStr)
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':')
      date.setHours(parseInt(hours), parseInt(minutes))
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: timeStr ? 'numeric' : undefined,
      minute: timeStr ? '2-digit' : undefined
    })
  },

  getCurrentDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  isOverdue(dateStr, timeStr = null) {
    const now = new Date()
    const dueDate = new Date(dateStr)

    if (timeStr) {
      const [hours, minutes] = timeStr.split(':')
      dueDate.setHours(parseInt(hours), parseInt(minutes))
    }

    return dueDate < now
  }
}

// Priority and category utilities
export const taskUtils = {
  getPriorityColor(priority) {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  },

  getCategoryColor(category) {
    const colors = {
      study: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      work: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      personal: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      health: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      general: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
    return colors[category] || colors.general
  },

  getPriorityIcon(priority) {
    switch (priority) {
      case 'high':
        return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      case 'medium':
        return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
      case 'low':
        return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>'
      default:
        return ''
    }
  }
}

// UI feedback utilities
export const ui = {
  showMessage(message, type = 'info', duration = 5000) {
    // Remove existing flash messages
    const existingMessages = document.querySelectorAll('.flash-message')
    existingMessages.forEach(msg => msg.remove())

    const flashMessage = document.createElement('div')
    flashMessage.className = `flash-message px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out translate-y-0 opacity-100`

    let bgColor, textColor, icon
    switch (type) {
      case 'success':
        bgColor = 'bg-green-500'
        textColor = 'text-white'
        icon = '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        break
      case 'error':
        bgColor = 'bg-red-500'
        textColor = 'text-white'
        icon = '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
        break
      case 'warning':
        bgColor = 'bg-yellow-500'
        textColor = 'text-white'
        icon = '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
        break
      default:
        bgColor = 'bg-blue-500'
        textColor = 'text-white'
        icon = '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    }

    flashMessage.className += ` ${bgColor} ${textColor}`
    flashMessage.innerHTML = `
      <div class="flex items-center">
        ${icon}
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(flashMessage)

    // Auto-remove after duration
    setTimeout(() => {
      if (flashMessage.parentElement) {
        flashMessage.style.transform = 'translateY(-100%)'
        flashMessage.style.opacity = '0'
        setTimeout(() => flashMessage.remove(), 300)
      }
    }, duration)
  },

  addPageTransition(element) {
    element.classList.add('page-transition')
  },

  showPage(pageId) {
    const pages = document.querySelectorAll('.page-content')
    pages.forEach(page => {
      page.classList.add('hidden')
    })

    const targetPage = document.getElementById(pageId + '-page')
    if (targetPage) {
      targetPage.classList.remove('hidden')
    }
  }
}

// Animation utilities
export const animations = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0'
    element.style.transition = `opacity ${duration}ms ease-in-out`

    requestAnimationFrame(() => {
      element.style.opacity = '1'
    })
  },

  slideIn(element, direction = 'down', duration = 300) {
    const transforms = {
      down: 'translateY(-10px)',
      up: 'translateY(10px)',
      left: 'translateX(10px)',
      right: 'translateX(-10px)'
    }

    element.style.transform = transforms[direction]
    element.style.opacity = '0'
    element.style.transition = `all ${duration}ms ease-in-out`

    requestAnimationFrame(() => {
      element.style.transform = 'translate(0)'
      element.style.opacity = '1'
    })
  },

  pulse(element, duration = 600) {
    element.style.animation = `pulse ${duration}ms ease-in-out`
    setTimeout(() => {
      element.style.animation = ''
    }, duration)
  }
}

// Validation utilities
export const validation = {
  email(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  },

  password(password) {
    return password.length >= 6
  },

  required(value) {
    return value && value.trim().length > 0
  }
}