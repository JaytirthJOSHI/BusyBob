import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'

export class PointsSystem {
  constructor() {
    this.currentPoints = 0
    this.totalLifetimePoints = 0
    this.currentLevel = 1
    this.rank = null
    this.achievements = []
    this.isInitialized = false
    this.isLoading = false

    this.pointValues = {
      taskCompleted: 25,
      taskCompletedEarly: 35,
      urgentTaskCompleted: 40,
      moodLogged: 15,
      consistentMoodLogging: 30,
      journalEntry: 20,
      longJournalEntry: 35,
      pomodoroCompleted: 50,
      pomodoroStreak: 25,
      studySessionCompleted: 30,
      perfectStudyWeek: 100,
      weeklyGoalMet: 100,
      monthlyGoalMet: 250,
      perfectWeek: 500,
      dailyStreakBonus: 10,
      weeklyStreakBonus: 50,
      monthlyStreakBonus: 200
    }

    this.levelThresholds = [
      0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
      13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000, 70000
    ]

    this.rewards = [
      {
        id: 'theme_unlock_ocean',
        name: 'Ocean Theme',
        description: 'Unlock the calming ocean theme',
        type: 'theme',
        cost: 500,
        icon: '🌊',
        unlocked: false
      },
      {
        id: 'theme_unlock_forest',
        name: 'Forest Theme',
        description: 'Unlock the peaceful forest theme',
        type: 'theme',
        cost: 750,
        icon: '🌲',
        unlocked: false
      },
      {
        id: 'pomodoro_unlock_sound_pack',
        name: 'Premium Sound Pack',
        description: 'Unlock nature sounds for focus sessions',
        type: 'feature',
        cost: 1000,
        icon: '🎵',
        unlocked: false
      },
      {
        id: 'ai_unlock_advanced',
        name: 'Advanced AI Features',
        description: 'Unlock advanced AI planning and insights',
        type: 'feature',
        cost: 2000,
        icon: '🤖',
        unlocked: false
      },
      {
        id: 'premium_analytics',
        name: 'Premium Analytics',
        description: 'Detailed productivity insights and trends',
        type: 'feature',
        cost: 1500,
        icon: '📊',
        unlocked: false
      },
      {
        id: 'custom_rewards',
        name: 'Custom Reward Creation',
        description: 'Create your own personal rewards',
        type: 'feature',
        cost: 3000,
        icon: '🎁',
        unlocked: false
      }
    ]

    // Debounce timer for UI updates
    this.updateTimer = null
  }

  async init() {
    if (this.isInitialized || this.isLoading) return

    this.isLoading = true
    try {
      await this.loadUserData()
      await this.loadAchievements()
      this.createUI()
      this.attachEventListeners()
      this.isInitialized = true
      console.log('💎 Points System initialized successfully!')
    } catch (error) {
      console.error('Failed to initialize Points System:', error)
      ui.showMessage('Failed to load points system', 'error')
    } finally {
      this.isLoading = false
    }
  }

