// File: script.js (ฉบับแก้ไข: ลบโค้ดซ้ำซ้อนและโค้ดลอยอยู่)

// ----------------------------------------------------
// --- 1. Global State และ DOM Elements (ใช้ในทุกหน้า) ---
// ----------------------------------------------------

// Global Cart State: ใช้ Session Storage เพื่อคงสถานะระหว่างหน้า
let cart = JSON.parse(sessionStorage.getItem('bangfood_cart')) || {
    table: null, 
    items: [], 
};

// Global State สำหรับ Modal (เฉพาะรายการที่กำลังถูกปรับแต่ง)
let currentItem = {
    name: '',
    basePrice: 100.00, // <--- แก้ไข: กำหนดค่าเริ่มต้นที่เป็นตัวเลข
    imageSrc: '',
};

// DOM Elements (สำหรับ Floating Cart Summary)
const cartCountElement = document.getElementById('cart-item-count');
const cartTotalElement = document.getElementById('cart-total'); 

// DOM Elements สำหรับ Modal (ใช้ใน menu.html)
const itemDetailModal = document.getElementById('item-detail-modal');
const modalNameEl = document.getElementById('modal-item-name');
const modalBasePriceEl = document.getElementById('modal-base-price');
const modalFinalPriceEl = document.getElementById('modal-final-price');
const modalImageEl = document.getElementById('modal-item-image');
const addToCartConfirmBtn = document.getElementById('add-to-cart-confirm-btn');


// ----------------------------------------------------
// --- 2. Cart Persistence และ Summary Functions ---
// ----------------------------------------------------

function saveCart() {
    sessionStorage.setItem('bangfood_cart', JSON.stringify(cart));
    updateCartSummary();
}

function updateCartSummary() {
    // ใช้ cart.items.length แทนการรวม quantity เพราะแต่ละ item ถูกแยกเป็น 1 รายการ
    const totalItems = cart.items.length; 
    const totalPrice = cart.items.reduce((sum, item) => sum + item.finalPrice, 0);

    // อัปเดตแถบ Floating Cart Summary
    if (cartCountElement && cartTotalElement) {
        cartCountElement.textContent = totalItems;
        cartTotalElement.textContent = totalPrice.toFixed(2);
    }
    
    const floatingCart = document.querySelector('.floating-cart-summary');
    if (floatingCart) {
        floatingCart.style.display = 'flex'; // บังคับให้แสดงตลอด
        const viewCartBtn = document.getElementById('view-cart-btn');
        if (viewCartBtn) {
            // ซ่อนปุ่ม "ดูตะกร้า" เมื่อตะกร้าว่างเปล่า เพื่อไม่ให้ผู้ใช้คลิกไปหน้าว่าง
            viewCartBtn.style.display = totalItems > 0 ? 'block' : 'none'; 
        }
    }
}

// **แก้ไข:** เพิ่ม quantity: 1 เข้าไปใน item object
function addItemToCart(name, finalPrice) {
    cart.items.push({
        name: name,
        finalPrice: finalPrice,
        quantity: 1, // กำหนดจำนวนเป็น 1
    });
    saveCart();
}

function clearCart() {
    cart = { table: null, items: [] };
    updateCartSummary();
}

// **ฟังก์ชันใหม่: สำหรับลบรายการสินค้าใน cart.html**
window.removeItem = function(index) {
    if (confirm("คุณต้องการลบรายการนี้ออกจากตะกร้าใช่หรือไม่?")) {
        // ลบรายการออกจาก array โดยใช้ index
        cart.items.splice(index, 1);
        
        // ถ้าตะกร้าว่างเปล่า ให้ล้างหมายเลขโต๊ะด้วย
        if (cart.items.length === 0) {
            cart.table = null;
        }

        saveCart(); // บันทึกและอัปเดตสรุปตะกร้า
        
        // แสดงรายการตะกร้าใหม่ใน cart.html
        if (window.location.pathname.includes('cart.html')) {
            renderCartItems();
        }
    }
}


// ----------------------------------------------------
// --- 3. Modal Functions (ใช้ใน menu.html) ---
// ----------------------------------------------------

