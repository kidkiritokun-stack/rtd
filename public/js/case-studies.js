/**
 * Case Studies Page JavaScript
 * Handles filtering, searching, pagination, and post loading
 */

class CaseStudiesManager {
    constructor() {
        this.currentFilters = {
            contentType: 'all',
            serviceCategory: 'all',
            search: ''
        };
        this.currentOffset = 0;
        this.limit = 6;
        this.hasMore = true;
        this.isLoading = false;
        this.allPosts = [];
        this.ctaInserted = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPosts();
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value.trim();
                    this.resetAndLoad();
                }, 300);
            });
        }

        // Content type filters
        const contentTypeFilters = document.getElementById('contentTypeFilters');
        if (contentTypeFilters) {
            contentTypeFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-pill')) {
                    this.handleFilterClick(e.target, 'contentType');
                }
            });
        }

        // Service category filters
        const serviceCategoryFilters = document.getElementById('serviceCategoryFilters');
        if (serviceCategoryFilters) {
            serviceCategoryFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-pill')) {
                    this.handleFilterClick(e.target, 'serviceCategory');
                }
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }

        // Reset filters button
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    handleFilterClick(button, filterType) {
        // Remove active class from siblings
        const siblings = button.parentElement.querySelectorAll('.filter-pill');
        siblings.forEach(sibling => sibling.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Update filter
        this.currentFilters[filterType] = button.dataset.filter;

        // Reset and load
        this.resetAndLoad();
    }

    resetFilters() {
        // Reset filter values
        this.currentFilters = {
            contentType: 'all',
            serviceCategory: 'all',
            search: ''
        };

        // Reset UI
        document.getElementById('searchInput').value = '';
        
        // Reset filter pills
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
            if (pill.dataset.filter === 'all') {
                pill.classList.add('active');
            }
        });

        // Reset and load
        this.resetAndLoad();
    }

    resetAndLoad() {
        this.currentOffset = 0;
        this.hasMore = true;
        this.ctaInserted = false;
        this.allPosts = [];
        
        // Clear grid
        const postsGrid = document.getElementById('postsGrid');
        if (postsGrid) {
            postsGrid.innerHTML = '';
        }

        this.loadPosts();
    }

    async loadPosts() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                offset: this.currentOffset,
                limit: this.limit
            });

            // Add filters
            if (this.currentFilters.contentType !== 'all') {
                params.append('contentType', this.currentFilters.contentType);
            }
            if (this.currentFilters.serviceCategory !== 'all') {
                params.append('serviceCategory', this.currentFilters.serviceCategory);
            }
            if (this.currentFilters.search) {
                params.append('q', this.currentFilters.search);
            }

            const response = await fetch(`/api/posts?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load posts');
            }

            this.handlePostsResponse(data);

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Failed to load case studies. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadMorePosts() {
        if (this.isLoading || !this.hasMore) return;

        this.currentOffset += this.limit;
        await this.loadPosts();
    }

    handlePostsResponse(data) {
        const { posts, pagination } = data;
        
        // Update pagination state
        this.hasMore = pagination.hasMore;
        
        // Add new posts to collection
        this.allPosts = [...this.allPosts, ...posts];

        // Render posts
        this.renderPosts(posts);

        // Update UI state
        this.updateUIState();
    }

    renderPosts(posts) {
        const postsGrid = document.getElementById('postsGrid');
        if (!postsGrid) return;

        posts.forEach((post, index) => {
            const postElement = this.createPostCard(post);
            postsGrid.appendChild(postElement);

            // Add CTA panel after 3rd post of first batch
            if (this.currentOffset === 0 && index === 2 && !this.ctaInserted) {
                const ctaPanel = this.createCTAPanel();
                postsGrid.appendChild(ctaPanel);
                this.ctaInserted = true;
            }
            // Add CTA panel after every 6 posts in subsequent batches
            else if (this.currentOffset > 0 && (this.allPosts.length - 1) % 6 === 2) {
                const ctaPanel = this.createCTAPanel();
                postsGrid.appendChild(ctaPanel);
            }
        });

        // Animate new posts
        requestAnimationFrame(() => {
            const newCards = postsGrid.querySelectorAll('.post-card:not(.fade-in)');
            newCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 100);
            });
        });
    }

    createPostCard(post) {
        const card = document.createElement('article');
        card.className = 'post-card';
        card.setAttribute('role', 'article');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Read article: ${post.title}`);

        // Format date
        const publishedDate = new Date(post.publishedAt);
        const formattedDate = publishedDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Format views
        const formattedViews = this.formatNumber(post.views || 0);

        card.innerHTML = `
            <div class="post-image-container">
                <img 
                    src="${post.banner.url}" 
                    alt="${post.banner.alt}"
                    class="post-image"
                    loading="lazy"
                >
                <div class="post-badges">
                    <span class="post-badge content-type">${post.contentType}</span>
                    <span class="post-badge service-category">${post.serviceCategory}</span>
                </div>
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${formattedDate}</span>
                    <div class="post-views">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>${formattedViews}</span>
                    </div>
                </div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-footer">
                    <div class="post-author">
                        ${post.author?.avatarUrl ? `
                            <img 
                                src="${post.author.avatarUrl}" 
                                alt="${post.author.fullName}"
                                class="author-avatar"
                                loading="lazy"
                            >
                        ` : ''}
                        <span class="author-name">${post.author?.fullName || 'Anonymous'}</span>
                    </div>
                    <button class="read-more-btn" aria-label="Read more about ${post.title}">
                        Read More
                    </button>
                </div>
            </div>
        `;

        // Add click handler
        card.addEventListener('click', () => {
            this.trackPostView(post.id);
            window.location.href = `/post/${post.slug}`;
        });

        // Add keyboard handler
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.trackPostView(post.id);
                window.location.href = `/post/${post.slug}`;
            }
        });

        return card;
    }

    createCTAPanel() {
        const panel = document.createElement('div');
        panel.className = 'cta-panel';
        panel.setAttribute('role', 'complementary');
        panel.setAttribute('aria-label', 'Call to action');

        panel.innerHTML = `
            <div class="cta-content">
                <h2 class="cta-title">Ready To Accelerate Your D2C Growth?</h2>
                <p class="cta-subtitle">
                    Book your free consultation and discover how we can transform your business with proven strategies.
                </p>
                <button class="cta-button" onclick="window.location.href='/contact.html'">
                    Book Your Free Consultation
                </button>
            </div>
        `;

        return panel;
    }

    updateUIState() {
        const postsGrid = document.getElementById('postsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (this.allPosts.length === 0) {
            // Show empty state
            postsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            loadMoreBtn.style.display = 'none';
        } else {
            // Show posts
            postsGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            
            // Show/hide load more button
            if (this.hasMore) {
                loadMoreBtn.style.display = 'inline-flex';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (this.currentOffset === 0) {
            // Initial load
            if (loadingState) loadingState.style.display = 'flex';
        } else {
            // Load more
            if (loadMoreBtn) {
                const btnText = loadMoreBtn.querySelector('.btn-text');
                const btnSpinner = loadMoreBtn.querySelector('.btn-spinner');
                if (btnText) btnText.style.display = 'none';
                if (btnSpinner) btnSpinner.style.display = 'block';
                loadMoreBtn.disabled = true;
            }
        }
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (loadMoreBtn) {
            const btnText = loadMoreBtn.querySelector('.btn-text');
            const btnSpinner = loadMoreBtn.querySelector('.btn-spinner');
            if (btnText) btnText.style.display = 'inline';
            if (btnSpinner) btnSpinner.style.display = 'none';
            loadMoreBtn.disabled = false;
        }
    }

    showError(message) {
        if (window.toast) {
            window.toast.error(message);
        } else {
            alert(message);
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    async trackPostView(postId) {
        try {
            await fetch(`/api/posts/${postId}/view`, {
                method: 'POST'
            });
        } catch (error) {
            // Silently fail - view tracking is not critical
            console.warn('Failed to track post view:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CaseStudiesManager();
});

// Export for potential external use
window.CaseStudiesManager = CaseStudiesManager;