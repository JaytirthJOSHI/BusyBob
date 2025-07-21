import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'

// Enhanced Multi-Agent System with advanced collaboration and learning
export class MultiAgentSystem {
  constructor() {
    this.agents = new Map()
    this.workflow = null
    this.memory = new AgentMemory()
    this.tools = new ToolRegistry()
    this.isInitialized = false
    this.currentTask = null
    this.collaborationHistory = []
    this.performanceMetrics = new PerformanceMetrics()
    this.learningEngine = new LearningEngine()
    this.realTimeCollaboration = new RealTimeCollaboration()

    // Enhanced agent types with specialized roles
    this.agentTypes = {
      PLANNER: 'planner',
      EXECUTOR: 'executor',
      RESEARCHER: 'researcher',
      ANALYST: 'analyst',
      COORDINATOR: 'coordinator',
      SPECIALIST: 'specialist',
      OPTIMIZER: 'optimizer',
      CREATOR: 'creator',
      VALIDATOR: 'validator'
    }

    this.init()
  }

  async init() {
    try {
      console.log('🤖 Initializing Enhanced Multi-Agent System...')

      // Initialize core systems
      await Promise.all([
        this.createAgents(),
        this.setupTools(),
        this.memory.init(),
        this.performanceMetrics.init(),
        this.learningEngine.init(),
        this.realTimeCollaboration.init()
      ])

      // Create enhanced workflow engine
      this.workflow = new AgentWorkflow(this.agents, this.memory, this.tools, this.performanceMetrics)

      this.isInitialized = true
      console.log('✅ Enhanced Multi-Agent System initialized with advanced capabilities')
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Multi-Agent System:', error)
    }
  }

  async createAgents() {
    // Enhanced agent configurations with advanced capabilities
    const agents = [
      {
        id: 'academic-planner',
        type: this.agentTypes.PLANNER,
        name: 'Academic Planner',
        description: 'Advanced academic planning with adaptive scheduling',
        capabilities: ['task_planning', 'schedule_optimization', 'goal_setting', 'adaptive_planning'],
        context: await this.getAcademicContext(),
        learningRate: 0.8,
        collaborationStyle: 'proactive'
      },
      {
        id: 'task-executor',
        type: this.agentTypes.EXECUTOR,
        name: 'Task Executor',
        description: 'Intelligent task execution with progress tracking',
        capabilities: ['task_creation', 'task_updates', 'completion_tracking', 'priority_optimization'],
        context: await this.getTaskContext(),
        learningRate: 0.9,
        collaborationStyle: 'efficient'
      },
      {
        id: 'mood-analyst',
        type: this.agentTypes.ANALYST,
        name: 'Mood Analyst',
        description: 'Advanced mood analysis with predictive insights',
        capabilities: ['mood_analysis', 'pattern_recognition', 'predictive_insights', 'wellness_recommendations'],
        context: await this.getMoodContext(),
        learningRate: 0.7,
        collaborationStyle: 'insightful'
      },
      {
        id: 'music-coordinator',
        type: this.agentTypes.COORDINATOR,
        name: 'Music Coordinator',
        description: 'Intelligent music coordination with mood matching',
        capabilities: ['playlist_creation', 'mood_music_matching', 'spotify_integration', 'adaptive_playlists'],
        context: await this.getMusicContext(),
        learningRate: 0.6,
        collaborationStyle: 'harmonious'
      },
      {
        id: 'journal-specialist',
        type: this.agentTypes.SPECIALIST,
        name: 'Journal Specialist',
        description: 'Specialized journal writing with AI assistance',
        capabilities: ['journal_writing', 'reflection_prompts', 'insight_generation', 'emotional_analysis'],
        context: await this.getJournalContext(),
        learningRate: 0.8,
        collaborationStyle: 'creative'
      },
      {
        id: 'performance-optimizer',
        type: this.agentTypes.OPTIMIZER,
        name: 'Performance Optimizer',
        description: 'Optimizes system performance and user experience',
        capabilities: ['performance_analysis', 'optimization_suggestions', 'efficiency_tracking', 'resource_management'],
        context: await this.getPerformanceContext(),
        learningRate: 0.9,
        collaborationStyle: 'analytical'
      },
      {
        id: 'content-creator',
        type: this.agentTypes.CREATOR,
        name: 'Content Creator',
        description: 'Creates personalized content and recommendations',
        capabilities: ['content_generation', 'personalization', 'creative_suggestions', 'adaptive_content'],
        context: await this.getContentContext(),
        learningRate: 0.7,
        collaborationStyle: 'innovative'
      },
      {
        id: 'quality-validator',
        type: this.agentTypes.VALIDATOR,
        name: 'Quality Validator',
        description: 'Validates and ensures quality of agent outputs',
        capabilities: ['quality_assurance', 'error_detection', 'consistency_checking', 'feedback_analysis'],
        context: await this.getValidationContext(),
        learningRate: 0.8,
        collaborationStyle: 'thorough'
      }
    ]

    for (const agentConfig of agents) {
      const agent = new EnhancedAgent(agentConfig)
      this.agents.set(agentConfig.id, agent)
    }
  }

  async setupTools() {
    // Register tools for agents to use
    const tools = [
      {
        name: 'create_task',
        description: 'Create a new task',
        parameters: ['title', 'description', 'due_date', 'priority'],
        execute: async (params) => {
          return await this.createTask(params)
        }
      },
      {
        name: 'log_mood',
        description: 'Log a mood entry',
        parameters: ['rating', 'notes', 'activities'],
        execute: async (params) => {
          return await this.logMood(params)
        }
      },
      {
        name: 'write_journal',
        description: 'Write a journal entry',
        parameters: ['content', 'mood', 'tags'],
        execute: async (params) => {
          return await this.writeJournal(params)
        }
      },
      {
        name: 'get_academic_data',
        description: 'Get academic data from connected services',
        parameters: ['service', 'data_type'],
        execute: async (params) => {
          return await this.getAcademicData(params)
        }
      },
      {
        name: 'play_music',
        description: 'Play music based on mood or preference',
        parameters: ['mood', 'genre', 'playlist_name'],
        execute: async (params) => {
          return await this.playMusic(params)
        }
      }
    ]

    for (const tool of tools) {
      this.tools.register(tool)
    }
  }

