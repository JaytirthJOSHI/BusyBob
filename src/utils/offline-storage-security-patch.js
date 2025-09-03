
class OfflineStorage {
    constructor() {
        this.sessionToken = null
        this.initTimestamp = null
        this.maxSessionDuration = 24 * 60 * 60 * 1000
    }

    async init(userId, sessionToken = null) {
        if (!this.validateUserId(userId)) {
            throw new OfflineStorageError('Invalid user ID format', 'INVALID_USER_ID')
        }

        if (sessionToken && !this.validateSession(sessionToken)) {
            throw new OfflineStorageError('Invalid session token', 'INVALID_SESSION')
        }

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

    validateUserId(userId) {
        if (!userId || typeof userId !== 'string') return false
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(userId)
    }

    validateSession(sessionToken) {
        if (!sessionToken || typeof sessionToken !== 'string') return false
        if (sessionToken.length < 32) return false
        
        if (this.initTimestamp && (Date.now() - this.initTimestamp) > this.maxSessionDuration) {
            this.logger.warn('Session expired')
            return false
        }
        
        return true
    }

    sanitizeData(data) {
        const sanitized = {}
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof key !== 'string' || key.startsWith('__')) continue
            
            const cleanKey = this.sanitizeString(key)
            if (!cleanKey) continue
            
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
            return this.sanitizeData(value)
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item))
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            return value
        }
        
        this.logger.warn('Rejected unsupported data type', { type: typeof value })
        return null
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return null
        
        const cleaned = str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:text\/html/gi, '')
            .trim()
        
        if (cleaned.length > 10000) {
            throw new OfflineStorageError('String too long', 'STRING_TOO_LONG')
        }
        
        return cleaned
    }

    async saveData(tableName, data, skipSync = false) {
        if (!this.validateSession(this.sessionToken)) {
            throw new OfflineStorageError('Session expired', 'SESSION_EXPIRED')
        }

        if (!this.hasTablePermission(tableName, 'write')) {
            throw new OfflineStorageError('Insufficient permissions', 'PERMISSION_DENIED')
        }

        await this.checkRateLimit('saveData')

    }

    hasTablePermission(tableName, operation) {
        const permissions = {
            'tasks': ['read', 'write', 'delete'],
            'journal_entries': ['read', 'write', 'delete'],
            'feelings': ['read', 'write'],
            'kid_mode_settings': ['read', 'write'],
            'ai_notes': ['read', 'write', 'delete'],
            'sync_queue': ['read', 'write'],
            'user_metadata': ['read', 'write']
        }

        const tablePerms = permissions[tableName]
        return tablePerms && tablePerms.includes(operation)
    }

    async checkRateLimit(operation) {
        if (!this.rateLimiters) {
            this.rateLimiters = new Map()
        }

        const key = `${operation}_${this.currentUserId}`
        const now = Date.now()
        const windowMs = 60000
        const maxRequests = 100

        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, { count: 1, windowStart: now })
            return
        }

        const limiter = this.rateLimiters.get(key)
        
        if (now - limiter.windowStart > windowMs) {
            limiter.count = 1
            limiter.windowStart = now
        } else {
            limiter.count++
            if (limiter.count > maxRequests) {
                throw new OfflineStorageError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED')
            }
        }
    }

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

    async queueForSync(tableName, operation, data) {
        const allowedOperations = ['upsert', 'delete']
        if (!allowedOperations.includes(operation)) {
            throw new OfflineStorageError('Invalid sync operation', 'INVALID_OPERATION')
        }

        this.validateTableName(tableName)

        if (!this.hasTablePermission(tableName, operation === 'delete' ? 'delete' : 'write')) {
            throw new OfflineStorageError('Insufficient sync permissions', 'SYNC_PERMISSION_DENIED')
        }

        await this.checkRateLimit('sync')

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

    async getDiagnostics() {
        try {
            const info = await this.getStorageInfo()
            
            const safeDiagnostics = {
                ...info,
                currentUserId: this.redactUserId(info.currentUserId),
                performance: {
                    ...info.performance,
                    metrics: info.performance.metrics.map(m => ({
                        ...m,
                        operation: m.operation.replace(/[a-f0-9-]{36}/gi, '[UUID]')
                    }))
                },
                tables: Object.fromEntries(
                    Object.entries(info.tables || {}).map(([name, data]) => [
                        name,
                        {
                            ...data,
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

const SECURITY_CONFIG = {
    MAX_STRING_LENGTH: 10000,
    MAX_OPERATIONS_PER_MINUTE: 100,
    SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,
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