
/* ==========================================================
   RSH GDS - CENTRALIZED FRONTEND SECURITY FRAMEWORK
   Version: 2.0
   ========================================================== */

(function () {
    'use strict';

    if (window.__RSH_SECURITY_LOADED__) return;
    Object.defineProperty(window, '__RSH_SECURITY_LOADED__', {
        value: true,
        writable: false
    });

    const RSH = window.RSHSecurity = {};

    /* 1. Context Menu Protection (deterrent only) */
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    /* 2. Drag Protection */
    document.addEventListener('dragstart', e => {
        if (e.target.closest('img, a')) {
            e.preventDefault();
        }
    });

    /* 3. Keyboard Shortcut Deterrents */
    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();

        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey &&
                ['i', 'j', 'c'].includes(key)) ||
            (e.ctrlKey && ['u'].includes(key))
        ) {
            e.preventDefault();
        }
    });

    /* 4. Safe DOM Output */
    RSH.setText = function (element, value) {
        if (element) element.textContent = String(value ?? '');
    };

    /* 5. URL Validation */
    RSH.validateURL = function (value) {
        try {
            const url = new URL(value, location.origin);

            if (!['https:', 'http:'].includes(url.protocol)) {
                return null;
            }

            return url;
        } catch {
            return null;
        }
    };

    /* 6. External Link Protection */
    function secureExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.rel = 'noopener noreferrer';
        });
    }

    secureExternalLinks();

    /* 7. Protect Dynamically Added Links */
    const linkObserver = new MutationObserver(secureExternalLinks);

    linkObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    /* 8. Secure JSON Parsing */
    RSH.safeJSONParse = function (data) {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    };

    /* 9. Secure Fetch */
    RSH.secureFetch = async function (input, options = {}) {
        const url = RSH.validateURL(input);

        if (!url || url.origin !== location.origin) {
            throw new Error('RSH: Request URL blocked');
        }

        return fetch(url.href, {
            ...options,
            credentials: 'same-origin',
            redirect: 'error'
        });
    };

    /* 10. Input Validation Helper */
    RSH.validateInput = function (value, maxLength = 1000) {
        if (typeof value !== 'string') return false;

        return value.length <= maxLength &&
            !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
    };

    /* 11. Prevent Accidental Form Double Submission */
    document.addEventListener('submit', function (e) {
        const form = e.target;

        if (form.dataset.rshSubmitting === 'true') {
            e.preventDefault();
            return;
        }

        if (form.dataset.rshDoubleSubmit === 'true') {
            form.dataset.rshSubmitting = 'true';

            // Reset only if native submission is cancelled or fails.
            setTimeout(() => {
                if (form.isConnected) {
                    form.dataset.rshSubmitting = 'false';
                }
            }, 10000);
        }
    }, true);

    /* 12. Secure Storage - Encoding, NOT encryption */
    RSH.Store = {
        set(key, value) {
            try {
                localStorage.setItem(
                    'rsh_' + key,
                    JSON.stringify(value)
                );
                return true;
            } catch {
                return false;
            }
        },

        get(key) {
            try {
                const value = localStorage.getItem('rsh_' + key);
                return value === null ? null : JSON.parse(value);
            } catch {
                return null;
            }
        },

        remove(key) {
            localStorage.removeItem('rsh_' + key);
        }
    };

    /* 13. Session Inactivity Notification */
    let lastActivity = Date.now();
    const inactivityLimit = 30 * 60 * 1000;

    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
        }, { passive: true });
    });

    RSH.isInactive = function () {
        return Date.now() - lastActivity > inactivityLimit;
    };

    /* 14. Visibility Change Hook */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.dispatchEvent(
                new CustomEvent('rsh:page-hidden')
            );
        } else {
            window.dispatchEvent(
                new CustomEvent('rsh:page-visible')
            );
        }
    });

    /* 15. Disable Unwanted Object Embedding */
    document.querySelectorAll('object, embed').forEach(el => {
        el.remove();
    });

    /* 16. Block javascript: Links */
    function cleanUnsafeLinks() {
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href') || '';

            if (/^\s*javascript:/i.test(href)) {
                link.removeAttribute('href');
            }
        });
    }

    cleanUnsafeLinks();

    /* 17. Protect Dynamic Unsafe Links */
    const unsafeLinkObserver = new MutationObserver(cleanUnsafeLinks);

    unsafeLinkObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href']
    });

    /* 18. Runtime Security Status */
    RSH.status = function () {
        return Object.freeze({
            active: true,
            https: location.protocol === 'https:',
            inactivity: RSH.isInactive()
        });
    };
   
