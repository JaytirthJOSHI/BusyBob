export class Calendar {
  constructor(containerId, onDateSelect) {
    this.container = document.getElementById(containerId)
    this.onDateSelect = onDateSelect
    this.currentDate = new Date()
    this.selectedDate = null
    this.tasks = []
    this.render()
  }

  setTasks(tasks) {
    this.tasks = tasks
    this.render()
  }

  render() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    this.container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            ${monthNames[month]} ${year}
          </h3>
          <div class="flex space-x-2">
            <button id="prevMonth" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button id="nextMonth" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-7 gap-1 mb-2">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
            `<div class="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">${day}</div>`
          ).join('')}
        </div>
        
        <div class="grid grid-cols-7 gap-1" id="calendarGrid">
          ${this.generateCalendarDays(startDate, lastDay)}
        </div>
      </div>
    `

    // Add event listeners
    document.getElementById('prevMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
      this.render()
    })

    document.getElementById('nextMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
      this.render()
    })

    // Add click listeners to calendar days
    this.container.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', (e) => {
        const date = e.target.dataset.date
        if (date) {
          this.selectedDate = new Date(date)
          this.onDateSelect && this.onDateSelect(this.selectedDate)
          this.render()
        }
      })
    })
  }

  generateCalendarDays(startDate, lastDay) {
    const days = []
    const currentDate = new Date(startDate)
    const today = new Date()
    const currentMonth = this.currentDate.getMonth()

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const isCurrentMonth = currentDate.getMonth() === currentMonth
      const isToday = currentDate.toDateString() === today.toDateString()
      const isSelected = this.selectedDate && currentDate.toDateString() === this.selectedDate.toDateString()
      
      // Get tasks for this date
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayTasks = this.tasks.filter(task => task.due_date === dateStr)
      const hasHighPriorityTasks = dayTasks.some(task => task.priority === 'high' && !task.completed)
      const hasOverdueTasks = dayTasks.some(task => new Date(task.due_date) < today && !task.completed)

      let dayClasses = `calendar-day relative p-2 h-12 text-center cursor-pointer transition-colors rounded-lg ${
        isCurrentMonth 
          ? 'text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900' 
          : 'text-gray-400 dark:text-gray-600'
      }`

      if (isToday) {
        dayClasses += ' bg-blue-100 dark:bg-blue-800 font-semibold'
      }

      if (isSelected) {
        dayClasses += ' bg-blue-500 text-white'
      }

      if (hasOverdueTasks) {
        dayClasses += ' border-2 border-red-500'
      } else if (hasHighPriorityTasks) {
        dayClasses += ' border-2 border-orange-500'
      }

      const taskIndicators = dayTasks.length > 0 ? `
        <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
          ${dayTasks.slice(0, 3).map(task => `
            <div class="w-1.5 h-1.5 rounded-full ${
              task.completed 
                ? 'bg-green-500' 
                : task.priority === 'high' 
                  ? 'bg-red-500' 
                  : task.priority === 'medium' 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
            }"></div>
          `).join('')}
          ${dayTasks.length > 3 ? '<div class="text-xs">+</div>' : ''}
        </div>
      ` : ''

      days.push(`
        <div class="${dayClasses}" data-date="${currentDate.toISOString()}">
          <span class="text-sm">${currentDate.getDate()}</span>
          ${taskIndicators}
        </div>
      `)

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days.join('')
  }
}
