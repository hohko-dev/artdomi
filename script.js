// Detect if current page is AI Experiments
function isAIExperimentsPage() {
    return location.pathname.includes("ai-experiments");
}

// Overlay manager
const OverlayManager = {
    lastTouchStart: null, // Store touch start position for swipe detection

    init() {
        console.log("[Overlay] 🚀 INITIALIZING OVERLAY MANAGER...");
        console.log("[Overlay] 🚀 Current page:", location.href);
        console.log("[Overlay] 🚀 Is AI Experiments page:", isAIExperimentsPage());
        
        this.bindMediaOverlay();
        this.ensureIframesWork();
        this.monitorNavigation();
        
        console.log("[Overlay] ✅ Overlay Manager initialization complete!");
    },

    bindMediaOverlay() {
        console.log("[Overlay] 🔍 Starting bindMediaOverlay...");
        const media = document.querySelectorAll("img, video");
        console.log(`[Overlay] 🔍 Found ${media.length} total media elements`);
        let count = 0;

        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;
        console.log(`[Overlay] 📱 Mobile device detected: ${isMobile}`);

        media.forEach((el, index) => {
            const shouldSkip = (
                el.closest('a[href]') ||
                el.closest('[data-framer-name*="hover"], [class*="hover"]') ||
                (el.style.cursor === 'pointer' && el.closest('[style*="transition"]')) ||
                el.offsetWidth < 100 || el.offsetHeight < 100 ||
                (el.src && (el.src.includes('icon') || el.src.includes('favicon'))) ||
                // MOBILE: Skip elements in navigation areas
                (isMobile && (
                    el.closest('nav') ||
                    el.closest('[data-framer-name*="nav"]') ||
                    el.closest('[data-framer-name*="menu"]') ||
                    el.closest('[data-framer-name*="header"]') ||
                    el.closest('header')
                ))
            );

            if (shouldSkip) {
                console.log(`[Overlay] 🔍 Skipping element ${index}:`, el, "Reason:", {
                    hasLink: !!el.closest('a[href]'),
                    hasHover: !!el.closest('[data-framer-name*="hover"], [class*="hover"]'),
                    hasTransition: !!(el.style.cursor === 'pointer' && el.closest('[style*="transition"]')),
                    tooSmall: el.offsetWidth < 100 || el.offsetHeight < 100,
                    isIcon: !!(el.src && (el.src.includes('icon') || el.src.includes('favicon'))),
                    isInNavigation: !!(isMobile && (el.closest('nav') || el.closest('[data-framer-name*="nav"]') || el.closest('[data-framer-name*="menu"]') || el.closest('[data-framer-name*="header"]') || el.closest('header')))
                });
                return;
            }

            console.log(`[Overlay] ✅ Binding element ${index}:`, el);
            
            // Remove existing listeners
            el.removeEventListener("click", this.openOverlay);
            el.removeEventListener("touchstart", this.handleTouchStart);
            el.removeEventListener("touchend", this.handleMobileTouch);
            
            if (isMobile) {
                // Mobile: Use touch events with swipe detection
                el.addEventListener("touchstart", this.handleTouchStart.bind(this));
                el.addEventListener("touchend", this.handleMobileTouch.bind(this));
            } else {
                // Desktop: Use regular click
                el.addEventListener("click", this.openOverlay);
            }
            count++;
        });

        console.log(`[Overlay] 🎯 Successfully bound ${count} elements for overlay`);
    },

    handleTouchStart(e) {
        // Record the starting touch position for swipe detection
        const touch = e.touches ? e.touches[0] : null;
        if (touch) {
            this.lastTouchStart = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        }
    },

    handleMobileTouch(e) {
        console.log("[Overlay] 📱 TOUCH EVENT! Touch details:", {
            target: e.target,
            touches: e.touches ? e.touches.length : 0,
            changedTouches: e.changedTouches ? e.changedTouches.length : 0
        });

        // Prevent if it's a scroll gesture (multiple touches or moving)
        if (e.touches && e.touches.length > 1) {
            console.log("[Overlay] 📱 Multi-touch detected - ignoring");
            return;
        }

        // Check if this was a swipe/scroll gesture by checking if the touch moved significantly
        const touch = e.changedTouches ? e.changedTouches[0] : null;
        if (touch && this.lastTouchStart) {
            const deltaX = Math.abs(touch.clientX - this.lastTouchStart.x);
            const deltaY = Math.abs(touch.clientY - this.lastTouchStart.y);
            
            if (deltaX > 10 || deltaY > 10) {
                console.log("[Overlay] 📱 Touch moved too much - likely scroll/swipe, ignoring");
                return;
            }
        }

        console.log("[Overlay] 📱 Valid touch - opening overlay");
        this.openOverlay(e);
    },

    openOverlay(e) {
        console.log("[Overlay] 🎬 OPENING OVERLAY for:", e.target);
        
        if (e.target.closest("iframe")) {
            console.log("[Overlay] ❌ Skipping - inside iframe");
            return;
        }

        console.log("[Overlay] ✅ Creating overlay...");
        const scrollY = window.scrollY;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            box-sizing: border-box;
            ${isMobile ? 'touch-action: manipulation;' : ''}
        `;

        // Better mobile scroll prevention
        if (isMobile) {
            document.body.style.cssText = `
                overflow: hidden;
                position: fixed;
                top: -${scrollY}px;
                left: 0;
                right: 0;
                width: 100%;
                height: 100%;
                touch-action: none;
            `;
        } else {
            document.body.style.cssText = `
                overflow: hidden;
                position: fixed;
                top: -${scrollY}px;
                width: 100%;
            `;
        }

        function closeOverlay() {
            overlay.remove();
            document.body.style = "";
            window.scrollTo(0, scrollY);
        }

        // Handle both click and touch for closing
        overlay.addEventListener("click", ev => {
            if (ev.target === overlay) closeOverlay();
        });

        if (isMobile) {
            overlay.addEventListener("touchend", ev => {
                if (ev.target === overlay) {
                    ev.preventDefault();
                    closeOverlay();
                }
            });
        }

        document.addEventListener("keydown", ev => {
            if (ev.key === "Escape") closeOverlay();
        }, { once: true });

        const clone = e.target.cloneNode(true);
        clone.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            display: block;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            cursor: pointer;
            ${isMobile ? 'touch-action: manipulation;' : ''}
        `;
        
        clone.addEventListener("click", closeOverlay);
        if (isMobile) {
            clone.addEventListener("touchend", (ev) => {
                ev.preventDefault();
                closeOverlay();
            });
        }

        overlay.appendChild(clone);
        document.body.appendChild(overlay);
    },

    ensureIframesWork() {
        document.querySelectorAll("iframe").forEach(iframe => {
            iframe.style.pointerEvents = "auto";
            iframe.style.zIndex = "1000";
            iframe.closest("div")?.style?.setProperty("pointer-events", "none");
        });
    },

    monitorNavigation() {
        let lastUrl = location.href;

        // SMART AI-EXPERIMENTS NAVIGATION INTERCEPTOR
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;
        
        // Track touches for navigation swipe detection
        if (isMobile) {
            document.addEventListener("touchstart", e => {
                const touch = e.touches ? e.touches[0] : null;
                if (touch) {
                    OverlayManager.lastTouchStart = {
                        x: touch.clientX,
                        y: touch.clientY,
                        time: Date.now()
                    };
                }
            });
        }
        
        document.addEventListener(isMobile ? "touchend" : "click", e => {
            // RULE 1: Never interfere with media elements
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                console.log("[Overlay] 🖼️ Media detected - letting overlay handle it");
                return;
            }
            
            // RULE 2: Only intercept if we're NOT on ai-experiments already
            if (isAIExperimentsPage()) {
                return;
            }

            // RULE 3: On mobile, check for swipe gestures
            if (isMobile && OverlayManager.lastTouchStart) {
                const touch = e.changedTouches ? e.changedTouches[0] : null;
                if (touch) {
                    const deltaX = Math.abs(touch.clientX - OverlayManager.lastTouchStart.x);
                    const deltaY = Math.abs(touch.clientY - OverlayManager.lastTouchStart.y);
                    
                    if (deltaX > 10 || deltaY > 10) {
                        console.log("[Overlay] 📱 Swipe detected - not intercepting navigation");
                        return;
                    }
                }
            }
            
            // RULE 4: Only intercept direct clicks on navigation buttons/text
            const link = e.target.closest('a[href*="ai-experiments"]');
            if (link) {
                // Check if this is a navigation button by looking for text content
                const linkText = link.textContent.trim().toLowerCase();
                const isNavigationButton = linkText.includes('project') || 
                                         linkText.includes('ai') || 
                                         link.hasAttribute('data-framer-name');
                
                // Also check if the clicked element itself is text/button, not an image
                const clickedText = e.target.textContent && e.target.textContent.trim();
                const isTextClick = clickedText || e.target.tagName === 'DIV' || e.target.tagName === 'A';
                
                if (isNavigationButton && isTextClick) {
                    console.log(`[Overlay] 🔄 Intercepting navigation ${isMobile ? 'touch' : 'click'} - forcing refresh to ai-experiments`);
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = link.href;
                    return false;
                }
            }
        }, false);

        const detectChange = () => {
            const current = location.href;
            if (current !== lastUrl) {
                lastUrl = current;
                if (isAIExperimentsPage()) {
                    console.log("[Overlay] Navigated to AI Experiments - SUPER AGGRESSIVE MODE");

                    // BULLETPROOF OVERLAY INITIALIZATION
                    let totalAttempts = 0;
                    let successCount = 0;
                    
                    const tryInit = () => {
                        totalAttempts++;
                        console.log(`[Overlay] Attempt ${totalAttempts} - Searching for overlay functions...`);
                        
                        let success = false;
                        
                        if (typeof window.initializeOverlaySystem === "function") {
                            console.log("[Overlay] ✅ Found initializeOverlaySystem, calling it");
                            try {
                                window.initializeOverlaySystem();
                                success = true;
                                successCount++;
                            } catch (e) {
                                console.log("[Overlay] ❌ Error calling initializeOverlaySystem:", e);
                            }
                        }
                        
                        if (typeof window.forceInitializeAIExperiments === "function") {
                            console.log("[Overlay] ✅ Found forceInitializeAIExperiments, calling it");
                            try {
                                window.forceInitializeAIExperiments();
                                success = true;
                                successCount++;
                            } catch (e) {
                                console.log("[Overlay] ❌ Error calling forceInitializeAIExperiments:", e);
                            }
                        }
                        
                        if (!success) {
                            console.log("[Overlay] ⚠️ No overlay functions available yet, will retry...");
                        }
                        
                        return success;
                    };

                    // IMMEDIATE ATTEMPTS
                    console.log("[Overlay] Starting immediate attempts...");
                    tryInit();
                    setTimeout(tryInit, 10);
                    setTimeout(tryInit, 50);
                    setTimeout(tryInit, 100);
                    setTimeout(tryInit, 200);
                    setTimeout(tryInit, 300);
                    setTimeout(tryInit, 500);
                    setTimeout(tryInit, 800);
                    setTimeout(tryInit, 1000);
                    setTimeout(tryInit, 1500);
                    setTimeout(tryInit, 2000);
                    setTimeout(tryInit, 2500);
                    setTimeout(tryInit, 3000);
                    setTimeout(tryInit, 4000);
                    setTimeout(tryInit, 5000);
                    
                    // PERSISTENT INTERVAL FOR 15 SECONDS
                    let attempts = 0;
                    const maxAttempts = 60; // 30 seconds at 500ms intervals
                    const interval = setInterval(() => {
                        const success = tryInit();
                        attempts++;
                        
                        if (success && successCount >= 2) {
                            console.log(`[Overlay] 🎉 SUCCESS after ${attempts} attempts! Overlay system is working.`);
                            clearInterval(interval);
                        } else if (attempts >= maxAttempts) {
                            console.log(`[Overlay] ⏰ Giving up after ${maxAttempts} attempts and ${totalAttempts} total attempts.`);
                            console.log("[Overlay] 🐛 DEBUG: Check if ai-experiments.html script is loading properly.");
                            clearInterval(interval);
                        }
                    }, 500);
                    
                    // ALSO TRY ON WINDOW EVENTS
                    window.addEventListener('load', tryInit);
                    window.addEventListener('DOMContentLoaded', tryInit);
                    document.addEventListener('readystatechange', tryInit);
                }
            }
        };

        // Keep basic navigation detection for other scenarios
        new MutationObserver(detectChange).observe(document, { childList: true, subtree: true });
        window.addEventListener("popstate", detectChange);
        window.addEventListener("hashchange", detectChange);
        setInterval(detectChange, 1500);
    }
};

document.addEventListener("DOMContentLoaded", () => OverlayManager.init());
window.addEventListener("pageshow", () => OverlayManager.init());
