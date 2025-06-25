import { auth, supabase } from '../lib/supabase.js'

// Custom error classes
class OfflineStorageError extends Error {
    constructor(message, code, originalError = null) {
        super(message)
        this.name = 'OfflineStorageError'
        this.code = code
        this.originalError = originalError
    }
}

class SyncError extends OfflineStorageError {
    constructor(message, tableName, operation, originalError = null) {
        super(message, 'SYNC_ERROR', originalError)
        this.name = 'SyncError'
        this.tableName = tableName
        this.operation = operation
    }
}

// Configuration constants
const CONFIG = {
    DB_NAME: 'BusyBobOfflineDB',
    DB_VERSION: 1,
    MAX_SYNC_ATTEMPTS: 3,
    SYNC_INTERVAL_MS: 30000,
    INITIAL_SYNC_DELAY_MS: 100,
    MAX_RETRY_DELAY_MS: 30000,
    MAX_RECORD_SIZE_BYTES: 1024 * 1024, // 1MB limit per record
    MAX_TOTAL_STORAGE_MB: 50, // 50MB total storage limit
    STORE_NAMES: [
        'users', 'tasks', 'feelings', 'journal_entries',
        'kid_mode_settings', 'studentvue_credentials',
        'canvas_credentials', 'music_connections', 'ai_notes',
        'sync_queue', 'user_metadata'
    ],
    LOG_LEVELS: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    }
}

// Performance monitoring utility
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map()
    }

    startTimer(operation) {
        const key = `${operation}_${Date.now()}`
        this.metrics.set(key, {
            operation,
            startTime: performance.now(),
            endTime: null,
            duration: null
        })
        return key
    }

    endTimer(key) {
        const metric = this.metrics.get(key)
        if (metric) {
            metric.endTime = performance.now()
            metric.duration = metric.endTime - metric.startTime
            console.debug(`⏱️ ${metric.operation} took ${metric.duration.toFixed(2)}ms`)
            return metric.duration
        }
        return null
    }

    getMetrics() {
        return Array.from(this.metrics.values())
    }

    clearMetrics() {
        this.metrics.clear()
    }
}

// Enhanced logging utility
class Logger {
    constructor(level = CONFIG.LOG_LEVELS.INFO) {
        this.level = level
    }

    setLevel(level) {
        this.level = level
    }

    error(message, error = null, context = {}) {
        if (this.level >= CONFIG.LOG_LEVELS.ERROR) {
            console.error(`❌ [OfflineStorage] ${message}`, { error, context })
        }
    }

    warn(message, context = {}) {
        if (this.level >= CONFIG.LOG_LEVELS.WARN) {
            console.warn(`⚠️ [OfflineStorage] ${message}`, context)
        }
    }

    info(message, context = {}) {
        if (this.level >= CONFIG.LOG_LEVELS.INFO) {
            console.info(`ℹ️ [OfflineStorage] ${message}`, context)
        }
    }

    debug(message, context = {}) {
        if (this.level >= CONFIG.LOG_LEVELS.DEBUG) {
            console.debug(`🐛 [OfflineStorage] ${message}`, context)
        }
    }
}

