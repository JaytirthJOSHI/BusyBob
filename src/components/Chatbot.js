export class Chatbot {
  constructor() {
    this.isOpen = false
    this.messages = [
      {
        type: 'bot',
        content: 'Hi! I\'m your mindful assistant. I can help you with productivity tips, mindfulness techniques, or just chat about how you\'re feeling. How can I help you today?',
        timestamp: new Date()
      }
    ]
    this.isTyping = false
    this.init()
  }

  init() {
    this.createChatbotHTML()
    this.attachEventListeners()
  }

  createChatbotHTML() {
    const chatbotHTML = `
      <!-- Chatbot Toggle Button -->
      <button id="chatbot-toggle" class="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </button>

      <!-- Chatbot Window -->
      <div id="chatbot-window" class="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all duration-300 scale-0 origin-bottom-right hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Mindful Assistant</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Always here to help</p>
            </div>
          </div>
          <button id="chatbot-close" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div id="chatbot-messages" class="flex-1 p-4 h-64 overflow-y-auto space-y-3">
          <!-- Messages will be added here -->
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex space-x-2">
            <input 
              type="text" 
              id="chatbot-input" 
              placeholder="Type your message..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm transition-all duration-200"
            >
            <button 
              id="chatbot-send" 
              class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', chatbotHTML)
    this.renderMessages()
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle')
    const closeBtn = document.getElementById('chatbot-close')
    const sendBtn = document.getElementById('chatbot-send')
    const input = document.getElementById('chatbot-input')

    toggleBtn.addEventListener('click', () => this.toggleChatbot())
    closeBtn.addEventListener('click', () => this.closeChatbot())
    sendBtn.addEventListener('click', () => this.sendMessage())
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage()
      }
    })
  }

  toggleChatbot() {
    const window = document.getElementById('chatbot-window')
    
    if (this.isOpen) {
      this.closeChatbot()
    } else {
      this.isOpen = true
      window.classList.remove('hidden')
      setTimeout(() => {
        window.classList.remove('scale-0')
        window.classList.add('scale-100')
      }, 10)
      
      // Focus input
      setTimeout(() => {
        document.getElementById('chatbot-input').focus()
      }, 300)
    }
  }

  closeChatbot() {
    const window = document.getElementById('chatbot-window')
    
    this.isOpen = false
    window.classList.remove('scale-100')
    window.classList.add('scale-0')
    
    setTimeout(() => {
      window.classList.add('hidden')
    }, 300)
  }

  sendMessage() {
    const input = document.getElementById('chatbot-input')
    const message = input.value.trim()
    
    if (!message) return
    
    // Add user message
    this.messages.push({
      type: 'user',
      content: message,
      timestamp: new Date()
    })
    
    input.value = ''
    this.renderMessages()
    
    // Show typing indicator
    this.showTypingIndicator()
    
    // Generate bot response
    setTimeout(() => {
      this.hideTypingIndicator()
      const response = this.generateResponse(message)
      this.messages.push({
        type: 'bot',
        content: response,
        timestamp: new Date()
      })
      this.renderMessages()
    }, 1000 + Math.random() * 2000) // Random delay for realism
  }

  generateResponse(userMessage) {
    const message = userMessage.toLowerCase()
    
    // Productivity responses
    if (message.includes('productive') || message.includes('focus') || message.includes('work')) {
      const responses = [
        "Here are some productivity tips: Try the Pomodoro Technique (25 min work, 5 min break), break large tasks into smaller ones, and eliminate distractions. What specific area would you like to improve?",
        "To boost productivity, start with your most important task when your energy is highest. Also, try time-blocking your calendar and setting clear daily goals. How's your current workflow?",
        "Focus is key! Try the 2-minute rule: if something takes less than 2 minutes, do it now. For bigger tasks, use deep work sessions. What's challenging your focus today?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Stress/anxiety responses
    if (message.includes('stress') || message.includes('anxious') || message.includes('overwhelmed')) {
      const responses = [
        "I understand you're feeling stressed. Try this quick breathing exercise: breathe in for 4 counts, hold for 4, exhale for 6. Repeat 3 times. Remember, it's okay to take breaks. What's causing the most stress right now?",
        "Stress is tough, but you're not alone. Consider breaking down what's overwhelming you into smaller, manageable pieces. Also, try some gentle movement or a short walk. How can I help you feel more grounded?",
        "When feeling overwhelmed, remember the 5-4-3-2-1 technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This helps ground you in the present moment."
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Mindfulness responses
    if (message.includes('mindful') || message.includes('meditat') || message.includes('calm')) {
      const responses = [
        "Mindfulness is wonderful! Try this: spend 2 minutes focusing only on your breath. When your mind wanders (and it will), gently bring attention back to breathing. No judgment, just awareness. How does that feel?",
        "Here's a simple mindfulness practice: notice 3 things around you right now that you hadn't paid attention to before. Really observe them. Mindfulness is about being present in this moment.",
        "For quick mindfulness, try the 'STOP' technique: Stop what you're doing, Take a breath, Observe your thoughts and feelings, Proceed with awareness. Perfect for busy days!"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Mood/feelings responses
    if (message.includes('sad') || message.includes('down') || message.includes('depressed')) {
      const responses = [
        "I'm sorry you're feeling down. Your feelings are valid, and it's okay to not be okay sometimes. Small steps can help: try getting some sunlight, connecting with a friend, or doing one small thing you enjoy. You matter. 💙",
        "Difficult emotions are part of being human. Consider journaling about what you're feeling, or try some gentle self-care. Remember, this feeling is temporary. Is there something specific that's been weighing on you?",
        "Thank you for sharing how you're feeling. Sometimes just acknowledging our emotions helps. Consider reaching out to someone you trust, or try a small act of self-kindness today. You're stronger than you know."
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Happy/positive responses
    if (message.includes('happy') || message.includes('good') || message.includes('great') || message.includes('excited')) {
      const responses = [
        "That's wonderful to hear! 😊 Positive emotions are so important. Consider taking a moment to really savor this feeling and maybe write about what's making you happy in your journal. What's bringing you joy today?",
        "I love hearing that you're feeling good! These positive moments are worth celebrating. Maybe share this happiness with someone you care about, or use this energy for something meaningful to you.",
        "Fantastic! When we're feeling good, it's a great time to practice gratitude or do something kind for others. Your positive energy is contagious! What's been the highlight of your day?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Study/learning responses
    if (message.includes('study') || message.includes('learn') || message.includes('exam') || message.includes('school')) {
      const responses = [
        "Study tips coming up! Try active recall (test yourself without looking), spaced repetition (review material over increasing intervals), and the Feynman Technique (explain concepts simply). What subject are you working on?",
        "For effective studying: create a dedicated study space, use the Pomodoro Technique, and teach the material to someone else (or even a rubber duck!). Also, don't forget to take care of your physical needs. How's your study routine going?",
        "Learning is a journey! Mix up your study methods: visual (diagrams, colors), auditory (reading aloud, music), and kinesthetic (writing, movement). Also, sleep is crucial for memory consolidation. What's your biggest study challenge?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Sleep responses
    if (message.includes('sleep') || message.includes('tired') || message.includes('insomnia')) {
      const responses = [
        "Good sleep is essential for wellbeing! Try a wind-down routine: dim lights 1 hour before bed, avoid screens, try reading or gentle stretching. Keep your room cool and dark. What's your current bedtime routine like?",
        "Sleep troubles are common but manageable. Consider the 4-7-8 breathing technique before bed, avoid caffeine after 2 PM, and try to wake up at the same time daily. Your sleep environment matters too - is it comfortable and quiet?",
        "Quality sleep improves everything - mood, focus, health. If your mind races at bedtime, try writing down tomorrow's tasks or worries to 'park' them. Progressive muscle relaxation can also help. How many hours are you typically getting?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Gratitude responses
    if (message.includes('grateful') || message.includes('thankful') || message.includes('appreciate')) {
      const responses = [
        "Gratitude is such a powerful practice! 🙏 It literally rewires our brains for positivity. Consider keeping a daily gratitude journal - even just 3 things you're thankful for can make a difference. What are you most grateful for today?",
        "I love that you're thinking about gratitude! Research shows it improves mental health, relationships, and even physical health. Try expressing gratitude to someone today - it'll boost both your moods!",
        "Gratitude is like a superpower for happiness! You might try the 'gratitude visit' - write a letter to someone who's impacted your life positively. Even if you don't send it, the act of writing it is powerful."
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Goal/motivation responses
    if (message.includes('goal') || message.includes('motivat') || message.includes('achieve')) {
      const responses = [
        "Goals are great! Make them SMART: Specific, Measurable, Achievable, Relevant, Time-bound. Break big goals into smaller milestones and celebrate progress along the way. What goal are you working toward?",
        "Motivation comes and goes, but systems and habits create lasting change. Focus on building small, consistent actions rather than relying on motivation alone. What's one small step you could take today toward your goal?",
        "Remember: progress over perfection! Every small step counts, and setbacks are part of the journey. Consider finding an accountability partner or tracking your progress visually. What's your biggest goal right now?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // General conversation responses
    const generalResponses = [
      "That's interesting! Tell me more about what's on your mind. I'm here to listen and help however I can.",
      "I appreciate you sharing that with me. How are you feeling about everything today? Is there anything specific I can help you with?",
      "Thanks for chatting with me! I'm here to support you with productivity, mindfulness, or just to listen. What would be most helpful for you right now?",
      "I'm glad you're here! Whether you want to talk about goals, stress, study tips, or just need someone to listen, I'm here for you. What's going on in your world?",
      "Every conversation is valuable. I'm curious - what brought you to chat with me today? I'm here to help with whatever you need support with.",
      "I love connecting with you! Is there something specific you'd like to explore together, or would you like me to share some tips for wellness and productivity?"
    ]
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)]
  }

  showTypingIndicator() {
    this.isTyping = true
    const typingHTML = `
      <div id="typing-indicator" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
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
    
    const messagesContainer = document.getElementById('chatbot-messages')
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
    const messagesContainer = document.getElementById('chatbot-messages')
    
    // Clear existing messages (except typing indicator)
    const existingMessages = messagesContainer.querySelectorAll('.message')
    existingMessages.forEach(msg => msg.remove())
    
    this.messages.forEach(message => {
      const messageHTML = this.createMessageHTML(message)
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML)
    })
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  createMessageHTML(message) {
    const isBot = message.type === 'bot'
    const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    return `
      <div class="message flex ${isBot ? 'justify-start' : 'justify-end'} items-end space-x-2">
        ${isBot ? `
          <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
        ` : ''}
        <div class="max-w-xs">
          <div class="px-4 py-2 rounded-2xl text-sm ${
            isBot 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }">
            ${message.content}
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