  async processRequest(prompt) {
    try {
      console.log('🤖 Multi-agent system processing request:', prompt)

      // Special handling for task completion requests
      if (prompt.toLowerCase().includes('task') && prompt.toLowerCase().includes('complete')) {
        return await this.handleTaskCompletion(prompt)
      }

      // Route to appropriate agent based on prompt content
      const agent = this.routeToAgent(prompt)

      if (!agent) {
        return {
          success: false,
          error: 'No suitable agent found for this request'
        }
      }

      const startTime = Date.now()
      const result = await agent.process(prompt)
      const duration = Date.now() - startTime

      // Update performance metrics
      this.performanceMetrics.recordTask(agent.name, duration, result.success)

      // Update learning engine
      this.learningEngine.recordInteraction(prompt, agent.name, result.success)

      return result
    } catch (error) {
      console.error('❌ Error in multi-agent system:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async handleTaskCompletion(prompt) {
    try {
      // Get current tasks from the global tasks array
      const currentTasks = window.tasks || []
      const pendingTasks = currentTasks.filter(task => !task.completed)

      if (pendingTasks.length === 0) {
        return {
          success: true,
          response: '🎉 Great job! You have no pending tasks. All caught up!'
        }
      }

      // Analyze tasks and provide suggestions
      const suggestions = this.analyzeTasks(pendingTasks)

      let response = `📋 You have ${pendingTasks.length} pending tasks:\n\n`

      // Show top 3 priority tasks
      const topTasks = pendingTasks
        .sort((a, b) => this.getTaskPriority(b) - this.getTaskPriority(a))
        .slice(0, 3)

      response += '🎯 **Priority Tasks:**\n'
      topTasks.forEach((task, index) => {
        const priority = this.getTaskPriority(task)
        const emoji = priority > 7 ? '🔴' : priority > 4 ? '🟡' : '🟢'
        response += `${emoji} ${task.title}${task.description ? ` - ${task.description}` : ''}\n`
      })

      response += `\n💡 **Suggestions:**\n${suggestions}`

      return {
        success: true,
        response: response
      }
    } catch (error) {
      console.error('Error handling task completion:', error)
      return {
        success: false,
        error: 'Unable to analyze tasks at the moment'
      }
    }
  }

  analyzeTasks(tasks) {
    const suggestions = []

    // Check for overdue tasks
    const overdue = tasks.filter(task => new Date(task.due_date) < new Date())
    if (overdue.length > 0) {
      suggestions.push(`⚠️ You have ${overdue.length} overdue task(s). Focus on these first!`)
    }

    // Check for high priority tasks
    const highPriority = tasks.filter(task => this.getTaskPriority(task) > 7)
    if (highPriority.length > 0) {
      suggestions.push(`🔥 ${highPriority.length} high-priority task(s) need attention`)
    }

    // Suggest time management
    if (tasks.length > 5) {
      suggestions.push('⏰ Consider breaking down large tasks into smaller chunks')
    }

    // Suggest breaks
    suggestions.push('☕ Remember to take short breaks between tasks')

    return suggestions.join('\n')
  }

  getTaskPriority(task) {
    // Simple priority calculation based on due date and existing priority
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))

    let priority = 5 // Default priority

    // Adjust based on due date
    if (daysUntilDue < 0) priority += 5 // Overdue
    else if (daysUntilDue <= 1) priority += 4 // Due today/tomorrow
    else if (daysUntilDue <= 3) priority += 3 // Due this week
    else if (daysUntilDue <= 7) priority += 2 // Due next week

    // Adjust based on existing priority field
    if (task.priority === 'high') priority += 2
    else if (task.priority === 'medium') priority += 1

    return Math.min(priority, 10) // Cap at 10
  }