  async loadUserData() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        console.log('No user found, skipping user data load')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('points, lifetime_points, level, unlocked_rewards')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      if (data) {
        this.currentPoints = parseInt(data.points) || 0
        this.totalLifetimePoints = parseInt(data.lifetime_points) || 0
        this.currentLevel = parseInt(data.level) || 1
        this.rank = data.rank

        if (data.unlocked_rewards && Array.isArray(data.unlocked_rewards)) {
          this.rewards.forEach(reward => {
            reward.unlocked = data.unlocked_rewards.includes(reward.id)
          })
        }
      } else {
        // Create initial user metadata if it doesn't exist
        await this.createInitialUserData(user.id)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      throw error
    }
  }

  async createInitialUserData(userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          points: 0,
          lifetime_points: 0,
          level: 1,
          unlocked_rewards: []
        })
        .eq('id', userId)

      if (error) throw error

      console.log('Created initial user gamification data in profiles')
    } catch (error) {
      console.error('Error creating initial user data:', error)
      throw error
    }
  }

  async loadAchievements() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      this.achievements = data || []
    } catch (error) {
      console.error('Error loading achievements:', error)
      this.achievements = []
    }
  }

  createUI() {
    // Remove existing UI if it exists
    const existingWidget = document.getElementById('points-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    const pointsHTML = `
      <!-- Points Display Widget (Tasks Only) -->
      <div id="points-widget" class="hidden fixed top-4 left-4 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 min-w-48 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="text-2xl">💎</div>
            <div>
              <div class="font-bold text-lg text-gray-800 dark:text-white" id="current-points">${this.currentPoints.toLocaleString()}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Level ${this.currentLevel}</div>
            </div>
          </div>
          <button id="points-menu-toggle" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
          </button>
        </div>

        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
               id="level-progress" style="width: ${this.getLevelProgress()}%"></div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
          ${this.getPointsToNextLevel().toLocaleString()} points to level ${this.currentLevel + 1}
        </div>
      </div>

      <!-- Points Menu Dropdown -->
      <div id="points-menu" class="fixed top-20 left-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-80 hidden border border-gray-200 dark:border-gray-700">
        <div class="space-y-4">
          <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 class="font-bold text-lg text-gray-800 dark:text-white mb-2">Your Progress</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${this.currentLevel}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Current Level</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">${this.totalLifetimePoints.toLocaleString()}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Lifetime Points</div>
              </div>
            </div>
          </div>

          <div>
            <div class="space-y-2">
              <button id="view-rewards" class="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🏆</span>
                  <div>
                    <div class="font-medium text-gray-800 dark:text-white">View Rewards</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">See what you can unlock</div>
                  </div>
                </div>
              </button>
              <button id="view-leaderboard" class="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">👑</span>
                  <div>
                    <div class="font-medium text-gray-800 dark:text-white">Leaderboard</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Compare with others</div>
                  </div>
                </div>
              </button>
              <button id="view-achievements" class="w-full text-left p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🎖️</span>
                  <div>
                    <div class="font-medium text-gray-800 dark:text-white">Achievements</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${this.achievements.length} unlocked</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rewards Modal -->
      <div id="rewards-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">🏆 Reward Store</h2>
            <button id="close-rewards" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-lg font-semibold text-purple-800 dark:text-purple-200">Your Balance</div>
                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400"><span id="modal-points">${this.currentPoints.toLocaleString()}</span> 💎</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-600 dark:text-gray-400">Level ${this.currentLevel}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">${this.totalLifetimePoints.toLocaleString()} lifetime points</div>
              </div>
            </div>
          </div>

          <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="font-bold text-blue-800 dark:text-blue-200 mb-2">🎁 What You Can Win!</h3>
            <div class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>Themes:</strong> Beautiful new app themes to personalize your experience</p>
              <p>• <strong>Features:</strong> Advanced productivity tools and AI capabilities</p>
              <p>• <strong>Analytics:</strong> Detailed insights into your productivity patterns</p>
              <p>• <strong>Customization:</strong> Create your own rewards and goals</p>
              <p>• <strong>Achievement Badges:</strong> Show off your accomplishments</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="rewards-grid">
            ${this.renderRewardsGrid()}
          </div>
        </div>
      </div>

      <!-- Leaderboard Modal -->
      <div id="leaderboard-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">👑 Leaderboard</h2>
            <button id="close-leaderboard" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-4" id="leaderboard-content">
            <div class="text-center text-gray-500 dark:text-gray-400">Loading leaderboard...</div>
          </div>
        </div>
      </div>

      <!-- Achievements Modal -->
      <div id="achievements-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">🎖️ Achievements</h2>
            <button id="close-achievements" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="achievements-grid">
            ${this.renderAchievementsGrid()}
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', pointsHTML)
  }

  renderRewardsGrid() {
    return this.rewards.map(reward => `
      <div class="reward-card p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${reward.unlocked ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} transition-colors">
        <div class="text-center mb-3">
          <div class="text-4xl mb-2">${reward.icon}</div>
          <h3 class="font-bold text-gray-800 dark:text-white">${reward.name}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${reward.description}</p>
        </div>

        <div class="text-center">
          ${reward.unlocked ?
            '<div class="text-green-600 dark:text-green-400 font-semibold">✓ Unlocked</div>' :
            `<div class="mb-3">
              <div class="text-lg font-bold text-purple-600 dark:text-purple-400">${reward.cost.toLocaleString()} 💎</div>
            </div>
            <button class="unlock-reward w-full py-2 px-4 rounded-lg font-semibold transition-colors ${this.currentPoints >= reward.cost ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}"
                    data-reward-id="${reward.id}" ${this.currentPoints < reward.cost ? 'disabled' : ''}>
              ${this.currentPoints >= reward.cost ? 'Unlock' : 'Not enough points'}
            </button>`
          }
        </div>
      </div>
    `).join('')
  }

  renderAchievementsGrid() {
    const allAchievements = [
      {
        id: 'first_task',
        name: 'Getting Started',
        description: 'Complete your first task',
        icon: '🎯',
        unlocked: this.achievements.some(a => a.achievement_id === 'first_task')
      },
      {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Complete tasks for 7 days in a row',
        icon: '🗓️',
        unlocked: this.achievements.some(a => a.achievement_id === 'week_streak')
      },
      {
        id: 'mood_master',
        name: 'Mood Master',
        description: 'Log your mood for 30 days',
        icon: '😊',
        unlocked: this.achievements.some(a => a.achievement_id === 'mood_master')
      },
      {
        id: 'pomodoro_pro',
        name: 'Pomodoro Pro',
        description: 'Complete 100 focus sessions',
        icon: '🍅',
        unlocked: this.achievements.some(a => a.achievement_id === 'pomodoro_pro')
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 10 tasks before 9 AM',
        icon: '🐦',
        unlocked: this.achievements.some(a => a.achievement_id === 'early_bird')
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 10 tasks after 9 PM',
        icon: '🦉',
        unlocked: this.achievements.some(a => a.achievement_id === 'night_owl')
      }
    ]

    return allAchievements.map(achievement => `
      <div class="achievement-card p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${achievement.unlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'opacity-50'} transition-colors">
        <div class="flex items-center gap-4">
          <div class="text-4xl">${achievement.icon}</div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-800 dark:text-white">${achievement.name}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">${achievement.description}</p>
            <div class="mt-2">
              ${achievement.unlocked ?
                '<span class="text-yellow-600 dark:text-yellow-400 font-semibold">✓ Achieved</span>' :
                '<span class="text-gray-500 dark:text-gray-400">Not yet achieved</span>'
              }
            </div>
          </div>
        </div>
      </div>
    `).join('')
  }

  attachEventListeners() {
    // Remove existing listeners to prevent duplicates
    this.removeEventListeners()

    // Add new listeners
    document.getElementById('points-menu-toggle')?.addEventListener('click', () => this.togglePointsMenu())
    document.getElementById('view-rewards')?.addEventListener('click', () => this.openRewardsModal())
    document.getElementById('view-leaderboard')?.addEventListener('click', () => this.openLeaderboardModal())
    document.getElementById('view-achievements')?.addEventListener('click', () => this.openAchievementsModal())

    document.getElementById('close-rewards')?.addEventListener('click', () => this.closeModal('rewards-modal'))
    document.getElementById('close-leaderboard')?.addEventListener('click', () => this.closeModal('leaderboard-modal'))
    document.getElementById('close-achievements')?.addEventListener('click', () => this.closeModal('achievements-modal'))

    // Unlock reward buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('unlock-reward')) {
        const rewardId = e.target.dataset.rewardId
        this.unlockReward(rewardId)
      }
    })

    // Click outside to close menus
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#points-widget') && !e.target.closest('#points-menu')) {
        this.hidePointsMenu()
      }
    })

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals()
      }
    })
  }

  removeEventListeners() {
    // This is a simplified approach - in a real app you'd want to store references to listeners
    // For now, we'll rely on the fact that we recreate the UI elements
  }

  togglePointsMenu() {
    const menu = document.getElementById('points-menu')
    if (menu) {
      menu.classList.toggle('hidden')
    }
  }

  hidePointsMenu() {
    const menu = document.getElementById('points-menu')
    if (menu) {
      menu.classList.add('hidden')
    }
  }

  openRewardsModal() {
    this.hidePointsMenu()
    const modal = document.getElementById('rewards-modal')
    if (modal) {
      modal.classList.remove('hidden')
      document.getElementById('rewards-grid').innerHTML = this.renderRewardsGrid()
      document.getElementById('modal-points').textContent = this.currentPoints.toLocaleString()
    }
  }

  openLeaderboardModal() {
    this.hidePointsMenu()
    const modal = document.getElementById('leaderboard-modal')
    if (modal) {
      modal.classList.remove('hidden')
      this.loadLeaderboard()
    }
  }

  openAchievementsModal() {
    this.hidePointsMenu()
    const modal = document.getElementById('achievements-modal')
    if (modal) {
      modal.classList.remove('hidden')
      document.getElementById('achievements-grid').innerHTML = this.renderAchievementsGrid()
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add('hidden')
    }
  }

  closeAllModals() {
    const modals = ['rewards-modal', 'leaderboard-modal', 'achievements-modal']
    modals.forEach(modalId => this.closeModal(modalId))
  }

  async loadLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, level, points')
        .order('points', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      const content = document.getElementById('leaderboard-content')
      if (content) {
        content.innerHTML = '<div class="text-center text-red-500">Error loading leaderboard</div>'
      }
    }
  }

  async unlockReward(rewardId) {
    const reward = this.rewards.find(r => r.id === rewardId)
    if (!reward || this.currentPoints < reward.cost || reward.unlocked) {
      ui.showMessage('Cannot unlock this reward', 'error')
      return
    }

    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        ui.showMessage('Please log in to unlock rewards', 'error')
        return
      }

      const newPoints = this.currentPoints - reward.cost
      const unlockedRewards = this.rewards.filter(r => r.unlocked).map(r => r.id)
      unlockedRewards.push(rewardId)

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          points: newPoints,
          unlocked_rewards: unlockedRewards
        })

      if (updateError) throw updateError

      const { error: transactionError } = await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: -reward.cost,
        reason: `Unlocked: ${reward.name}`,
        created_at: new Date().toISOString()
      })

      if (transactionError) throw transactionError

      this.currentPoints = newPoints
      reward.unlocked = true

      this.updatePointsDisplay()
      const rewardsGrid = document.getElementById('rewards-grid')
      if (rewardsGrid) {
        rewardsGrid.innerHTML = this.renderRewardsGrid()
      }
      const modalPoints = document.getElementById('modal-points')
      if (modalPoints) {
        modalPoints.textContent = this.currentPoints.toLocaleString()
      }

      ui.showMessage(`🎉 ${reward.name} unlocked!`, 'success')

    } catch (error) {
      console.error('Error unlocking reward:', error)
      ui.showMessage('Failed to unlock reward. Please try again.', 'error')
    }
  }

  async awardPoints(points, reason, category = 'general') {
    if (!this.isInitialized) {
      console.warn('Points system not initialized, queuing points award')
      // Queue the points award for later
      setTimeout(() => this.awardPoints(points, reason, category), 1000)
      return { success: false, error: 'System not initialized' }
    }

    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) {
        console.warn('No user found for points award')
        return { success: false, error: 'No user found' }
      }

      const newPoints = this.currentPoints + points
      const newLifetimePoints = this.totalLifetimePoints + points
      const newLevel = this.calculateLevel(newLifetimePoints)

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          points: newPoints,
          lifetime_points: newLifetimePoints,
          level: newLevel
        })

      if (updateError) throw updateError

      const { error: transactionError } = await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: points,
        reason: reason,
        category: category,
        created_at: new Date().toISOString()
      })

      if (transactionError) throw transactionError

      if (newLevel > this.currentLevel) {
        this.showLevelUpNotification(this.currentLevel, newLevel)
      }

      this.currentPoints = newPoints
      this.totalLifetimePoints = newLifetimePoints
      this.currentLevel = newLevel

      this.updatePointsDisplay()

      return { success: true, newPoints, newLevel }
    } catch (error) {
      console.error('Error awarding points:', error)
      return { success: false, error }
    }
  }

  calculateLevel(lifetimePoints) {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (lifetimePoints >= this.levelThresholds[i]) {
        return i + 1
      }
    }
    return 1
  }

  getLevelProgress() {
    const currentThreshold = this.levelThresholds[this.currentLevel - 1] || 0
    const nextThreshold = this.levelThresholds[this.currentLevel] || currentThreshold + 1000
    const progress = ((this.totalLifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  getPointsToNextLevel() {
    const nextThreshold = this.levelThresholds[this.currentLevel] || this.totalLifetimePoints + 1000
    return Math.max(0, nextThreshold - this.totalLifetimePoints)
  }

  updatePointsDisplay() {
    // Debounce updates to prevent excessive DOM manipulation
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }

    this.updateTimer = setTimeout(() => {
      const currentPointsEl = document.getElementById('current-points')
      const levelProgressEl = document.getElementById('level-progress')

      if (currentPointsEl) {
        currentPointsEl.textContent = this.currentPoints.toLocaleString()
      }

      if (levelProgressEl) {
        levelProgressEl.style.width = `${this.getLevelProgress()}%`
      }
    }, 100)
  }

  showLevelUpNotification(oldLevel, newLevel) {
    // Remove any existing level up notifications
    const existingNotifications = document.querySelectorAll('.level-up-notification')
    existingNotifications.forEach(notification => notification.remove())

    const notification = document.createElement('div')
    notification.className = 'level-up-notification fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
    notification.innerHTML = `
      <div class="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-bounce">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-3xl font-bold mb-2">Level Up!</h2>
        <p class="text-xl mb-4">You've reached Level ${newLevel}!</p>
        <p class="text-lg opacity-90">Keep up the great work!</p>
        <button class="mt-6 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" onclick="this.parentElement.parentElement.remove()">
          Awesome! 🚀
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 10000)
  }

  // Public API methods
  async getPointsInfo() {
    return {
      currentPoints: this.currentPoints,
      lifetimePoints: this.totalLifetimePoints,
      level: this.currentLevel,
      levelProgress: this.getLevelProgress(),
      pointsToNextLevel: this.getPointsToNextLevel(),
      rank: this.rank,
      isInitialized: this.isInitialized
    }
  }

  getPointValue(action) {
    return this.pointValues[action] || 0
  }

  // Show/hide points widget based on current section
  showInSection(sectionName) {
    const widget = document.getElementById('points-widget')
    if (widget) {
      if (sectionName === 'tasks') {
        widget.classList.remove('hidden')
      } else {
        widget.classList.add('hidden')
      }
    }
  }

  hide() {
    const widget = document.getElementById('points-widget')
    if (widget) {
      widget.classList.add('hidden')
    }
  }

  // Cleanup method
  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }

    const elements = [
      'points-widget',
      'points-menu',
      'rewards-modal',
      'leaderboard-modal',
      'achievements-modal'
    ]

    elements.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        element.remove()
      }
    })

    this.isInitialized = false
  }
}

