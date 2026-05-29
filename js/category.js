// Category Page Logic
document.addEventListener('DOMContentLoaded', () => {
    loadCategoryFilters();
    loadCategoryProducts();
    updateCartUI();
});

function loadCategoryFilters() {
    const list = document.getElementById('category-filters');
    if (!list) return;
    
    const currentCat = new URLSearchParams(window.location.search).get('cat');
    
    let html = `<li><a href="category.html" class="${!currentCat ? 'active' : ''}">All Products</a></li>`;
    CATEGORIES.forEach(cat => {
        const isActive = currentCat === cat.slug;
        html += `<li><a href="category.html?cat=${cat.slug}" class="${isActive ? 'active' : ''}">${cat.name}</a></li>`;
    });
    list.innerHTML = html;
    
    // Set page title
    if (currentCat) {
        const category = CATEGORIES.find(c => c.slug === currentCat);
        if (category) {
            document.getElementById('page-title').textContent = category.name;
        }
    }
}

function loadCategoryProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('cat');
    const searchQuery = urlParams.get('search');
    
    let filteredProducts = [...PRODUCTS];
    
    if (categorySlug) {
        const category = CATEGORIES.find(c => c.slug === categorySlug);
        if (category) {
            filteredProducts = PRODUCTS.filter(p => p.categoryId === category.id);
        }
    }
    
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        document.getElementById('page-title').textContent = `Search: "${searchQuery}"`;
    }
    
    renderCategoryProducts(filteredProducts);
}

function renderCategoryProducts(products) {
    const container = document.getElementById('category-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">No products found matching your criteria.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function filterByPrice() {
    const min = parseInt(document.getElementById('min-price').value) || 0;
    const max = parseInt(document.getElementById('max-price').value) || 9999999;
    
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('cat');
    
    let filtered = [...PRODUCTS];
    
    if (categorySlug) {
        const category = CATEGORIES.find(c => c.slug === categorySlug);
        if (category) {
            filtered = PRODUCTS.filter(p => p.categoryId === category.id);
        }
    }
    
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    renderCategoryProducts(filtered);
}