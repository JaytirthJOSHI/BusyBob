// Mock Supabase for local development (no real backend needed)

// Mock data storage
let mockUsers = []
let mockTasks = []
let mockFeelings = []
let mockJournalEntries = []
let currentUser = null

// Mock auth object
export const auth = {
  signUp: async (email, password, name) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      return { data: null, error: { message: 'User already exists' } }
    }
    
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      user_metadata: { name }
    }
    
    mockUsers.push(user)
    return { data: { user }, error: null }
  },

  signIn: async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      return { data: null, error: { message: 'Invalid credentials' } }
    }
    
    currentUser = user
    return { data: { user }, error: null }
  },

  signOut: async () => {
    currentUser = null
    return { data: null, error: null }
  },

  getCurrentUser: () => {
    return Promise.resolve({ data: { user: currentUser } })
  },

  onAuthStateChange: (callback) => {
    // Mock auth state change listener
    return () => {} // Unsubscribe function
  }
}

// Mock database object
export const db = {
  // Tasks
  getTasks: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const userTasks = mockTasks.filter(task => task.user_id === currentUser?.id)
    return { data: userTasks, error: null }
  },

  createTask: async (task) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const newTask = {
      ...task,
      id: Date.now(),
      user_id: currentUser?.id,
      created_at: new Date().toISOString()
    }
    mockTasks.push(newTask)
    return { data: [newTask], error: null }
  },

  updateTask: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const taskIndex = mockTasks.findIndex(t => t.id === id)
    if (taskIndex === -1) {
      return { data: null, error: { message: 'Task not found' } }
    }
    
    mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates }
    return { data: [mockTasks[taskIndex]], error: null }
  },

  deleteTask: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const taskIndex = mockTasks.findIndex(t => t.id === id)
    if (taskIndex === -1) {
      return { data: null, error: { message: 'Task not found' } }
    }
    
    mockTasks.splice(taskIndex, 1)
    return { data: null, error: null }
  },

  // Feelings
  getFeelings: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const userFeelings = mockFeelings.filter(feeling => feeling.user_id === currentUser?.id)
    return { data: userFeelings, error: null }
  },

  createFeeling: async (feeling) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const newFeeling = {
      ...feeling,
      id: Date.now(),
      user_id: currentUser?.id,
      created_at: new Date().toISOString()
    }
    mockFeelings.push(newFeeling)
    return { data: [newFeeling], error: null }
  },

  // Journal Entries
  getJournalEntries: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const userEntries = mockJournalEntries.filter(entry => entry.user_id === currentUser?.id)
    return { data: userEntries, error: null }
  },

  createJournalEntry: async (entry) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const newEntry = {
      ...entry,
      id: Date.now(),
      user_id: currentUser?.id,
      created_at: new Date().toISOString()
    }
    mockJournalEntries.push(newEntry)
    return { data: [newEntry], error: null }
  },

  deleteJournalEntry: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const entryIndex = mockJournalEntries.findIndex(e => e.id === id)
    if (entryIndex === -1) {
      return { data: null, error: { message: 'Entry not found' } }
    }
    
    mockJournalEntries.splice(entryIndex, 1)
    return { data: null, error: null }
  }
}

// For backward compatibility
export const supabase = {
  auth,
  from: (table) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null })
  })
}