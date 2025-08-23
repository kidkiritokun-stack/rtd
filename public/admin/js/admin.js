/**
 * Admin Dashboard JavaScript
 * Handles authentication, navigation, and all admin functionality
 */

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'posts';
        this.currentPost = null;
        this.currentAuthor = null;
        this.posts = [];
        this.authors = [];
        this.submissions = [];
        this.newsletters = [];
        this.pullQuotes = [];
        this.tags = [];

        this.init();
    }

    async init() {
        // Check if user is logged in
        await this.checkAuth();
        
        if (this.currentUser) {
            this.showDashboard();
            this.bindEvents();
            this.loadSection('posts');
        } else {
            this.showLogin();
            this.bindLoginEvents();
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
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        // Update user info
        this.updateUserInfo();
        
        // Hide admin-only sections for authors
        if (this.currentUser.role === 'author') {
            document.getElementById('authorsNavItem').style.display = 'none';
            document.getElementById('settingsNavItem').style.display = 'none';
        }
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (userName) userName.textContent = this.currentUser.fullName;
        if (userRole) userRole.textContent = this.currentUser.role;

        // Show initials if no avatar
        if (userInitials) {
            const initials = this.currentUser.fullName
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();
            userInitials.textContent = initials;
        }
    }

    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // New post button
        const newPostBtn = document.getElementById('newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.openPostEditor());
        }

        // New author button
        const newAuthorBtn = document.getElementById('newAuthorBtn');
        if (newAuthorBtn) {
            newAuthorBtn.addEventListener('click', () => this.openAuthorEditor());
        }

        // Post editor events
        this.bindPostEditorEvents();
        
        // Author editor events
        this.bindAuthorEditorEvents();

        // Search and filters
        this.bindFilterEvents();
    }

    bindPostEditorEvents() {
        // Close editor
        const closeEditorBtn = document.getElementById('closeEditorBtn');
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => this.closePostEditor());
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Template mode switching
        document.querySelectorAll('input[name="templateMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleTemplateFields(e.target.value);
            });
        });

        // Rich text editor toolbar
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                const value = btn.dataset.value;
                this.execCommand(command, value);
            });
        });

        // Pull quotes
        const addPullQuoteBtn = document.getElementById('addPullQuoteBtn');
        if (addPullQuoteBtn) {
            addPullQuoteBtn.addEventListener('click', () => this.addPullQuote());
        }

        // Tags input
        const tagsInput = document.getElementById('tagsInput');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    this.addTag(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // Form submission
        const postEditorForm = document.getElementById('postEditorForm');
        if (postEditorForm) {
            postEditorForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        }

        // Action buttons
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const submitApprovalBtn = document.getElementById('submitApprovalBtn');
        const approvePostBtn = document.getElementById('approvePostBtn');
        const rejectPostBtn = document.getElementById('rejectPostBtn');

        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.savePost('draft'));
        }
        if (submitApprovalBtn) {
            submitApprovalBtn.addEventListener('click', () => this.submitForApproval());
        }
        if (approvePostBtn) {
            approvePostBtn.addEventListener('click', () => this.approvePost());
        }
        if (rejectPostBtn) {
            rejectPostBtn.addEventListener('click', () => this.rejectPost());
        }
    }

    bindAuthorEditorEvents() {
        // Close author editor
        const closeAuthorEditorBtn = document.getElementById('closeAuthorEditorBtn');
        if (closeAuthorEditorBtn) {
            closeAuthorEditorBtn.addEventListener('click', () => this.closeAuthorEditor());
        }

        // Form submission
        const authorEditorForm = document.getElementById('authorEditorForm');
        if (authorEditorForm) {
            authorEditorForm.addEventListener('submit', (e) => this.handleAuthorSubmit(e));
        }
    }

    bindFilterEvents() {
        // Posts filters
        const postsSearch = document.getElementById('postsSearch');
        const statusFilter = document.getElementById('statusFilter');
        const contentTypeFilter = document.getElementById('contentTypeFilter');

        if (postsSearch) {
            let searchTimeout;
            postsSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.loadPosts();
                }, 300);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadPosts());
        }

        if (contentTypeFilter) {
            contentTypeFilter.addEventListener('change', () => this.loadPosts());
        }

        // Authors filters
        const authorsSearch = document.getElementById('authorsSearch');
        const roleFilter = document.getElementById('roleFilter');

        if (authorsSearch) {
            let searchTimeout;
            authorsSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.loadAuthors();
                }, 300);
            });
        }

        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.loadAuthors());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');

        // Show loading state
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
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
                this.bindEvents();
                this.loadSection('posts');
                
                if (window.toast) {
                    window.toast.success('Welcome back!');
                }
            } else {
                throw new Error(data.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Login failed. Please try again.');
            } else {
                alert('Login failed. Please try again.');
            }
        } finally {
            // Reset button state
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
            this.bindLoginEvents();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    loadSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const newPostBtn = document.getElementById('newPostBtn');
        const newAuthorBtn = document.getElementById('newAuthorBtn');

        // Hide all action buttons first
        newPostBtn.style.display = 'none';
        newAuthorBtn.style.display = 'none';

        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        this.currentSection = sectionName;

        switch (sectionName) {
            case 'posts':
                pageTitle.textContent = 'Posts';
                newPostBtn.style.display = 'inline-flex';
                document.getElementById('postsSection').classList.add('active');
                this.loadPosts();
                break;
            case 'authors':
                pageTitle.textContent = 'Authors';
                newAuthorBtn.style.display = 'inline-flex';
                document.getElementById('authorsSection').classList.add('active');
                this.loadAuthors();
                break;
            case 'inbox':
                pageTitle.textContent = 'Inbox';
                document.getElementById('inboxSection').classList.add('active');
                this.loadInbox();
                break;
            case 'settings':
                pageTitle.textContent = 'Settings';
                document.getElementById('settingsSection').classList.add('active');
                this.loadSettings();
                break;
        }
    }

    async loadPosts() {
        const loadingEl = document.getElementById('postsLoading');
        const tableBody = document.getElementById('postsTableBody');
        const emptyState = document.getElementById('postsEmpty');

        loadingEl.style.display = 'flex';
        
        try {
            const params = new URLSearchParams();
            
            // Add filters
            const search = document.getElementById('postsSearch')?.value;
            const status = document.getElementById('statusFilter')?.value;
            const contentType = document.getElementById('contentTypeFilter')?.value;

            if (search) params.append('q', search);
            if (status) params.append('status', status);
            if (contentType) params.append('contentType', contentType);
            
            // For authors, only show their own posts
            if (this.currentUser.role === 'author') {
                params.append('authorId', this.currentUser.id);
            }

            const response = await fetch(`/api/posts?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load posts');
            }

            this.posts = data.posts;
            this.renderPostsTable();

        } catch (error) {
            console.error('Error loading posts:', error);
            if (window.toast) {
                window.toast.error('Failed to load posts');
            }
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderPostsTable() {
        const tableBody = document.getElementById('postsTableBody');
        const emptyState = document.getElementById('postsEmpty');

        if (this.posts.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const rows = this.posts.map(post => {
            const publishedDate = post.publishedAt ? 
                new Date(post.publishedAt).toLocaleDateString() : 
                new Date(post.updatedAt).toLocaleDateString();

            return `
                <tr>
                    <td>
                        <div class="table-title">${post.title}</div>
                        <div class="table-meta">${post.contentType} • ${post.serviceCategory}</div>
                    </td>
                    <td>
                        <div class="table-author">
                            ${post.author?.avatarUrl ? 
                                `<img src="${post.author.avatarUrl}" alt="${post.author.fullName}" class="table-avatar">` :
                                `<div class="table-initials">${this.getInitials(post.author?.fullName || 'Unknown')}</div>`
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
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            ${post.status === 'pending_approval' && this.currentUser.role === 'admin' ? `
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

        tableBody.innerHTML = rows;
    }

    async loadAuthors() {
        const loadingEl = document.getElementById('authorsLoading');
        const tableBody = document.getElementById('authorsTableBody');

        loadingEl.style.display = 'flex';
        
        try {
            const response = await fetch('/api/authors');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load authors');
            }

            this.authors = data;
            this.renderAuthorsTable();

        } catch (error) {
            console.error('Error loading authors:', error);
            if (window.toast) {
                window.toast.error('Failed to load authors');
            }
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderAuthorsTable() {
        const tableBody = document.getElementById('authorsTableBody');

        const rows = this.authors.map(author => {
            const createdDate = new Date(author.created_at).toLocaleDateString();

            return `
                <tr>
                    <td>
                        <div class="table-author">
                            ${author.avatar_url ? 
                                `<img src="${author.avatar_url}" alt="${author.full_name}" class="table-avatar">` :
                                `<div class="table-initials">${this.getInitials(author.full_name)}</div>`
                            }
                            <div>
                                <div class="table-title">${author.full_name}</div>
                                <div class="table-meta">${author.designation || 'No designation'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${author.username}</td>
                    <td><span class="status-badge ${author.role}">${author.role}</span></td>
                    <td>0</td>
                    <td><span class="status-badge ${author.active ? 'active' : 'inactive'}">${author.active ? 'Active' : 'Inactive'}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit" onclick="adminDashboard.editAuthor('${author.id}')" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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

        tableBody.innerHTML = rows;
    }

    async loadInbox() {
        const loadingEl = document.getElementById('inboxLoading');
        const tableBody = document.getElementById('inboxTableBody');
        const emptyState = document.getElementById('inboxEmpty');

        loadingEl.style.display = 'flex';
        
        try {
            const response = await fetch('/api/contact/admin/submissions');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load inbox');
            }

            this.submissions = data;
            this.renderInboxTable();

        } catch (error) {
            console.error('Error loading inbox:', error);
            if (window.toast) {
                window.toast.error('Failed to load inbox');
            }
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderInboxTable() {
        const tableBody = document.getElementById('inboxTableBody');
        const emptyState = document.getElementById('inboxEmpty');

        if (this.submissions.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const rows = this.submissions.map(submission => {
            const submittedDate = new Date(submission.created_at).toLocaleDateString();

            return `
                <tr>
                    <td>
                        <div class="table-title">${submission.name}</div>
                        <div class="table-meta">${submission.submission_type.replace('_', ' ')}</div>
                    </td>
                    <td>${submission.email}</td>
                    <td>${submission.phone || '-'}</td>
                    <td>
                        <div class="table-title" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                            ${submission.message ? submission.message.substring(0, 100) + (submission.message.length > 100 ? '...' : '') : '-'}
                        </div>
                        ${submission.company ? `<div class="table-meta">Company: ${submission.company}</div>` : ''}
                    </td>
                    <td>${submittedDate}</td>
                    <td><span class="status-badge active">New</span></td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    }

    async loadSettings() {
        // Load popular posts settings and other configurations
        try {
            const response = await fetch('/api/posts?limit=20&status=approved');
            const data = await response.json();

            if (response.ok) {
                this.renderPopularPostsSettings(data.posts);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    renderPopularPostsSettings(posts) {
        const container = document.getElementById('popularPostsSettings');
        if (!container) return;

        const html = posts.map(post => `
            <div class="popular-post-item">
                <input type="checkbox" class="popular-post-checkbox" value="${post.id}" id="popular-${post.id}">
                <label for="popular-${post.id}" class="popular-post-info">
                    <div class="popular-post-title">${post.title}</div>
                    <div class="popular-post-meta">${post.contentType} • ${this.formatNumber(post.views || 0)} views</div>
                </label>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Post Editor Methods
    openPostEditor(postId = null) {
        this.currentPost = postId;
        const modal = document.getElementById('postEditorModal');
        const title = document.getElementById('editorTitle');
        const form = document.getElementById('postEditorForm');

        if (postId) {
            title.textContent = 'Edit Post';
            this.loadPostData(postId);
        } else {
            title.textContent = 'New Post';
            form.reset();
            this.clearEditor();
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closePostEditor() {
        const modal = document.getElementById('postEditorModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentPost = null;
    }

    async loadPostData(postId) {
        try {
            const post = this.posts.find(p => p.id === postId);
            if (!post) return;

            const form = document.getElementById('postEditorForm');
            
            // Fill form fields
            form.title.value = post.title;
            form.slug.value = post.slug;
            form.excerpt.value = post.excerpt;
            form.bannerUrl.value = post.banner.url;
            form.bannerAlt.value = post.banner.alt;
            form.contentType.value = post.contentType;
            form.serviceCategory.value = post.serviceCategory;

            // Set template mode
            const templateMode = post.template.mode || 'default';
            form.templateMode.value = templateMode;
            this.toggleTemplateFields(templateMode);

            // Load content based on template mode
            if (templateMode === 'default') {
                const editor = document.getElementById('contentEditor');
                editor.innerHTML = post.template.defaultFields?.body || '';
                
                // Load pull quotes
                this.pullQuotes = post.template.defaultFields?.pullQuotes || [];
                this.renderPullQuotes();
            } else {
                form.customHtml.value = post.template.customFields?.html || '';
                form.customCss.value = post.template.customFields?.css || '';
                form.customJs.value = post.template.customFields?.js || '';
            }

            // Load tags
            this.tags = post.tags || [];
            this.renderTags();

            // Load SEO fields
            form.seoTitle.value = post.seo?.title || '';
            form.seoDescription.value = post.seo?.description || '';
            form.canonical.value = post.seo?.canonical || '';

            // Show appropriate action buttons
            this.updateEditorButtons(post);

        } catch (error) {
            console.error('Error loading post data:', error);
        }
    }

    updateEditorButtons(post) {
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const submitApprovalBtn = document.getElementById('submitApprovalBtn');
        const approvePostBtn = document.getElementById('approvePostBtn');
        const rejectPostBtn = document.getElementById('rejectPostBtn');

        // Hide all buttons first
        saveDraftBtn.style.display = 'none';
        submitApprovalBtn.style.display = 'none';
        approvePostBtn.style.display = 'none';
        rejectPostBtn.style.display = 'none';

        if (this.currentUser.role === 'admin') {
            // Admins can see all buttons based on post status
            if (post.status === 'pending_approval') {
                approvePostBtn.style.display = 'inline-flex';
                rejectPostBtn.style.display = 'inline-flex';
            }
        } else if (this.currentUser.role === 'author') {
            // Authors can only submit their own posts for approval
            if (post.authorId === this.currentUser.id && 
                (post.status === 'draft' || post.status === 'rejected')) {
                submitApprovalBtn.style.display = 'inline-flex';
            }
        }
    }

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

    execCommand(command, value = null) {
        const editor = document.getElementById('contentEditor');
        editor.focus();

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
    }

    addPullQuote() {
        this.pullQuotes.push({ text: '', citation: '' });
        this.renderPullQuotes();
    }

    removePullQuote(index) {
        this.pullQuotes.splice(index, 1);
        this.renderPullQuotes();
    }

    renderPullQuotes() {
        const container = document.getElementById('pullQuotesContainer');
        if (!container) return;

        const html = this.pullQuotes.map((quote, index) => `
            <div class="pull-quote-item">
                <div class="pull-quote-header">
                    <span class="pull-quote-title">Pull Quote ${index + 1}</span>
                    <button type="button" class="remove-quote-btn" onclick="adminDashboard.removePullQuote(${index})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" x2="6" y1="6" y2="18"></line>
                            <line x1="6" x2="18" y1="6" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="form-group">
                    <input type="text" placeholder="Quote text" value="${quote.text}" onchange="adminDashboard.updatePullQuote(${index}, 'text', this.value)" class="form-input">
                </div>
                <div class="form-group">
                    <input type="text" placeholder="Citation (optional)" value="${quote.citation}" onchange="adminDashboard.updatePullQuote(${index}, 'citation', this.value)" class="form-input">
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updatePullQuote(index, field, value) {
        if (this.pullQuotes[index]) {
            this.pullQuotes[index][field] = value;
        }
    }

    addTag(tagText) {
        if (tagText && !this.tags.includes(tagText)) {
            this.tags.push(tagText);
            this.renderTags();
        }
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.renderTags();
    }

    renderTags() {
        const container = document.getElementById('tagsContainer');
        if (!container) return;

        const html = this.tags.map((tag, index) => `
            <div class="tag-item">
                <span>${tag}</span>
                <button type="button" class="remove-tag-btn" onclick="adminDashboard.removeTag(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" x2="6" y1="6" y2="18"></line>
                        <line x1="6" x2="18" y1="6" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        await this.savePost();
    }

    async savePost(status = null) {
        const form = document.getElementById('postEditorForm');
        const formData = new FormData(form);

        try {
            const templateMode = formData.get('templateMode');
            let template = { mode: templateMode };

            if (templateMode === 'default') {
                const editor = document.getElementById('contentEditor');
                template.defaultFields = {
                    body: editor.innerHTML,
                    pullQuotes: this.pullQuotes.filter(q => q.text.trim())
                };
            } else {
                template.customFields = {
                    html: formData.get('customHtml') || '',
                    css: formData.get('customCss') || '',
                    js: formData.get('customJs') || ''
                };
            }

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
                template,
                tags: this.tags,
                relatedIds: [], // TODO: Implement related posts selection
                seo: {
                    title: formData.get('seoTitle'),
                    description: formData.get('seoDescription'),
                    canonical: formData.get('canonical')
                }
            };

            let response;
            if (this.currentPost) {
                // Update existing post
                response = await fetch(`/api/posts/${this.currentPost}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            } else {
                // Create new post
                response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success(this.currentPost ? 'Post updated successfully!' : 'Post created successfully!');
                }
                this.closePostEditor();
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to save post');
            }

        } catch (error) {
            console.error('Error saving post:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to save post');
            }
        }
    }

    async submitForApproval() {
        if (!this.currentPost) return;

        try {
            const response = await fetch(`/api/posts/${this.currentPost}/submit`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Post submitted for approval!');
                }
                this.closePostEditor();
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to submit post');
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to submit post');
            }
        }
    }

    async approvePost(postId = null) {
        const id = postId || this.currentPost;
        if (!id) return;

        try {
            const response = await fetch(`/api/posts/${id}/approve`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Post approved successfully!');
                }
                if (!postId) this.closePostEditor();
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to approve post');
            }
        } catch (error) {
            console.error('Error approving post:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to approve post');
            }
        }
    }

    async rejectPost(postId = null) {
        const id = postId || this.currentPost;
        if (!id) return;

        const reason = prompt('Reason for rejection (optional):');

        try {
            const response = await fetch(`/api/posts/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Post rejected');
                }
                if (!postId) this.closePostEditor();
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to reject post');
            }
        } catch (error) {
            console.error('Error rejecting post:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to reject post');
            }
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

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Post deleted successfully');
                }
                this.loadPosts();
            } else {
                throw new Error(data.error || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to delete post');
            }
        }
    }

    editPost(postId) {
        this.openPostEditor(postId);
    }

    // Author Editor Methods
    openAuthorEditor(authorId = null) {
        this.currentAuthor = authorId;
        const modal = document.getElementById('authorEditorModal');
        const title = document.getElementById('authorEditorTitle');
        const form = document.getElementById('authorEditorForm');
        const passwordField = document.getElementById('authorPassword');

        if (authorId) {
            title.textContent = 'Edit Author';
            this.loadAuthorData(authorId);
            passwordField.required = false;
        } else {
            title.textContent = 'New Author';
            form.reset();
            passwordField.required = true;
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeAuthorEditor() {
        const modal = document.getElementById('authorEditorModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentAuthor = null;
    }

    async loadAuthorData(authorId) {
        try {
            const author = this.authors.find(a => a.id === authorId);
            if (!author) return;

            const form = document.getElementById('authorEditorForm');
            
            form.username.value = author.username;
            form.fullName.value = author.full_name;
            form.role.value = author.role;
            form.designation.value = author.designation || '';
            form.avatarUrl.value = author.avatar_url || '';
            form.bio.value = author.bio || '';
            form.active.checked = author.active;

            // Load social links
            if (author.social) {
                Object.keys(author.social).forEach(platform => {
                    const input = form[platform];
                    if (input) {
                        input.value = author.social[platform] || '';
                    }
                });
            }

        } catch (error) {
            console.error('Error loading author data:', error);
        }
    }

    async handleAuthorSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);

        try {
            const authorData = {
                username: formData.get('username'),
                fullName: formData.get('fullName'),
                role: formData.get('role'),
                designation: formData.get('designation'),
                bio: formData.get('bio'),
                avatarUrl: formData.get('avatarUrl'),
                active: formData.get('active') === 'on',
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
            if (this.currentAuthor) {
                // Update existing author
                response = await fetch(`/api/authors/${this.currentAuthor}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorData)
                });
            } else {
                // Create new author
                if (!password) {
                    throw new Error('Password is required for new authors');
                }
                response = await fetch('/api/authors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success(this.currentAuthor ? 'Author updated successfully!' : 'Author created successfully!');
                }
                this.closeAuthorEditor();
                this.loadAuthors();
            } else {
                throw new Error(data.error || 'Failed to save author');
            }

        } catch (error) {
            console.error('Error saving author:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to save author');
            }
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

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success('Author deleted successfully');
                }
                this.loadAuthors();
            } else {
                throw new Error(data.error || 'Failed to delete author');
            }
        } catch (error) {
            console.error('Error deleting author:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to delete author');
            }
        }
    }

    // Utility Methods
    clearEditor() {
        const editor = document.getElementById('contentEditor');
        if (editor) editor.innerHTML = '';
        
        this.pullQuotes = [];
        this.tags = [];
        this.renderPullQuotes();
        this.renderTags();
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
        const statusMap = {
            'draft': 'Draft',
            'pending_approval': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Global functions for onclick handlers
window.closePostEditor = () => window.adminDashboard.closePostEditor();
window.closeAuthorEditor = () => window.adminDashboard.closeAuthorEditor();
window.closeConfirmModal = () => {
    document.getElementById('confirmModal').style.display = 'none';
};