/* ==========================================================
   RSH GDS - ADVANCED SECURITY EXTENSION
   Version: 3.0
   ========================================================== */

    /* 19. Safe Redirect Protection */
    RSH.safeRedirect = function (destination) {
        const url = RSH.validateURL(destination);

        if (!url || url.origin !== location.origin) {
            throw new Error('RSH: Unsafe redirect blocked');
        }

        location.assign(url.href);
    };

    /* 20. File Upload Validation */
    RSH.validateFile = function (
        file,
        {
            maxSize = 5 * 1024 * 1024,
            allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
        } = {}
    ) {
        if (!(file instanceof File)) return false;
        if (file.size <= 0 || file.size > maxSize) return false;
        if (!allowedTypes.includes(file.type)) return false;

        return true;
    };

    /* 21. Form Validation Helper */
    RSH.validateForm = function (form) {
        if (!(form instanceof HTMLFormElement)) return false;

        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        return true;
    };

    /* 22. Optional Double Submit Protection */
    RSH.protectForm = function (form) {
        if (!(form instanceof HTMLFormElement)) return;

        form.addEventListener('submit', function (event) {
            if (!RSH.validateForm(form)) {
                event.preventDefault();
                return;
            }

            if (form.dataset.rshLocked === 'true') {
                event.preventDefault();
                return;
            }

            form.dataset.rshLocked = 'true';

            // Native form navigation is allowed.
            // Re-enable after page restoration.
        });
    };

    window.addEventListener('pageshow', function () {
        document.querySelectorAll(
            'form[data-rsh-locked="true"]'
        ).forEach(form => {
            form.dataset.rshLocked = 'false';
        });
    });

    /* 23. API Timeout Protection */
    RSH.fetchWithTimeout = async function (
        url,
        options = {},
        timeout = 10000
    ) {
        const controller = new AbortController();

        const externalSignal = options.signal;

        if (externalSignal?.aborted) {
            throw new DOMException('Request aborted', 'AbortError');
        }

        const abortExternal = () => controller.abort();

        externalSignal?.addEventListener(
            'abort',
            abortExternal,
            { once: true }
        );

        const timer = setTimeout(
            () => controller.abort(),
            timeout
        );

        try {
            return await RSH.secureFetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);

            externalSignal?.removeEventListener(
                'abort',
                abortExternal
            );
        }
    };

    /* 24. Safe JSON API Response */
    RSH.fetchJSON = async function (url, options = {}) {
        const response = await RSH.fetchWithTimeout(
            url,
            options
        );

        if (!response.ok) {
            throw new Error('RSH: API request failed');
        }

        const contentType =
            response.headers.get('content-type') || '';

        if (!contentType.toLowerCase().includes('application/json')) {
            throw new Error('RSH: Invalid API response type');
        }

        return response.json();
    };

    /* 25. CSP Violation Monitoring */
    document.addEventListener(
        'securitypolicyviolation',
        function (event) {
            RSH.emitSecurityEvent('csp-violation', {
                directive: event.violatedDirective,
                blockedURI: event.blockedURI
            });
        }
    );

    /* 26. Browser Error Monitoring */
    window.addEventListener('error', function () {
        RSH.emitSecurityEvent('runtime-error');
    });

    window.addEventListener('unhandledrejection', function () {
        RSH.emitSecurityEvent('unhandled-promise');
    });

    /* 27. Security Event System */
    RSH.emitSecurityEvent = function (type, details = {}) {
        window.dispatchEvent(
            new CustomEvent('rsh:security-event', {
                detail: {
                    type,
                    timestamp: Date.now(),
                    details
                }
            })
        );
    };

    /* 28. Mixed Content Detection */
    RSH.checkMixedContent = function () {
        if (location.protocol !== 'https:') return [];

        return performance
            .getEntriesByType('resource')
            .filter(resource => {
                return resource.name.startsWith('http://');
            })
            .map(resource => resource.name);
    };

    /* 29. DOMPurify Integration */
    RSH.sanitizeHTML = function (value) {
        if (!window.DOMPurify) {
            throw new Error(
                'RSH: DOMPurify library is required'
            );
        }

        return DOMPurify.sanitize(String(value ?? ''));
    };

    /* 30. Safe HTML Rendering */
    RSH.renderSafeHTML = function (element, value) {
        if (!element) return false;

        element.innerHTML = RSH.sanitizeHTML(value);

        return true;
    };

    /* 31. Security Feature Detection */
    RSH.features = function () {
        return Object.freeze({
            https: location.protocol === 'https:',
            secureContext: window.isSecureContext,
            cspMonitoring: 'SecurityPolicyViolationEvent' in window,
            mutationObserver: 'MutationObserver' in window,
            fetchAvailable: typeof fetch === 'function',
            cryptoAvailable: !!window.crypto?.subtle,
            storageAvailable: (() => {
                try {
                    const key = '__rsh_test__';
                    localStorage.setItem(key, '1');
                    localStorage.removeItem(key);
                    return true;
                } catch {
                    return false;
                }
            })()
        });
    };

    /* 32. Session Inactivity Event */
    RSH.checkSessionActivity = function () {
        const inactive = RSH.isInactive();

        if (inactive) {
            RSH.emitSecurityEvent('session-inactive');
        }

        return inactive;
    };

    /* 33. Security Event Listener Example */
    window.addEventListener('rsh:security-event', function (event) {
        // Connect your own monitoring system here.
        // Never log passwords, tokens or sensitive information.
    });

/* ==========================================================
   END RSH GDS ADVANCED SECURITY EXTENSION
   ========================================================== */
   

    console.info('RSH GDS Security Framework Initialized');

})();

