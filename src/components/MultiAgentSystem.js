import { auth, supabase } from '../lib/supabase.js'
import { offlineDB } from '../utils/offline-storage.js'

// Multi-Agent System inspired by CrewAI, LangGraph, and AG2
export class MultiAgentSystem {
  constructor() {
    this.agents = new Map()
    this.workflow = null
    this.memory = new AgentMemory()
    this.tools = new ToolRegistry()
    this.isInitialized = false
    this.currentTask = null
    this.collaborationHistory = []
    
    // Agent types based on CrewAI patterns
    this.agentTypes = {
      PLANNER: 'planner',
      EXECUTOR: 'executor', 
      RESEARCHER: 'researcher',
      ANALYST: 'analyst',
      COORDINATOR: 'coordinator',
      SPECIALIST: 'specialist'
    }
    
    this.init()
  }

  async init() {
    try {
      console.log('🤖 Initializing Multi-Agent System...')
      
      // Initialize core agents
      await this.createAgents()
      
      // Set up tool registry
      await this.setupTools()
      
      // Initialize memory system
      await this.memory.init()
      
      // Create workflow engine
      this.workflow = new AgentWorkflow(this.agents, this.memory, this.tools)
      
      this.isInitialized = true
      console.log('✅ Multi-Agent System initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Multi-Agent System:', error)
    }
  }

  async createAgents() {
    // Create specialized agents for different domains
    const agents = [
      {
        id: 'academic-planner',
        type: this.agentTypes.PLANNER,
        name: 'Academic Planner',
        description: 'Plans academic tasks, schedules, and study sessions',
        capabilities: ['task_planning', 'schedule_optimization', 'goal_setting'],
        context: await this.getAcademicContext()
      },
      {
        id: 'task-executor', 
        type: this.agentTypes.EXECUTOR,
        name: 'Task Executor',
        description: 'Executes tasks and manages task lifecycle',
        capabilities: ['task_creation', 'task_updates', 'completion_tracking'],
        context: await this.getTaskContext()
      },
      {
        id: 'mood-analyst',
        type: this.agentTypes.ANALYST,
        name: 'Mood Analyst', 
        description: 'Analyzes mood patterns and provides insights',
        capabilities: ['mood_analysis', 'pattern_recognition', 'recommendations'],
        context: await this.getMoodContext()
      },
      {
        id: 'music-coordinator',
        type: this.agentTypes.COORDINATOR,
        name: 'Music Coordinator',
        description: 'Coordinates music recommendations and playlists',
        capabilities: ['playlist_creation', 'mood_music_matching', 'spotify_integration'],
        context: await this.getMusicContext()
      },
      {
        id: 'journal-specialist',
        type: this.agentTypes.SPECIALIST,
        name: 'Journal Specialist',
        description: 'Specializes in journal writing and reflection',
        capabilities: ['journal_writing', 'reflection_prompts', 'insight_generation'],
        context: await this.getJournalContext()
      }
    ]

    for (const agentConfig of agents) {
      const agent = new Agent(agentConfig)
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

  async processUserRequest(userMessage, context = {}) {
    if (!this.isInitialized) {
      throw new Error('Multi-Agent System not initialized')
    }

    console.log('🔄 Processing user request with multi-agent system')
    
    // Create a new task
    this.currentTask = {
      id: `task_${Date.now()}`,
      userMessage,
      context,
      status: 'planning',
      startTime: Date.now(),
      agents: [],
      results: []
    }

    // Execute workflow
    const result = await this.workflow.execute(this.currentTask)
    
    // Record collaboration
    this.collaborationHistory.push({
      taskId: this.currentTask.id,
      agents: this.currentTask.agents,
      duration: Date.now() - this.currentTask.startTime,
      success: result.success
    })

    return result
  }

  // Context gathering methods
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
      upcomingDeadlines: tasks.data?.filter(t => new Date(t.due_date) > new Date()).slice(0, 5) || []
    }
  }

  async getTaskContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter(t => t.completed).length || 0,
      overdueTasks: tasks?.filter(t => !t.completed && new Date(t.due_date) < new Date()).length || 0,
      recentTasks: tasks?.slice(0, 10) || []
    }
  }

  async getMoodContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const { data: moods } = await supabase
      .from('feelings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!moods?.length) return { recentMoods: [], averageMood: null }

    const recentMoods = moods.slice(0, 7)
    const averageMood = moods.reduce((sum, mood) => sum + mood.rating, 0) / moods.length

    return {
      recentMoods,
      averageMood: Math.round(averageMood * 10) / 10,
      moodTrend: this.calculateMoodTrend(moods),
      totalEntries: moods.length
    }
  }

  async getMusicContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const { data: musicConnection } = await supabase
      .from('music_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'spotify')
      .single()

    return {
      hasSpotify: !!musicConnection,
      spotifyConnected: !!musicConnection?.access_token,
      lastPlayed: musicConnection?.last_played || null
    }
  }

  async getJournalContext() {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) return {}

    const { data: entries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      totalEntries: entries?.length || 0,
      recentEntries: entries || [],
      lastEntry: entries?.[0] || null,
      averageEntryLength: entries?.length ? 
        entries.reduce((sum, entry) => sum + (entry.content?.length || 0), 0) / entries.length : 0
    }
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
    await offlineDB.saveTask(data)

    return { success: true, task: data }
  }

  async logMood(params) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const mood = {
      user_id: user.id,
      rating: params.rating,
      notes: params.notes || '',
      activities: params.activities || [],
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('feelings')
      .insert(mood)
      .select()
      .single()

    if (error) throw error

    // Also save to offline storage
    await offlineDB.saveFeeling(data)

    return { success: true, mood: data }
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
    await offlineDB.saveJournalEntry(data)

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

  calculateMoodTrend(moods) {
    if (moods.length < 2) return 'stable'
    
    const recent = moods.slice(0, 7)
    const older = moods.slice(7, 14)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, m) => sum + m.rating, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.rating, 0) / older.length
    
    const diff = recentAvg - olderAvg
    
    if (diff > 0.5) return 'improving'
    if (diff < -0.5) return 'declining'
    return 'stable'
  }

  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      activeAgents: Array.from(this.agents.keys()),
      memoryUsage: this.memory.getUsage(),
      toolCount: this.tools.getToolCount(),
      collaborationHistory: this.collaborationHistory.slice(-10)
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
  constructor(agents, memory, tools) {
    this.agents = agents
    this.memory = memory
    this.tools = tools
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
      summary: this.generateSummary([plan, execution, analysis, coordination])
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

// Export the multi-agent system
export const multiAgentSystem = new MultiAgentSystem() 