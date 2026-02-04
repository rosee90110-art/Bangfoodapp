// admin.js - ฉบับรวมร่างสมบูรณ์ (โชว์รายละเอียด + แก้ไขปุ่มนิ่ง)

if (typeof db !== 'undefined') {
    const ordersRef = db.ref('orders');

    // --- 1. ฟังก์ชันโหลดข้อมูลและวาดหน้าจอ (Real-time) ---
    window.loadOrdersRealtime = function() {
        ordersRef.on('value', (snapshot) => {
            const pendingContainer = document.getElementById('orders-list-container');
            const completedContainer = document.getElementById('completed-orders-container');
            
            if (pendingContainer) pendingContainer.innerHTML = '';
            if (completedContainer) completedContainer.innerHTML = '';

            if (!snapshot.exists()) {
                if (pendingContainer) pendingContainer.innerHTML = '<p class="no-orders" style="text-align:center; color:#888;">ไม่มีคำสั่งซื้อใหม่</p>';
                return;
            }

            snapshot.forEach((child) => {
                const orderId = child.key;
                const order = child.val();
                const status = order.status || 'รอดำเนินการ';
                
                // สร้างรายการอาหาร + โชว์ พิเศษ/ไข่ดาว
                let itemsHtml = '';
                if (order.items) {
                    itemsHtml = order.items.map(item => {
                        const details = item.options || 'ธรรมดา';
                        return `
                            <li style="border-bottom: 1px solid #444; padding: 8px 0; list-style:none;">
                                <div style="display: flex; justify-content: space-between; color:#fff;">
                                    <strong>${item.quantity || 1}x ${item.name}</strong>
                                    <span style="color: #41ff7aff;">฿${parseFloat(item.finalPrice || 0).toFixed(2)}</span>
                                </div>
                                <div style="color: #ffeb3b; font-size: 0.85em; margin-top: 4px; background: #333; padding: 2px 8px; border-radius: 4px; display:inline-block;">
                                    ✨ ${details}
                                </div>
                            </li>
                        `;
                    }).join('');
                }

                // กำหนดปุ่มตามสถานะ
                let actionButtons = '';
                if (status === 'รอดำเนินการ') {
                    actionButtons = `<button onclick="updateOrderStatus('${orderId}', 'กำลังทำ')" style="background:#ff9800; color:white; border:none; padding:10px; border-radius:5px; flex:1; cursor:pointer;">เริ่มทำ</button>`;
                } else if (status === 'กำลังทำ') {
                    actionButtons = `<button onclick="updateOrderStatus('${orderId}', 'เสร็จสมบูรณ์')" style="background:#4CAF50; color:white; border:none; padding:10px; border-radius:5px; flex:1; cursor:pointer;">เสร็จแล้ว</button>`;
                } else if (status === 'เสร็จสมบูรณ์') {
                    actionButtons = `<button onclick="updateOrderStatus('${orderId}', 'ชำระเงินแล้ว')" style="background:#2196F3; color:white; border:none; padding:10px; border-radius:5px; flex:1; cursor:pointer;">จ่ายเงินแล้ว</button>`;
                } else if (status === 'ชำระเงินแล้ว') {
                    actionButtons = `<button onclick="archiveToHistory('${orderId}')" style="background:#673AB7; color:white; border:none; padding:10px; border-radius:5px; flex:1; cursor:pointer;">📥 เก็บลงประวัติ</button>`;
                }

                const cardHtml = `
                    <div class="order-card" style="background:#1e1e1e; border:1px solid #333; padding:15px; margin-bottom:15px; border-radius:10px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom: 1px dashed #555; padding-bottom:5px;">
                            <span style="color:#c9a227; font-size:1.1em;"><b>โต๊ะ: ${order.tableNumber || order.table || 'N/A'}</b></span>
                            <span style="background:#444; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.7em;">${status}</span>
                        </div>
                        <ul style="padding:0; margin:0;">${itemsHtml}</ul>
                        <p style="font-weight:bold; color:#fff; text-align:right; margin:10px 0;">ยอดรวม: ${order.total || 0} บาท</p>
                        <div style="display:flex; gap:10px;">
                            ${actionButtons}
                            <button onclick="cancelOrder('${orderId}')" style="background:#ff4757; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">ลบ</button>
                        </div>
                    </div>
                `;

                // แยกฝั่งแสดงผล
                if (status === 'ชำระเงินแล้ว' || status === 'เสร็จสมบูรณ์') {
                    if (completedContainer) completedContainer.insertAdjacentHTML('beforeend', cardHtml);
                } else {
                    if (pendingContainer) pendingContainer.insertAdjacentHTML('beforeend', cardHtml);
                }
            });
        });
    };

    // --- 2. ฟังก์ชันจัดการสถานะออเดอร์ ---
    // แก้ไขฟังก์ชันเดิมของน้าให้เป็นแบบนี้
window.updateOrderStatus = function(orderId, newStatus) {
    const orderRef = ordersRef.child(orderId);

    // ✅ เพิ่มส่วนนี้: ถ้าสถานะคือ 'ชำระเงินแล้ว' ให้ส่งข้อมูลสลิปทันที
    if (newStatus === 'ชำระเงินแล้ว') {
        orderRef.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // ส่งข้อมูลไป Path ที่หน้า track รอฟังอยู่
                db.ref(`currentReceipt/${data.tableNumber}`).set({
                    tableNumber: data.tableNumber,
                    items: data.items,
                    total: data.total,
                    paidAt: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }

    // ส่วนอัปเดตสถานะเดิมของน้า
    orderRef.update({ status: newStatus })
        .catch(err => alert("เกิดข้อผิดพลาด: " + err.message));
};

    window.cancelOrder = function(orderId) {
        if (confirm('ยืนยันการลบออเดอร์นี้?')) {
            ordersRef.child(orderId).remove();
        }
    };

    window.archiveToHistory = function(orderId) {
    if (!confirm("ต้องการย้ายรายการนี้ไปที่หน้าประวัติการขาย?")) return;

    // ดึงข้อมูลออเดอร์นั้นมาจาก Firebase ก่อน
    db.ref(`orders/${orderId}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // เพิ่มเวลาที่บันทึกเข้าไป เพื่อใช้เรียงลำดับในหน้าประวัติ
            data.archivedAt = Date.now(); 
            
            // 1. ส่งข้อมูลไปที่กล่อง 'history'
            db.ref('history').push(data).then(() => {
                // 2. เมื่อส่งสำเร็จแล้ว ให้ลบออกจากหน้าจัดการ (orders)
                db.ref(`orders/${orderId}`).remove();
                alert("บันทึกลงประวัติเรียบร้อยครับน้า!");
            }).catch(err => {
                alert("เกิดข้อผิดพลาด: " + err.message);
            });
        }
    });
};

    // --- 3. ส่วนจัดการเมนู (เปิด-ปิดรายการอาหาร) ---
    window.loadAdminMenu = function() {
        const menuList = document.getElementById('admin-menu-list');
        if (!menuList) return;
        
        db.ref('products').on('value', (snapshot) => {
            const products = snapshot.val();
            menuList.innerHTML = '';
            if (!products) return;

            for (let id in products) {
                const p = products[id];
                const isOut = p.status === 'out_of_stock';
                menuList.innerHTML += `
                    <div style="background:#1e1e1e; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;">
                        <div><b style="color:#fff;">${p.name}</b><br><small style="color:#aaa;">${p.price} บาท</small></div>
                        <button onclick="toggleProductStatus('${id}', '${p.status}')" 
                                style="background:${isOut ? '#41ff7aff' : '#ff4757'}; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">
                            ${isOut ? 'เปิดขาย' : 'ปิดเมนู'}
                        </button>
                    </div>
                `;
            }
        });
    };

    window.toggleProductStatus = function(id, currentStatus) {
        const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
        db.ref(`products/${id}`).update({ status: newStatus });
    };

    // --- 4. ระบบสลับ Tab ---
    window.switchTab = function(tabName) {
        const sections = ['pending-section', 'completed-section', 'menu-section'];
        sections.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = 'none';
        });

        const target = document.getElementById(`${tabName}-section`);
        if (target) target.style.display = 'block';
        
        if (tabName === 'menu') loadAdminMenu();
    };

    // เริ่มทำงานเมื่อโหลดหน้าเสร็จ
    // ปรับส่วนท้ายของ track.html ให้สะอาดแบบนี้
document.addEventListener('DOMContentLoaded', () => {
    startTracking();
    listenForReceipt(); 
});
}
function toggleDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// ถ้าคลิกข้างนอกกล่องเมนู ให้มันปิดเองอัตโนมัติ
window.onclick = function(event) {
    if (!event.target.matches('.menu-icon') && !event.target.matches('.menu-icon span')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
// ฟังก์ชันสำหรับกด "จ่ายเงินแล้ว" ในหน้า Admin
window.markAsPaid = function(orderId) {
    if (!confirm("ยืนยันการชำระเงินและย้ายไปหน้าประวัติ?")) return;

    const orderRef = db.ref(`orders/${orderId}`);

    orderRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const orderData = snapshot.val();
            const tableNo = orderData.tableNumber;

            // 1. ส่งข้อมูลไปยัง currentReceipt เพื่อให้หน้า track ของลูกค้าเด้งปุ่มสลิป
            db.ref(`currentReceipt/${tableNo}`).set({
                tableNumber: tableNo,
                items: orderData.items,
                total: orderData.total,
                paidAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                
                // 2. ย้ายข้อมูลไปเก็บในหน้า History (ประวัติการขาย)
                return db.ref('history').push({
                    ...orderData,
                    completedAt: firebase.database.ServerValue.TIMESTAMP
                });

            }).then(() => {
                
                // 3. ลบออเดอร์ออกจากหน้าจอทำงาน (orders)
                return orderRef.remove();

            }).then(() => {
                alert(`เช็คบิลโต๊ะ ${tableNo} เรียบร้อย! สลิปส่งไปหน้าลูกค้าแล้ว`);
            }).catch((error) => {
                console.error("เกิดข้อผิดพลาด:", error);
                alert("ไม่สามารถบันทึกการจ่ายเงินได้");
            });
        }
    });
};
// ฟังก์ชันเมื่อกดปุ่ม "จ่ายเงินแล้ว" ในหน้า Admin
window.payOrder = function(orderId) {
    const orderRef = db.ref(`orders/${orderId}`);
    
    orderRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const tableNo = data.tableNumber;

            // ✨ จุดสำคัญ: ส่งข้อมูลไปที่ currentReceipt เพื่อให้หน้า track เห็น
            db.ref(`currentReceipt/${tableNo}`).set({
                tableNumber: tableNo,
                items: data.items,
                total: data.total,
                paidAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                // เก็บเข้าประวัติ และลบออเดอร์ปกติ
                db.ref('history').push({...data, archivedAt: firebase.database.ServerValue.TIMESTAMP});
                orderRef.remove();
                alert(`เช็คบิลโต๊ะ ${tableNo} เรียบร้อย!`);
            });
        }
    });
};