class OfflineStorage {
    constructor() {
        this.dbName = CONFIG.DB_NAME
        this.dbVersion = CONFIG.DB_VERSION
        this.currentUserId = null
        this.db = null
        this.syncQueue = []
        this.isOnline = navigator.onLine
        this.isSyncing = false
        this.retryTimeouts = new Map()
        this.performanceMonitor = new PerformanceMonitor()
        this.logger = new Logger()
        this.sessionToken = null
        this.initTimestamp = null
        this.maxSessionDuration = 7 * 24 * 60 * 60 * 1000 // 7 days (more reasonable for web app)
        this.rateLimiters = new Map()

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true
            this.logger.info('Connection restored, scheduling sync')
            this.scheduleSync()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            this.logger.warn('Connection lost, clearing retry timeouts')
            this.clearRetryTimeouts()
        })

        // Periodic sync check (every 30 seconds when online)
        setInterval(() => {
            if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
                this.logger.debug('Periodic sync check triggered')
                this.syncPendingChanges()
            }
        }, CONFIG.SYNC_INTERVAL_MS)
    }

    async init(userId, sessionToken = null) {
        try {
            console.log('🚀 Starting offline storage initialization...', { userId: this.redactUserId(userId) })
            
            // 🔒 SECURITY: Validate user ID format
            if (!this.validateUserId(userId)) {
                console.error('❌ Invalid user ID format:', userId)
                throw new OfflineStorageError('Invalid user ID format', 'INVALID_USER_ID')
            }
            console.log('✅ User ID validation passed')

            // 🔒 SECURITY: Validate session if provided
            if (sessionToken && !this.validateSessionToken(sessionToken)) {
                console.error('❌ Invalid session token')
                throw new OfflineStorageError('Invalid session token', 'INVALID_SESSION')
            }
            console.log('✅ Session token validation passed')

            // 🔒 SECURITY: Verify user exists in Supabase before allowing offline access
            try {
                console.log('🔍 Verifying user in Supabase...')
                const { data: { user }, error } = await auth.getCurrentUser()

                if (error || !user || user.id !== userId) {
                    console.error('❌ User verification failed:', { error, userId, user })
                    throw new OfflineStorageError('User verification failed', 'USER_NOT_FOUND')
                }
                console.log('✅ User verification passed')
            } catch (error) {
                console.error('❌ Failed to verify user during init', error)
                throw new OfflineStorageError('Failed to verify user', 'USER_VERIFICATION_ERROR', error)
            }

            this.currentUserId = userId
            this.sessionToken = sessionToken
            this.initTimestamp = Date.now()

            // 🔒 SECURITY: Auto-refresh session if token is provided
            if (sessionToken) {
                this.logger.info('Session token provided during init', {
                    userId: this.redactUserId(userId),
                    tokenLength: sessionToken.length
                })
            }

            console.log('💾 Opening IndexedDB...')
            this.db = await this.openDB()
            console.log('✅ IndexedDB opened successfully')

            console.log('📥 Loading sync queue...')
            await this.loadSyncQueue()
            console.log('✅ Sync queue loaded')

            // If we're online, sync any pending changes
            if (this.isOnline) {
                console.log('🌐 Online - syncing pending changes...')
                await this.syncPendingChanges()
                console.log('✅ Pending changes synced')
            } else {
                console.log('📱 Offline - skipping sync')
            }

            this.logger.info('Offline storage initialized', { userId: this.redactUserId(userId) })
            console.log('🎉 Offline storage initialization completed successfully')
        } catch (error) {
            console.error('❌ Offline storage initialization failed:', error)
            throw error
        }
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            console.log('🔧 Opening IndexedDB...', { dbName: this.dbName, version: this.dbVersion })
            
            const request = indexedDB.open(this.dbName, this.dbVersion)

            request.onerror = () => {
                console.error('❌ IndexedDB open error:', request.error)
                reject(request.error)
            }
            
            request.onsuccess = () => {
                console.log('✅ IndexedDB opened successfully')
                resolve(request.result)
            }

            request.onupgradeneeded = (event) => {
                console.log('🔄 IndexedDB upgrade needed, creating stores...')
                const db = event.target.result

                // Create object stores for each data type
                const stores = CONFIG.STORE_NAMES

                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        console.log('📦 Creating store:', storeName)
                        const store = db.createObjectStore(storeName, { keyPath: 'id' })
                        store.createIndex('user_id', 'user_id', { unique: false })
                        store.createIndex('updated_at', 'updated_at', { unique: false })
                    } else {
                        console.log('✅ Store already exists:', storeName)
                    }
                })
                console.log('🎉 IndexedDB upgrade completed')
            }
        })
    }

    // Input validation methods
    validateTableName(tableName) {
        if (!tableName || typeof tableName !== 'string') {
            throw new OfflineStorageError('Invalid table name', 'INVALID_TABLE_NAME')
        }

        if (!CONFIG.STORE_NAMES.includes(tableName)) {
            throw new OfflineStorageError(`Unknown table: ${tableName}`, 'UNKNOWN_TABLE')
        }

        return true
    }

    validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new OfflineStorageError('Data must be a valid object', 'INVALID_DATA')
        }

        // Check for potentially dangerous properties
        const dangerousProps = ['__proto__', 'constructor', 'prototype']
        for (const prop of dangerousProps) {
            if (prop in data) {
                throw new OfflineStorageError(`Dangerous property detected: ${prop}`, 'DANGEROUS_PROPERTY')
            }
        }

        return true
    }

    sanitizeData(data) {
        // Create a clean copy without potentially dangerous properties
        const sanitized = {}
        for (const [key, value] of Object.entries(data)) {
            if (typeof key === 'string' && !key.startsWith('__')) {
                // 🔒 SECURITY: Sanitize both key and value
                const cleanKey = this.sanitizeString(key)
                if (cleanKey) {
                    sanitized[cleanKey] = this.sanitizeValue(value)
                }
            }
        }
        return sanitized
    }

    // 🔒 SECURITY: User ID validation
    validateUserId(userId) {
        if (!userId || typeof userId !== 'string') return false

        // UUID format validation (Supabase uses UUIDs)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(userId)
    }

    // 🔒 SECURITY: Session token validation
    validateSessionToken(sessionToken) {
        if (!sessionToken || typeof sessionToken !== 'string') return false
        if (sessionToken.length < 32) return false // Minimum token length

        // Check session age
        if (this.initTimestamp && (Date.now() - this.initTimestamp) > this.maxSessionDuration) {
            this.logger.warn('Session expired')
            return false
        }

        return true
    }

    // 🔒 SECURITY: Session validation for write operations only
    validateSessionForWrite() {
        if (!this.validateSessionToken(this.sessionToken)) {
            throw new OfflineStorageError('Session expired - write operations require valid session', 'SESSION_EXPIRED')
        }
    }

    // 🔒 SECURITY: Session validation for read operations (more lenient)
    validateSessionForRead() {
        // For read operations, we only require a valid user ID
        if (!this.currentUserId) {
            throw new OfflineStorageError('User not authenticated', 'NOT_AUTHENTICATED')
        }

        // Warn if session is expired but don't block read operations
        if (this.sessionToken && !this.validateSessionToken(this.sessionToken)) {
            this.logger.warn('Session expired but allowing read operations', {
                userId: this.redactUserId(this.currentUserId)
            })
        }
    }

    // 🔒 SECURITY: Refresh session token
    refreshSession(sessionToken = null) {
        if (sessionToken) {
            this.sessionToken = sessionToken
        }
        this.initTimestamp = Date.now()
        this.logger.info('Session refreshed', { userId: this.redactUserId(this.currentUserId) })
    }

    // 🔒 SECURITY: Enhanced value sanitization
    sanitizeValue(value) {
        if (value === null || value === undefined) return value

        if (typeof value === 'string') {
            return this.sanitizeString(value)
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            return this.sanitizeData(value) // Recursive sanitization
        }

        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item))
        }

        // Numbers, booleans pass through
        if (typeof value === 'number' || typeof value === 'boolean') {
            return value
        }

        // Reject other types
        this.logger.warn('Rejected unsupported data type', { type: typeof value })
        return null
    }

    // 🔒 SECURITY: String sanitization with XSS protection
    sanitizeString(str) {
        if (typeof str !== 'string') return null

        // Remove potential XSS vectors
        const cleaned = str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/data:text\/html/gi, '') // Remove data URLs
            .replace(/vbscript:/gi, '') // Remove vbscript URLs
            .trim()

        // Length validation
        if (cleaned.length > 10000) { // 10KB limit per string
            throw new OfflineStorageError('String too long', 'STRING_TOO_LONG')
        }

        return cleaned
    }

    // 🔒 SECURITY: Permission system
    hasTablePermission(tableName, operation) {
        const permissions = {
            'tasks': ['read', 'write', 'delete'],
            'journal_entries': ['read', 'write', 'delete'],
            'feelings': ['read', 'write'],
            'kid_mode_settings': ['read', 'write'],
            'studentvue_credentials': ['read', 'write'],
            'canvas_credentials': ['read', 'write'],
            'music_connections': ['read', 'write'],
            'ai_notes': ['read', 'write', 'delete'],
            'sync_queue': ['read', 'write'], // Internal use only
            'user_metadata': ['read', 'write'],
            'users': ['read'] // Read-only for verification
        }

        const tablePerms = permissions[tableName]
        return tablePerms && tablePerms.includes(operation)
    }

    // 🔒 SECURITY: Rate limiting
    async checkRateLimit(operation) {
        const key = `${operation}_${this.currentUserId}`
        const now = Date.now()
        const windowMs = 60000 // 1 minute window
        const maxRequests = 100 // Max 100 operations per minute

        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, { count: 1, windowStart: now })
            return
        }

        const limiter = this.rateLimiters.get(key)

        if (now - limiter.windowStart > windowMs) {
            // Reset window
            limiter.count = 1
            limiter.windowStart = now
        } else {
            limiter.count++
            if (limiter.count > maxRequests) {
                throw new OfflineStorageError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED')
            }
        }
    }

    // 🔒 SECURITY: Data redaction for logging
    redactUserId(userId) {
        if (!userId || userId.length < 8) return '[REDACTED]'
        return userId.substring(0, 4) + '****' + userId.substring(userId.length - 4)
    }

    redactSensitiveData(data) {
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'ssn', 'credit_card']
        const redacted = { ...data }

        for (const field of sensitiveFields) {
            if (field in redacted) {
                redacted[field] = '[REDACTED]'
            }
        }

        return redacted
    }

    // Data size validation
    getDataSizeBytes(data) {
        return new Blob([JSON.stringify(data)]).size
    }

    validateDataSize(data) {
        const sizeBytes = this.getDataSizeBytes(data)

        if (sizeBytes > CONFIG.MAX_RECORD_SIZE_BYTES) {
            throw new OfflineStorageError(
                `Record size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds limit (${CONFIG.MAX_RECORD_SIZE_BYTES / 1024 / 1024}MB)`,
                'RECORD_TOO_LARGE'
            )
        }

        return sizeBytes
    }

    async getStorageUsage() {
        if (!this.db || !this.currentUserId) return { used: 0, available: 0, percentage: 0 }

        try {
            let totalSize = 0

            for (const tableName of CONFIG.STORE_NAMES) {
                const data = await this.getData(tableName)
                totalSize += this.getDataSizeBytes(data)
            }

            const maxSize = CONFIG.MAX_TOTAL_STORAGE_MB * 1024 * 1024
            const percentage = (totalSize / maxSize) * 100

            return {
                used: totalSize,
                available: maxSize - totalSize,
                percentage: Math.round(percentage),
                maxSize
            }
        } catch (error) {
            this.logger.error('Failed to calculate storage usage', error)
            return { used: 0, available: 0, percentage: 0 }
        }
    }

    async checkStorageQuota() {
        const usage = await this.getStorageUsage()

        if (usage.percentage > 90) {
            this.logger.warn('Storage quota nearly exceeded', { usage })
            return false
        }

        if (usage.percentage > 75) {
            this.logger.warn('Storage usage high', { usage })
        }

        return true
    }

    // Generic data operations
    async saveData(tableName, data, skipSync = false) {
        const timerKey = this.performanceMonitor.startTimer(`saveData_${tableName}`)

        try {
            // 🔒 SECURITY: Check session validity for write operations
            this.validateSessionForWrite()

            // Validate inputs
            this.validateTableName(tableName)
            this.validateData(data)

            if (!this.currentUserId || !this.db) {
                throw new OfflineStorageError('Storage not initialized', 'NOT_INITIALIZED')
            }

            // 🔒 SECURITY: Check table permissions
            if (!this.hasTablePermission(tableName, 'write')) {
                throw new OfflineStorageError('Insufficient permissions', 'PERMISSION_DENIED')
            }

            // 🔒 SECURITY: Rate limiting
            await this.checkRateLimit('saveData')

            // Check storage quota before saving
            const hasQuota = await this.checkStorageQuota()
            if (!hasQuota) {
                throw new OfflineStorageError('Storage quota exceeded', 'QUOTA_EXCEEDED')
            }

            // Sanitize and prepare data
            const sanitizedData = this.sanitizeData(data)
            const record = {
                ...sanitizedData,
                user_id: this.currentUserId,
                updated_at: new Date().toISOString(),
                offline_created: !sanitizedData.id // Track if created offline
            }

            // Generate offline ID if needed
            if (!record.id) {
                record.id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }

            // Validate record size
            const sizeBytes = this.validateDataSize(record)
            this.logger.debug(`Saving ${tableName} record`, {
                id: record.id,
                sizeBytes,
                offline_created: record.offline_created,
                userId: this.redactUserId(this.currentUserId)
            })

            const tx = this.db.transaction([tableName], 'readwrite')
            const store = tx.objectStore(tableName)

            await new Promise((resolve, reject) => {
                const request = store.put(record)
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(new OfflineStorageError(
                    `Failed to save ${tableName}`,
                    'SAVE_FAILED',
                    request.error
                ))
            })

            this.logger.info(`Saved ${tableName} offline`, {
                id: record.id,
                sizeBytes,
                skipSync,
                userId: this.redactUserId(this.currentUserId)
            })

            // Add to sync queue if not already syncing
            if (!skipSync) {
                await this.queueForSync(tableName, 'upsert', record)
            }

            this.performanceMonitor.endTimer(timerKey)
            return record
        } catch (error) {
            this.performanceMonitor.endTimer(timerKey)

            if (error instanceof OfflineStorageError) {
                this.logger.error(`Failed to save ${tableName}`, error, { tableName, dataId: data?.id })
                throw error
            }

            this.logger.error(`Unexpected error saving ${tableName}`, error, { tableName, dataId: data?.id })
            throw new OfflineStorageError(
                `Failed to save ${tableName}: ${error.message}`,
                'SAVE_ERROR',
                error
            )
        }
    }

    async getData(tableName, filters = {}) {
        if (!this.currentUserId || !this.db) return []

        try {
            // 🔒 SECURITY: Check session validity for read operations (more lenient)
            this.validateSessionForRead()

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
            // 🔒 SECURITY: Check session validity for write operations
            this.validateSessionForWrite()

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
        // 🔒 SECURITY: Validate operation type
        const allowedOperations = ['upsert', 'delete']
        if (!allowedOperations.includes(operation)) {
            throw new OfflineStorageError('Invalid sync operation', 'INVALID_OPERATION')
        }

        // 🔒 SECURITY: Validate table name
        this.validateTableName(tableName)

        // 🔒 SECURITY: Check permissions
        const requiredPermission = operation === 'delete' ? 'delete' : 'write'
        if (!this.hasTablePermission(tableName, requiredPermission)) {
            throw new OfflineStorageError('Insufficient sync permissions', 'SYNC_PERMISSION_DENIED')
        }

        // 🔒 SECURITY: Rate limit sync operations
        await this.checkRateLimit('sync')

        // 🔒 SECURITY: Sanitize sync data
        const sanitizedData = this.sanitizeData(data)

        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: this.currentUserId,
            table_name: tableName,
            operation,
            data: sanitizedData,
            created_at: new Date().toISOString(),
            attempts: 0,
            max_attempts: CONFIG.MAX_SYNC_ATTEMPTS
        }

        this.syncQueue.push(syncItem)
        await this.saveSyncQueue()

        this.logger.info('Queued for sync', {
            table: tableName,
            operation,
            userId: this.redactUserId(this.currentUserId)
        })

        // Try to sync immediately if online
        if (this.isOnline) {
            setTimeout(() => this.syncPendingChanges(), CONFIG.INITIAL_SYNC_DELAY_MS)
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
        if (!this.isOnline || this.syncQueue.length === 0 || this.isSyncing) return

        this.isSyncing = true
        console.log('🔄 Starting sync of pending changes...')

        // Group operations by type and table for batching
        const groupedOps = this.syncQueue
            .filter(item => item.user_id === this.currentUserId)
            .reduce((groups, item) => {
                const key = `${item.operation}_${item.table_name}`
                if (!groups[key]) groups[key] = []
                groups[key].push(item)
                return groups
            }, {})

        const failedItems = []

        // Process batched operations
        for (const [opKey, items] of Object.entries(groupedOps)) {
            const [operation, tableName] = opKey.split('_', 2)

            try {
                if (operation === 'upsert' && items.length > 1) {
                    // Batch upserts
                    const success = await this.syncBatchUpsert(tableName, items.map(i => i.data))
                    if (!success) {
                        items.forEach(item => {
                            item.attempts++
                            if (item.attempts < item.max_attempts) {
                                failedItems.push(item)
                            }
                        })
                    }
                } else {
                    // Process individual operations
                    for (const item of items) {
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
                }
            } catch (error) {
                console.error(`Batch sync error for ${opKey}:`, error)
                items.forEach(item => {
                    item.attempts++
                    if (item.attempts < item.max_attempts) {
                        failedItems.push(item)
                    }
                })
            }
        }

        this.syncQueue = failedItems
        await this.saveSyncQueue()

        this.isSyncing = false
        console.log(`✅ Sync completed. ${failedItems.length} items remaining in queue`)

        // Schedule retry for failed items
        if (failedItems.length > 0) {
            const maxAttempts = Math.max(...failedItems.map(item => item.attempts))
            const retryDelay = this.getRetryDelay(maxAttempts)

            console.log(`⏰ Scheduling retry in ${retryDelay}ms`)
            const timeoutId = setTimeout(() => {
                this.syncPendingChanges()
            }, retryDelay)

            this.retryTimeouts.set('sync', timeoutId)
        }
    }

    async syncBatchUpsert(tableName, dataArray) {
        try {
            const { error } = await supabase
                .from(tableName)
                .upsert(dataArray)

            if (error) throw error

            // Update local records to mark as synced
            for (const data of dataArray) {
                if (data.offline_created) {
                    data.offline_created = false
                    await this.saveData(tableName, data, true) // Skip adding to sync queue
                }
            }

            return true
        } catch (error) {
            console.error(`Batch sync error for ${tableName}:`, error)
            return false
        }
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

        const tables = CONFIG.STORE_NAMES

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

    async getStorageInfo() {
        const usage = await this.getStorageUsage()
        const userSyncQueue = this.syncQueue.filter(item => item.user_id === this.currentUserId)

        return {
            isOnline: this.isOnline,
            currentUserId: this.currentUserId,
            syncQueueLength: userSyncQueue.length,
            dbConnected: !!this.db,
            isSyncing: this.isSyncing,
            storage: {
                used: usage.used,
                available: usage.available,
                percentage: usage.percentage,
                maxSize: usage.maxSize
            },
            syncQueue: {
                total: userSyncQueue.length,
                byOperation: userSyncQueue.reduce((acc, item) => {
                    acc[item.operation] = (acc[item.operation] || 0) + 1
                    return acc
                }, {}),
                byTable: userSyncQueue.reduce((acc, item) => {
                    acc[item.table_name] = (acc[item.table_name] || 0) + 1
                    return acc
                }, {}),
                failed: userSyncQueue.filter(item => item.attempts > 0).length
            },
            performance: {
                metrics: this.performanceMonitor.getMetrics().slice(-10), // Last 10 operations
                averageOperationTime: this.getAverageOperationTime()
            }
        }
    }

    getAverageOperationTime() {
        const metrics = this.performanceMonitor.getMetrics()
        if (metrics.length === 0) return 0

        const validMetrics = metrics.filter(m => m.duration !== null)
        if (validMetrics.length === 0) return 0

        const total = validMetrics.reduce((sum, m) => sum + m.duration, 0)
        return (total / validMetrics.length).toFixed(2)
    }

    // Enhanced diagnostic methods
    async getDiagnostics() {
        try {
            const info = await this.getStorageInfo()
            const tables = {}

            for (const tableName of CONFIG.STORE_NAMES) {
                try {
                    const data = await this.getData(tableName)
                    tables[tableName] = {
                        recordCount: data.length,
                        sizeBytes: this.getDataSizeBytes(data),
                        lastUpdated: data.length > 0 ? Math.max(...data.map(r => new Date(r.updated_at).getTime())) : null
                    }
                } catch (error) {
                    tables[tableName] = { error: error.message }
                }
            }

            // 🔒 SECURITY: Redact sensitive information
            const safeDiagnostics = {
                ...info,
                currentUserId: this.redactUserId(info.currentUserId),
                tables,
                config: {
                    maxRecordSize: CONFIG.MAX_RECORD_SIZE_BYTES,
                    maxTotalStorage: CONFIG.MAX_TOTAL_STORAGE_MB * 1024 * 1024,
                    maxSyncAttempts: CONFIG.MAX_SYNC_ATTEMPTS,
                    syncInterval: CONFIG.SYNC_INTERVAL_MS
                },
                performance: {
                    ...info.performance,
                    metrics: info.performance.metrics.map(m => ({
                        ...m,
                        // Remove any potentially sensitive operation names/IDs
                        operation: m.operation.replace(/[a-f0-9-]{36}/gi, '[UUID]')
                    }))
                },
                timestamp: new Date().toISOString()
            }

            return safeDiagnostics
        } catch (error) {
            this.logger.error('Failed to generate diagnostics', error)
            return {
                error: 'Diagnostics unavailable',
                timestamp: new Date().toISOString()
            }
        }
    }

    scheduleSync(delayMs = CONFIG.INITIAL_SYNC_DELAY_MS) {
        if (!this.isOnline || this.isSyncing) return

        setTimeout(() => {
            if (this.isOnline && !this.isSyncing) {
                this.syncPendingChanges()
            }
        }, delayMs)
    }

    clearRetryTimeouts() {
        for (const timeout of this.retryTimeouts.values()) {
            clearTimeout(timeout)
        }
        this.retryTimeouts.clear()
    }

    getRetryDelay(attempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        return Math.min(1000 * Math.pow(2, attempts), CONFIG.MAX_RETRY_DELAY_MS)
    }

    // Public API methods for session management
    async refreshSessionFromApp(sessionToken) {
        if (sessionToken && typeof sessionToken === 'string') {
            this.refreshSession(sessionToken)
            return true
        }
        return false
    }

    // Get current session status for debugging
    getSessionStatus() {
        const now = Date.now()
        const sessionAge = this.initTimestamp ? now - this.initTimestamp : 0
        const isExpired = this.initTimestamp ? sessionAge > this.maxSessionDuration : true

        return {
            hasUserId: !!this.currentUserId,
            hasSessionToken: !!this.sessionToken,
            sessionAge: sessionAge,
            maxDuration: this.maxSessionDuration,
            isExpired: isExpired,
            canRead: !!this.currentUserId,
            canWrite: !isExpired && !!this.sessionToken
        }
    }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage()

// Convenience functions for common operations
export const offlineDB = {
    // Initialize offline storage
    async init(userId, sessionToken = null) {
        return await offlineStorage.init(userId, sessionToken)
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

    async getStatus() {
        return await offlineStorage.getStorageInfo()
    },

    async getDiagnostics() {
        return await offlineStorage.getDiagnostics()
    },

    // Storage management
    async getStorageUsage() {
        return await offlineStorage.getStorageUsage()
    },

    async clearMetrics() {
        return offlineStorage.performanceMonitor.clearMetrics()
    },

    setLogLevel(level) {
        return offlineStorage.logger.setLevel(level)
    }
}