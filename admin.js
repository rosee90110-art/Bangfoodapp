// File: admin.js - โค้ดสุดท้ายที่ถูกปรับปรุงให้ทนทานต่อ Error

// ตรวจสอบว่าตัวแปร db ถูกกำหนดใน admin.html แล้ว
if (typeof db !== 'undefined') {
    const ordersContainer = document.getElementById('orders-list-container');
    const orderCountEl = document.getElementById('order-count');
    const ordersRef = db.ref('orders'); 

    // ทำให้ฟังก์ชันรู้จักกับ HTML โดยตรง
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
    
    // ฟังการเปลี่ยนแปลงข้อมูลแบบเรียลไทม์
    ordersRef.on('value', (snapshot) => {
        ordersContainer.innerHTML = ''; 
        let totalOrders = 0;
        
        const orders = snapshot.val();

        if (orders) {
            // วนลูปและสร้าง Card
            Object.keys(orders).reverse().forEach(orderId => {
                const order = orders[orderId];
                totalOrders++;

                const status = order.status || 'รอดำเนินการ'; // ใช้ 'รอดำเนินการ' เป็นค่า default
                let statusClass = (status === 'รอดำเนินการ') ? 'status-pending' : 
                                   (status === 'กำลังทำ') ? 'status-processing' : 
                                   'status-completed';

                const orderElement = document.createElement('div');
                orderElement.classList.add('order-card', statusClass);
                
                // *** การจัดการรายการสินค้า (Items) ที่ทนทานต่อข้อมูลที่อาจจะหายไป ***
                let itemsHtml = '<li class="order-item-detail">ไม่พบรายละเอียดรายการสินค้า</li>';
                if (order.items && Array.isArray(order.items)) {
                    itemsHtml = order.items.map(item => `
                        <li class="order-item-detail">
                            <span class="item-name-admin">${item.name || 'รายการไม่ระบุชื่อ'}</span>
                            <small class="item-option-admin">${item.options || 'มาตรฐาน'}</small>
                            ${item.notes ? `<small class="item-note-admin">โน้ต: ${item.notes}</small>` : ''}
                        </li>
                    `).join('');
                }
                
                orderElement.innerHTML = `
                    <h3 class="order-table">โต๊ะ: ${order.table || 'N/A'}</h3>
                    <p class="order-time">${order.timestamp || 'ไม่ระบุเวลา'}</p>
                    <div class="order-status ${statusClass}">${status}</div>

                    <ul class="order-items-list">
                        ${itemsHtml}
                    </ul>
                    
                    <h4 class="order-total">ยอดรวม: ${parseFloat(order.total || 0).toFixed(2)} บาท</h4>
                    
                    <div class="action-buttons">
                        ${status !== 'กำลังทำ' ? `<button class="btn-action btn-start" onclick="updateOrderStatus('${orderId}', 'กำลังทำ')">เริ่มทำ</button>` : ''}
                        ${status !== 'เสร็จสมบูรณ์' ? `<button class="btn-action btn-complete" onclick="updateOrderStatus('${orderId}', 'เสร็จสมบูรณ์')">เสร็จ</button>` : ''}
                        <button class="btn-action btn-cancel" onclick="cancelOrder('${orderId}')">ลบ/ยกเลิก</button>
                    </div>
                `;
                
                ordersContainer.appendChild(orderElement);
            });
            
        } else {
            ordersContainer.innerHTML = '<p class="no-orders-message">ยังไม่มีคำสั่งซื้อที่รอการดำเนินการ</p>';
        }
        
        orderCountEl.textContent = totalOrders;
    }, (error) => {
        // *** ดักจับ Error การเชื่อมต่อฐานข้อมูลโดยเฉพาะ ***
        ordersContainer.innerHTML = '<p class="error-message">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ Console หรือ Firebase Rules</p>';
        console.error("Firebase Database Connection Error:", error);
    });

} else {
    console.error("Firebase SDK (db variable) is not ready. Check your admin.html configuration.");
}