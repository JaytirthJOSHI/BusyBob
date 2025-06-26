// Hack Club AI Service for BusyBob
// Provides free, unlimited AI interactions using Hack Club's AI service
// No API key needed - perfect for student projects!

class HackClubAIService {
    constructor() {
        this.baseURL = 'https://ai.hackclub.com';
        this.currentModel = null;
        this.isInitialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Get current model info
            const modelResponse = await fetch(`${this.baseURL}/model`);
            if (modelResponse.ok) {
                this.currentModel = await modelResponse.text();
                console.log(`🚀 Hack Club AI initialized with model: ${this.currentModel}`);
            } else {
                console.warn('⚠️ Could not fetch current model info');
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Error initializing Hack Club AI:', error);
        }
    }

    async makeRequest(endpoint, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hack Club AI Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Hack Club AI request failed:', error);
            throw error;
        }
    }

    async generateChatCompletion(messages, options = {}) {
        const defaultOptions = {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        const requestBody = {
            messages: messages,
            ...defaultOptions,
            ...options
        };

        try {
            console.log('🤖 Generating chat completion with Hack Club AI...');
            const response = await this.makeRequest('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            console.log('✅ Hack Club AI response received');
            return {
                content: response.choices[0]?.message?.content || '',
                usage: response.usage,
                model: response.model,
                finish_reason: response.choices[0]?.finish_reason
            };
        } catch (error) {
            console.error('❌ Chat completion failed:', error);
            throw error;
        }
    }

    async generateStreamingChatCompletion(messages, options = {}) {
        const defaultOptions = {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true
        };

        const requestBody = {
            messages: messages,
            ...defaultOptions,
            ...options
        };

        try {
            console.log('🌊 Starting streaming chat completion...');
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Streaming request failed: ${response.status}`);
            }

            return response.body;
        } catch (error) {
            console.error('❌ Streaming chat completion failed:', error);
            throw error;
        }
    }

    // Specialized methods for BusyBob features
    async generateStudyPlan(subjects, goals, timeAvailable) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert study planner for students. Create personalized study plans that are realistic, effective, and motivating.
                - Consider the student's goals and available time
                - Include breaks and variety to maintain engagement
                - Suggest specific study techniques for each subject
                - Include progress tracking and milestone setting
                - Be encouraging and supportive`
            },
            {
                role: 'user',
                content: `I need a study plan for these subjects: ${subjects.join(', ')}. 
                My goals are: ${goals}. 
                I have ${timeAvailable} hours available for studying. 
                Please create a detailed, personalized study plan.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.6,
            max_tokens: 1500
        });
    }

    async solveProblem(problem, subject, showSteps = true) {
        const messages = [
            {
                role: 'system',
                content: `You are a helpful tutor who guides students through problem-solving.
                - Show step-by-step solutions when requested
                - Explain the reasoning behind each step
                - Use clear, logical progression
                - Highlight key concepts and formulas
                - Encourage understanding over memorization`
            },
            {
                role: 'user',
                content: `Please help me solve this ${subject} problem: ${problem}
                ${showSteps ? 'Show all steps and explain your reasoning.' : 'Guide me through the solution process.'}`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.6,
            max_tokens: 1500
        });
    }

    async generateMotivationalMessage(mood, context, goals) {
        const messages = [
            {
                role: 'system',
                content: `You are a supportive, encouraging mentor for students.
                - Provide genuine encouragement and motivation
                - Acknowledge challenges while maintaining optimism
                - Offer practical advice and strategies
                - Celebrate progress and effort
                - Help students stay focused on their goals`
            },
            {
                role: 'user',
                content: `I'm feeling ${mood} right now. Context: ${context}. 
                My goals are: ${goals}. 
                Please give me some motivation and encouragement to keep going.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.9,
            max_tokens: 800
        });
    }

    async analyzePerformance(grades, subjects, trends) {
        const messages = [
            {
                role: 'system',
                content: `You are an educational analytics expert. Analyze student performance data to provide insights.
                - Identify patterns and trends
                - Highlight strengths and areas for improvement
                - Provide actionable recommendations
                - Consider subject-specific factors
                - Maintain a constructive, growth-oriented perspective`
            },
            {
                role: 'user',
                content: `Please analyze my academic performance:
                Grades: ${JSON.stringify(grades)}
                Subjects: ${subjects.join(', ')}
                Trends: ${trends}
                
                Provide insights and recommendations for improvement.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.5,
            max_tokens: 1200
        });
    }

    async explainConcept(concept, subject, difficulty = 'intermediate') {
        const messages = [
            {
                role: 'system',
                content: `You are an expert educator who explains complex concepts clearly.
                - Adapt explanations to the student's level
                - Use analogies and examples when helpful
                - Break down complex ideas into digestible parts
                - Connect concepts to real-world applications
                - Encourage questions and deeper understanding`
            },
            {
                role: 'user',
                content: `Please explain the concept of "${concept}" in ${subject} at a ${difficulty} level.
                Use clear examples and help me understand why this is important.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.7,
            max_tokens: 1000
        });
    }

    async summarizeContent(content, length = 'medium') {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at summarizing academic content.
                - Maintain key concepts and important details
                - Use clear, concise language
                - Organize information logically
                - Highlight main points and supporting evidence
                - Adapt summary length as requested`
            },
            {
                role: 'user',
                content: `Please summarize this content in a ${length} length:
                
                ${content}`
            }
        ];

        const maxTokens = length === 'short' ? 500 : length === 'long' ? 1500 : 1000;

        return await this.generateChatCompletion(messages, {
            temperature: 0.3,
            max_tokens: maxTokens
        });
    }

    async generatePracticeQuestions(topic, subject, difficulty = 'medium', count = 5) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at creating practice questions.
                - Create questions appropriate for the difficulty level
                - Include a variety of question types
                - Provide clear, detailed answers
                - Explain the reasoning behind answers
                - Cover key concepts and skills`
            },
            {
                role: 'user',
                content: `Create ${count} ${difficulty} difficulty practice questions for ${topic} in ${subject}.
                Include the questions and detailed answers with explanations.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.6,
            max_tokens: 2000
        });
    }

    async generateStudyTips(subject, learningStyle, timeConstraints) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert in study strategies and learning techniques.
                - Provide practical, actionable advice
                - Consider different learning styles
                - Suggest time-efficient methods
                - Include both traditional and modern techniques
                - Focus on long-term retention and understanding`
            },
            {
                role: 'user',
                content: `I need study tips for ${subject}. 
                My learning style is ${learningStyle}. 
                I have ${timeConstraints} time constraints.
                Please provide specific, practical study strategies.`
            }
        ];

        return await this.generateChatCompletion(messages, {
            temperature: 0.7,
            max_tokens: 1200
        });
    }

    // Utility methods
    getCurrentModel() {
        return this.currentModel;
    }

    async testConnection() {
        try {
            const response = await this.generateChatCompletion([
                { role: 'user', content: 'Hello! Please respond with "Hack Club AI is working!"' }
            ], { max_tokens: 50 });
            
            return {
                success: true,
                message: 'Hack Club AI connection successful',
                model: this.currentModel,
                response: response.content
            };
        } catch (error) {
            return {
                success: false,
                message: 'Hack Club AI connection failed',
                error: error.message
            };
        }
    }

    getServiceInfo() {
        return {
            name: 'Hack Club AI',
            description: 'Free, unlimited AI service for students',
            model: this.currentModel,
            features: [
                'No API key required',
                'Unlimited requests',
                'Fast response times',
                'Student-focused',
                'Open source'
            ],
            limitations: [
                'For Hack Club members only',
                'Project use only (no personal use)',
                'All requests are logged'
            ]
        };
    }
}

// Create and export singleton instance
const hackClubAI = new HackClubAIService();

// Expose for global debugging
window.hackClubAI = hackClubAI;
window.testHackClubConnection = () => hackClubAI.testConnection();
window.getHackClubInfo = () => hackClubAI.getServiceInfo();

export default hackClubAI;