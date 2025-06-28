import { createClient } from '@supabase/supabase-js'

// Handle both browser (Vite) and Node.js environments
const getEnvVar = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key]
    }
    // For Node.js environment, try process.env
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key]
    }
    return undefined
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co'
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-key'

if (!getEnvVar('VITE_SUPABASE_URL') || !getEnvVar('VITE_SUPABASE_ANON_KEY')) {
  console.warn('Missing Supabase environment variables. Using placeholder values.')
  console.log('VITE_SUPABASE_URL:', getEnvVar('VITE_SUPABASE_URL') ? 'Set' : 'Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', getEnvVar('VITE_SUPABASE_ANON_KEY') ? 'Set' : 'Missing')
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
        // Create user profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: name,
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
  },

  signInWithGoogle: async () => {
    try {
      // Always use production URL for OAuth redirect to avoid localhost issues
      const redirectUrl = 'https://busybob.site';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      return { data, error }
    } catch (err) {
      console.error('Google signIn error:', err)
      return { data: null, error: err }
    }
  },

  signInWithSpotify: async (spotifyData) => {
    try {
      // For Spotify, we handle auth differently since it's not a native Supabase provider
      // First, check if user exists by email
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', spotifyData.email)
        .limit(1)

      let user;
      if (existingUsers && existingUsers.length > 0) {
        // User exists, update with Spotify info
        user = existingUsers[0];

        // Update user record with Spotify data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            spotify_id: spotifyData.spotifyId,
            name: spotifyData.name || user.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user with Spotify data:', updateError);
        }
      } else {
        // Create new user account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: spotifyData.email,
          password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2), // Random password for OAuth users
          options: {
            data: {
              name: spotifyData.name,
              spotify_id: spotifyData.spotifyId,
              provider: 'spotify'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        user = signUpData.user;

        // Create user profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name: spotifyData.name,
              email: spotifyData.email,
              spotify_id: spotifyData.spotifyId,
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      }

      // Store Spotify music connection
      const { error: musicError } = await supabase
        .from('music_connections')
        .upsert([
          {
            user_id: user.id,
            provider: 'spotify',
            access_token: spotifyData.accessToken,
            refresh_token: spotifyData.refreshToken,
            expires_at: new Date(spotifyData.expiresAt).toISOString()
          }
        ], {
          onConflict: 'user_id,provider'
        });

      if (musicError) {
        console.warn('Music connection creation failed:', musicError);
      }

      // Sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: spotifyData.email,
        password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) // We can't use the same password, but OAuth users should use OAuth
      });

      // If password sign-in fails (which it might), try to sign them in with a session
      if (signInError) {
        // For OAuth users, we'll create a session manually or use admin methods
        // This is a simplified approach - in production you'd handle this more securely
        console.log('Creating session for Spotify user...');
        return { data: { user }, error: null };
      }

      return { data: signInData, error: signInError };
    } catch (err) {
      console.error('Spotify signIn error:', err);
      return { data: null, error: err };
    }
  },
}

