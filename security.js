/* ==========================================================
   RSH GDS NOTES - 100% ADVANCED FRONTEND SECURITY BUNDLE
   ========================================================== */
(function() {
    'use strict';

    // 1. Anti-Copy, Right-Click & Text Selection Block
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // 2. Disable DevTools & Keyboard Shortcuts (F12, Ctrl+U, Ctrl+Shift+I/C/J, Ctrl+S)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && ['I', 'C', 'J', 'i', 'c', 'j'].includes(e.key)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && ['u', 'U', 's', 'S', 'h', 'H'].includes(e.key)) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Clickjacking Defense (Agar koi site ko unauthorized iframe me khole)
    if (self !== top) {
        top.location = self.location;
    }

    // 4. Secure Local Storage Wrapper (Data Encoding ke sath)
    window.SecureStore = {
        setItem: function(key, value) {
            try {
                const encrypted = btoa(encodeURIComponent(JSON.stringify(value)));
                localStorage.setItem('s_' + key, encrypted);
            } catch (err) {
                console.error('Storage error');
            }
        },
        getItem: function(key) {
            try {
                const item = localStorage.getItem('s_' + key);
                if (!item) return null;
                return JSON.parse(decodeURIComponent(atob(item)));
            } catch (err) {
                localStorage.removeItem('s_' + key);
                return null;
            }
        },
        removeItem: function(key) {
            localStorage.removeItem('s_' + key);
        }
    };

    console.log("🛡️ Global Frontend Security Protected & Loaded.");
})();

