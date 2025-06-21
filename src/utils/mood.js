import { db } from '../lib/supabase.js'
import { ui } from './helpers.js'

let feelings = []
let lastCheckedDate = null

const moodUI = {
    render() {
        const container = document.getElementById('mood-logging-section')
        if (!container) return

        const today = new Date().toISOString().split('T')[0]
        const todaysFeeling = feelings.find(f => f.created_at.startsWith(today))

        if (todaysFeeling) {
            container.innerHTML = this.renderLoggedState(todaysFeeling)
        } else {
            container.innerHTML = this.renderLoggingForm()
            this.addFormEventListeners()
        }
    },

    renderLoggingForm() {
        return `
            <div class="space-y-3">
                <div class="flex justify-around">
                    ${[1, 2, 3, 4, 5].map(rating => this.renderMoodButton(rating)).join('')}
                </div>
                <button id="save-mood-btn" class="w-full btn-gradient text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm" disabled>
                    Save Mood
                </button>
            </div>
        `
    },
    
    renderMoodButton(rating) {
        const emojis = ['😞', '😕', '😐', '🙂', '😄']
        const colors = [
            'bg-red-200 dark:bg-red-800',
            'bg-orange-200 dark:bg-orange-800',
            'bg-yellow-200 dark:bg-yellow-800',
            'bg-green-200 dark:bg-green-800',
            'bg-blue-200 dark:bg-blue-800'
        ]
        return `
            <button data-rating="${rating}" class="mood-btn h-12 w-12 rounded-full flex items-center justify-center text-2xl transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 ${colors[rating-1]}">
                ${emojis[rating-1]}
            </button>
        `
    },

    renderLoggedState(feeling) {
        const emojis = ['😞', '😕', '😐', '🙂', '😄']
        return `
            <div class="text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">Today's Mood:</p>
                <div class="text-5xl my-2">${emojis[feeling.rating - 1]}</div>
                <p class="font-semibold text-gray-800 dark:text-gray-200">You felt ${this.getRatingText(feeling.rating)}</p>
            </div>
        `
    },

    getRatingText(rating) {
        return ['Very Bad', 'Bad', 'Okay', 'Good', 'Excellent'][rating - 1]
    },

    addFormEventListeners() {
        let selectedRating = 0
        const saveBtn = document.getElementById('save-mood-btn')

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset styles
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'))
                
                // Apply style to selected
                btn.classList.add('ring-2', 'ring-blue-500')
                selectedRating = parseInt(btn.dataset.rating)
                saveBtn.disabled = false
            })
        })

        saveBtn.addEventListener('click', async () => {
            if (selectedRating > 0) {
                await moodManager.log(selectedRating)
            }
        })
    }
}

const moodManager = {
    async init() {
        await this.load()
        moodUI.render()
        this.checkPrompt()
    },

    async load() {
        try {
            const { data, error } = await db.getFeelings()
            if (error) throw error
            feelings = data || []
        } catch (error) {
            console.error("Error loading feelings:", error)
            ui.showMessage("Failed to load mood data.", "error")
        }
    },

    async log(rating) {
        try {
            const { data, error } = await db.createFeeling({ rating })
            if (error) throw error
            
            feelings.unshift(data[0])
            moodUI.render()
            ui.showMessage("Mood logged successfully!", "success")

            // Update home page stats if needed
            if (window.loadHomeData) window.loadHomeData()
            
        } catch (error) {
            console.error("Error logging mood:", error)
            ui.showMessage("Failed to save mood.", "error")
        }
    },
    
    checkPrompt() {
        const today = new Date().toDateString()
        if (lastCheckedDate === today) return // Already checked today

        lastCheckedDate = today
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const yesterdayFeeling = feelings.find(f => f.created_at.startsWith(yesterdayStr))
        const todayFeeling = feelings.find(f => f.created_at.startsWith(new Date().toISOString().split('T')[0]))

        if (!todayFeeling && !yesterdayFeeling) {
             // Find last logged feeling
            const lastFeelingDate = feelings.length > 0 ? new Date(feelings[0].created_at) : null
            if (lastFeelingDate) {
                const daysSinceLastLog = (new Date() - lastFeelingDate) / (1000 * 60 * 60 * 24)
                if (daysSinceLastLog > 1) {
                    this.showYesterdayPrompt()
                }
            } else {
                 this.showYesterdayPrompt() // No feelings logged ever
            }
        }
    },

    showYesterdayPrompt() {
        const promptHTML = `
            <div id="yesterday-mood-prompt" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">How was yesterday?</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">You didn't log your mood. Taking a moment to reflect can be helpful.</p>
                    <div class="flex justify-around mb-4">
                        ${[1, 2, 3, 4, 5].map(rating => moodUI.renderMoodButton(rating)).join('')}
                    </div>
                    <div class="flex gap-2">
                        <button id="save-yesterday-mood" class="flex-1 btn-gradient text-white py-2 px-4 rounded-lg text-sm" disabled>Save</button>
                        <button id="dismiss-yesterday-prompt" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg text-sm">Dismiss</button>
                    </div>
                </div>
            </div>
        `
        document.body.insertAdjacentHTML('beforeend', promptHTML)

        let selectedRating = 0
        const saveBtn = document.getElementById('save-yesterday-mood')
        const promptEl = document.getElementById('yesterday-mood-prompt')

        promptEl.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                promptEl.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'))
                btn.classList.add('ring-2', 'ring-blue-500')
                selectedRating = parseInt(btn.dataset.rating)
                saveBtn.disabled = false
            })
        })
        
        saveBtn.addEventListener('click', async () => {
            if (selectedRating > 0) {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                
                try {
                    await db.createFeeling({ rating: selectedRating, created_at: yesterday.toISOString() })
                    ui.showMessage("Yesterday's mood logged!", "success")
                    promptEl.remove()
                    // We don't need to reload all feelings for this, just don't prompt again
                } catch (error) {
                    ui.showMessage("Failed to save yesterday's mood.", "error")
                }
            }
        })

        document.getElementById('dismiss-yesterday-prompt').addEventListener('click', () => {
            promptEl.remove()
        })
    },

    getFeelings() {
        return feelings
    }
}

export { moodManager } 