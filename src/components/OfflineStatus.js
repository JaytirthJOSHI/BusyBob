import { db } from '../lib/offline-db.js'

export class OfflineStatus {
    constructor() {
        this.isOnline = navigator.onLine
        this.statusElement = null
        this.syncQueueCount = 0
        this.isMinimized = false
        this.position = 'bottom-left'
    }

    init(position = 'compact') {
        this.position = position
        this.render()
        this.setupEventListeners()
        this.startStatusUpdates()
    }

    getPositionClasses() {
        switch (this.position) {
            case 'top-left':
                return 'fixed top-4 left-4 z-50'
            case 'top-right':
                return 'fixed top-4 right-4 z-50'
            case 'bottom-right':
                return 'fixed bottom-4 right-20 z-50'
            case 'compact':
                return 'fixed top-4 right-4 z-50'
            case 'bottom-left':
            default:
                return 'fixed bottom-20 left-4 z-50'
        }
    }

    getCompactStyle() {
        if (this.position === 'compact') {
            return `
                /* Compact mode styles */
                #offline-status.compact {
                    transition: all 0.3s ease;
                }
                
                #offline-status.compact .status-content {
                    min-width: auto;
                    padding: 0.5rem;
                }
                
                #offline-status.compact.minimized .status-details {
                    display: none;
                }
                
                #offline-status.compact.minimized {
                    cursor: pointer;
                }
                
                #offline-status.compact:not(.minimized) .connection-indicator-only {
                    display: none;
                }
                
                #offline-status.compact.minimized .connection-indicator-only {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                }
            `
        }
        return ''
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true
            this.updateStatus().catch(console.error)
            this.showTemporaryMessage('🌐 Back online - syncing data...', 3000)
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            this.updateStatus().catch(console.error)
            this.showTemporaryMessage('📱 You\'re offline - changes will sync when reconnected', 5000)
        }) 
    }

    render() {
        const positionClasses = this.getPositionClasses()
        const compactClass = this.position === 'compact' ? 'compact' : ''
        const minimizedClass = this.isMinimized ? 'minimized' : ''
        
        const statusHtml = `
            <div id="offline-status" class="${positionClasses} ${compactClass} ${minimizedClass} transition-all duration-300">
                <div class="status-content bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px]">
                    <!-- Compact indicator (shown when minimized) -->
                    <div class="connection-indicator-only">
                        <div id="connection-indicator-compact" class="w-3 h-3 rounded-full"></div>
                    </div>
                    
                    <!-- Full status details -->
                    <div class="status-details">
                        <div class="flex items-center space-x-2">
                            <div id="connection-indicator" class="w-3 h-3 rounded-full"></div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <div id="connection-status" class="text-sm font-medium"></div>
                                    ${this.position === 'compact' ? `
                                        <button id="minimize-status" class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2">
                                            −
                                        </button>
                                    ` : ''}
                                </div>
                                <div id="sync-status" class="text-xs text-gray-500 dark:text-gray-400"></div>
                            </div>
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
                
                ${this.getCompactStyle()}
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    #offline-status {
                        position: fixed !important;
                        top: 1rem !important;
                        left: 1rem !important;
                        right: 1rem !important;
                        bottom: auto !important;
                        width: auto !important;
                    }
                    
                    #offline-status .status-content {
                        min-width: auto;
                        width: 100%;
                    }
                    
                    #offline-status.compact.minimized {
                        width: 3rem;
                        right: 1rem;
                        left: auto;
                    }
                }
            </style>
        `

        if (!document.getElementById('offline-status')) {
            document.body.insertAdjacentHTML('beforeend', statusHtml)
        }

        this.statusElement = document.getElementById('offline-status')
        this.setupCompactHandlers()
        this.updateStatus().catch(console.error)
    }

    setupCompactHandlers() {
        if (this.position === 'compact') {
            const minimizeBtn = document.getElementById('minimize-status')
            const statusElement = this.statusElement
            
            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', () => {
                    this.toggleMinimized()
                })
            }
            
            if (statusElement) {
                statusElement.addEventListener('click', (e) => {
                    if (this.isMinimized && !e.target.closest('button')) {
                        this.toggleMinimized()
                    }
                })
            }
        }
    }

    toggleMinimized() {
        this.isMinimized = !this.isMinimized
        if (this.statusElement) {
            this.statusElement.classList.toggle('minimized', this.isMinimized)
            
            const minimizeBtn = document.getElementById('minimize-status')
            if (minimizeBtn) {
                minimizeBtn.textContent = this.isMinimized ? '+' : '−'
                minimizeBtn.title = this.isMinimized ? 'Expand status' : 'Minimize status'
            }
        }
    }

    changePosition(newPosition) {
        if (this.statusElement) {
            const oldClasses = this.getPositionClasses().split(' ')
            this.statusElement.classList.remove(...oldClasses)
            
            this.position = newPosition
            const newClasses = this.getPositionClasses().split(' ')
            this.statusElement.classList.add(...newClasses)
            
            if (newPosition === 'compact') {
                this.statusElement.classList.add('compact')
                this.setupCompactHandlers()
            } else {
                this.statusElement.classList.remove('compact', 'minimized')
                this.isMinimized = false
            }
            
            console.log(`📱 Offline status moved to: ${newPosition}`)
        }
    }

    moveToTopRight() {
        this.changePosition('top-right')
    }

    moveToTopLeft() {
        this.changePosition('top-left')
    }

    moveToBottomLeft() {
        this.changePosition('bottom-left')
    }

    moveToBottomRight() {
        this.changePosition('bottom-right')
    }

    enableCompactMode() {
        this.changePosition('compact')
    }

    async updateStatus() {
        if (!this.statusElement) return

        const indicator = document.getElementById('connection-indicator')
        const indicatorCompact = document.getElementById('connection-indicator-compact')
        const statusText = document.getElementById('connection-status')
        const syncText = document.getElementById('sync-status')

        if (!indicator || !statusText || !syncText) return

        try {
            // Check if getStatus method exists before calling
            if (typeof db.getStatus === 'function') {
                const dbStatus = await db.getStatus()
                this.syncQueueCount = dbStatus.offlineStatus?.syncQueueLength || 0
            } else {
                this.syncQueueCount = 0
            }
        } catch (error) {
            // Silently handle status errors
            this.syncQueueCount = 0
        }

        const indicatorClass = 'w-3 h-3 rounded-full'
        indicator.className = indicatorClass
        if (indicatorCompact) {
            indicatorCompact.className = indicatorClass
        }
        
        let statusClass = ''
        let statusTextContent = ''
        let syncTextContent = ''
        
        if (this.isOnline) {
            if (this.syncQueueCount > 0) {
                statusClass = 'status-syncing'
                statusTextContent = 'Syncing...'
                syncTextContent = `${this.syncQueueCount} items pending`
            } else {
                statusClass = 'status-online'
                statusTextContent = 'Online'
                syncTextContent = 'All data synced'
            }
        } else {
            statusClass = 'status-offline'
            statusTextContent = 'Offline'
            if (this.syncQueueCount > 0) {
                syncTextContent = `${this.syncQueueCount} changes to sync`
            } else {
                syncTextContent = 'Changes will sync when online'
            }
        }
        
        indicator.classList.add(statusClass)
        if (indicatorCompact) {
            indicatorCompact.classList.add(statusClass)
        }
        
        statusText.textContent = statusTextContent
        syncText.textContent = syncTextContent
        
        if (this.position === 'compact' && this.statusElement) {
            this.statusElement.title = `${statusTextContent} - ${syncTextContent}`
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
        setInterval(() => {
            this.updateStatus().catch(console.error)
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

    async triggerSync() {
        if (this.isOnline) {
            this.showTemporaryMessage('🔄 Syncing now...', 2000)
            try {
                await db.syncOfflineData()
                await this.updateStatus()
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

export const offlineStatus = new OfflineStatus()