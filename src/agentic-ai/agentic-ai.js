// BusyBob Agentic AI Integration
// Main integration file that connects the multi-agent system with existing BusyBob features

class BusyBobAgenticAI {
    constructor() {
        this.agentSystem = new AgenticAISystem();
        this.currentSession = null;
        this.userPreferences = {};
        this.integrationPoints = new Map();
        this.initializeIntegration();
    }

    initializeIntegration() {
        // Integrate with existing BusyBob features
        this.integrationPoints.set('grades', this.integrateWithGrades.bind(this));
        this.integrationPoints.set('calendar', this.integrateWithCalendar.bind(this));
        this.integrationPoints.set('tasks', this.integrateWithTasks.bind(this));
        this.integrationPoints.set('notes', this.integrateWithNotes.bind(this));
        this.integrationPoints.set('mood', this.integrateWithMood.bind(this));
        this.integrationPoints.set('music', this.integrateWithMusic.bind(this));
    }

    async startSession(userId, preferences = {}) {
        this.currentSession = {
            id: `session_${Date.now()}`,
            userId: userId,
            startTime: new Date(),
            preferences: preferences,
            activeAgents: [],
            interactions: []
        };

        this.userPreferences = preferences;

        // Initialize user context
        await this.loadUserContext(userId);

        return {
            sessionId: this.currentSession.id,
            availableAgents: this.agentSystem.getAvailableAgents(),
            message: '🎯 Agentic AI session started! Choose an agent to begin.'
        };
    }

    async loadUserContext(userId) {
        try {
            // Load user data from existing BusyBob systems
            const userData = await this.fetchUserData(userId);
            
            // Update agent system with user context
            this.agentSystem.userContext = {
                academicLevel: userData.academicLevel || 'High School',
                subjects: userData.subjects || [],
                recentGrades: userData.recentGrades || [],
                upcomingTasks: userData.upcomingTasks || [],
                studyPreferences: userData.studyPreferences || {},
                moodHistory: userData.moodHistory || [],
                learningGoals: userData.learningGoals || []
            };

            console.log('✅ User context loaded for agentic AI');
        } catch (error) {
            console.error('❌ Error loading user context:', error);
        }
    }

    async fetchUserData(userId) {
        // This would integrate with existing BusyBob data systems
        // For now, return mock data
        return {
            academicLevel: 'High School',
            subjects: ['Mathematics', 'Physics', 'English Literature', 'World History'],
            recentGrades: [
                { subject: 'Mathematics', grade: 'A-', date: '2024-01-15' },
                { subject: 'Physics', grade: 'B+', date: '2024-01-10' },
                { subject: 'English Literature', grade: 'A', date: '2024-01-12' }
            ],
            upcomingTasks: [
                { title: 'Physics Lab Report', dueDate: '2024-01-20', subject: 'Physics' },
                { title: 'Math Quiz Preparation', dueDate: '2024-01-18', subject: 'Mathematics' },
                { title: 'English Essay Draft', dueDate: '2024-01-22', subject: 'English Literature' }
            ],
            studyPreferences: {
                preferredTime: 'morning',
                sessionLength: 45,
                breakLength: 15,
                learningStyle: 'visual'
            },
            moodHistory: [
                { mood: 'focused', timestamp: '2024-01-15T08:00:00Z' },
                { mood: 'stressed', timestamp: '2024-01-14T14:30:00Z' },
                { mood: 'confident', timestamp: '2024-01-13T16:00:00Z' }
            ],
            learningGoals: [
                'Maintain A average in all subjects',
                'Improve time management skills',
                'Develop better study habits'
            ]
        };
    }

    async activateAgent(agentId, context = {}) {
        if (!this.currentSession) {
            throw new Error('No active session. Please start a session first.');
        }

        // Add context from current BusyBob state
        const enhancedContext = {
            ...context,
            sessionId: this.currentSession.id,
            userPreferences: this.userPreferences,
            currentTime: new Date().toISOString(),
            recentActivity: await this.getRecentActivity()
        };

        const result = await this.agentSystem.activateAgent(agentId, enhancedContext);
        
        // Track active agent in session
        this.currentSession.activeAgents.push({
            agentId: agentId,
            activatedAt: new Date(),
            context: enhancedContext
        });

        // Trigger relevant integrations
        await this.triggerIntegrations(agentId, enhancedContext);

        return result;
    }

