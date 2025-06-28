import { db } from '../lib/supabase.js'
import { ui } from '../utils/helpers.js'

export class AINotesComponent {
    constructor() {
        this.notes = []
        this.isProcessing = false
        this.currentAudio = null
        this.mediaRecorder = null
        this.audioChunks = []
        this.recordingDuration = 0
        this.recordingTimer = null
    }

    render() {
        const container = document.getElementById('ai-notes-section')
        if (!container) return

        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-brain text-white text-sm"></i>
                            </div>
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">AI Notes</h2>
                        </div>
                        <button id="refresh-ai-notes" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Document Upload -->
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all cursor-pointer" id="upload-document-card">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                                    <i class="fas fa-file-upload text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-gray-900 dark:text-white">Upload Document</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">PDF, TXT, DOC</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Upload documents for AI-powered analysis and summaries</p>
                            <input type="file" id="document-input" accept=".pdf,.txt,.doc,.docx" class="hidden">
                        </div>

                        <!-- Audio Recording -->
                        <div class="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-6 border border-red-200 dark:border-red-700 hover:shadow-md transition-all cursor-pointer" id="record-audio-card">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4">
                                    <i class="fas fa-microphone text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-gray-900 dark:text-white">Record Audio</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">Voice to Notes</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Record lectures or voice notes for transcription</p>
                        </div>
                    </div>
                </div>

                <!-- Processing Indicator -->
                <div id="processing-indicator" class="hidden p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-4"></div>
                        <div>
                            <p class="text-lg font-medium text-gray-900 dark:text-white">Processing with AI...</p>
                            <p class="text-sm text-gray-600 dark:text-gray-300">Generating transcript and summary</p>
                        </div>
                    </div>
                </div>

                <!-- Recording Modal -->
                <div id="recording-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                        <div class="text-center">
                            <div class="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i id="recording-icon" class="fas fa-microphone text-red-500 text-3xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recording Audio</h3>
                            <p id="recording-duration" class="text-3xl font-bold text-gray-900 dark:text-white mb-2">0:00</p>
                            <p id="recording-status" class="text-gray-600 dark:text-gray-300 mb-6">Ready to record</p>
                            
                            <div class="flex justify-center space-x-4">
                                <button id="start-stop-recording" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium">
                                    Start Recording
                                </button>
                                <button id="cancel-recording" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes List -->
                <div class="p-6">
                    <div id="ai-notes-list">
                        ${this.renderNotesList()}
                    </div>
                </div>
            </div>
        `

        this.addEventListeners()
    }

    renderNotesList() {
        if (this.notes.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-lightbulb text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No AI Notes Yet</h3>
                    <p class="text-gray-600 dark:text-gray-300">Upload documents or record audio to generate AI-powered notes with summaries and insights.</p>
                </div>
            `
        }

        return this.notes.map(note => `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-4 border border-gray-200 dark:border-gray-600">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-${note.note_type === 'recording' ? 'microphone' : 'file-text'} text-blue-500 text-lg mr-3"></i>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">${note.title}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                ${new Date(note.created_at).toLocaleDateString()}
                                ${note.audio_duration ? ` • ${this.formatDuration(note.audio_duration)}` : ''}
                            </p>
                        </div>
                    </div>
                    <button onclick="aiNotes.deleteNote('${note.id}')" class="text-red-500 hover:text-red-700 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div class="mb-4">
                    <p class="text-gray-700 dark:text-gray-300 line-clamp-3">${note.content}</p>
                </div>

                ${note.ai_summary ? `
                    <div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">AI Summary</p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${note.ai_summary}</p>
                    </div>
                ` : ''}

                ${note.source_file_name ? `
                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <i class="fas fa-paperclip mr-2"></i>
                            <span>${note.source_file_name}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('')
    }

