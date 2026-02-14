// 🌓 ฟังก์ชันสลับธีมสำหรับลูกค้า
function switchCustomerTheme() {
    const current = localStorage.getItem('bf_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('bf_theme', next);
    
    // ใช้ฟังก์ชันกลางจาก admin_script.js หรือเพิ่มเองถ้าน้ายกเลิกไฟล์กลางไป
    if (window.applyGlobalTheme) {
        window.applyGlobalTheme();
    } else {
        if (next === 'light') document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
    }
}

// 🌐 ฟังก์ชันสลับภาษาสำหรับลูกค้า
function switchCustomerLanguage() {
    const current = localStorage.getItem('bf_lang') || 'th';
    const next = current === 'th' ? 'en' : 'th';
    localStorage.setItem('bf_lang', next);
    document.getElementById('drawer-lang-status').innerText = next.toUpperCase();
    
    if (window.applyGlobalLanguage) {
        window.applyGlobalLanguage();
    } else {
        // วนลูปแปลภาษาถ้าน้าไม่ได้ใช้ไฟล์กลาง
        document.querySelectorAll('[data-lang-en]').forEach(el => {
            el.innerText = (next === 'en') ? el.getAttribute('data-lang-en') : el.getAttribute('data-lang-th');
        });
    }
}