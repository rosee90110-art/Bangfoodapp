// File: admin.js - โค้ดที่แก้ไขการแสดงชื่อสินค้า

// File: admin.js - โค้ดที่สมบูรณ์ 100%

if (typeof db !== 'undefined') {
    const ordersContainer = document.getElementById('orders-list-container');
    const orderCountEl = document.getElementById('order-count');
    const ordersRef = db.ref('orders'); 

    // (ส่วนฟังก์ชันจัดการสถานะและการลบ เหมือนเดิม)
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
    
    // โค้ดหลัก: ฟังการเปลี่ยนแปลงข้อมูลแบบเรียลไทม์
    ordersRef.on('value', (snapshot) => {
        ordersContainer.innerHTML = ''; 
        let totalOrders = 0;
        
        const orders = snapshot.val();
        
        if (orders) {
            // โหลดข้อมูลจาก Firebase (โดยเรียงย้อนหลัง)
            Object.keys(orders).reverse().forEach(orderId => {
                const order = orders[orderId];
                totalOrders++;

                const status = order.status || 'รอดำเนินการ';
                let statusClass = (status === 'รอดำเนินการ') ? 'status-pending' : 
                                   (status === 'กำลังทำ') ? 'status-processing' : 
                                   'status-completed';

                const orderElement = document.createElement('div');
                orderElement.classList.add('order-card', statusClass);
                
                let itemsHtml = '<li class="order-item-detail">ไม่พบรายละเอียดรายการสินค้า</li>';
                
                // *** ส่วนที่แก้ไข: ลบเครื่องหมาย ** และยืนยันการดึงชื่อสินค้า ***
                // ในไฟล์ admin.js (เริ่มจากบรรทัด if (order.items && Array.isArray(order.items)) { ... )

// ...
                if (order.items && Array.isArray(order.items)) {
                    itemsHtml = order.items.map(item => {
                        const itemName = item.name || 'รายการที่ไม่ระบุชื่อ'; 
                        
                        // ************************************************************
                        // ** โค้ดใหม่ที่ใช้ในการแปลงค่า 'S' เป็น 'ธรรมดา' **
                        // ************************************************************
                        const rawOptions = item.options || 'S';
                        let displayOptions = rawOptions;

                        // ตรวจสอบว่าตัวเลือกเริ่มต้นด้วย 'S' หรือไม่
                        if (rawOptions.startsWith('S')) {
                            // ใช้ .replace() เพื่อแทนที่ 'S' ตัวแรกด้วย 'ธรรมดา'
                            // จะทำให้ 'S' -> 'ธรรมดา'
                            // และ 'S, เพิ่มวิปครีม' -> 'ธรรมดา, เพิ่มวิปครีม'
                            displayOptions = rawOptions.replace('S', 'ธรรมดา');
                        }
                        
                        const itemOptions = displayOptions; // ใช้ค่าที่แปลงแล้ว
                        
                        const itemNotes = item.notes ? `<small class="item-note-admin">โน้ต: ${item.notes}</small>` : '';
                        
                        // ************************************************************

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
// ...
                // ****************************************************************************

                // รูปแบบวันที่/เวลา
                const displayTime = order.timestamp ? 
                    order.timestamp.split(', ')[0] + ' ' + order.timestamp.split(', ')[1] : 
                    'ไม่ระบุเวลา';

                orderElement.innerHTML = `
                    <h3 class="order-table">โต๊ะ: ${order.table || 'N/A'}</h3>
                    <p class="order-time">${displayTime}</p>
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
        ordersContainer.innerHTML = '<p class="error-message">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ Console หรือ Firebase Rules</p>';
        console.error("Firebase Database Connection Error:", error);
    });

} else {
    console.error("Firebase SDK (db variable) is not ready. Check your admin.html configuration.");
}

