import { auth, supabase } from '../lib/supabase.js'

class OfflineStorage {
    constructor() {
        this.dbName = 'BusyBobOfflineDB'
        this.dbVersion = 1
        this.currentUserId = null
        this.db = null
        this.syncQueue = []
        this.isOnline = navigator.onLine
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true
            this.syncPendingChanges()
        })
        
        window.addEventListener('offline', () => {
            this.isOnline = false
        })
    }

    async init(userId) {
        this.currentUserId = userId
        this.db = await this.openDB()
        await this.loadSyncQueue()
        
        // If we're online, sync any pending changes
        if (this.isOnline) {
            await this.syncPendingChanges()
        }
        
        console.log('📱 Offline storage initialized for user:', userId)
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion)
            
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result
                
                // Create object stores for each data type
                const stores = [
                    'users', 'tasks', 'feelings', 'journal_entries', 
                    'kid_mode_settings', 'studentvue_credentials', 
                    'canvas_credentials', 'music_connections', 'ai_notes',
                    'sync_queue', 'user_metadata'
                ]
                
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' })
                        store.createIndex('user_id', 'user_id', { unique: false })
                        store.createIndex('updated_at', 'updated_at', { unique: false })
                    }
                })
            }
        })
    }

    // Generic data operations
    async saveData(tableName, data, skipSync = false) {
        if (!this.currentUserId || !this.db) return null

        // Add user_id and timestamps to data
        const record = {
            ...data,
            user_id: this.currentUserId,
            updated_at: new Date().toISOString(),
            offline_created: !data.id // Track if created offline
        }

        // Generate offline ID if needed
        if (!record.id) {
            record.id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        try {
            const tx = this.db.transaction([tableName], 'readwrite')
            const store = tx.objectStore(tableName)
            await store.put(record)
            
            console.log(`💾 Saved ${tableName} offline:`, record.id)

            // Add to sync queue if not already syncing
            if (!skipSync) {
                await this.queueForSync(tableName, 'upsert', record)
            }

            return record
        } catch (error) {
            console.error(`Error saving ${tableName} offline:`, error)
            return null
        }
    }

    async getData(tableName, filters = {}) {
        if (!this.currentUserId || !this.db) return []

        try {
            const tx = this.db.transaction([tableName], 'readonly')
            const store = tx.objectStore(tableName)
            const index = store.index('user_id')
            const request = index.getAll(this.currentUserId)
            
            const result = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            // Apply filters if provided
            let filteredResult = result
            if (filters.where) {
                filteredResult = result.filter(item => {
                    return Object.entries(filters.where).every(([key, value]) => {
                        return item[key] === value
                    })
                })
            }

            // Apply ordering
            if (filters.orderBy) {
                const { column, ascending = true } = filters.orderBy
                filteredResult.sort((a, b) => {
                    const aVal = a[column]
                    const bVal = b[column]
                    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
                    return ascending ? comparison : -comparison
                })
            }

            console.log(`📱 Retrieved ${filteredResult.length} ${tableName} records offline`)
            return filteredResult
        } catch (error) {
            console.error(`Error getting ${tableName} offline:`, error)
            return []
        }
    }

    async deleteData(tableName, id) {
        if (!this.currentUserId || !this.db) return false

        try {
            const tx = this.db.transaction([tableName], 'readwrite')
            const store = tx.objectStore(tableName)
            await store.delete(id)
            
            console.log(`🗑️ Deleted ${tableName} offline:`, id)

            // Queue for sync
            await this.queueForSync(tableName, 'delete', { id })

            return true
        } catch (error) {
            console.error(`Error deleting ${tableName} offline:`, error)
            return false
        }
    }

    // Sync queue management
    async queueForSync(tableName, operation, data) {
        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: this.currentUserId,
            table_name: tableName,
            operation, // 'upsert', 'delete'
            data,
            created_at: new Date().toISOString(),
            attempts: 0,
            max_attempts: 3
        }

        this.syncQueue.push(syncItem)
        await this.saveSyncQueue()
        
        console.log(`📤 Queued for sync: ${tableName} ${operation}`)
        
        // Try to sync immediately if online
        if (this.isOnline) {
            setTimeout(() => this.syncPendingChanges(), 100)
        }
    }

    async saveSyncQueue() {
        if (!this.db) return

        try {
            const tx = this.db.transaction(['sync_queue'], 'readwrite')
            const store = tx.objectStore('sync_queue')
            
            // Clear existing queue for this user
            const index = store.index('user_id')
            const request = index.openCursor(this.currentUserId)
            
            await new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result
                    if (cursor) {
                        cursor.delete()
                        cursor.continue()
                    } else {
                        resolve()
                    }
                }
            })
            
            // Save current queue
            for (const item of this.syncQueue) {
                if (item.user_id === this.currentUserId) {
                    await store.put(item)
                }
            }
        } catch (error) {
            console.error('Error saving sync queue:', error)
        }
    }

    async loadSyncQueue() {
        if (!this.db || !this.currentUserId) return

        try {
            const tx = this.db.transaction(['sync_queue'], 'readonly')
            const store = tx.objectStore('sync_queue')
            const index = store.index('user_id')
            const request = index.getAll(this.currentUserId)
            
            const result = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            this.syncQueue = result || []
            console.log(`📥 Loaded ${this.syncQueue.length} items in sync queue`)
        } catch (error) {
            console.error('Error loading sync queue:', error)
            this.syncQueue = []
        }
    }

    async syncPendingChanges() {
        if (!this.isOnline || this.syncQueue.length === 0) return

        console.log('🔄 Starting sync of pending changes...')
        const failedItems = []

        for (const item of this.syncQueue) {
            if (item.user_id !== this.currentUserId) continue
            
            try {
                let success = false
                
                if (item.operation === 'upsert') {
                    success = await this.syncUpsert(item.table_name, item.data)
                } else if (item.operation === 'delete') {
                    success = await this.syncDelete(item.table_name, item.data.id)
                }

                if (!success) {
                    item.attempts++
                    if (item.attempts < item.max_attempts) {
                        failedItems.push(item)
                    }
                }
            } catch (error) {
                console.error('Sync error:', error)
                item.attempts++
                if (item.attempts < item.max_attempts) {
                    failedItems.push(item)
                }
            }
        }

        this.syncQueue = failedItems
        await this.saveSyncQueue()
        
        console.log(`✅ Sync completed. ${failedItems.length} items remaining in queue`)
    }

    async syncUpsert(tableName, data) {
        try {
            const { error } = await supabase
                .from(tableName)
                .upsert(data)

            if (error) throw error
            
            // Update local record to mark as synced
            if (data.offline_created) {
                data.offline_created = false
                await this.saveData(tableName, data, true) // Skip adding to sync queue
            }
            
            return true
        } catch (error) {
            console.error(`Sync error for ${tableName}:`, error)
            return false
        }
    }

    async syncDelete(tableName, id) {
        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error(`Sync delete error for ${tableName}:`, error)
            return false
        }
    }

    // User-specific operations
    async clearUserData(userId = null) {
        const targetUserId = userId || this.currentUserId
        if (!targetUserId || !this.db) return

        console.log('🧹 Clearing offline data for user:', targetUserId)

        const tables = [
            'users', 'tasks', 'feelings', 'journal_entries', 
            'kid_mode_settings', 'studentvue_credentials', 
            'canvas_credentials', 'music_connections', 'ai_notes',
            'sync_queue', 'user_metadata'
        ]

        try {
            for (const tableName of tables) {
                const tx = this.db.transaction([tableName], 'readwrite')
                const store = tx.objectStore(tableName)
                const index = store.index('user_id')
                const request = index.openCursor(targetUserId)
                
                await new Promise((resolve) => {
                    request.onsuccess = (event) => {
                        const cursor = event.target.result
                        if (cursor) {
                            cursor.delete()
                            cursor.continue()
                        } else {
                            resolve()
                        }
                    }
                })
            }
            
            // Clear sync queue for this user
            this.syncQueue = this.syncQueue.filter(item => item.user_id !== targetUserId)
            
            console.log('✅ User data cleared successfully')
        } catch (error) {
            console.error('Error clearing user data:', error)
        }
    }

    async switchUser(newUserId) {
        console.log('🔄 Switching user from', this.currentUserId, 'to', newUserId)
        
        // Save current sync queue before switching
        if (this.currentUserId) {
            await this.saveSyncQueue()
        }
        
        // Switch to new user
        this.currentUserId = newUserId
        await this.loadSyncQueue()
        
        console.log('✅ User switched successfully')
    }

    getStorageInfo() {
        return {
            isOnline: this.isOnline,
            currentUserId: this.currentUserId,
            syncQueueLength: this.syncQueue.filter(item => item.user_id === this.currentUserId).length,
            dbConnected: !!this.db
        }
    }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage()

