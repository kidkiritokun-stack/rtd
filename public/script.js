// Toast Notification System
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = [];
        this.toastId = 0;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification';
        
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${message}</div>
        `;

        return toast;
    }

    remove(toast) {
        if (toast && toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts = this.toasts.filter(t => t !== toast);
            }, 300);
        }
    }

    success(message) {
        return this.show(message, 'success');
    }

    error(message) {
        return this.show(message, 'error');
    }
}

// Form Validation
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = {};
    }

    validate() {
        this.errors = {};
        const formData = new FormData(this.form);
        
        // Required fields validation
        const requiredFields = ['firstName', 'lastName', 'email'];
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || !value.toString().trim()) {
                this.addError(field, `${this.getFieldLabel(field)} is required`);
            }
        });

        // Email validation
        const email = formData.get('email');
        if (email && !this.isValidEmail(email)) {
            this.addError('email', 'Please enter a valid email address');
        }

        // Phone validation (if provided)
        const phone = formData.get('phone');
        if (phone && !this.isValidPhone(phone)) {
            this.addError('phone', 'Please enter a valid phone number');
        }

        // Message validation
        const message = formData.get('message');
        if (message && !message.toString().trim()) {
            this.addError('message', 'Message is required');
        }

        return Object.keys(this.errors).length === 0;
    }

    addError(field, message) {
        this.errors[field] = message;
        const input = this.form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            this.showFieldError(input, message);
        }
    }

    showFieldError(input, message) {
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    clearErrors() {
        // Remove error classes and messages
        this.form.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });
        this.form.querySelectorAll('.error-message').forEach(element => {
            element.remove();
        });
        this.errors = {};
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    getFieldLabel(field) {
        const labels = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            phone: 'Phone',
            message: 'Message'
        };
        return labels[field] || field;
    }
}

// Contact Form Handler
class ContactForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;
        
        this.validator = new FormValidator(this.form);
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;

        this.validator.clearErrors();
        
        if (!this.validator.validate()) {
            toast.error('Please correct the errors and try again');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<div class="spinner"></div>Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.submitForm();
            toast.success('Thank you! We\'ll be in touch soon.');
            this.form.reset();
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            this.isSubmitting = false;
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    }

    async submitForm() {
        // Simulate network delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Here you would normally send data to your server
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                console.log('Form submitted with data:', data);
                
                // Simulate success (you can change this to simulate errors)
                if (Math.random() > 0.1) {
                    resolve(data);
                } else {
                    reject(new Error('Network error'));
                }
            }, 1500);
        });
    }

    validateField(input) {
        const value = input.value.trim();
        const name = input.name;
        
        this.clearFieldError(input);
        
        if (input.hasAttribute('required') && !value) {
            this.showFieldError(input, `${this.validator.getFieldLabel(name)} is required`);
            return false;
        }

        if (name === 'email' && value && !this.validator.isValidEmail(value)) {
            this.showFieldError(input, 'Please enter a valid email address');
            return false;
        }

        if (name === 'phone' && value && !this.validator.isValidPhone(value)) {
            this.showFieldError(input, 'Please enter a valid phone number');
            return false;
        }

        input.classList.add('success');
        return true;
    }

    clearFieldError(input) {
        input.classList.remove('error', 'success');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    showFieldError(input, message) {
        input.classList.add('error');
        
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }
}

// Hero Form Handler
class HeroForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;
        
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;

        const challengeInput = document.getElementById('challengeInput');
        const challenge = challengeInput.value.trim();

        if (!challenge) {
            toast.error('Please describe your D2C growth challenge');
            challengeInput.focus();
            return;
        }

        this.isSubmitting = true;
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<div class="spinner"></div>Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.submitChallenge(challenge);
            toast.success('Thank you! We\'ll analyze your challenge and get back to you soon.');
            challengeInput.value = '';
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            this.isSubmitting = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async submitChallenge(challenge) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('Challenge submitted:', challenge);
                
                // Simulate success
                if (Math.random() > 0.1) {
                    resolve({ challenge });
                } else {
                    reject(new Error('Network error'));
                }
            }, 1500);
        });
    }
}

// Mobile Menu Handler
class MobileMenu {
    constructor() {
        this.menuToggle = document.getElementById('mobileMenuToggle');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.isOpen = false;
        
        this.init();
    }

    init() {
        if (!this.menuToggle || !this.mobileMenu) return;

        this.menuToggle.addEventListener('click', () => this.toggle());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.mobileMenu.contains(e.target) && !this.menuToggle.contains(e.target)) {
                this.close();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close menu when clicking on links
        this.mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.close());
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.mobileMenu.classList.add('active');
        this.menuToggle.setAttribute('aria-expanded', 'true');
        
        // Update icon to X
        this.menuToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-icon">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
            </svg>
        `;
    }

    close() {
        this.isOpen = false;
        this.mobileMenu.classList.remove('active');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        
        // Update icon to hamburger
        this.menuToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-icon">
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
        `;
    }
}

// FAQ Handler
class FAQHandler {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('.faq-icon svg');

            if (question && answer) {
                question.addEventListener('click', () => {
                    const isOpen = answer.classList.contains('active');
                    
                    // Close all other FAQ items
                    this.faqItems.forEach(otherItem => {
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherQuestion = otherItem.querySelector('.faq-question');
                        const otherIcon = otherItem.querySelector('.faq-icon svg');
                        
                        if (otherAnswer && otherQuestion && otherItem !== item) {
                            otherAnswer.classList.remove('active');
                            otherQuestion.setAttribute('aria-expanded', 'false');
                            if (otherIcon) {
                                // Change back to plus icon
                                otherIcon.innerHTML = `
                                    <line x1="12" x2="12" y1="5" y2="19"></line>
                                    <line x1="5" x2="19" y1="12" y2="12"></line>
                                `;
                            }
                        }
                    });

                    // Toggle current item
                    if (isOpen) {
                        answer.classList.remove('active');
                        question.setAttribute('aria-expanded', 'false');
                        if (icon) {
                            // Change to plus icon
                            icon.innerHTML = `
                                <line x1="12" x2="12" y1="5" y2="19"></line>
                                <line x1="5" x2="19" y1="12" y2="12"></line>
                            `;
                        }
                    } else {
                        answer.classList.add('active');
                        question.setAttribute('aria-expanded', 'true');
                        if (icon) {
                            // Change to X icon
                            icon.innerHTML = `
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                            `;
                        }
                    }
                });
            }
        });
    }
}

// Question Input Handler
class QuestionInputHandler {
    constructor() {
        this.questionInput = document.getElementById('questionInput');
        this.clearBtn = document.querySelector('.clear-btn');
        this.init();
    }

    init() {
        if (!this.questionInput) return;

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.questionInput.value = '';
                this.questionInput.focus();
            });
        }

        this.questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitQuestion();
            }
        });
    }

    submitQuestion() {
        const question = this.questionInput.value.trim();
        if (question) {
            console.log('Question submitted:', question);
            toast.success('Thank you for your question! We\'ll get back to you soon.');
            this.questionInput.value = '';
        }
    }
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Input Enhancement
function enhanceFormInputs() {
    const inputs = document.querySelectorAll('.form-input, .form-textarea, .challenge-input');
    
    inputs.forEach(input => {
        // Add focus effects
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
        
        // Handle placeholder animation
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
}

// Accessibility Improvements
function initAccessibility() {
    // Add keyboard navigation for custom elements
    document.querySelectorAll('.social-link, .radio-label, .btn').forEach(element => {
        if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
            element.setAttribute('tabindex', '0');
        }
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Animation Observer
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .footer, .section-title, .section-description').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Performance Optimization
function optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading attribute for lazy loading
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add error handling
        img.addEventListener('error', function() {
            console.warn('Failed to load image:', this.src);
            // You could set a fallback image here
            // this.src = 'path/to/fallback-image.jpg';
        });

        // Add load event for fade-in effect
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });

        // Set initial opacity for fade-in effect
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
        }
    });
}

// Error Handling
function initErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('JavaScript error:', e.error);
        // You could send error reports to your analytics service here
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        // Handle promise rejections
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Scroll to Top Functionality
function initScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: var(--brand-primary);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-soft);
    `;

    document.body.appendChild(scrollToTopBtn);

    const handleScroll = throttle(() => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollToTopBtn.addEventListener('mouseenter', () => {
        scrollToTopBtn.style.transform = 'scale(1.1)';
    });

    scrollToTopBtn.addEventListener('mouseleave', () => {
        scrollToTopBtn.style.transform = 'scale(1)';
    });
}

// Form Analytics (Privacy-friendly)
function trackFormInteraction(action, field = null) {
    // This is where you would send analytics data
    // Using privacy-friendly analytics or your own tracking
    console.log('Form interaction:', { action, field, timestamp: new Date().toISOString() });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize global toast manager
    window.toast = new ToastManager();

    // Initialize components
    const mobileMenu = new MobileMenu();
    const faqHandler = new FAQHandler();
    const questionInputHandler = new QuestionInputHandler();

    // Initialize forms based on what's available on the page
    const contactForm = new ContactForm('contactForm');
    const heroForm = new HeroForm('heroForm');

    // Initialize features
    initSmoothScrolling();
    enhanceFormInputs();
    initAccessibility();
    initAnimations();
    optimizeImages();
    initErrorHandling();
    initScrollToTop();

    // Services page specific initialization
    if (document.getElementById('testimonialsTrack')) {
        updateTestimonialsCarousel();
        initTestimonialsAutoplay();
    }

    // Track page load
    trackFormInteraction('page_load');

    console.log('Page initialized successfully');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible');
    } else {
        console.log('Page became hidden');
    }
});

