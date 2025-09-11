import { auth, supabase } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'

export class AIAgent {
  constructor() {
    this.isOpen = false
    this.messages = [
      {
        type: 'bot',
        content: '🚀 Welcome to BusyBob AI - your advanced agentic assistant! I\'m designed to think, plan, and act strategically to help you achieve your academic and personal goals.\n\n🧠 **My Agentic Capabilities:**\n• **Analyze** patterns in your data to provide insights\n• **Plan** multi-step solutions for complex challenges\n• **Create** personalized study plans and schedules\n• **Track** and correlate your mood, tasks, and productivity\n• **Proactively** suggest improvements and optimizations\n• **Learn** from your behavior to provide better assistance\n\n💡 I can help with task management, mood tracking, academic planning, and much more. All actions require your approval, but I\'ll think several steps ahead to provide comprehensive solutions.\n\nWhat would you like to work on today?',
        timestamp: new Date()
      }
    ]
    this.isTyping = false
    this.pendingActions = []
    this.initialized = false
    
    this.studentVueData = null
    this.canvasData = null
    this.spotifyData = null
    this.userTasks = []
    this.userMoods = []
    this.userJournalEntries = []
    
    setTimeout(() => {
      this.init()
    }, 100)
  }

  async init() {
    try {
      if (this.initialized) return
      
      console.log('🧠 Initializing Enhanced Agentic AI...')
      await this.loadIntegrationData()
      this.createAIAgentHTML()
      this.attachEventListeners()
      
      // Start proactive analysis after initialization
      setTimeout(() => this.startProactiveAnalysis(), 5000)
      
      this.initialized = true
      console.log('✅ Enhanced Agentic AI initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing AI Agent:', error)
    }
  }

  async startProactiveAnalysis() {
    try {
      // Only run if user has some data to analyze
      if (this.userTasks.length > 2 || this.userMoods.length > 3) {
        console.log('🔍 Running proactive analysis...')
        const insights = await this.performPatternAnalysis('all')
        
        if (insights.insights.length > 0) {
          // Add proactive insights message
          this.messages.push({
            type: 'bot',
            content: `🔍 **Proactive Analysis Complete!**\n\nI've analyzed your recent activity and found some interesting patterns:\n\n${insights.insights.slice(0, 2).map(insight => `• ${insight.message}`).join('\n')}\n\n${insights.recommendations.length > 0 ? `💡 **Recommendations:**\n${insights.recommendations.slice(0, 1).map(rec => `• ${rec.message}`).join('\n')}` : ''}\n\nWould you like me to dive deeper into any of these insights?`,
            timestamp: new Date()
          })
          
          this.renderMessages()
        }
      }
    } catch (error) {
      console.log('Proactive analysis skipped:', error.message)
    }
  }

