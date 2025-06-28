import { auth, supabase } from './supabase.js'

// Enhanced database utility with offline support, caching, and better error handling
export const db = {
    isOnline: navigator.onLine,
    isInitialized: false,
    cache: new Map(),
    retryAttempts: 3,
    retryDelay: 1000,

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true
            console.log('📶 Back online - syncing data...')
            this.syncOfflineData()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            console.log('📱 Offline mode activated - using cached data')
        })

        // Initialize cache with TTL
        this.cache = new Map()
        this.isInitialized = true
        console.log('💾 Enhanced database utility initialized with caching')
    },

    // Cache management
    setCache(key, data, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        })
    },

    getCache(key) {
        const cached = this.cache.get(key)
        if (!cached) return null
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key)
            return null
        }
        
        return cached.data
    },

    clearCache() {
        this.cache.clear()
        console.log('🧹 Cache cleared')
    },

    // Retry mechanism for failed operations
    async retryOperation(operation, maxAttempts = this.retryAttempts) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation()
            } catch (error) {
                console.warn(`⚠️ Operation failed (attempt ${attempt}/${maxAttempts}):`, error)
                
                if (attempt === maxAttempts) {
                    throw error
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
            }
        }
    },

    // Sync offline data when back online
    async syncOfflineData() {
        try {
            console.log('🔄 Syncing offline data...')
            const offlineData = this.getCache('offline_operations') || []
            
            if (offlineData.length === 0) {
                console.log('✅ No offline data to sync')
                return
            }

            for (const operation of offlineData) {
                try {
                    await this.executeOfflineOperation(operation)
                } catch (error) {
                    console.error('❌ Failed to sync operation:', operation, error)
                }
            }

            // Clear offline operations after successful sync
            this.cache.delete('offline_operations')
            console.log('✅ Offline data sync completed')
        } catch (error) {
            console.error('❌ Error syncing offline data:', error)
        }
    },

    // Execute offline operation
    async executeOfflineOperation(operation) {
        const { type, table, data, id } = operation
        
        switch (type) {
            case 'create':
                await supabase.from(table).insert(data)
                break
            case 'update':
                await supabase.from(table).update(data).eq('id', id)
                break
            case 'delete':
                await supabase.from(table).delete().eq('id', id)
                break
            default:
                console.warn('⚠️ Unknown operation type:', type)
        }
    },

    // Store operation for offline sync
    storeOfflineOperation(operation) {
        const offlineData = this.getCache('offline_operations') || []
        offlineData.push(operation)
        this.setCache('offline_operations', offlineData, 24 * 60 * 60 * 1000) // 24 hours
    },

    async initUser(userId) {
        try {
            console.log('🔧 Initializing user in database...', { userId })
            
            // Verify user authentication
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                throw new Error('User not authenticated')
            }
            
            // Clear cache for new user
            this.clearCache()
            
            console.log('✅ User initialization completed successfully')
            return user
        } catch (error) {
            console.error('❌ Error initializing user:', error)
            throw error
        }
    },

    // Enhanced Tasks with caching and offline support
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

            if (!this.isOnline) {
                // Store for offline sync
                this.storeOfflineOperation({
                    type: 'create',
                    table: 'tasks',
                    data: task
                })
                
                // Add to local cache
                const cachedTasks = this.getCache('tasks') || []
                const tempTask = { ...task, id: `temp_${Date.now()}` }
                cachedTasks.push(tempTask)
                this.setCache('tasks', cachedTasks)
                
                console.log('📱 Task stored for offline sync')
                return { data: tempTask, error: null }
            }

            const { data, error } = await this.retryOperation(() => 
                supabase.from('tasks').insert(task).select().single()
            )

            if (error) {
                console.error('❌ Supabase error creating task:', error)
                throw error
            }

            // Update cache
            const cachedTasks = this.getCache('tasks') || []
            cachedTasks.push(data)
            this.setCache('tasks', cachedTasks)

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

            // Check cache first
            const cachedTasks = this.getCache('tasks')
            if (cachedTasks && !this.isOnline) {
                console.log('📱 Returning cached tasks (offline mode)')
                return { data: cachedTasks, error: null }
            }

            console.log('📋 Getting tasks for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('due_date', { ascending: true })
            )

            if (error) {
                console.error('❌ Supabase error getting tasks:', error)
                throw error
            }

            // Update cache
            this.setCache('tasks', data || [])

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

            if (!this.isOnline) {
                // Store for offline sync
                this.storeOfflineOperation({
                    type: 'update',
                    table: 'tasks',
                    data: updatedData,
                    id: taskId
                })
                
                // Update local cache
                const cachedTasks = this.getCache('tasks') || []
                const taskIndex = cachedTasks.findIndex(t => t.id === taskId)
                if (taskIndex !== -1) {
                    cachedTasks[taskIndex] = { ...cachedTasks[taskIndex], ...updatedData }
                    this.setCache('tasks', cachedTasks)
                }
                
                console.log('📱 Task update stored for offline sync')
                return { data: cachedTasks[taskIndex], error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('tasks')
                    .update(updatedData)
                    .eq('id', taskId)
                    .select()
            )

            if (error) {
                console.error('❌ Supabase error updating task:', error)
                throw error
            }

            // Update cache
            const cachedTasks = this.getCache('tasks') || []
            const taskIndex = cachedTasks.findIndex(t => t.id === taskId)
            if (taskIndex !== -1) {
                cachedTasks[taskIndex] = data[0]
                this.setCache('tasks', cachedTasks)
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

            if (!this.isOnline) {
                // Store for offline sync
                this.storeOfflineOperation({
                    type: 'delete',
                    table: 'tasks',
                    id: taskId
                })
                
                // Remove from local cache
                const cachedTasks = this.getCache('tasks') || []
                const filteredTasks = cachedTasks.filter(t => t.id !== taskId)
                this.setCache('tasks', filteredTasks)
                
                console.log('📱 Task deletion stored for offline sync')
                return { error: null }
            }

            const { error } = await this.retryOperation(() =>
                supabase.from('tasks').delete().eq('id', taskId)
            )

            if (error) {
                console.error('❌ Supabase error deleting task:', error)
                throw error
            }

            // Remove from cache
            const cachedTasks = this.getCache('tasks') || []
            const filteredTasks = cachedTasks.filter(t => t.id !== taskId)
            this.setCache('tasks', filteredTasks)

            console.log('✅ Task deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting task:', error)
            return { error }
        }
    },

    // Enhanced Feelings/Mood with caching
    async createFeeling(feelingData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for creating feeling')
                return { data: null, error: new Error('User not authenticated') }
            }

            const feeling = {
                ...feelingData,
                user_id: user.id,
                created_at: new Date().toISOString(),
            }

            console.log('😊 Creating feeling:', feeling)

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'create',
                    table: 'feelings',
                    data: feeling
                })
                
                const cachedFeelings = this.getCache('feelings') || []
                const tempFeeling = { ...feeling, id: `temp_${Date.now()}` }
                cachedFeelings.push(tempFeeling)
                this.setCache('feelings', cachedFeelings)
                
                console.log('📱 Feeling stored for offline sync')
                return { data: tempFeeling, error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase.from('feelings').insert(feeling).select().single()
            )

            if (error) {
                console.error('❌ Supabase error creating feeling:', error)
                throw error
            }

            // Update cache
            const cachedFeelings = this.getCache('feelings') || []
            cachedFeelings.push(data)
            this.setCache('feelings', cachedFeelings)

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

            // Check cache first
            const cachedFeelings = this.getCache('feelings')
            if (cachedFeelings && !this.isOnline) {
                console.log('📱 Returning cached feelings (offline mode)')
                return { data: cachedFeelings, error: null }
            }

            console.log('😊 Getting feelings for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('feelings')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            )

            if (error) {
                console.error('❌ Supabase error getting feelings:', error)
                throw error
            }

            // Update cache
            this.setCache('feelings', data || [])

            console.log('✅ Retrieved feelings:', data?.length || 0)
            return { data: data || [], error: null }
        } catch (error) {
            console.error('❌ Error getting feelings:', error)
            return { data: [], error }
        }
    },

    // Enhanced Journal Entries
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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'create',
                    table: 'journal_entries',
                    data: entry
                })
                
                const cachedEntries = this.getCache('journal_entries') || []
                const tempEntry = { ...entry, id: `temp_${Date.now()}` }
                cachedEntries.push(tempEntry)
                this.setCache('journal_entries', cachedEntries)
                
                console.log('📱 Journal entry stored for offline sync')
                return { data: tempEntry, error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase.from('journal_entries').insert(entry).select().single()
            )

            if (error) {
                console.error('❌ Supabase error adding journal entry:', error)
                throw error
            }

            // Update cache
            const cachedEntries = this.getCache('journal_entries') || []
            cachedEntries.push(data)
            this.setCache('journal_entries', cachedEntries)

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

            // Check cache first
            const cachedEntries = this.getCache('journal_entries')
            if (cachedEntries && !this.isOnline) {
                console.log('📱 Returning cached journal entries (offline mode)')
                return { data: cachedEntries, error: null }
            }

            console.log('📔 Getting journal entries for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            )

            if (error) {
                console.error('❌ Supabase error getting journal entries:', error)
                throw error
            }

            // Update cache
            this.setCache('journal_entries', data || [])

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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'delete',
                    table: 'journal_entries',
                    id: entryId
                })
                
                const cachedEntries = this.getCache('journal_entries') || []
                const filteredEntries = cachedEntries.filter(e => e.id !== entryId)
                this.setCache('journal_entries', filteredEntries)
                
                console.log('📱 Journal entry deletion stored for offline sync')
                return { error: null }
            }

            const { error } = await this.retryOperation(() =>
                supabase.from('journal_entries').delete().eq('id', entryId)
            )

            if (error) {
                console.error('❌ Supabase error deleting journal entry:', error)
                throw error
            }

            // Remove from cache
            const cachedEntries = this.getCache('journal_entries') || []
            const filteredEntries = cachedEntries.filter(e => e.id !== entryId)
            this.setCache('journal_entries', filteredEntries)

            console.log('✅ Journal entry deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting journal entry:', error)
            return { error }
        }
    },

    // Enhanced AI Notes
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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'create',
                    table: 'ai_notes',
                    data: note
                })
                
                const cachedNotes = this.getCache('ai_notes') || []
                const tempNote = { ...note, id: `temp_${Date.now()}` }
                cachedNotes.push(tempNote)
                this.setCache('ai_notes', cachedNotes)
                
                console.log('📱 AI note stored for offline sync')
                return { data: tempNote, error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase.from('ai_notes').insert(note).select().single()
            )

            if (error) {
                console.error('❌ Supabase error creating AI note:', error)
                throw error
            }

            // Update cache
            const cachedNotes = this.getCache('ai_notes') || []
            cachedNotes.push(data)
            this.setCache('ai_notes', cachedNotes)

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

            // Check cache first
            const cachedNotes = this.getCache('ai_notes')
            if (cachedNotes && !this.isOnline) {
                console.log('📱 Returning cached AI notes (offline mode)')
                return { data: cachedNotes, error: null }
            }

            console.log('🤖 Getting AI notes for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('ai_notes')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            )

            if (error) {
                console.error('❌ Supabase error getting AI notes:', error)
                throw error
            }

            // Update cache
            this.setCache('ai_notes', data || [])

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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'delete',
                    table: 'ai_notes',
                    id: noteId
                })
                
                const cachedNotes = this.getCache('ai_notes') || []
                const filteredNotes = cachedNotes.filter(n => n.id !== noteId)
                this.setCache('ai_notes', filteredNotes)
                
                console.log('📱 AI note deletion stored for offline sync')
                return { error: null }
            }

            const { error } = await this.retryOperation(() =>
                supabase.from('ai_notes').delete().eq('id', noteId)
            )

            if (error) {
                console.error('❌ Supabase error deleting AI note:', error)
                throw error
            }

            // Remove from cache
            const cachedNotes = this.getCache('ai_notes') || []
            const filteredNotes = cachedNotes.filter(n => n.id !== noteId)
            this.setCache('ai_notes', filteredNotes)

            console.log('✅ AI note deleted successfully')
            return { error: null }
        } catch (error) {
            console.error('❌ Error deleting AI note:', error)
            return { error }
        }
    },

    // Enhanced Kid Mode Settings
    async getKidModeSettings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for kid mode settings')
                return { data: null, error: new Error('User not authenticated') }
            }

            // Check cache first
            const cachedSettings = this.getCache('kid_mode_settings')
            if (cachedSettings && !this.isOnline) {
                console.log('📱 Returning cached kid mode settings (offline mode)')
                return { data: cachedSettings, error: null }
            }

            console.log('🛡️ Getting kid mode settings for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('kid_mode_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()
            )

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Supabase error getting kid mode settings:', error)
                throw error
            }

            // Update cache
            this.setCache('kid_mode_settings', data || null)

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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'update',
                    table: 'kid_mode_settings',
                    data: { user_id: user.id, ...settings, updated_at: new Date().toISOString() },
                    id: user.id
                })
                
                this.setCache('kid_mode_settings', { user_id: user.id, ...settings })
                console.log('📱 Kid mode settings stored for offline sync')
                return { data: { user_id: user.id, ...settings }, error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('kid_mode_settings')
                    .upsert({
                        user_id: user.id,
                        ...settings,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()
            )

            if (error) {
                console.error('❌ Supabase error updating kid mode settings:', error)
                throw error
            }

            // Update cache
            this.setCache('kid_mode_settings', data)

            console.log('✅ Kid mode settings updated successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error updating kid mode settings:', error)
            return { data: null, error }
        }
    },

    // Enhanced Music Connections
    async getMusicConnections() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.warn('⚠️ No authenticated user found for music connections')
                return { data: null, error: new Error('User not authenticated') }
            }

            // Check cache first
            const cachedConnections = this.getCache('music_connections')
            if (cachedConnections && !this.isOnline) {
                console.log('📱 Returning cached music connections (offline mode)')
                return { data: cachedConnections, error: null }
            }

            console.log('🎵 Getting music connections for user:', user.id)

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('music_connections')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()
            )

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Supabase error getting music connections:', error)
                throw error
            }

            // Update cache
            this.setCache('music_connections', data || null)

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

            if (!this.isOnline) {
                this.storeOfflineOperation({
                    type: 'update',
                    table: 'music_connections',
                    data: { user_id: user.id, ...connections, updated_at: new Date().toISOString() },
                    id: user.id
                })
                
                this.setCache('music_connections', { user_id: user.id, ...connections })
                console.log('📱 Music connections stored for offline sync')
                return { data: { user_id: user.id, ...connections }, error: null }
            }

            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('music_connections')
                    .upsert({
                        user_id: user.id,
                        ...connections,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()
            )

            if (error) {
                console.error('❌ Supabase error updating music connections:', error)
                throw error
            }

            // Update cache
            this.setCache('music_connections', data)

            console.log('✅ Music connections updated successfully:', data)
            return { data, error: null }
        } catch (error) {
            console.error('❌ Error updating music connections:', error)
            return { data: null, error }
        }
    },

    // Enhanced utility functions
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
                    const { error } = await this.retryOperation(() =>
                        supabase.from(table).delete().eq('user_id', user.id)
                    )
                    
                    if (error) {
                        console.warn(`⚠️ Error clearing ${table}:`, error)
                    } else {
                        console.log(`✅ Cleared ${table}`)
                    }
                } catch (tableError) {
                    console.warn(`⚠️ Failed to clear ${table}:`, tableError)
                }
            }

            // Clear cache
            this.clearCache()

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
                },
                {
                    title: 'Study for History Test',
                    description: 'Review chapters 1-3 for tomorrow\'s test',
                    due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                    priority: 'high',
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
                { rating: 3, notes: 'Working on homework' },
                { rating: 5, notes: 'Finished my project early!' }
            ]

            for (const feeling of demoFeelings) {
                const result = await this.createFeeling(feeling)
                if (result.error) {
                    console.warn('⚠️ Failed to create demo feeling:', result.error)
                }
            }

            // Demo journal entries
            const demoJournalEntries = [
                'Today I learned about quadratic equations in math class. It was challenging but I think I\'m getting the hang of it!',
                'Had a great conversation with my study group about the upcoming science project. We have some really creative ideas.',
                'Feeling proud of myself for completing all my homework before dinner. Time management is getting easier!'
            ]

            for (const entry of demoJournalEntries) {
                const result = await this.addJournalEntry(entry)
                if (result.error) {
                    console.warn('⚠️ Failed to create demo journal entry:', result.error)
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
            cacheSize: this.cache.size,
            timestamp: new Date().toISOString()
        }
    },

    // Enhanced test functions
    async testDatabaseConnection() {
        try {
            console.log('🧪 Testing database connection...')
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) {
                console.log('❌ No authenticated user')
                return false
            }
            
            // Test a simple query
            const { data, error } = await this.retryOperation(() =>
                supabase
                    .from('tasks')
                    .select('count')
                    .eq('user_id', user.id)
                    .limit(1)
            )
            
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
            
            // Test journal operations
            const journalResult = await this.addJournalEntry('Test journal entry')
            console.log('✅ Journal creation:', journalResult.error ? 'FAILED' : 'SUCCESS')
            
            if (journalResult.data) {
                await this.deleteJournalEntry(journalResult.data.id)
                console.log('✅ Journal deletion: SUCCESS')
            }
            
            console.log('✅ All database operations tested successfully')
            return true
        } catch (error) {
            console.error('❌ Database operations test failed:', error)
            return false
        }
    },

    // New utility functions
    async getDataSummary() {
        try {
            const [tasks, feelings, journalEntries, aiNotes] = await Promise.all([
                this.getTasks(),
                this.getFeelings(),
                this.getJournalEntries(),
                this.getAINotes()
            ])

            return {
                tasks: tasks.data?.length || 0,
                feelings: feelings.data?.length || 0,
                journalEntries: journalEntries.data?.length || 0,
                aiNotes: aiNotes.data?.length || 0,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            console.error('❌ Error getting data summary:', error)
            return null
        }
    },

    async exportUserData() {
        try {
            console.log('📤 Exporting user data...')
            
            const [tasks, feelings, journalEntries, aiNotes, kidModeSettings, musicConnections] = await Promise.all([
                this.getTasks(),
                this.getFeelings(),
                this.getJournalEntries(),
                this.getAINotes(),
                this.getKidModeSettings(),
                this.getMusicConnections()
            ])

            const exportData = {
                exportDate: new Date().toISOString(),
                user: await auth.getCurrentUser(),
                data: {
                    tasks: tasks.data || [],
                    feelings: feelings.data || [],
                    journalEntries: journalEntries.data || [],
                    aiNotes: aiNotes.data || [],
                    kidModeSettings: kidModeSettings.data || null,
                    musicConnections: musicConnections.data || null
                }
            }

            console.log('✅ User data exported successfully')
            return exportData
        } catch (error) {
            console.error('❌ Error exporting user data:', error)
            return null
        }
    },

    async importUserData(importData) {
        try {
            console.log('📥 Importing user data...')
            
            if (!importData?.data) {
                throw new Error('Invalid import data format')
            }

            const { data } = importData

            // Import tasks
            if (data.tasks?.length > 0) {
                for (const task of data.tasks) {
                    await this.createTask(task)
                }
            }

            // Import feelings
            if (data.feelings?.length > 0) {
                for (const feeling of data.feelings) {
                    await this.createFeeling(feeling)
                }
            }

            // Import journal entries
            if (data.journalEntries?.length > 0) {
                for (const entry of data.journalEntries) {
                    await this.addJournalEntry(entry.content)
                }
            }

            // Import AI notes
            if (data.aiNotes?.length > 0) {
                for (const note of data.aiNotes) {
                    await this.createAINote(note)
                }
            }

            // Import settings
            if (data.kidModeSettings) {
                await this.updateKidModeSettings(data.kidModeSettings)
            }

            if (data.musicConnections) {
                await this.updateMusicConnections(data.musicConnections)
            }

            console.log('✅ User data imported successfully')
            return true
        } catch (error) {
            console.error('❌ Error importing user data:', error)
            return false
        }
    },

    async getSubjects() {
        console.warn("getSubjects is not implemented yet. Returning placeholder data.");
        return { data: [], error: null };
    },

    async getProfile() {
        console.warn("getProfile is not implemented yet. Returning placeholder data.");
        return { data: {}, error: null };
    }
}

// Initialize database
db.init()

// Expose for global debugging and utilities
window.testDatabase = db.testDatabaseConnection
window.testAllOperations = db.testAllOperations
window.dbStatus = db.getStatus
window.getDataSummary = db.getDataSummary
window.exportUserData = db.exportUserData
window.importUserData = db.importUserData
window.clearCache = db.clearCache
window.syncOfflineData = db.syncOfflineData