export class TermsOfService {
  constructor() {
    this.initializeHTML()
  }

  initializeHTML() {
    const container = document.getElementById('terms-of-service-page')
    if (container) {
      container.innerHTML = this.getTermsOfServiceHTML()
      this.setupEventListeners()
    }
  }

  setupEventListeners() {
    const backBtn = document.getElementById('terms-back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Check if we came from within the app or from a direct URL
        if (document.referrer && document.referrer.includes(window.location.origin)) {
          window.history.back()
        } else {
          // If accessed directly, go to home
          window.location.href = '/'
        }
      })
    }
  }

  getTermsOfServiceHTML() {
    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div class="flex items-center mb-6">
            <button id="terms-back-btn" class="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          </div>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <strong>Last updated:</strong> ${new Date().toLocaleDateString()}
            </p>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>By accessing and using BusyBob ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                <p>These Terms of Service apply to all users of the Service, including without limitation users who are browsers, students, teachers, or contributors of content.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>BusyBob is an academic management platform that provides:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Task and assignment management</li>
                  <li>Grade tracking and analytics</li>
                  <li>Calendar and scheduling tools</li>
                  <li>Mood and wellness tracking</li>
                  <li>Journal and reflection features</li>
                  <li>Integration with StudentVue and Canvas systems</li>
                </ul>
                <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>To use certain features of the Service, you must create an account. You agree to:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
                <p>You must be at least 13 years old to create an account. If you are under 18, you must have parental consent.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Acceptable Use</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>You agree not to use the Service to:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Upload or transmit malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use the Service for commercial purposes without permission</li>
                  <li>Share your account credentials with others</li>
                </ul>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Academic Data Integration</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>Our Service integrates with educational platforms like StudentVue and Canvas. By using these integrations:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>You authorize us to access and sync your academic data</li>
                  <li>You understand that we store this data to provide our services</li>
                  <li>You acknowledge that the accuracy of data depends on your school's systems</li>
                  <li>You agree to comply with your school's terms of service</li>
                  <li>You can revoke access to your academic data at any time</li>
                </ul>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Privacy and Data Protection</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
                <p>By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Intellectual Property</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>The Service and its original content, features, and functionality are owned by BusyBob and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
                <p>You retain ownership of any content you submit to the Service, but you grant us a license to use, modify, and display that content in connection with providing the Service.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Disclaimers</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p><strong>Service Availability:</strong> We strive to maintain high availability but cannot guarantee uninterrupted access to the Service.</p>
                <p><strong>Data Accuracy:</strong> While we work to ensure data accuracy, we cannot guarantee that all information is error-free or up-to-date.</p>
                <p><strong>Educational Outcomes:</strong> Our Service is a tool to assist with academic management, but we do not guarantee improved grades or academic performance.</p>
                <p><strong>Third-Party Services:</strong> We are not responsible for the content or practices of third-party services we integrate with.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>To the maximum extent permitted by law, BusyBob shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.</p>
                <p>Our total liability to you for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Termination</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms.</p>
                <p>Upon termination, your right to use the Service will cease immediately. We will delete your account and associated data within 30 days, except where required by law.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to Terms</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.</p>
                <p>Your continued use of the Service after any changes constitutes acceptance of the new Terms.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Governing Law</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which BusyBob operates, without regard to its conflict of law provisions.</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Contact Information</h2>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <p>If you have any questions about these Terms of Service, please contact us:</p>
                <ul class="list-disc pl-6 space-y-2">
                  <li>Email: legal@busybob.app</li>
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