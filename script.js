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


// ... (Global State และ DOM Elements ส่วนอื่น ๆ)

// Elements สำหรับ Modal (หน้าจอปรับแต่งรายละเอียดอาหาร)
const itemDetailModal = document.getElementById('item-detail-modal');
const modalNameEl = document.getElementById('modal-item-name'); // อ้างอิงถึงชื่ออาหาร
const modalBasePriceEl = document.getElementById('modal-base-price');
const modalFinalPriceEl = document.getElementById('modal-final-price');
const modalImageEl = document.getElementById('modal-item-image');
// เปลี่ยน: อ้างอิง Modal Content แทน Form เพื่อให้เข้าถึงทุกส่วนได้
const modalContent = document.querySelector('.modal-content'); 
const modalForm = document.getElementById('item-customization-form'); 
const addToCartConfirmBtn = document.getElementById('add-to-cart-confirm-btn');

// ... (currentItem state)

// --- 4. ฟังก์ชันคำนวณราคาสุทธิ (Modal Real-time Calculation) ---
function calculateFinalPrice() {
    let finalPrice = currentItem.basePrice;
    
    // 4.1 คำนวณจากตัวเลือก Radio (ปริมาณ: พิเศษ/ธรรมดา)
    // ใช้ modalContent แทน modalForm เพื่อให้แน่ใจว่าเข้าถึงได้ แม้ Form จะมีแค่บางส่วน
    const sizeOption = modalContent.querySelector('input[name="size"]:checked');
    if (sizeOption) {
        const modifier = parseFloat(sizeOption.getAttribute('data-modifier'));
        finalPrice += modifier;
    }
    
    // 4.2 คำนวณจากตัวเลือก Checkbox (ตัวเลือกเสริม)
    const addonOptions = modalContent.querySelectorAll('input[name="addon"]:checked');
    addonOptions.forEach(checkbox => {
        const modifier = parseFloat(checkbox.getAttribute('data-modifier'));
        finalPrice += modifier;
    });

    // อัปเดตราคาที่แสดงบน Modal
    modalFinalPriceEl.textContent = finalPrice.toFixed(2);
    return finalPrice;
}


// --- 5. ฟังก์ชันเปิด Modal (ต้องมีโค้ดตั้งค่าชื่อ/ราคาด้วย) ---
function openModal(itemName, itemPriceStr, itemImageSrc) {
    const itemPrice = parseFloat(itemPriceStr);
    
    // 5.1 ตั้งค่า Global Item
    currentItem.name = itemName;
    currentItem.basePrice = itemPrice;
    currentItem.imageSrc = itemImageSrc;
    
    // 5.2 อัปเดตข้อมูลใน Modal (สมมติว่าคุณได้เพิ่ม div item-info-section กลับเข้าไปใน HTML แล้ว)
    if (modalNameEl) modalNameEl.textContent = itemName; 
    if (modalBasePriceEl) modalBasePriceEl.textContent = itemPrice.toFixed(2);
    modalImageEl.src = itemImageSrc;
    
    // 5.3 รีเซ็ตตัวเลือกใน Form เป็นค่าเริ่มต้น
    if (modalForm) modalForm.reset();
    
    // 5.4 คำนวณราคาเริ่มต้นและแสดง Modal
    calculateFinalPrice();
    itemDetailModal.style.display = 'block';
}


// --- 7. Event Listeners ---

// 7.1 Real-time Calculation: เมื่อมีการเปลี่ยนตัวเลือกใดๆ ใน Modal Content
if (modalContent) {
    // ใช้ 'change' event listener บน content หลัก เพื่อจับการเปลี่ยนแปลงของ Radio/Checkbox
    modalContent.addEventListener('change', (event) => {
        // ตรวจสอบว่าการเปลี่ยนแปลงมาจากตัวเลือกราคา (size หรือ addon) หรือไม่
        if (event.target.name === 'size' || event.target.name === 'addon') {
            calculateFinalPrice();
        }
    });
}

// 7.2 Confirmation: เมื่อกดปุ่ม "ยืนยันและเพิ่มลงตะกร้า"
if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        
        // 1. ตรวจสอบหมายเลขโต๊ะก่อน
        const tableNumber = document.getElementById('modal-table-number').value;
        if (!tableNumber) {
            alert("กรุณาเลือกหมายเลขโต๊ะที่ต้องการสั่งอาหารก่อน!");
            return; 
        }

        // 2. ดึงข้อมูลและคำนวณราคาสุดท้าย
        const finalPrice = calculateFinalPrice(); 
        const notes = document.getElementById('modal-notes').value.trim();
        const sizeOptionEl = modalContent.querySelector('input[name="size"]:checked');
        const sizeOption = sizeOptionEl ? sizeOptionEl.value : 'standard';

        const addons = Array.from(modalContent.querySelectorAll('input[name="addon"]:checked'))
                            .map(cb => cb.value);

        // 3. สร้างชื่อสินค้าที่รวม Option เข้าไปด้วย
        let itemNameWithOption = currentItem.name;
        // ... (โค้ดการสร้างชื่อสินค้า) ...
        if (sizeOption === 'special') {
            itemNameWithOption += ' (พิเศษ)';
        }
        if (addons.length > 0) {
            itemNameWithOption += ' + (' + addons.join(', ') + ')';
        }
        if (notes) {
             itemNameWithOption += ` [โน้ต: ${notes}]`;
        }
        
        // 4. เพิ่มข้อมูลโต๊ะลงในตะกร้า (คุณอาจจะต้องปรับปรุง addItemToCart ให้รองรับ tableNumber)
        // เพื่อความง่ายในการคำนวณ ผมสมมติว่าคุณเก็บ tableNumber ใน global state/session
        
        // 5. เพิ่มสินค้าลงตะกร้า
        addItemToCart(itemNameWithOption, finalPrice); 

        // 6. ปิด Modal
        closeModal();
    });
}
// ... (closeModal และ updateCartSummary ส่วนอื่น ๆ)