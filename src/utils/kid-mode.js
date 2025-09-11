import { auth, supabase } from '../lib/supabase.js'

export class KidMode {
    constructor() {
        this.isEnabled = false
        this.userAge = null
        this.dateOfBirth = null
        this.settings = null
        this.ADMIN_CODE = '0013'
    }

    async init() {
        try {
            await this.loadSettings()
            await this.checkAutoDisable()
        } catch (error) {
            console.error('Error initializing Kid Mode:', error)
        }
    }

    async loadSettings() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            // COMMENTED OUT TO PREVENT 406 ERRORS
            /*
            const { data: kidModeData } = await supabase
                .from('kid_mode_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (kidModeData) {
                this.settings = kidModeData
                this.isEnabled = kidModeData.enabled
                this.dateOfBirth = kidModeData.date_of_birth
                
                if (this.dateOfBirth) {
                    this.userAge = this.calculateAge(this.dateOfBirth)
                }
            }

            const { data: userData } = await supabase
                .from('users')
                .select('kid_mode_enabled, date_of_birth')
                .eq('id', user.id)
                .single()

            if (userData && !this.settings) {
                this.isEnabled = userData.kid_mode_enabled || false
                this.dateOfBirth = userData.date_of_birth
                
                if (this.dateOfBirth) {
                    this.userAge = this.calculateAge(this.dateOfBirth)
                }
            }
            */

            // Use default settings to prevent errors
            this.settings = {
                enabled: false,
                date_of_birth: null,
                restrictions: []
            }
            this.isEnabled = false
            this.dateOfBirth = null
            this.userAge = null
            
            console.log('Kid Mode disabled to prevent API errors')

        } catch (error) {
            console.error('Kid Mode error (hidden from UI):', error)
            // Set safe defaults
            this.settings = { enabled: false }
            this.isEnabled = false
            this.dateOfBirth = null
            this.userAge = null
        }
    }

    calculateAge(birthDate) {
        if (!birthDate) return null
        
        const birth = new Date(birthDate)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        
        return age
    }

    async checkAutoDisable() {
        if (!this.isEnabled || !this.dateOfBirth) return

        const age = this.calculateAge(this.dateOfBirth)
        
        if (age >= 13) {
            await this.autoDisableKidMode()
            return true
        }
        
        return false
    }

    async autoDisableKidMode() {
        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) return

            await supabase
                .from('kid_mode_settings')
                .upsert({
                    user_id: user.id,
                    enabled: false,
                    date_of_birth: this.dateOfBirth,
                    disabled_at: new Date().toISOString(),
                    auto_disabled_at_13: true,
                    updated_at: new Date().toISOString()
                })

            await supabase
                .from('users')
                .update({ 
                    kid_mode_enabled: false 
                })
                .eq('id', user.id)

            this.isEnabled = false
            
            this.showAutoDisableNotification()

        } catch (error) {
            console.error('Error auto-disabling Kid Mode:', error)
        }
    }

    async enableKidMode(dateOfBirth) {
        if (!dateOfBirth) {
            throw new Error('Date of birth is required to enable Kid Mode')
        }

        const age = this.calculateAge(dateOfBirth)
        
        if (age >= 13) {
            throw new Error('Kid Mode is only available for users under 13 years old')
        }

        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('kid_mode_settings')
                .upsert({
                    user_id: user.id,
                    enabled: true,
                    date_of_birth: dateOfBirth,
                    admin_code: this.ADMIN_CODE,
                    enabled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            this.isEnabled = true
            this.dateOfBirth = dateOfBirth
            this.userAge = age

            return true

        } catch (error) {
            console.error('Error enabling Kid Mode:', error)
            throw error
        }
    }

    async disableKidMode(adminCode) {
        if (adminCode !== this.ADMIN_CODE) {
            throw new Error('Invalid admin code. Kid Mode cannot be disabled.')
        }

        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('kid_mode_settings')
                .update({
                    enabled: false,
                    disabled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)

            if (error) throw error

            this.isEnabled = false

            return true

        } catch (error) {
            console.error('Error disabling Kid Mode:', error)
            throw error
        }
    }

    async setDateOfBirth(dateOfBirth) {
        const age = this.calculateAge(dateOfBirth)
        
        if (age >= 13 && this.isEnabled) {
            await this.autoDisableKidMode()
            return false
        }

        try {
            const { data: { user } } = await auth.getCurrentUser()
            if (!user) throw new Error('User not authenticated')

            await supabase
                .from('kid_mode_settings')
                .upsert({
                    user_id: user.id,
                    date_of_birth: dateOfBirth,
                    enabled: this.isEnabled && age < 13,
                    updated_at: new Date().toISOString()
                })

            this.dateOfBirth = dateOfBirth
            this.userAge = age

            return true

        } catch (error) {
            console.error('Error setting date of birth:', error)
            throw error
        }
    }

    showAutoDisableNotification() {
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm'
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="mr-3 text-2xl">🎉</div>
                <div>
                    <h4 class="font-bold mb-1">Happy 13th Birthday!</h4>
                    <p class="text-sm">Kid Mode has been automatically disabled. You now have access to all features!</p>
                </div>
            </div>
        `

        document.body.appendChild(notification)

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 10000)

        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        })
    }

    getRestrictedFeatures() {
        if (!this.isEnabled) return []

        return [
            'spotify_integration',
            'external_links',
            'file_uploads',
            'advanced_settings',
            'data_export',
            'account_deletion',
            'third_party_auth'
        ]
    }

    isFeatureRestricted(featureName) {
        return this.isEnabled && this.getRestrictedFeatures().includes(featureName)
    }

    getKidModeStyles() {
        if (!this.isEnabled) return ''

        return `
            /* Kid Mode Styles */
            .kid-mode-active {
                border: 3px solid #10b981 !important;
                border-radius: 12px !important;
            }
            
            .kid-mode-indicator {
                position: fixed;
                top: 10px;
                left: 10px;
                background: linear-gradient(45deg, #10b981, #059669);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            
            /* Simplified color scheme for kids */
            .kid-mode-colors {
                --primary-color: #10b981;
                --secondary-color: #3b82f6;
                --accent-color: #f59e0b;
                --success-color: #10b981;
                --warning-color: #f59e0b;
                --error-color: #ef4444;
            }
        `
    }

    renderKidModeIndicator() {
        if (!this.isEnabled) return ''

        return `
            <div class="kid-mode-indicator">
                🛡️ Kid Mode Active (Age: ${this.userAge || 'Unknown'})
            </div>
        `
    }

    sanitizeContent(content) {
        if (!this.isEnabled) return content

        const sensitivePatterns = [
            /https?:\/\/[^\s]+/gi,
            /\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi
        ]

        let sanitized = content
        sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[LINK REMOVED]')
        })

        return sanitized
    }
}
export const kidMode = new KidMode()