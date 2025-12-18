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
// ฟังก์ชันสำหรับลบรายการสินค้าในตะกร้า
// ฟังก์ชันสำหรับลบรายการสินค้าในตะกร้า (ฉบับแก้ไขให้ล้างเลขโต๊ะ)
window.removeItem = function(index) {
    const cartData = sessionStorage.getItem('bangfood_cart');
    
    if (cartData) {
        let currentCart = JSON.parse(cartData);
        
        // ลบเฉพาะรายการที่เลือก
        currentCart.items.splice(index, 1); 

        // บันทึกกลับลง Session โดยที่ table ยังคงเดิม
        sessionStorage.setItem('bangfood_cart', JSON.stringify(currentCart));
        
        // ✅ สำคัญ: อัปเดต Global Variable 'cart' ด้วย เพื่อให้ Floating Summary (แถบด้านล่าง) อัปเดตตามทันที
        cart = currentCart; 
        
        // วาดหน้าจอใหม่ และอัปเดตแถบสรุปด้านล่าง
        renderCartItems(); 
        updateCartSummary(); 
    }
};
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
    const cart = cartData ? JSON.parse(cartData) : { items: [], table: null, orderId: null }; 

    const cartItemsContainer = document.getElementById('cart-items-list');
    const tableInfoEl = document.getElementById('table-display-info');
    const cartTotalDisplay = document.getElementById('final-total-amount'); 
    
    const actionArea = document.getElementById('order-action-area');
    const checkoutBtn = document.getElementById('checkout-btn');
    const confirmationMessage = document.getElementById('order-confirmed-message');

    if (!cartItemsContainer || !cartTotalDisplay || !actionArea || !checkoutBtn || !confirmationMessage) return;

    // ✅ 1. แก้ไขส่วนแสดงหมายเลขโต๊ะ: ซ่อนเลขโต๊ะเมื่อไม่มีสินค้าในตะกร้า
    if (tableInfoEl) {
        if (cart.items.length > 0 && cart.table) {
            tableInfoEl.textContent = `คำสั่งซื้อสำหรับ โต๊ะ ${cart.table}`;
        } else {
            // เมื่อตะกร้าว่าง ให้ล้างข้อความทิ้ง หรือใช้คำว่า "ไม่มีรายการ"
            tableInfoEl.textContent = 'ไม่มีรายการในตะกร้า'; 
        }
    }

    cartItemsContainer.innerHTML = ''; 
    
    // 2. แสดงรายการสินค้า
    if (cart.items.length === 0) {
        if (cart.orderId) {
             cartItemsContainer.innerHTML = `<p class="empty-cart-message" style="text-align: center;">คุณได้สั่งซื้อชุดล่าสุดไปแล้ว</p>`;
        } else {
             cartItemsContainer.innerHTML = '<p class="empty-cart-message" style="text-align: center;">คุณยังไม่ได้เลือกรายการอาหาร</p>';
        }
    } else {
        cart.items.forEach((item, index) => { 
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item'); 
            
            let detailsHtml = '';
            if (item.options) detailsHtml += `<small class="item-modifiers">${item.options}</small>`;
            if (item.notes) detailsHtml += `<small class="item-modifiers item-notes">(โน้ต: ${item.notes})</small>`;
            if (!detailsHtml) detailsHtml = '<small class="item-modifiers">ไม่มีตัวเลือกเสริม</small>';
            
            itemElement.innerHTML = `
                <img src="${item.imgUrl || 'placeholder.png'}" alt="${item.name || 'รายการสินค้า'}" class="cart-item-image">
                <div class="item-details-cart">
                    <p class="item-name-cart">${item.name || 'รายการที่ไม่ได้ระบุชื่อ'}</p> 
                    ${detailsHtml}
                </div>
                <div class="item-quantity-control">
                    <span class="item-price-total">${item.finalPrice.toFixed(2)} บาท</span>
                    <button class="remove-btn" onclick="removeItem(${index})">ลบ</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    // 3. แสดงยอดรวม
    const total = cart.items.reduce((sum, item) => sum + (item.finalPrice || 0), 0);
    cartTotalDisplay.textContent = total.toFixed(2);
    
    // 4. จัดการสถานะปุ่ม (เหมือนเดิม)
    const trackBtnClass = 'track-status-btn';
    let trackBtn = document.querySelector(`.${trackBtnClass}`);
    
    if (cart.items.length > 0) {
        checkoutBtn.style.display = 'block';
        confirmationMessage.style.display = 'none';
        if (trackBtn) trackBtn.style.display = 'none';
    } 
    else if (cart.orderId && cart.table) {
        checkoutBtn.style.display = 'none';
        confirmationMessage.textContent = `✅ คำสั่งซื้อล่าสุดถูกส่งแล้ว! (โต๊ะ ${cart.table})`;
        confirmationMessage.style.display = 'block';

        if (!trackBtn) {
            trackBtn = document.createElement('a');
            trackBtn.className = `checkout-btn-large ${trackBtnClass}`;
            trackBtn.textContent = 'ตรวจสอบสถานะคำสั่งซื้อ';
            trackBtn.style.marginTop = '15px';
            actionArea.appendChild(trackBtn);
        }
        trackBtn.href = `track.html?table=${cart.table}`;
        trackBtn.style.display = 'block';
    } 
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

// ----------------------------------------------------
// --- 7. Order Placement Function (ฉบับแก้ไข: ป้องกันข้อมูล N/A) ---
// ----------------------------------------------------

window.placeOrder = function() {
    const cartData = sessionStorage.getItem('bangfood_cart');
    const currentCart = cartData ? JSON.parse(cartData) : { items: [], table: null };

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

    if (!confirm(`ยืนยันการสั่งซื้อ โต๊ะ ${tableNumber} ยอดรวม ${finalTotal.toFixed(2)} บาท ใช่หรือไม่?`)) {
        return; 
    }
    
    db.ref('orders').push(orderData)
        .then((snapshot) => {
            const newOrderId = snapshot.key;
            
            // ✅ 1. ล็อกเลขโต๊ะนี้ไว้ในความจำแยก (สำหรับหน้า Track โดยเฉพาะ)
            // เพื่อให้หน้า Track ดึงค่านี้ไปใช้เสมอ ไม่ว่าตะกร้าจะเปลี่ยนเป็นโต๊ะไหนก็ตาม
            localStorage.setItem('confirmed_table_for_track', tableNumber); 
            
            // ✅ 2. เก็บไว้ใน last_table_number ตามเดิมของคุณ
            localStorage.setItem('last_table_number', tableNumber); 
            
            // 3. เคลียร์รายการในตะกร้า (แต่ยังเก็บเลขโต๊ะในตะกร้าไว้เผื่อเขาสั่งเพิ่มโต๊ะเดิม)
            let cartAfterOrder = {
                table: currentCart.table,
                items: [],
                orderId: newOrderId 
            };
            sessionStorage.setItem('bangfood_cart', JSON.stringify(cartAfterOrder));
            
            // 4. ไปหน้าติดตามสถานะ โดยส่งเลขโต๊ะที่เพิ่งสั่งไป
            window.location.href = `track.html?table=${tableNumber}`; 
        })
        .catch(error => {
            console.error("Error placing order:", error);
            alert("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
        });
};  

// ----------------------------------------------------
// --- 8. Status Tracking Function (ใช้ใน track.html) ---
// ----------------------------------------------------

window.startTrackingSystem = function() {
    console.log("Tracking system initialized.");
    
    // 1. ดึงค่าจากแหล่งต่างๆ
    const urlParams = new URLSearchParams(window.location.search);
    let tableFromUrl = urlParams.get('table');
    let confirmedTable = localStorage.getItem('confirmed_table_for_track'); // โต๊ะที่สั่งจริง
    let lastTable = localStorage.getItem('last_table_number');

    // ✅ หัวใจสำคัญ: ลำดับการเลือกเลขโต๊ะใหม่
    // เราจะเชื่อ "โต๊ะที่สั่งสำเร็จแล้ว" (confirmedTable) มากกว่า URL หรือ Session
    let tableNumber;
    
    if (confirmedTable && confirmedTable !== 'null') {
        tableNumber = confirmedTable; // ถ้าเคยสั่งออเดอร์แล้ว ให้ล็อกโต๊ะนี้ไว้เลย
    } else if (tableFromUrl && tableFromUrl !== 'N/A') {
        tableNumber = tableFromUrl; // ถ้ายังไม่เคยสั่ง ให้ดูตาม URL
    } else {
        tableNumber = lastTable; // สุดท้ายค่อยดูจากประวัติล่าสุด
    }

    if (!tableNumber || tableNumber === 'null') {
        document.getElementById('tracking-table-header').textContent = "ไม่พบหมายเลขโต๊ะ";
        return;
    }

    // แก้ไข URL บนแถบ Address ให้ล็อกตามเลขโต๊ะที่สั่งจริง
    if (window.location.search.includes('table=N/A') || !window.location.search.includes('table=')) {
        window.history.replaceState(null, '', `?table=${tableNumber}`);
    }

    // แสดงผลหัวข้อ (ตอนนี้มันจะไม่เปลี่ยนตามหน้า cart แล้ว)
    document.getElementById('tracking-table-header').textContent = `คำสั่งซื้อ โต๊ะ ${tableNumber}`;

    // 2. ดึงข้อมูลจาก Firebase (ใช้ tableNumber ที่ล็อกไว้)
    const ordersRef = db.ref('orders').orderByChild('tableNumber').equalTo(tableNumber);
    
    ordersRef.on('value', (snapshot) => {
        const itemsContainer = document.getElementById('items-list-container');
        const statusDisplay = document.getElementById('status-display');
        const statusText = statusDisplay.querySelector('.status-text');

        if (snapshot.exists()) {
            let activeOrders = []; 
            let hasActiveOrder = false;

            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                order.key = childSnapshot.key;
                
                // ติดตามเฉพาะออเดอร์ที่ยังไม่จ่ายเงิน
                if (order.status !== 'ชำระเงินแล้ว') { 
                    activeOrders.push(order);
                    hasActiveOrder = true;
                }
            });

            if (hasActiveOrder) {
                if (typeof displayAllActiveOrders === 'function') {
                    displayAllActiveOrders(activeOrders);
                }
                document.getElementById('no-order-message').style.display = 'none';
                document.getElementById('order-details-display').style.display = 'block';
            } else {
                // ✅ เมื่อจ่ายเงินแล้ว ล้างหน้าจอและ "ปลดล็อก" โต๊ะ
                if (itemsContainer) itemsContainer.innerHTML = '';
                document.getElementById('no-order-message').style.display = 'block';
                statusText.textContent = "ชำระเงินเรียบร้อยแล้ว";
                document.getElementById('order-details-display').style.display = 'none';
                
                // สำคัญ: ล้างค่าเมื่อจบการสั่งซื้อ เพื่อให้สั่งโต๊ะอื่นได้ในครั้งหน้า
                localStorage.removeItem('confirmed_table_for_track');
            }
        }
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
// ฟังก์ชันสำหรับจัดการการชำระเงินและย้ายข้อมูลไปหน้าประวัติ
// ฟังก์ชัน handlePayment ใน track.html (ส่วนที่ปรับปรุงการเรียกจบงาน)
function handlePayment() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNo = urlParams.get('table');

    if (!tableNo) return;

    if (confirm(`ยืนยันการชำระเงินโต๊ะ ${tableNo}?\n(รายการในหน้าแอดมินจะไม่หายไป แต่จะเปลี่ยนสถานะเป็น 'ชำระเงินแล้ว')`)) {
        const ordersRef = db.ref('orders');
        const historyRef = db.ref('history');

        ordersRef.orderByChild('tableNumber').equalTo(tableNo).once('value', (snapshot) => {
            if (snapshot.exists()) {
                let promises = [];
                let foundItems = false;

                snapshot.forEach((child) => {
                    const data = child.val();
                    // ตรวจสอบสถานะก่อนย้าย (หรือจะเอาเงื่อนไข if ออกถ้าต้องการจ่ายทุกรายการ)
                    if (data.status === 'เสร็จสมบูรณ์' || data.status === 'พร้อมเสิร์ฟ' || data.status === 'กำลังทำ') {
                        foundItems = true;
                        
                        // 1. ส่งสำเนาไปที่ history
                        const historyData = {
                            ...data,
                            status: 'ชำระเงินแล้ว',
                            paidAt: firebase.database.ServerValue.TIMESTAMP 
                        };
                        promises.push(historyRef.push(historyData));

                        // 2. อัปเดตสถานะในหน้า Admin (ใช้ .update แทน .remove)
                        // แก้ตรงนี้: ข้อมูลใน Node 'orders' จะไม่ถูกลบ แต่จะเปลี่ยนคำว่า status
                        promises.push(child.ref.update({
                            status: 'ชำระเงินแล้ว'
                        }));
                    }
                });

                if (foundItems) {
                    Promise.all(promises).then(() => {
                        alert("✅ ชำระเงินสำเร็จ!\nรายการในหน้าแอดมินเปลี่ยนเป็น 'ชำระเงินแล้ว' และบันทึกประวัติแล้ว");
                        window.location.reload(); 
                    }).catch((error) => {
                        console.error("Error:", error);
                        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                    });
                } else {
                    alert("ไม่มีรายการที่พร้อมชำระเงิน");
                }
            } else {
                alert("ไม่พบข้อมูลการสั่งซื้อของโต๊ะนี้");
            }
        });
    }
}
// ----------------------------------------------------
// --- 9. ฟังก์ชันชำระเงิน (อัปเดตสถานะและเคลียร์รายการ) ---
// ----------------------------------------------------

