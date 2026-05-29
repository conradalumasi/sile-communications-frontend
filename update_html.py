import os
import glob
import re

html_files = glob.glob('*.html')

social_links_replacement = """            <div class="social-links">
              <a href="https://www.facebook.com/Silecommunications.ltd" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="https://www.instagram.com/silecommunicationsltd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="https://x.com/SileCommsLtd" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fab fa-x-twitter"></i></a>
              <a href="https://www.tiktok.com/@silecommunications" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
              <a href="https://wa.me/254710102424" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            </div>"""

account_btn_new = """            <div class="action-btn account" id="accountButton">
              <a href="login.html" id="accountLink">
                <i class="fas fa-user"></i>
                <span class="action-label" id="userNameLabel">Login</span>
              </a>
            </div>"""

for file in html_files:
    if "admin" in file:
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace social links
    content = re.sub(r'<div class="social-links">.*?</div>', social_links_replacement, content, flags=re.DOTALL)
    
    # Replace account button
    content = re.sub(r'<div class="action-btn account">.*?</div>', account_btn_new.strip(), content, flags=re.DOTALL)
    
    # Inject scripts
    if '<script src="js/wishlist.js"></script>' not in content:
        if '<script src="js/main.js"></script>' in content:
            content = content.replace('<script src="js/main.js"></script>', '<script src="js/wishlist.js"></script>\n    <script src="js/nav.js"></script>\n    <script src="js/main.js"></script>')
        elif '<script src="js/cart.js"></script>' in content:
            content = content.replace('<script src="js/cart.js"></script>', '<script src="js/cart.js"></script>\n    <script src="js/wishlist.js"></script>\n    <script src="js/nav.js"></script>')
            
    # Remove inline functions that are now in nav.js
    content = re.sub(r'\s*function toggleMobileMenu\(\) \{.*?\n\s*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\s*function toggleCart\(\) \{.*?\n\s*\}', '', content, flags=re.DOTALL)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("Updated HTML files!")
