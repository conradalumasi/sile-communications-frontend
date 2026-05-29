import re

with open('account.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inline script block
script_pattern = re.compile(r'<script>\s*const API_BASE = window\.API_BASE;.*?if \(typeof updateCartUI === \'function\'\) updateCartUI\(\);\s*</script>|<script>\s*const API_BASE = window\.API_BASE;.*?if \(typeof updateCartUI === \"function\"\) updateCartUI\(\);\s*</script>', re.DOTALL)
new_script = '<script src="js/account.js"></script>'
content = script_pattern.sub(new_script, content)

# Improve CSS slightly
css_improvements = """
      /* Additional account-specific styles */
      .account-page {
        margin: 40px 0;
      }
      .account-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 30px;
      }
      .account-sidebar {
        background: white;
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 20px;
        height: fit-content;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      }
      .account-user {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border);
      }
      .user-avatar {
        width: 100px;
        height: 100px;
        margin: 0 auto 12px;
        position: relative;
        cursor: pointer;
      }
      .user-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--primary);
        transition: transform 0.3s;
      }
      .user-avatar:hover img {
        transform: scale(1.05);
      }
      .user-avatar .edit-icon {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: var(--primary);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        border: 2px solid white;
        transition: transform 0.2s;
      }
      .user-avatar:hover .edit-icon {
        transform: scale(1.1);
      }
      .account-menu {
        list-style: none;
        padding: 0;
      }
      .account-menu li {
        padding: 14px 18px;
        cursor: pointer;
        border-radius: 12px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        color: var(--text);
      }
      .account-menu li:hover,
      .account-menu li.active {
        background: var(--bg-light);
        color: var(--primary);
        transform: translateX(5px);
      }
      .account-section {
        background: white;
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 30px;
        display: none;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        animation: fadeIn 0.4s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .account-section.active {
        display: block;
      }
      .account-section h2 {
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border);
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
      }
      .form-group {
        margin-bottom: 20px;
      }
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        font-size: 15px;
        transition: border-color 0.2s;
      }
      .form-group input:focus {
        outline: none;
        border-color: var(--primary);
      }
      .btn-primary {
        background: var(--primary);
        color: white;
        padding: 14px 28px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        font-size: 15px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(234,88,12,0.2);
      }
      .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
      .btn-danger {
        background: #ef4444;
      }
      .btn-danger:hover {
        background: #dc2626;
        box-shadow: 0 4px 12px rgba(239,68,68,0.2);
      }
      .toggle-switch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .toggle-switch input {
        width: 44px;
        height: 24px;
        appearance: none;
        background: #e5e7eb;
        border-radius: 24px;
        position: relative;
        cursor: pointer;
        transition: 0.3s;
      }
      .toggle-switch input:checked {
        background: var(--primary);
      }
      .toggle-switch input::before {
        content: "";
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 3px;
        left: 3px;
        transition: 0.3s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .toggle-switch input:checked::before {
        left: 23px;
      }
      .message-box {
        margin-top: 15px;
        margin-bottom: 20px;
        padding: 14px;
        border-radius: 12px;
        display: none;
        font-weight: 500;
        animation: fadeIn 0.3s;
      }
      .message-box.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }
      .message-box.error {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
      .order-categories {
        display: flex;
        gap: 10px;
        margin-bottom: 25px;
        flex-wrap: wrap;
      }
      .order-cat-btn {
        background: white;
        border: 1px solid var(--border);
        padding: 10px 20px;
        border-radius: 30px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: 0.2s;
        color: var(--text);
      }
      .order-cat-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
      .order-cat-btn.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
      .order-card {
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        transition: 0.3s;
        background: #fff;
      }
      .order-card:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        border-color: #e5e7eb;
      }
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }
      .order-status {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .status-pending {
        background: #fef3c7;
        color: #d97706;
      }
      .status-processing {
        background: #dbeafe;
        color: #2563eb;
      }
      .status-shipped {
        background: #e0e7ff;
        color: #4338ca;
      }
      .status-delivered {
        background: #d1fae5;
        color: #065f46;
      }
      .status-cancelled {
        background: #fee2e2;
        color: #dc2626;
      }
      @media (max-width: 768px) {
        .account-layout {
          grid-template-columns: 1fr;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
      }
      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
"""

style_pattern = re.compile(r'<style>\s*/\*\s*Additional account-specific styles\s*\*/.*?</style>', re.DOTALL)
content = style_pattern.sub('<style>\n' + css_improvements + '</style>', content)

with open('account.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('account.html updated successfully!')
