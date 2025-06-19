import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth helpers
export const auth = {
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })
      
      if (data.user && !error) {
        // Create user profile in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name: name,
              email: email,
              created_at: new Date().toISOString()
            }
          ])
        
        if (profileError) {
          console.warn('Profile creation failed:', profileError)
        }
      }
      
      return { data, error }
    } catch (err) {
      console.error('SignUp error:', err)
      return { data: null, error: err }
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { data: null, error: err }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { data: null, error }
    } catch (err) {
      console.error('SignOut error:', err)
      return { data: null, error: err }
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return { data: { user } }
    } catch (err) {
      console.error('GetCurrentUser error:', err)
      return { data: { user: null } }
    }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Tasks
  getTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (err) {
      console.error('GetTasks error:', err)
      return { data: [], error: err }
    }
  },

  createTask: async (task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            name: task.title || task.name,
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            category: task.category || 'personal',
            completed: task.completed || false,
            due_date: task.due_date,
            due_time: task.due_time,
            stress_level: task.stress_level,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      console.error('CreateTask error:', err)
      return { data: null, error: err }
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      return { data, error }
    } catch (err) {
      console.error('UpdateTask error:', err)
      return { data: null, error: err }
    }
  },

  deleteTask: async (id) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (err) {
      console.error('DeleteTask error:', err)
      return { data: null, error: err }
    }
  },

  // Feelings
  getFeelings: async () => {
    try {
      const { data, error } = await supabase
        .from('feelings')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (err) {
      console.error('GetFeelings error:', err)
      return { data: [], error: err }
    }
  },

  createFeeling: async (feeling) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('feelings')
        .insert([
          {
            user_id: user.id,
            feeling: feeling.feeling,
            rating: feeling.rating,
            comments: feeling.notes || feeling.comments,
            mood_tags: feeling.mood_tags,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      console.error('CreateFeeling error:', err)
      return { data: null, error: err }
    }
  },

  // Journal Entries
  getJournalEntries: async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (err) {
      console.error('GetJournalEntries error:', err)
      return { data: [], error: err }
    }
  },

  createJournalEntry: async (entry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: user.id,
            title: entry.title,
            content: entry.content,
            mood_rating: entry.mood_rating,
            tags: entry.tags,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      return { data, error }
    } catch (err) {
      console.error('CreateJournalEntry error:', err)
      return { data: null, error: err }
    }
  },

  deleteJournalEntry: async (id) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (err) {
      console.error('DeleteJournalEntry error:', err)
      return { data: null, error: err }
    }
  }
}

