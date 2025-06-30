// Groq API Service for BusyBob
// Provides fast, reliable AI interactions using Groq's LLM models

class GroqAPIService {
    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
        this.baseURL = 'https://api.groq.com/openai/v1';
        this.models = {
            llama3_8b: 'llama3-8b-8192',
            llama3_70b: 'llama3-70b-8192',
            mixtral: 'mixtral-8x7b-32768',
            gemma: 'gemma-7b-it'
        };
        this.defaultModel = this.models.llama3_8b;
        this.isInitialized = false;
        this.initialize();
    }

    initialize() {
        if (!this.apiKey) {
            console.warn('⚠️ GROQ_API_KEY not found. Please add VITE_GROQ_API_KEY to your .env file');
            return;
        }
        
        this.isInitialized = true;
        console.log('🚀 Groq API Service initialized');
    }

    async makeRequest(endpoint, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Groq API not initialized. Please check your API key.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Groq API request failed:', error);
            throw error;
        }
    }

    async generateChatCompletion(messages, model = this.defaultModel, options = {}) {
        const defaultOptions = {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        const requestBody = {
            model: model,
            messages: messages,
            ...defaultOptions,
            ...options
        };

        try {
            console.log('🤖 Generating chat completion with Groq...');
            const response = await this.makeRequest('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            console.log('✅ Groq response received');
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

    async generateStreamingChatCompletion(messages, model = this.defaultModel, options = {}) {
        const defaultOptions = {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true
        };

        const requestBody = {
            model: model,
            messages: messages,
            ...defaultOptions,
            ...options
        };

        try {
            console.log('🌊 Starting streaming chat completion...');
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
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

    // Specialized methods for different AI tasks
    async generateStudyPlan(subject, topics, duration, learningStyle) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert educational planner. Create detailed, personalized study plans that are:
                - Structured and time-efficient
                - Adapted to the student's learning style
                - Engaging and motivating
                - Practical and actionable
                
                Always provide specific time allocations, learning objectives, and study techniques.`
            },
            {
                role: 'user',
                content: `Create a ${duration}-minute study plan for ${subject} covering: ${topics.join(', ')}. 
                Learning style: ${learningStyle}. 
                Make it engaging and include specific techniques for this learning style.`
            }
        ];

        return await this.generateChatCompletion(messages, this.models.llama3_70b, {
            temperature: 0.8,
            max_tokens: 1500
        });
    }

    async explainConcept(concept, subject, academicLevel) {
        const messages = [
            {
                role: 'system',
                content: `You are a patient, knowledgeable tutor. Explain complex concepts in simple, understandable terms.
                - Use analogies and examples
                - Break down complex ideas into smaller parts
                - Adapt explanations to the student's academic level
                - Encourage questions and deeper thinking
                - Provide real-world applications when possible`
            },
            {
                role: 'user',
                content: `Please explain ${concept} in ${subject} for a ${academicLevel} student. 
                Make it engaging and easy to understand.`
            }
        ];

        return await this.generateChatCompletion(messages, this.models.llama3_70b, {
            temperature: 0.7,
            max_tokens: 1200
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

        return await this.generateChatCompletion(messages, this.models.llama3_70b, {
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

        return await this.generateChatCompletion(messages, this.models.llama3_8b, {
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

        return await this.generateChatCompletion(messages, this.models.llama3_70b, {
            temperature: 0.5,
            max_tokens: 1200
        });
    }

    async generateStudyTips(subject, learningStyle, challenges) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert study skills coach. Provide practical, effective study tips.
                - Tailor advice to specific subjects and learning styles
                - Address common challenges and obstacles
                - Provide actionable, specific techniques
                - Consider time management and motivation
                - Include both traditional and modern study methods`
            },
            {
                role: 'user',
                content: `I need study tips for ${subject}. 
                My learning style is ${learningStyle}. 
                I'm struggling with: ${challenges}.
                
                Please provide specific, actionable study tips.`
            }
        ];

        return await this.generateChatCompletion(messages, this.models.llama3_8b, {
            temperature: 0.8,
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

        return await this.generateChatCompletion(messages, this.models.llama3_8b, {
            temperature: 0.3,
            max_tokens: maxTokens
        });
    }

    async generateFlashcards(topic, subject, count = 10) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at creating educational flashcards.
                - Create clear, concise questions and answers
                - Cover key concepts and important details
                - Use appropriate difficulty level
                - Include both factual and conceptual questions
                - Format as Q&A pairs`
            },
            {
                role: 'user',
                content: `Create ${count} flashcards for ${topic} in ${subject}.
                Format as:
                Q: [Question]
                A: [Answer]
                
                Make them engaging and educational.`
            }
        ];

        return await this.generateChatCompletion(messages, this.models.llama3_8b, {
            temperature: 0.7,
            max_tokens: 1500
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

        return await this.generateChatCompletion(messages, this.models.llama3_70b, {
            temperature: 0.6,
            max_tokens: 2000
        });
    }

    // Utility methods
    getAvailableModels() {
        return Object.keys(this.models).map(key => ({
            id: key,
            name: this.models[key],
            displayName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
    }

    getModelInfo(modelId) {
        const model = this.models[modelId];
        if (!model) return null;

        const modelInfo = {
            llama3_8b: {
                name: 'Llama 3 8B',
                description: 'Fast, efficient model for general tasks',
                maxTokens: 8192,
                bestFor: ['Quick responses', 'General assistance', 'Study tips']
            },
            llama3_70b: {
                name: 'Llama 3 70B',
                description: 'High-performance model for complex tasks',
                maxTokens: 8192,
                bestFor: ['Complex explanations', 'Detailed analysis', 'Problem solving']
            },
            mixtral: {
                name: 'Mixtral 8x7B',
                description: 'Balanced model with large context window',
                maxTokens: 32768,
                bestFor: ['Long documents', 'Research', 'Comprehensive analysis']
            },
            gemma: {
                name: 'Gemma 7B',
                description: 'Efficient model for creative tasks',
                maxTokens: 8192,
                bestFor: ['Creative writing', 'Motivation', 'General assistance']
            }
        };

        return modelInfo[modelId];
    }

    async testConnection() {
        try {
            const response = await this.generateChatCompletion([
                { role: 'user', content: 'Hello! Please respond with "Groq API is working!"' }
            ], this.models.llama3_8b, { max_tokens: 50 });
            
            return {
                success: true,
                message: 'Groq API connection successful',
                response: response.content
            };
        } catch (error) {
            return {
                success: false,
                message: 'Groq API connection failed',
                error: error.message
            };
        }
    }

    // Cost estimation (based on Groq's pricing)
    estimateCost(promptTokens, completionTokens, model = this.defaultModel) {
        const pricing = {
            'llama3-8b-8192': { input: 0.00005, output: 0.00008 },
            'llama3-70b-8192': { input: 0.00059, output: 0.00079 },
            'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
            'gemma-7b-it': { input: 0.00007, output: 0.00007 }
        };

        const modelPricing = pricing[model] || pricing['llama3-8b-8192'];
        const inputCost = (promptTokens / 1000) * modelPricing.input;
        const outputCost = (completionTokens / 1000) * modelPricing.output;
        
        return {
            inputCost: inputCost,
            outputCost: outputCost,
            totalCost: inputCost + outputCost,
            currency: 'USD'
        };
    }
}

// Create and export singleton instance
const groqAPI = new GroqAPIService();

// Expose for global debugging
window.groqAPI = groqAPI;
window.testGroqConnection = () => groqAPI.testConnection();
window.getGroqModels = () => groqAPI.getAvailableModels();

export default groqAPI;