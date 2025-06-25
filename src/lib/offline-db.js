import { auth, supabase } from './supabase.js'

// Simplified database utility that works with Supabase directly
export const db = {
    isOnline: navigator.onLine,
    isInitialized: false,

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true
            console.log('📶 Back online')
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            console.log('📱 Offline mode activated')
        })

        this.isInitialized = true
        console.log('💾 Database utility initialized')
    },

    async initUser(userId) {
        try {
            console.log('🔧 Initializing user in database...', { userId })
            
            // Verify user authentication
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                throw new Error('User not authenticated')
            }
            
            console.log('✅ User initialization completed successfully')
            return user
        } catch (error) {
            console.error('❌ Error initializing user:', error)
            throw error
        }
    },

    // Tasks
    async createTask(taskData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for task creation')
                return { data: null, error: new Error('User not authenticated') }
            }

            const task = {
                ...taskData,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            console.log('📝 Creating task:', task)

            const { data, error } = await supabase
                .from('tasks')
                .insert(task)
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error creating task:', error)
                throw error
            }

            console.log('✅ Task created successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error creating task:', error)
            return { data: null, error }
        }
    },

    async getTasks() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for getting tasks')
                return { data: [], error: new Error('User not authenticated') }
            }

            console.log('📋 Getting tasks for user:', user.id)

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('due_date', { ascending: true })

            if (error) {
                console.error('❌ Supabase error getting tasks:', error)
                throw error
            }

            console.log('✅ Retrieved tasks:', data?.length || 0)
            return { data: data || [], error: null }
        } catch (error) {
            console.error('❌ Error getting tasks:', error)
            return { data: [], error }
        }
    },

    async updateTask(taskId, updates) {
        try {
            const updatedData = {
                ...updates,
                updated_at: new Date().toISOString()
            }

            console.log('🔄 Updating task:', taskId, updatedData)

            const { data, error } = await supabase
                .from('tasks')
                .update(updatedData)
                .eq('id', taskId)
                .select()

            if (error) {
                console.error('❌ Supabase error updating task:', error)
                throw error
            }

            console.log('✅ Task updated successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error updating task:', error)
            return { data: null, error }
        }
    },

    async deleteTask(taskId) {
        try {
            console.log('🗑️ Deleting task:', taskId)

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) {
                console.error('❌ Supabase error deleting task:', error)
                throw error
            }

            console.log('✅ Task deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting task:', error)
            return { error }
        }
    },

    // Feelings/Mood
    async createFeeling(feelingData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for feeling creation')
                return { data: null, error: new Error('User not authenticated') }
            }

            const feeling = {
                ...feelingData,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            console.log('😊 Creating feeling:', feeling)

            const { data, error } = await supabase
                .from('feelings')
                .insert(feeling)
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error creating feeling:', error)
                throw error
            }

            console.log('✅ Feeling created successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error creating feeling:', error)
            return { data: null, error }
        }
    },

    async getFeelings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for getting feelings')
                return { data: [], error: new Error('User not authenticated') }
            }

            console.log('😊 Getting feelings for user:', user.id)

            const { data, error } = await supabase
                .from('feelings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('❌ Supabase error getting feelings:', error)
                throw error
            }

            console.log('✅ Retrieved feelings:', data?.length || 0)
            return { data: data || [], error: null }
        } catch (error) {
            console.error('❌ Error getting feelings:', error)
            return { data: [], error }
        }
    },

    // Journal Entries
    async addJournalEntry(content) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for journal entry')
                return { data: null, error: new Error('User not authenticated') }
            }

            const entry = {
                content,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            console.log('📔 Adding journal entry:', entry)

            const { data, error } = await supabase
                .from('journal_entries')
                .insert(entry)
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error adding journal entry:', error)
                throw error
            }

            console.log('✅ Journal entry added successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error adding journal entry:', error)
            return { data: null, error }
        }
    },

    async getJournalEntries() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for getting journal entries')
                return { data: [], error: new Error('User not authenticated') }
            }

            console.log('📔 Getting journal entries for user:', user.id)

            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('❌ Supabase error getting journal entries:', error)
                throw error
            }

            console.log('✅ Retrieved journal entries:', data?.length || 0)
            return { data: data || [], error: null }
        } catch (error) {
            console.error('❌ Error getting journal entries:', error)
            return { data: [], error }
        }
    },

    async deleteJournalEntry(entryId) {
        try {
            console.log('🗑️ Deleting journal entry:', entryId)

            const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', entryId)

            if (error) {
                console.error('❌ Supabase error deleting journal entry:', error)
                throw error
            }

            console.log('✅ Journal entry deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting journal entry:', error)
            return { error }
        }
    },

    // AI Notes
    async createAINote(noteData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for AI note creation')
                return { data: null, error: new Error('User not authenticated') }
            }

            const note = {
                ...noteData,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            console.log('🤖 Creating AI note:', note)

            const { data, error } = await supabase
                .from('ai_notes')
                .insert(note)
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error creating AI note:', error)
                throw error
            }

            console.log('✅ AI note created successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error creating AI note:', error)
            return { data: null, error }
        }
    },

    async getAINotes() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for getting AI notes')
                return { data: [], error: new Error('User not authenticated') }
            }

            console.log('🤖 Getting AI notes for user:', user.id)

            const { data, error } = await supabase
                .from('ai_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('❌ Supabase error getting AI notes:', error)
                throw error
            }

            console.log('✅ Retrieved AI notes:', data?.length || 0)
            return { data: data || [], error: null }
        } catch (error) {
            console.error('❌ Error getting AI notes:', error)
            return { data: [], error }
        }
    },

    async deleteAINote(noteId) {
        try {
            console.log('🗑️ Deleting AI note:', noteId)

            const { error } = await supabase
                .from('ai_notes')
                .delete()
                .eq('id', noteId)

            if (error) {
                console.error('❌ Supabase error deleting AI note:', error)
                throw error
            }

            console.log('✅ AI note deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting AI note:', error)
            return { error }
        }
    },

    // Kid Mode Settings
    async getKidModeSettings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for kid mode settings')
                return { data: null, error: new Error('User not authenticated') }
            }

            console.log('🛡️ Getting kid mode settings for user:', user.id)

            const { data, error } = await supabase
                .from('kid_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Supabase error getting kid mode settings:', error)
                throw error
            }

            console.log('✅ Retrieved kid mode settings:', data)
            return { data: data || null, error: null }
        } catch (error) {
            console.error('❌ Error getting kid mode settings:', error)
            return { data: null, error }
        }
    },

    async updateKidModeSettings(settings) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for updating kid mode settings')
                return { data: null, error: new Error('User not authenticated') }
            }

            console.log('🛡️ Updating kid mode settings for user:', user.id, settings)

            const { data, error } = await supabase
                .from('kid_mode_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error updating kid mode settings:', error)
                throw error
            }

            console.log('✅ Kid mode settings updated successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error updating kid mode settings:', error)
            return { data: null, error }
        }
    },

    // Music Connections
    async getMusicConnections() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for music connections')
                return { data: null, error: new Error('User not authenticated') }
            }

            console.log('🎵 Getting music connections for user:', user.id)

            const { data, error } = await supabase
                .from('music_connections')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Supabase error getting music connections:', error)
                throw error
            }

            console.log('✅ Retrieved music connections:', data)
            return { data: data || null, error: null }
        } catch (error) {
            console.error('❌ Error getting music connections:', error)
            return { data: null, error }
        }
    },

    async updateMusicConnections(connections) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for updating music connections')
                return { data: null, error: new Error('User not authenticated') }
            }

            console.log('🎵 Updating music connections for user:', user.id, connections)

            const { data, error } = await supabase
                .from('music_connections')
                .upsert({
                    user_id: user.id,
                    ...connections,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error updating music connections:', error)
                throw error
            }

            console.log('✅ Music connections updated successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error updating music connections:', error)
            return { data: null, error }
        }
    },

    // Utility functions
    async ensureUser() {
        try {
            console.log('🔍 Ensuring user is authenticated...')
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found')
                throw new Error('User not authenticated')
            }
            console.log('✅ User is authenticated:', user.id)
            return user
        } catch (error) {
            console.error('❌ Error ensuring user:', error)
            throw error
        }
    },

    async clearUserData() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.log('ℹ️ No user to clear data for')
                return
            }

            console.log('🧹 Clearing data for user:', user.id)

            // Clear all user data
            const tables = ['tasks', 'feelings', 'journal_entries', 'ai_notes', 'kid_mode_settings', 'music_connections']
            
            for (const table of tables) {
                try {
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .eq('user_id', user.id)
                    
                    if (error) {
                        console.warn(`⚠️ Error clearing ${table}:`, error)
                    } else {
                        console.log(`✅ Cleared ${table}`)
                    }
                } catch (tableError) {
                    console.warn(`⚠️ Failed to clear ${table}:`, tableError)
                }
            }

            console.log('✅ User data cleared successfully')
        } catch (error) {
            console.error('❌ Error clearing user data:', error)
        }
    },

    async switchUser(userId) {
        try {
            console.log('🔄 Switching to user:', userId)
            await this.clearUserData()
            await this.initUser(userId)
            console.log('✅ User switch completed')
        } catch (error) {
            console.error('❌ Error switching user:', error)
            throw error
        }
    },

    async populateDemoData() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for demo data')
                return
            }

            console.log('🎯 Populating demo data for user:', user.id)

            // Demo tasks
            const demoTasks = [
                {
                    title: 'Complete Math Homework',
                    description: 'Finish algebra problems 1-20',
                    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'high',
                    status: 'pending'
                },
                {
                    title: 'Read Chapter 5',
                    description: 'Science textbook chapter on ecosystems',
                    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'medium',
                    status: 'pending'
                }
            ]

            for (const task of demoTasks) {
                const result = await this.createTask(task)
                if (result.error) {
                    console.warn('⚠️ Failed to create demo task:', result.error)
                }
            }

            // Demo feelings
            const demoFeelings = [
                { rating: 4, notes: 'Had a great day at school!' },
                { rating: 3, notes: 'Working on homework' }
            ]

            for (const feeling of demoFeelings) {
                const result = await this.createFeeling(feeling)
                if (result.error) {
                    console.warn('⚠️ Failed to create demo feeling:', result.error)
                }
            }

            console.log('✅ Demo data populated successfully')
        } catch (error) {
            console.error('❌ Error populating demo data:', error)
        }
    },

    getStatus() {
        return {
            online: this.isOnline,
            initialized: this.isInitialized,
            authenticated: !!auth.getCurrentUser(),
            timestamp: new Date().toISOString()
        }
    },

    // Global test functions for debugging
    async testDatabaseConnection() {
        try {
            console.log('🧪 Testing database connection...')
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.log('❌ No authenticated user')
                return false
            }
            
            // Test a simple query
            const { data, error } = await supabase
                .from('tasks')
                .select('count')
                .eq('user_id', user.id)
                .limit(1)
            
            if (error) {
                console.log('❌ Database connection failed:', error)
                return false
            }
            
            console.log('✅ Database connection successful')
            return true
        } catch (error) {
            console.log('❌ Database test failed:', error)
            return false
        }
    },

    async testAllOperations() {
        try {
            console.log('🧪 Testing all database operations...')
            
            // Test user authentication
            const user = await this.ensureUser()
            console.log('✅ User authentication:', user.id)
            
            // Test task operations
            const taskResult = await this.createTask({
                title: 'Test Task',
                description: 'Testing database operations',
                due_date: new Date().toISOString(),
                priority: 'low',
                status: 'pending'
            })
            console.log('✅ Task creation:', taskResult.error ? 'FAILED' : 'SUCCESS')
            
            if (taskResult.data) {
                await this.updateTask(taskResult.data.id, { status: 'completed' })
                console.log('✅ Task update: SUCCESS')
                
                await this.deleteTask(taskResult.data.id)
                console.log('✅ Task deletion: SUCCESS')
            }
            
            // Test feeling operations
            const feelingResult = await this.createFeeling({ rating: 4 })
            console.log('✅ Feeling creation:', feelingResult.error ? 'FAILED' : 'SUCCESS')
            
            if (feelingResult.data) {
                await this.deleteTask(feelingResult.data.id)
                console.log('✅ Feeling deletion: SUCCESS')
            }
            
            console.log('✅ All database operations tested successfully')
            return true
        } catch (error) {
            console.error('❌ Database operations test failed:', error)
            return false
        }
    }
}

// Initialize database
db.init()

// Expose for global debugging
window.testDatabase = db.testDatabaseConnection
window.testAllOperations = db.testAllOperations
window.dbStatus = db.getStatus