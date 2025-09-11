


import { EnhancedAIAgent } from './components/EnhancedAIAgent.js'



/* 
1. Import the enhanced agent CSS in your main.css:
   @import './enhanced-agent.css';

2. Replace the old AIAgent import in main.js:
   OLD: import { AIAgent } from './components/AIAgent.js'
   NEW: import { EnhancedAIAgent } from './components/EnhancedAIAgent.js'

3. Update the initialization in main.js:
   OLD: window.aiAgent = new AIAgent()
   NEW: window.enhancedAI = new EnhancedAIAgent()

4. Remove the old AI agent UI elements and styles to avoid conflicts

5. The enhanced agent will automatically create its own UI and handle all interactions
*/


export function initializeEnhancedAI() {
  // COMMENTED OUT TO PREVENT ERRORS
  console.log('Enhanced AI initialization disabled to prevent errors')
  return
  
  // window.enhancedAI = new EnhancedAIAgent()
  

  document.addEventListener('busybob:task-created', (event) => {
    if (window.enhancedAI) {
      window.enhancedAI.memorySystem.recordInteraction(
        'system_event', 
        { type: 'task_created', data: event.detail }
      )
    }
  })
  
  document.addEventListener('busybob:mood-logged', (event) => {
    if (window.enhancedAI) {
      window.enhancedAI.memorySystem.recordInteraction(
        'system_event',
        { type: 'mood_logged', data: event.detail }
      )
    }
  })
  

  document.addEventListener('busybob:navigation-change', (event) => {
    if (window.enhancedAI) {
      window.enhancedAI.memorySystem.updateContext({
        currentPage: event.detail.page,
        timestamp: Date.now()
      })
    }
  })
}


export const enhancedAIConfig = {

  enabledAgents: ['planner', 'executor', 'researcher', 'analyst', 'coordinator'],
  

  memory: {
    maxEpisodicMemories: 1000,
    maxSemanticConcepts: 500,
    contextWindow: 10
  },
  

  planning: {
    maxPlanDepth: 5,
    enableParallelExecution: true,
    enableConditionalExecution: true
  },
  

  tools: {
    enableCustomTools: true,
    autoLoadFromDatabase: true,
    enableCaching: true
  },
  

  collaboration: {
    enableInterAgentCommunication: true,
    maxCollaborations: 10,
    collaborationTimeout: 30000
  },
  

  ui: {
    theme: 'auto',
    position: 'bottom-right',
    animations: true,
    compactMode: false
  },
  

  api: {
    fallbackToBuiltinResponses: true,
    enableWebSearch: false,
    enableRealTimeData: true
  }
}


export const customTools = [
  {
    name: 'spotify_integration',
    category: 'entertainment',
    description: 'Integrates with Spotify to control music playback',
    implementation: `
      async function execute(params) {
        try {
          const response = await fetch('/api/spotify/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          })
          return await response.json()
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
    `
  },
  {
    name: 'calendar_sync',
    category: 'productivity',
    description: 'Syncs with external calendar services',
    implementation: `
      async function execute(params) {

        return { success: true, events: [] }
      }
    `
  }
]


export function setupAgentMonitoring() {
  if (!window.enhancedAI) return
  

  setInterval(() => {
    const metrics = window.enhancedAI.performanceMonitor.getMetrics()
    const averageTime = window.enhancedAI.memorySystem.getAverageOperationTime()
    
    console.log('🤖 Enhanced AI Agent Metrics:', {
      averageResponseTime: averageTime,
      recentOperations: metrics.slice(-5),
      memoryUsage: window.enhancedAI.memorySystem.episodicMemory.length,
      activeAgents: Array.from(window.enhancedAI.agents.keys())
    })
  }, 60000)
}


export function setupErrorRecovery() {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('EnhancedAI')) {
      console.error('Enhanced AI Agent Error:', event.error)
      

      if (window.enhancedAI) {
        setTimeout(() => {
          try {
            window.enhancedAI.init()
            console.log('✅ Enhanced AI Agent recovered')
          } catch (recoveryError) {
            console.error('❌ Failed to recover Enhanced AI Agent:', recoveryError)
          }
        }, 1000)
      }
    }
  })
}


export default {
  EnhancedAIAgent,
  initializeEnhancedAI,
  enhancedAIConfig,
  customTools,
  setupAgentMonitoring,
  setupErrorRecovery
}

/* 
Usage Example in main.js:

import { 
  initializeEnhancedAI, 
  setupAgentMonitoring, 
  setupErrorRecovery 
} from './enhanced-agent-integration.js'


async function initializeApp() {

  

  await initializeEnhancedAI()
  

  setupAgentMonitoring()
  setupErrorRecovery()
  
  console.log('🚀 BusyBob with Enhanced AI Agent ready!')
}


document.addEventListener('DOMContentLoaded', initializeApp)
*/