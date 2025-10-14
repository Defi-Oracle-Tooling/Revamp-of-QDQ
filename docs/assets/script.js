// Documentation Site JavaScript
// Handles theme switching, code copying, and interactive features

(function() {
    'use strict';
    
    // Theme Management
    class ThemeManager {
        constructor() {
            this.theme = localStorage.getItem('theme') || 'light';
            this.init();
        }
        
        init() {
            this.applyTheme();
            this.createToggleButton();
            this.bindEvents();
        }
        
        applyTheme() {
            document.documentElement.setAttribute('data-theme', this.theme);
        }
        
        createToggleButton() {
            const button = document.createElement('button');
            button.className = 'theme-toggle';
            button.innerHTML = this.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
            button.setAttribute('aria-label', 'Toggle theme');
            button.title = 'Toggle between light and dark themes';
            
            document.body.appendChild(button);
            this.toggleButton = button;
        }
        
        bindEvents() {
            this.toggleButton.addEventListener('click', () => this.toggle());
            
            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!localStorage.getItem('theme')) {
                        this.theme = e.matches ? 'dark' : 'light';
                        this.applyTheme();
                        this.updateToggleButton();
                    }
                });
            }
        }
        
        toggle() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', this.theme);
            this.applyTheme();
            this.updateToggleButton();
        }
        
        updateToggleButton() {
            this.toggleButton.innerHTML = this.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        }
    }
    
    // Code Copy Functionality
    class CodeCopyManager {
        constructor() {
            this.init();
        }
        
        init() {
            this.addCopyButtons();
        }
        
        addCopyButtons() {
            const codeBlocks = document.querySelectorAll('pre');
            
            codeBlocks.forEach((block, index) => {
                // Wrap in container for positioning
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block';
                block.parentNode.insertBefore(wrapper, block);
                wrapper.appendChild(block);
                
                // Create copy button
                const button = document.createElement('button');
                button.className = 'copy-button';
                button.innerHTML = '📋 Copy';
                button.setAttribute('aria-label', 'Copy code to clipboard');
                button.title = 'Copy code to clipboard';
                button.dataset.codeIndex = index;
                
                wrapper.appendChild(button);
                
                // Bind click event
                button.addEventListener('click', () => this.copyCode(block, button));
            });
        }
        
        async copyCode(codeBlock, button) {
            const code = codeBlock.querySelector('code')?.textContent || codeBlock.textContent;
            
            try {
                await navigator.clipboard.writeText(code);
                this.showCopySuccess(button);
            } catch (err) {
                // Fallback for older browsers
                this.fallbackCopy(code, button);
            }
        }
        
        fallbackCopy(text, button) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            try {
                document.execCommand('copy');
                this.showCopySuccess(button);
            } catch (err) {
                this.showCopyError(button);
            }
            
            document.body.removeChild(textarea);
        }
        
        showCopySuccess(button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.style.background = 'var(--success)';
            button.style.color = 'white';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                button.style.color = '';
            }, 2000);
        }
        
        showCopyError(button) {
            const originalText = button.innerHTML;
            button.innerHTML = '❌ Failed';
            button.style.background = 'var(--danger)';
            button.style.color = 'white';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                button.style.color = '';
            }, 2000);
        }
    }
    
    // Search Functionality (Simple Implementation)
    class SearchManager {
        constructor() {
            this.searchData = null;
            this.init();
        }
        
        init() {
            this.createSearchBox();
            this.indexContent();
        }
        
        createSearchBox() {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.innerHTML = `
                <input type="text" 
                       class="search-input" 
                       placeholder="Search documentation..." 
                       aria-label="Search documentation">
                <div class="search-results" style="display: none;"></div>
            `;
            
            // Insert after theme toggle or at top
            const themeToggle = document.querySelector('.theme-toggle');
            if (themeToggle && themeToggle.nextSibling) {
                themeToggle.parentNode.insertBefore(searchContainer, themeToggle.nextSibling);
            } else {
                document.body.insertBefore(searchContainer, document.body.firstChild);
            }
            
            this.bindSearchEvents(searchContainer);
        }
        
        bindSearchEvents(container) {
            const input = container.querySelector('.search-input');
            const results = container.querySelector('.search-results');
            
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    results.style.display = 'none';
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    this.performSearch(query, results);
                }, 300);
            });
            
            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    results.style.display = 'none';
                }
            });
        }
        
        indexContent() {
            const content = [];
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const paragraphs = document.querySelectorAll('p');
            
            headings.forEach(heading => {
                content.push({
                    type: 'heading',
                    text: heading.textContent,
                    element: heading,
                    level: parseInt(heading.tagName[1])
                });
            });
            
            paragraphs.forEach(p => {
                if (p.textContent.length > 20) {
                    content.push({
                        type: 'text',
                        text: p.textContent,
                        element: p
                    });
                }
            });
            
            this.searchData = content;
        }
        
        performSearch(query, resultsContainer) {
            if (!this.searchData) return;
            
            const matches = this.searchData.filter(item => 
                item.text.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5); // Limit to 5 results
            
            if (matches.length === 0) {
                resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
            } else {
                resultsContainer.innerHTML = matches.map(match => `
                    <div class="search-result" data-element="${match.element.tagName}">
                        <div class="search-result-title">${this.highlightText(match.text, query)}</div>
                        <div class="search-result-type">${match.type}</div>
                    </div>
                `).join('');
                
                // Add click handlers
                resultsContainer.querySelectorAll('.search-result').forEach((result, index) => {
                    result.addEventListener('click', () => {
                        matches[index].element.scrollIntoView({ behavior: 'smooth' });
                        resultsContainer.style.display = 'none';
                    });
                });
            }
            
            resultsContainer.style.display = 'block';
        }
        
        highlightText(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        }
    }
    
    // Table of Contents Generator
    class TOCManager {
        constructor() {
            this.init();
        }
        
        init() {
            const headings = document.querySelectorAll('h2, h3, h4');
            if (headings.length > 3) {
                this.generateTOC(headings);
            }
        }
        
        generateTOC(headings) {
            const tocContainer = document.createElement('div');
            tocContainer.className = 'table-of-contents';
            tocContainer.innerHTML = '<h3>📋 Table of Contents</h3>';
            
            const tocList = document.createElement('ul');
            tocList.className = 'toc-list';
            
            headings.forEach((heading, index) => {
                // Add ID if not present
                if (!heading.id) {
                    heading.id = `heading-${index}`;
                }
                
                const li = document.createElement('li');
                li.className = `toc-level-${heading.tagName[1]}`;
                li.innerHTML = `<a href="#${heading.id}">${heading.textContent}</a>`;
                tocList.appendChild(li);
            });
            
            tocContainer.appendChild(tocList);
            
            // Insert after first heading or at top of content
            const firstHeading = document.querySelector('h1, h2');
            if (firstHeading && firstHeading.nextSibling) {
                firstHeading.parentNode.insertBefore(tocContainer, firstHeading.nextSibling);
            }
        }
    }
    
    // Feedback System
    class FeedbackManager {
        constructor() {
            this.init();
        }
        
        init() {
            this.createFeedbackWidget();
        }
        
        createFeedbackWidget() {
            const widget = document.createElement('div');
            widget.className = 'feedback-widget';
            widget.innerHTML = `
                <div class="feedback-question">Was this page helpful?</div>
                <div class="feedback-buttons">
                    <button class="feedback-btn feedback-yes" data-rating="yes">👍 Yes</button>
                    <button class="feedback-btn feedback-no" data-rating="no">👎 No</button>
                </div>
                <div class="feedback-form" style="display: none;">
                    <textarea placeholder="Tell us how we can improve..." class="feedback-text"></textarea>
                    <button class="feedback-submit">Submit Feedback</button>
                </div>
            `;
            
            // Add to bottom of content
            document.body.appendChild(widget);
            
            this.bindFeedbackEvents(widget);
        }
        
        bindFeedbackEvents(widget) {
            const buttons = widget.querySelectorAll('.feedback-btn');
            const form = widget.querySelector('.feedback-form');
            const submitBtn = widget.querySelector('.feedback-submit');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rating = e.target.dataset.rating;
                    this.recordFeedback(rating);
                    
                    if (rating === 'no') {
                        form.style.display = 'block';
                    } else {
                        this.showFeedbackThankYou(widget);
                    }
                });
            });
            
            submitBtn.addEventListener('click', () => {
                const text = widget.querySelector('.feedback-text').value;
                this.submitDetailedFeedback(text);
                this.showFeedbackThankYou(widget);
            });
        }
        
        recordFeedback(rating) {
            // Store in localStorage for now (in production, send to analytics service)
            const feedback = JSON.parse(localStorage.getItem('doc-feedback') || '{}');
            const page = window.location.pathname;
            
            if (!feedback[page]) {
                feedback[page] = { yes: 0, no: 0 };
            }
            
            feedback[page][rating]++;
            localStorage.setItem('doc-feedback', JSON.stringify(feedback));
            
            console.log('Feedback recorded:', { page, rating });
        }
        
        submitDetailedFeedback(text) {
            // In production, send to feedback service
            console.log('Detailed feedback:', { 
                page: window.location.pathname, 
                feedback: text,
                timestamp: new Date().toISOString()
            });
        }
        
        showFeedbackThankYou(widget) {
            widget.innerHTML = '<div class="feedback-thanks">✅ Thank you for your feedback!</div>';
        }
    }
    
    // Performance Monitor
    class PerformanceMonitor {
        constructor() {
            this.init();
        }
        
        init() {
            this.measurePageLoad();
            this.trackInteractions();
        }
        
        measurePageLoad() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                    
                    console.log('Page performance:', {
                        loadTime: `${loadTime}ms`,
                        domContentLoaded: `${perfData.domContentLoadedEventEnd - perfData.fetchStart}ms`,
                        firstPaint: this.getFirstPaint(),
                        page: window.location.pathname
                    });
                }, 0);
            });
        }
        
        getFirstPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? `${firstPaint.startTime}ms` : 'N/A';
        }
        
        trackInteractions() {
            // Track copy button usage
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-button')) {
                    console.log('Code copied:', { 
                        timestamp: new Date().toISOString(),
                        page: window.location.pathname
                    });
                }
            });
            
            // Track search usage
            document.addEventListener('input', (e) => {
                if (e.target.classList.contains('search-input') && e.target.value.length > 2) {
                    console.log('Search query:', { 
                        query: e.target.value,
                        timestamp: new Date().toISOString(),
                        page: window.location.pathname
                    });
                }
            });
        }
    }
    
    // Initialize everything when DOM is ready
    function init() {
        new ThemeManager();
        new CodeCopyManager();
        new SearchManager();
        new TOCManager();
        new FeedbackManager();
        new PerformanceMonitor();
        
        console.log('📚 Documentation site initialized');
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();