import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'
import { offlineDB } from '../utils/offline-storage.js'

export class PomodoroTimer {
  constructor() {
    this.timerState = {
      isRunning: false,
      timeLeft: 25 * 60, // 25 minutes in seconds
      currentSession: 'work', // 'work', 'shortBreak', 'longBreak'
      sessionCount: 0,
      totalFocusTime: 0,
      dailyStreak: 0
    }

    this.settings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true
    }

    this.interval = null
    this.notifications = {
      permission: 'default',
      enabled: true
    }

    this.pointsSystem = {
      workCompleted: 50,
      shortBreakCompleted: 10,
      longBreakCompleted: 25,
      dailyStreak: 20,
      weeklyGoal: 100,
      perfectWeek: 300
    }

    this.init()
  }

  async init() {
    await this.loadSettings()
    await this.loadProgress()
    this.createUI()
    this.attachEventListeners()
    this.updateDisplay()
    console.log('🍅 Pomodoro Timer initialized!')
  }

  async loadSettings() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()

      if (data?.settings?.pomodoro_settings) {
        this.settings = { ...this.settings, ...data.settings.pomodoro_settings }
      }
    } catch (error) {
      console.log('Using default Pomodoro settings')
    }
  }

  async saveSettings() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          settings: {
            pomodoro_settings: this.settings
          }
        })
    } catch (error) {
      console.error('Error saving Pomodoro settings:', error)
    }
  }

  async loadProgress() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        console.log('No user logged in, skipping progress load')
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      if (data) {
        this.timerState.sessionCount = data.filter(s => s.session_type === 'work').length
        this.timerState.totalFocusTime = data
          .filter(s => s.session_type === 'work' && s.completed)
          .reduce((total, session) => total + session.duration, 0)
        
        // Calculate daily streak
        this.calculateDailyStreak()
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  async calculateDailyStreak() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        console.log('No user logged in, skipping streak calculation')
        return
      }

      const { data } = await supabase
        .from('pomodoro_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .eq('completed', true)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) {
        this.timerState.dailyStreak = 0
        return
      }

      let streak = 0
      let currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      for (let i = 0; i < data.length; i++) {
        const sessionDate = new Date(data[i].created_at)
        sessionDate.setHours(0, 0, 0, 0)

        if (sessionDate.getTime() === currentDate.getTime()) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else if (sessionDate.getTime() < currentDate.getTime()) {
          break
        }
      }

      this.timerState.dailyStreak = streak
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }

  createUI() {
    const pomodoroHTML = `
      <div class="pomodoro-container card-hover p-6 mb-6">
        <div class="pomodoro-header flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">🍅 Focus Timer</h2>
          <button id="pomodoro-settings-btn" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>

        <div class="timer-display flex flex-col items-center">
          <div class="session-indicator flex items-center justify-between w-full mb-4">
            <span id="session-type" class="text-lg font-semibold text-gray-700 dark:text-gray-300">Work Session</span>
            <span id="session-count" class="text-sm text-gray-500 dark:text-gray-400">#1</span>
          </div>
          
          <div class="timer-circle relative mb-6">
            <svg class="timer-svg w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-200 dark:text-gray-700"></circle>
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" 
                      class="text-blue-500 transition-all duration-1000 ease-linear" id="timer-progress"
                      style="stroke-dasharray: 283; stroke-dashoffset: 283;"></circle>
            </svg>
            <div class="timer-text absolute inset-0 flex flex-col items-center justify-center">
              <div id="timer-time" class="text-4xl font-bold text-gray-800 dark:text-white">25:00</div>
              <div id="timer-label" class="text-sm text-gray-500 dark:text-gray-400">Focus Time</div>
            </div>
          </div>

          <div class="timer-controls flex gap-3">
            <button id="timer-start" class="btn-gradient text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z"></path>
              </svg>
              Start
            </button>
            <button id="timer-pause" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2" style="display: none;">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Pause
            </button>
            <button id="timer-reset" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
            <button id="timer-skip" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="pomodoro-stats grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div class="stat-card bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div class="text-2xl mb-1">🎯</div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="sessions-today">0</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Sessions Today</div>
          </div>
          <div class="stat-card bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div class="text-2xl mb-1">⏰</div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="focus-time">0m</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Focus Time</div>
          </div>
          <div class="stat-card bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
            <div class="text-2xl mb-1">🔥</div>
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" id="daily-streak">0</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
          <div class="stat-card bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <div class="text-2xl mb-1">💎</div>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400" id="points-earned">0</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Points Today</div>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="pomodoro-settings-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Pomodoro Settings</h3>
            <button id="close-settings" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work Duration (minutes)</label>
              <input type="number" id="work-duration" min="1" max="60" value="25" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Break (minutes)</label>
              <input type="number" id="short-break" min="1" max="30" value="5" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break (minutes)</label>
              <input type="number" id="long-break" min="1" max="60" value="15" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sessions until Long Break</label>
              <input type="number" id="sessions-until-long" min="2" max="10" value="4" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            
            <div class="space-y-3">
              <label class="flex items-center">
                <input type="checkbox" id="auto-start-breaks" class="mr-3">
                <span class="text-gray-700 dark:text-gray-300">Auto-start breaks</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="auto-start-work" class="mr-3">
                <span class="text-gray-700 dark:text-gray-300">Auto-start work sessions</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="sound-enabled" checked class="mr-3">
                <span class="text-gray-700 dark:text-gray-300">Sound notifications</span>
              </label>
            </div>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button id="save-settings" class="flex-1 btn-gradient text-white py-3 rounded-lg font-semibold">Save Settings</button>
            <button id="cancel-settings" class="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      </div>
    `

    // Insert into tasks page
    const tasksPage = document.getElementById('tasks-page')
    if (tasksPage && !tasksPage.querySelector('.pomodoro-container')) {
      const existingContent = tasksPage.innerHTML
      tasksPage.innerHTML = pomodoroHTML + existingContent
    }
  }

  attachEventListeners() {
    document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer())
    document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer())
    document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer())
    document.getElementById('timer-skip')?.addEventListener('click', () => this.skipSession())
    
    document.getElementById('pomodoro-settings-btn')?.addEventListener('click', () => this.openSettings())
    document.getElementById('close-settings')?.addEventListener('click', () => this.closeSettings())
    document.getElementById('cancel-settings')?.addEventListener('click', () => this.closeSettings())
    document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettingsFromModal())

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.code === 'Space' && e.target.closest('.pomodoro-container')) {
          e.preventDefault()
          this.timerState.isRunning ? this.pauseTimer() : this.startTimer()
        }
      }
    })
  }

  startTimer() {
    if (this.timerState.isRunning) return

    // Request notification permission on first user interaction
    if (this.notifications.permission === 'default') {
      this.requestNotificationPermission()
    }

    this.timerState.isRunning = true
    this.interval = setInterval(() => {
      this.timerState.timeLeft--
      this.updateDisplay()

      if (this.timerState.timeLeft <= 0) {
        this.completeSession()
      }
    }, 1000)

    this.updateButtons()
    this.showNotification('Timer started!', `${this.getSessionName()} session begun.`)
  }

  pauseTimer() {
    this.timerState.isRunning = false
    clearInterval(this.interval)
    this.updateButtons()
  }

  resetTimer() {
    this.timerState.isRunning = false
    clearInterval(this.interval)
    this.timerState.timeLeft = this.getCurrentSessionDuration() * 60
    this.updateDisplay()
    this.updateButtons()
  }

  skipSession() {
    this.completeSession(false)
  }

  async completeSession(awardPoints = true) {
    clearInterval(this.interval)
    this.timerState.isRunning = false

    const sessionType = this.timerState.currentSession
    const duration = this.getCurrentSessionDuration()
    let pointsEarned = 0

    if (awardPoints) {
      pointsEarned = this.pointsSystem[`${sessionType}Completed`] || 0
      
      if (sessionType === 'work') {
        this.timerState.sessionCount++
        this.timerState.totalFocusTime += duration
        
        if (this.timerState.sessionCount % 5 === 0) {
          pointsEarned += 25
        }
      }
    }

    await this.saveSession(sessionType, duration, awardPoints, pointsEarned)

    if (awardPoints && pointsEarned > 0) {
      await this.awardPoints(pointsEarned, `${this.getSessionName()} completed`)
    }

    if (this.settings.soundEnabled) {
      this.playCompletionSound()
    }

    this.showCompletionNotification(sessionType, pointsEarned)
    this.advanceToNextSession()
    this.updateDisplay()
    this.updateButtons()
  }

  advanceToNextSession() {
    if (this.timerState.currentSession === 'work') {
      if (this.timerState.sessionCount % this.settings.sessionsUntilLongBreak === 0) {
        this.timerState.currentSession = 'longBreak'
      } else {
        this.timerState.currentSession = 'shortBreak'
      }
    } else {
      this.timerState.currentSession = 'work'
    }

    this.timerState.timeLeft = this.getCurrentSessionDuration() * 60

    if ((this.timerState.currentSession === 'work' && this.settings.autoStartWork) ||
        (this.timerState.currentSession !== 'work' && this.settings.autoStartBreaks)) {
      setTimeout(() => this.startTimer(), 2000)
    }
  }

  async saveSession(sessionType, duration, completed, pointsEarned) {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const sessionData = {
        user_id: user.id,
        session_type: sessionType,
        duration: duration,
        completed: completed,
        points_earned: pointsEarned,
        created_at: new Date().toISOString()
      }

      await supabase.from('pomodoro_sessions').insert(sessionData)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  async awardPoints(points, reason) {
    // Points system disabled
    return
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single()

      const currentPoints = userData?.points || 0
      const newPoints = currentPoints + points

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          points: newPoints
        })

      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: points,
        reason: reason,
        created_at: new Date().toISOString()
      })

      this.showPointsNotification(points, reason)
      this.updatePointsDisplay()

      if (points >= 50) {
        this.triggerConfetti()
      }
    } catch (error) {
      console.error('Error awarding points:', error)
    }
  }

  getCurrentSessionDuration() {
    switch (this.timerState.currentSession) {
      case 'work': return this.settings.workDuration
      case 'shortBreak': return this.settings.shortBreakDuration
      case 'longBreak': return this.settings.longBreakDuration
      default: return this.settings.workDuration
    }
  }

  getSessionName() {
    switch (this.timerState.currentSession) {
      case 'work': return 'Work'
      case 'shortBreak': return 'Short Break'
      case 'longBreak': return 'Long Break'
      default: return 'Work'
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timerState.timeLeft / 60)
    const seconds = this.timerState.timeLeft % 60
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    document.getElementById('timer-time').textContent = timeString
    document.getElementById('session-type').textContent = `${this.getSessionName()} Session`
    document.getElementById('session-count').textContent = `#${this.timerState.sessionCount + 1}`
    document.getElementById('timer-label').textContent = this.timerState.currentSession === 'work' ? 'Focus Time' : 'Break Time'

    // Update progress circle
    const totalTime = this.getCurrentSessionDuration() * 60
    const progress = ((totalTime - this.timerState.timeLeft) / totalTime) * 100
    const circle = document.getElementById('timer-progress')
    if (circle) {
      const circumference = 2 * Math.PI * 45
      const strokeDashoffset = circumference - (progress / 100) * circumference
      circle.style.strokeDashoffset = strokeDashoffset
    }

    // Update stats
    document.getElementById('sessions-today').textContent = this.timerState.sessionCount
    document.getElementById('focus-time').textContent = `${Math.floor(this.timerState.totalFocusTime / 60)}m`
    document.getElementById('daily-streak').textContent = this.timerState.dailyStreak
    
    this.updatePointsDisplay()
  }

  async updatePointsDisplay() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('points')
        .eq('user_id', user.id)
        .gte('created_at', today)

      const todayPoints = transactions?.reduce((sum, t) => sum + t.points, 0) || 0
      document.getElementById('points-earned').textContent = todayPoints
    } catch (error) {
      console.error('Error updating points display:', error)
    }
  }

  updateButtons() {
    const startBtn = document.getElementById('timer-start')
    const pauseBtn = document.getElementById('timer-pause')

    if (this.timerState.isRunning) {
      startBtn.style.display = 'none'
      pauseBtn.style.display = 'flex'
    } else {
      startBtn.style.display = 'flex'
      pauseBtn.style.display = 'none'
    }
  }

  openSettings() {
    const modal = document.getElementById('pomodoro-settings-modal')
    modal.classList.remove('hidden')

    document.getElementById('work-duration').value = this.settings.workDuration
    document.getElementById('short-break').value = this.settings.shortBreakDuration
    document.getElementById('long-break').value = this.settings.longBreakDuration
    document.getElementById('sessions-until-long').value = this.settings.sessionsUntilLongBreak
    document.getElementById('auto-start-breaks').checked = this.settings.autoStartBreaks
    document.getElementById('auto-start-work').checked = this.settings.autoStartWork
    document.getElementById('sound-enabled').checked = this.settings.soundEnabled
  }

  closeSettings() {
    document.getElementById('pomodoro-settings-modal').classList.add('hidden')
  }

  async saveSettingsFromModal() {
    this.settings.workDuration = parseInt(document.getElementById('work-duration').value)
    this.settings.shortBreakDuration = parseInt(document.getElementById('short-break').value)
    this.settings.longBreakDuration = parseInt(document.getElementById('long-break').value)
    this.settings.sessionsUntilLongBreak = parseInt(document.getElementById('sessions-until-long').value)
    this.settings.autoStartBreaks = document.getElementById('auto-start-breaks').checked
    this.settings.autoStartWork = document.getElementById('auto-start-work').checked
    this.settings.soundEnabled = document.getElementById('sound-enabled').checked

    await this.saveSettings()
    this.resetTimer()
    this.closeSettings()
    
    ui.showMessage('Settings saved successfully!', 'success')
  }

  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        this.notifications.permission = permission
        this.notifications.enabled = permission === 'granted'
      })
    }
  }

  showNotification(title, body) {
    if (this.notifications.enabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      })
    }
  }

  showCompletionNotification(sessionType, pointsEarned) {
    const sessionName = this.getSessionName()
    const message = pointsEarned > 0 
      ? `${sessionName} completed! +${pointsEarned} points earned 🎉`
      : `${sessionName} completed!`
    
    this.showNotification('Pomodoro Complete!', message)
    ui.showMessage(message, 'success')
  }

  showPointsNotification(points, reason) {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 z-50 bg-purple-500 text-white p-4 rounded-lg shadow-lg animate-fade-in-down'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-2xl">💎</div>
        <div>
          <div class="font-bold">+${points} points</div>
          <div class="text-sm opacity-90">${reason}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  triggerConfetti() {
    // Simple confetti effect using existing CSS classes
    const confetti = document.createElement('div')
    confetti.className = 'fixed inset-0 pointer-events-none z-50'
    confetti.innerHTML = Array.from({ length: 50 }, () => 
      `<div class="absolute animate-bounce" style="
        left: ${Math.random() * 100}%;
        top: -10px;
        animation-delay: ${Math.random() * 3}s;
        font-size: ${Math.random() * 20 + 10}px;
      ">🎉</div>`
    ).join('')
    
    document.body.appendChild(confetti)
    
    setTimeout(() => {
      confetti.remove()
    }, 5000)
  }

  playCompletionSound() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const audioContext = new (AudioContext || webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }

  async getDailyStats() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        console.log('No user logged in, skipping daily stats')
        return { sessions: 0, totalTime: 0 }
      }

      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('created_at', today)

      const workSessions = data?.filter(s => s.session_type === 'work').length || 0
      const totalFocusTime = data?.filter(s => s.session_type === 'work')
        .reduce((total, session) => total + session.duration, 0) || 0
      
      return {
        workSessions,
        totalFocusTime,
        totalBreaks: (data?.length || 0) - workSessions
      }
    } catch (error) {
      console.error('Error getting daily stats:', error)
      return { workSessions: 0, totalFocusTime: 0, totalBreaks: 0 }
    }
  }
}