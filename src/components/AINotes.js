export class AINotes {
    constructor() {
        this.notes = [];
        this.currentNote = null;
        this.searchQuery = '';
        this.searchTimeout = null;
    }

    async init() {
        await this.loadNotes();
        this.render();
        this.attachEventListeners();
    }

    async loadNotes() {
        try {
            const { data: notes, error } = await window.supabase
                .from('ai_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.notes = notes || [];
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }

    async searchNotes(query) {
        if (!query.trim()) {
            await this.loadNotes();
            return;
        }

        try {
            const { data, error } = await window.supabase
                .rpc('search_ai_notes', { search_query: query });

            if (error) throw error;
            this.notes = data || [];
        } catch (error) {
            console.error('Error searching notes:', error);
            this.notes = [];
        }
    }

    async saveNote(noteData) {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            if (noteData.id) {
                const { error } = await window.supabase
                    .from('ai_notes')
                    .update({
                        title: noteData.title,
                        content: noteData.content,
                        tags: noteData.tags || []
                    })
                    .eq('id', noteData.id);

                if (error) throw error;
            } else {
                const { error } = await window.supabase
                    .from('ai_notes')
                    .insert({
                        user_id: user.id,
                        title: noteData.title,
                        content: noteData.content,
                        note_type: 'manual',
                        tags: noteData.tags || []
                    });

                if (error) throw error;
            }

            await this.loadNotes();
            this.currentNote = null;
            this.render();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Error saving note: ' + error.message);
        }
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const { error } = await window.supabase
                .from('ai_notes')
                .delete()
                .eq('id', noteId);

            if (error) throw error;

            await this.loadNotes();
            this.currentNote = null;
            this.render();
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Error deleting note: ' + error.message);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getTypeIcon(type) {
        switch (type) {
            case 'upload': return '📄';
            case 'recording': return '🎤';
            case 'manual': return '✏️';
            default: return '📝';
        }
    }

    render() {
        const container = document.getElementById('ai-notes-page');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-notes-container">
                <div class="ai-notes-header">
                    <h1>AI Notes</h1>
                    <div class="notes-actions">
                        <div class="search-container">
                            <input 
                                type="text" 
                                id="notes-search" 
                                placeholder="Search notes..." 
                                value="${this.searchQuery}"
                                class="search-input"
                            >
                            <button id="search-btn" class="search-btn">🔍</button>
                        </div>
                        <button id="new-note-btn" class="btn btn-primary">+ New Note</button>
                    </div>
                </div>

                <div class="ai-notes-content">
                    <div class="notes-sidebar">
                        <div class="notes-list">
                            ${this.renderNotesList()}
                        </div>
                    </div>

                    <div class="notes-main">
                        ${this.currentNote ? this.renderNoteEditor() : this.renderEmptyState()}
                    </div>
                </div>
            </div>

            <style>
                .ai-notes-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-color);
                }

                .ai-notes-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--surface-color);
                }

                .ai-notes-header h1 {
                    margin: 0;
                    color: var(--text-color);
                    font-size: 1.8rem;
                    font-weight: 600;
                }

                .notes-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .search-container {
                    display: flex;
                    position: relative;
                }

                .search-input {
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background: var(--bg-color);
                    color: var(--text-color);
                    width: 250px;
                }

                .search-btn {
                    padding: 0.5rem;
                    margin-left: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background: var(--surface-color);
                    cursor: pointer;
                }

                .ai-notes-content {
                    flex: 1;
                    display: flex;
                    min-height: 0;
                }

                .notes-sidebar {
                    width: 350px;
                    border-right: 1px solid var(--border-color);
                    background: var(--surface-color);
                    overflow-y: auto;
                }

                .notes-list {
                    padding: 1rem;
                }

                .note-item {
                    padding: 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: var(--bg-color);
                }

                .note-item:hover {
                    border-color: var(--primary-color);
                    transform: translateY(-1px);
                }

                .note-item.active {
                    border-color: var(--primary-color);
                    background: var(--primary-color)10;
                }

                .note-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .note-title {
                    font-weight: 600;
                    color: var(--text-color);
                    font-size: 0.9rem;
                    margin: 0;
                }

                .note-type {
                    font-size: 1rem;
                }

                .note-preview {
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    line-height: 1.4;
                    margin-bottom: 0.5rem;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .note-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }

                .note-tags {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }

                .tag {
                    background: var(--primary-color)20;
                    color: var(--primary-color);
                    padding: 0.1rem 0.4rem;
                    border-radius: 0.25rem;
                    font-size: 0.6rem;
                }

                .notes-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-color);
                }

                .note-editor {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    padding: 2rem;
                }

                .editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .editor-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .note-title-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    font-size: 1.2rem;
                    font-weight: 600;
                    background: var(--surface-color);
                    color: var(--text-color);
                    margin-bottom: 1rem;
                }

                .note-content-input {
                    flex: 1;
                    padding: 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background: var(--surface-color);
                    color: var(--text-color);
                    font-family: inherit;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    resize: none;
                    margin-bottom: 1rem;
                }

                .note-tags-input {
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background: var(--surface-color);
                    color: var(--text-color);
                    width: 300px;
                }

                .ai-summary {
                    background: var(--primary-color)10;
                    border: 1px solid var(--primary-color)30;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .ai-summary-label {
                    font-weight: 600;
                    color: var(--primary-color);
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }

                .empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    text-align: center;
                }

                .empty-state-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }

                .btn-secondary {
                    background: var(--surface-color);
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                }

                .btn-danger {
                    background: #dc3545;
                    color: white;
                }

                .btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }

                @media (max-width: 768px) {
                    .ai-notes-content {
                        flex-direction: column;
                    }
                    
                    .notes-sidebar {
                        width: 100%;
                        height: 40vh;
                    }
                    
                    .search-input {
                        width: 200px;
                    }
                    
                    .notes-actions {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                }
            </style>
        `;
    }

    renderNotesList() {
        if (this.notes.length === 0) {
            return `
                <div class="empty-notes">
                    <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        ${this.searchQuery ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
                    </p>
                </div>
            `;
        }

        return this.notes.map(note => `
            <div class="note-item ${this.currentNote?.id === note.id ? 'active' : ''}" 
                 data-note-id="${note.id}">
                <div class="note-item-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-type">${this.getTypeIcon(note.note_type)}</span>
                </div>
                <div class="note-preview">${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</div>
                <div class="note-meta">
                    <div class="note-tags">
                        ${(note.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <span class="note-date">${this.formatDate(note.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    renderNoteEditor() {
        const note = this.currentNote;
        
        return `
            <div class="note-editor">
                <div class="editor-header">
                    <h2>${note.id ? 'Edit Note' : 'New Note'}</h2>
                    <div class="editor-actions">
                        <button id="save-note-btn" class="btn btn-primary">Save</button>
                        ${note.id ? '<button id="delete-note-btn" class="btn btn-danger">Delete</button>' : ''}
                        <button id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>

                <input 
                    type="text" 
                    id="note-title" 
                    class="note-title-input" 
                    placeholder="Note title..."
                    value="${note.title || ''}"
                >

                ${note.ai_summary ? `
                    <div class="ai-summary">
                        <div class="ai-summary-label">🤖 AI Summary</div>
                        <div>${note.ai_summary}</div>
                    </div>
                ` : ''}

                <textarea 
                    id="note-content" 
                    class="note-content-input" 
                    placeholder="Start writing your note..."
                >${note.content || ''}</textarea>

                <input 
                    type="text" 
                    id="note-tags" 
                    class="note-tags-input" 
                    placeholder="Tags (comma-separated)..."
                    value="${(note.tags || []).join(', ')}"
                >
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h2>Select a note to view or edit</h2>
                <p>Choose a note from the sidebar or create a new one to get started.</p>
            </div>
        `;
    }

    attachEventListeners() {
        const searchInput = document.getElementById('notes-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.debounceSearch();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchNotes(this.searchQuery);
                this.render();
            });
        }

        const newNoteBtn = document.getElementById('new-note-btn');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => {
                this.currentNote = { title: '', content: '', tags: [] };
                this.render();
            });
        }

        document.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.currentNote = this.notes.find(note => note.id === noteId);
                this.render();
            });
        });

        const saveBtn = document.getElementById('save-note-btn');
        const deleteBtn = document.getElementById('delete-note-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = document.getElementById('note-title').value;
                const content = document.getElementById('note-content').value;
                const tagsInput = document.getElementById('note-tags').value;
                const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);

                if (!title.trim() || !content.trim()) {
                    alert('Please fill in both title and content');
                    return;
                }

                this.saveNote({
                    ...this.currentNote,
                    title,
                    content,
                    tags
                });
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteNote(this.currentNote.id);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.currentNote = null;
                this.render();
            });
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchNotes(this.searchQuery);
            this.render();
        }, 300);
    }
}