    async getRecentActivity() {
        // Get recent activity from BusyBob systems
        return {
            lastLogin: new Date().toISOString(),
            recentTasks: await this.getRecentTasks(),
            currentMood: await this.getCurrentMood(),
            upcomingDeadlines: await this.getUpcomingDeadlines()
        };
    }

    async getRecentTasks() {
        // This would fetch from the tasks system
        return [
            { title: 'Complete Physics Assignment', status: 'in_progress' },
            { title: 'Review Math Notes', status: 'completed' },
            { title: 'Start English Essay', status: 'pending' }
        ];
    }

    async getCurrentMood() {
        // This would fetch from the mood tracking system
        return {
            mood: 'focused',
            energy: 'high',
            timestamp: new Date().toISOString()
        };
    }

    async getUpcomingDeadlines() {
        // This would fetch from the calendar/tasks system
        return [
            { title: 'Physics Lab Report', dueDate: '2024-01-20', priority: 'high' },
            { title: 'Math Quiz', dueDate: '2024-01-18', priority: 'medium' },
            { title: 'English Essay', dueDate: '2024-01-22', priority: 'high' }
        ];
    }

    async triggerIntegrations(agentId, context) {
        const integrations = {
            study_planner: ['calendar', 'tasks'],
            homework_helper: ['grades', 'notes'],
            researcher: ['notes'],
            progress_tracker: ['grades', 'mood'],
            motivator: ['mood', 'music']
        };

        const relevantIntegrations = integrations[agentId] || [];
        
        for (const integration of relevantIntegrations) {
            if (this.integrationPoints.has(integration)) {
                await this.integrationPoints.get(integration)(context);
            }
        }
    }

    async processMessage(message, userId) {
        if (!this.currentSession) {
            throw new Error('No active session. Please start a session first.');
        }

        const response = await this.agentSystem.processMessage(message, userId);
        
        // Track interaction
        this.currentSession.interactions.push({
            timestamp: new Date(),
            message: message,
            response: response,
            agent: this.agentSystem.currentAgent?.name
        });

        // Execute any actions returned by the agent
        if (response.actions && response.actions.length > 0) {
            await this.executeActions(response.actions);
        }

        return response;
    }