// ฟังก์ชันดึงค่าจาก URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// ฟังก์ชันคำนวณราคาสุทธิ
function calculateFinalPrice() {
    if (!itemDetailModal) return 0; 
    
    let finalPrice = currentItem.basePrice; 
    
    // คำนวณจากตัวเลือก Radio (ปริมาณ)
    const sizeOption = document.querySelector('#item-customization-form input[name="size"]:checked');
    if (sizeOption) {
        const modifier = parseFloat(sizeOption.getAttribute('data-modifier'));
        finalPrice += modifier;
    }
    
    // คำนวณจากตัวเลือก Checkbox (ตัวเลือกเสริม)
    const addonOptions = document.querySelectorAll('#item-customization-form input[name="addon"]:checked');
    addonOptions.forEach(checkbox => {
        const modifier = parseFloat(checkbox.getAttribute('data-modifier'));
        finalPrice += modifier;
    });

    if (modalFinalPriceEl) {
        modalFinalPriceEl.textContent = finalPrice.toFixed(2);
    }
    return finalPrice;
}


// ฟังก์ชันเริ่มต้นหน้า menu.html
function initializeMenuPage() {
    // 1. ดึงข้อมูลสินค้าจาก URL
    const itemNameFromUrl = getUrlParameter('name');
    const itemPriceFromUrl = parseFloat(getUrlParameter('price'));
    const itemImageSrc = getUrlParameter('img');

    // 2. อัปเดต Global State (ใช้ค่าจาก URL ถ้ามี, ถ้าไม่ใช้ค่าเริ่มต้นที่ 100.00)
    currentItem.name = itemNameFromUrl || currentItem.name; // ใช้ชื่อเดิมถ้าไม่มีชื่อใหม่
    currentItem.basePrice = isNaN(itemPriceFromUrl) ? 
        currentItem.basePrice : 
        itemPriceFromUrl; // ใช้ราคาจาก URL ถ้าเป็นตัวเลข
    currentItem.imageSrc = itemImageSrc;
    
    // 3. อัปเดต DOM
    if (modalNameEl) modalNameEl.textContent = currentItem.name; 
    if (modalBasePriceEl) modalBasePriceEl.textContent = currentItem.basePrice.toFixed(2);
    if (modalImageEl) modalImageEl.src = itemImageSrc;

    // 4. ตั้งค่าโต๊ะ 
    const tableSelectEl = document.getElementById('modal-table-number');
    if (tableSelectEl) {
        if (cart.table) {
            tableSelectEl.value = cart.table;
            tableSelectEl.disabled = true;
        } else {
            tableSelectEl.value = '';
            tableSelectEl.disabled = false;
        }
    }
    
    // 5. คำนวณราคาเริ่มต้น (และผูก Listener)
    const form = document.getElementById('item-customization-form');
    if (form) {
        calculateFinalPrice(); // คำนวณราคาเริ่มต้น 
        form.addEventListener('change', calculateFinalPrice); // ผูก Event Listener
    }
}


// ฟังก์ชันปิด Modal (แต่ในกรณีนี้คือการ Redirect)
function closeModal(redirectUrl = null) {
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
}


// ----------------------------------------------------
// --- 4. Event Listeners ---
// ----------------------------------------------------

// Listener สำหรับปุ่ม "ยืนยันและเพิ่มลงตะกร้า" (ใน menu.html)
// ในไฟล์ script.js (ใน Listener ของปุ่ม #add-to-cart-confirm-btn)

