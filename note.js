// DOM Elements
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const saveNoteBtn = document.getElementById('saveNote');
const clearNoteBtn = document.getElementById('clearNote');
const searchNotesInput = document.getElementById('searchNotes');
const notesContainer = document.getElementById('notesContainer');
const themeToggle = document.getElementById('themeToggle');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const noteDetailModal = document.getElementById('noteDetailModal');
const noteDetailBody = document.getElementById('noteDetailBody');
const backBtn = document.getElementById('backBtn');
const editDetailBtn = document.getElementById('editDetailBtn');
const deleteDetailBtn = document.getElementById('deleteDetailBtn');

// State variables
let notes = JSON.parse(localStorage.getItem('zenNotes')) || [];
let noteToDelete = null;
let isEditing = false;
let currentEditId = null;
let currentViewNoteId = null;

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Note Detail View Functions
function showNoteDetail(id) {
    const note = notes.find(note => note.id === id);
    if (!note) return;
    
    currentViewNoteId = id;
    
    // Populate detail view
    const formattedDate = formatDetailDate(note.date);
    const formattedContent = formatDetailContent(note.content);
    
    noteDetailBody.innerHTML = `
        <h1 class="note-detail-title">${escapeHtml(note.title)}</h1>
        <div class="note-detail-date">
            <i class="far fa-calendar"></i>
            <span>${formattedDate}</span>
        </div>
        <div class="note-detail-text">${formattedContent}</div>
    `;
    
    // Show detail view
    noteDetailModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
}

function hideNoteDetail() {
    noteDetailModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable body scrolling
    currentViewNoteId = null;
}

function formatDetailDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function formatDetailContent(content) {
    // Preserve line breaks and add basic formatting
    let formatted = escapeHtml(content);
    
    // Replace line breaks with paragraph tags
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already
    if (!formatted.startsWith('<p>')) {
        formatted = `<p>${formatted}</p>`;
    }
    
    // Add some basic markdown-like formatting
    formatted = formatted
        .replace(/### (.*?)(?=\n|$)/g, '<h3>$1</h3>')
        .replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>')
        .replace(/# (.*?)(?=\n|$)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\n?)+/g, '<ol>$&</ol>');
    
    return formatted;
}

// Note Management Functions
function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    
    if (!title && !content) {
        alert('Please add a title or content to your note.');
        return;
    }
    
    if (isEditing && currentEditId) {
        // Update existing note
        notes = notes.map(note => {
            if (note.id === currentEditId) {
                return {
                    ...note,
                    title: title || 'Untitled',
                    content: content,
                    date: new Date().toISOString()
                };
            }
            return note;
        });
        
        isEditing = false;
        currentEditId = null;
        saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    } else {
        // Create new note
        const newNote = {
            id: Date.now().toString(),
            title: title || 'Untitled',
            content: content,
            date: new Date().toISOString()
        };
        
        notes.unshift(newNote);
    }
    
    // Save to localStorage and update UI
    localStorage.setItem('zenNotes', JSON.stringify(notes));
    clearInputs();
    displayNotes();
    
    // Show visual feedback
    const originalText = saveNoteBtn.innerHTML;
    saveNoteBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    saveNoteBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        saveNoteBtn.innerHTML = originalText;
        saveNoteBtn.style.backgroundColor = '';
    }, 1500);
}

function clearInputs() {
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteTitleInput.focus();
    
    if (isEditing) {
        isEditing = false;
        currentEditId = null;
        saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    }
}

function displayNotes(filter = '') {
    const filteredNotes = filter 
        ? notes.filter(note => 
            note.title.toLowerCase().includes(filter.toLowerCase()) || 
            note.content.toLowerCase().includes(filter.toLowerCase())
          )
        : notes;
    
    if (filteredNotes.length === 0) {
        if (filter) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No notes found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
        } else {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                </div>
            `;
        }
        return;
    }
    
    notesContainer.innerHTML = filteredNotes.map(note => `
        <div class="note-card" data-id="${note.id}" onclick="showNoteDetail('${note.id}')">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
            </div>
            <p class="note-date">${formatDate(note.date)}</p>
            <div class="note-content">${formatNoteContent(note.content)}</div>
            <div class="note-actions">
                <button class="edit-btn" onclick="event.stopPropagation(); editNote('${note.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" onclick="event.stopPropagation(); showDeleteModal('${note.id}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function editNote(id) {
    const note = notes.find(note => note.id === id);
    if (!note) return;
    
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    
    isEditing = true;
    currentEditId = id;
    saveNoteBtn.innerHTML = '<i class="fas fa-edit"></i> Update Note';
    
    // Hide detail view if open
    if (noteDetailModal.style.display === 'block') {
        hideNoteDetail();
    }
    
    // Scroll to input section
    document.querySelector('.note-input-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    noteTitleInput.focus();
}

function showDeleteModal(id) {
    noteToDelete = id;
    confirmModal.style.display = 'flex';
}

function deleteNote() {
    if (!noteToDelete) return;
    
    notes = notes.filter(note => note.id !== noteToDelete);
    localStorage.setItem('zenNotes', JSON.stringify(notes));
    displayNotes();
    
    // Hide detail view if we're deleting the currently viewed note
    if (currentViewNoteId === noteToDelete) {
        hideNoteDetail();
    }
    
    noteToDelete = null;
    confirmModal.style.display = 'none';
    
    // Show notification
    showNotification('Note deleted successfully');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger-color);
        color: white;
        padding: 15px 25px;
        border-radius: var(--radius);
        z-index: 1001;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function formatNoteContent(content) {
    // Simple formatting: replace line breaks with <br> and limit length
    const maxLength = 200;
    let formatted = escapeHtml(content);
    
    // Add line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Truncate if too long
    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength) + '...';
    }
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
saveNoteBtn.addEventListener('click', saveNote);

clearNoteBtn.addEventListener('click', clearInputs);

searchNotesInput.addEventListener('input', (e) => {
    displayNotes(e.target.value);
});

noteContentInput.addEventListener('keydown', (e) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        saveNote();
    }
});

confirmDeleteBtn.addEventListener('click', deleteNote);

cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    noteToDelete = null;
});

// Detail view event listeners
backBtn.addEventListener('click', hideNoteDetail);

editDetailBtn.addEventListener('click', () => {
    if (currentViewNoteId) {
        editNote(currentViewNoteId);
        hideNoteDetail();
    }
});

deleteDetailBtn.addEventListener('click', () => {
    if (currentViewNoteId) {
        showDeleteModal(currentViewNoteId);
        hideNoteDetail();
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        confirmModal.style.display = 'none';
        noteToDelete = null;
    }
    
    if (e.target === noteDetailModal) {
        hideNoteDetail();
    }
});

// Close detail view with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && noteDetailModal.style.display === 'block') {
        hideNoteDetail();
    }
});

// Initialize the app
function init() {
    initializeTheme();
    displayNotes();
    
    // Set focus to title input
    noteTitleInput.focus();
    
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);