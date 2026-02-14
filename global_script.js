// 📍 ฟังก์ชันจัดการ Table No จาก URL
function getTableNo() {
    const table = new URLSearchParams(window.location.search).get('table') || localStorage.getItem('selectedTable') || '1';
    localStorage.setItem('selectedTable', table);
    const tableDisplay = document.getElementById('display-table');
    if(tableDisplay) tableDisplay.innerText = table;
    return table;
}

// 🍔 จัดการแถบ 3 ขีด (Toggle Drawer)
function toggleDrawer() {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const isActive = drawer.classList.toggle('active');
    if(overlay) overlay.style.display = isActive ? 'block' : 'none';
    
    // อัปเดตสถานะภาษาใน Drawer เมื่อเปิด
    if(isActive) {
        const tableNo = getTableNo();
        const currentLang = localStorage.getItem(`lang_table_${tableNo}`) || 'th';
        const langStatus = document.getElementById('drawer-lang-status');
        if(langStatus) langStatus.innerText = currentLang.toUpperCase();
    }
}

// 🌓 ระบบสลับธีม แยกตามโต๊ะ
function switchCustomerTheme() {
    const tableNo = getTableNo();
    const themeKey = `theme_table_${tableNo}`;
    const next = (localStorage.getItem(themeKey) === 'light') ? 'dark' : 'light';
    localStorage.setItem(themeKey, next);
    applyTheme(next);
}

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
}

// 🔄 ฟังก์ชันสลับภาษาทันที
function switchCustomerLanguage() {
    const tableNo = getTableNo();
    const langKey = `lang_table_${tableNo}`;
    const next = (localStorage.getItem(langKey) === 'en') ? 'th' : 'en';
    localStorage.setItem(langKey, next);
    
    const langStatus = document.getElementById('drawer-lang-status');
    if(langStatus) langStatus.innerText = next.toUpperCase();
    
    translatePage(next);
    
    // หากหน้าจอมีฟังก์ชันโหลดข้อมูลใหม่ ให้เรียกใช้ทันที (เช่น หน้าแรก)
    if(typeof loadMenuFromFirebase === "function") loadMenuFromFirebase(); 
    // หากหน้าจอมีฟังก์ชันวาดตะกร้าใหม่
    if(typeof renderCartItems === "function") renderCartItems();
}