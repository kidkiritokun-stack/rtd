/**
 * Admin Dashboard JavaScript
 * Handles authentication, navigation, and CRUD operations
 */

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'posts';
        this.posts = [];
        this.authors = [];
        this.inbox = [];
        this.settings = {};
        this.editingPost = null;
        this.editingAuthor = null;

        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        if (this.currentUser) {
            this.showDashboard();
            this.initNavigation();
            this.initModals();
            this.loadSection('posts');
        } else {
            this.showLogin();
        }
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        this.updateUserInfo();
        this.updateNavigation();
    }

    updateUserInfo() {
        if (!this.currentUser) return;

        const userAvatar = document.getElementById('userAvatar');
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (this.currentUser.avatarUrl) {
            userAvatar.src = this.currentUser.avatarUrl;
            userAvatar.style.display = 'block';
            userInitials.style.display = 'none';
        } else {
            const initials = this.currentUser.fullName
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();
            userInitials.textContent = initials;
            userInitials.style.display = 'flex';
            userAvatar.style.display = 'none';
        }

        userName.textContent = this.currentUser.fullName;
        userRole.textContent = this.currentUser.role;
    }

    updateNavigation() {
        // Hide admin-only sections for authors
        if (this.currentUser.role === 'author') {
            document.getElementById('authorsNavItem').style.display = 'none';
            document.getElementById('settingsNavItem').style.display = 'none';
        }
    }

    initNavigation() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
            });
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Action buttons
        document.getElementById('newPostBtn').addEventListener('click', () => {
            this.openPostEditor();
        });

        document.getElementById('newAuthorBtn').addEventListener('click', () => {
            this.openAuthorEditor();
        });
    }

    initModals() {
        // Post editor modal
        document.getElementById('closeEditorBtn').addEventListener('click', () => {
            this.closePostEditor();
        });

        document.getElementById('postEditorForm').addEventListener('submit', (e) => {
            this.handlePostSave(e);
        });

        // Author editor modal
        document.getElementById('closeAuthorEditorBtn').addEventListener('click', () => {
            this.closeAuthorEditor();
        });

        document.getElementById('authorEditorForm').addEventListener('submit', (e) => {
            this.handleAuthorSave(e);
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Template mode switching
        document.querySelectorAll('input[name="templateMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleTemplateFields(radio.value);
            });
        });

        // Rich text editor toolbar
        this.initRichTextEditor();

        // Tags input
        this.initTagsInput();

        // Pull quotes
        document.getElementById('addPullQuoteBtn').addEventListener('click', () => {
            this.addPullQuote();
        });

        // Auto-generate slug from title
        document.querySelector('input[name="title"]').addEventListener('input', (e) => {
            const slugInput = document.querySelector('input[name="slug"]');
            if (!slugInput.value) {
                slugInput.value = this.generateSlug(e.target.value);
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');

        btnText.style.display = 'none';
        btnSpinner.style.display = 'flex';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                this.showDashboard();
                this.initNavigation();
                this.initModals();
                this.loadSection('posts');
                window.toast.success('Welcome back!');
            } else {
                throw new Error(data.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            window.toast.error(error.message || 'Login failed');
        } finally {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.currentUser = null;
            this.showLogin();
            window.toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            window.toast.error('Logout failed');
        }
    }

    loadSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}Section`).classList.add('active');

        // Update page title and actions
        this.updatePageHeader(section);

        // Load section data
        this.currentSection = section;
        switch (section) {
            case 'posts':
                this.loadPosts();
                break;
            case 'authors':
                this.loadAuthors();
                break;
            case 'inbox':
                this.loadInbox();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    updatePageHeader(section) {
        const pageTitle = document.getElementById('pageTitle');
        const newPostBtn = document.getElementById('newPostBtn');
        const newAuthorBtn = document.getElementById('newAuthorBtn');

        // Hide all action buttons
        newPostBtn.style.display = 'none';
        newAuthorBtn.style.display = 'none';

        switch (section) {
            case 'posts':
                pageTitle.textContent = 'Posts';
                newPostBtn.style.display = 'inline-flex';
                break;
            case 'authors':
                pageTitle.textContent = 'Authors';
                if (this.currentUser.role === 'admin') {
                    newAuthorBtn.style.display = 'inline-flex';
                }
                break;
            case 'inbox':
                pageTitle.textContent = 'Inbox';
                break;
            case 'settings':
                pageTitle.textContent = 'Settings';
                break;
        }
    }

    async loadPosts() {
        const loading = document.getElementById('postsLoading');
        const tableBody = document.getElementById('postsTableBody');
        const emptyState = document.getElementById('postsEmpty');

        loading.style.display = 'flex';
        tableBody.innerHTML = '';
        emptyState.style.display = 'none';

        try {
            let url = '/api/posts?limit=50';
            
            // Authors only see their own posts
            if (this.currentUser.role === 'author') {
                url += `&authorId=${this.currentUser.id}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                this.posts = data.posts;
                this.renderPostsTable();
                this.initPostsFilters();
            } else {
                throw new Error(data.error || 'Failed to load posts');
            }

        } catch (error) {
            console.error('Error loading posts:', error);
            window.toast.error('Failed to load posts');
        } finally {
            loading.style.display = 'none';
        }
    }

    renderPostsTable() {
        const tableBody = document.getElementById('postsTableBody');
        const emptyState = document.getElementById('postsEmpty');

        if (this.posts.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        const postsHTML = this.posts.map(post => {
            const publishedDate = post.publishedAt 
                ? new Date(post.publishedAt).toLocaleDateString()
                : new Date(post.updatedAt).toLocaleDateString();

            return `
                <tr>
                    <td>
                        <div class="table-title">${post.title}</div>
                        <div class="table-meta">${post.slug}</div>
                    </td>
                    <td>
                        <div class="table-author">
                            ${post.author?.avatarUrl 
                                ? `<img src="${post.author.avatarUrl}" alt="${post.author.fullName}" class="table-avatar">`
                                : `<div class="table-initials">${this.getInitials(post.author?.fullName || 'Unknown')}</div>`
                            }
                            <span>${post.author?.fullName || 'Unknown'}</span>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${post.status}">${this.formatStatus(post.status)}</span>
                    </td>
                    <td>${post.contentType}</td>
                    <td>${this.formatNumber(post.views || 0)}</td>
                    <td>${publishedDate}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="adminDashboard.editPost('${post.id}')" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                    <path d="m15 5 4 4"></path>
                                </svg>
                            </button>
                            ${this.currentUser.role === 'admin' && post.status === 'pending_approval' ? `
                                <button class="action-btn approve" onclick="adminDashboard.approvePost('${post.id}')" title="Approve">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                </button>
                                <button class="action-btn reject" onclick="adminDashboard.rejectPost('${post.id}')" title="Reject">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" x2="6" y1="6" y2="18"></line>
                                        <line x1="6" x2="18" y1="6" y2="18"></line>
                                    </svg>
                                </button>
                            ` : ''}
                            ${this.currentUser.role === 'admin' ? `
                                <button class="action-btn delete" onclick="adminDashboard.deletePost('${post.id}')" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            ` : ''}
                            <button class="action-btn view" onclick="window.open('/post/${post.slug}', '_blank')" title="View">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = postsHTML;
    }

    initPostsFilters() {
        const searchInput = document.getElementById('postsSearch');
        const statusFilter = document.getElementById('statusFilter');
        const contentTypeFilter = document.getElementById('contentTypeFilter');

        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterPosts();
            }, 300);
        });

        statusFilter.addEventListener('change', () => {
            this.filterPosts();
        });

        contentTypeFilter.addEventListener('change', () => {
            this.filterPosts();
        });
    }

    filterPosts() {
        const searchTerm = document.getElementById('postsSearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const contentTypeFilter = document.getElementById('contentTypeFilter').value;

        const filteredPosts = this.posts.filter(post => {
            const matchesSearch = !searchTerm || 
                post.title.toLowerCase().includes(searchTerm) ||
                post.excerpt.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || post.status === statusFilter;
            const matchesContentType = !contentTypeFilter || post.contentType === contentTypeFilter;

            return matchesSearch && matchesStatus && matchesContentType;
        });

        // Update the posts array temporarily for rendering
        const originalPosts = this.posts;
        this.posts = filteredPosts;
        this.renderPostsTable();
        this.posts = originalPosts;
    }

    async loadAuthors() {
        if (this.currentUser.role !== 'admin') return;

        const loading = document.getElementById('authorsLoading');
        const tableBody = document.getElementById('authorsTableBody');

        loading.style.display = 'flex';
        tableBody.innerHTML = '';

        try {
            const response = await fetch('/api/authors');
            const data = await response.json();

            if (response.ok) {
                this.authors = data;
                this.renderAuthorsTable();
                this.initAuthorsFilters();
            } else {
                throw new Error(data.error || 'Failed to load authors');
            }

        } catch (error) {
            console.error('Error loading authors:', error);
            window.toast.error('Failed to load authors');
        } finally {
            loading.style.display = 'none';
        }
    }

    renderAuthorsTable() {
        const tableBody = document.getElementById('authorsTableBody');

        const authorsHTML = this.authors.map(author => {
            const createdDate = new Date(author.createdAt).toLocaleDateString();
            const postCount = this.posts.filter(post => post.authorId === author.id).length;

            return `
                <tr>
                    <td>
                        <div class="table-author">
                            ${author.avatarUrl 
                                ? `<img src="${author.avatarUrl}" alt="${author.fullName}" class="table-avatar">`
                                : `<div class="table-initials">${this.getInitials(author.fullName)}</div>`
                            }
                            <div>
                                <div class="table-title">${author.fullName}</div>
                                <div class="table-meta">${author.designation || author.role}</div>
                            </div>
                        </div>
                    </td>
                    <td>${author.username}</td>
                    <td>
                        <span class="status-badge ${author.role}">${author.role}</span>
                    </td>
                    <td>${postCount}</td>
                    <td>
                        <span class="status-badge ${author.active ? 'active' : 'inactive'}">
                            ${author.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="adminDashboard.editAuthor('${author.id}')" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                    <path d="m15 5 4 4"></path>
                                </svg>
                            </button>
                            ${author.id !== this.currentUser.id ? `
                                <button class="action-btn delete" onclick="adminDashboard.deleteAuthor('${author.id}')" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = authorsHTML;
    }

    initAuthorsFilters() {
        const searchInput = document.getElementById('authorsSearch');
        const roleFilter = document.getElementById('roleFilter');

        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterAuthors();
            }, 300);
        });

        roleFilter.addEventListener('change', () => {
            this.filterAuthors();
        });
    }

    filterAuthors() {
        const searchTerm = document.getElementById('authorsSearch').value.toLowerCase();
        const roleFilter = document.getElementById('roleFilter').value;

        const filteredAuthors = this.authors.filter(author => {
            const matchesSearch = !searchTerm || 
                author.fullName.toLowerCase().includes(searchTerm) ||
                author.username.toLowerCase().includes(searchTerm);
            
            const matchesRole = !roleFilter || author.role === roleFilter;

            return matchesSearch && matchesRole;
        });

        // Update the authors array temporarily for rendering
        const originalAuthors = this.authors;
        this.authors = filteredAuthors;
        this.renderAuthorsTable();
        this.authors = originalAuthors;
    }

    async loadInbox() {
        const loading = document.getElementById('inboxLoading');
        const tableBody = document.getElementById('inboxTableBody');
        const emptyState = document.getElementById('inboxEmpty');

        loading.style.display = 'flex';
        tableBody.innerHTML = '';
        emptyState.style.display = 'none';

        try {
            // For now, we'll simulate inbox data since we don't have an inbox API endpoint
            // In a real implementation, you'd fetch from /api/inbox
            this.inbox = []; // Placeholder
            this.renderInboxTable();

        } catch (error) {
            console.error('Error loading inbox:', error);
            window.toast.error('Failed to load inbox');
        } finally {
            loading.style.display = 'none';
        }
    }

    renderInboxTable() {
        const tableBody = document.getElementById('inboxTableBody');
        const emptyState = document.getElementById('inboxEmpty');

        if (this.inbox.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        const inboxHTML = this.inbox.map(item => {
            const submittedDate = new Date(item.submittedAt).toLocaleDateString();

            return `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.email}</td>
                    <td>${item.phone || '-'}</td>
                    <td>
                        <div class="table-title">${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}</div>
                    </td>
                    <td>${submittedDate}</td>
                    <td>
                        <span class="status-badge ${item.read ? 'active' : 'inactive'}">
                            ${item.read ? 'Read' : 'Unread'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = inboxHTML;
    }

    async loadSettings() {
        if (this.currentUser.role !== 'admin') return;

        try {
            // Load settings and popular posts configuration
            // This would be implemented with actual API calls
            this.renderSettingsPage();

        } catch (error) {
            console.error('Error loading settings:', error);
            window.toast.error('Failed to load settings');
        }
    }

    renderSettingsPage() {
        // Render popular posts settings
        const popularPostsContainer = document.getElementById('popularPostsSettings');
        
        const approvedPosts = this.posts.filter(post => post.status === 'approved');
        
        const popularPostsHTML = approvedPosts.map(post => `
            <div class="popular-post-item">
                <input type="checkbox" class="popular-post-checkbox" value="${post.id}">
                <div class="popular-post-info">
                    <div class="popular-post-title">${post.title}</div>
                    <div class="popular-post-meta">${post.contentType} • ${this.formatNumber(post.views || 0)} views</div>
                </div>
            </div>
        `).join('');

        popularPostsContainer.innerHTML = popularPostsHTML;
    }

    // Post Management
    openPostEditor(postId = null) {
        this.editingPost = postId;
        const modal = document.getElementById('postEditorModal');
        const title = document.getElementById('editorTitle');
        const form = document.getElementById('postEditorForm');

        if (postId) {
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                title.textContent = 'Edit Post';
                this.populatePostForm(post);
            }
        } else {
            title.textContent = 'New Post';
            form.reset();
            this.clearPostForm();
        }

        this.updatePostEditorButtons();
        modal.style.display = 'flex';
        
        // Focus first input
        setTimeout(() => {
            form.querySelector('input[name="title"]').focus();
        }, 100);
    }

    closePostEditor() {
        document.getElementById('postEditorModal').style.display = 'none';
        this.editingPost = null;
    }

    populatePostForm(post) {
        const form = document.getElementById('postEditorForm');
        
        // Basic fields
        form.querySelector('input[name="title"]').value = post.title;
        form.querySelector('input[name="slug"]').value = post.slug;
        form.querySelector('textarea[name="excerpt"]').value = post.excerpt;
        form.querySelector('input[name="bannerUrl"]').value = post.banner.url;
        form.querySelector('input[name="bannerAlt"]').value = post.banner.alt;
        form.querySelector('select[name="contentType"]').value = post.contentType;
        form.querySelector('select[name="serviceCategory"]').value = post.serviceCategory;

        // Template mode
        const templateMode = post.template.mode;
        form.querySelector(`input[name="templateMode"][value="${templateMode}"]`).checked = true;
        this.toggleTemplateFields(templateMode);

        if (templateMode === 'default') {
            document.getElementById('contentEditor').innerHTML = post.template.defaultFields?.body || '';
            this.renderPullQuotes(post.template.defaultFields?.pullQuotes || []);
        } else {
            form.querySelector('textarea[name="customHtml"]').value = post.template.customFields?.html || '';
            form.querySelector('textarea[name="customCss"]').value = post.template.customFields?.css || '';
            form.querySelector('textarea[name="customJs"]').value = post.template.customFields?.js || '';
        }

        // SEO fields
        form.querySelector('input[name="seoTitle"]').value = post.seo?.title || '';
        form.querySelector('textarea[name="seoDescription"]').value = post.seo?.description || '';
        form.querySelector('input[name="canonical"]').value = post.seo?.canonical || '';

        // Tags
        this.renderTags(post.tags || []);
    }

    clearPostForm() {
        document.getElementById('contentEditor').innerHTML = '';
        document.getElementById('pullQuotesContainer').innerHTML = '';
        document.getElementById('tagsContainer').innerHTML = '';
        this.toggleTemplateFields('default');
    }

    updatePostEditorButtons() {
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const submitApprovalBtn = document.getElementById('submitApprovalBtn');
        const approvePostBtn = document.getElementById('approvePostBtn');
        const rejectPostBtn = document.getElementById('rejectPostBtn');

        // Hide all action buttons initially
        saveDraftBtn.style.display = 'none';
        submitApprovalBtn.style.display = 'none';
        approvePostBtn.style.display = 'none';
        rejectPostBtn.style.display = 'none';

        if (this.editingPost) {
            const post = this.posts.find(p => p.id === this.editingPost);
            if (post) {
                if (this.currentUser.role === 'author') {
                    if (post.status === 'draft' || post.status === 'rejected') {
                        submitApprovalBtn.style.display = 'inline-flex';
                    }
                } else if (this.currentUser.role === 'admin') {
                    if (post.status === 'pending_approval') {
                        approvePostBtn.style.display = 'inline-flex';
                        rejectPostBtn.style.display = 'inline-flex';
                    }
                }
            }
        } else {
            saveDraftBtn.style.display = 'inline-flex';
        }

        // Bind button events
        saveDraftBtn.onclick = () => this.savePostAsDraft();
        submitApprovalBtn.onclick = () => this.submitPostForApproval();
        approvePostBtn.onclick = () => this.approvePost(this.editingPost);
        rejectPostBtn.onclick = () => this.rejectPost(this.editingPost);
    }

    async handlePostSave(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';

        try {
            const postData = this.collectPostData(formData);
            
            let response;
            if (this.editingPost) {
                response = await fetch(`/api/posts/${this.editingPost}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            } else {
                response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                window.toast.success(this.editingPost ? 'Post updated successfully' : 'Post created successfully');
                this.closePostEditor();
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to save post');
            }

        } catch (error) {
            console.error('Error saving post:', error);
            window.toast.error(error.message || 'Failed to save post');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    collectPostData(formData) {
        const templateMode = formData.get('templateMode');
        
        const postData = {
            title: formData.get('title'),
            slug: formData.get('slug'),
            excerpt: formData.get('excerpt'),
            banner: {
                url: formData.get('bannerUrl'),
                alt: formData.get('bannerAlt')
            },
            contentType: formData.get('contentType'),
            serviceCategory: formData.get('serviceCategory'),
            template: {
                mode: templateMode
            },
            tags: this.getCurrentTags(),
            relatedIds: this.getCurrentRelatedIds(),
            seo: {
                title: formData.get('seoTitle'),
                description: formData.get('seoDescription'),
                canonical: formData.get('canonical')
            }
        };

        if (templateMode === 'default') {
            postData.template.defaultFields = {
                body: document.getElementById('contentEditor').innerHTML,
                pullQuotes: this.getCurrentPullQuotes()
            };
        } else {
            postData.template.customFields = {
                html: formData.get('customHtml'),
                css: formData.get('customCss'),
                js: formData.get('customJs')
            };
        }

        return postData;
    }

    async savePostAsDraft() {
        // This would save the post with status 'draft'
        const form = document.getElementById('postEditorForm');
        const formData = new FormData(form);
        const postData = this.collectPostData(formData);
        
        // Add draft status
        postData.status = 'draft';
        
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                window.toast.success('Post saved as draft');
                this.closePostEditor();
                this.loadPosts();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save draft');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to save draft');
        }
    }

    async submitPostForApproval() {
        if (!this.editingPost) return;

        try {
            const response = await fetch(`/api/posts/${this.editingPost}/submit`, {
                method: 'POST'
            });

            if (response.ok) {
                window.toast.success('Post submitted for approval');
                this.closePostEditor();
                this.loadPosts();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit for approval');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to submit for approval');
        }
    }

    async approvePost(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}/approve`, {
                method: 'POST'
            });

            if (response.ok) {
                window.toast.success('Post approved successfully');
                this.loadPosts();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve post');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to approve post');
        }
    }

    async rejectPost(postId) {
        const reason = prompt('Reason for rejection (optional):');
        
        try {
            const response = await fetch(`/api/posts/${postId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            if (response.ok) {
                window.toast.success('Post rejected');
                this.loadPosts();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject post');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to reject post');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.toast.success('Post deleted successfully');
                this.loadPosts();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete post');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to delete post');
        }
    }

    editPost(postId) {
        this.openPostEditor(postId);
    }

    // Author Management
    openAuthorEditor(authorId = null) {
        this.editingAuthor = authorId;
        const modal = document.getElementById('authorEditorModal');
        const title = document.getElementById('authorEditorTitle');
        const form = document.getElementById('authorEditorForm');

        if (authorId) {
            const author = this.authors.find(a => a.id === authorId);
            if (author) {
                title.textContent = 'Edit Author';
                this.populateAuthorForm(author);
            }
        } else {
            title.textContent = 'New Author';
            form.reset();
            document.getElementById('authorPassword').required = true;
        }

        modal.style.display = 'flex';
        
        // Focus first input
        setTimeout(() => {
            form.querySelector('input[name="username"]').focus();
        }, 100);
    }

    closeAuthorEditor() {
        document.getElementById('authorEditorModal').style.display = 'none';
        this.editingAuthor = null;
    }

    populateAuthorForm(author) {
        const form = document.getElementById('authorEditorForm');
        
        form.querySelector('input[name="username"]').value = author.username;
        form.querySelector('input[name="fullName"]').value = author.fullName;
        form.querySelector('select[name="role"]').value = author.role;
        form.querySelector('input[name="designation"]').value = author.designation || '';
        form.querySelector('input[name="avatarUrl"]').value = author.avatarUrl || '';
        form.querySelector('textarea[name="bio"]').value = author.bio || '';
        form.querySelector('input[name="active"]').checked = author.active;

        // Social links
        const socialFields = ['instagram', 'youtube', 'x', 'facebook', 'linkedin', 'website', 'email'];
        socialFields.forEach(field => {
            const input = form.querySelector(`input[name="${field}"]`);
            if (input) {
                input.value = author.social?.[field] || '';
            }
        });

        // Password is optional when editing
        document.getElementById('authorPassword').required = false;
    }

    async handleAuthorSave(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';

        try {
            const authorData = {
                username: formData.get('username'),
                fullName: formData.get('fullName'),
                role: formData.get('role'),
                designation: formData.get('designation'),
                bio: formData.get('bio'),
                avatarUrl: formData.get('avatarUrl'),
                active: formData.has('active'),
                social: {
                    instagram: formData.get('instagram'),
                    youtube: formData.get('youtube'),
                    x: formData.get('x'),
                    facebook: formData.get('facebook'),
                    linkedin: formData.get('linkedin'),
                    website: formData.get('website'),
                    email: formData.get('email')
                }
            };

            // Add password if provided
            const password = formData.get('password');
            if (password) {
                authorData.password = password;
            }

            let response;
            if (this.editingAuthor) {
                response = await fetch(`/api/authors/${this.editingAuthor}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorData)
                });
            } else {
                response = await fetch('/api/authors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                window.toast.success(this.editingAuthor ? 'Author updated successfully' : 'Author created successfully');
                this.closeAuthorEditor();
                this.loadAuthors();
            } else {
                throw new Error(data.error || 'Failed to save author');
            }

        } catch (error) {
            console.error('Error saving author:', error);
            window.toast.error(error.message || 'Failed to save author');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    editAuthor(authorId) {
        this.openAuthorEditor(authorId);
    }

    async deleteAuthor(authorId) {
        if (!confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/authors/${authorId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.toast.success('Author deleted successfully');
                this.loadAuthors();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete author');
            }
        } catch (error) {
            window.toast.error(error.message || 'Failed to delete author');
        }
    }

    // UI Helper Methods
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    toggleTemplateFields(mode) {
        const defaultFields = document.getElementById('defaultTemplateFields');
        const customFields = document.getElementById('customTemplateFields');

        if (mode === 'default') {
            defaultFields.style.display = 'block';
            customFields.style.display = 'none';
        } else {
            defaultFields.style.display = 'none';
            customFields.style.display = 'block';
        }
    }

    initRichTextEditor() {
        const toolbar = document.querySelector('.editor-toolbar');
        const editor = document.getElementById('contentEditor');

        toolbar.addEventListener('click', (e) => {
            if (e.target.closest('.toolbar-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.toolbar-btn');
                const command = btn.dataset.command;
                const value = btn.dataset.value;

                if (command === 'createLink') {
                    const url = prompt('Enter URL:');
                    if (url) {
                        document.execCommand(command, false, url);
                    }
                } else if (command === 'insertHTML') {
                    document.execCommand(command, false, value);
                } else {
                    document.execCommand(command, false, value);
                }

                editor.focus();
            }
        });

        // Update toolbar button states
        editor.addEventListener('keyup', () => {
            this.updateToolbarStates();
        });

        editor.addEventListener('mouseup', () => {
            this.updateToolbarStates();
        });
    }

    updateToolbarStates() {
        const commands = ['bold', 'italic', 'underline'];
        
        commands.forEach(command => {
            const btn = document.querySelector(`[data-command="${command}"]`);
            if (btn) {
                if (document.queryCommandState(command)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    initTagsInput() {
        const tagsInput = document.getElementById('tagsInput');
        
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tag = e.target.value.trim();
                if (tag) {
                    this.addTag(tag);
                    e.target.value = '';
                }
            }
        });

        tagsInput.addEventListener('blur', (e) => {
            const tag = e.target.value.trim();
            if (tag) {
                this.addTag(tag);
                e.target.value = '';
            }
        });
    }

    addTag(tagText) {
        const container = document.getElementById('tagsContainer');
        const existingTags = Array.from(container.querySelectorAll('.tag-item')).map(tag => tag.textContent.trim());
        
        if (existingTags.includes(tagText)) {
            return; // Tag already exists
        }

        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            ${tagText}
            <button type="button" class="remove-tag-btn" onclick="this.parentElement.remove()">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
            </button>
        `;

        container.appendChild(tagElement);
    }

    renderTags(tags) {
        const container = document.getElementById('tagsContainer');
        container.innerHTML = '';
        
        tags.forEach(tag => {
            this.addTag(tag);
        });
    }

    getCurrentTags() {
        const container = document.getElementById('tagsContainer');
        return Array.from(container.querySelectorAll('.tag-item')).map(tag => 
            tag.textContent.trim()
        );
    }

    addPullQuote() {
        const container = document.getElementById('pullQuotesContainer');
        const quoteElement = document.createElement('div');
        quoteElement.className = 'pull-quote-item';
        quoteElement.innerHTML = `
            <div class="pull-quote-header">
                <span class="pull-quote-title">Pull Quote</span>
                <button type="button" class="remove-quote-btn" onclick="this.closest('.pull-quote-item').remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" x2="6" y1="6" y2="18"></line>
                        <line x1="6" x2="18" y1="6" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="form-group">
                <label class="form-label">Quote Text</label>
                <textarea class="form-textarea" rows="3" placeholder="Enter the quote text..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Citation (optional)</label>
                <input type="text" class="form-input" placeholder="Author or source">
            </div>
        `;

        container.appendChild(quoteElement);
    }

    renderPullQuotes(pullQuotes) {
        const container = document.getElementById('pullQuotesContainer');
        container.innerHTML = '';
        
        pullQuotes.forEach(quote => {
            this.addPullQuote();
            const quoteItem = container.lastElementChild;
            quoteItem.querySelector('textarea').value = quote.text;
            quoteItem.querySelector('input').value = quote.citation || '';
        });
    }

    getCurrentPullQuotes() {
        const container = document.getElementById('pullQuotesContainer');
        const quotes = [];
        
        container.querySelectorAll('.pull-quote-item').forEach(item => {
            const text = item.querySelector('textarea').value.trim();
            const citation = item.querySelector('input').value.trim();
            
            if (text) {
                quotes.push({
                    text,
                    citation: citation || null
                });
            }
        });

        return quotes;
    }

    getCurrentRelatedIds() {
        const select = document.getElementById('relatedPostsSelect');
        return Array.from(select.selectedOptions).map(option => option.value);
    }

    // Utility Methods
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    formatStatus(status) {
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Global functions for onclick handlers
function closeAuthorEditor() {
    if (window.adminDashboard) {
        window.adminDashboard.closeAuthorEditor();
    }
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Export for external use
window.AdminDashboard = AdminDashboard;