  // Enhanced context gathering methods
  async getAcademicContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const [studentVueCreds, canvasCreds, tasks] = await Promise.all([
      supabase.from('studentvue_credentials').select('*').eq('user_id', user.id).single(),
      supabase.from('canvas_credentials').select('*').eq('user_id', user.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true })
    ])

    return {
      hasStudentVue: !!studentVueCreds.data,
      hasCanvas: !!canvasCreds.data,
      pendingTasks: tasks.data?.length || 0,
      upcomingDeadlines: tasks.data?.filter(t => new Date(t.due_date) > new Date()).slice(0, 5) || [],
      academicPerformance: this.calculateAcademicPerformance(tasks.data)
    }
  }

  calculateAcademicPerformance(tasks) {
    if (!tasks || tasks.length === 0) return { completionRate: 0, averageGrade: 0 }

    const completedTasks = tasks.filter(t => t.completed)
    const completionRate = completedTasks.length / tasks.length

    const gradedTasks = completedTasks.filter(t => t.grade)
    const averageGrade = gradedTasks.length > 0
      ? gradedTasks.reduce((sum, t) => sum + (t.grade || 0), 0) / gradedTasks.length
      : 0

    return { completionRate, averageGrade }
  }

  async getTaskContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const tasks = await supabase.from('tasks').select('*').eq('user_id', user.id)

    return {
      totalTasks: tasks.data?.length || 0,
      completedTasks: tasks.data?.filter(t => t.completed).length || 0,
      overdueTasks: tasks.data?.filter(t => !t.completed && new Date(t.due_date) < new Date()).length || 0,
      upcomingTasks: tasks.data?.filter(t => !t.completed && new Date(t.due_date) > new Date()).slice(0, 10) || [],
      taskCategories: this.analyzeTaskCategories(tasks.data)
    }
  }

  analyzeTaskCategories(tasks) {
    if (!tasks) return {}

    const categories = {}
    tasks.forEach(task => {
      const category = task.category || 'general'
      if (!categories[category]) {
        categories[category] = { total: 0, completed: 0 }
      }
      categories[category].total++
      if (task.completed) categories[category].completed++
    })

    return categories
  }

  async getMoodContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const moods = await supabase.from('feelings').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    return {
      totalMoodEntries: moods.data?.length || 0,
      recentMoods: moods.data?.slice(0, 7) || [],
      moodTrend: this.calculateMoodTrend(moods.data),
      moodPatterns: this.analyzeMoodPatterns(moods.data)
    }
  }

  calculateMoodTrend(moods) {
    if (!moods || moods.length < 2) return 'stable'

    const recentMoods = moods.slice(0, 7).map(m => m.rating)
    const olderMoods = moods.slice(7, 14).map(m => m.rating)

    if (recentMoods.length === 0 || olderMoods.length === 0) return 'stable'

    const recentAvg = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
    const olderAvg = olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length

    if (recentAvg > olderAvg + 0.5) return 'improving'
    if (recentAvg < olderAvg - 0.5) return 'declining'
    return 'stable'
  }

  analyzeMoodPatterns(moods) {
    if (!moods || moods.length === 0) return {}

    const patterns = {
      weeklyPattern: {},
      timeOfDayPattern: {},
      activityPattern: {}
    }

    moods.forEach(mood => {
      const date = new Date(mood.created_at)
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
      const hour = date.getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

      patterns.weeklyPattern[dayOfWeek] = (patterns.weeklyPattern[dayOfWeek] || 0) + mood.rating
      patterns.timeOfDayPattern[timeOfDay] = (patterns.timeOfDayPattern[timeOfDay] || 0) + mood.rating
    })

    return patterns
  }

  async getMusicContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const musicConnections = await supabase.from('music_connections').select('*').eq('user_id', user.id).single()

    return {
      hasSpotify: !!musicConnections.data?.spotify_token,
      preferredGenres: musicConnections.data?.preferred_genres || [],
      moodMusicMapping: musicConnections.data?.mood_music_mapping || {},
      recentPlaylists: musicConnections.data?.recent_playlists || []
    }
  }

  async getJournalContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const journalEntries = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    return {
      totalEntries: journalEntries.data?.length || 0,
      recentEntries: journalEntries.data?.slice(0, 5) || [],
      writingStreak: this.calculateWritingStreak(journalEntries.data),
      commonThemes: this.analyzeJournalThemes(journalEntries.data)
    }
  }

  calculateWritingStreak(entries) {
    if (!entries || entries.length === 0) return 0

    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].created_at).toDateString()
      if (entryDate === today || entryDate === yesterday) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  analyzeJournalThemes(entries) {
    if (!entries || entries.length === 0) return []

    const themes = {}
    entries.forEach(entry => {
      const words = entry.content.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 3) {
          themes[word] = (themes[word] || 0) + 1
        }
      })
    })

    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }

  async getPerformanceContext() {
    return {
      systemPerformance: this.performanceMetrics.getSystemMetrics(),
      userEngagement: this.calculateUserEngagement(),
      optimizationOpportunities: this.identifyOptimizationOpportunities()
    }
  }

  calculateUserEngagement() {
    const recentActivity = this.collaborationHistory.slice(-10)
    return {
      activeDays: new Set(recentActivity.map(a => new Date(a.taskId).toDateString())).size,
      averageTasksPerDay: recentActivity.length / 7,
      responseTime: recentActivity.reduce((sum, a) => sum + a.duration, 0) / recentActivity.length
    }
  }

  identifyOptimizationOpportunities() {
    const opportunities = []

    // Analyze task completion patterns
    const taskCompletionRate = this.collaborationHistory.filter(h => h.success).length / this.collaborationHistory.length
    if (taskCompletionRate < 0.8) {
      opportunities.push('Improve task completion success rate')
    }

    // Analyze response times
    const avgResponseTime = this.collaborationHistory.reduce((sum, h) => sum + h.duration, 0) / this.collaborationHistory.length
    if (avgResponseTime > 5000) {
      opportunities.push('Optimize agent response times')
    }

    return opportunities
  }

  async getContentContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const [aiNotes, journalEntries] = await Promise.all([
      supabase.from('ai_notes').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id)
    ])

    return {
      totalAINotes: aiNotes.data?.length || 0,
      totalJournalEntries: journalEntries.data?.length || 0,
      contentPreferences: this.analyzeContentPreferences(aiNotes.data, journalEntries.data),
      creativePatterns: this.analyzeCreativePatterns(aiNotes.data, journalEntries.data)
    }
  }

  analyzeContentPreferences(aiNotes, journalEntries) {
    const preferences = {
      preferredLength: 'medium',
      preferredStyle: 'informal',
      preferredTopics: []
    }

    // Analyze content length preferences
    const allContent = [...(aiNotes || []), ...(journalEntries || [])]
    const avgLength = allContent.reduce((sum, item) => sum + (item.content?.length || 0), 0) / allContent.length

    if (avgLength < 100) preferences.preferredLength = 'short'
    else if (avgLength > 500) preferences.preferredLength = 'long'

    return preferences
  }

  analyzeCreativePatterns(aiNotes, journalEntries) {
    const patterns = {
      creativePeakHours: {},
      preferredFormats: {},
      inspirationSources: []
    }

    const allContent = [...(aiNotes || []), ...(journalEntries || [])]

    allContent.forEach(item => {
      const hour = new Date(item.created_at).getHours()
      patterns.creativePeakHours[hour] = (patterns.creativePeakHours[hour] || 0) + 1
    })

    return patterns
  }

  async getValidationContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const [tasks, journalEntries, moods] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id),
      supabase.from('feelings').select('*').eq('user_id', user.id)
    ])

    return {
      totalTasks: tasks.data?.length || 0,
      totalJournalEntries: journalEntries.data?.length || 0,
      totalMoodEntries: moods.data?.length || 0,
      dataQuality: this.assessDataQuality(tasks.data, journalEntries.data, moods.data)
    }
  }

  assessDataQuality(tasks, journalEntries, moods) {
    const quality = {
      completeness: 0,
      consistency: 0,
      accuracy: 0
    }

    // Assess task data quality
    if (tasks && tasks.length > 0) {
      const completeTasks = tasks.filter(t => t.title && t.due_date).length
      quality.completeness += (completeTasks / tasks.length) * 0.4
    }

    // Assess journal data quality
    if (journalEntries && journalEntries.length > 0) {
      const completeEntries = journalEntries.filter(j => j.content && j.content.length > 10).length
      quality.completeness += (completeEntries / journalEntries.length) * 0.3
    }

    // Assess mood data quality
    if (moods && moods.length > 0) {
      const completeMoods = moods.filter(m => m.rating && m.notes).length
      quality.completeness += (completeMoods / moods.length) * 0.3
    }

    return quality
  }

  // Action execution methods
  async createTask(params) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const task = {
      user_id: user.id,
      title: params.title,
      description: params.description || '',
      due_date: params.due_date || null,
      priority: params.priority || 'medium',
      completed: false,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error

    // Also save to offline storage
    await ui.saveTask(data)

    return { success: true, task: data }
  }

  async logMood(params) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const mood = {
      user_id: user.id,
      rating: params.rating,
      mood: this.getRatingText(params.rating),
      intensity: params.rating * 20, // Convert 1-5 to 20-100 scale
      notes: params.notes || '',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('feelings')
      .insert(mood)
      .select()
      .single()

    if (error) throw error

    // Also save to offline storage
    await ui.saveFeeling(data)

    return { success: true, mood: data }
  }

  getRatingText(rating) {
    const moodTexts = ['Very Bad', 'Bad', 'Okay', 'Good', 'Excellent']
    return moodTexts[rating - 1] || 'Neutral'
  }

  async writeJournal(params) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const entry = {
      user_id: user.id,
      content: params.content,
      mood: params.mood || null,
      tags: params.tags || [],
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single()

    if (error) throw error

    // Also save to offline storage
    await ui.saveJournalEntry(data)

    return { success: true, entry: data }
  }

  async getAcademicData(params) {
    // This would integrate with StudentVue and Canvas APIs
    // For now, return mock data
    return {
      success: true,
      data: {
        assignments: [],
        grades: [],
        schedule: []
      }
    }
  }

  async playMusic(params) {
    // This would integrate with Spotify API
    // For now, return mock data
    return {
      success: true,
      playlist: {
        name: params.playlist_name || 'Mood Playlist',
        tracks: []
      }
    }
  }

  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      agentCount: this.agents.size,
      memoryUsage: this.memory.getUsage(),
      toolCount: this.tools.getToolCount(),
      recentCollaborations: this.collaborationHistory.slice(-5),
      performanceMetrics: this.performanceMetrics.getSystemMetrics(),
      learningProgress: this.learningEngine.getProgress()
    }
  }

  getCollaborationMetrics() {
    return {
      ...this.collaborationMetrics,
      activeSessions: Array.from(this.collaborationSessions.values())
        .filter(s => s.status === 'active').length,
      recentSessions: Array.from(this.collaborationSessions.values())
        .slice(-5)
        .map(s => ({
          id: s.id,
          agentCount: s.agents.length,
          duration: s.duration || 0,
          efficiency: s.metrics.collaborationEfficiency
        }))
    }
  }
}

