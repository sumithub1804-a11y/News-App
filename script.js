// Configuration
const API_KEY = 'https://newsdata.io/api/1/latest?apikey=YOUR_API_KEY&q=US%20tariffs&prioritydomain=top'; // Get free key from newsapi.org
const BASE_URL = 'https://https://newsdata.io/api/1/latest?apikey=YOUR_API_KEY&q=US%20tariffs&prioritydomain=top/v2';
let currentPage = 1;
let currentCategory = 'general';
let isLoading = false;
let allArticles = [];

// Database operations using LocalStorage
const db = {
    getFavorites() {
        return JSON.parse(localStorage.getItem('news_favorites') || '[]');
    },
    saveFavorite(article) {
        let favorites = this.getFavorites();
        const exists = favorites.find(fav => fav.url === article.url);
        if (!exists) {
            favorites.unshift(article); // Add to beginning
            localStorage.setItem('news_favorites', JSON.stringify(favorites));
            this.updateFavCount();
            return true;
        }
        return false;
    },
    removeFavorite(url) {
        let favorites = this.getFavorites();
        favorites = favorites.filter(fav => fav.url !== url);
        localStorage.setItem('news_favorites', JSON.stringify(favorites));
        this.updateFavCount();
    },
    updateFavCount() {
        const count = this.getFavorites().length;
        // Configuration
        const API_KEY = 'YOUR_NEWSAPI_KEY'; // Replace with your NewsAPI.org key
        const BASE_URL = 'https://newsapi.org/v2';
        let currentPage = 1;
        let currentCategory = 'general';
        let currentLanguage = 'en';
        let isLoading = false;
        let allArticles = [];

        // LocalStorage helpers
        const db = {
            getFavorites() {
                return JSON.parse(localStorage.getItem('news_favorites') || '[]');
            },
            saveFavorite(article) {
                const favorites = this.getFavorites();
                if (!favorites.find(f => f.url === article.url)) {
                    favorites.unshift(article);
                    localStorage.setItem('news_favorites', JSON.stringify(favorites));
                    this.updateFavCount();
                    return true;
                }
                return false;
            },
            removeFavorite(url) {
                const favorites = this.getFavorites().filter(f => f.url !== url);
                localStorage.setItem('news_favorites', JSON.stringify(favorites));
                this.updateFavCount();
            },
            updateFavCount() {
                const count = this.getFavorites().length;
                const el = document.getElementById('favCount');
                if (el) el.textContent = count;
            }
        };

        function setLanguage(lang) {
            currentLanguage = lang;
            const label = document.getElementById('langLabel');
            const names = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', ar: 'Arabic' };
            if (label) label.textContent = `Language: ${names[lang] || lang}`;
            currentPage = 1;
            fetchNews(currentCategory);
        }

        async function fetchNews(category = 'general', page = 1, query = '') {
            if (isLoading) return;
            isLoading = true;
            const loadBtn = document.getElementById('loadMoreBtn');
            if (loadBtn) loadBtn.style.display = 'none';

            try {
                // Build query term: prefer explicit search, otherwise category keyword or generic 'news'
                const categoryKeywords = {
                    general: 'news',
                    technology: 'technology',
                    business: 'business',
                    sports: 'sports'
                };

                const q = query || categoryKeywords[category] || 'news';

                // Use the /everything endpoint which supports `language`
                const params = new URLSearchParams({
                    q,
                    language: currentLanguage,
                    page: String(page),
                    pageSize: '10',
                    apiKey: API_KEY
                });

                const url = `${BASE_URL}/everything?${params.toString()}`;

                // If API key is not set, show demo data that demonstrates language switching
                if (!API_KEY || API_KEY === 'YOUR_NEWSAPI_KEY') {
                    const demo = demoArticlesFor(currentLanguage);
                    allArticles = demo;
                    displayNews(allArticles);
                    return;
                }

                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`API: ${resp.status}`);
                const data = await resp.json();

                if (page === 1) allArticles = data.articles || [];
                else allArticles = allArticles.concat(data.articles || []);

                displayNews(allArticles);
                if (loadBtn) loadBtn.style.display = (data.articles && data.articles.length === 10) ? 'inline-block' : 'none';
                document.getElementById('pageTitle').textContent = query ? `Search: ${query}` : `${capitalize(category)} News`;

            } catch (err) {
                console.error('Error fetching news:', err);
                showError('Failed to load news. Please check your internet connection or API key.');
            } finally {
                isLoading = false;
            }
        }

        function displayNews(articles) {
            const container = document.getElementById('newsContainer');
            container.innerHTML = '';

            articles.forEach(article => {
                const favorites = db.getFavorites();
                const isFavorite = favorites.some(fav => fav.url === article.url);

                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-6 mb-4';
                col.innerHTML = `
                    <div class="card news-card position-relative">
                        <img src="${article.urlToImage || article.image || 'https://via.placeholder.com/400x250/667eea/ffffff?text=News'}" class="card-img-top" alt="${escapeHtml(article.title || 'Article')}">
                        <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${escapeAttr(article.url)}')" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star"></i>
                        </button>
                        <div class="card-body p-4">
                            <span class="badge bg-danger mb-2">${escapeHtml(article.source?.name || article.source || 'Source')}</span>
                            <h5 class="card-title mt-2">${escapeHtml(article.title || '')}</h5>
                            <p class="card-text text-muted">${escapeHtml((article.description || article.content || '').substring(0, 120))}...</p>
                            <p class="small text-muted mb-3">${article.publishedAt ? new Date(article.publishedAt).toLocaleString() : ''}</p>
                            <a href="${escapeAttr(article.url)}" target="_blank" class="btn btn-danger btn-sm">Read Full Story</a>
                        </div>
                    </div>
                `;
                container.appendChild(col);
            });
        }

        function toggleFavorite(url) {
            const article = allArticles.find(a => a.url === url);
            if (!article) return;
            const favorites = db.getFavorites();
            if (favorites.some(f => f.url === url)) db.removeFavorite(url);
            else db.saveFavorite(article);
            displayNews(allArticles);
        }

        function showFavorites() {
            const favoritesSection = document.getElementById('favoritesSection');
            const emptySection = document.getElementById('emptyFavorites');
            const list = document.getElementById('favoritesList');

            const favorites = db.getFavorites();
            if (favorites.length === 0) {
                emptySection.style.display = 'block';
                favoritesSection.style.display = 'none';
                return;
            }

            list.innerHTML = favorites.map(article => `
                <div class="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${escapeHtml(article.title)}</h6>
                        <small class="text-muted">${escapeHtml(article.source?.name || article.source || '')} - ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}</small>
                    </div>
                    <div>
                        <a href="${escapeAttr(article.url)}" target="_blank" class="btn btn-sm btn-outline-danger me-1">Read</a>
                        <button class="btn btn-sm btn-outline-warning" onclick="removeFavorite('${escapeAttr(article.url)}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            favoritesSection.style.display = 'block';
            emptySection.style.display = 'none';
        }

        function loadMoreNews() {
            currentPage++;
            fetchNews(currentCategory, currentPage, document.getElementById('searchInput').value);
        }

        function handleSearch(event) {
            if (event.key === 'Enter') searchNews();
        }

        function searchNews() {
            const query = document.getElementById('searchInput').value;
            if (query.trim()) {
                currentPage = 1;
                fetchNews('', 1, query);
            }
        }

        function removeFavorite(url) {
            db.removeFavorite(url);
            showFavorites();
        }

        function showError(message) {
            const container = document.getElementById('newsContainer');
            container.innerHTML = `\n        <div class="col-12">\n            <div class="alert alert-warning text-center">\n                <i class="fas fa-exclamation-triangle fa-2x mb-3 d-block"></i>\n                <h5>Oops! Something went wrong</h5>\n                <p>${escapeHtml(message)}</p>\n                <button class="btn btn-danger" onclick="fetchNews('general')">Try Again</button>\n            </div>\n        </div>\n    `;
        }

        // Small utilities
        function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
        function escapeHtml(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
        function escapeAttr(s) { return (s || '').replace(/"/g,'&quot;'); }

        // Demo articles per language for offline/demo mode
        function demoArticlesFor(lang) {
            const demos = {
                en: [{ title: 'Global Markets Rally', description: 'Stocks rallied amid positive economic data.', url: '#', source: { name: 'Demo News' }, publishedAt: new Date().toISOString(), urlToImage: '' }],
                hi: [{ title: 'बाज़ार में तेजी', description: 'अर्थव्यवस्था के सकारात्मक संकेतों के बीच शेयर बढ़े।', url: '#', source: { name: 'डेमो न्यूज' }, publishedAt: new Date().toISOString() }],
                es: [{ title: 'Mercados en alza', description: 'Subidas tras datos económicos positivos.', url: '#', source: { name: 'Noticias Demo' }, publishedAt: new Date().toISOString() }],
                fr: [{ title: 'Les marchés remontent', description: 'Hausse suite à des données économiques favorables.', url: '#', source: { name: 'Nouvelles Démo' }, publishedAt: new Date().toISOString() }],
                ar: [{ title: 'ارتفاع الأسواق', description: 'ارتفعت الأسهم بعد بيانات اقتصادية إيجابية.', url: '#', source: { name: 'أخبار تجريبية' }, publishedAt: new Date().toISOString() }]
            };
            return demos[lang] || demos.en;
        }

        // Initialize
        window.addEventListener('load', () => {
            db.updateFavCount();
            // start with default language
            const sel = document.getElementById('languageSelect');
            if (sel) currentLanguage = sel.value || currentLanguage;
            setLanguage(currentLanguage);
        });
