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
        document.getElementById('favCount').textContent = count;
    }
};

// News API functions
async function fetchNews(category = 'general', page = 1, query = '') {
    if (isLoading) return;
    isLoading = true;
    
    try {
        document.getElementById('loadMoreBtn').style.display = 'none';
        
        let url = `${BASE_URL}/top-headlines?country=in&category=${category}&page=${page}&pageSize=10&apiKey=${API_KEY}`;
        if (query) {
            url = `${BASE_URL}/everything?q=${query}&language=en&page=${page}&pageSize=10&apiKey=${API_KEY}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (page === 1) {
            allArticles = data.articles;
        } else {
            allArticles = allArticles.concat(data.articles);
        }
        
        displayNews(allArticles);
        document.getElementById('loadMoreBtn').style.display = data.articles.length === 10 ? 'inline-block' : 'none';
        document.getElementById('pageTitle').textContent = query ? `Search: ${query}` : `${category.charAt(0).toUpperCase() + category.slice(1)} News`;
        
    } catch (error) {
        console.error('Error fetching news:', error);
        showError('Failed to load news. Please check your internet connection.');
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
        col.className = 'col-md-6 col-lg-6';
        col.innerHTML = `
            <div class="card news-card position-relative">
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x250/667eea/ffffff?text=News'}" 
                     class="card-img-top" alt="${article.title}">
                <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${article.url}')" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas fa-star"></i>
                </button>
                <div class="card-body p-4">
                    <span class="badge bg-danger mb-2">${article.source.name}</span>
                    <h5 class="card-title mt-2">${article.title}</h5>
                    <p class="card-text text-muted">${article.description?.substring(0, 120) || 'No description available'}...</p>
                    <p class="small text-muted mb-3">${new Date(article.publishedAt).toLocaleString('en-IN')}</p>
                    <a href="${article.url}" target="_blank" class="btn btn-danger btn-sm">Read Full Story</a>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function toggleFavorite(url) {
    const favorites = db.getFavorites();
    const article = allArticles.find(a => a.url === url);
    
    if (favorites.some(fav => fav.url === url)) {
        db.removeFavorite(url);
    } else {
        db.saveFavorite(article);
    }
    
    // Refresh current view
    displayNews(allArticles);
}

function showFavorites() {
    const favoritesSection = document.getElementById('favoritesSection');
    const emptySection = document.getElementById('emptyFavorites');
    
    if (favoritesSection.style.display === 'none' || !favoritesSection.style.display) {
        const favorites = db.getFavorites();
        const list = document.getElementById('favoritesList');
        
        if (favorites.length === 0) {
            emptySection.style.display = 'block';
            favoritesSection.style.display = 'none';
        } else {
            list.innerHTML = favorites.map(article => `
                <div class="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${article.title}</h6>
                        <small class="text-muted">${article.source?.name || 'Unknown'} - ${new Date(article.publishedAt).toLocaleDateString()}</small>
                    </div>
                    <div>
                        <a href="${article.url}" target="_blank" class="btn btn-sm btn-outline-danger me-1">Read</a>
                        <button class="btn btn-sm btn-outline-warning" onclick="removeFavorite('${article.url}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            favoritesSection.style.display = 'block';
            emptySection.style.display = 'none';
        }
    } else {
        favoritesSection.style.display = 'none';
        emptySection.style.display = 'block';
    }
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

// Initialize app
window.addEventListener('load', () => {
    db.updateFavCount();
    
    // Test with demo data if no API key (for project demo)
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please get free API key from newsapi.org and replace YOUR_API_KEY_HERE');
        return;
    }
    
    fetchNews('general');
});

// Error handler
function showError(message) {
    const container = document.getElementById('newsContainer');
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-3 d-block"></i>
                <h5>Oops! Something went wrong</h5>
                <p>${message}</p>
                <button class="btn btn-danger" onclick="fetchNews('general')">Try Again</button>
            </div>
        </div>
    `;
}
