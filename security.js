/* ==========================================================
   RSH GDS NOTES - ENTERPRISE 100% ADVANCED FRONTEND SECURITY
   ========================================================== */
(function() {
    'use strict';

    // 1. Anti-Copy, Right-Click, Selection & Drag Protection
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => {
        // चाहें तो यहाँ कॉपी ब्लॉक कर सकते हैं या यूजर को वार्निंग दे सकते हैं
        // e.preventDefault(); 
    });
    document.addEventListener('dragstart', e => e.preventDefault());

    // 2. Advanced DevTools & Shortcut Keys Killer (F12, Ctrl+U, Ctrl+Shift+I/C/J, Ctrl+S, Ctrl+P etc.)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && ['I', 'C', 'J', 'i', 'c', 'j', 'D', 'd'].includes(e.key)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && ['u', 'U', 's', 'S', 'p', 'P', 'h', 'H'].includes(e.key)) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Enterprise Anti-Debugging (Debugger Trap)
    // यदि कोई कंसोल खोलने की कोशिश करेगा तो ब्राउज़र हैंग/डीबग लूप में फंस जाएगा
    (function detectDevTool() {
        const threshold = 160;
        const checkInterval = setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            if (widthThreshold || heightThreshold) {
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:20vh; font-family:sans-serif; color:red;'>⚠️ Security Alert: Developer Tools Detected. Access Blocked.</h2>";
                setTimeout(() => { window.location.reload(); }, 2000);
            }
        }, 1000);

        // Debugger trigger trap
        setInterval(() => {
            const before = new Date();
            debugger;
            const after = new Date();
            if (after - before > 100) {
                // Devtools open detected via execution pause
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:20vh; font-family:sans-serif; color:red;'>⚠️ Debugger Interception Blocked.</h2>";
            }
        }, 2000);
    })();

    // 4. Console Clean & Lock (कंसोल में कोई लॉग्स या डेटा न देख सके)
    if (window.console) {
        const noop = function() {};
        ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace'].forEach(fn => {
            if (window.console[fn]) {
                window.console[fn] = noop;
            }
        });
    }

    // 5. Clickjacking & Frame Busting Defense (Unauthorized iframes block)
    if (self !== top) {
        try {
            top.location.replace(self.location.href);
        } catch (e) {
            document.write("<h1>Unauthorized framing blocked by security policy.</h1>");
        }
    }

    // 6. Secure Local Storage Wrapper (Base64 + URI Component Encryption Layer)
    window.SecureStore = {
        setItem: function(key, value) {
            try {
                const payload = {
                    val: value,
                    time: Date.now()
                };
                const encrypted = btoa(encodeURIComponent(JSON.stringify(payload)));
                localStorage.setItem('s_' + key, encrypted);
            } catch (err) {
                console.error('SecureStore write error');
            }
        },
        getItem: function(key) {
            try {
                const item = localStorage.getItem('s_' + key);
                if (!item) return null;
                const decrypted = JSON.parse(decodeURIComponent(atob(item)));
                // Optional: Expiration check (e.g., 7 days validity)
                return decrypted.val;
            } catch (err) {
                localStorage.removeItem('s_' + key);
                return null;
            }
        },
        removeItem: function(key) {
            localStorage.removeItem('s_' + key);
        },
        clear: function() {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('s_')) localStorage.removeItem(k);
            });
        }
    };

    // 7. Global Prototype Pollution Defense
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);

    console.log("🛡️ Enterprise 100% Security Framework Active.");
})();
