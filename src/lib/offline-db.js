import { auth, supabase } from './supabase.js'
import { offlineDB } from '../utils/offline-storage.js'

// Enhanced database utility that works online and offline
export const db = {
    isOnline: navigator.onLine,

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true
            console.log('📶 Back online - syncing data...')
            this.syncOfflineData()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            console.log('📱 Offline mode activated')
        })
    },

    async initUser(userId) {
        // 🔒 SECURITY: Get session token for secure initialization
        let sessionToken = null
        try {
            const { data: { session } } = await auth.getSession()
            sessionToken = session?.access_token
        } catch (error) {
            console.warn('Failed to get session token:', error)
        }

        await offlineDB.init(userId, sessionToken)

        // Sync data from server if online
        if (this.isOnline) {
            await this.syncFromServer()
        }
    },

    async syncOfflineData() {
        await offlineDB.syncToServer()
    },

    async syncFromServer() {
        if (!this.isOnline) return

        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            console.log('📥 Syncing data from server...')

            // Sync all tables
            const tables = ['tasks', 'feelings', 'journal_entries', 'kid_mode_settings', 'ai_notes']

            for (const table of tables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false })

                    if (error) throw error

                    if (data && data.length > 0) {
                        for (const record of data) {
                            // Save to offline storage without triggering sync
                            await offlineDB.saveData?.(table, record)
                        }
                        console.log(`📥 Synced ${data.length} ${table} records`)
                    }
                } catch (error) {
                    console.error(`Error syncing ${table}:`, error)
                }
            }
        } catch (error) {
            console.error('Error syncing from server:', error)
        }
    },

    // Tasks
    async createTask(taskData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const task = {
                ...taskData,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            if (this.isOnline) {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert(task)
                    .select()
                    .single()

                if (error) throw error

                // Also save offline for caching
                await offlineDB.saveTask(data)
                return { data, error: null }
            } else {
                // Save offline only
                const savedTask = await offlineDB.saveTask(task)
                return { data: savedTask, error: null }
            }
        } catch (error) {
            console.error('Error creating task:', error)
            return { data: null, error }
        }
    },

    async getTasks() {
        try {
            if (this.isOnline) {
                const { data: { user } } = await auth.getCurrentUser()
                if (!user) throw new Error('User not authenticated')

                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('due_date', { ascending: true })

                if (error) throw error

                // Cache offline
                for (const task of data || []) {
                    await offlineDB.saveTask(task)
                }

                return { data: data || [], error: null }
            } else {
                // Get from offline storage
                const data = await offlineDB.getTasks()
                return { data, error: null }
            }
        } catch (error) {
            console.error('Error getting tasks:', error)
            // Fallback to offline data
            const data = await offlineDB.getTasks()
            return { data, error }
        }
    },

    async updateTask(taskId, updates) {
        try {
            const updatedData = {
                ...updates,
                updated_at: new Date().toISOString()
            }

            if (this.isOnline) {
                const { data, error } = await supabase
                    .from('tasks')
                    .update(updatedData)
                    .eq('id', taskId)
                    .select()

                if (error) throw error

                // Update offline cache
                if (data && data[0]) {
                    await offlineDB.saveTask(data[0])
                }

                return { data, error: null }
            } else {
                // Get current task from offline storage
                const tasks = await offlineDB.getTasks()
                const currentTask = tasks.find(t => t.id === taskId)

                if (!currentTask) {
                    throw new Error('Task not found')
                }

                const updatedTask = { ...currentTask, ...updatedData }
                await offlineDB.saveTask(updatedTask)

                return { data: [updatedTask], error: null }
            }
        } catch (error) {
            console.error('Error updating task:', error)
            return { data: null, error }
        }
    },

    async deleteTask(taskId) {
        try {
            if (this.isOnline) {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId)

                if (error) throw error
            }

            // Delete from offline storage
            await offlineDB.deleteTask(taskId)

            return { error: null }
        } catch (error) {
            console.error('Error deleting task:', error)
            return { error }
        }
    },

    // Feelings
    async createFeeling(feelingData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const feeling = {
                ...feelingData,
                user_id: user.id,
                created_at: feelingData.created_at || new Date().toISOString()
            }

            if (this.isOnline) {
                const { data, error } = await supabase
                    .from('feelings')
                    .insert(feeling)
                    .select()
                    .single()

                if (error) throw error

                await offlineDB.saveFeeling(data)
                return { data, error: null }
            } else {
                const savedFeeling = await offlineDB.saveFeeling(feeling)
                return { data: savedFeeling, error: null }
            }
        } catch (error) {
            console.error('Error creating feeling:', error)
            return { data: null, error }
        }
    },

    async getFeelings() {
        try {
            if (this.isOnline) {
                const { data: { user } } = await auth.getCurrentUser()
                if (!user) throw new Error('User not authenticated')

                const { data, error } = await supabase
                    .from('feelings')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error

                // Cache offline
                for (const feeling of data || []) {
                    await offlineDB.saveFeeling(feeling)
                }

                return { data: data || [], error: null }
            } else {
                const data = await offlineDB.getFeelings()
                return { data, error: null }
            }
        } catch (error) {
            console.error('Error getting feelings:', error)
            const data = await offlineDB.getFeelings()
            return { data, error }
        }
    },

    // Journal Entries
    async addJournalEntry(content) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const entry = {
                user_id: user.id,
                content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            if (this.isOnline) {
                const { data, error } = await supabase
                    .from('journal_entries')
                    .insert(entry)
                    .select()
                    .single()

                if (error) throw error

                await offlineDB.saveJournalEntry(data)
                return { data, error: null }
            } else {
                const savedEntry = await offlineDB.saveJournalEntry(entry)
                return { data: savedEntry, error: null }
            }
        } catch (error) {
            console.error('Error adding journal entry:', error)
            return { data: null, error }
        }
    },

    async getJournalEntries() {
        try {
            if (this.isOnline) {
                const { data: { user } } = await auth.getCurrentUser()
                if (!user) throw new Error('User not authenticated')

                const { data, error } = await supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error

                // Cache offline
                for (const entry of data || []) {
                    await offlineDB.saveJournalEntry(entry)
                }

                return { data: data || [], error: null }
            } else {
                const data = await offlineDB.getJournalEntries()
                return { data, error: null }
            }
        } catch (error) {
            console.error('Error getting journal entries:', error)
            const data = await offlineDB.getJournalEntries()
            return { data, error }
        }
    },

    async deleteJournalEntry(entryId) {
        try {
            if (this.isOnline) {
                const { error } = await supabase
                    .from('journal_entries')
                    .delete()
                    .eq('id', entryId)

                if (error) throw error
            }

            await offlineDB.deleteJournalEntry(entryId)
            return { error: null }
        } catch (error) {
            console.error('Error deleting journal entry:', error)
            return { error }
        }
    },

    // User management
    async ensureUser() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            if (this.isOnline) {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (!existingUser) {
                    const { error } = await supabase
                        .from('users')
                        .insert({
                            id: user.id,
                            email: user.email,
                            name: user.user_metadata?.name || 'User',
                            created_at: new Date().toISOString()
                        })

                    if (error) throw error
                }
            }

            // Initialize offline storage for this user
            await this.initUser(user.id)

            return { data: user, error: null }
        } catch (error) {
            console.error('Error ensuring user:', error)
            return { data: null, error }
        }
    },

    // Clear user data on logout
    async clearUserData() {
        await offlineDB.clearCurrentUserData()
    },

    // Switch user (for multi-account support)
    async switchUser(userId) {
        await offlineDB.switchUser(userId)
        await this.initUser(userId)
    },

    // Demo data (works offline too)
    async populateDemoData() {
        const demoTasks = [
            {
                title: "Complete math homework",
                description: "Chapter 5 exercises",
                due_date: new Date().toISOString().split('T')[0],
                due_time: "18:00",
                stress_level: 3,
                priority: "medium"
            },
            {
                title: "Science project research",
                description: "Find sources for volcano project",
                due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                due_time: "15:00",
                stress_level: 4,
                priority: "high"
            }
        ]

        for (const task of demoTasks) {
            await this.createTask(task)
        }

        // Demo journal entry
        await this.addJournalEntry("Started using BusyBob today! Excited to stay organized.")

        // Demo feeling
        await this.createFeeling({ rating: 4 })
    },

    // Get status
    getStatus() {
        return {
            isOnline: this.isOnline,
            offlineStatus: offlineDB.getStatus()
        }
    }
}

// Initialize database
db.init()