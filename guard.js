// ไฟล์ guard.js
function checkStoreAccess() {
    const db = firebase.database();
    db.ref('system_settings').on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings && (!settings.allowSelfOrder || !settings.isStoreOpen)) {
            // หน้าตาแจ้งเตือนเมื่อปิดระบบ
            document.body.innerHTML = `
                <div style="height:100vh; background:#0a0a0b; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:Kanit, sans-serif; text-align:center; padding:20px;">
                    <i class="fas fa-store-slash" style="font-size:4rem; color:#c5a059; margin-bottom:20px;"></i>
                    <h2>ระบบสั่งอาหารไม่เปิดให้บริการ</h2>
                    <p style="color:#666;">กรุณาสั่งอาหารโดยตรงกับพนักงานที่เคาน์เตอร์ครับ</p>
                </div>
            `;
        }
    });
}
window.addEventListener('load', checkStoreAccess);