// Agent class representing individual agents
class Agent {
  constructor(config) {
    this.id = config.id
    this.type = config.type
    this.name = config.name
    this.description = config.description
    this.capabilities = config.capabilities
    this.context = config.context
    this.memory = []
    this.isActive = false
  }

  async process(input, tools, memory) {
    this.isActive = true

    try {
      // Agent-specific processing logic
      const result = await this.executeCapability(input, tools, memory)

      // Record in agent memory
      this.memory.push({
        input,
        result,
        timestamp: Date.now()
      })

      return result
    } finally {
      this.isActive = false
    }
  }

  async executeCapability(input, tools, memory) {
    // This would contain agent-specific logic
    // For now, return a structured response
    return {
      agent: this.id,
      type: this.type,
      response: `Processed by ${this.name}: ${input}`,
      confidence: 0.8,
      suggestedActions: []
    }
  }
}

// Memory system for agents
class AgentMemory {
  constructor() {
    this.episodicMemory = []
    this.semanticMemory = new Map()
    this.maxEpisodicMemories = 1000
  }

  async init() {
    // Initialize memory system
    console.log('🧠 Initializing Agent Memory System')
  }

  record(agentId, interaction, result) {
    const memory = {
      agentId,
      interaction,
      result,
      timestamp: Date.now()
    }

    this.episodicMemory.push(memory)

    // Maintain memory size
    if (this.episodicMemory.length > this.maxEpisodicMemories) {
      this.episodicMemory = this.episodicMemory.slice(-this.maxEpisodicMemories)
    }
  }