// Convenience functions for common operations
export const offlineDB = {
    // Initialize offline storage
    async init(userId) {
        return await offlineStorage.init(userId)
    },

    // Tasks
    async getTasks() {
        return await offlineStorage.getData('tasks', {
            orderBy: { column: 'due_date', ascending: true }
        })
    },

    async saveTask(task) {
        return await offlineStorage.saveData('tasks', task)
    },

    async deleteTask(taskId) {
        return await offlineStorage.deleteData('tasks', taskId)
    },

    // Journal Entries
    async getJournalEntries() {
        return await offlineStorage.getData('journal_entries', {
            orderBy: { column: 'created_at', ascending: false }
        })
    },

    async saveJournalEntry(entry) {
        return await offlineStorage.saveData('journal_entries', entry)
    },

    async deleteJournalEntry(entryId) {
        return await offlineStorage.deleteData('journal_entries', entryId)
    },

    // Feelings
    async getFeelings() {
        return await offlineStorage.getData('feelings', {
            orderBy: { column: 'created_at', ascending: false }
        })
    },

    async saveFeeling(feeling) {
        return await offlineStorage.saveData('feelings', feeling)
    },

    // Kid Mode Settings
    async getKidModeSettings() {
        const settings = await offlineStorage.getData('kid_mode_settings')
        return settings[0] || null
    },

    async saveKidModeSettings(settings) {
        return await offlineStorage.saveData('kid_mode_settings', settings)
    },

    // AI Notes
    async getAINotes() {
        return await offlineStorage.getData('ai_notes', {
            orderBy: { column: 'created_at', ascending: false }
        })
    },

    async saveAINote(note) {
        return await offlineStorage.saveData('ai_notes', note)
    },

    async deleteAINote(noteId) {
        return await offlineStorage.deleteData('ai_notes', noteId)
    },

    // User management
    async clearCurrentUserData() {
        return await offlineStorage.clearUserData()
    },

    async switchUser(userId) {
        return await offlineStorage.switchUser(userId)
    },

    // Sync operations
    async syncToServer() {
        return await offlineStorage.syncPendingChanges()
    },

    getStatus() {
        return offlineStorage.getStorageInfo()
    }
} 