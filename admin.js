
// File: admin.js - โค้ดที่รองรับการแสดงผล 2 ส่วน, คำนวณยอด และกรอง

if (typeof db !== 'undefined') {
    const ordersPendingContainer = document.getElementById('orders-list-container');
    const ordersCompletedContainer = document.getElementById('completed-orders-container'); // NEW
    const orderCountEl = document.getElementById('order-count');
    const dailyRevenueEl = document.getElementById('daily-revenue'); // NEW
    const tableFilterInput = document.getElementById('table-filter'); // NEW
    const ordersRef = db.ref('orders'); 

    // ฟังก์ชันจัดการสถานะและการลบ (เหมือนเดิม)
    window.updateOrderStatus = function(orderId, newStatus) {
        if (confirm(`ยืนยันการเปลี่ยนสถานะคำสั่งซื้อ ID: ${orderId} เป็น "${newStatus}" ใช่หรือไม่?`)) {
            ordersRef.child(orderId).update({ status: newStatus })
                .catch(error => console.error("Update Error:", error));
        }
    }
    window.cancelOrder = function(orderId) {
        if (confirm(`ยืนยันการยกเลิก/ลบคำสั่งซื้อ ID: ${orderId} ออกจากระบบ ใช่หรือไม่?`)) {
            ordersRef.child(orderId).remove()
                .catch(error => console.error("Remove Error:", error));
        }
    }
    
    // NEW: ฟังก์ชันสร้าง HTML สำหรับคำสั่งซื้อแต่ละรายการ
    // ใน admin.js: ฟังก์ชัน createOrderCard
function createOrderCard(orderId, order, statusClass, itemsHtml, displayTime) {
    const tableNum = order.tableNumber || order.table || 'N/A';
    const status = order.status || 'รอดำเนินการ'; 
    const total = parseFloat(order.total || 0).toFixed(2);

    return `
        <div class="order-card ${statusClass}" data-table="${tableNum}">
            <h4 class="order-total">ยอดรวม: ${total} บาท</h4>
            <h3 class="order-table">โต๊ะ: ${tableNum}</h3> 
            <p class="order-time">${displayTime}</p>
            <div class="order-status ${statusClass}">${status}</div>
            
            <ul class="order-items-list">
                ${itemsHtml}
            </ul>
            
           <div class="action-buttons">
            ${status === 'รอดำเนินการ' ? `<button class="btn-action btn-start" onclick="updateOrderStatus('${orderId}', 'กำลังทำ')">เริ่มทำ</button>` : ''}
            ${status === 'กำลังทำ' ? `<button class="btn-action btn-complete" onclick="updateOrderStatus('${orderId}', 'เสร็จสมบูรณ์')">เสร็จ</button>` : ''}
    
            ${status === 'ชำระเงินแล้ว' ? 
            `<button class="btn-action btn-save" style="background-color: #4CAF50; color: white;" onclick="archiveOrder('${orderId}')">บันทึกรายการ</button>` : 
            `<button class="btn-action btn-cancel" onclick="cancelOrder('${orderId}')">ลบ/ยกเลิก</button>`
    }
            </div>
        </div>
    `;
}
// NEW: ฟังก์ชันกรองคำสั่งซื้อตามหมายเลขโต๊ะ
    window.filterOrders = function() {
        const filterText = tableFilterInput.value.trim().toUpperCase();
        
        document.querySelectorAll('.order-card').forEach(card => {
            const tableNumber = card.getAttribute('data-table').toUpperCase();
            
            if (filterText === '' || tableNumber.includes(filterText)) {
                card.style.display = 'block'; // แสดง
            } else {
                card.style.display = 'none'; // ซ่อน
            }
        });
    };
    
    // โค้ดหลัก: ฟังการเปลี่ยนแปลงข้อมูลแบบเรียลไทม์
    ordersRef.on('value', (snapshot) => {
        ordersPendingContainer.innerHTML = ''; 
        ordersCompletedContainer.innerHTML = ''; // เคลียร์ส่วนที่เสร็จสมบูรณ์
        
        let totalOrders = 0;
        let totalRevenue = 0; // NEW: ตัวแปรสำหรับคำนวณยอดรวม
        
        const orders = snapshot.val();
        
        if (orders) {
            // โหลดข้อมูลจาก Firebase (โดยเรียงย้อนหลัง)
            Object.keys(orders).reverse().forEach(orderId => {
                const order = orders[orderId];
                totalOrders++;

                const status = order.status || 'รอดำเนินการ';
                // เพิ่มบรรทัดนี้ในฟังก์ชัน createOrderCard
let statusClass = (status === 'รอดำเนินการ') ? 'status-pending' : 
                 (status === 'กำลังทำ') ? 'status-processing' : 
                 (status === 'ชำระเงินแล้ว') ? 'status-paid' : 'status-completed';

                // โค้ดการสร้างรายการสินค้า (เหมือนเดิมที่มีการแปลง 'S' เป็น 'ธรรมดา')
                let itemsHtml = '<li class="order-item-detail">ไม่พบรายละเอียดรายการสินค้า</li>';
                if (order.items && Array.isArray(order.items)) {
                    itemsHtml = order.items.map(item => {
                        const itemName = item.name || 'รายการที่ไม่ระบุชื่อ'; 
                        
                        // โค้ดแปลง 'S' เป็น 'ธรรมดา'
                        const rawOptions = item.options || 'S';
                        let displayOptions = rawOptions;
                        if (rawOptions.startsWith('S')) {
                            displayOptions = rawOptions.replace('S', 'ธรรมดา');
                        }
                        const itemOptions = displayOptions;
                        
                        const itemNotes = item.notes ? `<small class="item-note-admin">โน้ต: ${item.notes}</small>` : '';

                        return `
                            <li class="order-item-detail">
                                <span class="item-name-admin">${itemName}</span>
                                <small class="item-option-admin">${itemOptions}</small>
                                ${itemNotes}
                                <span class="item-price-admin">${parseFloat(item.finalPrice || 0).toFixed(2)} บาท</span>
                            </li>
                        `;
                    }).join('');
                }
                
                // รูปแบบวันที่/เวลา
                const timestampDate = new Date(order.timestamp);
                const displayTime = isNaN(timestampDate) ? 'ไม่ระบุเวลา' : 
                                    timestampDate.toLocaleString('th-TH', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        hour: '2-digit', 
                                        minute: '2-digit', 
                                        hour12: false 
                                    });

                const orderCardHtml = createOrderCard(orderId, order, statusClass, itemsHtml, displayTime);
                
                // NEW: แยกคำสั่งซื้อตามสถานะ
                if (status === 'เสร็จสมบูรณ์' || status === 'ชำระเงินแล้ว') {
                    ordersCompletedContainer.innerHTML += orderCardHtml;
                    totalRevenue += parseFloat(order.total || 0); // คำนวณยอด
                } else {
                    ordersPendingContainer.innerHTML += orderCardHtml;
                }
            });
            
            // แสดงข้อความเมื่อไม่มีคำสั่งซื้อในแต่ละส่วน
            if (ordersPendingContainer.innerHTML === '') {
                ordersPendingContainer.innerHTML = '<p class="no-orders-message">ไม่มีคำสั่งซื้อที่รอดำเนินการ</p>';
            }
             if (ordersCompletedContainer.innerHTML === '') {
                ordersCompletedContainer.innerHTML = '<p class="no-orders-message">ไม่มีคำสั่งซื้อที่เสร็จสมบูรณ์ในระบบ</p>';
            }
            
        } else {
            ordersPendingContainer.innerHTML = '<p class="no-orders-message">ไม่มีคำสั่งซื้อที่รอดำเนินการ</p>';
            ordersCompletedContainer.innerHTML = '<p class="no-orders-message">ไม่มีคำสั่งซื้อที่เสร็จสมบูรณ์ในระบบ</p>';
        }
        
        // อัปเดตตัวนับและยอดรวม
        orderCountEl.textContent = totalOrders;
        dailyRevenueEl.textContent = totalRevenue.toFixed(2);
        
        // หลังจากโหลดข้อมูลเสร็จ ให้ทำการกรองอีกครั้งเพื่อแสดงผลที่ถูกต้อง
        filterOrders(); 
        
    }, (error) => {
        ordersPendingContainer.innerHTML = '<p class="error-message">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ Console</p>';
        console.error("Firebase Database Connection Error:", error);
    });

} else {
    console.error("Firebase SDK (db variable) is not ready. Check your admin.html configuration.");
}
// ใน admin.js: ฟังก์ชันสำหรับอัปเดตสถานะคำสั่งซื้อใน Firebase
function updateOrderStatus(orderId, newStatus) {
    // ตรวจสอบการเชื่อมต่อ Firebase (สมมติว่า 'db' คือ Firebase Database)
    if (typeof db === 'undefined' || !db) {
        console.error("Firebase DB object 'db' is undefined or null. Cannot update status.");
        return;
    }

    // สร้าง Path อ้างอิงไปยังคำสั่งซื้อที่ต้องการอัปเดต
    const orderRef = db.ref('orders/' + orderId);

    // ทำการอัปเดต Field 'status'
    orderRef.update({
        status: newStatus 
        // newStatus จะเป็น 'กำลังทำ' หรือ 'เสร็จสมบูรณ์' ตามปุ่มที่กด
    })
    .then(() => {
        console.log(`Order ${orderId} status updated to ${newStatus}`);
        
        // *** หมายเหตุ: เมื่ออัปเดตสำเร็จ Real-time Listener ใน admin.js 
        // จะรับข้อมูลใหม่และทำการ Refresh Order Card เองโดยอัตโนมัติ ***
    })
    .catch(error => {
        console.error("Error updating status:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    });
}
// ใน admin.js: โค้ดสำหรับดึงและแสดงคำสั่งซื้อแบบ Real-time
// --- ส่วนที่ 1: จัดการออเดอร์ (รอดำเนินการ / ชำระเงินแล้ว) ---
window.loadOrdersRealtime = function() {
    const ordersRef = db.ref('orders');
    ordersRef.on('value', (snapshot) => {
        const orders = snapshot.val();
        const pendingContainer = document.getElementById('orders-list-container');
        const completedContainer = document.getElementById('completed-orders-container');
        
        pendingContainer.innerHTML = '';
        completedContainer.innerHTML = '';

        if (!orders) return;

        Object.keys(orders).forEach(id => {
            const order = orders[id];
            const html = `
                <div class="order-card" style="background:#1e1e1e; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid #333;">
                    <p><b>โต๊ะ: ${order.tableNumber}</b> | สถานะ: ${order.status}</p>
                    <p>ยอดรวม: ${order.total} บาท</p>
                    ${order.status === 'ชำระเงินแล้ว' ? 
                        `<button onclick="archiveToHistory('${id}')" style="background:#4CAF50; color:white; border:none; padding:10px; width:100%; cursor:pointer; border-radius:5px; font-weight:bold;">📥 เก็บลงประวัติการขาย</button>` 
                        : `<p style="color:#aaa; font-size:0.8em;">(รอชำระเงินก่อนจึงจะเก็บลงประวัติได้)</p>`}
                </div>
            `;

            if (order.status === 'รอดำเนินการ') {
                pendingContainer.innerHTML += html;
            } else {
                completedContainer.innerHTML += html;
            }
        });
    });
};

// --- ส่วนที่ 2: ฟังก์ชันเก็บลงประวัติ (Archive) ---
window.archiveToHistory = function(orderId) {
    if (!confirm("ยืนยันการเก็บออเดอร์นี้ลงประวัติ?")) return;

    db.ref(`orders/${orderId}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // เพิ่ม timestamp สำหรับเก็บประวัติ
            data.archivedAt = Date.now(); 
            
            // ย้ายไป history ก่อน
            db.ref('history').push(data).then(() => {
                // ย้ายสำเร็จแล้วค่อยลบจาก orders
                db.ref(`orders/${orderId}`).remove();
                alert("เก็บข้อมูลลงประวัติแล้ว");
            });
        }
    });
};

// --- ส่วนที่ 3: จัดการเมนู (เปิด-ปิดเมนู) ---
function loadAdminMenu() {
    const menuList = document.getElementById('admin-menu-list');
    db.ref('products').on('value', (snapshot) => {
        const products = snapshot.val();
        menuList.innerHTML = '';
        if (!products) return;

        for (let id in products) {
            const p = products[id];
            const isOut = p.status === 'out_of_stock';
            menuList.innerHTML += `
                <div class="admin-item-card" style="background:#1e1e1e; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div><b>${p.name}</b><br><small>${p.price} บาท</small></div>
                    <button onclick="toggleProductStatus('${id}', '${p.status}')" 
                            style="background:${isOut ? '#41ff7aff' : '#ff4757'}; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">
                        ${isOut ? 'เปิดขาย' : 'ปิดเมนู'}
                    </button>
                </div>
            `;
        }
    });
}

window.toggleProductStatus = function(id, currentStatus) {
    const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
    db.ref(`products/${id}`).update({ status: newStatus });
};

// เรียกโหลดเมนูเมื่อเปิดหน้าจัดการเมนู
window.switchTab = function(tabName) {
    document.getElementById('pending-section').style.display = 'none';
    document.getElementById('completed-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'none';

    document.getElementById(`${tabName}-section`).style.display = 'block';
    
    if (tabName === 'menu') loadAdminMenu();
};
// ฟังก์ชันสำหรับหน้า admin.html
function updateAdminDashboard() {
    let totalRevenue = 0;
    let totalOrders = 0;

    // 1. ดึงยอดจากออเดอร์ที่ยังไม่ได้จ่ายเงิน (orders)
    // ตัวอย่าง Logic ใน admin.js
db.ref('orders').on('value', (snapshot) => {
    const pendingContainer = document.getElementById('orders-list-container'); // ช่องรอดำเนินการ
    const completedContainer = document.getElementById('completed-orders-container'); // ช่องที่เสร็จ/ชำระแล้ว
    
    // ล้างข้อมูลเก่าก่อนวาดใหม่
    pendingContainer.innerHTML = '';
    if(completedContainer) completedContainer.innerHTML = '';

    snapshot.forEach((child) => {
        const order = child.val();
        const orderId = child.key;
        const orderCard = createOrderCard(orderId, order); // ฟังก์ชันสร้างการ์ดของคุณ

        // แยกช่องแสดงผลตามสถานะ
        if (order.status === 'ชำระเงินแล้ว' || order.status === 'เสร็จสมบูรณ์') {
            // ถ้าจ่ายแล้ว หรือ ทำเสร็จแล้ว ให้ไปอยู่ช่องล่าง (Completed)
            if(completedContainer) {
                completedContainer.insertAdjacentHTML('beforeend', orderCard);
            }
        } else {
            // ถ้ายังไม่เสร็จ (รอดำเนินการ/กำลังทำ) ให้ไปอยู่ช่องบน (Pending)
            pendingContainer.insertAdjacentHTML('beforeend', orderCard);
        }
    });
});
}
// ในไฟล์ admin.js
function loadOrdersRealtime() {
    const ordersRef = db.ref('orders');
    const pendingContainer = document.getElementById('orders-list-container');
    const completedContainer = document.getElementById('completed-orders-container');

    ordersRef.on('value', (snapshot) => {
        // ล้างข้อมูลเก่าออกก่อนวาดใหม่
        pendingContainer.innerHTML = '';
        completedContainer.innerHTML = '';

        if (!snapshot.exists()) {
            pendingContainer.innerHTML = '<p>ไม่มีคำสั่งซื้อใหม่</p>';
            completedContainer.innerHTML = '<p>ไม่มีรายการที่ชำระเงินแล้ว</p>';
            return;
        }

        snapshot.forEach((child) => {
            const orderId = child.key;
            const order = child.val();
            
            // ใช้ฟังก์ชันสร้างการ์ดที่มีอยู่เดิมของคุณ
            const orderCard = createOrderCard(orderId, order); 

            // --- จุดสำคัญ: แยกสถานะ ---
            if (order.status === 'ชำระเงินแล้ว' || order.status === 'เสร็จสมบูรณ์') {
                // ถ้าสถานะเป็น "ชำระเงินแล้ว" หรือ "เสร็จสมบูรณ์" ให้ย้ายมาช่องล่าง
                completedContainer.insertAdjacentHTML('beforeend', orderCard);
            } else {
                // ถ้าสถานะอื่นๆ (รอดำเนินการ, กำลังทำ) ให้ไว้ช่องบน
                pendingContainer.insertAdjacentHTML('beforeend', orderCard);
            }
        });
        
        // อัปเดตตัวเลขจำนวนรายการและรายได้ (ถ้ามีฟังก์ชันนี้อยู่)
        if (typeof updateAdminDashboard === 'function') {
            updateAdminDashboard();
        }
    });
}
// ตรวจสอบให้แน่ใจว่าฟังก์ชันนี้อยู่นอกสุดของไฟล์ admin.js หรืออยู่ในขอบเขตที่ HTML เรียกถึงได้
// ฟังก์ชันสำหรับกดเก็บออเดอร์ลงประวัติด้วยมือ
window.archiveOrder = function(orderId) {
    if (!confirm("ต้องการเก็บออเดอร์นี้ลงประวัติการขายใช่หรือไม่?")) return;

    // 1. ดึงข้อมูลออเดอร์นั้นออกมาจาก Firebase ก่อน
    db.ref(`orders/${orderId}`).once('value', (snapshot) => {
        const orderData = snapshot.val();
        
        if (orderData) {
            // เพิ่มเวลาที่เก็บออเดอร์ (ใช้สำหรับหน้า History)
            orderData.archivedAt = Date.now(); 

            // 2. ส่งข้อมูลไปที่กิ่ง 'history'
            db.ref('history').push(orderData, (error) => {
                if (!error) {
                    // 3. เมื่อเก็บสำเร็จแล้ว ค่อยลบออเดอร์ออกจากหน้า Admin (กิ่ง orders)
                    db.ref(`orders/${orderId}`).remove();
                    alert("เก็บลงประวัติเรียบร้อยครับ");
                } else {
                    alert("เกิดข้อผิดพลาด: " + error.message);
                }
            });
        }
    });
};
// ฟังก์ชันสำหรับสลับ Tab
window.switchTab = function(tabName) {
    const pendingSection = document.getElementById('pending-section');
    const completedSection = document.getElementById('completed-section');
    const menuSection = document.getElementById('menu-section'); // เพิ่มตัวนี้

    const btnPending = document.getElementById('tab-pending');
    const btnCompleted = document.getElementById('tab-completed');
    const btnMenu = document.getElementById('tab-menu'); // เพิ่มตัวนี้

    // 1. ซ่อนทุก Section ก่อน
    pendingSection.style.display = 'none';
    completedSection.style.display = 'none';
    if(menuSection) menuSection.style.display = 'none';

    // 2. ล้างสีปุ่มทั้งหมดให้เป็นสีเข้มปกติ
    [btnPending, btnCompleted, btnMenu].forEach(btn => {
        if(btn) {
            btn.style.background = '#333';
            btn.style.color = 'white';
        }
    });

    // 3. เช็กว่ากด Tab ไหน แล้วเปิด/เปลี่ยนสีปุ่มอันนั้น
    if (tabName === 'pending') {
        pendingSection.style.display = 'block';
        btnPending.style.background = '#41ffd0ff';
        btnPending.style.color = 'black';
    } else if (tabName === 'completed') {
        completedSection.style.display = 'block';
        btnCompleted.style.background = '#41ff7aff';
        btnCompleted.style.color = 'black';
    } else if (tabName === 'menu') {
        if(menuSection) {
            menuSection.style.display = 'block';
            btnMenu.style.background = '#c9a227'; // สีทองสำหรับจัดการเมนู
            btnMenu.style.color = 'black';
            loadAdminMenu(); // เรียกฟังก์ชันโหลดรายการอาหารมาโชว์
        }
    }
};
// ปรับปรุงฟังก์ชัน Render เดิมของคุณ (ให้แน่ใจว่าเรียกใช้ ID container ให้ถูกต้อง)
// ตัวอย่างเช่นใน Firebase listener:
ordersRef.on('value', (snapshot) => {
    const orders = snapshot.val();
    // ... โค้ดคำนวณยอดรวมและคัดแยกสถานะของคุณ ...
    // แสดงผลลงใน orders-list-container และ completed-orders-container ตามเดิม
});
// --- ส่วนจัดการจัดการเมนู (Product Management) ---

// 1. ฟังก์ชันดึงรายการเมนูทั้งหมดมาโชว์ในหน้า Admin
function loadAdminMenu() {
    const adminMenuList = document.getElementById('admin-menu-list');
    if (!adminMenuList) return;

    console.log("กำลังเชื่อมต่อกับ Firebase เพื่อดึงเมนู..."); // เช็กว่าฟังก์ชันทำงานไหม

    db.ref('products').on('value', (snapshot) => {
        const products = snapshot.val();
        console.log("ข้อมูลที่ดึงได้จาก Firebase:", products); // ดูว่าข้อมูลมาไหม

        adminMenuList.innerHTML = ''; 

        if (!products) {
            adminMenuList.innerHTML = '<p style="text-align:center; color: #888;">ไม่พบข้อมูลในกิ่ง products</p>';
            return;
        }

        for (let id in products) {
            const p = products[id];
            const isOut = p.status === 'out_of_stock';

            adminMenuList.innerHTML += `
                <div class="admin-item-card" style="background: #1e1e1e; padding: 15px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                    <div>
                        <strong style="color: #c9a227;">${p.name}</strong><br>
                        <span>${p.price} บาท</span>
                    </div>
                    <button onclick="toggleProductStatus('${id}', '${p.status}')" 
                        style="background: ${isOut ? '#41ff7aff' : '#ff4757'}; border: none; padding: 5px 10px; border-radius: 5px;">
                        ${isOut ? 'เปิดขาย' : 'ปิดเมนู'}
                    </button>
                </div>
            `;
        }
    });
}

// 2. ฟังก์ชันเปลี่ยนสถานะ เปิด/ปิด เมนู
window.toggleProductStatus = function(id, currentStatus) {
    const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
    db.ref(`products/${id}`).update({ status: newStatus });
};

// 3. ฟังก์ชันแก้ไขราคา
window.editPrice = function(id, currentPrice) {
    const newPrice = prompt(`ระบุราคาใหม่สำหรับเมนูนี้ (ราคาปัจจุบัน: ${currentPrice}):`);
    if (newPrice !== null && !isNaN(newPrice) && newPrice !== "") {
        db.ref(`products/${id}`).update({ price: parseInt(newPrice) });
    }
};

// เรียกใช้งานเมื่อโหลดหน้า admin
document.addEventListener('DOMContentLoaded', () => {
    // ถ้ามีการคลิกเปลี่ยน Tab ไปที่หน้าจัดการเมนู ให้โหลดข้อมูล
    // (สมมติว่าคุณทำปุ่ม switchTab ไว้แล้ว)
    loadAdminMenu(); 
});
// ฟังก์ชันสำหรับแก้ไขราคาอาหาร
window.editPrice = function(id, currentPrice) {
    const newPrice = prompt(`ระบุราคาใหม่สำหรับรายการนี้ (ราคาปัจจุบัน: ${currentPrice} บาท):`);
    
    // ตรวจสอบว่ามีการพิมพ์ตัวเลขจริง และไม่กด Cancel
    if (newPrice !== null && newPrice !== "") {
        const priceNum = parseInt(newPrice);
        if (!isNaN(priceNum)) {
            db.ref(`products/${id}`).update({ price: priceNum })
                .then(() => alert("อัปเดตราคาเรียบร้อยแล้ว"))
                .catch(err => alert("เกิดข้อผิดพลาด: " + err.message));
        } else {
            alert("กรุณากรอกตัวเลขที่ถูกต้องครับ");
        }
    }
};