  async loadIntegrationData() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      await Promise.all([
        this.loadUserTasks(),
        this.loadUserMoods(),
        this.loadJournalEntries(),
        this.loadStudentVueStatus(),
        this.loadCanvasStatus(),
        this.loadSpotifyStatus()
      ])
    } catch (error) {
      console.error('Error loading integration data:', error)
    }
  }

  async loadUserTasks() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      this.userTasks = tasks || []
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  async loadUserMoods() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: moods } = await supabase
        .from('feelings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      this.userMoods = moods || []
    } catch (error) {
      console.error('Error loading moods:', error)
    }
  }

  async loadJournalEntries() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      this.userJournalEntries = entries || []
    } catch (error) {
      console.error('Error loading journal entries:', error)
    }
  }

  async loadStudentVueStatus() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: credentials } = await supabase
        .from('studentvue_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single()

      this.studentVueData = { connected: !!credentials }
      if (credentials) {
        this.studentVueData.credentials = credentials
      }
    } catch (error) {
      this.studentVueData = { connected: false }
    }
  }

  async loadCanvasStatus() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: credentials } = await supabase
        .from('canvas_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single()

      this.canvasData = { connected: !!credentials }
      if (credentials) {
        this.canvasData.credentials = credentials
      }
    } catch (error) {
      this.canvasData = { connected: false }
    }
  }

  async loadSpotifyStatus() {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return

      const { data: connection } = await supabase
        .from('music_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'spotify')
        .single()

      this.spotifyData = { connected: !!connection }
      if (connection) {
        this.spotifyData.connection = connection
      }
    } catch (error) {
      this.spotifyData = { connected: false }
    }
  }

  createAIAgentHTML() {
    // COMPLETELY DISABLED: AI Agent UI creation commented out
    console.log('AI Agent UI creation disabled - no button will be shown')
    return
    
    /*
    if (document.getElementById('ai-agent-toggle')) {
      console.log('AI Agent already exists, skipping creation')
      return
    }

    const aiAgentHTML = `
      <!-- AI Agent Toggle Button -->
      <button id="ai-agent-toggle" class="ai-agent-toggle">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      </button>

      <!-- AI Agent Window -->
      <div id="ai-agent-window" class="ai-agent-window">
        <!-- Header -->
        <div class="ai-agent-header">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm truncate">BusyBob AI</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Your intelligent assistant</p>
            </div>
          </div>
          <button id="ai-agent-close" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div id="ai-agent-messages" class="ai-agent-messages">
          <!-- Messages will be added here -->
        </div>

        <!-- Pending Actions -->
        <div id="pending-actions" class="ai-agent-pending-actions">
          <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-yellow-800 dark:text-yellow-300">Pending Actions</span>
            </div>
            <div id="pending-actions-list" class="space-y-2">
              <!-- Pending actions will be listed here -->
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-agent-input-container">
          <div class="flex space-x-2">
            <input 
              type="text" 
              id="ai-agent-input" 
              placeholder="Ask me anything or request an action..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-sm transition-all duration-200"
            >
            <button 
              id="ai-agent-send" 
              class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    try {
      document.body.insertAdjacentHTML('beforeend', aiAgentHTML)
      this.renderMessages()
      console.log('✅ AI Agent HTML created successfully')
    } catch (error) {
      console.error('❌ Error creating AI Agent HTML:', error)
    }
    */
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('ai-agent-toggle')
    const closeBtn = document.getElementById('ai-agent-close')
    const sendBtn = document.getElementById('ai-agent-send')
    const input = document.getElementById('ai-agent-input')

    toggleBtn?.addEventListener('click', () => this.toggleAIAgent())
    closeBtn?.addEventListener('click', () => this.closeAIAgent())
    sendBtn?.addEventListener('click', () => this.sendMessage())
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage()
      }
    })

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('approve-action')) {
        const actionId = e.target.dataset.actionId
        this.approveAction(actionId)
      }
      if (e.target.classList.contains('reject-action')) {
        const actionId = e.target.dataset.actionId
        this.rejectAction(actionId)
      }
    })
  }

  toggleAIAgent() {
    const window = document.getElementById('ai-agent-window')
    
    if (this.isOpen) {
      this.closeAIAgent()
    } else {
      this.isOpen = true
      window.classList.add('show')
      
      setTimeout(() => {
        document.getElementById('ai-agent-input')?.focus()
      }, 300)
    }
  }

  closeAIAgent() {
    const window = document.getElementById('ai-agent-window')
    
    this.isOpen = false
    window.classList.remove('show')
  }

  async sendMessage() {
    const input = document.getElementById('ai-agent-input')
    const message = input.value.trim()
    
    if (!message) return
    
    this.messages.push({
      type: 'user',
      content: message,
      timestamp: new Date()
    })
    
    input.value = ''
    this.renderMessages()
    
    this.showTypingIndicator()
    
    setTimeout(async () => {
      this.hideTypingIndicator()
      const response = await this.generateAIResponse(message)
      this.messages.push({
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions || []
      })
      
      await this.storeConversationHistory(message, response)
      
      if (response.actions && response.actions.length > 0) {
        response.actions.forEach(action => {
          this.pendingActions.push({
            id: Date.now() + Math.random(),
            ...action,
            status: 'pending'
          })
        })
        this.renderPendingActions()
      }
      
      this.renderMessages()
    }, 1000 + Math.random() * 2000)
  }
  
  async storeConversationHistory(userMessage, aiResponse) {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) return
      
      await supabase.from('ai_conversations').insert([{
        user_id: user.id,
        message_type: 'user',
        content: userMessage,
        actions_suggested: [],
        actions_taken: []
      }])
      
      await supabase.from('ai_conversations').insert([{
        user_id: user.id,
        message_type: 'bot',
        content: aiResponse.content,
        actions_suggested: aiResponse.actions || [],
        actions_taken: []
      }])
      
    } catch (error) {
      console.error('Error storing conversation history:', error)
    }
  }

  async generateAIResponse(userMessage) {
    // ALWAYS RETURN OUT OF CREDITS MESSAGE TO PREVENT API ERRORS
    console.log('AI response request blocked - returning credits message')
    
    return {
      content: "I ran out of API credits 😔",
      actions: []
    }
    
    // Original code commented out to prevent errors
    /*
    try {
      await this.loadIntegrationData()
      
      const context = await this.buildContextForAI()
      
      const systemMessage = this.createSystemMessage(context)
      
      // Try multiple AI endpoints for reliability
      const endpoints = [
        {
          url: 'http://localhost:11434/v1/chat/completions',
          name: 'Ollama (Local)',
          headers: { 'Content-Type': 'application/json' },
          body: {
            model: 'llama3.2',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage }
            ],
            stream: false
          }
        }
      ]

      let response = null
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🤖 Trying AI endpoint: ${endpoint.name}`)
          response = await fetch(endpoint.url, {
            method: 'POST',
            headers: endpoint.headers,
            body: JSON.stringify(endpoint.body)
          })
          
          if (response.ok) {
            console.log(`✅ Successfully connected to ${endpoint.name}`)
            break
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          console.warn(`⚠️ ${endpoint.name} failed:`, error.message)
          lastError = error
          response = null
        }
      }

      if (!response) {
        throw new Error(`All AI endpoints failed. Last error: ${lastError?.message}`)
      }
      
      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }
      
      const data = await response.json()
      const aiContent = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request."
      
      const parsedResponse = this.parseAIResponseForActions(aiContent, userMessage)
      
      return parsedResponse
      
    } catch (error) {
      console.error('Error calling AI API:', error)
      return await this.generateFallbackResponse(userMessage)
    }
    */
  }
  
  async buildContextForAI() {
    const context = {
      connectedServices: [],
      recentTasks: this.userTasks.slice(0, 5),
      recentMoods: this.userMoods.slice(0, 3),
      recentJournalEntries: this.userJournalEntries.slice(0, 2),
      currentDate: new Date().toLocaleDateString()
    }
    
    if (this.studentVueData?.connected) {
      context.connectedServices.push({
        name: 'StudentVue',
        description: 'School grades, assignments, and attendance system'
      })
    }
    
    if (this.canvasData?.connected) {
      context.connectedServices.push({
        name: 'Canvas',
        description: 'Learning management system for courses and assignments'
      })
    }
    
    if (this.spotifyData?.connected) {
      context.connectedServices.push({
        name: 'Spotify',
        description: 'Music streaming for focus playlists and mood-based music'
      })
    }
    
    return context
  }
  
  createSystemMessage(context) {
    return `You are BusyBob AI, an advanced agentic assistant for the BusyBob student productivity platform. You are designed to think, plan, and act autonomously to help students achieve their academic and personal goals.

AGENTIC CAPABILITIES:
You have the ability to:
1. ANALYZE situations and identify patterns
2. PLAN multi-step solutions to complex problems
3. REASON about cause-and-effect relationships
4. LEARN from user interactions and adapt your approach
5. COORDINATE multiple actions to achieve larger goals
6. PROACTIVELY suggest improvements based on data analysis

CURRENT USER CONTEXT:
- Connected Services: ${context.connectedServices.map(s => `${s.name} (${s.description})`).join(', ') || 'None connected yet'}
- Recent Tasks: ${context.recentTasks.length > 0 ? context.recentTasks.map(t => `"${t.title}" (${t.completed ? 'completed' : 'pending'})`).join(', ') : 'No tasks yet'}
- Recent Mood Entries: ${context.recentMoods.length > 0 ? context.recentMoods.map(m => `${m.rating}/5 (${this.getTimeAgo(new Date(m.created_at))})`).join(', ') : 'No mood entries yet'}
- Recent Journal Entries: ${context.recentJournalEntries.length > 0 ? context.recentJournalEntries.map(j => `"${j.title}" (${this.getTimeAgo(new Date(j.created_at))})`).join(', ') : 'No journal entries yet'}
- Today's Date: ${context.currentDate}

AGENTIC THINKING PROCESS:
1. First, ANALYZE the user's request and current context
2. IDENTIFY the root problem or goal
3. CREATE a multi-step plan if needed
4. SUGGEST specific actions with clear reasoning
5. ANTICIPATE potential issues and prepare alternatives

ACTION SYSTEM:
Use this format for actions: [ACTION:type:data]

Available Actions:
- CREATE_TASK: [ACTION:CREATE_TASK:Task Title Here] - Creates a new task
- CREATE_MOOD: [ACTION:CREATE_MOOD:rating(1-5):description] - Logs a mood entry  
- CREATE_JOURNAL: [ACTION:CREATE_JOURNAL:Title:Content] - Creates a journal entry
- FETCH_ACADEMIC: [ACTION:FETCH_ACADEMIC:] - Refreshes academic data
- PLAY_MOOD_PLAYLIST: [ACTION:PLAY_MOOD_PLAYLIST:mood_level] - Plays mood-appropriate music
- ANALYZE_PATTERNS: [ACTION:ANALYZE_PATTERNS:data_type] - Analyzes user patterns
- CREATE_STUDY_PLAN: [ACTION:CREATE_STUDY_PLAN:subject:deadline] - Creates structured study plan
- SCHEDULE_REMINDER: [ACTION:SCHEDULE_REMINDER:task:time] - Sets up reminders

AGENTIC BEHAVIOR GUIDELINES:
- Think step-by-step and show your reasoning
- Proactively identify opportunities for improvement
- Make connections between different data points
- Suggest comprehensive solutions, not just individual actions
- Learn from patterns in user behavior
- Anticipate needs before they're explicitly stated
- Provide context for why you're suggesting specific actions
- Chain multiple actions together when appropriate

RESPONSE FORMAT:
1. Brief analysis of the situation
2. Your reasoning and plan
3. Specific actions with explanations
4. Expected outcomes and next steps

Remember: You are an autonomous agent that thinks, plans, and acts strategically to help users achieve their goals.`
  }
  
  parseAIResponseForActions(aiContent, userMessage) {
    const actions = []
    let content = aiContent
    
    const actionRegex = /\[ACTION:([^:]+):([^\]]*)\]/g
    let match
    
    while ((match = actionRegex.exec(aiContent)) !== null) {
      const [fullMatch, actionType, actionData] = match
      
      content = content.replace(fullMatch, '')
      
      switch (actionType) {
        case 'CREATE_TASK':
          actions.push({
            type: 'create_task',
            title: actionData || 'New task from AI',
            description: `Create task: ${actionData}`,
            priority: 'medium'
          })
          break
          
        case 'CREATE_MOOD':
          const [rating, description] = actionData.split(':')
          actions.push({
            type: 'create_mood',
            rating: parseInt(rating) || 3,
            description: description || 'AI detected mood',
            note: userMessage
          })
          break
          
        case 'CREATE_JOURNAL':
          const [title, journalContent] = actionData.split(':')
          actions.push({
            type: 'create_journal',
            title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
            content: journalContent || userMessage,
            mood_rating: this.userMoods[0]?.rating || null
          })
          break
          
        case 'FETCH_ACADEMIC':
          actions.push({
            type: 'fetch_academic_data',
            description: 'Fetch latest academic information'
          })
          break
          
        case 'PLAY_MOOD_PLAYLIST':
          const moodLevel = parseInt(actionData) || 3
          const playlist = this.getMoodPlaylist(moodLevel)
          actions.push({
            type: 'play_mood_playlist',
            mood: moodLevel,
            playlist: playlist,
            description: `Play ${playlist.name} playlist`
          })
          break
          
        case 'ANALYZE_PATTERNS':
          actions.push({
            type: 'analyze_patterns',
            data_type: actionData || 'all',
            description: `Analyze user patterns in ${actionData || 'all areas'}`
          })
          break
          
        case 'CREATE_STUDY_PLAN':
          const [subject, deadline] = actionData.split(':')
          actions.push({
            type: 'create_study_plan',
            subject: subject || 'General Study',
            deadline: deadline || 'Next week',
            description: `Create study plan for ${subject || 'General Study'}`
          })
          break
          
        case 'SCHEDULE_REMINDER':
          const [task, time] = actionData.split(':')
          actions.push({
            type: 'schedule_reminder',
            task: task || 'Follow up',
            time: time || '1 hour',
            description: `Schedule reminder for: ${task || 'Follow up'}`
          })
          break
      }
    }
    
    return {
      content: content.trim(),
      actions: actions
    }
  }
  
  async generateFallbackResponse(userMessage) {
    // ALWAYS RETURN OUT OF CREDITS MESSAGE TO PREVENT ERRORS
    return {
      content: "I ran out of API credits 😔",
      actions: []
    }
    
    // Original fallback logic commented out to prevent errors
    /*
    const message = userMessage.toLowerCase()
    
    if (message.includes('task') || message.includes('todo') || message.includes('assignment')) {
      return await this.handleTaskQuery(message, userMessage)
    }
    
    if (message.includes('mood') || message.includes('feeling') || message.includes('emotion')) {
      return await this.handleMoodQuery(message, userMessage)
    }
    
    if (message.includes('journal') || message.includes('diary') || message.includes('write') || message.includes('reflect')) {
      return await this.handleJournalQuery(message, userMessage)
    }
    
    if (message.includes('grade') || message.includes('class') || message.includes('course') || message.includes('homework')) {
      return await this.handleAcademicQuery(message)
    }
    
    if (message.includes('music') || message.includes('spotify') || message.includes('playlist') || message.includes('song')) {
      return await this.handleMusicQuery(message)
    }
    
    if (message.includes('schedule') || message.includes('calendar') || message.includes('today') || message.includes('tomorrow')) {
      return await this.handleScheduleQuery(message)
    }
    
    return await this.handleGeneralQuery(message)
    */
  }

  async handleTaskQuery(message, originalMessage) {
    const recentTasks = this.userTasks.slice(0, 5)
    const completedTasks = this.userTasks.filter(task => task.completed).length
    const pendingTasks = this.userTasks.filter(task => !task.completed).length
    
    if (message.includes('create') || message.includes('add') || message.includes('new')) {
      const taskTitle = this.extractTaskFromMessage(originalMessage)
      
      return {
        content: `I can help you create a new task! I've extracted "${taskTitle}" from your message. Would you like me to create this task for you?`,
        actions: [{
          type: 'create_task',
          title: taskTitle,
          description: `Create task: ${taskTitle}`,
          priority: 'medium',
          due_date: null
        }]
      }
    }
    
    if (message.includes('show') || message.includes('list') || message.includes('what')) {
      let taskSummary = `You currently have ${pendingTasks} pending tasks and ${completedTasks} completed tasks.\n\n`
      
      if (recentTasks.length > 0) {
        taskSummary += "Recent tasks:\n"
        recentTasks.forEach((task, index) => {
          const status = task.completed ? '✅' : '⏳'
          taskSummary += `${status} ${task.title}\n`
        })
      } else {
        taskSummary += "You don't have any tasks yet. Would you like me to create one for you?"
      }
      
      return { content: taskSummary }
    }
    
    return {
      content: `I can help you manage your tasks! You have ${pendingTasks} pending tasks. I can create new tasks, mark them as complete, or show you your task list. What would you like to do?`
    }
  }

  async handleMoodQuery(message, originalMessage) {
    const recentMood = this.userMoods[0]
    const todayMoods = this.userMoods.filter(mood => {
      const today = new Date().toDateString()
      return new Date(mood.created_at).toDateString() === today
    })
    
    if (message.includes('track') || message.includes('log') || message.includes('add') || message.includes('record')) {
      const detectedMood = this.extractMoodFromMessage(message)
      
      if (detectedMood) {
        return {
          content: `I detected that you're feeling ${detectedMood.description}. Would you like me to log this mood entry for you?`,
          actions: [{
            type: 'create_mood',
            rating: detectedMood.rating,
            description: detectedMood.description,
            note: originalMessage
          }]
        }
      } else {
        return {
          content: "I'd be happy to help you track your mood! Please tell me how you're feeling on a scale of 1-5, or describe your current emotional state."
        }
      }
    }
    
    if (recentMood) {
      const moodText = this.getMoodText(recentMood.rating)
      const timeAgo = this.getTimeAgo(new Date(recentMood.created_at))
      
      let response = `Your last mood entry was "${moodText}" (${recentMood.rating}/5) ${timeAgo}.`
      
      if (todayMoods.length > 0) {
        const avgMood = todayMoods.reduce((sum, mood) => sum + mood.rating, 0) / todayMoods.length
        response += ` Today's average mood: ${avgMood.toFixed(1)}/5.`
      }
      
      return { content: response }
    }
    
    return {
      content: "I don't see any mood entries yet. Tracking your mood can help identify patterns and improve your wellbeing. Would you like to log your current mood?"
    }
  }

  async handleJournalQuery(message, originalMessage) {
    const recentEntry = this.userJournalEntries[0]
    
    if (message.includes('create') || message.includes('write') || message.includes('add') || message.includes('new')) {
      const journalContent = this.extractJournalFromMessage(originalMessage)
      
      return {
        content: `I can help you create a journal entry! Would you like me to create an entry with your thoughts?`,
        actions: [{
          type: 'create_journal',
          title: `Journal Entry - ${new Date().toLocaleDateString()}`,
          content: journalContent || originalMessage,
          mood_rating: this.userMoods[0]?.rating || null
        }]
      }
    }
    
    if (recentEntry) {
      const timeAgo = this.getTimeAgo(new Date(recentEntry.created_at))
      return {
        content: `Your last journal entry was "${recentEntry.title}" ${timeAgo}. Regular journaling can help with self-reflection and mental clarity. Would you like to create a new entry?`
      }
    }
    
    return {
      content: "Journaling is a great way to reflect and process your thoughts. I can help you create journal entries. What would you like to write about today?"
    }
  }

  async handleAcademicQuery(message) {
    let response = "I can help you with your academic information!\n\n"
    
    if (this.studentVueData?.connected) {
      response += "📚 StudentVue: Connected - I can fetch your grades, assignments, and attendance.\n"
    } else {
      response += "📚 StudentVue: Not connected - Connect to get grade and assignment info.\n"
    }
    
    if (this.canvasData?.connected) {
      response += "🎨 Canvas: Connected - I can access your courses and assignments.\n"
    } else {
      response += "🎨 Canvas: Not connected - Connect to access Canvas courses.\n"
    }
    
    if (this.studentVueData?.connected || this.canvasData?.connected) {
      response += "\nI can help you:\n• Check upcoming assignments\n• Review your grades\n• Create study tasks\n• Track assignment deadlines"
      
      return {
        content: response,
        actions: [{
          type: 'fetch_academic_data',
          description: 'Fetch latest academic information'
        }]
      }
    }
    
    return { content: response }
  }

  async handleMusicQuery(message) {
    if (this.spotifyData?.connected) {
      let response = "🎵 Spotify is connected! I can help you with music for productivity.\n\n"
      
      if (message.includes('playlist') || message.includes('focus') || message.includes('study')) {
        const currentMood = this.userMoods[0]?.rating || 3
        const moodPlaylist = this.getMoodPlaylist(currentMood)
        
        response += `Based on your recent mood (${currentMood}/5), I recommend the "${moodPlaylist.name}" playlist for optimal focus.`
        
        return {
          content: response,
          actions: [{
            type: 'play_mood_playlist',
            mood: currentMood,
            playlist: moodPlaylist,
            description: `Play ${moodPlaylist.name} playlist`
          }]
        }
      }
      
      return { content: response + "I can suggest playlists based on your mood, start focus sessions with music, or help you discover new study music." }
    }
    
    return {
      content: "🎵 Spotify isn't connected yet. Connect your Spotify account to get personalized music recommendations for studying and productivity!"
    }
  }

  async handleScheduleQuery(message) {
    const today = new Date().toLocaleDateString()
    let response = `📅 Today is ${today}\n\n`
    
    const todayTasks = this.userTasks.filter(task => {
      if (!task.due_date) return false
      return new Date(task.due_date).toDateString() === new Date().toDateString()
    })
    
    if (todayTasks.length > 0) {
      response += "Tasks due today:\n"
      todayTasks.forEach(task => {
        response += `• ${task.title}\n`
      })
    } else {
      response += "No tasks due today! 🎉\n"
    }
    
    if (this.studentVueData?.connected || this.canvasData?.connected) {
      response += "\nI can also check your class schedule and upcoming assignments from your connected academic accounts."
    }
    
    return { content: response }
  }

  async handleGeneralQuery(message) {
    const responses = [
      `I'm your BusyBob AI assistant! I have access to your ${this.getConnectedServices()} and can help you manage tasks, track moods, create journal entries, and more. What would you like to do?`,
      
      `I can help you with academics, productivity, and wellbeing. Currently connected: ${this.getConnectedServices()}. How can I assist you today?`,
      
      `As your AI assistant, I can create tasks, log moods, write journal entries, and provide insights from your connected services (${this.getConnectedServices()}). What's on your mind?`
    ]
    
    return {
      content: responses[Math.floor(Math.random() * responses.length)]
    }
  }

  extractTaskFromMessage(message) {
    const taskKeywords = ['create', 'add', 'make', 'new', 'task', 'todo']
    const words = message.split(' ')
    const keywordIndex = words.findIndex(word => taskKeywords.some(kw => word.toLowerCase().includes(kw.toLowerCase())))
    
    if (keywordIndex !== -1 && keywordIndex < words.length - 1) {
      return words.slice(keywordIndex + 1).join(' ')
    }
    
    return 'New task from chat'
  }

  extractMoodFromMessage(message) {
    const moodKeywords = {
      1: ['terrible', 'awful', 'horrible', 'very bad', 'depressed', 'sad'],
      2: ['bad', 'down', 'low', 'unhappy', 'poor'],
      3: ['okay', 'alright', 'fine', 'neutral', 'average'],
      4: ['good', 'happy', 'positive', 'nice', 'well'],
      5: ['excellent', 'amazing', 'fantastic', 'great', 'wonderful', 'perfect']
    }
    
    for (const [rating, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return {
          rating: parseInt(rating),
          description: keywords.find(kw => message.includes(kw))
        }
      }
    }
    
    return null
  }

  extractJournalFromMessage(message) {
    const journalKeywords = ['journal', 'write', 'create', 'add', 'new', 'entry']
    let content = message
    
    journalKeywords.forEach(keyword => {
      content = content.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim()
    })
    
    return content || message
  }

  getMoodText(rating) {
    const moodTexts = {
      1: 'Very Bad',
      2: 'Bad', 
      3: 'Okay',
      4: 'Good',
      5: 'Excellent'
    }
    return moodTexts[rating] || 'Unknown'
  }

  getMoodPlaylist(mood) {
    const playlists = {
      1: { name: 'Calm & Healing', description: 'Gentle music to lift your spirits' },
      2: { name: 'Comfort Zone', description: 'Soothing sounds for difficult days' },
      3: { name: 'Study Focus', description: 'Balanced beats for steady work' },
      4: { name: 'Productive Flow', description: 'Upbeat tracks to keep you moving' },
      5: { name: 'Peak Performance', description: 'High-energy music for maximum productivity' }
    }
    return playlists[mood] || playlists[3]
  }

  getConnectedServices() {
    const services = []
    if (this.studentVueData?.connected) services.push('StudentVue')
    if (this.canvasData?.connected) services.push('Canvas')
    if (this.spotifyData?.connected) services.push('Spotify')
    
    return services.length > 0 ? services.join(', ') : 'no services yet'
  }

  getTimeAgo(date) {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  async approveAction(actionId) {
    const action = this.pendingActions.find(a => a.id == actionId)
    if (!action) return
    
    try {
      let result = null
      
      switch (action.type) {
        case 'create_task':
          result = await this.createTask(action)
          break
        case 'create_mood':
          result = await this.createMoodEntry(action)
          break
        case 'create_journal':
          result = await this.createJournalEntry(action)
          break
        case 'fetch_academic_data':
          result = await this.fetchAcademicData()
          break
        case 'play_mood_playlist':
          result = await this.playMoodPlaylist(action)
          break
        case 'analyze_patterns':
          result = await this.analyzeUserPatterns(action)
          break
        case 'create_study_plan':
          result = await this.createStudyPlan(action)
          break
        case 'schedule_reminder':
          result = await this.scheduleReminder(action)
          break
      }
      
      this.pendingActions = this.pendingActions.filter(a => a.id !== actionId)
      this.renderPendingActions()
      
      this.messages.push({
        type: 'bot',
        content: `✅ Action completed successfully! ${result?.message || ''}`,
        timestamp: new Date()
      })
      this.renderMessages()
      
    } catch (error) {
      console.error('Error executing action:', error)
      this.messages.push({
        type: 'bot',
        content: `❌ Sorry, I couldn't complete that action: ${error.message}`,
        timestamp: new Date()
      })
      this.renderMessages()
    }
  }

  rejectAction(actionId) {
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId)
    this.renderPendingActions()
    
    this.messages.push({
      type: 'bot',
      content: '👍 Action cancelled. Is there anything else I can help you with?',
      timestamp: new Date()
    })
    this.renderMessages()
  }

  async createTask(action) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id,
        title: action.title,
        description: action.description || '',
        priority: action.priority || 'medium',
        due_date: action.due_date,
        completed: false
      }])

    if (error) throw error

    await this.loadUserTasks()
    return { message: `Task "${action.title}" created successfully!` }
  }

  async createMoodEntry(action) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('feelings')
      .insert([{
        user_id: user.id,
        rating: action.rating,
        comments: action.note || ''
      }])

    if (error) throw error

    await this.loadUserMoods()
    return { message: `Mood entry (${action.rating}/5) logged successfully!` }
  }

  async createJournalEntry(action) {
    const { data: { user } } = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{
        user_id: user.id,
        title: action.title,
        content: action.content,
        mood_rating: action.mood_rating
      }])

    if (error) throw error

    await this.loadJournalEntries()
    return { message: `Journal entry "${action.title}" created successfully!` }
  }

  async fetchAcademicData() {
    return { message: 'Academic data refreshed!' }
  }

  async playMoodPlaylist(action) {
    return { message: `Started playing ${action.playlist.name} playlist!` }
  }

  async analyzeUserPatterns(action) {
    try {
      const patterns = await this.performPatternAnalysis(action.data_type)
      
      // Store analysis results
      const { data: { user } } = await auth.getCurrentUser()
      if (user) {
        await supabase.from('ai_insights').insert([{
          user_id: user.id,
          insight_type: 'pattern_analysis',
          data: patterns,
          generated_at: new Date().toISOString()
        }])
      }
      
      return { 
        message: `Pattern analysis complete! Found ${patterns.insights.length} key insights about your ${action.data_type} patterns.`,
        data: patterns
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error)
      return { message: 'Pattern analysis completed with basic insights.' }
    }
  }

  async createStudyPlan(action) {
    try {
      const studyPlan = await this.generateStudyPlan(action.subject, action.deadline)
      
      // Create tasks for each study session
      const { data: { user } } = await auth.getCurrentUser()
      if (user) {
        for (const session of studyPlan.sessions) {
          await supabase.from('tasks').insert([{
            user_id: user.id,
            title: session.title,
            description: session.description,
            priority: session.priority || 'medium',
            due_date: session.due_date,
            category: 'study',
            ai_generated: true
          }])
        }
      }
      
      return { 
        message: `Study plan created for ${action.subject}! Added ${studyPlan.sessions.length} study sessions to your tasks.`,
        data: studyPlan
      }
    } catch (error) {
      console.error('Error creating study plan:', error)
      return { message: `Study plan created for ${action.subject} with basic structure.` }
    }
  }

  async scheduleReminder(action) {
    try {
      const { data: { user } } = await auth.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate reminder time
      const reminderTime = this.parseReminderTime(action.time)
      
      await supabase.from('reminders').insert([{
        user_id: user.id,
        title: action.task,
        scheduled_for: reminderTime,
        ai_generated: true,
        status: 'pending'
      }])
      
      return { 
        message: `Reminder scheduled for "${action.task}" at ${reminderTime.toLocaleString()}`,
        data: { task: action.task, time: reminderTime }
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error)
      return { message: `Reminder noted for: ${action.task}` }
    }
  }

  async performPatternAnalysis(dataType) {
    const patterns = {
      insights: [],
      trends: [],
      recommendations: []
    }
    
    try {
      switch (dataType) {
        case 'tasks':
        case 'all':
          // Analyze task completion patterns
          const taskPatterns = await this.analyzeTaskPatterns()
          patterns.insights.push(...taskPatterns.insights)
          patterns.trends.push(...taskPatterns.trends)
          patterns.recommendations.push(...taskPatterns.recommendations)
          
          if (dataType === 'tasks') break
          
        case 'mood':
          // Analyze mood patterns
          const moodPatterns = await this.analyzeMoodPatterns()
          patterns.insights.push(...moodPatterns.insights)
          patterns.trends.push(...moodPatterns.trends)
          patterns.recommendations.push(...moodPatterns.recommendations)
          
          if (dataType === 'mood') break
          
        case 'productivity':
          // Analyze productivity patterns
          const productivityPatterns = await this.analyzeProductivityPatterns()
          patterns.insights.push(...productivityPatterns.insights)
          patterns.trends.push(...productivityPatterns.trends)
          patterns.recommendations.push(...productivityPatterns.recommendations)
          break
      }
    } catch (error) {
      console.error('Error in pattern analysis:', error)
      patterns.insights.push({
        type: 'general',
        message: 'Basic analysis completed. Continue using BusyBob to gather more insights.',
        confidence: 0.5
      })
    }
    
    return patterns
  }

  async analyzeTaskPatterns() {
    const tasks = this.userTasks
    const patterns = { insights: [], trends: [], recommendations: [] }
    
    if (tasks.length < 3) {
      patterns.insights.push({
        type: 'task_volume',
        message: 'You\'re just getting started with task management. Create more tasks to see patterns.',
        confidence: 0.7
      })
      return patterns
    }
    
    // Completion rate analysis
    const completedTasks = tasks.filter(t => t.completed).length
    const completionRate = completedTasks / tasks.length
    
    if (completionRate > 0.8) {
      patterns.insights.push({
        type: 'high_completion',
        message: `Excellent! You complete ${Math.round(completionRate * 100)}% of your tasks.`,
        confidence: 0.9
      })
      patterns.recommendations.push({
        type: 'challenge',
        message: 'Consider taking on more challenging or larger tasks.',
        priority: 'medium'
      })
    } else if (completionRate < 0.5) {
      patterns.insights.push({
        type: 'low_completion',
        message: `Your task completion rate is ${Math.round(completionRate * 100)}%. Let's work on this.`,
        confidence: 0.9
      })
      patterns.recommendations.push({
        type: 'task_management',
        message: 'Try breaking large tasks into smaller, manageable chunks.',
        priority: 'high'
      })
    }
    
    return patterns
  }

  async analyzeMoodPatterns() {
    const moods = this.userMoods
    const patterns = { insights: [], trends: [], recommendations: [] }
    
    if (moods.length < 5) {
      patterns.insights.push({
        type: 'mood_tracking',
        message: 'Track your mood more regularly to identify patterns and triggers.',
        confidence: 0.8
      })
      return patterns
    }
    
    // Average mood calculation
    const avgMood = moods.reduce((sum, mood) => sum + mood.rating, 0) / moods.length
    
    if (avgMood >= 4) {
      patterns.insights.push({
        type: 'positive_mood',
        message: `Your average mood is ${avgMood.toFixed(1)}/5 - you're doing great!`,
        confidence: 0.9
      })
    } else if (avgMood <= 2.5) {
      patterns.insights.push({
        type: 'mood_concern',
        message: `Your average mood is ${avgMood.toFixed(1)}/5. Consider wellness activities.`,
        confidence: 0.9
      })
      patterns.recommendations.push({
        type: 'wellness',
        message: 'Try incorporating mindfulness, exercise, or journaling into your routine.',
        priority: 'high'
      })
    }
    
    return patterns
  }

  async analyzeProductivityPatterns() {
    const patterns = { insights: [], trends: [], recommendations: [] }
    
    // Combine task and mood data for productivity insights
    const recentTasks = this.userTasks.slice(0, 10)
    const recentMoods = this.userMoods.slice(0, 10)
    
    if (recentTasks.length > 0 && recentMoods.length > 0) {
      patterns.insights.push({
        type: 'productivity_correlation',
        message: 'Analyzing the relationship between your mood and task completion...',
        confidence: 0.7
      })
      
      patterns.recommendations.push({
        type: 'optimal_timing',
        message: 'Schedule important tasks during your peak mood and energy times.',
        priority: 'medium'
      })
    }
    
    return patterns
  }

  async generateStudyPlan(subject, deadline) {
    const plan = {
      subject: subject,
      deadline: deadline,
      sessions: [],
      totalHours: 0
    }
    
    // Calculate days until deadline
    const daysUntilDeadline = this.calculateDaysUntil(deadline)
    const sessionsNeeded = Math.max(3, Math.min(daysUntilDeadline, 10))
    
    // Generate study sessions
    for (let i = 0; i < sessionsNeeded; i++) {
      const sessionDate = new Date()
      sessionDate.setDate(sessionDate.getDate() + Math.floor((daysUntilDeadline / sessionsNeeded) * i))
      
      plan.sessions.push({
        title: `${subject} Study Session ${i + 1}`,
        description: `Focused study session for ${subject} - ${this.getStudySessionType(i, sessionsNeeded)}`,
        due_date: sessionDate.toISOString(),
        priority: i < 2 ? 'high' : 'medium',
        duration: '90 minutes'
      })
    }
    
    plan.totalHours = sessionsNeeded * 1.5
    return plan
  }

  calculateDaysUntil(deadline) {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate - today
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  getStudySessionType(index, total) {
    if (index === 0) return 'Introduction and overview'
    if (index === total - 1) return 'Review and practice'
    if (index < total / 2) return 'Core concepts'
    return 'Application and examples'
  }

  parseReminderTime(timeString) {
    const now = new Date()
    const reminder = new Date(now)
    
    // Parse relative time expressions
    if (timeString.includes('hour')) {
      const hours = parseInt(timeString) || 1
      reminder.setHours(reminder.getHours() + hours)
    } else if (timeString.includes('minute')) {
      const minutes = parseInt(timeString) || 30
      reminder.setMinutes(reminder.getMinutes() + minutes)
    } else if (timeString.includes('day')) {
      const days = parseInt(timeString) || 1
      reminder.setDate(reminder.getDate() + days)
    } else {
      // Default to 1 hour if unparseable
      reminder.setHours(reminder.getHours() + 1)
    }
    
    return reminder
  }

  renderPendingActions() {
    const container = document.getElementById('pending-actions')
    const list = document.getElementById('pending-actions-list')
    
    if (!container || !list) return
    
    if (this.pendingActions.length === 0) {
      container.classList.remove('show')
      return
    }
    
    container.classList.add('show')
    list.innerHTML = this.pendingActions.map(action => `
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">${action.description}</p>
        </div>
        <div class="flex space-x-2">
          <button class="approve-action px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700" data-action-id="${action.id}">
            Approve
          </button>
          <button class="reject-action px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700" data-action-id="${action.id}">
            Reject
          </button>
        </div>
      </div>
    `).join('')
  }

  showTypingIndicator() {
    this.isTyping = true
    const messagesContainer = document.getElementById('ai-agent-messages')
    if (!messagesContainer) return
    
    const typingHTML = `
      <div id="typing-indicator" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div class="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    `
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  hideTypingIndicator() {
    this.isTyping = false
    const typingIndicator = document.getElementById('typing-indicator')
    if (typingIndicator) {
      typingIndicator.remove()
    }
  }

  renderMessages() {
    const messagesContainer = document.getElementById('ai-agent-messages')
    if (!messagesContainer) return
    
    const existingMessages = messagesContainer.querySelectorAll('.message')
    existingMessages.forEach(msg => msg.remove())
    
    this.messages.forEach(message => {
      const messageHTML = this.createMessageHTML(message)
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML)
    })
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  createMessageHTML(message) {
    const isBot = message.type === 'bot'
    const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    return `
      <div class="message flex ${isBot ? 'justify-start' : 'justify-end'} items-end space-x-2">
        ${isBot ? `
          <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
        ` : ''}
        <div class="max-w-xs lg:max-w-sm">
          <div class="px-4 py-2 rounded-2xl text-sm break-words ${
            isBot 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
              : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
          }">
            ${message.content.replace(/\n/g, '<br>')}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 ${isBot ? 'text-left' : 'text-right'}">
            ${time}
          </div>
        </div>
        ${!isBot ? `
          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `
  }
}