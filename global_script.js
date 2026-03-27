// 🎨 Global Accent Color Loader
(function applyAccentColor() {
    const savedAccent = localStorage.getItem('premium-gold') || '#c5a059';
    document.documentElement.style.setProperty('--premium-gold', savedAccent);
})();

// ✨ Global Festive Auto-Theme Loader (Wait for Firebase)
function initFestiveTheme() {
    if (typeof firebase !== 'undefined' && firebase.database && firebase.apps.length > 0) {
        firebase.database().ref('config/festive_mode').on('value', snap => {
            const mode = snap.val() || 'none';
            document.body.classList.remove('festive-valentine', 'festive-christmas');
            if (mode !== 'none') document.body.classList.add(`festive-${mode}`);
        });
    } else {
        setTimeout(initFestiveTheme, 500);
    }
}
initFestiveTheme();

/* =========================================
   🔊 Haptic & Audio Engine (Sensory Polish)
   ========================================= */
const bfAudio = {
    play: function(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if(ctx.state === 'suspended') ctx.resume();
            
            const playOsc = (freq, type, duration, startOffset = 0) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
                gain.gain.setValueAtTime(0.5, ctx.currentTime + startOffset);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startOffset + duration);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(ctx.currentTime + startOffset);
                osc.stop(ctx.currentTime + startOffset + duration);
            };

            if (type === 'pop') {
                playOsc(450, 'sine', 0.1);
            } else if (type === 'success') {
                playOsc(800, 'triangle', 0.2);
                playOsc(1200, 'triangle', 0.4, 0.15);
            } else if (type === 'tear') {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
                g.gain.setValueAtTime(0.3, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'whish') {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.5);
            }
        } catch(e) {}
    },
    vibrate: function(pattern) {
        if ("vibrate" in navigator) navigator.vibrate(pattern);
    }
};

// 🎯 Always track last click/tap position for use in transition
window._bfLastX = window.innerWidth / 2;
window._bfLastY = window.innerHeight / 2;
document.addEventListener('mousedown', (e) => { window._bfLastX = e.clientX; window._bfLastY = e.clientY; });
document.addEventListener('touchstart', (e) => {
    if (e.touches[0]) { window._bfLastX = e.touches[0].clientX; window._bfLastY = e.touches[0].clientY; }
}, { passive: true });

// Global click tactile feedback
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-main, .add-btn, .qty-btn, .cart-icon, .action-btn, .category-card, .product-card, .seg-btn, .nav-item, .round-btn-center, .select-btn, .back-btn')) {
        bfAudio.vibrate(15);
    }
});

// 🌀 goPage — alias for navigateTo (kept for backward compat)
window.goPage = function(url) { window.navigateTo(url); };


// 📜 Global Scroll Reveal Observer (IntersectionObserver)
document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    const observeElements = () => {
        document.querySelectorAll('.product-card:not(.visible), .category-card:not(.visible), .history-card:not(.visible)').forEach(el => {
            if (!el.classList.contains('reveal-item')) {
                el.classList.add('reveal-item');
                observer.observe(el);
            }
        });
    };

    // Use MutationObserver for content added via Firebase
    const pageObserver = new MutationObserver(() => observeElements());
    pageObserver.observe(document.body, { childList: true, subtree: true });
    observeElements();
});

// 📍 ฟังก์ชันจัดการ Table No จาก URL
function getTableNo() {
    const table = new URLSearchParams(window.location.search).get('table') || localStorage.getItem('selectedTable') || '1';
    localStorage.setItem('selectedTable', table);
    const tableDisplay = document.getElementById('display-table');
    if (tableDisplay) tableDisplay.innerText = table;
    return table;
}

// 🍔 จัดการแถบ 3 ขีด (Toggle Drawer)
function toggleDrawer() {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const isActive = drawer.classList.toggle('active');
    if (overlay) overlay.style.display = isActive ? 'block' : 'none';

    // อัปเดตสถานะภาษาใน Drawer เมื่อเปิด
    if (isActive) {
        const tableNo = getTableNo();
        const currentLang = localStorage.getItem(`lang_table_${tableNo}`) || 'th';
        const langStatus = document.getElementById('drawer-lang-status');
        if (langStatus) langStatus.innerText = currentLang.toUpperCase();
    }
}

// 🌓 ระบบสลับธีม แยกตามโต๊ะ
function switchCustomerTheme(event) {
    const tableNo = getTableNo();
    const themeKey = `theme_table_${tableNo}`;
    const next = (localStorage.getItem(themeKey) === 'light') ? 'dark' : 'light';
    localStorage.setItem(themeKey, next);

    // 🌊 Ripple Expansion Effect
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    const x = event ? event.clientX : window.innerWidth - 30;
    const y = event ? event.clientY : 30;
    overlay.style.backgroundColor = next === 'light' ? '#f5f5f7' : '#0a0a0b';
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    const maxDim = Math.max(window.innerWidth, window.innerHeight) * 2.5;
    overlay.style.width = `${maxDim}px`;
    overlay.style.height = `${maxDim}px`;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.style.transform = 'translate(-50%, -50%) scale(1)');

    setTimeout(() => {
        applyTheme(next);
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
    }, 350);
}

