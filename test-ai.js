// BusyBob AI Testing Script
// Run this in the browser console to test the enhanced agentic AI

console.log('🧪 BusyBob AI Testing Script');
console.log('=============================');

async function testAI() {
    // Check if AI agent is available
    if (!window.aiAgent) {
        console.error('❌ AI Agent not found. Make sure BusyBob is loaded and you are logged in.');
        return;
    }

    const agent = window.aiAgent;
    console.log('✅ AI Agent found:', agent.constructor.name);

    // Test 1: Basic AI Response
    console.log('\n🧪 Test 1: Basic AI Response');
    try {
        const response = await agent.generateAIResponse("Hello, can you help me with my studies?");
        console.log('✅ AI Response:', response.content.substring(0, 100) + '...');
        console.log('🎯 Actions suggested:', response.actions?.length || 0);
    } catch (error) {
        console.warn('⚠️ AI Response test failed (expected if Ollama not running):', error.message);
    }

    // Test 2: Pattern Analysis
    console.log('\n🧪 Test 2: Pattern Analysis');
    try {
        if (agent.userTasks && agent.userTasks.length > 0) {
            const patterns = await agent.performPatternAnalysis('tasks');
            console.log('✅ Pattern Analysis:', patterns.insights.length, 'insights found');
            console.log('📊 Sample insight:', patterns.insights[0]?.message || 'No insights yet');
        } else {
            console.log('ℹ️ No tasks found for pattern analysis');
        }
    } catch (error) {
        console.error('❌ Pattern analysis failed:', error);
    }

    // Test 3: Study Plan Generation
    console.log('\n🧪 Test 3: Study Plan Generation');
    try {
        const studyPlan = await agent.generateStudyPlan('Mathematics', 'Next Friday');
        console.log('✅ Study Plan:', studyPlan.sessions.length, 'sessions created');
        console.log('📚 Total hours:', studyPlan.totalHours);
    } catch (error) {
        console.error('❌ Study plan generation failed:', error);
    }

    // Test 4: Data Loading
    console.log('\n🧪 Test 4: Data Loading');
    console.log('📋 Tasks loaded:', agent.userTasks?.length || 0);
    console.log('😊 Moods loaded:', agent.userMoods?.length || 0);
    console.log('📝 Journal entries:', agent.userJournalEntries?.length || 0);

    // Test 5: UI Elements
    console.log('\n🧪 Test 5: UI Elements');
    const toggleButton = document.getElementById('ai-agent-toggle');
    const agentWindow = document.getElementById('ai-agent-window');
    
    if (toggleButton && agentWindow) {
        console.log('✅ AI UI elements found');
        console.log('🎨 Agent window classes:', agentWindow.className);
    } else {
        console.error('❌ AI UI elements not found');
    }

    // Test 6: Agentic Capabilities
    console.log('\n🧪 Test 6: Agentic Capabilities Check');
    const capabilities = [
        'performPatternAnalysis',
        'generateStudyPlan',
        'analyzeTaskPatterns',
        'analyzeMoodPatterns',
        'createStudyPlan',
        'scheduleReminder'
    ];

    capabilities.forEach(capability => {
        if (typeof agent[capability] === 'function') {
            console.log(`✅ ${capability}: Available`);
        } else {
            console.log(`❌ ${capability}: Missing`);
        }
    });

    console.log('\n🎉 AI Testing Complete!');
    console.log('\n💡 To test the AI interactively:');
    console.log('1. Click the AI agent toggle button (💡 icon)');
    console.log('2. Try asking: "Analyze my task patterns"');
    console.log('3. Try asking: "Create a study plan for math"');
    console.log('4. Try asking: "How can I improve my productivity?"');
}

// Run the test
testAI().catch(console.error);

// Helper function to simulate user interaction
window.testAIInteraction = async function(message) {
    if (!window.aiAgent) {
        console.error('❌ AI Agent not available');
        return;
    }
    
    console.log('🗣️ User:', message);
    try {
        const response = await window.aiAgent.generateAIResponse(message);
        console.log('🤖 AI:', response.content);
        if (response.actions && response.actions.length > 0) {
            console.log('🎯 Suggested Actions:');
            response.actions.forEach((action, i) => {
                console.log(`  ${i + 1}. ${action.description}`);
            });
        }
        return response;
    } catch (error) {
        console.error('❌ AI interaction failed:', error);
        return null;
    }
};

console.log('\n🎮 Interactive Testing:');
console.log('Use: testAIInteraction("your message here")');
console.log('Example: testAIInteraction("I need help with my math homework")');
