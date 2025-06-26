// Hybrid AI Service for BusyBob
// Uses Hack Club AI for most LLM tasks (free) and Groq for specialized features

import hackClubAI from './hackclub-ai.js'
import groqAPI from './groq-api.js'

class HybridAIService {
    constructor() {
        this.primaryService = hackClubAI; // Hack Club AI for most tasks
        this.specializedService = groqAPI; // Groq for specialized features
        this.usageStats = {
            hackClubRequests: 0,
            groqRequests: 0,
            totalRequests: 0
        };
    }

    // Primary LLM tasks - use Hack Club AI (free)
    async generateChatCompletion(messages, options = {}) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generateChatCompletion(messages, options);
    }

    async generateStreamingChatCompletion(messages, options = {}) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generateStreamingChatCompletion(messages, options);
    }

    // Study and academic tasks - use Hack Club AI
    async generateStudyPlan(subjects, goals, timeAvailable) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generateStudyPlan(subjects, goals, timeAvailable);
    }

    async solveProblem(problem, subject, showSteps = true) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.solveProblem(problem, subject, showSteps);
    }

    async generateMotivationalMessage(mood, context, goals) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generateMotivationalMessage(mood, context, goals);
    }

    async analyzePerformance(grades, subjects, trends) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.analyzePerformance(grades, subjects, trends);
    }

    async explainConcept(concept, subject, difficulty = 'intermediate') {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.explainConcept(concept, subject, difficulty);
    }

    async summarizeContent(content, length = 'medium') {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.summarizeContent(content, length);
    }

    async generatePracticeQuestions(topic, subject, difficulty = 'medium', count = 5) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generatePracticeQuestions(topic, subject, difficulty, count);
    }

    async generateStudyTips(subject, learningStyle, timeConstraints) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        return await this.primaryService.generateStudyTips(subject, learningStyle, timeConstraints);
    }

    // Specialized tasks - use Groq (when needed)
    async speechToText(audioData, options = {}) {
        // Use Groq for speech-to-text if available
        this.usageStats.groqRequests++;
        this.usageStats.totalRequests++;
        
        if (this.specializedService.speechToText) {
            return await this.specializedService.speechToText(audioData, options);
        } else {
            throw new Error('Speech-to-text not available');
        }
    }

    async textToSpeech(text, options = {}) {
        // Use Groq for text-to-speech if available
        this.usageStats.groqRequests++;
        this.usageStats.totalRequests++;
        
        if (this.specializedService.textToSpeech) {
            return await this.specializedService.textToSpeech(text, options);
        } else {
            throw new Error('Text-to-speech not available');
        }
    }

    async imageAnalysis(imageData, prompt, options = {}) {
        // Use Groq for image analysis if available
        this.usageStats.groqRequests++;
        this.usageStats.totalRequests++;
        
        if (this.specializedService.analyzeImage) {
            return await this.specializedService.analyzeImage(imageData, prompt, options);
        } else {
            throw new Error('Image analysis not available');
        }
    }

    async codeGeneration(prompt, language, options = {}) {
        // Use Groq for complex code generation (better for coding tasks)
        this.usageStats.groqRequests++;
        this.usageStats.totalRequests++;
        return await this.specializedService.generateCode(prompt, language, options);
    }

    // Utility methods
    getUsageStats() {
        return {
            ...this.usageStats,
            hackClubPercentage: this.usageStats.totalRequests > 0 
                ? Math.round((this.usageStats.hackClubRequests / this.usageStats.totalRequests) * 100) 
                : 0,
            groqPercentage: this.usageStats.totalRequests > 0 
                ? Math.round((this.usageStats.groqRequests / this.usageStats.totalRequests) * 100) 
                : 0
        };
    }

    async testConnection() {
        const hackClubTest = await this.primaryService.testConnection();
        const groqTest = await this.specializedService.testConnection();
        
        return {
            hackClub: hackClubTest,
            groq: groqTest,
            overall: hackClubTest.success || groqTest.success
        };
    }

    getServiceInfo() {
        return {
            name: 'Hybrid AI Service',
            description: 'Combines Hack Club AI (free) with Groq (specialized features)',
            primary: this.primaryService.getServiceInfo(),
            specialized: this.specializedService.getServiceInfo(),
            usage: this.getUsageStats()
        };
    }

    // Smart routing based on task type
    async smartRoute(taskType, data, options = {}) {
        const hackClubTasks = [
            'chat', 'study_plan', 'problem_solving', 'motivation', 
            'performance_analysis', 'concept_explanation', 'summarization',
            'practice_questions', 'study_tips', 'general_assistance'
        ];

        const groqTasks = [
            'speech_to_text', 'text_to_speech', 'image_analysis', 
            'code_generation', 'complex_analysis', 'high_performance'
        ];

        if (hackClubTasks.includes(taskType)) {
            // Route to Hack Club AI
            return await this.routeToHackClub(taskType, data, options);
        } else if (groqTasks.includes(taskType)) {
            // Route to Groq
            return await this.routeToGroq(taskType, data, options);
        } else {
            // Default to Hack Club AI
            return await this.routeToHackClub(taskType, data, options);
        }
    }

    async routeToHackClub(taskType, data, options) {
        this.usageStats.hackClubRequests++;
        this.usageStats.totalRequests++;
        
        // Map task types to Hack Club AI methods
        const methodMap = {
            'chat': 'generateChatCompletion',
            'study_plan': 'generateStudyPlan',
            'problem_solving': 'solveProblem',
            'motivation': 'generateMotivationalMessage',
            'performance_analysis': 'analyzePerformance',
            'concept_explanation': 'explainConcept',
            'summarization': 'summarizeContent',
            'practice_questions': 'generatePracticeQuestions',
            'study_tips': 'generateStudyTips'
        };

        const method = methodMap[taskType] || 'generateChatCompletion';
        return await this.primaryService[method](data, options);
    }

    async routeToGroq(taskType, data, options) {
        this.usageStats.groqRequests++;
        this.usageStats.totalRequests++;
        
        // Map task types to Groq methods
        const methodMap = {
            'speech_to_text': 'speechToText',
            'text_to_speech': 'textToSpeech',
            'image_analysis': 'analyzeImage',
            'code_generation': 'generateCode'
        };

        const method = methodMap[taskType];
        if (method && this.specializedService[method]) {
            return await this.specializedService[method](data, options);
        } else {
            throw new Error(`Task type '${taskType}' not supported by Groq`);
        }
    }
}

// Create and export singleton instance
const hybridAI = new HybridAIService();

// Expose for global debugging
window.hybridAI = hybridAI;
window.testHybridConnection = () => hybridAI.testConnection();
window.getHybridInfo = () => hybridAI.getServiceInfo();
window.getHybridUsage = () => hybridAI.getUsageStats();

export default hybridAI; 