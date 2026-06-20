// layout.js handles injecting the sidebar and top navigation into pages
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on all pages except index.html
    const path = window.location.pathname;
    if (!path.endsWith('index.html') && path !== '/' && path !== '/frontend/') {
        if (!api.getToken()) {
            // Determine correct index.html path based on current directory
            const depth = path.split('/').filter(p => p).length - (path.endsWith('/') ? 1 : 0);
            const indexPath = '../'.repeat(Math.max(depth - 1, 0)) + 'index.html';
            window.location.href = indexPath;
            return;
        }
    }

    // Get user role from localStorage (default to admin if not set)
    const userRole = localStorage.getItem('role') || 'admin';
    const currentPage = path.split('/').pop();
    // Determine base href based on current directory (admin/, campaign/, leads/)
    const segments = path.split('/');
    const roleDir = segments.length > 2 ? segments[segments.length - 2] : ''; // admin, campaign, or leads
    const baseHref = roleDir ? './' : './';

    // Function to check if menu item should be active
    const isActive = (pagePattern) => {
        if (pagePattern === 'dashboard.html' && currentPage === 'dashboard.html') return true;
        if (pagePattern.includes('*')) {
            return currentPage.startsWith(pagePattern.replace('*', ''));
        }
        return currentPage === pagePattern;
    };

    // Build menu items based on role
    let menuItems = '';
    
    // Admin & Leads have Dashboard
    if (userRole === 'admin' || userRole === 'leads') {
        menuItems += `
            <a href="${baseHref}dashboard.html" class="menu-item ${isActive('dashboard.html') ? 'active' : ''}">
                <i class="ph ph-squares-four" style="font-size: 20px;"></i>
                Dashboard
            </a>
        `;
    }

    // Admin & Leads have Customer & Kunjungan
    if (userRole === 'admin' || userRole === 'leads') {
        menuItems += `
            <a href="${baseHref}customer.html" class="menu-item ${isActive('customer.html') || isActive('tambah-customer.html') || isActive('edit-customer.html') ? 'active' : ''}">
                <i class="ph ph-users" style="font-size: 20px;"></i>
                Customer
            </a>
            <a href="${baseHref}kunjungan.html" class="menu-item ${isActive('kunjungan.html') || isActive('tambah-kunjungan.html') || isActive('edit-kunjungan.html') ? 'active' : ''}">
                <i class="ph ph-map-pin" style="font-size: 20px;"></i>
                Kunjungan
            </a>
        `;
    }

    // Admin & Campaign have Campaign
    if (userRole === 'admin' || userRole === 'campaign') {
        menuItems += `
            <a href="${baseHref}campaign.html" class="menu-item ${isActive('campaign.html') || isActive('tambah-campaign.html') || isActive('campaign-detail.html') || isActive('edit-campaign.html') ? 'active' : ''}">
                <i class="ph ph-note-pencil" style="font-size: 20px;"></i>
                Campaign
            </a>
        `;
    }

    // Produk & Riwayat - all roles
    menuItems += `
        <a href="${baseHref}produk.html" class="menu-item ${isActive('produk.html') || isActive('tambah-produk.html') || isActive('edit-produk.html') ? 'active' : ''}">
            <i class="ph ph-package" style="font-size: 20px;"></i>
            Produk
        </a>
        <a href="${baseHref}riwayat.html" class="menu-item ${isActive('riwayat.html') ? 'active' : ''}">
            <i class="ph ph-clock-counter-clockwise" style="font-size: 20px;"></i>
            Riwayat
        </a>
    `;

    // Kelola Akun - only admin
    if (userRole === 'admin') {
        menuItems += `
            <a href="${baseHref}kelola-akun.html" class="menu-item ${isActive('kelola-akun.html') || isActive('tambah-akun.html') || isActive('edit-akun.html') ? 'active' : ''}" style="margin-top: 2rem;">
                <i class="ph ph-users-gear" style="font-size: 20px;"></i>
                Kelola Akun
            </a>
        `;
    }

    // Logout - all roles
    menuItems += `
        <a href="#" id="logout-btn" class="menu-item" style="margin-top: auto;">
            <i class="ph ph-sign-out" style="font-size: 20px;"></i>
            Logout
        </a>
    `;

    const sidebarHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-circle">M</div>
                <div class="sidebar-logo-text">Mitra Malabar</div>
            </div>
            <nav class="sidebar-menu">
                ${menuItems}
            </nav>
        </aside>
    `;

    const topbarHTML = `
        <header class="top-bar">
            <div class="search-wrapper">
                <i class="ph ph-magnifying-glass" style="font-size: 18px; color: #888;"></i>
                <input type="text" placeholder="Cari...">
            </div>
            <div class="user-profile">
                <button class="btn-icon">
                    <i class="ph ph-bell" style="font-size: 20px;"></i>
                </button>
                <button class="btn-icon">
                    <i class="ph ph-gear" style="font-size: 20px;"></i>
                </button>
                <a href="${baseHref}profil.html" class="user-avatar-link">
                    <div class="avatar" style="background-color: var(--primary-dark); color: white; display: flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;">${localStorage.getItem('username')?.charAt(0).toUpperCase() || 'A'}</div>
                </a>
            </div>
        </header>
    `;

    // Create toast container for notifications
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        // Remove existing sidebar/topbar if any (to avoid duplication)
        const existingSidebar = appContainer.querySelector('.sidebar');
        if (existingSidebar) existingSidebar.remove();
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const existingTopbar = mainContent.querySelector('.top-bar');
            if (existingTopbar) existingTopbar.remove();
        }

        // Insert new sidebar and topbar
        appContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
        }
    }

    // Logout handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Call logout API endpoint
                await api.get('/akun/logout');
            } catch (error) {
                console.error("Logout API error, clearing token anyway", error);
            } finally {
                api.removeToken();
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                // Redirect to correct index.html
                const segments = window.location.pathname.split('/');
                const depth = segments.filter(p => p).length - (window.location.pathname.endsWith('/') ? 1 : 0);
                const indexPath = '../'.repeat(Math.max(depth - 1, 0)) + 'index.html';
                window.location.href = indexPath;
            }
        });
    }
});

// Toast notification helper
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
};
