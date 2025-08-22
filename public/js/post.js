/**
 * Post Page JavaScript
 * Handles post loading, sidebar functionality, and interactions
 */

class PostManager {
    constructor() {
        this.postSlug = this.getSlugFromURL();
        this.post = null;
        this.relatedPosts = [];
        this.popularPosts = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPost();
        this.loadPopularPosts();
    }

    getSlugFromURL() {
        const path = window.location.pathname;
        const matches = path.match(/\/post\/(.+)/);
        return matches ? matches[1] : null;
    }

    bindEvents() {
        // Sidebar search
        const sidebarSearch = document.getElementById('sidebarSearch');
        if (sidebarSearch) {
            sidebarSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSidebarSearch(e.target.value);
                }
            });

            const searchBtn = document.querySelector('.search-btn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.handleSidebarSearch(sidebarSearch.value);
                });
            }
        }

        // Sidebar contact form
        const contactForm = document.getElementById('sidebarContactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                this.handleContactSubmit(e);
            });
        }
    }

    async loadPost() {
        if (!this.postSlug) {
            this.showError();
            return;
        }

        try {
            const response = await fetch(`/api/posts/${this.postSlug}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Post not found');
            }

            this.post = data.post;
            this.relatedPosts = data.relatedPosts || [];

            this.renderPost();
            this.renderRelatedPosts();
            this.updateSEO();
            this.trackPostView();

        } catch (error) {
            console.error('Error loading post:', error);
            this.showError();
        }
    }

    async loadPopularPosts() {
        try {
            const response = await fetch('/api/posts?limit=5&offset=0');
            const data = await response.json();

            if (response.ok && data.posts) {
                // Sort by views and take top 5
                this.popularPosts = data.posts
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5);
                
                this.renderPopularPosts();
            }
        } catch (error) {
            console.error('Error loading popular posts:', error);
        }
    }

    renderPost() {
        if (!this.post) return;

        // Hide loading, show content
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('postContent').style.display = 'block';

        // Update breadcrumb
        const breadcrumbCategory = document.getElementById('breadcrumbCategory');
        if (breadcrumbCategory) {
            breadcrumbCategory.textContent = this.post.contentType;
        }

        // Update title
        const postTitle = document.getElementById('postTitle');
        if (postTitle) {
            postTitle.textContent = this.post.title;
        }

        // Update banner
        const postBanner = document.getElementById('postBanner');
        if (postBanner && this.post.banner) {
            postBanner.innerHTML = `
                <img 
                    src="${this.post.banner.url}" 
                    alt="${this.post.banner.alt}"
                    loading="eager"
                >
            `;
        }

        // Update author info
        this.renderAuthorInfo();

        // Update meta info
        this.renderMetaInfo();

        // Update content
        this.renderContent();

        // Update author section
        this.renderAuthorSection();

        // Update social media
        this.renderSocialMedia();
    }

    renderAuthorInfo() {
        if (!this.post.author) return;

        const authorAvatar = document.getElementById('authorAvatar');
        const authorName = document.getElementById('authorName');

        if (authorAvatar && this.post.author.avatarUrl) {
            authorAvatar.innerHTML = `
                <img 
                    src="${this.post.author.avatarUrl}" 
                    alt="${this.post.author.fullName}"
                    loading="lazy"
                >
            `;
        }

        if (authorName) {
            authorName.textContent = this.post.author.fullName;
        }
    }

    renderMetaInfo() {
        // Published date
        const publishedDate = document.getElementById('publishedDate');
        if (publishedDate && this.post.publishedAt) {
            const date = new Date(this.post.publishedAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
            publishedDate.textContent = formattedDate;
        }

        // Badges
        const contentTypeBadge = document.getElementById('contentTypeBadge');
        const serviceCategoryBadge = document.getElementById('serviceCategoryBadge');

        if (contentTypeBadge) {
            contentTypeBadge.textContent = this.post.contentType;
        }

        if (serviceCategoryBadge) {
            serviceCategoryBadge.textContent = this.post.serviceCategory;
        }

        // Views
        const postViews = document.getElementById('postViews');
        if (postViews) {
            postViews.textContent = this.formatNumber(this.post.views || 0);
        }
    }

    renderContent() {
        const articleContent = document.getElementById('articleContent');
        if (!articleContent) return;

        if (this.post.template.mode === 'custom') {
            // Custom template
            const customFields = this.post.template.customFields;
            
            let content = '';
            if (customFields.html) {
                content = customFields.html;
            }

            // Add custom CSS
            if (customFields.css) {
                const style = document.createElement('style');
                style.textContent = customFields.css;
                document.head.appendChild(style);
            }

            articleContent.innerHTML = content;
            articleContent.classList.add('custom-template-content');

            // Add custom JavaScript (if any)
            if (customFields.js) {
                try {
                    // Execute in isolated scope
                    const script = document.createElement('script');
                    script.textContent = `(function() { ${customFields.js} })();`;
                    document.body.appendChild(script);
                } catch (error) {
                    console.error('Error executing custom JavaScript:', error);
                }
            }
        } else {
            // Default template
            const defaultFields = this.post.template.defaultFields;
            
            let content = '';
            if (defaultFields.body) {
                content = defaultFields.body;
            }

            // Add pull quotes
            if (defaultFields.pullQuotes && defaultFields.pullQuotes.length > 0) {
                defaultFields.pullQuotes.forEach(quote => {
                    const quoteHtml = `
                        <blockquote class="pull-quote">
                            <p>${quote.text}</p>
                            ${quote.citation ? `<cite>— ${quote.citation}</cite>` : ''}
                        </blockquote>
                    `;
                    // Insert pull quotes at strategic points in content
                    content = content.replace(/<\/p>/, '</p>' + quoteHtml);
                });
            }

            articleContent.innerHTML = content;
        }

        // Make external links open in new tab
        const links = articleContent.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (!link.hostname.includes(window.location.hostname)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    renderAuthorSection() {
        if (!this.post.author) return;

        const authorSectionTitle = document.getElementById('authorSectionTitle');
        const authorAvatarLarge = document.getElementById('authorAvatarLarge');
        const authorFullName = document.getElementById('authorFullName');
        const authorBio = document.getElementById('authorBio');
        const authorSocial = document.getElementById('authorSocial');

        if (authorSectionTitle) {
            authorSectionTitle.textContent = `About ${this.post.author.fullName}`;
        }

        if (authorAvatarLarge && this.post.author.avatarUrl) {
            authorAvatarLarge.innerHTML = `
                <img 
                    src="${this.post.author.avatarUrl}" 
                    alt="${this.post.author.fullName}"
                    loading="lazy"
                >
            `;
        }

        if (authorFullName) {
            authorFullName.textContent = this.post.author.fullName;
        }

        if (authorBio) {
            authorBio.textContent = this.post.author.bio || 'No bio available.';
        }

        if (authorSocial && this.post.author.social) {
            this.renderSocialLinks(authorSocial, this.post.author.social);
        }
    }

    renderSocialMedia() {
        const socialMediaWidget = document.getElementById('socialMedia');
        if (!socialMediaWidget || !this.post.author?.social) return;

        this.renderSocialLinks(socialMediaWidget, this.post.author.social);
    }

    renderSocialLinks(container, social) {
        const socialLinks = [];
        const socialIcons = {
            instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>`,
            youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>`,
            x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`,
            facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`,
            linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
            website: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
            email: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>`
        };

        Object.entries(social).forEach(([platform, url]) => {
            if (url && socialIcons[platform]) {
                const href = platform === 'email' ? `mailto:${url}` : url;
                socialLinks.push(`
                    <a href="${href}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${platform}">
                        ${socialIcons[platform]}
                    </a>
                `);
            }
        });

        container.innerHTML = socialLinks.join('');
    }

    renderPopularPosts() {
        const popularPostsContainer = document.getElementById('popularPosts');
        if (!popularPostsContainer || this.popularPosts.length === 0) return;

        const postsHTML = this.popularPosts.map(post => {
            const publishedDate = new Date(post.publishedAt);
            const formattedDate = publishedDate.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="popular-post-item" onclick="window.location.href='/post/${post.slug}'" role="button" tabindex="0" aria-label="Read ${post.title}">
                    <div class="popular-post-thumbnail">
                        <img src="${post.banner.url}" alt="${post.banner.alt}" loading="lazy">
                    </div>
                    <div class="popular-post-content">
                        <div class="popular-post-meta">${post.contentType} • ${formattedDate}</div>
                        <div class="popular-post-title">${post.title}</div>
                    </div>
                </div>
            `;
        }).join('');

        popularPostsContainer.innerHTML = postsHTML;

        // Add keyboard navigation
        const items = popularPostsContainer.querySelectorAll('.popular-post-item');
        items.forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    renderRelatedPosts() {
        const relatedPostsContainer = document.getElementById('relatedPosts');
        if (!relatedPostsContainer || this.relatedPosts.length === 0) {
            document.getElementById('relatedSection').style.display = 'none';
            return;
        }

        const postsHTML = this.relatedPosts.map(post => `
            <article class="related-post-card" onclick="window.location.href='/post/${post.slug}'" role="button" tabindex="0" aria-label="Read ${post.title}">
                <div class="related-post-image">
                    <img src="${post.banner.url}" alt="${post.banner.alt}" loading="lazy">
                    <div class="related-post-badges">
                        <span class="post-badge content-type">${post.contentType}</span>
                        <span class="post-badge service-category">${post.serviceCategory}</span>
                    </div>
                </div>
                <div class="related-post-content">
                    <h3 class="related-post-title">${post.title}</h3>
                    <p class="related-post-excerpt">${post.excerpt}</p>
                </div>
            </article>
        `).join('');

        relatedPostsContainer.innerHTML = postsHTML;

        // Add keyboard navigation
        const cards = relatedPostsContainer.querySelectorAll('.related-post-card');
        cards.forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    updateSEO() {
        if (!this.post) return;

        // Update page title
        document.title = this.post.seo.title || this.post.title;
        document.getElementById('pageTitle').textContent = document.title;

        // Update meta description
        const description = this.post.seo.description || this.post.excerpt;
        document.getElementById('pageDescription').setAttribute('content', description);

        // Update Open Graph
        document.getElementById('ogTitle').setAttribute('content', document.title);
        document.getElementById('ogDescription').setAttribute('content', description);
        document.getElementById('ogUrl').setAttribute('content', window.location.href);
        document.getElementById('ogImage').setAttribute('content', this.post.banner.url);

        // Update Twitter Card
        document.getElementById('twitterTitle').setAttribute('content', document.title);
        document.getElementById('twitterDescription').setAttribute('content', description);
        document.getElementById('twitterImage').setAttribute('content', this.post.banner.url);

        // Update canonical URL
        const canonicalUrl = this.post.seo.canonical || window.location.href;
        document.getElementById('canonicalUrl').setAttribute('href', canonicalUrl);

        // Update structured data
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": this.post.title,
            "description": description,
            "author": {
                "@type": "Person",
                "name": this.post.author?.fullName || "Right To Digital"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Right To Digital",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://api.builder.io/api/v1/image/assets/TEMP/4ecf8c9ad2d29eaf835b6b440391b07abb6d57ef?width=225"
                }
            },
            "datePublished": this.post.publishedAt,
            "dateModified": this.post.updatedAt,
            "image": this.post.banner.url,
            "url": window.location.href
        };

        document.getElementById('structuredData').textContent = JSON.stringify(structuredData, null, 2);
    }

    async trackPostView() {
        if (!this.post) return;

        try {
            await fetch(`/api/posts/${this.post.id}/view`, {
                method: 'POST'
            });
        } catch (error) {
            // Silently fail - view tracking is not critical
            console.warn('Failed to track post view:', error);
        }
    }

    handleSidebarSearch(query) {
        if (!query.trim()) return;

        // Redirect to main page with search query
        window.location.href = `/?q=${encodeURIComponent(query.trim())}`;
    }

    async handleContactSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.btn-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');

        // Show loading state
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    message: formData.get('message')
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (window.toast) {
                    window.toast.success(data.message || 'Message sent successfully!');
                } else {
                    alert('Message sent successfully!');
                }
                form.reset();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Contact form error:', error);
            if (window.toast) {
                window.toast.error(error.message || 'Failed to send message. Please try again.');
            } else {
                alert('Failed to send message. Please try again.');
            }
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    showError() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'flex';
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PostManager();
});

// Export for potential external use
window.PostManager = PostManager;