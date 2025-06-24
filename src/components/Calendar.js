import { supabase } from '../lib/supabase.js'

export class Calendar {
  constructor(containerId, onDateSelect) {
    this.container = document.getElementById(containerId)
    this.onDateSelect = onDateSelect
    this.currentDate = new Date()
    this.selectedDate = null
    this.tasks = []
    this.connectedCalendars = []
    this.events = []
    this.view = 'month' // month, week, day
    this.showCalendarSettings = false
    
    this.init()
  }

  async init() {
    await this.loadConnectedCalendars()
    this.render()
  }

  async loadConnectedCalendars() {
    try {
      // Load from localStorage for now, later integrate with Supabase
      const saved = localStorage.getItem('connectedCalendars')
      this.connectedCalendars = saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading connected calendars:', error)
      this.connectedCalendars = []
    }
  }

  async saveConnectedCalendars() {
    try {
      localStorage.setItem('connectedCalendars', JSON.stringify(this.connectedCalendars))
    } catch (error) {
      console.error('Error saving connected calendars:', error)
    }
  }

  setTasks(tasks) {
    this.tasks = tasks
    this.render()
  }

  async addGoogleCalendar() {
    try {
      // Use existing Google OAuth from Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        this.showMessage('Please sign in first', 'error')
        return
      }

      // Check if user already has Google OAuth
      if (user.app_metadata?.provider === 'google') {
        // User is already signed in with Google, we can use their access token
        const { data, error } = await supabase.auth.getSession()
        
        if (error || !data.session) {
          this.showMessage('Please sign in with Google first', 'error')
          return
        }

        // Get the access token from the session
        const accessToken = data.session.provider_token
        
        if (!accessToken) {
          // Request additional scopes for calendar access
          const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: 'https://busybob.site',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
                scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
              },
            }
          })
          
          if (oauthError) {
            this.showMessage('Failed to get calendar access', 'error')
            return
          }
          
          this.showMessage('Please complete the Google authorization for calendar access', 'info')
          return
        }

        // Add Google Calendar with existing token
        const newCalendar = {
          id: `google_${Date.now()}`,
          name: 'Google Calendar',
          type: 'google',
          accessToken,
          color: '#4285F4',
          enabled: true,
          userId: user.id
        }
        
        this.connectedCalendars.push(newCalendar)
        await this.saveConnectedCalendars()
        await this.loadEvents()
        this.render()
        
        this.showMessage('Google Calendar connected successfully!', 'success')
        
      } else {
        // User is not signed in with Google, prompt them to sign in
        this.showMessage('Please sign in with Google to connect your calendar', 'info')
        
        // Redirect to Google sign-in
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://busybob.site',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
            },
          }
        })
        
        if (error) {
          this.showMessage('Failed to initiate Google sign-in', 'error')
        }
      }
      
    } catch (error) {
      console.error('Error adding Google Calendar:', error)
      this.showMessage('Failed to connect Google Calendar', 'error')
    }
  }

  async addOutlookCalendar() {
    try {
      // Demo mode - show how it would work
      if (!this.isDemoMode()) {
        // Microsoft Graph OAuth flow
        const clientId = 'YOUR_MICROSOFT_CLIENT_ID' // Replace with actual client ID
        const scope = 'https://graph.microsoft.com/Calendars.Read'
        const redirectUri = window.location.origin + '/auth/microsoft/callback'
        
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`
        
        // Open popup for OAuth
        const popup = window.open(authUrl, 'outlookAuth', 'width=500,height=600')
        
        // Handle the OAuth callback
        window.addEventListener('message', async (event) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'OUTLOOK_AUTH_SUCCESS') {
            const { accessToken } = event.data
            
            const newCalendar = {
              id: `outlook_${Date.now()}`,
              name: 'Outlook Calendar',
              type: 'outlook',
              accessToken,
              color: '#0078D4',
              enabled: true
            }
            
            this.connectedCalendars.push(newCalendar)
            await this.saveConnectedCalendars()
            await this.loadEvents()
            this.render()
            
            popup.close()
          }
        })
      } else {
        // Demo mode - add mock Outlook Calendar
        const newCalendar = {
          id: `outlook_${Date.now()}`,
          name: 'Outlook Calendar (Demo)',
          type: 'outlook',
          color: '#0078D4',
          enabled: true,
          isDemo: true
        }
        
        this.connectedCalendars.push(newCalendar)
        await this.saveConnectedCalendars()
        await this.loadDemoEvents()
        this.render()
        
        this.showMessage('Outlook Calendar connected in demo mode!', 'success')
      }
      
    } catch (error) {
      console.error('Error adding Outlook Calendar:', error)
      this.showMessage('Failed to connect Outlook Calendar', 'error')
    }
  }

  isDemoMode() {
    // Check if we're in demo mode (no OAuth credentials configured)
    return !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id'
  }

  async loadDemoEvents() {
    // Add some demo events to show how the calendar would look
    const demoEvents = [
      {
        id: 'demo-1',
        title: 'Team Meeting',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 10, 0).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 11, 0).toISOString(),
        description: 'Weekly team sync',
        location: 'Conference Room A',
        calendarColor: '#4285F4',
        calendarName: 'Google Calendar (Demo)',
        isAllDay: false
      },
      {
        id: 'demo-2',
        title: 'Lunch with Client',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 12, 0).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 13, 30).toISOString(),
        description: 'Discuss project requirements',
        location: 'Downtown Restaurant',
        calendarColor: '#0078D4',
        calendarName: 'Outlook Calendar (Demo)',
        isAllDay: false
      },
      {
        id: 'demo-3',
        title: 'Project Deadline',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5).toISOString(),
        description: 'Final project submission',
        location: '',
        calendarColor: '#4285F4',
        calendarName: 'Google Calendar (Demo)',
        isAllDay: true
      }
    ]
    
    this.events.push(...demoEvents)
  }

  async loadEvents() {
    this.events = []
    
    for (const calendar of this.connectedCalendars) {
      if (!calendar.enabled) continue
      
      try {
        if (calendar.type === 'google') {
          await this.loadGoogleEvents(calendar)
        } else if (calendar.type === 'outlook') {
          await this.loadOutlookEvents(calendar)
        }
      } catch (error) {
        console.error(`Error loading events from ${calendar.name}:`, error)
      }
    }
  }

  async loadGoogleEvents(calendar) {
    try {
      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()
      
      const response = await fetch(`/api/google/calendar?accessToken=${calendar.accessToken}&timeMin=${timeMin}&timeMax=${timeMax}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const events = data.items?.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        description: event.description,
        location: event.location,
        calendarColor: calendar.color,
        calendarName: calendar.name,
        isAllDay: !event.start.dateTime
      })) || []
      
      this.events.push(...events)
    } catch (error) {
      console.error('Error loading Google Calendar events:', error)
      // Handle token refresh if needed
      if (error.message.includes('invalid_token') || error.message.includes('expired')) {
        await this.refreshGoogleToken(calendar)
      }
    }
  }

  async loadOutlookEvents(calendar) {
    try {
      const now = new Date()
      const startDateTime = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endDateTime = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()
      
      const response = await fetch(`/api/microsoft/calendar?accessToken=${calendar.accessToken}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || data.error)
      }
      
      const events = data.value?.map(event => ({
        id: event.id,
        title: event.subject,
        start: event.start.dateTime,
        end: event.end.dateTime,
        description: event.bodyPreview,
        location: event.location?.displayName,
        calendarColor: calendar.color,
        calendarName: calendar.name,
        isAllDay: event.isAllDay
      })) || []
      
      this.events.push(...events)
    } catch (error) {
      console.error('Error loading Outlook Calendar events:', error)
      // Handle token refresh if needed
      if (error.message.includes('invalid_token') || error.message.includes('expired')) {
        await this.refreshOutlookToken(calendar)
      }
    }
  }

  async refreshGoogleToken(calendar) {
    try {
      if (!calendar.refreshToken) {
        console.error('No refresh token available for Google Calendar')
        return
      }
      
      const response = await fetch('/api/google/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: calendar.refreshToken
        })
      })
      
      const data = await response.json()
      
      if (data.accessToken) {
        calendar.accessToken = data.accessToken
        await this.saveConnectedCalendars()
        await this.loadGoogleEvents(calendar)
      }
    } catch (error) {
      console.error('Error refreshing Google token:', error)
    }
  }

  async refreshOutlookToken(calendar) {
    try {
      // Microsoft Graph tokens typically last longer, but you can implement refresh logic here
      console.log('Outlook token refresh not implemented yet')
    } catch (error) {
      console.error('Error refreshing Outlook token:', error)
    }
  }

  toggleCalendarSettings() {
    this.showCalendarSettings = !this.showCalendarSettings
    this.render()
  }

  toggleCalendar(calendarId) {
    const calendar = this.connectedCalendars.find(c => c.id === calendarId)
    if (calendar) {
      calendar.enabled = !calendar.enabled
      this.saveConnectedCalendars()
      this.loadEvents()
      this.render()
    }
  }

  removeCalendar(calendarId) {
    this.connectedCalendars = this.connectedCalendars.filter(c => c.id !== calendarId)
    this.saveConnectedCalendars()
    this.loadEvents()
    this.render()
  }

  changeView(view) {
    this.view = view
    this.render()
  }

  showMessage(message, type = 'info') {
    // Create a toast notification
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`
    
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    }
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }
    
    toast.className += ` ${colors[type]}`
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">${icons[type]}</span>
        <span class="font-medium">${message}</span>
        <button class="ml-auto text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `
    
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full')
    }, 100)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full')
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove()
        }
      }, 300)
    }, 5000)
  }

  render() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    this.container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <!-- Calendar Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">Calendar</h2>
            <div class="flex items-center space-x-2">
              <button id="calendarSettingsBtn" class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold">
              ${monthNames[month]} ${year}
            </h3>
            <div class="flex items-center space-x-2">
              <button id="prevMonth" class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button id="todayBtn" class="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium">
                Today
              </button>
              <button id="nextMonth" class="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar Settings Panel -->
        ${this.showCalendarSettings ? this.renderCalendarSettings() : ''}

        <!-- View Toggle -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div class="flex items-center justify-between">
            <div class="flex space-x-1 bg-gray-200 dark:bg-gray-600 rounded-lg p-1">
              <button id="viewMonth" class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${this.view === 'month' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}">
                Month
              </button>
              <button id="viewWeek" class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${this.view === 'week' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}">
                Week
              </button>
              <button id="viewDay" class="px-3 py-1 rounded-md text-sm font-medium transition-colors ${this.view === 'day' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}">
                Day
              </button>
            </div>
            
            <div class="flex items-center space-x-2">
              ${this.connectedCalendars.map(calendar => `
                <div class="flex items-center space-x-1">
                  <div class="w-3 h-3 rounded-full" style="background-color: ${calendar.color}"></div>
                  <span class="text-xs text-gray-600 dark:text-gray-300">${calendar.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="p-6">
          ${this.view === 'month' ? this.renderMonthView() : 
            this.view === 'week' ? this.renderWeekView() : 
            this.renderDayView()}
        </div>
      </div>
    `

    this.addEventListeners()
  }

  renderCalendarSettings() {
    return `
      <div class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Calendar Settings</h4>
            <button id="closeSettingsBtn" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <div class="flex items-center space-x-3">
                <div class="w-4 h-4 bg-blue-500 rounded"></div>
                <span class="font-medium text-gray-900 dark:text-white">BusyBob Tasks</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">Built-in</span>
                <div class="w-10 h-6 bg-blue-500 rounded-full relative">
                  <div class="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>
            </div>
            
            ${this.connectedCalendars.map(calendar => `
              <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 rounded" style="background-color: ${calendar.color}"></div>
                  <span class="font-medium text-gray-900 dark:text-white">${calendar.name}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">${calendar.type}</span>
                  <button id="toggle-${calendar.id}" class="w-10 h-6 ${calendar.enabled ? 'bg-blue-500' : 'bg-gray-300'} rounded-full relative transition-colors">
                    <div class="w-4 h-4 bg-white rounded-full absolute top-1 ${calendar.enabled ? 'right-1' : 'left-1'} transition-transform"></div>
                  </button>
                  <button id="remove-${calendar.id}" class="text-red-500 hover:text-red-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
            
            <div class="grid grid-cols-2 gap-3 pt-3">
              <button id="addGoogleBtn" class="flex items-center justify-center space-x-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span class="text-sm font-medium text-gray-900 dark:text-white">Google Calendar</span>
              </button>
              
              <button id="addOutlookBtn" class="flex items-center justify-center space-x-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.59 12.794a.996.996 0 0 0-.857-.457H20V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5.337H3.267a.996.996 0 0 0-.857.457A1 1 0 0 0 2.5 14v4a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-4a1 1 0 0 0-.41-1.206zM7 7h10v5H7V7z"/>
                </svg>
                <span class="text-sm font-medium text-gray-900 dark:text-white">Outlook Calendar</span>
              </button>
            </div>
            
            <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <div>
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Calendar Merge (Beta)</p>
                  <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Calendar merging functionality is coming soon. For now, you can connect multiple calendars and view them together.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderMonthView() {
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    return `
      <div class="space-y-2">
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
  }

  renderWeekView() {
    // Simplified week view for now
    return `
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p>Week view coming soon!</p>
      </div>
    `
  }

  renderDayView() {
    // Simplified day view for now
    return `
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p>Day view coming soon!</p>
      </div>
    `
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

      // Get events for this date
      const dayEvents = this.events.filter(event => {
        const eventDate = new Date(event.start).toDateString()
        return eventDate === currentDate.toDateString()
      })

      let dayClasses = `calendar-day relative p-2 h-16 text-center cursor-pointer transition-colors rounded-lg ${
        isCurrentMonth 
          ? 'text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20' 
          : 'text-gray-400 dark:text-gray-600'
      }`

      if (isToday) {
        dayClasses += ' bg-blue-100 dark:bg-blue-800/50 font-semibold'
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

      const eventIndicators = dayEvents.length > 0 ? `
        <div class="absolute top-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
          ${dayEvents.slice(0, 2).map(event => `
            <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${event.calendarColor || '#3B82F6'}"></div>
          `).join('')}
          ${dayEvents.length > 2 ? '<div class="text-xs">+</div>' : ''}
        </div>
      ` : ''

      days.push(`
        <div class="${dayClasses}" data-date="${currentDate.toISOString()}">
          <span class="text-sm">${currentDate.getDate()}</span>
          ${eventIndicators}
          ${taskIndicators}
        </div>
      `)

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days.join('')
  }

  addEventListeners() {
    // Navigation buttons
    document.getElementById('prevMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
      this.render()
    })

    document.getElementById('nextMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
      this.render()
    })

    document.getElementById('todayBtn')?.addEventListener('click', () => {
      this.currentDate = new Date()
      this.render()
    })

    // View toggle buttons
    document.getElementById('viewMonth')?.addEventListener('click', () => this.changeView('month'))
    document.getElementById('viewWeek')?.addEventListener('click', () => this.changeView('week'))
    document.getElementById('viewDay')?.addEventListener('click', () => this.changeView('day'))

    // Settings button
    document.getElementById('calendarSettingsBtn')?.addEventListener('click', () => this.toggleCalendarSettings())
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.toggleCalendarSettings())

    // Calendar connection buttons
    document.getElementById('addGoogleBtn')?.addEventListener('click', () => this.addGoogleCalendar())
    document.getElementById('addOutlookBtn')?.addEventListener('click', () => this.addOutlookCalendar())

    // Calendar toggle and remove buttons
    this.connectedCalendars.forEach(calendar => {
      document.getElementById(`toggle-${calendar.id}`)?.addEventListener('click', () => this.toggleCalendar(calendar.id))
      document.getElementById(`remove-${calendar.id}`)?.addEventListener('click', () => this.removeCalendar(calendar.id))
    })

    // Calendar day clicks
    this.container.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', (e) => {
        const date = e.currentTarget.dataset.date
        if (date) {
          this.selectedDate = new Date(date)
          this.onDateSelect && this.onDateSelect(this.selectedDate)
          this.render()
        }
      })
    })
  }
}