  getRelevantMemories(query, limit = 10) {
    // Simple relevance scoring - in a real system, this would use embeddings
    return this.episodicMemory
      .filter(memory =>
        memory.interaction.includes(query) ||
        memory.result.response.includes(query)
      )
      .slice(-limit)
  }

  getUsage() {
    return {
      episodicCount: this.episodicMemory.length,
      semanticCount: this.semanticMemory.size,
      maxEpisodic: this.maxEpisodicMemories
    }
  }
}

// Tool registry for agent capabilities
class ToolRegistry {
  constructor() {
    this.tools = new Map()
  }

  register(tool) {
    this.tools.set(tool.name, tool)
  }

  getTool(name) {
    return this.tools.get(name)
  }

  getToolsByCategory(category) {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category)
  }

  getToolCount() {
    return this.tools.size
  }
}

// Workflow engine for coordinating agents
class AgentWorkflow {
  constructor(agents, memory, tools, performanceMetrics) {
    this.agents = agents
    this.memory = memory
    this.tools = tools
    this.performanceMetrics = performanceMetrics
  }

  async execute(task) {
    console.log('🔄 Starting agent workflow execution')

    // Step 1: Planning phase
    const planner = this.agents.get('academic-planner')
    const plan = await planner.process(task.userMessage, this.tools, this.memory)

    // Step 2: Execution phase
    const executor = this.agents.get('task-executor')
    const execution = await executor.process(plan, this.tools, this.memory)

    // Step 3: Analysis phase (if needed)
    let analysis = null
    if (task.context.needsAnalysis) {
      const analyst = this.agents.get('mood-analyst')
      analysis = await analyst.process(execution, this.tools, this.memory)
    }

    // Step 4: Coordination phase
    const coordinator = this.agents.get('music-coordinator')
    const coordination = await coordinator.process({
      plan,
      execution,
      analysis
    }, this.tools, this.memory)

    // Record all interactions in memory
    [plan, execution, analysis, coordination].forEach(result => {
      if (result) {
        this.memory.record(result.agent, task.userMessage, result)
      }
    })

    return {
      success: true,
      plan,
      execution,
      analysis,
      coordination,
      summary: this.generateSummary([plan, execution, analysis, coordination]),
      performanceMetrics: this.performanceMetrics.generateMetrics([plan, execution, analysis, coordination])
    }
  }

  generateSummary(results) {
    const validResults = results.filter(r => r !== null)
    return {
      agentsUsed: validResults.map(r => r.agent),
      confidence: validResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / validResults.length,
      suggestedActions: validResults.flatMap(r => r.suggestedActions || [])
    }
  }
}

// Enhanced Agent with advanced capabilities
class EnhancedAgent {
  constructor(config) {
    this.id = config.id
    this.type = config.type
    this.name = config.name
    this.description = config.description
    this.capabilities = config.capabilities
    this.context = config.context
    this.learningRate = config.learningRate || 0.7
    this.collaborationStyle = config.collaborationStyle || 'cooperative'
    this.memory = new Map()
    this.performanceHistory = []
    this.collaborationHistory = []
    this.learningProgress = 0
  }

  async process(input, tools, memory) {
    const startTime = Date.now()

    try {
      // Analyze input and determine best approach
      const analysis = await this.analyzeInput(input)

      // Select appropriate capability
      const capability = this.selectCapability(analysis)

      // Execute with context and tools
      const result = await this.executeCapability(capability, input, tools, memory)

      // Record performance
      const duration = Date.now() - startTime
      this.recordPerformance(capability, duration, result.success)

      // Update learning progress
      this.updateLearningProgress(result)

      return result
    } catch (error) {
      console.error(`Error in agent ${this.name}:`, error)
      return { success: false, error: error.message, agent: this.name }
    }
  }

  async analyzeInput(input) {
    // Simple input analysis - can be enhanced with NLP
    const analysis = {
      complexity: this.assessComplexity(input),
      intent: this.extractIntent(input),
      entities: this.extractEntities(input),
      urgency: this.assessUrgency(input)
    }

    return analysis
  }

  assessComplexity(input) {
    const wordCount = input.split(' ').length
    const hasSpecialTerms = /(task|schedule|plan|analyze|create|find)/i.test(input)
    const hasNumbers = /\d+/.test(input)

    let complexity = 'simple'
    if (wordCount > 20 || hasSpecialTerms) complexity = 'medium'
    if (wordCount > 50 || (hasSpecialTerms && hasNumbers)) complexity = 'complex'

    return complexity
  }