if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        const tableNumber = document.getElementById('modal-table-number').value;
        
        if (!tableNumber) {
            alert("กรุณาเลือกหมายเลขโต๊ะที่ต้องการสั่งอาหารก่อน!");
            return; 
        }

        const finalPrice = calculateFinalPrice(); 
        const notes = document.getElementById('modal-notes').value.trim();
        
        // *********************************************************************
        // ** 1. ดึงค่าขนาด (S, M, L) และตัวเลือกเสริม (Addons) **
        // *********************************************************************
        
        // ดึงขนาด (S, M, L)
        const sizeOptionEl = document.querySelector('#item-customization-form input[name="size"]:checked');
        const sizeOptionValue = sizeOptionEl ? sizeOptionEl.value : 'S'; // ใช้ 'S' เป็นค่าเริ่มต้น
        
        // ดึงตัวเลือกเสริมทั้งหมด
        const addons = Array.from(document.querySelectorAll('#item-customization-form input[name="addon"]:checked'))
                             .map(cb => cb.value); // [ 'เพิ่มไข่มุก', 'เพิ่มวิบครีม' ]

        // *********************************************************************
        // ** 2. สร้างสตริงตัวเลือก (optionString) สำหรับบันทึกใน Firebase **
        // *********************************************************************
        
        let optionString = sizeOptionValue; // เริ่มต้นด้วย 'S', 'M', หรือ 'L'

        if (addons.length > 0) {
            // หากมีตัวเลือกเสริม ให้ต่อท้ายด้วยคอมม่า
            optionString += ', ' + addons.join(', ');
        }
        
        // *********************************************************************
        // ** 3. บันทึกเข้าตะกร้า (Cart) **
        // *********************************************************************
        
        if (!cart.table) {
            cart.table = tableNumber;
        } 
        
        cart.items.push({
            name: currentItem.name, // ชื่อหลัก (แก้ไขแล้ว)
            options: optionString,  // <--- ค่านี้จะถูกบันทึกใน Firebase (เช่น 'S, เพิ่มไข่มุก')
            notes: notes, 
            finalPrice: finalPrice,
            quantity: 1,
            imgUrl: currentItem.imageSrc || 'placeholder.png', 
        });

        saveCart(); 
        closeModal('cart.html'); 
    });
}

// ----------------------------------------------------
// --- 5. Cart Page Functions (ใช้ใน cart.html) ---
// ----------------------------------------------------

// ----------------------------------------------------
// --- 5. Cart Page Functions (ใช้ใน cart.html) ---
// ----------------------------------------------------

