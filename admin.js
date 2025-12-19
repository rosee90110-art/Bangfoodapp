
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
window.loadOrdersRealtime = function() {
    if (typeof db === 'undefined' || !db) {
        return console.error("Firebase DB not initialized.");
    }
    
    const ordersRef = db.ref('orders');

    // ใช้ on('value') เพื่อให้มีการอัปเดตทุกครั้งที่ข้อมูลเปลี่ยน
    ordersRef.on('value', (snapshot) => {
        // ล้างรายการเดิมก่อนแสดงผลใหม่ทุกครั้ง
        document.getElementById('orders-list-pending').innerHTML = '';
        document.getElementById('orders-list-processing').innerHTML = '';
        document.getElementById('orders-list-completed').innerHTML = '';
        document.getElementById('orders-list-cancelled').innerHTML = '';

        snapshot.forEach(childSnapshot => {
            const orderId = childSnapshot.key;
            const order = childSnapshot.val();

            // เรียกใช้ฟังก์ชันสร้าง Card (ที่คุณมีอยู่แล้ว)
            const orderCard = createOrderCard(orderId, order, order.status); 

            // จัดประเภทและเพิ่ม Card เข้าไปในคอลัมน์ที่เหมาะสม
            if (order.status === 'รอดำเนินการ') {
                document.getElementById('orders-list-pending').insertAdjacentHTML('afterbegin', orderCard);
            } else if (order.status === 'กำลังทำ') {
                document.getElementById('orders-list-processing').insertAdjacentHTML('afterbegin', orderCard);
            } else if (order.status === 'เสร็จสมบูรณ์') {
                document.getElementById('orders-list-completed').insertAdjacentHTML('afterbegin', orderCard);
            } else if (order.status === 'ยกเลิก') {
                document.getElementById('orders-list-cancelled').insertAdjacentHTML('afterbegin', orderCard);
            }
        });
    }, (error) => {
        console.error("Error loading orders:", error);
    });
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
window.archiveOrder = function(orderId) {
    if (confirm("คุณต้องการบันทึกรายการนี้ไปยังประวัติการขายใช่หรือไม่?")) {
        const orderRef = db.ref('orders/' + orderId);
        const historyRef = db.ref('history');

        // 1. ดึงข้อมูลออเดอร์ทั้งหมด
        orderRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                // 2. เตรียมข้อมูลบันทึกประวัติ (ดึงรายการอาหารและราคาทั้งหมดมาด้วย)
                const historyEntry = {
                    ...data,
                    archivedAt: firebase.database.ServerValue.TIMESTAMP, // บันทึกเวลาที่กดปุ่ม
                    status: 'เสร็จสิ้น'
                };

                // 3. บันทึกเข้า Node 'history'
                return historyRef.push(historyEntry).then(() => {
                    // 4. เมื่อบันทึกสำเร็จ ให้ลบออกจากหน้าหลัก
                    return orderRef.remove();
                });
            }
        }).then(() => {
            alert("✅ บันทึกข้อมูลสำเร็จ!");
        }).catch((error) => {
            console.error("Archive Error:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        });
    }
};
// ฟังก์ชันสำหรับสลับ Tab
window.switchTab = function(tabName) {
    const pendingSection = document.getElementById('pending-section');
    const completedSection = document.getElementById('completed-section');
    const btnPending = document.getElementById('tab-pending');
    const btnCompleted = document.getElementById('tab-completed');

    if (tabName === 'pending') {
        // แสดงส่วนรอดำเนินการ
        pendingSection.style.display = 'block';
        completedSection.style.display = 'none';
        
        // ปรับสีปุ่ม
        btnPending.style.background = '#41ffd0ff';
        btnPending.style.color = 'black';
        btnCompleted.style.background = '#333';
        btnCompleted.style.color = 'white';
    } else {
        // แสดงส่วนที่เสร็จแล้ว
        pendingSection.style.display = 'none';
        completedSection.style.display = 'block';
        
        // ปรับสีปุ่ม
        btnCompleted.style.background = '#41ff7aff';
        btnCompleted.style.color = 'black';
        btnPending.style.background = '#333';
        btnPending.style.color = 'white';
    }
};

// ปรับปรุงฟังก์ชัน Render เดิมของคุณ (ให้แน่ใจว่าเรียกใช้ ID container ให้ถูกต้อง)
// ตัวอย่างเช่นใน Firebase listener:
ordersRef.on('value', (snapshot) => {
    const orders = snapshot.val();
    // ... โค้ดคำนวณยอดรวมและคัดแยกสถานะของคุณ ...
    // แสดงผลลงใน orders-list-container และ completed-orders-container ตามเดิม
});