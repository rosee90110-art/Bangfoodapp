// File: script.js

// 1. ตัวแปรและ DOM Elements
let cart = []; // ตะกร้าสินค้า เก็บเป็น Array
const cartCountElement = document.getElementById('cart-item-count');
const cartTotalElement = document.getElementById('cart-total-price');
const menuContainer = document.querySelector('.menu-container');

// 2. ฟังก์ชันสำหรับอัปเดตยอดรวมและจำนวนใน Floating Cart
function updateCartSummary() {
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // แสดงผลใน Floating Cart
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
    if (cartTotalElement) {
        cartTotalElement.textContent = totalPrice.toFixed(2); // แสดงทศนิยม 2 ตำแหน่ง
    }

    // ซ่อน/แสดง Floating Cart
    const floatingCart = document.querySelector('.floating-cart-summary');
    if (floatingCart) {
        if (totalItems > 0) {
            floatingCart.style.display = 'flex';
        } else {
            floatingCart.style.display = 'none';
        }
    }
}

// 3. ฟังก์ชันเพิ่มสินค้าเข้าตะกร้า
function addToCart(name, price) {
    // แปลงราคาจาก String เป็น Number
    const itemPrice = parseFloat(price);
    if (isNaN(itemPrice)) return; // ป้องกันข้อผิดพลาด

    // ตรวจสอบว่าสินค้ามีในตะกร้าแล้วหรือยัง
    const existingItem = cart.find(item => item.name === name);
    let currentTotal = 0;

    if (existingItem) {
        existingItem.quantity += 1; // เพิ่มจำนวน
        currentTotal = existingItem.quantity;
    } else {
        cart.push({ // เพิ่มรายการใหม่
            name: name,
            price: itemPrice,
            quantity: 1
        });
        currentTotal = 1;
    }

    console.log(`เพิ่ม ${name} เข้าตะกร้า. จำนวนรวม: ${currentTotal}`);
    updateCartSummary(); // อัปเดตยอดรวม
}

// 4. กำหนด Event Listener ให้กับปุ่ม "+ เพิ่ม" ทั้งหมดในหน้าเมนู
if (menuContainer) {
    menuContainer.addEventListener('click', (event) => {
        // ตรวจสอบว่าคลิกถูกปุ่ม 'add-to-cart-btn' หรือไม่
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            const itemName = button.getAttribute('data-name');
            const itemPrice = button.getAttribute('data-price');

            if (itemName && itemPrice) {
                addToCart(itemName, itemPrice);
            }
        }
    });
}


// 5. Event Listener สำหรับปุ่ม "ดูตะกร้า/สั่งซื้อ" (ส่งข้อมูลไปยัง Backend)
document.getElementById('view-cart-btn').addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('กรุณาเลือกอาหารก่อนสั่งซื้อ');
        return;
    }
    
    // คำนวณราคารวมสุดท้าย
    const finalTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // *** ก้าวใหม่: ส่งออเดอร์ไปยัง Vercel Serverless Function ***
    try {
        const response = await fetch('/api/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // เตรียมข้อมูลสำหรับส่งไปยัง Backend (order.js)
            body: JSON.stringify({ 
                items: cart, 
                table: 'T05', // สามารถกำหนดรหัสโต๊ะที่นี่
                totalPrice: finalTotalPrice,
                timestamp: new Date() 
            }), 
        });

        // ตรวจสอบสถานะ HTTP response
        if (!response.ok) {
            // หากสถานะไม่ใช่ 200/OK แต่เป็น 4xx, 5xx
            const errorBody = await response.json();
            throw new Error(`Server responded with status ${response.status}: ${errorBody.message || 'Unknown server error'}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('✅ สั่งอาหารสำเร็จ! ออเดอร์ถูกบันทึกใน Database แล้ว กรุณารอสักครู่.');
            cart = []; // ล้างตะกร้าเมื่อสั่งสำเร็จ
            update