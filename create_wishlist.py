import re
with open('category.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <title>
content = content.replace('<title>Products - Sile Communications</title>', '<title>My Wishlist - Sile Communications</title>')

# Find <main> block
main_pattern = re.compile(r'<main>.*?</main>', re.DOTALL)

new_main = """<main class="wishlist-page">
      <div class="container">
        <h1 class="page-title">My Wishlist</h1>
        <p class="page-subtitle">Products you've saved for later</p>

        <div id="wishlist-container" class="products-grid">
          <!-- Populated by JS -->
        </div>

        <div id="wishlist-empty" class="wishlist-empty" style="display: none;">
          <i class="far fa-heart"></i>
          <h3>Your wishlist is empty</h3>
          <p>Explore our products and add your favorites here.</p>
          <a href="category.html">Continue Shopping</a>
        </div>
      </div>
    </main>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        if (window.PRODUCTS && window.PRODUCTS.length > 0) {
          renderWishlist();
        } else {
          window.addEventListener('productsLoaded', renderWishlist);
        }
      });

      function renderWishlist() {
        const ids = typeof getWishlistIds === 'function' ? getWishlistIds() : [];
        const container = document.getElementById('wishlist-container');
        const emptyState = document.getElementById('wishlist-empty');

        if (!ids || ids.length === 0) {
          container.style.display = 'none';
          emptyState.style.display = 'block';
          return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        const wishlistedProducts = window.PRODUCTS.filter(p => ids.includes(p.id));
        container.innerHTML = wishlistedProducts.map(p => createProductCard(p)).join('');
        if (typeof refreshAllWishlistButtons === 'function') refreshAllWishlistButtons();
      }
      
      const originalToggle = window.toggleWishlist;
      if (originalToggle) {
        window.toggleWishlist = function(id) {
          originalToggle(id);
          setTimeout(renderWishlist, 100);
        };
      }
    </script>"""

content = main_pattern.sub(new_main, content)

with open('wishlist.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('wishlist.html created!')
