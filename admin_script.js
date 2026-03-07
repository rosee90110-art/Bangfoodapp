/* =========================================
   🌓 ระบบจัดการธีมและภาษาแยกตามบัญชี (Personalization)
   ========================================= */

// 1. ฟังก์ชันดึงธีมเฉพาะของบัญชีนั้นๆ
function applyGlobalTheme() {
    const currentAdmin = sessionStorage.getItem('currentAdminName');
    if (currentAdmin) {
        const savedTheme = localStorage.getItem(`bf_theme_${currentAdmin}`) || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }
}

// ฟังการเปลี่ยนธีมเฉพาะชื่อเราเอง
window.addEventListener('storage', (e) => {
    const currentAdmin = sessionStorage.getItem('currentAdminName');
    if (e.key === `bf_theme_${currentAdmin}`) {
        applyGlobalTheme();
    }
});

// 🌐 ฟังก์ชันจัดการภาษาแยกตามรายบุคคล
function applyGlobalLanguage() {
    const currentAdmin = sessionStorage.getItem('currentAdminName');
    if (currentAdmin) {
        const savedLang = localStorage.getItem(`bf_lang_${currentAdmin}`) || 'th';
        document.querySelectorAll('[data-lang-en]').forEach(el => {
            el.innerText = (savedLang === 'en') ? el.getAttribute('data-lang-en') : el.getAttribute('data-lang-th');
        });
    }
}

window.addEventListener('storage', (e) => {
    const currentAdmin = sessionStorage.getItem('currentAdminName');
    if (currentAdmin && e.key === `bf_lang_${currentAdmin}`) {
        applyGlobalLanguage();
    }
});

/* =========================================
   📡 ระบบ Presence (Online Status) อัตโนมัติ
   ========================================= */

// 🆔 สร้าง Session ID ประจำเครื่อง (เพื่อรองรับการล็อคอินพร้อมกันหลายเครื่อง)
const bf_global_session = Date.now() + Math.random().toString(36).substring(7);

function syncOnlineStatus() {
    const adminName = sessionStorage.getItem('currentAdminName');
    
    // ตรวจสอบว่า Login หรือยัง และ Firebase โหลดเสร็จหรือยัง
    if (!adminName || typeof firebase === 'undefined') return;

    const db = firebase.database();
    // บันทึกลง Path: presence/ชื่อแอดมิน/รหัสเครื่อง
    const myRef = db.ref(`presence/${adminName}/${bf_global_session}`);

    db.ref('.info/connected').on('value', snap => {
        if (snap.val() === true) {
            // 🔒 เมื่อปิดเบราว์เซอร์หรือเน็ตหลุด ให้ลบสถานะเครื่องนี้ทิ้งทันที
            myRef.onDisconnect().remove();
            
            // ✅ บันทึกสถานะว่าออนไลน์อยู่
            myRef.set({
                status: "online",
                last_active: firebase.database.ServerValue.TIMESTAMP,
                device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
            });
        }
    });
}

/* =========================================
   🖼️ ฟังก์ชันช่วยจัดการ UI อื่นๆ
   ========================================= */

function renderCard(container, id, data, status) {
    let btn = '';
    if (['รอดำเนินการ'].includes(status)) {
        btn = `<button onclick="updateStatus('${id}', 'กำลังทำ')" class="btn-main btn-pending" data-lang-en="START COOKING" data-lang-th="เริ่มทำอาหาร">เริ่มทำอาหาร</button>`;
    } else if (status === 'กำลังทำ') {
        btn = `<button onclick="updateStatus('${id}', 'เสร็จสมบูรณ์')" class="btn-main btn-success" data-lang-en="READY TO SERVE" data-lang-th="แจ้งรับอาหาร">แจ้งรับอาหาร</button>`;
    } else if (status === 'เสร็จสมบูรณ์') {
        btn = `<button onclick="updateStatus('${id}', 'ชำระเงินแล้ว')" class="btn-main btn-info" data-lang-en="COLLECT MONEY" data-lang-th="เก็บเงินแล้ว">เก็บเงินแล้ว</button>`;
    } else {
        btn = `<button onclick="archive('${id}')" class="btn-main btn-archive" data-lang-en="ARCHIVE ORDER" data-lang-th="ลงประวัติออเดอร์">ลงประวัติออเดอร์</button>`;
    }

    const itemsHtml = data.items.map(item => `
        <div class="item-block">
            <div class="main-food-row"><span>${item.quantity}x ${item.name}</span><span>฿${parseFloat(item.finalPrice || 0).toFixed(2)}</span></div>
            ${item.optionsArray ? item.optionsArray.map(opt => `<div class="addon-row"><span>• ${opt.name}</span><span style="color:var(--premium-gold);">+฿${parseFloat(opt.price || 0).toFixed(2)}</span></div>`).join('') : ''}
        </div>`).join('');

    const time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) : '--:--';
    const displayId = id.length > 7 ? id.substring(id.length - 7).toUpperCase() : id.toUpperCase();

    container.innerHTML += `
        <div class="order-card ${status === 'รอดำเนินการ' ? 'new-order' : ''}">
            <div class="card-header">
                <div>
                    <div style="font-size:0.65rem; color:var(--premium-gold); letter-spacing:1px; margin-bottom:4px; font-weight:700;">ID: #${displayId}</div>
                    <span class="table-no"><span data-lang-en="Table" data-lang-th="โต๊ะ">โต๊ะ</span> ${data.tableNumber}</span>
                    <div class="order-time">🕒 ${time}</div>
                </div>
                <span style="font-size:0.65rem; color:var(--premium-gold); font-weight:700; text-transform:uppercase;">${status}</span>
            </div>
            <div class="item-list">${itemsHtml}</div>
            <div class="order-total-block"><span data-lang-en="Total" data-lang-th="ยอดรวม">ยอดรวม</span> ฿${parseFloat(data.total).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            <div class="order-actions">${btn}<button class="btn-cancel" onclick="cancelOrder('${id}')"><i class="fas fa-trash"></i></button></div>
        </div>`;
}

// 🚀 สั่งรันทุกระบบทันทีที่โหลดหน้าจอ
document.addEventListener('DOMContentLoaded', () => {
    applyGlobalTheme();
    applyGlobalLanguage();
    syncOnlineStatus(); // ระบบออนไลน์จะเริ่มทำงานเองทุกหน้าครับน้า
});