    async executeActions(actions) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'schedule_creation':
                        await this.createStudySchedule(action.data);
                        break;
                    case 'reminder_setup':
                        await this.setupReminders(action.data);
                        break;
                    case 'concept_explanation':
                        await this.saveConceptExplanation(action.data);
                        break;
                    case 'performance_analysis':
                        await this.savePerformanceAnalysis(action.data);
                        break;
                    case 'general_action':
                        console.log('Executing general action:', action.data);
                        break;
                }
            } catch (error) {
                console.error(`Error executing action ${action.type}:`, error);
            }
        }
    }

    async createStudySchedule(scheduleData) {
        // Integrate with BusyBob's calendar system
        console.log('📅 Creating study schedule:', scheduleData);
        
        // This would add events to the calendar
        // For now, just log the action
        return { success: true, message: 'Study schedule created' };
    }

    async setupReminders(reminderData) {
        // Integrate with BusyBob's notification system
        console.log('⏰ Setting up reminders:', reminderData);
        
        // This would create notifications
        return { success: true, message: 'Reminders set up' };
    }

    async saveConceptExplanation(explanationData) {
        // Integrate with BusyBob's notes system
        console.log('📝 Saving concept explanation:', explanationData);
        
        // This would save to the notes system
        return { success: true, message: 'Concept explanation saved' };
    }

    async savePerformanceAnalysis(analysisData) {
        // Integrate with BusyBob's analytics system
        console.log('📊 Saving performance analysis:', analysisData);
        
        // This would save to the analytics system
        return { success: true, message: 'Performance analysis saved' };
    }

    // Integration methods with existing BusyBob features
    async integrateWithGrades(context) {
        console.log('📈 Integrating with grades system');
        // This would fetch and analyze grade data
    }

    async integrateWithCalendar(context) {
        console.log('📅 Integrating with calendar system');
        // This would check calendar for conflicts and optimize scheduling
    }

    async integrateWithTasks(context) {
        console.log('✅ Integrating with tasks system');
        // This would analyze task completion patterns and suggest optimizations
    }

    async integrateWithNotes(context) {
        console.log('📝 Integrating with notes system');
        // This would search notes for relevant information
    }

    async integrateWithMood(context) {
        console.log('😊 Integrating with mood tracking system');
        // This would analyze mood patterns and suggest interventions
    }

    async integrateWithMusic(context) {
        console.log('🎵 Integrating with music system');
        // This would suggest appropriate study music based on mood and task
    }

    // Advanced features
    async getSessionAnalytics() {
        if (!this.currentSession) return null;

        const interactions = this.currentSession.interactions;
        const agents = this.currentSession.activeAgents;

        return {
            sessionId: this.currentSession.id,
            duration: new Date() - this.currentSession.startTime,
            totalInteractions: interactions.length,
            agentsUsed: agents.map(a => a.agentId),
            averageResponseTime: this.calculateAverageResponseTime(interactions),
            userSatisfaction: this.calculateUserSatisfaction(interactions),
            recommendations: this.generateRecommendations(interactions, agents)
        };
    }

    calculateAverageResponseTime(interactions) {
        // Calculate average time between user message and agent response
        const responseTimes = [];
        
        for (let i = 0; i < interactions.length - 1; i++) {
            if (interactions[i].message && interactions[i + 1].response) {
                const timeDiff = interactions[i + 1].timestamp - interactions[i].timestamp;
                responseTimes.push(timeDiff);
            }
        }

        return responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
            : 0;
    }

    calculateUserSatisfaction(interactions) {
        // Simple satisfaction calculation based on conversation length
        // In a real implementation, this would use sentiment analysis
        const longConversations = interactions.filter(i => 
            i.message && i.message.length > 50
        ).length;
        
        return Math.min(longConversations / interactions.length, 1);
    }

    generateRecommendations(interactions, agents) {
        const recommendations = [];

        // Analyze interaction patterns
        const agentUsage = {};
        agents.forEach(agent => {
            agentUsage[agent.agentId] = (agentUsage[agent.agentId] || 0) + 1;
        });

        // Find most used agent
        const mostUsedAgent = Object.entries(agentUsage)
            .sort(([,a], [,b]) => b - a)[0];

        if (mostUsedAgent) {
            recommendations.push({
                type: 'agent_usage',
                message: `You've been using the ${mostUsedAgent[0]} agent frequently. Consider trying other agents for different perspectives.`,
                priority: 'medium'
            });
        }

        // Suggest based on time of day
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            recommendations.push({
                type: 'time_based',
                message: 'Good morning! This is a great time for focused study sessions.',
                priority: 'high'
            });
        }

        return recommendations;
    }

    async endSession() {
        if (!this.currentSession) {
            throw new Error('No active session to end.');
        }

        const analytics = await this.getSessionAnalytics();
        
        // Save session data
        await this.saveSessionData(this.currentSession, analytics);

        const sessionSummary = {
            sessionId: this.currentSession.id,
            duration: analytics.duration,
            totalInteractions: analytics.totalInteractions,
            agentsUsed: analytics.agentsUsed,
            recommendations: analytics.recommendations
        };

        this.currentSession = null;
        this.agentSystem.deactivateAgent();

        return {
            message: 'Session ended successfully!',
            summary: sessionSummary
        };
    }

    async saveSessionData(session, analytics) {
        // This would save to the database
        console.log('💾 Saving session data:', { session, analytics });
        
        // In a real implementation, this would save to Supabase or similar
        return { success: true };
    }

    // Utility methods
    getCurrentSession() {
        return this.currentSession;
    }

    getAvailableAgents() {
        return this.agentSystem.getAvailableAgents();
    }

    getAgentInsights(agentId) {
        return this.agentSystem.getAgentInsights(agentId);
    }

    switchAgent(newAgentId, context = {}) {
        return this.agentSystem.switchAgent(newAgentId, context);
    }
}

// Export for use in other modules
window.BusyBobAgenticAI = BusyBobAgenticAI; 