  extractIntent(input) {
    const intents = {
      create: /(create|add|make|new)/i,
      find: /(find|search|look|get)/i,
      update: /(update|change|modify|edit)/i,
      delete: /(delete|remove|clear)/i,
      analyze: /(analyze|examine|review|check)/i,
      plan: /(plan|schedule|organize|arrange)/i
    }

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(input)) return intent
    }

    return 'general'
  }

  extractEntities(input) {
    const entities = {
      tasks: input.match(/(task|assignment|project|todo)/gi) || [],
      dates: input.match(/\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|tomorrow|today|next week/gi) || [],
      priorities: input.match(/(high|medium|low|urgent|important)/gi) || [],
      categories: input.match(/(academic|personal|work|study|health)/gi) || []
    }

    return entities
  }

  assessUrgency(input) {
    const urgentTerms = /(urgent|asap|immediately|now|quick|fast)/i
    const timeTerms = /(today|tomorrow|this week|deadline)/i

    if (urgentTerms.test(input)) return 'high'
    if (timeTerms.test(input)) return 'medium'
    return 'low'
  }

  selectCapability(analysis) {
    // Select best capability based on analysis
    const capabilityMap = {
      create: 'task_creation',
      find: 'search_information',
      update: 'task_updates',
      delete: 'task_management',
      analyze: 'mood_analysis',
      plan: 'task_planning'
    }

    const intent = analysis.intent
    return capabilityMap[intent] || this.capabilities[0]
  }

  async executeCapability(capability, input, tools, memory) {
    // Execute the selected capability
    const tool = tools.getTool(capability)

    if (tool) {
      return await tool.execute({ input, context: this.context, memory })
    } else {
      // Fallback to default execution
      return await this.defaultExecute(capability, input, tools, memory)
    }
  }

  async defaultExecute(capability, input, tools, memory) {
    // Default execution logic
    const result = {
      success: true,
      content: `Agent ${this.name} processed: ${input}`,
      capability,
      agent: this.name,
      timestamp: new Date().toISOString()
    }

    // Store in memory
    this.memory.set(`${capability}_${Date.now()}`, result)

    return result
  }

  recordPerformance(capability, duration, success) {
    this.performanceHistory.push({
      capability,
      duration,
      success,
      timestamp: Date.now()
    })

    // Keep only recent history
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-50)
    }
  }

  updateLearningProgress(result) {
    if (result.success) {
      this.learningProgress += this.learningRate * 0.1
    } else {
      this.learningProgress += this.learningRate * 0.05
    }

    this.learningProgress = Math.min(this.learningProgress, 1.0)
  }

  getPerformanceMetrics() {
    const recent = this.performanceHistory.slice(-10)
    if (recent.length === 0) return { avgDuration: 0, successRate: 0 }

    const avgDuration = recent.reduce((sum, p) => sum + p.duration, 0) / recent.length
    const successRate = recent.filter(p => p.success).length / recent.length

    return { avgDuration, successRate }
  }
}

// Performance Metrics System
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      taskDurations: [],
      successRates: [],
      agentPerformance: new Map(),
      systemLoad: [],
      userSatisfaction: []
    }
    this.currentTask = null
  }

  async init() {
    console.log('📊 Initializing Performance Metrics System')
  }

  startTask() {
    this.currentTask = {
      startTime: Date.now(),
      agents: [],
      steps: []
    }
  }

  endTask() {
    if (!this.currentTask) return {}

    const duration = Date.now() - this.currentTask.startTime
    this.metrics.taskDurations.push(duration)

    const metrics = {
      duration,
      agentCount: this.currentTask.agents.length,
      stepCount: this.currentTask.steps.length,
      timestamp: Date.now()
    }

    this.currentTask = null
    return metrics
  }

  recordAgentPerformance(agentId, duration, success) {
    if (!this.metrics.agentPerformance.has(agentId)) {
      this.metrics.agentPerformance.set(agentId, [])
    }

    this.metrics.agentPerformance.get(agentId).push({
      duration,
      success,
      timestamp: Date.now()
    })
  }

  getSystemMetrics() {
    const recentTasks = this.metrics.taskDurations.slice(-20)
    const avgTaskDuration = recentTasks.length > 0
      ? recentTasks.reduce((sum, d) => sum + d, 0) / recentTasks.length
      : 0

    const agentMetrics = {}
    for (const [agentId, performance] of this.metrics.agentPerformance) {
      const recent = performance.slice(-10)
      agentMetrics[agentId] = {
        avgDuration: recent.reduce((sum, p) => sum + p.duration, 0) / recent.length,
        successRate: recent.filter(p => p.success).length / recent.length
      }
    }

    return {
      avgTaskDuration,
      agentMetrics,
      totalTasks: this.metrics.taskDurations.length,
      systemHealth: this.calculateSystemHealth()
    }
  }

  calculateSystemHealth() {
    const recentTasks = this.metrics.taskDurations.slice(-10)
    const avgDuration = recentTasks.reduce((sum, d) => sum + d, 0) / recentTasks.length

    if (avgDuration < 2000) return 'excellent'
    if (avgDuration < 5000) return 'good'
    if (avgDuration < 10000) return 'fair'
    return 'poor'
  }

  generateMetrics(results) {
    return {
      totalSteps: results.length,
      avgStepDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length,
      successRate: results.filter(r => r.success).length / results.length,
      agentInvolvement: new Set(results.map(r => r.agent)).size
    }
  }
}

// Learning Engine for Agent Improvement
class LearningEngine {
  constructor() {
    this.learningData = new Map()
    this.patterns = new Map()
    this.recommendations = []
  }

  async init() {
    console.log('🧠 Initializing Learning Engine')
  }

  async extractInsights(task) {
    const insights = {
      patterns: this.analyzePatterns(task),
      recommendations: this.generateRecommendations(task),
      improvements: this.suggestImprovements(task)
    }

    this.learningData.set(task.id, insights)
    return insights
  }

  analyzePatterns(task) {
    const patterns = {
      agentCollaboration: this.analyzeAgentCollaboration(task),
      taskComplexity: this.analyzeTaskComplexity(task),
      userPreferences: this.analyzeUserPreferences(task)
    }

    return patterns
  }

  analyzeAgentCollaboration(task) {
    const agentCount = task.agents.length
    const collaborationPattern = agentCount > 2 ? 'multi-agent' : 'single-agent'

    return {
      pattern: collaborationPattern,
      efficiency: this.calculateCollaborationEfficiency(task),
      recommendations: this.getCollaborationRecommendations(agentCount)
    }
  }

  calculateCollaborationEfficiency(task) {
    const duration = task.results.length > 0 ? task.results[task.results.length - 1].timestamp - task.startTime : 0
    const agentCount = task.agents.length

    // Simple efficiency calculation
    return agentCount > 0 ? duration / agentCount : 0
  }