    addEventListeners() {
        // Document upload
        document.getElementById('upload-document-card')?.addEventListener('click', () => {
            document.getElementById('document-input').click()
        })

        document.getElementById('document-input')?.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (file) {
                this.processDocument(file)
            }
        })

        // Audio recording
        document.getElementById('record-audio-card')?.addEventListener('click', () => {
            this.showRecordingModal()
        })

        document.getElementById('start-stop-recording')?.addEventListener('click', () => {
            if (this.mediaRecorder?.state === 'recording') {
                this.stopRecording()
            } else {
                this.startRecording()
            }
        })

        document.getElementById('cancel-recording')?.addEventListener('click', () => {
            this.hideRecordingModal()
            this.stopRecording()
        })

        // Refresh notes
        document.getElementById('refresh-ai-notes')?.addEventListener('click', () => {
            this.loadNotes()
        })
    }

    async loadNotes() {
        try {
            const { data, error } = await db.getAINotes()
            if (error) throw error
            
            this.notes = data || []
            this.updateNotesList()
        } catch (error) {
            console.error('Error loading AI notes:', error)
            ui.showMessage('Failed to load AI notes', 'error')
        }
    }

    async processDocument(file) {
        try {
            this.showProcessing(true)

            // Check file type
            const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if (!supportedTypes.includes(file.type)) {
                throw new Error('Unsupported file type. Please select a PDF, TXT, or DOC file.')
            }

            // Read file content for text files
            let content = 'Document content processed'
            if (file.type === 'text/plain') {
                content = await this.readFileContent(file)
            }

            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 2000))

            const noteData = {
                title: file.name || `Document - ${new Date().toLocaleDateString()}`,
                content: content,
                note_type: 'upload',
                ai_summary: 'AI-generated summary of the document content. This is a simulated summary that would normally be generated by an AI service like GPT-4 or Claude.',
                source_file_name: file.name,
                source_file_type: file.type,
                source_file_size: file.size,
                processing_status: 'completed'
            }

            const { data, error } = await db.createAINote(noteData)
            if (error) throw error

            this.notes.unshift(data[0])
            this.updateNotesList()
            ui.showMessage('Document processed successfully!', 'success')

        } catch (error) {
            console.error('Error processing document:', error)
            ui.showMessage(`Failed to process document: ${error.message}`, 'error')
        } finally {
            this.showProcessing(false)
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = (e) => reject(e)
            reader.readAsText(file)
        })
    }

    showRecordingModal() {
        document.getElementById('recording-modal').classList.remove('hidden')
    }

    hideRecordingModal() {
        document.getElementById('recording-modal').classList.add('hidden')
        this.resetRecording()
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            this.mediaRecorder = new MediaRecorder(stream)
            this.audioChunks = []

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data)
            }

            this.mediaRecorder.onstop = () => {
                this.processAudioRecording()
            }

            this.mediaRecorder.start()
            
            // Update UI
            document.getElementById('start-stop-recording').textContent = 'Stop Recording'
            document.getElementById('start-stop-recording').className = 'bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium'
            document.getElementById('recording-status').textContent = 'Recording in progress...'
            document.getElementById('recording-icon').className = 'fas fa-microphone text-red-500 text-3xl animate-pulse'

            // Start timer
            this.recordingDuration = 0
            this.recordingTimer = setInterval(() => {
                this.recordingDuration++
                document.getElementById('recording-duration').textContent = this.formatDuration(this.recordingDuration)
            }, 1000)

        } catch (error) {
            console.error('Error starting recording:', error)
            ui.showMessage('Failed to start recording. Please check microphone permissions.', 'error')
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop()
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer)
            this.recordingTimer = null
        }
    }

    resetRecording() {
        this.recordingDuration = 0
        document.getElementById('recording-duration').textContent = '0:00'
        document.getElementById('start-stop-recording').textContent = 'Start Recording'
        document.getElementById('start-stop-recording').className = 'bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium'
        document.getElementById('recording-status').textContent = 'Ready to record'
        document.getElementById('recording-icon').className = 'fas fa-microphone text-red-500 text-3xl'
    }

    async processAudioRecording() {
        try {
            this.hideRecordingModal()
            this.showProcessing(true)

            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
            
            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 3000))

            const noteData = {
                title: `Audio Note - ${new Date().toLocaleDateString()}`,
                content: 'This is a simulated transcription of your audio recording. In a real implementation, this would use speech-to-text AI services like OpenAI Whisper, Google Speech-to-Text, or similar services to convert your spoken words into text.',
                transcript: 'This is a simulated transcription of your audio recording.',
                note_type: 'recording',
                ai_summary: 'AI-generated summary: This audio note contains important information that has been transcribed and summarized. The AI has identified key points and themes from your recording.',
                audio_duration: this.recordingDuration,
                processing_status: 'completed',
                metadata: { 
                    recording_duration: this.recordingDuration,
                    audio_size: audioBlob.size 
                }
            }

            const { data, error } = await db.createAINote(noteData)
            if (error) throw error

            this.notes.unshift(data[0])
            this.updateNotesList()
            ui.showMessage('Audio note processed successfully!', 'success')

        } catch (error) {
            console.error('Error processing audio recording:', error)
            ui.showMessage(`Failed to process audio recording: ${error.message}`, 'error')
        } finally {
            this.showProcessing(false)
        }
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this AI note?')) return

        try {
            const { error } = await db.deleteAINote(noteId)
            if (error) throw error

            this.notes = this.notes.filter(note => note.id !== noteId)
            this.updateNotesList()
            ui.showMessage('Note deleted successfully', 'success')
        } catch (error) {
            console.error('Error deleting note:', error)
            ui.showMessage('Failed to delete note', 'error')
        }
    }

    showProcessing(show) {
        const indicator = document.getElementById('processing-indicator')
        if (show) {
            indicator.classList.remove('hidden')
        } else {
            indicator.classList.add('hidden')
        }
    }

    updateNotesList() {
        const container = document.getElementById('ai-notes-list')
        if (container) {
            container.innerHTML = this.renderNotesList()
        }
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    async init() {
        await this.loadNotes()
        this.render()
    }
}

// Global instance
export const aiNotes = new AINotesComponent() 