export class PrivacyPolicy {
  constructor() {
    this.initializeHTML()
  }

  initializeHTML() {
    const container = document.getElementById('privacy-policy-page')
    if (container) {
      container.innerHTML = this.getPrivacyPolicyHTML()
      this.setupEventListeners()
    }
  }

  setupEventListeners() {
    const backBtn = document.getElementById('privacy-back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (document.referrer && document.referrer.includes(window.location.origin)) {
          window.history.back()
        } else {
          window.location.href = '/'
        }
      })
    }
  }

  getPrivacyPolicyHTML() {
    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div class="flex items-center mb-6">
            <button id="privacy-back-btn" class="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            <div class="flex items-center gap-2">
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">✅ Direct URL access working</p>
              <a href="/privacy-policy.html" target="_blank" class="text-sm text-purple-600 hover:text-purple-800 underline">View Full Policy</a>
            </div>
          </div>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <strong>Last updated:</strong> ${new Date().toLocaleDateString()}
            </p>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p><strong>Personal Information:</strong> When you create an account, we collect your email address and basic profile information.</p>
                <p><strong>Academic Data:</strong> With your permission, we may access and store academic information from your school's StudentVue or Canvas accounts, including grades, assignments, and course schedules.</p>
                <p><strong>Usage Data:</strong> We collect information about how you use our application, including task completion, mood logs, and journal entries.</p>
                <p><strong>Device Information:</strong> We may collect information about your device, browser type, and IP address for security and analytics purposes.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We use the information we collect to:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our academic management services</li>
                  <li>Sync your academic data across platforms</li>
                  <li>Generate insights and analytics about your academic performance</li>
                  <li>Send you important updates about your account and our services</li>
                  <li>Improve our application and develop new features</li>
                  <li>Ensure the security and integrity of our platform</li>
                </ul>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Data Sharing and Disclosure</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist us in operating our platform</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                  <li><strong>Academic Institutions:</strong> We may share data with your school's systems (StudentVue, Canvas) as part of our integration services</li>
                  <li><strong>Consent:</strong> We may share information with your explicit consent</li>
                </ul>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We implement appropriate security measures to protect your personal information:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication measures</li>
                  <li>Secure hosting infrastructure</li>
                </ul>
                <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Your Rights</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>You have the right to:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Opt out of certain data collection and processing</li>
                  <li>Export your data in a portable format</li>
                </ul>
                <p>To exercise these rights, please contact us through the settings page or email us directly.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We retain your personal information for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain certain information for legal or regulatory purposes.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Children's Privacy</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>Our service is designed for students and educational use. If you are under 13 years old, please ensure you have parental consent before using our services. We do not knowingly collect personal information from children under 13 without parental consent.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Changes to This Policy</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Contact Us</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Email: privacy@busybob.app</li>
                  <li>Through the app: Settings → Contact Support</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    `
  }
}