  getCollaborationRecommendations(agentCount) {
    if (agentCount === 0) return ['Consider using agents for complex tasks']
    if (agentCount === 1) return ['Single agent tasks are efficient for simple requests']
    if (agentCount > 3) return ['Consider task decomposition for better efficiency']
    return ['Optimal agent collaboration achieved']
  }

  analyzeTaskComplexity(task) {
    const wordCount = task.userMessage.split(' ').length
    const hasSpecialTerms = /(analyze|create|plan|find|update)/i.test(task.userMessage)

    let complexity = 'simple'
    if (wordCount > 15 || hasSpecialTerms) complexity = 'medium'
    if (wordCount > 30 || (hasSpecialTerms && wordCount > 20)) complexity = 'complex'

    return {
      level: complexity,
      factors: { wordCount, hasSpecialTerms },
      recommendations: this.getComplexityRecommendations(complexity)
    }
  }

  getComplexityRecommendations(complexity) {
    switch (complexity) {
      case 'simple': return ['Simple tasks are handled efficiently']
      case 'medium': return ['Consider breaking down complex requests']
      case 'complex': return ['Complex tasks benefit from multi-agent collaboration']
      default: return ['Task complexity analysis complete']
    }
  }

  analyzeUserPreferences(task) {
    const preferences = {
      responseStyle: this.detectResponseStyle(task),
      preferredAgents: this.detectPreferredAgents(task),
      interactionPattern: this.detectInteractionPattern(task)
    }

    return preferences
  }

  detectResponseStyle(task) {
    const message = task.userMessage.toLowerCase()
    if (message.includes('quick') || message.includes('fast')) return 'efficient'
    if (message.includes('detailed') || message.includes('explain')) return 'detailed'
    if (message.includes('simple') || message.includes('brief')) return 'concise'
    return 'balanced'
  }

  detectPreferredAgents(task) {
    const agentUsage = {}
    task.agents.forEach(agent => {
      agentUsage[agent] = (agentUsage[agent] || 0) + 1
    })

    return Object.entries(agentUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([agent]) => agent)
  }

  detectInteractionPattern(task) {
    const duration = Date.now() - task.startTime
    if (duration < 2000) return 'quick'
    if (duration < 10000) return 'standard'
    return 'extended'
  }

  generateRecommendations(task) {
    const recommendations = []

    // Performance recommendations
    if (task.results.length > 5) {
      recommendations.push('Consider task decomposition for better performance')
    }

    // Agent recommendations
    if (task.agents.length === 0) {
      recommendations.push('No agents involved - consider agent collaboration')
    }

    // User experience recommendations
    const avgResponseTime = task.results.reduce((sum, r) => sum + (r.duration || 0), 0) / task.results.length
    if (avgResponseTime > 5000) {
      recommendations.push('Response time could be optimized')
    }

    return recommendations
  }

  suggestImprovements(task) {
    const improvements = []

    // Agent selection improvements
    if (task.agents.length > 3) {
      improvements.push('Optimize agent selection for task complexity')
    }

    // Tool usage improvements
    const toolUsage = task.results.filter(r => r.tool).length
    if (toolUsage === 0) {
      improvements.push('Consider using specialized tools for better results')
    }

    return improvements
  }

  async updateAgents(agents, task) {
    const insights = await this.extractInsights(task)

    for (const [agentId, agent] of agents) {
      if (agent.updateLearningProgress) {
        agent.updateLearningProgress(insights)
      }
    }
  }

  getProgress() {
    return {
      totalInsights: this.learningData.size,
      patternsIdentified: this.patterns.size,
      recommendationsGenerated: this.recommendations.length,
      learningEfficiency: this.calculateLearningEfficiency()
    }
  }

  calculateLearningEfficiency() {
    const recentInsights = Array.from(this.learningData.values()).slice(-10)
    if (recentInsights.length === 0) return 0

    const avgRecommendations = recentInsights.reduce((sum, insight) =>
      sum + insight.recommendations.length, 0) / recentInsights.length

    return Math.min(avgRecommendations / 5, 1.0) // Normalize to 0-1
  }
}

// Real-time Collaboration System
class RealTimeCollaboration {
  constructor() {
    this.collaborationSessions = new Map()
    this.communicationChannels = new Map()
    this.collaborationMetrics = {
      totalSessions: 0,
      activeSessions: 0,
      avgSessionDuration: 0
    }
  }

  async init() {
    console.log('🤝 Initializing Real-time Collaboration System')
    this.setupCommunicationChannels()
  }

  setupCommunicationChannels() {
    // Set up communication channels for different agent types
    const channels = ['planning', 'execution', 'analysis', 'coordination', 'validation']

    channels.forEach(channel => {
      this.communicationChannels.set(channel, {
        messages: [],
        participants: new Set(),
        active: false
      })
    })
  }

  async startCollaborationSession(agents, task) {
    const sessionId = `session_${Date.now()}`

    const session = {
      id: sessionId,
      agents: agents,
      task: task,
      startTime: Date.now(),
      messages: [],
      status: 'active',
      metrics: {
        messageCount: 0,
        agentParticipation: new Map(),
        collaborationEfficiency: 0
      }
    }

    this.collaborationSessions.set(sessionId, session)
    this.collaborationMetrics.totalSessions++
    this.collaborationMetrics.activeSessions++

    console.log(`🤝 Started collaboration session ${sessionId} with ${agents.length} agents`)

    return sessionId
  }

