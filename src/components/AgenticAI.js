// Agentic AI UI Component
// Beautiful iOS-style interface for the multi-agent AI system

class AgenticAIComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.agenticAI = new BusyBobAgenticAI();
        this.currentAgent = null;
        this.isSessionActive = false;
        this.chatHistory = [];
        this.initializeUI();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="agentic-ai-container">
                <!-- Header -->
                <div class="agentic-header">
                    <div class="header-content">
                        <h2 class="header-title">
                            <span class="ai-icon">🤖</span>
                            AI Study Assistant
                        </h2>
                        <p class="header-subtitle">Multi-agent AI system for personalized learning</p>
                    </div>
                    <div class="session-controls">
                        <button id="startSessionBtn" class="btn-primary">
                            <span class="btn-icon">🚀</span>
                            Start Session
                        </button>
                        <button id="endSessionBtn" class="btn-secondary" style="display: none;">
                            <span class="btn-icon">⏹️</span>
                            End Session
                        </button>
                    </div>
                </div>

                <!-- Agent Selection -->
                <div id="agentSelection" class="agent-selection" style="display: none;">
                    <h3 class="section-title">Choose Your AI Assistant</h3>
                    <div class="agent-grid" id="agentGrid">
                        <!-- Agents will be populated here -->
                    </div>
                </div>

                <!-- Chat Interface -->
                <div id="chatInterface" class="chat-interface" style="display: none;">
                    <div class="chat-header">
                        <div class="active-agent-info">
                            <div class="agent-avatar" id="agentAvatar">
                                <span class="avatar-icon">🤖</span>
                            </div>
                            <div class="agent-details">
                                <h4 id="activeAgentName">Select an Agent</h4>
                                <p id="activeAgentRole">Choose an AI assistant to begin</p>
                            </div>
                        </div>
                        <button id="switchAgentBtn" class="btn-outline">
                            <span class="btn-icon">🔄</span>
                            Switch Agent
                        </button>
                    </div>

                    <div class="chat-messages" id="chatMessages">
                        <div class="welcome-message">
                            <div class="welcome-content">
                                <h3>Welcome to Your AI Study Assistant! 🎓</h3>
                                <p>I'm here to help you excel in your academic journey. Choose an agent above to get started, or ask me anything about your studies!</p>
                            </div>
                        </div>
                    </div>

                    <div class="chat-input-container">
                        <div class="input-wrapper">
                            <input 
                                type="text" 
                                id="messageInput" 
                                placeholder="Ask your AI assistant anything..."
                                class="message-input"
                                disabled
                            >
                            <button id="sendMessageBtn" class="send-btn" disabled>
                                <span class="send-icon">📤</span>
                            </button>
                        </div>
                        <div class="quick-actions" id="quickActions">
                            <!-- Quick action buttons will be populated -->
                        </div>
                    </div>
                </div>

                <!-- Analytics Dashboard -->
                <div id="analyticsDashboard" class="analytics-dashboard" style="display: none;">
                    <h3 class="section-title">Session Analytics</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="card-icon">⏱️</div>
                            <div class="card-content">
                                <h4>Session Duration</h4>
                                <p id="sessionDuration">--</p>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">💬</div>
                            <div class="card-content">
                                <h4>Total Interactions</h4>
                                <p id="totalInteractions">--</p>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">🤖</div>
                            <div class="card-content">
                                <h4>Agents Used</h4>
                                <p id="agentsUsed">--</p>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <div class="card-icon">⭐</div>
                            <div class="card-content">
                                <h4>Satisfaction Score</h4>
                                <p id="satisfactionScore">--</p>
                            </div>
                        </div>
                    </div>
                    <div class="recommendations-section">
                        <h4>Recommendations</h4>
                        <div id="recommendationsList" class="recommendations-list">
                            <!-- Recommendations will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Loading States -->
                <div id="loadingState" class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Initializing AI system...</p>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadAgents();
    }

    bindEvents() {
        // Session controls
        document.getElementById('startSessionBtn').addEventListener('click', () => this.startSession());
        document.getElementById('endSessionBtn').addEventListener('click', () => this.endSession());
        
        // Chat interface
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Agent switching
        document.getElementById('switchAgentBtn').addEventListener('click', () => this.showAgentSelection());
    }

    async loadAgents() {
        const agents = this.agenticAI.getAvailableAgents();
        const agentGrid = document.getElementById('agentGrid');
        
        agentGrid.innerHTML = agents.map(agent => `
            <div class="agent-card" data-agent-id="${agent.id}">
                <div class="agent-card-header" style="background: linear-gradient(135deg, ${agent.color}20, ${agent.color}40)">
                    <div class="agent-icon" style="background: ${agent.color}">
                        ${this.getAgentIcon(agent.id)}
                    </div>
                    <h4 class="agent-name">${agent.name}</h4>
                </div>
                <div class="agent-card-body">
                    <p class="agent-role">${agent.role}</p>
                    <p class="agent-description">${agent.description}</p>
                </div>
                <div class="agent-card-footer">
                    <button class="btn-select-agent" onclick="agenticAIComponent.selectAgent('${agent.id}')">
                        <span class="btn-icon">🎯</span>
                        Select Agent
                    </button>
                </div>
            </div>
        `).join('');
    }

    getAgentIcon(agentId) {
        const icons = {
            study_planner: '📚',
            homework_helper: '🧠',
            researcher: '🔍',
            progress_tracker: '📊',
            motivator: '🌟'
        };
        return icons[agentId] || '🤖';
    }

    async startSession() {
        try {
            this.showLoading('Starting AI session...');
            
            const result = await this.agenticAI.startSession('user_123', {
                academicLevel: 'High School',
                preferredTime: 'morning',
                learningStyle: 'visual'
            });

            this.isSessionActive = true;
            this.currentSessionId = result.sessionId;
            
            // Update UI
            document.getElementById('startSessionBtn').style.display = 'none';
            document.getElementById('endSessionBtn').style.display = 'block';
            document.getElementById('agentSelection').style.display = 'block';
            
            this.hideLoading();
            this.showNotification('Session started successfully!', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to start session: ' + error.message, 'error');
        }
    }

    async selectAgent(agentId) {
        try {
            this.showLoading('Activating agent...');
            
            const result = await this.agenticAI.activateAgent(agentId);
            this.currentAgent = result.agent;
            
            // Update UI
            document.getElementById('agentSelection').style.display = 'none';
            document.getElementById('chatInterface').style.display = 'block';
            
            // Update active agent display
            document.getElementById('activeAgentName').textContent = this.currentAgent.name;
            document.getElementById('activeAgentRole').textContent = this.currentAgent.role;
            document.getElementById('agentAvatar').innerHTML = `<span class="avatar-icon">${this.getAgentIcon(agentId)}</span>`;
            
            // Enable chat
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendMessageBtn').disabled = false;
            
            // Add welcome message
            this.addMessage('agent', result.message);
            
            // Load quick actions
            this.loadQuickActions(agentId);
            
            this.hideLoading();
            this.showNotification(`${this.currentAgent.name} is now active!`, 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to activate agent: ' + error.message, 'error');
        }
    }

    loadQuickActions(agentId) {
        const quickActions = {
            study_planner: [
                { text: 'Create study schedule', action: 'create_schedule' },
                { text: 'Set study goals', action: 'set_goals' },
                { text: 'Optimize time management', action: 'optimize_time' }
            ],
            homework_helper: [
                { text: 'Explain a concept', action: 'explain_concept' },
                { text: 'Help with problem', action: 'solve_problem' },
                { text: 'Find resources', action: 'find_resources' }
            ],
            researcher: [
                { text: 'Search for information', action: 'search_info' },
                { text: 'Summarize topic', action: 'summarize_topic' },
                { text: 'Find academic sources', action: 'find_sources' }
            ],
            progress_tracker: [
                { text: 'Analyze performance', action: 'analyze_performance' },
                { text: 'Generate insights', action: 'generate_insights' },
                { text: 'Set milestones', action: 'set_milestones' }
            ],
            motivator: [
                { text: 'Get encouragement', action: 'get_encouragement' },
                { text: 'Study tips', action: 'study_tips' },
                { text: 'Stress management', action: 'stress_management' }
            ]
        };

        const actions = quickActions[agentId] || [];
        const quickActionsContainer = document.getElementById('quickActions');
        
        quickActionsContainer.innerHTML = actions.map(action => `
            <button class="quick-action-btn" onclick="agenticAIComponent.sendQuickAction('${action.action}')">
                ${action.text}
            </button>
        `).join('');
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';
        
        try {
            // Show typing indicator
            this.showTypingIndicator();
            
            // Process message with AI
            const response = await this.agenticAI.processMessage(message, 'user_123');
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessage('agent', response.content);
            
            // Handle any actions
            if (response.actions && response.actions.length > 0) {
                this.handleActions(response.actions);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('system', 'Sorry, I encountered an error. Please try again.');
            console.error('Error processing message:', error);
        }
    }

    async sendQuickAction(action) {
        const actionMessages = {
            create_schedule: 'Can you help me create a personalized study schedule?',
            set_goals: 'I need help setting academic goals for this semester.',
            optimize_time: 'How can I better manage my study time?',
            explain_concept: 'Can you explain a difficult concept to me?',
            solve_problem: 'I need help solving a homework problem.',
            find_resources: 'Can you find helpful resources for my studies?',
            search_info: 'I need to research a topic for my assignment.',
            summarize_topic: 'Can you summarize a complex topic for me?',
            find_sources: 'I need to find academic sources for my research.',
            analyze_performance: 'Can you analyze my recent academic performance?',
            generate_insights: 'What insights can you provide about my learning?',
            set_milestones: 'Help me set achievable learning milestones.',
            get_encouragement: 'I need some motivation to keep studying.',
            study_tips: 'What study tips can you share with me?',
            stress_management: 'How can I manage study stress better?'
        };

        const message = actionMessages[action] || 'How can you help me?';
        document.getElementById('messageInput').value = message;
        this.sendMessage();
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${sender === 'user' ? 'You' : this.currentAgent?.name || 'AI Assistant'}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-text">${content}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to chat history
        this.chatHistory.push({
            sender,
            content,
            timestamp: new Date()
        });
    }

    handleActions(actions) {
        actions.forEach(action => {
            if (action.type === 'schedule_creation') {
                this.showNotification('Study schedule created! Check your calendar.', 'success');
            } else if (action.type === 'reminder_setup') {
                this.showNotification('Reminders set up successfully!', 'success');
            } else if (action.type === 'concept_explanation') {
                this.showNotification('Concept explanation saved to your notes!', 'success');
            } else if (action.type === 'performance_analysis') {
                this.showNotification('Performance analysis completed!', 'success');
            }
        });
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message agent-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${this.currentAgent?.name || 'AI Assistant'}</span>
                </div>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showAgentSelection() {
        document.getElementById('chatInterface').style.display = 'none';
        document.getElementById('agentSelection').style.display = 'block';
    }

    async endSession() {
        try {
            this.showLoading('Ending session...');
            
            const result = await this.agenticAI.endSession();
            
            // Update UI
            document.getElementById('startSessionBtn').style.display = 'block';
            document.getElementById('endSessionBtn').style.display = 'none';
            document.getElementById('agentSelection').style.display = 'none';
            document.getElementById('chatInterface').style.display = 'none';
            document.getElementById('analyticsDashboard').style.display = 'block';
            
            // Load analytics
            this.loadSessionAnalytics(result.summary);
            
            this.isSessionActive = false;
            this.currentAgent = null;
            
            this.hideLoading();
            this.showNotification('Session ended successfully!', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to end session: ' + error.message, 'error');
        }
    }

    loadSessionAnalytics(summary) {
        document.getElementById('sessionDuration').textContent = this.formatDuration(summary.duration);
        document.getElementById('totalInteractions').textContent = summary.totalInteractions;
        document.getElementById('agentsUsed').textContent = summary.agentsUsed.join(', ');
        document.getElementById('satisfactionScore').textContent = `${Math.round(summary.userSatisfaction * 100)}%`;
        
        // Load recommendations
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = summary.recommendations.map(rec => `
            <div class="recommendation-item ${rec.priority}">
                <div class="recommendation-icon">💡</div>
                <div class="recommendation-content">
                    <p>${rec.message}</p>
                    <span class="recommendation-priority">${rec.priority} priority</span>
                </div>
            </div>
        `).join('');
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }

    showLoading(message = 'Loading...') {
        const loadingState = document.getElementById('loadingState');
        loadingState.querySelector('p').textContent = message;
        loadingState.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the component when the page loads
let agenticAIComponent;
document.addEventListener('DOMContentLoaded', () => {
    agenticAIComponent = new AgenticAIComponent('agenticAI');
}); 