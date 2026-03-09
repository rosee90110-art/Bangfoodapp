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
   📋 ฟังก์ชัน Render ออเดอร์ (เน้นจำนวนจานชัดเจน)
   ========================================= */

function renderCard(container, id, data, status) {
    let btn = '';
    
    // จัดการปุ่มตามสถานะ (คงเดิม)
    if (['รอดำเนินการ'].includes(status)) {
        btn = `<button onclick="updateStatus('${id}', 'กำลังทำ')" class="btn-main btn-pending" data-lang-en="START COOKING" data-lang-th="เริ่มทำอาหาร">เริ่มทำอาหาร</button>`;
    } else if (status === 'กำลังทำ') {
        btn = `<button onclick="updateStatus('${id}', 'เสร็จสมบูรณ์')" class="btn-main btn-success" data-lang-en="READY TO SERVE" data-lang-th="แจ้งรับอาหาร">แจ้งรับอาหาร</button>`;
    } else if (status === 'เสร็จสมบูรณ์') {
        btn = `<button onclick="updateStatus('${id}', 'ชำระเงินแล้ว')" class="btn-main btn-info" data-lang-en="COLLECT MONEY" data-lang-th="เก็บเงินแล้ว">เก็บเงินแล้ว</button>`;
    } else {
        btn = `<button onclick="archive('${id}')" class="btn-main btn-archive" data-lang-en="ARCHIVE ORDER" data-lang-th="ลงประวัติออเดอร์">ลงประวัติออเดอร์</button>`;
    }

    // วนลูปรายการอาหาร
    const itemsHtml = data.items.map(item => {
        let optionsHtml = '';
        let optionsPriceTotal = 0;

        // จัดการท็อปปิ้ง
        if (item.optionsArray) {
            optionsHtml = item.optionsArray.map(opt => {
                const optPrice = parseFloat(opt.price || 0);
                const optQty = parseInt(opt.qty || 1);
                const totalPerOpt = optPrice * optQty;
                optionsPriceTotal += totalPerOpt;

                return `
                    <div class="addon-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span>• ${opt.name} <b style="color:var(--premium-gold); margin-left:4px; font-size:0.75rem; background:rgba(197,160,89,0.1); padding:0 6px; border-radius:4px;">x${optQty}</b></span>
                        <span style="color:var(--premium-gold); font-size:0.75rem;">+฿${totalPerOpt.toFixed(2)}</span>
                    </div>`;
            }).join('');
        }

        const finalP = parseFloat(item.finalPrice || 0);
        const baseP = finalP - optionsPriceTotal;

        return `
            <div class="item-block" style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                <div class="main-food-row" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background: var(--premium-gold); color: #000; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(197, 160, 89, 0.3);">
                            ${item.quantity || 1}
                        </span>
                        <span style="font-size: 1.05rem; font-weight: 600;">${item.name}</span>
                    </div>
                    <span style="font-weight: 500; opacity: 0.8;">฿${baseP.toFixed(2)}</span>
                </div>
                <div class="addon-area" style="padding-left: 42px; margin-top: 5px;">
                    ${optionsHtml}
                </div>
                ${item.notes ? `<div style="margin-left: 42px; font-size: 0.75rem; color: #ff4757; margin-top: 6px;">📝 ${item.notes}</div>` : ''}
            </div>`;
    }).join('');

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
                <span style="font-size:0.65rem; color:var(--premium-gold); font-weight:700; text-transform:uppercase; border:1px solid var(--premium-gold); padding:2px 8px; border-radius:6px; height:fit-content;">${status}</span>
            </div>
            <div class="item-list">${itemsHtml}</div>
            <div class="order-total-block" style="display:flex; justify-content:space-between; align-items:center;">
                <span data-lang-en="Total" data-lang-th="ยอดรวม" style="font-size:0.8rem; opacity:0.7;">ยอดรวม</span> 
                <span>฿${parseFloat(data.total).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
            <div class="order-actions">${btn}<button class="btn-cancel" onclick="cancelOrder('${id}')"><i class="fas fa-trash"></i></button></div>
        </div>`;
}

// 🚀 สั่งรันทุกระบบทันทีที่โหลดหน้าจอ
document.addEventListener('DOMContentLoaded', () => {
    applyGlobalTheme();
    applyGlobalLanguage();
    syncOnlineStatus(); // ระบบออนไลน์จะเริ่มทำงานเองทุกหน้าครับน้า
});
