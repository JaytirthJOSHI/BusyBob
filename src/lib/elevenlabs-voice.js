// ElevenLabs Voice AI Service for BusyBob
// Provides advanced voice AI capabilities including TTS, STT, and voice cloning

class ElevenLabsVoiceService {
    constructor() {
        this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
        this.baseURL = 'https://api.elevenlabs.io/v1';
        this.isInitialized = false;
        this.availableVoices = new Map();
        this.currentVoice = null;
        this.audioContext = null;
        this.mediaRecorder = null;
        this.isRecording = false;
        this.audioChunks = [];
        
        this.initialize();
    }

    initialize() {
        if (!this.apiKey) {
            console.warn('⚠️ ELEVENLABS_API_KEY not found. Please add VITE_ELEVENLABS_API_KEY to your .env file');
            return;
        }
        
        this.isInitialized = true;
        this.loadAvailableVoices();
        this.setupAudioContext();
        console.log('🎤 ElevenLabs Voice AI Service initialized');
    }

    async loadAvailableVoices() {
        try {
            const response = await fetch(`${this.baseURL}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load voices: ${response.status}`);
            }

            const data = await response.json();
            this.availableVoices.clear();
            
            data.voices.forEach(voice => {
                this.availableVoices.set(voice.voice_id, {
                    id: voice.voice_id,
                    name: voice.name,
                    category: voice.category,
                    description: voice.labels?.description || '',
                    accent: voice.labels?.accent || '',
                    age: voice.labels?.age || '',
                    gender: voice.labels?.gender || '',
                    useCase: voice.labels?.use_case || '',
                    previewUrl: voice.preview_url
                });
            });

            // Set default voice (first available)
            if (this.availableVoices.size > 0) {
                const firstVoice = this.availableVoices.values().next().value;
                this.currentVoice = firstVoice.id;
            }

            console.log(`🎵 Loaded ${this.availableVoices.size} voices`);
        } catch (error) {
            console.error('❌ Failed to load voices:', error);
        }
    }

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('❌ Failed to setup audio context:', error);
        }
    }

    // Text-to-Speech Methods
    async textToSpeech(text, voiceId = this.currentVoice, options = {}) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs Voice AI not initialized. Please check your API key.');
        }

        const defaultOptions = {
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
                style: 0.0,
                use_speaker_boost: true
            }
        };

        const requestBody = {
            text: text,
            model_id: options.model_id || defaultOptions.model_id,
            voice_settings: {
                ...defaultOptions.voice_settings,
                ...options.voice_settings
            }
        };

        try {
            console.log('🎤 Converting text to speech...');
            const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`TTS Error: ${response.status} - ${errorData.detail?.message || response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log('✅ Text-to-speech conversion completed');
            return {
                audioBlob,
                audioUrl,
                duration: await this.getAudioDuration(audioBlob)
            };
        } catch (error) {
            console.error('❌ Text-to-speech failed:', error);
            throw error;
        }
    }

    async getAudioDuration(audioBlob) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };
            audio.src = URL.createObjectURL(audioBlob);
        });
    }

    // Speech-to-Text Methods
    async startRecording() {
        if (this.isRecording) {
            console.warn('⚠️ Already recording');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                this.isRecording = false;
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                await this.speechToText(audioBlob);
            };

            this.mediaRecorder.start();
            console.log('🎤 Started recording...');
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('⚠️ Not currently recording');
            return;
        }

        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        console.log('🛑 Stopped recording');
    }

    async speechToText(audioBlob) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs Voice AI not initialized. Please check your API key.');
        }

        try {
            console.log('🎤 Converting speech to text...');
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            formData.append('model_id', 'eleven_english_sts_v2');

            const response = await fetch(`${this.baseURL}/speech-to-text`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`STT Error: ${response.status} - ${errorData.detail?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Speech-to-text conversion completed');
            
            return {
                text: data.text,
                confidence: data.confidence || 0
            };
        } catch (error) {
            console.error('❌ Speech-to-text failed:', error);
            throw error;
        }
    }

    // Voice Cloning Methods
    async cloneVoice(name, description, audioFiles) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs Voice AI not initialized. Please check your API key.');
        }

        try {
            console.log('🎭 Cloning voice...');
            
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            
            audioFiles.forEach((file, index) => {
                formData.append('files', file, `sample_${index}.wav`);
            });

            const response = await fetch(`${this.baseURL}/voices/add`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Voice cloning error: ${response.status} - ${errorData.detail?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Voice cloned successfully');
            
            // Reload voices to include the new one
            await this.loadAvailableVoices();
            
            return {
                voiceId: data.voice_id,
                name: data.name,
                category: data.category
            };
        } catch (error) {
            console.error('❌ Voice cloning failed:', error);
            throw error;
        }
    }

    // Audio Playback Methods
    async playAudio(audioUrl) {
        try {
            const audio = new Audio(audioUrl);
            await audio.play();
            return new Promise((resolve) => {
                audio.onended = resolve;
                audio.onerror = (error) => {
                    console.error('❌ Audio playback error:', error);
                    resolve();
                };
            });
        } catch (error) {
            console.error('❌ Failed to play audio:', error);
            throw error;
        }
    }

    async playTextAsSpeech(text, voiceId = this.currentVoice, options = {}) {
        try {
            const result = await this.textToSpeech(text, voiceId, options);
            await this.playAudio(result.audioUrl);
            return result;
        } catch (error) {
            console.error('❌ Failed to play text as speech:', error);
            throw error;
        }
    }

    // Voice Management Methods
    getAvailableVoices() {
        return Array.from(this.availableVoices.values());
    }

    getVoiceById(voiceId) {
        return this.availableVoices.get(voiceId);
    }

    setCurrentVoice(voiceId) {
        if (this.availableVoices.has(voiceId)) {
            this.currentVoice = voiceId;
            console.log(`🎵 Current voice set to: ${this.availableVoices.get(voiceId).name}`);
        } else {
            console.warn(`⚠️ Voice ID ${voiceId} not found`);
        }
    }

    getCurrentVoice() {
        return this.currentVoice ? this.availableVoices.get(this.currentVoice) : null;
    }

    // Educational Voice Features
    async speakStudyPlan(studyPlan) {
        const voice = this.getCurrentVoice();
        const intro = `Here's your personalized study plan. ${studyPlan}`;
        return await this.playTextAsSpeech(intro, this.currentVoice, {
            voice_settings: {
                stability: 0.7,
                similarity_boost: 0.8,
                style: 0.3
            }
        });
    }

    async speakMotivation(motivationalMessage) {
        return await this.playTextAsSpeech(motivationalMessage, this.currentVoice, {
            voice_settings: {
                stability: 0.8,
                similarity_boost: 0.9,
                style: 0.5
            }
        });
    }

    async speakConceptExplanation(explanation) {
        return await this.playTextAsSpeech(explanation, this.currentVoice, {
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.7,
                style: 0.2
            }
        });
    }

    // Utility Methods
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            if (response.ok) {
                console.log('✅ ElevenLabs connection successful');
                return true;
            } else {
                console.error('❌ ElevenLabs connection failed');
                return false;
            }
        } catch (error) {
            console.error('❌ ElevenLabs connection error:', error);
            return false;
        }
    }

    // Cleanup
    cleanup() {
        if (this.mediaRecorder && this.isRecording) {
            this.stopRecording();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Create and export the service instance
const elevenLabsVoice = new ElevenLabsVoiceService();

// Expose global functions for debugging
window.elevenLabsVoice = elevenLabsVoice;
window.testElevenLabsConnection = () => elevenLabsVoice.testConnection();
window.playTextAsSpeech = (text) => elevenLabsVoice.playTextAsSpeech(text);
window.startVoiceRecording = () => elevenLabsVoice.startRecording();
window.stopVoiceRecording = () => elevenLabsVoice.stopRecording();
window.getAvailableVoices = () => elevenLabsVoice.getAvailableVoices();
window.setVoice = (voiceId) => elevenLabsVoice.setCurrentVoice(voiceId);

export default elevenLabsVoice; 