// Progressive Web App features (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register service worker for offline functionality
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Services Page - Testimonials Carousel
let currentSlide = 0;
const totalSlides = 3;

function nextTestimonial() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateTestimonialsCarousel();
    }
}

function prevTestimonial() {
    if (currentSlide > 0) {
        currentSlide--;
        updateTestimonialsCarousel();
    }
}

function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateTestimonialsCarousel();
    }
}

function updateTestimonialsCarousel() {
    const track = document.getElementById('testimonialsTrack');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (track) {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    // Update indicators
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // Update button states
    if (prevBtn) {
        prevBtn.disabled = currentSlide === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }
}

// Auto-advance carousel
function initTestimonialsAutoplay() {
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateTestimonialsCarousel();
    }, 5000);
}

// Contact Modal Functions
function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus the first input
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Handle contact form submission
function handleContactSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        company: formData.get('company')
    };

    if (!data.name || !data.email || !data.company) {
        if (window.toast) {
            window.toast.error('Please fill in all required fields');
        } else {
            alert('Please fill in all required fields');
        }
        return;
    }

    console.log('Contact form submitted:', data);

    if (window.toast) {
        window.toast.success('Thank you! We\'ll be in touch soon.');
    } else {
        alert('Thank you! We\'ll be in touch soon.');
    }

    event.target.reset();
    closeContactModal();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('contactModal');
    if (modal && event.target === modal) {
        closeContactModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeContactModal();
    }
});

// Export for potential external use
window.WebsiteAPI = {
    ToastManager,
    FormValidator,
    ContactForm,
    HeroForm,
    MobileMenu,
    FAQHandler,
    QuestionInputHandler,
    // Services page functions
    nextTestimonial,
    prevTestimonial,
    goToSlide,
    openContactModal,
    closeContactModal,
    handleContactSubmit,
    toast: window.toast
};
