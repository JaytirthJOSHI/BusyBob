export class Journal {
    constructor() {
        this.entries = [];
        this.currentEntry = null;
        this.isEditing = false;
        this.searchQuery = '';
        this.filterMood = 'all';
        this.init();
    }

    async init() {
        await this.loadEntries();
        this.render();
        this.attachEventListeners();
    }

    async loadEntries() {
        try {
            const { data, error } = await window.supabase
                .from('journal_entries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.entries = data || [];
        } catch (error) {
            console.error('Error loading journal entries:', error);
            this.entries = [];
        }
    }

    async saveEntry(entryData) {
        try {
            let result;
            if (entryData.id) {
                // Update existing entry
                const { data, error } = await window.supabase
                    .from('journal_entries')
                    .update({
                        title: entryData.title,
                        content: entryData.content,
                        mood: entryData.mood,
                        tags: entryData.tags,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', entryData.id)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                // Create new entry
                const { data, error } = await window.supabase
                    .from('journal_entries')
                    .insert({
                        title: entryData.title,
                        content: entryData.content,
                        mood: entryData.mood,
                        tags: entryData.tags
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }

            await this.loadEntries();
            return result;
        } catch (error) {
            console.error('Error saving journal entry:', error);
            throw error;
        }
    }

    async deleteEntry(entryId) {
        try {
            const { error } = await window.supabase
                .from('journal_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;
            await this.loadEntries();
        } catch (error) {
            console.error('Error deleting journal entry:', error);
            throw error;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    getMoodIcon(mood) {
        const moodIcons = {
            'excellent': '😊',
            'good': '🙂',
            'neutral': '😐',
            'bad': '😔',
            'terrible': '😢'
        };
        return moodIcons[mood] || '📝';
    }

    getMoodColor(mood) {
        const moodColors = {
            'excellent': '#10b981',
            'good': '#3b82f6',
            'neutral': '#6b7280',
            'bad': '#f59e0b',
            'terrible': '#ef4444'
        };
        return moodColors[mood] || '#6b7280';
    }

    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="journal-container">
                <style>
                    .journal-container {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        background: var(--bg-color, #ffffff);
                        color: var(--text-color, #1f2937);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }

                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                        .journal-container {
                            background: #0f172a;
                            color: #f8fafc;
                        }
                    }

                    .dark .journal-container {
                        background: #0f172a;
                        color: #f8fafc;
                    }

                    .journal-header {
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid var(--border-color, #e2e8f0);
                        background: var(--surface-color, #f8fafc);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .dark .journal-header {
                        background: #1e293b;
                        border-color: #334155;
                    }

                    .header-left h1 {
                        margin: 0 0 0.25rem 0;
                        color: var(--text-color, #1f2937);
                        font-size: 1.875rem;
                        font-weight: 700;
                        letter-spacing: -0.025em;
                    }

                    .dark .header-left h1 {
                        color: #f8fafc;
                    }

                    .header-subtitle {
                        margin: 0;
                        color: var(--text-secondary, #6b7280);
                        font-size: 0.875rem;
                    }

                    .dark .header-subtitle {
                        color: #94a3b8;
                    }

                    .journal-actions {
                        display: flex;
                        gap: 1rem;
                        align-items: center;
                    }

                    .new-entry-btn {
                        background: var(--primary-color, #3b82f6);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .new-entry-btn:hover {
                        background: var(--primary-hover, #2563eb);
                        transform: translateY(-1px);
                    }

                    .journal-content {
                        flex: 1;
                        display: flex;
                        min-height: 0;
                    }

                    .entries-sidebar {
                        width: 400px;
                        border-right: 1px solid var(--border-color, #e2e8f0);
                        background: var(--surface-color, #f8fafc);
                        display: flex;
                        flex-direction: column;
                    }

                    .dark .entries-sidebar {
                        background: #1e293b;
                        border-color: #334155;
                    }

                    .sidebar-header {
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--border-color, #e2e8f0);
                        background: var(--bg-color, #ffffff);
                    }

                    .dark .sidebar-header {
                        background: #0f172a;
                        border-color: #334155;
                    }

                    .search-filter-container {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .search-input {
                        padding: 0.75rem 1rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.5rem;
                        background: var(--bg-color, #ffffff);
                        color: var(--text-color, #1f2937);
                        font-size: 0.875rem;
                        transition: all 0.2s ease;
                    }

                    .search-input:focus {
                        outline: none;
                        border-color: var(--primary-color, #3b82f6);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .dark .search-input {
                        background: #1e293b;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .filter-select {
                        padding: 0.75rem 1rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.5rem;
                        background: var(--bg-color, #ffffff);
                        color: var(--text-color, #1f2937);
                        font-size: 0.875rem;
                        cursor: pointer;
                    }

                    .dark .filter-select {
                        background: #1e293b;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .entries-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1rem;
                    }

                    .entry-item {
                        padding: 1.25rem;
                        border: 1px solid var(--border-color, #e2e8f0);
                        border-radius: 0.75rem;
                        margin-bottom: 1rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        background: var(--bg-color, #ffffff);
                    }

                    .entry-item:hover {
                        border-color: var(--primary-color, #3b82f6);
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    }

                    .entry-item.active {
                        border-color: var(--primary-color, #3b82f6);
                        background: rgba(59, 130, 246, 0.05);
                    }

                    .dark .entry-item {
                        background: #1e293b;
                        border-color: #334155;
                    }

                    .dark .entry-item:hover {
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    }

                    .dark .entry-item.active {
                        background: rgba(59, 130, 246, 0.1);
                    }

                    .entry-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.75rem;
                    }

                    .entry-title {
                        font-weight: 600;
                        color: var(--text-color, #1f2937);
                        font-size: 1rem;
                        margin: 0;
                        line-height: 1.4;
                    }

                    .dark .entry-title {
                        color: #f8fafc;
                    }

                    .entry-mood {
                        font-size: 1.25rem;
                        margin-left: 0.5rem;
                    }

                    .entry-preview {
                        color: var(--text-secondary, #6b7280);
                        font-size: 0.875rem;
                        line-height: 1.5;
                        margin-bottom: 0.75rem;
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                    }

                    .dark .entry-preview {
                        color: #94a3b8;
                    }

                    .entry-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.75rem;
                        color: var(--text-secondary, #9ca3af);
                    }

                    .dark .entry-meta {
                        color: #64748b;
                    }

                    .entry-tags {
                        display: flex;
                        gap: 0.25rem;
                        flex-wrap: wrap;
                    }

                    .entry-tag {
                        background: var(--primary-color, #3b82f6);
                        color: white;
                        padding: 0.125rem 0.5rem;
                        border-radius: 0.25rem;
                        font-size: 0.75rem;
                        font-weight: 500;
                    }

                    .entry-editor {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        background: var(--bg-color, #ffffff);
                    }

                    .dark .entry-editor {
                        background: #0f172a;
                    }

                    .editor-header {
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid var(--border-color, #e2e8f0);
                        background: var(--surface-color, #f8fafc);
                    }

                    .dark .editor-header {
                        background: #1e293b;
                        border-color: #334155;
                    }

                    .editor-controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }

                    .mood-selector {
                        display: flex;
                        gap: 0.5rem;
                    }

                    .mood-option {
                        padding: 0.5rem;
                        border: 2px solid transparent;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-size: 1.25rem;
                    }

                    .mood-option:hover {
                        background: rgba(0, 0, 0, 0.05);
                    }

                    .mood-option.selected {
                        border-color: var(--primary-color, #3b82f6);
                        background: rgba(59, 130, 246, 0.1);
                    }

                    .dark .mood-option:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .editor-actions {
                        display: flex;
                        gap: 0.75rem;
                    }

                    .btn {
                        padding: 0.5rem 1rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.375rem;
                        background: var(--surface-color, #f9fafb);
                        color: var(--text-color, #1f2937);
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }

                    .btn:hover {
                        background: var(--border-color, #e5e7eb);
                    }

                    .btn-primary {
                        background: var(--primary-color, #3b82f6);
                        color: white;
                        border-color: var(--primary-color, #3b82f6);
                    }

                    .btn-primary:hover {
                        background: var(--primary-hover, #2563eb);
                    }

                    .btn-danger {
                        background: #ef4444;
                        color: white;
                        border-color: #ef4444;
                    }

                    .btn-danger:hover {
                        background: #dc2626;
                    }

                    .dark .btn {
                        background: #374151;
                        border-color: #4b5563;
                        color: #f9fafb;
                    }

                    .dark .btn:hover {
                        background: #4b5563;
                    }

                    .editor-content {
                        flex: 1;
                        padding: 2rem;
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }

                    .title-input {
                        padding: 1rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.5rem;
                        font-size: 1.5rem;
                        font-weight: 600;
                        background: var(--surface-color, #f9fafb);
                        color: var(--text-color, #1f2937);
                        transition: all 0.2s ease;
                    }

                    .title-input:focus {
                        outline: none;
                        border-color: var(--primary-color, #3b82f6);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .dark .title-input {
                        background: #1e293b;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .content-textarea {
                        flex: 1;
                        padding: 1.5rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.5rem;
                        background: var(--surface-color, #f9fafb);
                        color: var(--text-color, #1f2937);
                        font-family: inherit;
                        font-size: 1rem;
                        line-height: 1.7;
                        resize: none;
                        transition: all 0.2s ease;
                    }

                    .content-textarea:focus {
                        outline: none;
                        border-color: var(--primary-color, #3b82f6);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .dark .content-textarea {
                        background: #1e293b;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .tags-input {
                        padding: 0.75rem;
                        border: 1px solid var(--border-color, #d1d5db);
                        border-radius: 0.5rem;
                        background: var(--surface-color, #f9fafb);
                        color: var(--text-color, #1f2937);
                        font-size: 0.875rem;
                        transition: all 0.2s ease;
                    }

                    .tags-input:focus {
                        outline: none;
                        border-color: var(--primary-color, #3b82f6);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .dark .tags-input {
                        background: #1e293b;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .empty-state {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 3rem;
                        color: var(--text-secondary, #6b7280);
                    }

                    .dark .empty-state {
                        color: #94a3b8;
                    }

                    .empty-icon {
                        font-size: 4rem;
                        margin-bottom: 1.5rem;
                        opacity: 0.5;
                    }

                    .empty-title {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        color: var(--text-color, #1f2937);
                    }

                    .dark .empty-title {
                        color: #f8fafc;
                    }

                    .empty-description {
                        font-size: 1rem;
                        line-height: 1.6;
                        max-width: 400px;
                        margin-bottom: 2rem;
                    }

                    @media (max-width: 768px) {
                        .journal-content {
                            flex-direction: column;
                        }
                        
                        .entries-sidebar {
                            width: 100%;
                            height: 300px;
                        }
                        
                        .journal-header {
                            padding: 1rem;
                        }
                        
                        .editor-content {
                            padding: 1rem;
                        }
                    }
                </style>

                <div class="journal-header">
                    <div class="header-left">
                        <h1>Journal</h1>
                        <p class="header-subtitle">Reflect on your day and track your mood</p>
                    </div>
                    <div class="journal-actions">
                        <button class="new-entry-btn" id="newEntryBtn">
                            <span>✏️</span>
                            New Entry
                        </button>
                    </div>
                </div>

                <div class="journal-content">
                    <div class="entries-sidebar">
                        <div class="sidebar-header">
                            <div class="search-filter-container">
                                <input 
                                    type="text" 
                                    class="search-input" 
                                    id="searchInput"
                                    placeholder="Search entries..."
                                >
                                <select class="filter-select" id="moodFilter">
                                    <option value="all">All moods</option>
                                    <option value="excellent">😊 Excellent</option>
                                    <option value="good">🙂 Good</option>
                                    <option value="neutral">😐 Neutral</option>
                                    <option value="bad">😔 Bad</option>
                                    <option value="terrible">😢 Terrible</option>
                                </select>
                            </div>
                        </div>
                        <div class="entries-list" id="entriesList">
                            ${this.renderEntriesList()}
                        </div>
                    </div>

                    <div class="entry-editor" id="entryEditor">
                        ${this.renderEntryEditor()}
                    </div>
                </div>
            </div>
        `;
    }

    renderEntriesList() {
        if (this.entries.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">No journal entries yet</div>
                    <div class="empty-description">
                        Start your journaling journey by creating your first entry. 
                        Track your mood, thoughts, and experiences.
                    </div>
                </div>
            `;
        }

        const filteredEntries = this.entries.filter(entry => {
            const matchesSearch = !this.searchQuery || 
                entry.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                entry.content.toLowerCase().includes(this.searchQuery.toLowerCase());
            
            const matchesMood = this.filterMood === 'all' || entry.mood === this.filterMood;
            
            return matchesSearch && matchesMood;
        });

        if (filteredEntries.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No entries found</div>
                    <div class="empty-description">
                        Try adjusting your search or mood filter to find what you're looking for.
                    </div>
                </div>
            `;
        }

        return filteredEntries.map(entry => `
            <div class="entry-item ${this.currentEntry?.id === entry.id ? 'active' : ''}" 
                 data-entry-id="${entry.id}">
                <div class="entry-header">
                    <h3 class="entry-title">${entry.title || 'Untitled Entry'}</h3>
                    <span class="entry-mood">${this.getMoodIcon(entry.mood)}</span>
                </div>
                <div class="entry-preview">
                    ${entry.content ? entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '') : 'No content'}
                </div>
                <div class="entry-meta">
                    <div class="entry-tags">
                        ${entry.tags ? entry.tags.map(tag => 
                            `<span class="entry-tag">${tag}</span>`
                        ).join('') : ''}
                    </div>
                    <span>${this.formatDate(entry.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    renderEntryEditor() {
        if (!this.currentEntry && !this.isEditing) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📖</div>
                    <div class="empty-title">Select an entry to view</div>
                    <div class="empty-description">
                        Choose an entry from the sidebar to read or edit, 
                        or create a new entry to get started.
                    </div>
                </div>
            `;
        }

        const entry = this.currentEntry || {};
        const moods = ['excellent', 'good', 'neutral', 'bad', 'terrible'];

        return `
            <div class="editor-header">
                <div class="editor-controls">
                    <div class="mood-selector">
                        ${moods.map(mood => `
                            <div class="mood-option ${entry.mood === mood ? 'selected' : ''}" 
                                 data-mood="${mood}" 
                                 style="color: ${this.getMoodColor(mood)}">
                                ${this.getMoodIcon(mood)}
                            </div>
                        `).join('')}
                    </div>
                    <div class="editor-actions">
                        ${entry.id ? `
                            <button class="btn btn-danger" id="deleteEntryBtn">Delete</button>
                        ` : ''}
                        <button class="btn" id="cancelEditBtn">Cancel</button>
                        <button class="btn btn-primary" id="saveEntryBtn">Save</button>
                    </div>
                </div>
            </div>
            <div class="editor-content">
                <input 
                    type="text" 
                    class="title-input" 
                    id="entryTitle"
                    placeholder="Entry title..."
                    value="${entry.title || ''}"
                >
                <textarea 
                    class="content-textarea" 
                    id="entryContent"
                    placeholder="Write about your day, thoughts, feelings..."
                >${entry.content || ''}</textarea>
                <input 
                    type="text" 
                    class="tags-input" 
                    id="entryTags"
                    placeholder="Tags (comma separated)..."
                    value="${entry.tags ? entry.tags.join(', ') : ''}"
                >
            </div>
        `;
    }

    attachEventListeners() {
        // New entry button
        document.getElementById('newEntryBtn')?.addEventListener('click', () => {
            this.startNewEntry();
        });

        // Search and filter
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateEntriesList();
        });

        document.getElementById('moodFilter')?.addEventListener('change', (e) => {
            this.filterMood = e.target.value;
            this.updateEntriesList();
        });

        // Entry selection
        document.addEventListener('click', (e) => {
            const entryItem = e.target.closest('.entry-item');
            if (entryItem) {
                const entryId = entryItem.dataset.entryId;
                this.selectEntry(entryId);
            }
        });

        // Mood selection
        document.addEventListener('click', (e) => {
            const moodOption = e.target.closest('.mood-option');
            if (moodOption) {
                const mood = moodOption.dataset.mood;
                this.selectMood(mood);
            }
        });

        // Save entry
        document.getElementById('saveEntryBtn')?.addEventListener('click', () => {
            this.saveCurrentEntry();
        });

        // Cancel edit
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
            this.cancelEdit();
        });

        // Delete entry
        document.getElementById('deleteEntryBtn')?.addEventListener('click', () => {
            this.deleteCurrentEntry();
        });
    }

    startNewEntry() {
        this.currentEntry = null;
        this.isEditing = true;
        this.updateEntryEditor();
    }

    selectEntry(entryId) {
        this.currentEntry = this.entries.find(entry => entry.id === entryId);
        this.isEditing = false;
        this.updateEntryEditor();
        this.updateEntriesList();
    }

    selectMood(mood) {
        if (this.currentEntry) {
            this.currentEntry.mood = mood;
        }
        this.updateMoodSelector();
    }

    async saveCurrentEntry() {
        const title = document.getElementById('entryTitle')?.value || '';
        const content = document.getElementById('entryContent')?.value || '';
        const tags = document.getElementById('entryTags')?.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (!title.trim() && !content.trim()) {
            alert('Please add a title or content to your entry.');
            return;
        }

        try {
            const entryData = {
                id: this.currentEntry?.id,
                title: title.trim(),
                content: content.trim(),
                mood: this.currentEntry?.mood || 'neutral',
                tags
            };

            await this.saveEntry(entryData);
            this.isEditing = false;
            this.updateEntryEditor();
            this.updateEntriesList();
        } catch (error) {
            console.error('Error saving entry:', error);
            alert('Failed to save entry. Please try again.');
        }
    }

    cancelEdit() {
        if (this.currentEntry) {
            this.isEditing = false;
        } else {
            this.currentEntry = null;
        }
        this.updateEntryEditor();
    }

    async deleteCurrentEntry() {
        if (!this.currentEntry?.id) return;

        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }

        try {
            await this.deleteEntry(this.currentEntry.id);
            this.currentEntry = null;
            this.isEditing = false;
            this.updateEntryEditor();
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry. Please try again.');
        }
    }

    updateEntriesList() {
        const entriesList = document.getElementById('entriesList');
        if (entriesList) {
            entriesList.innerHTML = this.renderEntriesList();
            this.attachEventListeners(); // Re-attach event listeners after DOM update
        } else {
            console.warn('entriesList element not found in DOM');
        }
    }

    updateEntryEditor() {
        const entryEditor = document.getElementById('entryEditor');
        if (entryEditor) {
            entryEditor.innerHTML = this.renderEntryEditor();
            this.attachEventListeners(); // Re-attach event listeners after DOM update
        } else {
            console.warn('entryEditor element not found in DOM');
        }
    }

    updateMoodSelector() {
        const moodOptions = document.querySelectorAll('.mood-option');
        moodOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.mood === this.currentEntry?.mood);
        });
    }
} 