// ✈️ Global Flying Item Engine (Arc Trajectory & Basket Bounce)
window.animateToCart = function(startEl, targetEl, imgSrc) {
    if (!startEl || !targetEl) return;
    
    // We create a wrapper for X-axis (linear/ease-out) and an inner image for Y-axis (ease-in)
    // This creates a perfect parabolic arc trajectory!
    const flyWrapper = document.createElement('div');
    flyWrapper.className = 'flying-wrapper';
    
    const flyImg = document.createElement('img');
    flyImg.src = imgSrc || (startEl.tagName === 'IMG' ? startEl.src : startEl.querySelector('img').src);
    flyImg.className = 'flying-item-arc';
    
    flyWrapper.appendChild(flyImg);
    document.body.appendChild(flyWrapper);
    
    const startRect = startEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    // Center coords
    const startX = startRect.left + (startRect.width / 2);
    const startY = startRect.top + (startRect.height / 2);
    const targetX = targetRect.left + (targetRect.width / 2);
    const targetY = targetRect.top + (targetRect.height / 2);
    
    // Init position
    flyWrapper.style.left = `${startX}px`;
    flyWrapper.style.top = `${startY}px`;
    
    // Default size to make it look like it's popping out of the card
    flyImg.style.width = '80px';
    flyImg.style.height = '80px';
    flyImg.style.borderRadius = '50%';
    flyImg.style.objectFit = 'cover';
    // Offset by half width/height so it centers exactly on the coords
    flyImg.style.transform = 'translate(-50%, -50%) scale(1)';
    
    if (typeof bfAudio !== 'undefined') bfAudio.play('whish');
    
    // Force reflow
    void flyWrapper.offsetWidth;
    
    // Launch! 
    // Wrapper moves horizontally
    flyWrapper.style.transform = `translateX(${targetX - startX}px)`;
    
    // Inner img moves vertically + shrinks + rotates
    flyImg.style.transform = `translate(-50%, calc(-50% + ${targetY - startY}px)) scale(0.15) rotate(180deg)`;
    flyImg.style.opacity = '0.5';
    
    // When landing...
    setTimeout(() => {
        flyWrapper.remove();
        
        // Basket bounce!
        targetEl.classList.remove('cart-bump');
        void targetEl.offsetWidth;
        targetEl.classList.add('cart-bump');
        setTimeout(() => targetEl.classList.remove('cart-bump'), 400);

        if (typeof bfAudio !== 'undefined') {
            bfAudio.play('pop');
            bfAudio.vibrate([40, 30, 40]);
        }
    }, 750);
};

function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
}

// 🌐 ระบบแปลภาษา Real-time แยกตามโต๊ะ
async function translatePage(lang) {
    // 1. แปลข้อความที่มี attribute data-lang-en
    document.querySelectorAll('[data-lang-en]').forEach(el => {
        el.innerText = (lang === 'en') ? el.getAttribute('data-lang-en') : el.getAttribute('data-lang-th');
    });

    // 2. ดึงคำแปลจาก Firebase มาแปลชื่อเมนูและตัวเลือกเสริม
    // หมายเหตุ: ต้องเรียกใช้ window.db ที่ตั้งค่าไว้ในแต่ละหน้า
    if (window.db) {
        const transSnap = await window.db.ref('menu_translations').once('value');
        const dict = transSnap.val() || {};

        // แปลชื่อเมนูหลัก (ถ้ามี attribute data-raw-name)
        const nameEl = document.getElementById('modal-item-name');
        if (nameEl && nameEl.getAttribute('data-raw-name')) {
            const raw = nameEl.getAttribute('data-raw-name');
            nameEl.innerText = (lang === 'en') ? (dict[raw] || raw) : raw;
        }

        // แปลตัวเลือกเสริม (Toppings/Sizes)
        document.querySelectorAll('.option-text').forEach(el => {
            const raw = el.getAttribute('data-raw-name');
            el.innerText = (lang === 'en') ? (dict[raw] || raw) : raw;
        });
    }

    // 🏷️ Update Unified Nav Lang Status
    const el = document.getElementById('nav-lang-text');
    if (el) el.innerText = (lang === 'en') ? 'EN' : 'TH';
}

// 🔄 ฟังก์ชันสลับภาษาทันที
function switchCustomerLanguage() {
    const tableNo = getTableNo();
    const langKey = `lang_table_${tableNo}`;
    const next = (localStorage.getItem(langKey) === 'en') ? 'th' : 'en';
    localStorage.setItem(langKey, next);

    const wrapper = document.querySelector('.app-wrapper') || document.querySelector('main');
    if (wrapper) {
        wrapper.classList.add('lang-transition-container', 'lang-transitioning');
    }

    const langStatus = document.getElementById('drawer-lang-status');
    if (langStatus) {
        langStatus.style.transition = 'transform 0.2s, opacity 0.2s';
        langStatus.style.transform = 'translateY(-5px)';
        langStatus.style.opacity = '0';
        setTimeout(() => {
            langStatus.innerText = next.toUpperCase();
            langStatus.style.transform = 'translateY(5px)';
            requestAnimationFrame(() => {
                langStatus.style.transform = 'translateY(0)';
                langStatus.style.opacity = '1';
            });
        }, 200);
    }

    setTimeout(() => {
        translatePage(next);
        // หากหน้าจอมีฟังก์ชันโหลดข้อมูลใหม่ ให้เรียกใช้ทันที (เช่น หน้าแรก)
        if (typeof loadMenuFromFirebase === "function") loadMenuFromFirebase();
        // หากหน้าจอมีฟังก์ชันวาดตะกร้าใหม่
        if (typeof renderCartItems === "function") renderCartItems();
        if (wrapper) wrapper.classList.remove('lang-transitioning');
    }, 300);
}

// ✨ Smooth Crossfade Page Transition
window.navigateTo = function(url) {
    if (!url || url.startsWith('#') || url.includes('javascript:') || url === window.location.href) return;
    document.body.classList.add('bf-page-exit');
    setTimeout(() => { window.location.href = url; }, 230);
};

// 🔗 Auto-intercept all internal <a> links
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.includes(window.location.origin) && !link.href.includes('#')) {
        if (!link.hasAttribute('target') || link.getAttribute('target') !== '_blank') {
            e.preventDefault();
            window.navigateTo(link.href);
        }
    }
});