function renderCartItems() {
    // 0. โหลดตะกร้าจาก Session Storage
    const cartData = sessionStorage.getItem('bangfood_cart');
    // cart.orderId จะถูกใช้เพื่อกำหนดว่าจะแสดงปุ่ม 'ตรวจสอบสถานะ' หรือไม่
    const cart = cartData ? JSON.parse(cartData) : { items: [], table: null, orderId: null }; 

    const cartItemsContainer = document.getElementById('cart-items-list');
    const tableInfoEl = document.getElementById('table-display-info');
    const cartTotalDisplay = document.getElementById('final-total-amount'); 
    
    // --- DOM elements สำหรับควบคุมสถานะปุ่ม ---
    const actionArea = document.getElementById('order-action-area');
    const checkoutBtn = document.getElementById('checkout-btn');
    const confirmationMessage = document.getElementById('order-confirmed-message');

    if (!cartItemsContainer || !cartTotalDisplay || !actionArea || !checkoutBtn || !confirmationMessage) return;

    // 1. แสดงหมายเลขโต๊ะ
    if (tableInfoEl) {
        tableInfoEl.textContent = cart.table ? `คำสั่งซื้อสำหรับ โต๊ะ ${cart.table}` : 'ไม่มีรายการในตะกร้า';
    }

    cartItemsContainer.innerHTML = ''; 
    
    // 2. แสดงรายการสินค้า (พร้อมรูปภาพและชื่อ)
    if (cart.items.length === 0) {
        // หากไม่มีรายการสินค้า แต่มี Order ID (คือสั่งไปแล้ว) ให้แสดงข้อความยืนยัน
        if (cart.orderId) {
             cartItemsContainer.innerHTML = `<p class="empty-cart-message" style="text-align: center;">คุณได้สั่งซื้อชุดล่าสุดไปแล้ว</p>`;
        } else {
             cartItemsContainer.innerHTML = '<p class="empty-cart-message" style="text-align: center;">คุณยังไม่ได้เลือกรายการอาหาร</p>';
        }
    } else {
        // ... (โค้ดแสดงรายการสินค้าเดิม) ...
        cart.items.forEach((item, index) => { 
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item'); 
            
            let detailsHtml = '';
            if (item.options) {
                detailsHtml += `<small class="item-modifiers">${item.options}</small>`;
            }
            if (item.notes) {
                detailsHtml += `<small class="item-modifiers item-notes">(โน้ต: ${item.notes})</small>`;
            }
            if (!detailsHtml) {
                detailsHtml = '<small class="item-modifiers">ไม่มีตัวเลือกเสริม</small>';
            }
            
            // ปุ่มลบรายการ (ยังอนุญาตให้ลบได้)
            const removeButtonHtml = `<button class="remove-btn" onclick="removeItem(${index})">ลบ</button>`;

            itemElement.innerHTML = `
                <img src="${item.imgUrl || 'placeholder.png'}" alt="${item.name || 'รายการสินค้า'}" class="cart-item-image">

                <div class="item-details-cart">
                    <p class="item-name-cart">${item.name || 'รายการที่ไม่ได้ระบุชื่อ'}</p> 
                    ${detailsHtml}
                </div>

                <div class="item-quantity-control">
                    <span class="item-price-total">${item.finalPrice.toFixed(2)} บาท</span>
                    ${removeButtonHtml}
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    // 3. แสดงยอดรวมที่ต้องชำระ
    const total = cart.items.reduce((sum, item) => sum + (item.finalPrice || 0), 0);
    cartTotalDisplay.textContent = total.toFixed(2);
    
    
    // ***************************************************************
    // 4. ตรวจสอบสถานะ OrderID และรายการสินค้าเพื่อจัดการปุ่ม
    // ***************************************************************
    const trackBtnClass = 'track-status-btn';
    let trackBtn = document.querySelector(`.${trackBtnClass}`);
    
    // A. ถ้ามีรายการสินค้า (Order 2) ให้แสดงปุ่มยืนยัน
    if (cart.items.length > 0) {
        checkoutBtn.style.display = 'block';
        confirmationMessage.style.display = 'none';
        if (trackBtn) trackBtn.style.display = 'none';

    } 
    // B. ถ้าไม่มีรายการสินค้า แต่มี Order ID (Order 1 ถูกส่งแล้ว) ให้แสดงปุ่มตรวจสอบสถานะ
    else if (cart.orderId && cart.table) {
        const tableNumber = cart.table;
        const trackUrl = `track.html?table=${tableNumber}`;
        
        checkoutBtn.style.display = 'none';

        // ข้อความยืนยันสำหรับรายการที่ถูกส่งไปแล้ว
        confirmationMessage.textContent = `✅ คำสั่งซื้อล่าสุดถูกส่งแล้ว! (โต๊ะ ${tableNumber})`;
        confirmationMessage.style.display = 'block';

        if (!trackBtn) {
            // สร้างปุ่มตรวจสอบสถานะหากยังไม่มี
            trackBtn = document.createElement('a');
            trackBtn.className = `checkout-btn-large ${trackBtnClass}`;
            trackBtn.textContent = 'ตรวจสอบสถานะคำสั่งซื้อ';
            trackBtn.style.marginTop = '15px';
            actionArea.appendChild(trackBtn);
        }
        // อัปเดต href และแสดงปุ่ม
        trackBtn.href = trackUrl;
        trackBtn.style.display = 'block';

    } 
    // C. กรณีอื่นๆ (ว่างเปล่าและไม่มี Order ID)
    else {
        checkoutBtn.style.display = 'none';
        confirmationMessage.style.display = 'none';
        if (trackBtn) trackBtn.style.display = 'none';
    }
}

// ----------------------------------------------------
// --- 6. Initial Load ---
// ----------------------------------------------------

// ตรวจสอบว่าควรโหลดฟังก์ชันไหนตามหน้าปัจจุบัน
const pagePath = window.location.pathname;

if (pagePath.includes('menu.html')) {
    updateCartSummary(); 
    initializeMenuPage(); // เพิ่มการเรียกใช้สำหรับหน้า Menu
} else if (pagePath.includes('cart.html')) {
    renderCartItems(); 
    updateCartSummary();
} else {
    updateCartSummary();
}

// ----------------------------------------------------
// --- 7. Order Placement Function (ใช้ใน cart.html) ---
// ----------------------------------------------------

window.placeOrder = function() {
    // 1. โหลดตะกร้าจาก Session Storage
    const cartData = sessionStorage.getItem('bangfood_cart');
    const currentCart = cartData ? JSON.parse(cartData) : { items: [], table: null };
    // ... (ส่วนตรวจสอบ DB และ items/tableNumber เดิม) ...

    // 2. เตรียมข้อมูล
    const tableNumber = currentCart.table; 
    const finalTotal = currentCart.items.reduce((sum, item) => sum + (item.finalPrice || 0), 0); 
    const itemsWithStatus = currentCart.items.map(item => ({
        ...item, 
        status: item.status || 'รอดำเนินการ' 
    }));
    
    const orderData = {
        tableNumber: tableNumber,
        items: itemsWithStatus,
        total: finalTotal,
        status: 'รอดำเนินการ', 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    };

    // 3. ยืนยันก่อนส่ง
    if (!confirm(`ยืนยันการสั่งซื้อ โต๊ะ ${tableNumber} ยอดรวม ${finalTotal.toFixed(2)} บาท ใช่หรือไม่?`)) {
        return; 
    }
    
    // 4. ส่งคำสั่งซื้อไปยัง Firebase
    db.ref('orders').push(orderData)
        .then((snapshot) => { // ******* ต้องรับ snapshot ด้วย *******
            const newOrderId = snapshot.key; // ดึง Order ID ที่สร้างใหม่
            console.log("Order placed successfully for table:", tableNumber);
            
            // ***************************************************************
            // 5. จัดการตะกร้า (ลบรายการสินค้า แต่เก็บหมายเลขโต๊ะ และบันทึก Order ID)
            // ***************************************************************
            let cartAfterOrder = {
                table: currentCart.table,   // เก็บหมายเลขโต๊ะไว้
                items: [],                  // ล้างรายการสินค้าออก (เพื่อให้พร้อมสั่ง Order 2)
                orderId: newOrderId         // บันทึก Order ID ล่าสุด
            };
            sessionStorage.setItem('bangfood_cart', JSON.stringify(cartAfterOrder));
            
            // ***************************************************************
            // 6. นำผู้ใช้ไปยังหน้า TRACK.HTML
            // ***************************************************************
            const trackUrl = `track.html?table=${tableNumber}`; 
            alert(`✅ คำสั่งซื้อ โต๊ะ ${tableNumber} ถูกส่งแล้ว! ระบบกำลังนำท่านไปยังหน้าติดตามสถานะ`);
            window.location.href = trackUrl; 
            
        })
        .catch(error => {
            console.error("Error placing order:", error);
            alert("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
        });
};


// ----------------------------------------------------
// --- 8. Tracking Functions (ใช้ใน track.html) ---
// ----------------------------------------------------

window.startTrackingSystem = function() {
    console.log("Tracking system initialized.");
    
    // 1. ดึงหมายเลขโต๊ะจาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');

    if (!tableNumber) {
        // ... (โค้ดจัดการเมื่อไม่พบโต๊ะเดิม) ...
        document.getElementById('tracking-table-header').textContent = "ไม่พบหมายเลขโต๊ะ";
        document.getElementById('status-display').querySelector('.status-text').textContent = "กรุณาเข้าผ่าน QR Code"; 
        document.getElementById('order-details-display').style.display = 'none';
        return;
    }

    document.getElementById('tracking-table-header').textContent = `คำสั่งซื้อ โต๊ะ ${tableNumber}`;
    document.getElementById('status-display').querySelector('.status-text').textContent = "กำลังรอข้อมูลสถานะ...";
    document.getElementById('order-details-display').style.display = 'block';

    // 2. เริ่มติดตามคำสั่งซื้อทั้งหมดของโต๊ะนี้จาก Firebase
    const ordersRef = db.ref('orders')
                         .orderByChild('tableNumber')
                         .equalTo(tableNumber);
    
    ordersRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            
            // 🚨 แก้ไข: เปลี่ยนจากการหา latestOrder เป็นการเก็บ activeOrders
            let activeOrders = []; 
            let hasActiveOrder = false;

            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                order.key = childSnapshot.key;
                
                // เราจะพิจารณา Order ที่สถานะยังไม่เสร็จสิ้น ('รอดำเนินการ', 'กำลังทำ', 'พร้อมเสิร์ฟ')
                // สมมติว่า 'ชำระเงินแล้ว' หรือ 'เสร็จสิ้น' คือสถานะสุดท้าย
                if (order.status !== 'ชำระเงินแล้ว' && order.status !== 'เสร็จสิ้น') { 
                    activeOrders.push(order);
                    hasActiveOrder = true;
                }
            });

            // 3. แสดงรายละเอียดรายการสินค้าและสถานะ
            if (hasActiveOrder) {
                // ส่งรายการ Order ที่ Active ทั้งหมดไปแสดงผลรวมกัน
                displayAllActiveOrders(activeOrders); 
                document.getElementById('no-order-message').style.display = 'none';

            } else {
                // เมื่อทุก Order เสร็จสิ้นแล้ว
                document.getElementById('no-order-message').style.display = 'block';
                document.getElementById('no-order-message').textContent = "คำสั่งซื้อทั้งหมดของโต๊ะนี้ได้ถูกดำเนินการเสร็จสิ้นแล้ว";
                document.getElementById('order-details-display').style.display = 'none';
                document.getElementById('status-display').querySelector('.status-text').textContent = "เสร็จสิ้น";
            }

        } else {
            document.getElementById('no-order-message').style.display = 'block';
            document.getElementById('order-details-display').style.display = 'none';
            document.getElementById('status-display').querySelector('.status-text').textContent = "ไม่พบคำสั่งซื้อสำหรับโต๊ะนี้";
        }
    }, (error) => {
        console.error("Firebase read failed: " + error.code);
        document.getElementById('status-display').querySelector('.status-text').textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
    });
};
// ----------------------------------------------------
// --- 10. Payment Function (ใช้ใน track.html) ---
// ----------------------------------------------------

window.processPayment = async function(orderKeys) {
    if (!confirm("ยืนยันการชำระเงินยอดรวมนี้ใช่หรือไม่? คำสั่งซื้อที่รอดำเนินการทั้งหมดจะถูกทำเครื่องหมายว่าเสร็จสิ้น")) {
        return;
    }
    
    if (typeof db === 'undefined' || !db) {
        console.error("Firebase DB object 'db' is undefined or null.");
        alert("ระบบฐานข้อมูลยังไม่พร้อมใช้งาน");
        return;
    }

    try {
        const updates = {};
        // 1. วนลูปอัปเดตสถานะ Order ทั้งหมดใน Firebase ให้เป็น 'เสร็จสมบูรณ์'
        orderKeys.forEach(key => {
            // 🚨 แก้ไขตรงนี้: เปลี่ยนจาก 'ชำระเงินแล้ว' เป็น 'เสร็จสมบูรณ์'
            updates['/orders/' + key + '/status'] = 'เสร็จสมบูรณ์'; 
        });
        
        // ใช้ db.ref().update เพื่ออัปเดตหลาย Order พร้อมกัน
        await db.ref().update(updates); 
        
        // 2. ล้างสถานะ Order ID และรายการสินค้าจาก Session Storage
        let cart = JSON.parse(sessionStorage.getItem('bangfood_cart')) || { table: null, items: [] };
        
        cart.items = [];     // ลบรายการที่อาจค้างอยู่
        cart.orderId = null; // ลบ Order ID ที่เคยบันทึกไว้
        
        sessionStorage.setItem('bangfood_cart', JSON.stringify(cart));
        
        alert("✅ การชำระเงินเสร็จสิ้น! ขอบคุณที่ใช้บริการ");
        
        // 3. นำผู้ใช้กลับไปหน้าเมนูหลักทันที (เพื่อเริ่ม Order ใหม่รอบถัดไป)
        window.location.href = 'index.html'; 
        
    } catch (error) {
        console.error("Error processing payment:", error);
        alert("เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง");
    }
};
// ฟังก์ชันใหม่: เพื่อรวมรายการสินค้าจากหลาย Order ที่ยัง Active
function displayAllActiveOrders(orders) {
    
    // เรียง Order ตามเวลาที่สั่ง (ล่าสุดอยู่ล่าง)
    orders.sort((a, b) => a.timestamp - b.timestamp);
    
    const itemsListContainer = document.getElementById('items-list-container');
    const totalAmountDisplay = document.getElementById('total-amount-display');
    
    itemsListContainer.innerHTML = '';
    let combinedTotal = 0;
    let overallStatus = 'พร้อมเสิร์ฟ'; // สถานะเริ่มต้นที่สูงที่สุด

    // 1. ดึง Order Keys ทั้งหมดที่ยัง Active
    const orderKeys = orders.map(o => o.key);
    
    // 2. วนลูปแสดงแต่ละ Order
    orders.forEach((order, index) => {
        
        // 2.1 สร้างหัวข้อแบ่งกลุ่ม
        const header = document.createElement('li');
        header.classList.add('order-group-header');
        header.textContent = `--- ชุดคำสั่งซื้อที่ ${index + 1} (สถานะ: ${order.status}) ---`;
        itemsListContainer.appendChild(header);
        
        // 2.2 วนลูปแสดงรายการสินค้าใน Order นั้นๆ
        if (order.items) {
            order.items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add('track-item-row');
                
                const price = item.finalPrice || (item.price * item.quantity);
                combinedTotal += price; // รวมยอดรวมทั้งหมด

                const options = item.options ? `<small class="track-item-option">${item.options}</small>` : '';
                const notes = item.notes ? `<small class="track-item-option item-notes">(โน้ต: ${item.notes})</small>` : '';
                const detailsHtml = options + notes;

                listItem.innerHTML = `
                    <div class="track-item-name-group">
                        <div class="track-item-name">
                            <span class="item-quantity">${item.quantity}x</span>
                            ${item.name} 
                        </div>
                        ${detailsHtml}
                    </div>
                    <span class="track-item-price">${price.toFixed(2)} บาท</span>
                `;
                itemsListContainer.appendChild(listItem);
            });
        }
        
        // 2.3 อัปเดตสถานะรวม
        // หาก Order มีสถานะที่ต่ำกว่า ให้ลดสถานะรวมลง
        if (order.status === 'รอดำเนินการ') overallStatus = 'รอดำเนินการ';
        else if (order.status === 'กำลังทำ' && overallStatus !== 'รอดำเนินการ') overallStatus = 'กำลังทำ';
    });
    
    // 3. แสดงยอดรวมทั้งหมดและสถานะรวม
    totalAmountDisplay.textContent = `${combinedTotal.toFixed(2)} บาท`; 
    updateOverallStatus(overallStatus); // ต้องเรียกใช้ updateOverallStatus ที่เป็นฟังก์ชัน Global

    // ***************************************************************
    // 4. จัดการปุ่มชำระเงิน (ผูก Event Listener กับ Order Keys ทั้งหมด)
    // ***************************************************************
    const payButton = document.getElementById('pay-button'); 
    
    if (payButton) {
        // ดึง Order Keys ทั้งหมดที่ยัง Active
        const orderKeys = orders.map(o => o.key);
        
        // ผูก Event Listener กับปุ่มชำระเงิน โดยส่ง Order Keys ทั้งหมดไป
        payButton.onclick = () => window.processPayment(orderKeys);
        
        // ถ้ามี Order ที่ Active ให้แสดงปุ่ม
        if (orders.length > 0) {
            payButton.style.display = 'block';
        } else {
            payButton.style.display = 'none';
        }
    }
}
// หมายเหตุ: ฟังก์ชัน displayOrderDetails() เดิมจะไม่ถูกใช้แล้ว แต่ตรรกะการวาดรายการถูกนำไปรวมใน displayAllActiveOrders
// อย่างไรก็ตาม ให้คุณคง updateOverallStatus(status) ไว้ตามเดิม

// ฟังก์ชันสำหรับวาดรายการสินค้าและยอดรวม
// ใน script.js (ส่วนที่ 8: Tracking Functions)

function displayOrderDetails(order) {
    const itemsListContainer = document.getElementById('items-list-container');
    const totalAmountDisplay = document.getElementById('total-amount-display');

    if (!itemsListContainer) return;

    itemsListContainer.innerHTML = ''; 
    let total = 0;

    if (order.items) {
        order.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add('track-item-row');
            
            const price = item.finalPrice || (item.price * item.quantity);
            total += price;

            // --- 🚨 ส่วนที่แก้ไข: เพิ่ม detailsHtml เข้ามา ---
            
            // เตรียมตัวเลือกเสริม (options) และโน้ต (notes)
            const options = item.options ? `<small class="track-item-option">${item.options}</small>` : '';
            const notes = item.notes ? `<small class="track-item-option item-notes">(โน้ต: ${item.notes})</small>` : '';
            
            // รวมเป็น Details HTML
            const detailsHtml = options + notes;

            listItem.innerHTML = `
                <div class="track-item-name-group">
                    <div class="track-item-name">
                        <span class="item-quantity">${item.quantity}x</span>
                        ${item.name} 
                       
                    </div>
                    ${detailsHtml}
                </div>
                <span class="track-item-price">${price.toFixed(2)} บาท</span>
            `;
            // --- 🚨 สิ้นสุดส่วนที่แก้ไข ---
            
            itemsListContainer.appendChild(listItem);
        });
    }

    totalAmountDisplay.textContent = `${(order.total || total).toFixed(2)} บาท`; 
}

// ฟังก์ชัน updateOverallStatus() และ startTrackingSystem() อื่น ๆ คงเดิม

// ฟังก์ชันสำหรับอัปเดตข้อความสถานะรวม
function updateOverallStatus(status) {
    const statusBox = document.getElementById('status-display');
    const statusText = statusBox.querySelector('.status-text');

    statusText.textContent = `สถานะ: ${status}`;
    
    // อัปเดตสี (ต้องมี CSS class ใน style.css)
    statusBox.className = 'status-box';
    if (status.includes('รอดำเนินการ')) {
        statusBox.classList.add('status-pending');
    } else if (status.includes('กำลังทำ')) {
        statusBox.classList.add('status-preparing');
    } else if (status.includes('พร้อมเสิร์ฟ') || status.includes('เสร็จสิ้น')) {
        statusBox.classList.add('status-ready');
    } else if (status.includes('ชำระเงินแล้ว')) {
        statusBox.classList.add('status-paid');
    }
}


// ----------------------------------------------------
// --- 9. Menu Category Functions (ใช้ใน menu.html) ---
// ----------------------------------------------------

let allMenuItems = []; // ตัวแปรสำหรับเก็บรายการเมนูทั้งหมดที่โหลดมาจาก Firebase
let currentCategory = 'อาหาร'; // กำหนดหมวดหมู่เริ่มต้น

window.switchCategory = function(category, event) {
    if (event) {
        event.preventDefault(); // ป้องกันการเปลี่ยนหน้าเมื่อกดลิงก์ <a>
    }
    // 1. จัดการ Class 'active' บน Tabs
    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.menu-tab[data-category="${category}"]`).classList.add('active');

    // 2. ซ่อน/แสดง Container เนื้อหาตาม Category
    const foodContainer = document.getElementById('food-container');
    const drinkContainer = document.getElementById('drink-container');
    
    if (!foodContainer || !drinkContainer) {
        console.error("Menu container IDs (food-container or drink-container) not found in HTML.");
        return;
    }
    if (category === 'อาหาร') {
        foodContainer.style.display = 'grid'; 
        drinkContainer.style.display = 'none';
    } else if (category === 'เครื่องดื่ม') {
        foodContainer.style.display = 'none';
        drinkContainer.style.display = 'grid'; 
    }
};

// ฟังก์ชันนี้ไม่สมบูรณ์เพราะไม่มี createItemCardHtml() และ db.ref('menu').on() 
// แต่จะเก็บโครงสร้างไว้ให้เพื่อให้โค้ดไม่พัง
function renderMenuItems(items, filterCategory) {
    const container = document.getElementById('menu-items-container');
    if (!container) return;
    // ... (logic) ...
}

function loadMenuFromFirebase() {
    // ... (logic) ...
    // หากโค้ดนี้ถูกใช้งาน ต้องมั่นใจว่ามีการเรียกใช้
    // db.ref('menu').on('value', (snapshot) => { ... }) ที่ถูกต้อง
}