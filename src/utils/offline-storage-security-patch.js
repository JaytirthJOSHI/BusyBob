// SECURITY PATCH FOR OFFLINE STORAGE
// Apply these fixes to src/utils/offline-storage.js

// 1. Add secure user validation
class OfflineStorage {
    constructor() {
        // ... existing code ...
        this.sessionToken = null // Add session validation
        this.initTimestamp = null
        this.maxSessionDuration = 24 * 60 * 60 * 1000 // 24 hours
    }

    // 🔒 CRITICAL FIX: Secure user initialization
    async init(userId, sessionToken = null) {
        // Validate user ID format
        if (!this.validateUserId(userId)) {
            throw new OfflineStorageError('Invalid user ID format', 'INVALID_USER_ID')
        }

        // Validate session if provided
        if (sessionToken && !this.validateSession(sessionToken)) {
            throw new OfflineStorageError('Invalid session token', 'INVALID_SESSION')
        }

        // Verify user exists in Supabase before allowing offline access
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .single()
            
            if (error || !user) {
                throw new OfflineStorageError('User verification failed', 'USER_NOT_FOUND')
            }
        } catch (error) {
            throw new OfflineStorageError('Failed to verify user', 'USER_VERIFICATION_ERROR', error)
        }

        this.currentUserId = userId
        this.sessionToken = sessionToken
        this.initTimestamp = Date.now()
        
        this.db = await this.openDB()
        await this.loadSyncQueue()
        
        if (this.isOnline) {
            await this.syncPendingChanges()
        }
        
        this.logger.info('Offline storage initialized', { userId: this.redactUserId(userId) })
    }

    // 🔒 User ID validation
    validateUserId(userId) {
        if (!userId || typeof userId !== 'string') return false
        
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(userId)
    }

    // 🔒 Session validation
    validateSession(sessionToken) {
        if (!sessionToken || typeof sessionToken !== 'string') return false
        if (sessionToken.length < 32) return false // Minimum token length
        
        // Check session age
        if (this.initTimestamp && (Date.now() - this.initTimestamp) > this.maxSessionDuration) {
            this.logger.warn('Session expired')
            return false
        }
        
        return true
    }

    // 🔒 Enhanced data sanitization
    sanitizeData(data) {
        const sanitized = {}
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof key !== 'string' || key.startsWith('__')) continue
            
            // Sanitize the key
            const cleanKey = this.sanitizeString(key)
            if (!cleanKey) continue
            
            // Sanitize the value
            sanitized[cleanKey] = this.sanitizeValue(value)
        }
        
        return sanitized
    }

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

    sanitizeString(str) {
        if (typeof str !== 'string') return null
        
        // Remove potential XSS vectors
        const cleaned = str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/data:text\/html/gi, '') // Remove data URLs
            .trim()
        
        // Length validation
        if (cleaned.length > 10000) { // 10KB limit per string
            throw new OfflineStorageError('String too long', 'STRING_TOO_LONG')
        }
        
        return cleaned
    }

    // 🔒 Enhanced operation validation
    async saveData(tableName, data, skipSync = false) {
        // Check session validity
        if (!this.validateSession(this.sessionToken)) {
            throw new OfflineStorageError('Session expired', 'SESSION_EXPIRED')
        }

        // Validate table permissions
        if (!this.hasTablePermission(tableName, 'write')) {
            throw new OfflineStorageError('Insufficient permissions', 'PERMISSION_DENIED')
        }

        // Rate limiting
        await this.checkRateLimit('saveData')

        // ... rest of existing saveData logic with security fixes applied ...
    }

    // 🔒 Permission system
    hasTablePermission(tableName, operation) {
        // Define table permissions
        const permissions = {
            'tasks': ['read', 'write', 'delete'],
            'journal_entries': ['read', 'write', 'delete'],
            'feelings': ['read', 'write'],
            'kid_mode_settings': ['read', 'write'],
            'ai_notes': ['read', 'write', 'delete'],
            'sync_queue': ['read', 'write'], // Internal use only
            'user_metadata': ['read', 'write']
        }

        const tablePerms = permissions[tableName]
        return tablePerms && tablePerms.includes(operation)
    }

    // 🔒 Rate limiting
    async checkRateLimit(operation) {
        if (!this.rateLimiters) {
            this.rateLimiters = new Map()
        }

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

    // 🔒 Secure logging with data redaction
    redactUserId(userId) {
        if (!userId || userId.length < 8) return '[REDACTED]'
        return userId.substring(0, 4) + '****' + userId.substring(userId.length - 4)
    }

    redactSensitiveData(data) {
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential']
        const redacted = { ...data }
        
        for (const field of sensitiveFields) {
            if (field in redacted) {
                redacted[field] = '[REDACTED]'
            }
        }
        
        return redacted
    }

    // 🔒 Enhanced sync validation
    async queueForSync(tableName, operation, data) {
        // Validate operation type
        const allowedOperations = ['upsert', 'delete']
        if (!allowedOperations.includes(operation)) {
            throw new OfflineStorageError('Invalid sync operation', 'INVALID_OPERATION')
        }

        // Validate table name
        this.validateTableName(tableName)

        // Check permissions
        if (!this.hasTablePermission(tableName, operation === 'delete' ? 'delete' : 'write')) {
            throw new OfflineStorageError('Insufficient sync permissions', 'SYNC_PERMISSION_DENIED')
        }

        // Rate limit sync operations
        await this.checkRateLimit('sync')

        // Sanitize sync data
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
        
        if (this.isOnline) {
            setTimeout(() => this.syncPendingChanges(), 100)
        }
    }

    // 🔒 Secure diagnostics
    async getDiagnostics() {
        try {
            const info = await this.getStorageInfo()
            
            // Redact sensitive information
            const safeDiagnostics = {
                ...info,
                currentUserId: this.redactUserId(info.currentUserId),
                performance: {
                    ...info.performance,
                    metrics: info.performance.metrics.map(m => ({
                        ...m,
                        // Remove any potentially sensitive operation names
                        operation: m.operation.replace(/[a-f0-9-]{36}/gi, '[UUID]')
                    }))
                },
                tables: Object.fromEntries(
                    Object.entries(info.tables || {}).map(([name, data]) => [
                        name,
                        {
                            ...data,
                            // Don't expose actual record contents
                            recordCount: data.recordCount,
                            sizeBytes: data.sizeBytes,
                            lastUpdated: data.lastUpdated
                        }
                    ])
                )
            }
            
            return safeDiagnostics
        } catch (error) {
            this.logger.error('Failed to generate secure diagnostics', error)
            return { 
                error: 'Diagnostics unavailable', 
                timestamp: new Date().toISOString() 
            }
        }
    }
}

// 🔒 ADDITIONAL SECURITY CONSTANTS
const SECURITY_CONFIG = {
    MAX_STRING_LENGTH: 10000,
    MAX_OPERATIONS_PER_MINUTE: 100,
    SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
    SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key', 'auth', 'credential', 'ssn', 'credit_card'],
    ALLOWED_OPERATIONS: ['upsert', 'delete'],
    REQUIRED_PERMISSIONS: {
        'tasks': ['read', 'write', 'delete'],
        'journal_entries': ['read', 'write', 'delete'],
        'feelings': ['read', 'write'],
        'kid_mode_settings': ['read', 'write'],
        'ai_notes': ['read', 'write', 'delete']
    }
}

export { SECURITY_CONFIG }