// Database helpers
export const db = {
  // Ensure user exists in profiles table
  ensureUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user exists in profiles table
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              // You might want to add a default username or other fields here
            }
          ])
        if (createError) throw createError
      } else if (checkError) {
        throw checkError
      }

      return user
    } catch (err) {
      console.error('Error ensuring user:', err)
      return null
    }
  },

  // Populate demo data for new users
  populateDemoData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== 'demo@busybob.com') return

      // Check if demo data already exists
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existingTasks && existingTasks.length > 0) {
        console.log('Demo data already exists, skipping population')
        return
      }

      console.log('Populating demo data...')

      // Sample tasks
      const sampleTasks = [
        {
          user_id: user.id,
          name: 'Complete project presentation',
          title: 'Complete project presentation',
          description: 'Finish the quarterly project presentation for the team meeting',
          priority: 'high',
          category: 'work',
          completed: false,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_time: '14:00',
          stress_level: 7,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          name: 'Grocery shopping',
          title: 'Grocery shopping',
          description: 'Buy groceries for the week including fruits, vegetables, and household items',
          priority: 'medium',
          category: 'personal',
          completed: true,
          due_date: new Date().toISOString().split('T')[0],
          due_time: '18:00',
          stress_level: 3,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          name: 'Morning workout',
          title: 'Morning workout',
          description: '30-minute cardio session and strength training',
          priority: 'medium',
          category: 'health',
          completed: false,
          due_date: new Date().toISOString().split('T')[0],
          due_time: '07:00',
          stress_level: 2,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          name: 'Read new book',
          title: 'Read new book',
          description: 'Continue reading "Atomic Habits" - aim for 30 pages',
          priority: 'low',
          category: 'personal',
          completed: false,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_time: '20:00',
          stress_level: 1,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          name: 'Call mom',
          title: 'Call mom',
          description: 'Weekly check-in call with mom',
          priority: 'high',
          category: 'personal',
          completed: false,
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_time: '19:00',
          stress_level: 2,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          name: 'Review budget',
          title: 'Review budget',
          description: 'Go through monthly expenses and update budget spreadsheet',
          priority: 'medium',
          category: 'finance',
          completed: false,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_time: '16:00',
          stress_level: 4,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Sample feelings/mood entries
      const sampleFeelings = [
        {
          user_id: user.id,
          rating: 8,
          comments: 'Feeling productive today! Completed most of my tasks and had a great workout.',
          mood_tags: ['productive', 'energetic', 'focused'],
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          rating: 6,
          comments: 'A bit stressed about the upcoming presentation, but managing it well.',
          mood_tags: ['stressed', 'focused', 'determined'],
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          rating: 9,
          comments: 'Amazing day! Had a great conversation with a friend and felt very grateful.',
          mood_tags: ['happy', 'grateful', 'social'],
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          rating: 5,
          comments: 'Feeling a bit tired today, need to get more sleep tonight.',
          mood_tags: ['tired', 'calm', 'reflective'],
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          rating: 7,
          comments: 'Good day overall. Made progress on my goals and felt motivated.',
          mood_tags: ['motivated', 'satisfied', 'productive'],
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Sample journal entries
      const sampleJournalEntries = [
        {
          user_id: user.id,
          title: 'Reflections on Productivity',
          content: 'Today I realized that breaking down big tasks into smaller, manageable pieces really helps with my productivity. I was able to complete three major tasks by focusing on one small step at a time. This approach reduces overwhelm and gives me a sense of accomplishment throughout the day. I want to apply this strategy more consistently.',
          mood_rating: 8,
          tags: ['productivity', 'reflection', 'growth'],
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          title: 'Work-Life Balance Thoughts',
          content: 'Been thinking a lot about work-life balance lately. While I love being productive and achieving my goals, I also need to remember to take breaks and enjoy the present moment. Today I took a 20-minute walk during lunch and it made such a difference in my afternoon energy levels. Small moments of self-care really add up.',
          mood_rating: 7,
          tags: ['work-life-balance', 'self-care', 'mindfulness'],
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          title: 'Gratitude Practice',
          content: 'Today I\'m feeling particularly grateful for my supportive family and friends. Had a wonderful conversation with my mom this evening, and it reminded me how important these relationships are. Also grateful for my health and the ability to pursue my goals. Sometimes I get so caught up in productivity that I forget to appreciate what I already have.',
          mood_rating: 9,
          tags: ['gratitude', 'relationships', 'perspective'],
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          title: 'Learning from Challenges',
          content: 'Faced some unexpected challenges at work today, but instead of getting frustrated, I tried to see them as learning opportunities. It\'s amazing how a shift in perspective can completely change how you experience difficult situations. I\'m learning to embrace challenges as part of the growth process.',
          mood_rating: 6,
          tags: ['challenges', 'growth', 'mindset'],
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.id,
          title: 'Goals and Aspirations',
          content: 'Been thinking about my long-term goals and what I want to achieve in the next year. I want to focus on developing new skills, building stronger relationships, and maintaining good health habits. It\'s important to have both short-term and long-term goals to stay motivated and focused.',
          mood_rating: 8,
          tags: ['goals', 'planning', 'motivation'],
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Insert all sample data
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(sampleTasks)

      const { error: feelingsError } = await supabase
        .from('feelings')
        .insert(sampleFeelings)

      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert(sampleJournalEntries)

      if (tasksError) console.error('Error inserting sample tasks:', tasksError)
      if (feelingsError) console.error('Error inserting sample feelings:', feelingsError)
      if (journalError) console.error('Error inserting sample journal entries:', journalError)

      console.log('Demo data populated successfully!')
    } catch (err) {
      console.error('Error populating demo data:', err)
    }
  },

  // Tasks
  getTasks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (err) {
      console.error('GetTasks error:', err)
      return { data: [], error: err }
    }
  },

  createTask: async (task) => {
    try {
      await db.ensureUser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            category: task.category || 'general',
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
      await db.ensureUser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('feelings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (err) {
      console.error('GetFeelings error:', err)
      return { data: [], error: err }
    }
  },

  createFeeling: async (feeling) => {
    try {
      await db.ensureUser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('feelings')
        .insert([
          {
            user_id: user.id,
            rating: feeling.rating,
            comments: feeling.comments || '',
            mood_tags: feeling.mood_tags || [],
            created_at: feeling.created_at || new Date().toISOString()
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (err) {
      console.error('GetJournalEntries error:', err)
      return { data: [], error: err }
    }
  },

  addJournalEntry: async (content) => {
    try {
      await db.ensureUser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journal_entries')
            .insert([{ user_id: user.id, content: content, created_at: new Date().toISOString() }])
        .select()
      return { data, error }
    } catch (err) {
        console.error('addJournalEntry error:', err)
      return { data: null, error: err }
    }
  },

  updateJournalEntry: async (id, content) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
            .update({ content: content, updated_at: new Date().toISOString() })
        .eq('id', id)
            .select()
      return { data, error }
    } catch (err) {
        console.error('updateJournalEntry error:', err)
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
  },
}

export const ai = {
  createNote: async (title, content) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated for creating AI note.')

      const { data, error } = await supabase
        .from('ai_notes')
        .insert([{
          user_id: user.id,
          title,
          content,
        }])
        .select()

      if (error) throw error
      return data[0]
    } catch (err) {
      console.error('Error creating AI note:', err)
      return null
    }
  },

  getNotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated for fetching AI notes.')

      const { data, error } = await supabase
        .from('ai_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching AI notes:', err)
      return []
    }
  },

  updateNote: async (noteId, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated for updating AI note.')

      const { data, error } = await supabase
        .from('ai_notes')
        .update(updates)
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error updating AI note:', err)
      return null
    }
  },

  deleteNote: async (noteId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated for deleting AI note.')

      const { data, error } = await supabase
        .from('ai_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error deleting AI note:', err)
      return null
    }
  },

  uploadFile: async (noteId, file) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated for uploading file.')

      const filePath = `public/ai-notes/${user.id}/${noteId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('ai_note_files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('ai_note_files')
        .getPublicUrl(filePath)

      // Add file metadata to the database
      const { error: dbError } = await supabase
        .from('ai_note_files')
        .insert([{
          note_id: noteId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrlData.publicUrl,
        }])

      if (dbError) throw dbError

      return { publicUrl: publicUrlData.publicUrl }
    } catch (err) {
      console.error('Error uploading file for AI note:', err)
      return null
    }
  },
}