  async sendMessage(sessionId, fromAgent, toAgent, message, messageType = 'collaboration') {
    const session = this.collaborationSessions.get(sessionId)
    if (!session) return false

    const collaborationMessage = {
      id: `msg_${Date.now()}`,
      from: fromAgent,
      to: toAgent,
      content: message,
      type: messageType,
      timestamp: Date.now()
    }

    session.messages.push(collaborationMessage)
    session.metrics.messageCount++

    // Update agent participation
    if (!session.metrics.agentParticipation.has(fromAgent)) {
      session.metrics.agentParticipation.set(fromAgent, 0)
    }
    session.metrics.agentParticipation.set(fromAgent,
      session.metrics.agentParticipation.get(fromAgent) + 1)

    return true
  }

  async endCollaborationSession(sessionId) {
    const session = this.collaborationSessions.get(sessionId)
    if (!session) return false

    session.status = 'completed'
    session.endTime = Date.now()
    session.duration = session.endTime - session.startTime

    // Calculate collaboration efficiency
    session.metrics.collaborationEfficiency = this.calculateCollaborationEfficiency(session)

    this.collaborationMetrics.activeSessions--

    // Update average session duration
    const completedSessions = Array.from(this.collaborationSessions.values())
      .filter(s => s.status === 'completed')

    if (completedSessions.length > 0) {
      this.collaborationMetrics.avgSessionDuration =
        completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
    }

    console.log(`✅ Completed collaboration session ${sessionId}`)
    return true
  }

  calculateCollaborationEfficiency(session) {
    const agentCount = session.agents.length
    const messageCount = session.messages.length
    const duration = session.duration

    if (agentCount === 0 || duration === 0) return 0

    // Simple efficiency calculation based on message density and agent participation
    const messageDensity = messageCount / duration * 1000 // messages per second
    const participationBalance = this.calculateParticipationBalance(session.metrics.agentParticipation)

    return (messageDensity * 0.6 + participationBalance * 0.4) / 10 // Normalize to 0-1
  }

  calculateParticipationBalance(participation) {
    const values = Array.from(participation.values())
    if (values.length === 0) return 0

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length

    // Lower variance means more balanced participation
    return Math.max(0, 1 - variance / avg)
  }

  getCollaborationMetrics() {
    return {
      ...this.collaborationMetrics,
      activeSessions: Array.from(this.collaborationSessions.values())
        .filter(s => s.status === 'active').length,
      recentSessions: Array.from(this.collaborationSessions.values())
        .slice(-5)
        .map(s => ({
          id: s.id,
          agentCount: s.agents.length,
          duration: s.duration || 0,
          efficiency: s.metrics.collaborationEfficiency
        }))
    }
  }
}

// Simple Widget System for Home Page
export class MultiAgentWidgets {
  constructor(multiAgentSystem) {
    this.system = multiAgentSystem
  }

  // Generate development widgets for home page
  generateDevelopmentWidgets() {
    return `
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="mr-2">🚧</span>
          Development Features
        </h3>

        <!-- AI Team Status -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">🤖 AI Team Status</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            ${this.renderAgentStatus()}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">⚡ Quick Actions</h4>
          <div class="space-y-2">
            <button class="w-full text-left p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" onclick="testMultiAgentSystem('Create a study schedule for this week')">
              📅 Create Study Schedule
            </button>
            <button class="w-full text-left p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors" onclick="testMultiAgentSystem('Analyze my mood patterns')">
              😊 Analyze Mood Patterns
            </button>
            <button class="w-full text-left p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors" onclick="testMultiAgentSystem('Suggest music for studying')">
              🎵 Music Suggestions
            </button>
            <button class="w-full text-left p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors" onclick="testMultiAgentSystem('Help me complete my tasks')">
              ✅ Task Completion Helper
            </button>
          </div>
        </div>

        <!-- System Metrics -->
        <div>
          <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">📊 System Metrics</h4>
          <div id="system-metrics-widget" class="text-sm text-gray-600 dark:text-gray-400">
            Loading metrics...
          </div>
        </div>
      </div>
    `
  }

  renderAgentStatus() {
    if (!this.system || !this.system.agents) return '<div>Agents not initialized</div>'

    return Array.from(this.system.agents.values()).map(agent => `
      <div class="flex items-center space-x-2 p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div class="w-2 h-2 rounded-full ${this.getAgentStatusColor(agent)}"></div>
        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${agent.name}</span>
      </div>
    `).join('')
  }

  getAgentStatusColor(agent) {
    const metrics = agent.getPerformanceMetrics ? agent.getPerformanceMetrics() : { successRate: 0 }
    if (metrics.successRate > 0.8) return 'bg-green-500'
    if (metrics.successRate > 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  updateMetrics() {
    if (!this.system) return

    const metricsDiv = document.getElementById('system-metrics-widget')
    if (!metricsDiv) return

    try {
      const status = this.system.getSystemStatus()
      const performance = this.system.performanceMetrics?.getSystemMetrics()

      metricsDiv.innerHTML = `
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Agents Active:</span>
            <span class="font-medium">${status.agentCount}</span>
          </div>
          <div class="flex justify-between">
            <span>System Health:</span>
            <span class="font-medium ${this.getHealthColor(performance?.systemHealth)}">${performance?.systemHealth || 'Unknown'}</span>
          </div>
          <div class="flex justify-between">
            <span>Avg Response:</span>
            <span class="font-medium">${Math.round(performance?.avgTaskDuration || 0)}ms</span>
          </div>
          <div class="flex justify-between">
            <span>Learning Progress:</span>
            <span class="font-medium">${Math.round((status.learningProgress?.learningEfficiency || 0) * 100)}%</span>
          </div>
        </div>
      `
    } catch (error) {
      metricsDiv.innerHTML = '<div class="text-red-500">Error loading metrics</div>'
    }
  }

  getHealthColor(health) {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
}

// Export the multi-agent system
export const multiAgentSystem = new MultiAgentSystem()