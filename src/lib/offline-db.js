import { auth, supabase } from './supabase.js'

// Simplified database utility that uses direct Supabase calls
export const db = {
    // Tasks
    async createTask(taskData) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const task = {
                ...taskData,
                user_id: user.id,
                created_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert(task)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error creating task:', error)
            return { data: null, error }
        }
    },

    async getTasks() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return { data: [], error: null }

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error) {
            console.error('Error getting tasks:', error)
            return { data: [], error }
        }
    },

    async updateTask(taskId, updates) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error updating task:', error)
            return { data: null, error }
        }
    },

    async deleteTask(taskId) {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            return { data: true, error }
        } catch (error) {
            console.error('Error deleting task:', error)
            return { data: null, error }
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
                mood: feelingData.mood || 'neutral', // Default mood if not provided
                created_at: feelingData.created_at || new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('feelings')
                .insert(feeling)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error creating feeling:', error)
            return { data: null, error }
        }
    },

    async getFeelings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return { data: [], error: null }

            const { data, error } = await supabase
                .from('feelings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error) {
            console.error('Error getting feelings:', error)
            return { data: [], error }
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

            const { data, error } = await supabase
                .from('journal_entries')
                .insert(entry)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error adding journal entry:', error)
            return { data: null, error }
        }
    },

    async getJournalEntries() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return { data: [], error: null }

            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error) {
            console.error('Error getting journal entries:', error)
            return { data: [], error }
        }
    },

    async updateJournalEntry(entryId, content) {
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .update({ 
                    content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', entryId)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error updating journal entry:', error)
            return { data: null, error }
        }
    },

    async deleteJournalEntry(entryId) {
        try {
            const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', entryId)

            return { data: true, error }
        } catch (error) {
            console.error('Error deleting journal entry:', error)
            return { data: null, error }
        }
    },

    // AI Notes
    async saveAINote(content, source = 'manual') {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const note = {
                user_id: user.id,
                content,
                source,
                created_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('ai_notes')
                .insert(note)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error saving AI note:', error)
            return { data: null, error }
        }
    },

    async getAINotes() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return { data: [], error: null }

            const { data, error } = await supabase
                .from('ai_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { data: data || [], error: null }
        } catch (error) {
            console.error('Error getting AI notes:', error)
            return { data: [], error }
        }
    },

    // Kid Mode Settings
    async getKidModeSettings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return { data: null, error: null }

            const { data, error } = await supabase
                .from('kid_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error getting kid mode settings:', error)
            return { data: null, error }
        }
    },

    async saveKidModeSettings(settings) {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('kid_mode_settings')
                .upsert({
                    user_id: user.id,
                    ...settings,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Error saving kid mode settings:', error)
            return { data: null, error }
        }
    },

    // Utility methods
    async ensureUser() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')
            
            // Ensure user exists in profiles table
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    created_at: new Date().toISOString()
                })

            if (error) console.warn('Error ensuring user profile:', error)
            return user
        } catch (error) {
            console.error('Error ensuring user:', error)
            throw error
        }
    },

    // Initialize (simplified - no offline storage)
    init() {
        console.log('📦 Database initialized (direct Supabase mode)')
    },

    async initUser(userId) {
        console.log('👤 User initialized:', userId)
        await this.ensureUser()
    }
}