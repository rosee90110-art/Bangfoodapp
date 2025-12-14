
// File: script.js (ฉบับสมบูรณ์และแก้ไขปัญหา basePrice เป็น 0)

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
    
    // ซ่อน/แสดง Floating Cart (ลบเงื่อนไขการซ่อน/แสดงออกไป)
    const floatingCart = document.querySelector('.floating-cart-summary');
    // **ส่วนนี้ถูกลบออกไป เพื่อให้แถบแสดงผลตลอดเวลา**
    // if (floatingCart) {
    //     floatingCart.style.display = totalItems > 0 ? 'flex' : 'none';
    // }
    
    // **ถ้าต้องการให้แสดงตลอดเวลา แต่ซ่อนปุ่ม "ดูตะกร้า" เมื่อว่างเปล่า**
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
    sessionStorage.removeItem('bangfood_cart');
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
            options: optionString,  // <--- ค่านี้จะถูกบันทึกใน Firebase (เช่น 'S, เพิ่มไข่มุก')
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
    const cartItemsContainer = document.getElementById('cart-items-list');
    const tableInfoEl = document.getElementById('table-display-info');
    const cartTotalDisplay = document.getElementById('final-total-amount'); 
    
    if (!cartItemsContainer || !cartTotalDisplay) return;

    // 1. แสดงหมายเลขโต๊ะ
    if (tableInfoEl) {
        tableInfoEl.textContent = cart.table ? `คำสั่งซื้อสำหรับ โต๊ะ ${cart.table}` : 'ไม่มีรายการในตะกร้า';
    }

    cartItemsContainer.innerHTML = ''; 

    // 2. แสดงรายการสินค้า (พร้อมรูปภาพและชื่อ)
    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message" style="text-align: center;">คุณยังไม่ได้เลือกรายการอาหาร</p>';
    } else {
        cart.items.forEach((item, index) => { 
            const itemElement = document.createElement('div');
            // ใช้คลาส 'cart-item' เพื่อจัดเรียงรูปภาพและรายละเอียด
            itemElement.classList.add('cart-item'); 
            
            // โครงสร้างสำหรับตัวเลือกเสริมและโน้ต
            let detailsHtml = '';
            if (item.options) {
                detailsHtml += `<small class="item-modifiers">${item.options}</small>`;
            }
            if (item.notes) {
                detailsHtml += `<small class="item-modifiers item-notes">(โน้ต: ${item.notes})</small>`;
            }
            // ถ้าไม่มีตัวเลือกเลย ให้แสดงคำว่า 'มาตรฐาน' หรือ 'ไม่มีตัวเลือก'
            if (!detailsHtml) {
                 detailsHtml = '<small class="item-modifiers">ไม่มีตัวเลือกเสริม</small>';
            }


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

    // 3. แสดงยอดรวมที่ต้องชำระ
    const total = cart.items.reduce((sum, item) => sum + item.finalPrice, 0);
    cartTotalDisplay.textContent = total.toFixed(2);
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

// ในไฟล์ script.js: เพิ่ม/แก้ไขฟังก์ชัน placeOrder()

// ในไฟล์ script.js: เพิ่มฟังก์ชัน placeOrder() นี้
// ในไฟล์ script.js: เพิ่มฟังก์ชัน placeOrder() ที่ถูกต้อง (ใช้ Session Storage)

// ใน script.js: ฟังก์ชัน placeOrder() ฉบับแก้ไขสุดท้าย

window.placeOrder = function() {
    // 1. โหลดตะกร้าจาก Session Storage อีกครั้ง
    const cartData = sessionStorage.getItem('bangfood_cart');
    const currentCart = cartData ? JSON.parse(cartData) : { items: [], table: null };

    // 0. ตรวจสอบความพร้อมของฐานข้อมูล (สำคัญ)
    if (typeof db === 'undefined' || !db) {
        console.error("Firebase DB object 'db' is undefined or null. Cannot place order.");
        alert("ระบบฐานข้อมูลยังไม่พร้อมใช้งาน");
        return;
    }

    // 2. ตรวจสอบรายการสินค้าในตะกร้า
    if (currentCart.items.length === 0) {
        alert("ไม่พบรายการในตะกร้าสินค้า กรุณาเพิ่มรายการอาหารก่อน!");
        window.location.href='index.html';
        return;
    }
    
    // 3. เตรียมข้อมูล
    // *** สำคัญ: ตรวจสอบให้แน่ใจว่า currentCart.table มีค่า (มาจาก modal) ***
    const tableNumber = currentCart.table || 'N/A'; 
    const finalTotal = currentCart.items.reduce((sum, item) => sum + (item.finalPrice || 0), 0); 

    const itemsWithStatus = currentCart.items.map(item => ({
        ...item, 
        status: item.status || 'รอดำเนินการ' 
    }));

    const orderData = {
        // *** Field ที่ต้องส่งไป: tableNumber ***
        tableNumber: tableNumber, 
        items: itemsWithStatus,
        total: finalTotal,
        status: 'รอดำเนินการ', 
        timestamp: new Date().toISOString()
    };

    // ... (โค้ดยืนยันการสั่งซื้อ) ...

    if (confirm(`ยืนยันการสั่งซื้อ โต๊ะ ${orderData.tableNumber} ยอดรวม ${orderData.total.toFixed(2)} บาท ใช่หรือไม่?`)) {
        db.ref('orders').push(orderData)
            .then(() => {
                alert(`ทำการสั่งซื้อเสร็จสมบูรณ์แล้ว! (หมายเลขโต๊ะ: ${orderData.tableNumber})`);
                
                // ล้าง Session Storage และ redirect
                if (typeof clearCart === 'function') {
                    clearCart(); 
                }
                
                // 6. Redirect ไปหน้าติดตามสถานะ
                window.location.href = `track.html?table=${orderData.tableNumber}`; 
            })
            .catch((error) => {
                console.error("Error submitting order to Firebase:", error);
                alert("เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ กรุณาตรวจสอบ Console");
            });
    }
};


    
// ในไฟล์ script.js: ฟังก์ชันเริ่มต้นติดตาม
window.startTrackingSystem = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');

    const trackingHeader = document.getElementById('tracking-table-header');
    
    if (typeof db === 'undefined') {
        trackingHeader.textContent = 'ข้อผิดพลาด: ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
        console.error("Firebase DB is not initialized.");
        return;
    }
    
    if (tableNumber) {
        trackingHeader.textContent = `กำลังติดตามสถานะ: โต๊ะ ${tableNumber}`; 
        document.getElementById('no-order-message').style.display = 'none'; 
        
        trackOrderRealtime(tableNumber); // เริ่มติดตามแบบ Real-time
        
    } else {
        trackingHeader.textContent = 'ไม่พบหมายเลขโต๊ะ';
        document.getElementById('no-order-message').style.display = 'block';
    }
}
// ในไฟล์ script.js: ฟังก์ชันค้นหาและติดตามออเดอร์
// ใน script.js: ฟังก์ชัน trackOrderRealtime(tableNumber)
// ใน script.js: ฟังก์ชัน trackOrderRealtime(tableNumber)
function trackOrderRealtime(tableNumber) {
    const ordersRef = db.ref('orders');
    
    ordersRef.once('value', (snapshot) => { 
        let activeOrderKey = null; 
        let initialOrderData = null;
        let found = false;

        snapshot.forEach(childSnapshot => {
            const order = childSnapshot.val();
            
            // *** สำคัญ: เปรียบเทียบ tableNumber ที่เราส่งไปกับ tableNumber ใน Firebase ***
            const orderTable = order.tableNumber; 
            const status = order.status || 'รอดำเนินการ'; 
            
            if (orderTable === tableNumber && (status === 'รอดำเนินการ' || status === 'กำลังทำ')) {
                activeOrderKey = childSnapshot.key;
                initialOrderData = order;
                found = true;
                return true; // พบแล้วหยุดวนซ้ำ
            }
        });

        if (found) {
            document.getElementById('tracking-table-header').textContent = `โต๊ะ ${tableNumber}`;
            document.getElementById('order-details-display').style.display = 'block';
            document.getElementById('no-order-message').style.display = 'none';

            // *** ตั้ง Listener Real-time บนออเดอร์ที่พบ ***
            db.ref('orders/' + activeOrderKey).on('value', (orderSnapshot) => {
                const updatedOrder = orderSnapshot.val();
                if (updatedOrder) {
                    updateCustomerStatusUI(updatedOrder.status, updatedOrder.items, updatedOrder.total);
                }
            });
            
        } else {
            // ไม่พบออเดอร์ที่กำลังดำเนินการ
            document.getElementById('tracking-table-header').textContent = `ไม่พบคำสั่งซื้อที่กำลังดำเนินการสำหรับ โต๊ะ ${tableNumber}`;
            document.getElementById('order-details-display').style.display = 'none';
            document.getElementById('no-order-message').style.display = 'block'; 
        }
    });
}
// ในไฟล์ script.js: ฟังก์ชันแสดงผลบนหน้า track.html
function updateCustomerStatusUI(status, items, total)  {
    const statusDisplay = document.getElementById('status-display');
    const itemsListContainer = document.getElementById('items-list-container');
    const totalDisplay = document.getElementById('total-amount-display');

    let displayMessage = '';
    let statusColorClass = '';
    
    // 1. กำหนดสถานะ
    switch (status) {
        case 'รอดำเนินการ':
            displayMessage = '🕒 คำสั่งซื้อถูกรับแล้ว รอการเตรียมอาหาร';
            statusColorClass = 'status-pending';
            break;
        case 'กำลังทำ':
            displayMessage = '👨‍🍳 กำลังเตรียมอาหารของคุณอย่างตั้งใจ';
            statusColorClass = 'status-processing';
            break;
        case 'เสร็จสมบูรณ์':
            displayMessage = '✅ อาหารเสร็จแล้ว พร้อมเสิร์ฟ!';
            statusColorClass = 'status-completed';
            break;
        default:
            displayMessage = 'สถานะไม่ทราบ';
            statusColorClass = 'status-info';
    }

    statusDisplay.innerHTML = `
        <h2 class="${statusColorClass}">สถานะล่าสุด:</h2>
        <p class="status-text ${statusColorClass}">${displayMessage}</p>
    `;
    
    // 2. แสดงรายการสินค้าและยอดรวม (ใช้ Field ที่ถูกต้อง)
    let itemsHtml = '';
    if (items && Array.isArray(items)) {
        items.forEach(item => {
            // *** แก้ไข: ใช้ Field ที่ถูกต้องคือ finalPrice และ quantity ***
            const quantity = item.quantity || 1;
            const finalPrice = parseFloat(item.finalPrice || 0); 
            const displayOptions = (item.options || 'S').replace('S', 'ธรรมดา');
            const itemNote = item.notes ? `<small class="track-item-option"> (โน้ต: ${item.notes})</small>` : '';

            itemsHtml += `
                <li class="track-item-card"> 
                    <div class="track-item-row">
                        <div class="track-item-info">
                            <span class="track-item-name">${quantity}x ${item.name}</span>
                            <small class="track-item-option">${displayOptions}${itemNote}</small>
                        </div>
                        <span class="track-item-price">${finalPrice.toFixed(2)} บาท</span>
                    </div>
                </li>
            `;
        });
    } else {
         itemsHtml = '<li>ไม่พบรายละเอียดรายการอาหาร</li>';
    }
    
    itemsListContainer.innerHTML = itemsHtml;
    totalDisplay.textContent = `${parseFloat(total || 0).toFixed(2)} บาท`; 
}