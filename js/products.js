// Category Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('cat');
    const searchQuery = urlParams.get('search');
    
    let filteredProducts = PRODUCTS;

    // 1. Filter by Category
    if (categorySlug) {
        const category = CATEGORIES.find(c => c.slug === categorySlug);
        if (category) {
            document.getElementById('category-title').textContent = category.name;
            document.getElementById('page-title').textContent = category.name;
            filteredProducts = PRODUCTS.filter(p => p.categoryId === category.id);
        }
    } else {
        document.getElementById('category-title').textContent = "All Products";
    }

    // 2. Filter by Search
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        document.getElementById('category-title').textContent = `Search: "${searchQuery}"`;
        document.getElementById('page-title').textContent = "Search Results";
    }

    // 3. Populate Filters
    populateCategoryFilters();

    // 4. Render Products
    renderCategoryProducts(filteredProducts);
});

function populateCategoryFilters() {
    const list = document.getElementById('category-filters');
    if (!list) return;
    
    let html = `<li><a href="category.html" class="${!new URLSearchParams(window.location.search).get('cat') ? 'active' : ''}">All Products</a></li>`;
    CATEGORIES.forEach(cat => {
        const isActive = new URLSearchParams(window.location.search).get('cat') === cat.slug;
        html += `<li><a href="category.html?cat=${cat.slug}" class="${isActive ? 'active' : ''}">${cat.name}</a></li>`;
    });
    list.innerHTML = html;
}

function renderCategoryProducts(products) {
    const container = document.getElementById('category-products');
    const countEl = document.getElementById('product-count');
    
    if (!container) return;

    countEl.textContent = `${products.length} products found`;

    if (products.length === 0) {
        container.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.isOffer ? `<span class="badge offer">-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</span>` : ''}
            ${product.isHot ? '<span class="badge hot">HOT</span>' : ''}
            
            <div class="product-images">
                <img src="${product.image1}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300'">
            </div>
            
            <div class="product-info">
                <h3><a href="product.html?slug=${product.slug}">${product.name}</a></h3>
                
                <div class="price">
                    <span class="current">KSh ${product.price.toLocaleString()}</span>
                    ${product.oldPrice ? `<span class="old">KSh ${product.oldPrice.toLocaleString()}</span>` : ''}
                </div>
                
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function filterByPrice() {
    const min = parseInt(document.getElementById('min-price').value) || 0;
    const max = parseInt(document.getElementById('max-price').value) || 9999999;
    
    let currentProducts = PRODUCTS; // In a real app, you'd filter the already filtered list
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('cat');
    
    if (categorySlug) {
        const category = CATEGORIES.find(c => c.slug === categorySlug);
        if (category) currentProducts = PRODUCTS.filter(p => p.categoryId === category.id);
    }

    const filtered = currentProducts.filter(p => p.price >= min && p.price <= max);
    renderCategoryProducts(filtered);
}

function sortProducts() {
    const sortValue = document.getElementById('sort-select').value;
    let products = Array.from(document.querySelectorAll('.product-card')); // This is tricky with dynamic rendering, better to sort data source
    
    // Re-fetch based on current filters
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('cat');
    let filteredProducts = PRODUCTS;
    
    if (categorySlug) {
        const category = CATEGORIES.find(c => c.slug === categorySlug);
        if (category) filteredProducts = PRODUCTS.filter(p => p.categoryId === category.id);
    }

    if (sortValue === 'price-low') filteredProducts.sort((a, b) => a.price - b.price);
    if (sortValue === 'price-high') filteredProducts.sort((a, b) => b.price - a.price);
    if (sortValue === 'name') filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

    renderCategoryProducts(filteredProducts);
}