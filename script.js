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
            // --- Global Cart State ---
let cart = []; // เก็บรายการสินค้าในตะกร้า
let total = 0; // เก็บยอดรวม

// --- 1. ฟังก์ชันเพิ่มสินค้าลงตะกร้า ---
function addItemToCart(itemName, itemPrice) {
    // ตรวจสอบว่าสินค้านี้มีในตะกร้าแล้วหรือไม่
    const existingItem = cart.find(item => item.name === itemName);

    if (existingItem) {
        // ถ้ามีอยู่แล้ว: เพิ่มจำนวน
        existingItem.quantity++;
    } else {
        // ถ้ายังไม่มี: เพิ่มรายการใหม่
        cart.push({
            name: itemName,
            price: itemPrice,
            quantity: 1
        });
    }

    // คำนวณยอดรวมใหม่
    updateCartSummary();

    // *แจ้งเตือนผู้ใช้ว่าเพิ่มสินค้าแล้ว (Optional)*
    console.log(`${itemName} ถูกเพิ่มลงในตะกร้าแล้ว!`);
}

// --- 2. ฟังก์ชันคำนวณและอัปเดตยอดรวม ---
function updateCartSummary() {
    total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // อัปเดตแถบ Floating Cart Summary ที่ด้านล่างของหน้าเมนู
    const itemEl = document.getElementById('cart-item-count');
    const totalEl = document.getElementById('cart-total');

    // ตรวจสอบ Element ว่ามีอยู่ในหน้าหรือไม่
    if (itemEl && totalEl) {
        const totalItems = cart.reduce((count, item) => count + item.quantity, 0);
        itemEl.textContent = `รายการ: ${totalItems}`;
        totalEl.textContent = `${total.toFixed(2)} บาท`;
    }

    // อัปเดตหน้าตะกร้า (ถ้ามีการเรียกฟังก์ชันนี้จากหน้าตะกร้า)
    renderCartItems(); 
}

// --- 3. ฟังก์ชันแสดงรายการในหน้าตะกร้า (Cart Page) ---
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-list');
    const cartTotalDisplay = document.getElementById('cart-page-total');

    // ตรวจสอบว่าเราอยู่บนหน้าตะกร้าหรือไม่
    if (!cartItemsContainer || !cartTotalDisplay) return;

    cartItemsContainer.innerHTML = ''; // ล้างรายการเดิม

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: #A0A0A0; text-align: center;">ตะกร้าของคุณว่างเปล่า</p>';
    } else {
        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item-detail');
            itemElement.innerHTML = `
                <div class="item-name-qty">
                    ${item.name} (${item.quantity} ชิ้น)
                </div>
                <div class="item-price-total">
                    ${(item.price * item.quantity).toFixed(2)} บาท
                </div>
                <button class="remove-btn" onclick="removeItemFromCart(${index})">
                    ลบ
                </button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    cartTotalDisplay.textContent = `ยอดรวมทั้งหมด: ${total.toFixed(2)} บาท`;
}

// --- 4. ฟังก์ชันลบสินค้าออกจากตะกร้า ---
function removeItemFromCart(index) {
    const item = cart[index];
    
    // ลดจำนวน ถ้าจำนวนมากกว่า 1
    if (item.quantity > 1) {
        item.quantity--;
    } else {
        // ถ้าเหลือ 1 ชิ้น ให้ลบรายการนั้นออกจาก Array
        cart.splice(index, 1);
    }
    
    updateCartSummary();
}