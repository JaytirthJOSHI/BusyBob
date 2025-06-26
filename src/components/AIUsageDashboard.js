// AI Usage Dashboard Component
// Shows usage statistics for Hack Club AI vs Groq

import hybridAI from '../lib/hybrid-ai-service.js'

class AIUsageDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initialize();
    }

    initialize() {
        this.createDashboardHTML();
        this.updateStats();
        this.startAutoUpdate();
    }

    createDashboardHTML() {
        this.container.innerHTML = `
            <div class="ai-usage-dashboard">
                <h3>🤖 AI Service Usage</h3>
                <div class="usage-stats">
                    <div class="stat-card hackclub">
                        <div class="stat-icon">🆓</div>
                        <div class="stat-content">
                            <h4>Hack Club AI</h4>
                            <p class="stat-number" id="hackclub-requests">0</p>
                            <p class="stat-label">Free requests</p>
                        </div>
                    </div>
                    <div class="stat-card groq">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-content">
                            <h4>Groq</h4>
                            <p class="stat-number" id="groq-requests">0</p>
                            <p class="stat-label">Specialized requests</p>
                        </div>
                    </div>
                </div>
                <div class="usage-breakdown">
                    <h4>Usage Breakdown</h4>
                    <div class="progress-bar">
                        <div class="progress-hackclub" id="hackclub-progress" style="width: 0%"></div>
                        <div class="progress-groq" id="groq-progress" style="width: 0%"></div>
                    </div>
                    <div class="breakdown-labels">
                        <span class="label-hackclub">🆓 Hack Club AI: <span id="hackclub-percentage">0%</span></span>
                        <span class="label-groq">⚡ Groq: <span id="groq-percentage">0%</span></span>
                    </div>
                </div>
                <div class="service-info">
                    <div class="info-item">
                        <strong>Hack Club AI:</strong> Free, unlimited requests for LLM tasks
                    </div>
                    <div class="info-item">
                        <strong>Groq:</strong> Used for specialized features (speech-to-text, etc.)
                    </div>
                </div>
                <button class="refresh-btn" onclick="window.aiUsageDashboard.updateStats()">
                    🔄 Refresh Stats
                </button>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-usage-dashboard {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin: 20px 0;
            }

            .ai-usage-dashboard h3 {
                margin: 0 0 20px 0;
                color: #333;
                font-size: 18px;
            }

            .usage-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }

            .stat-card {
                display: flex;
                align-items: center;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }

            .stat-card.hackclub {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }

            .stat-card.groq {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }

            .stat-icon {
                font-size: 24px;
                margin-right: 12px;
            }

            .stat-content h4 {
                margin: 0 0 5px 0;
                font-size: 14px;
                opacity: 0.9;
            }

            .stat-number {
                margin: 0 0 2px 0;
                font-size: 24px;
                font-weight: bold;
            }

            .stat-label {
                margin: 0;
                font-size: 12px;
                opacity: 0.8;
            }

            .usage-breakdown {
                margin-bottom: 20px;
            }

            .usage-breakdown h4 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 14px;
            }

            .progress-bar {
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 10px;
            }

            .progress-hackclub {
                height: 100%;
                background: #4CAF50;
                transition: width 0.3s ease;
            }

            .progress-groq {
                height: 100%;
                background: #2196F3;
                transition: width 0.3s ease;
            }

            .breakdown-labels {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #666;
            }

            .label-hackclub {
                color: #4CAF50;
                font-weight: 500;
            }

            .label-groq {
                color: #2196F3;
                font-weight: 500;
            }

            .service-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }

            .info-item {
                margin-bottom: 8px;
                font-size: 13px;
                color: #555;
            }

            .info-item:last-child {
                margin-bottom: 0;
            }

            .refresh-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }

            .refresh-btn:hover {
                background: #0056b3;
            }
        `;
        document.head.appendChild(style);
    }

    updateStats() {
        const stats = hybridAI.getUsageStats();
        
        // Update numbers
        document.getElementById('hackclub-requests').textContent = stats.hackClubRequests;
        document.getElementById('groq-requests').textContent = stats.groqRequests;
        
        // Update percentages
        document.getElementById('hackclub-percentage').textContent = `${stats.hackClubPercentage}%`;
        document.getElementById('groq-percentage').textContent = `${stats.groqPercentage}%`;
        
        // Update progress bars
        document.getElementById('hackclub-progress').style.width = `${stats.hackClubPercentage}%`;
        document.getElementById('groq-progress').style.width = `${stats.groqPercentage}%`;
    }

    startAutoUpdate() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }
}

// Create and export instance
const aiUsageDashboard = new AIUsageDashboard('ai-usage-dashboard');

// Expose for global access
window.aiUsageDashboard = aiUsageDashboard;

export default aiUsageDashboard; 