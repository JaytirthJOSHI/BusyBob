// Voice AI Component for BusyBob
// Provides voice interaction capabilities using ElevenLabs

import elevenLabsVoice from '../lib/elevenlabs-voice.js';

class VoiceAI {
    constructor(container) {
        this.container = container;
        this.isInitialized = false;
        this.isRecording = false;
        this.currentAudio = null;
        this.voices = [];
        this.currentVoice = null;
        
        this.init();
    }

    async init() {
        try {
            // Wait for ElevenLabs to initialize
            await this.waitForElevenLabs();
            
            this.voices = elevenLabsVoice.getAvailableVoices();
            this.currentVoice = elevenLabsVoice.getCurrentVoice();
            this.isInitialized = true;
            
            this.render();
            console.log('🎤 Voice AI component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Voice AI:', error);
            this.renderError();
        }
    }

    async waitForElevenLabs() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!elevenLabsVoice.isInitialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!elevenLabsVoice.isInitialized) {
            throw new Error('ElevenLabs Voice AI failed to initialize');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="voice-ai-widget">
                <div class="voice-ai-header">
                    <h3>🎤 Voice AI Assistant</h3>
                    <div class="voice-status ${this.isInitialized ? 'connected' : 'disconnected'}">
                        ${this.isInitialized ? '✅ Connected' : '❌ Disconnected'}
                    </div>
                </div>
                
                ${this.isInitialized ? this.renderControls() : this.renderSetup()}
            </div>
        `;

        if (this.isInitialized) {
            this.attachEventListeners();
        }
    }

    renderSetup() {
        return `
            <div class="voice-setup">
                <p>To enable Voice AI, add your ElevenLabs API key to your .env file:</p>
                <code>VITE_ELEVENLABS_API_KEY=your_api_key_here</code>
                <p>Get your API key from <a href="https://beta.elevenlabs.io/" target="_blank">ElevenLabs</a></p>
                <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
            </div>
        `;
    }

    renderControls() {
        return `
            <div class="voice-controls">
                <div class="voice-selection">
                    <label for="voice-select">Voice:</label>
                    <select id="voice-select" class="voice-select">
                        ${this.voices.map(voice => `
                            <option value="${voice.id}" ${voice.id === this.currentVoice?.id ? 'selected' : ''}>
                                ${voice.name} (${voice.category})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="voice-actions">
                    <button class="btn btn-record ${this.isRecording ? 'recording' : ''}" id="record-btn">
                        ${this.isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
                    </button>
                    
                    <button class="btn btn-play" id="play-btn" disabled>
                        🔊 Play Last Response
                    </button>
                </div>
                
                <div class="voice-input">
                    <textarea id="voice-text-input" placeholder="Type text to convert to speech..." rows="3"></textarea>
                    <button class="btn btn-speak" id="speak-btn">🔊 Speak Text</button>
                </div>
                
                <div class="voice-output" id="voice-output">
                    <div class="transcript" id="transcript"></div>
                </div>
                
                <div class="voice-features">
                    <h4>Quick Actions:</h4>
                    <div class="feature-buttons">
                        <button class="btn btn-feature" data-action="study-plan">📚 Study Plan</button>
                        <button class="btn btn-feature" data-action="motivation">💪 Motivation</button>
                        <button class="btn btn-feature" data-action="explain">📖 Explain Concept</button>
                        <button class="btn btn-feature" data-action="reminder">⏰ Set Reminder</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="voice-ai-widget error">
                <div class="voice-ai-header">
                    <h3>🎤 Voice AI Assistant</h3>
                    <div class="voice-status disconnected">❌ Error</div>
                </div>
                <div class="error-message">
                    <p>Failed to initialize Voice AI. Please check your ElevenLabs API key.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Voice selection
        const voiceSelect = this.container.querySelector('#voice-select');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                elevenLabsVoice.setCurrentVoice(e.target.value);
                this.currentVoice = elevenLabsVoice.getCurrentVoice();
            });
        }

        // Recording button
        const recordBtn = this.container.querySelector('#record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }

        // Play button
        const playBtn = this.container.querySelector('#play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.playLastResponse();
            });
        }

        // Speak text button
        const speakBtn = this.container.querySelector('#speak-btn');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                this.speakText();
            });
        }

        // Feature buttons
        const featureButtons = this.container.querySelectorAll('.btn-feature');
        featureButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            this.isRecording = true;
            this.updateRecordingUI();
            
            // Set up speech recognition for real-time feedback
            this.setupSpeechRecognition();
            
            await elevenLabsVoice.startRecording();
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.showError('Failed to start recording. Please check microphone permissions.');
            this.isRecording = false;
            this.updateRecordingUI();
        }
    }

    stopRecording() {
        this.isRecording = false;
        this.updateRecordingUI();
        elevenLabsVoice.stopRecording();
        
        // Stop speech recognition
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    updateRecordingUI() {
        const recordBtn = this.container.querySelector('#record-btn');
        if (recordBtn) {
            recordBtn.textContent = this.isRecording ? '🛑 Stop Recording' : '🎤 Start Recording';
            recordBtn.classList.toggle('recording', this.isRecording);
        }
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }
                
                if (transcript) {
                    this.updateTranscript(transcript);
                }
            };
            
            this.recognition.start();
        }
    }

    updateTranscript(text) {
        const transcript = this.container.querySelector('#transcript');
        if (transcript) {
            transcript.innerHTML = `<strong>You said:</strong> ${text}`;
        }
    }

    async speakText() {
        const textInput = this.container.querySelector('#voice-text-input');
        const text = textInput?.value.trim();
        
        if (!text) {
            this.showError('Please enter text to speak');
            return;
        }

        try {
            const result = await elevenLabsVoice.playTextAsSpeech(text);
            this.currentAudio = result;
            this.enablePlayButton();
            this.showSuccess('Text spoken successfully');
        } catch (error) {
            console.error('❌ Failed to speak text:', error);
            this.showError('Failed to convert text to speech');
        }
    }

    async playLastResponse() {
        if (!this.currentAudio) {
            this.showError('No audio to play');
            return;
        }

        try {
            await elevenLabsVoice.playAudio(this.currentAudio.audioUrl);
        } catch (error) {
            console.error('❌ Failed to play audio:', error);
            this.showError('Failed to play audio');
        }
    }

    enablePlayButton() {
        const playBtn = this.container.querySelector('#play-btn');
        if (playBtn) {
            playBtn.disabled = false;
        }
    }

    async handleQuickAction(action) {
        let text = '';
        
        switch (action) {
            case 'study-plan':
                text = "I'll help you create a personalized study plan. What subject would you like to focus on today?";
                break;
            case 'motivation':
                text = "You're doing great! Remember, every expert was once a beginner. Keep pushing forward, and you'll achieve your goals. You've got this!";
                break;
            case 'explain':
                text = "I'm here to help explain any concept you're struggling with. What topic would you like me to clarify for you?";
                break;
            case 'reminder':
                text = "I can help you set reminders and stay organized. What would you like me to remind you about?";
                break;
            default:
                text = "How can I help you with your studies today?";
        }

        try {
            const result = await elevenLabsVoice.playTextAsSpeech(text);
            this.currentAudio = result;
            this.enablePlayButton();
        } catch (error) {
            console.error('❌ Failed to handle quick action:', error);
            this.showError('Failed to process voice action');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Public methods for external use
    async speak(message) {
        if (!this.isInitialized) {
            throw new Error('Voice AI not initialized');
        }
        
        return await elevenLabsVoice.playTextAsSpeech(message);
    }

    async recordAndTranscribe() {
        if (!this.isInitialized) {
            throw new Error('Voice AI not initialized');
        }
        
        return new Promise((resolve) => {
            this.onTranscriptionComplete = resolve;
            this.startRecording();
        });
    }

    getVoices() {
        return this.voices;
    }

    setVoice(voiceId) {
        elevenLabsVoice.setCurrentVoice(voiceId);
        this.currentVoice = elevenLabsVoice.getCurrentVoice();
        
        // Update UI
        const voiceSelect = this.container.querySelector('#voice-select');
        if (voiceSelect) {
            voiceSelect.value = voiceId;
        }
    }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .voice-ai-widget {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        margin: 20px 0;
    }

    .voice-ai-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .voice-ai-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.2em;
    }

    .voice-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 500;
    }

    .voice-status.connected {
        background: rgba(34, 197, 94, 0.2);
        color: #16a34a;
    }

    .voice-status.disconnected {
        background: rgba(239, 68, 68, 0.2);
        color: #dc2626;
    }

    .voice-controls {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .voice-selection {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .voice-selection label {
        font-weight: 500;
        color: #333;
    }

    .voice-select {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.8);
        font-size: 0.9em;
    }

    .voice-actions {
        display: flex;
        gap: 10px;
    }

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9em;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .btn-record {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        flex: 1;
    }

    .btn-record.recording {
        background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
        animation: pulse 1.5s infinite;
    }

    .btn-play {
        background: linear-gradient(135deg, #2ed573 0%, #1e90ff 100%);
        color: white;
        flex: 1;
    }

    .btn-play:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .btn-speak {
        background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%);
        color: white;
        width: 100%;
    }

    .voice-input {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    #voice-text-input {
        padding: 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.8);
        resize: vertical;
        font-family: inherit;
    }

    .voice-output {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 10px;
        padding: 15px;
        min-height: 60px;
    }

    .transcript {
        color: #333;
        font-size: 0.9em;
    }

    .voice-features h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1em;
    }

    .feature-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
    }

    .btn-feature {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        color: #333;
        padding: 8px 12px;
        font-size: 0.8em;
    }

    .voice-setup {
        text-align: center;
        color: #666;
    }

    .voice-setup code {
        background: rgba(0, 0, 0, 0.1);
        padding: 8px 12px;
        border-radius: 6px;
        font-family: monospace;
        display: block;
        margin: 10px 0;
    }

    .voice-setup a {
        color: #667eea;
        text-decoration: none;
    }

    .error-message {
        text-align: center;
        color: #dc2626;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    }

    .notification.success {
        background: linear-gradient(135deg, #2ed573 0%, #1e90ff 100%);
    }

    .notification.error {
        background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

document.head.appendChild(style);

export default VoiceAI; 