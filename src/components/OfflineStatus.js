import { db } from '../lib/offline-db.js'

export class OfflineStatus {
    constructor() {
        this.isOnline = navigator.onLine
        this.statusElement = null
        this.syncQueueCount = 0
    }

    init() {
        this.render()
        this.setupEventListeners()
        this.startStatusUpdates()
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true
            this.updateStatus()
            this.showTemporaryMessage('🌐 Back online - syncing data...', 3000)
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            this.updateStatus()
            this.showTemporaryMessage('📱 You\'re offline - changes will sync when reconnected', 5000)
        }) 
    }

    render() {
        // Create status indicator
        const statusHtml = `
            <div id="offline-status" class="fixed bottom-4 left-4 z-50 transition-all duration-300">
                <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div class="flex items-center space-x-2">
                        <div id="connection-indicator" class="w-3 h-3 rounded-full"></div>
                        <div>
                            <div id="connection-status" class="text-sm font-medium"></div>
                            <div id="sync-status" class="text-xs text-gray-500 dark:text-gray-400"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Temporary message overlay -->
                <div id="status-message" class="absolute bottom-full left-0 mb-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg transform transition-all duration-300 opacity-0 translate-y-2 pointer-events-none">
                </div>
            </div>

            <style>
                #offline-status {
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                
                #offline-status.hidden {
                    transform: translateY(100%);
                    opacity: 0;
                }
                
                .status-online {
                    background-color: #10b981;
                }
                
                .status-offline {
                    background-color: #ef4444;
                }
                
                .status-syncing {
                    background-color: #f59e0b;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .status-message-show {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            </style>
        `

        // Add to page if not already present
        if (!document.getElementById('offline-status')) {
            document.body.insertAdjacentHTML('beforeend', statusHtml)
        }

        this.statusElement = document.getElementById('offline-status')
        this.updateStatus()
    }

    updateStatus() {
        if (!this.statusElement) return

        const indicator = document.getElementById('connection-indicator')
        const statusText = document.getElementById('connection-status')
        const syncText = document.getElementById('sync-status')

        if (!indicator || !statusText || !syncText) return

        const dbStatus = db.getStatus()
        this.syncQueueCount = dbStatus.offlineStatus?.syncQueueLength || 0

        // Update connection indicator
        indicator.className = 'w-3 h-3 rounded-full'
        
        if (this.isOnline) {
            if (this.syncQueueCount > 0) {
                indicator.classList.add('status-syncing')
                statusText.textContent = 'Syncing...'
                syncText.textContent = `${this.syncQueueCount} items pending`
            } else {
                indicator.classList.add('status-online')
                statusText.textContent = 'Online'
                syncText.textContent = 'All data synced'
            }
        } else {
            indicator.classList.add('status-offline')
            statusText.textContent = 'Offline'
            if (this.syncQueueCount > 0) {
                syncText.textContent = `${this.syncQueueCount} changes to sync`
            } else {
                syncText.textContent = 'Changes will sync when online'
            }
        }
    }

    showTemporaryMessage(message, duration = 3000) {
        const messageElement = document.getElementById('status-message')
        if (!messageElement) return

        messageElement.textContent = message
        messageElement.classList.add('status-message-show')

        setTimeout(() => {
            messageElement.classList.remove('status-message-show')
        }, duration)
    }

    startStatusUpdates() {
        // Update status every 5 seconds
        setInterval(() => {
            this.updateStatus()
        }, 5000)
    }

    hide() {
        if (this.statusElement) {
            this.statusElement.classList.add('hidden')
        }
    }

    show() {
        if (this.statusElement) {
            this.statusElement.classList.remove('hidden')
        }
    }

    destroy() {
        if (this.statusElement) {
            this.statusElement.remove()
            this.statusElement = null
        }
    }

    // Manual sync trigger
    async triggerSync() {
        if (this.isOnline) {
            this.showTemporaryMessage('🔄 Syncing now...', 2000)
            try {
                await db.syncOfflineData()
                this.updateStatus()
                this.showTemporaryMessage('✅ Sync complete!', 2000)
            } catch (error) {
                console.error('Manual sync failed:', error)
                this.showTemporaryMessage('❌ Sync failed', 3000)
            }
        } else {
            this.showTemporaryMessage('📱 Cannot sync while offline', 3000)
        }
    }
}

// Global instance
export const offlineStatus = new OfflineStatus() 