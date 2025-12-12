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
    //     floatingCart.style.display = totalItems > 0 ? 'flex' : 'none';
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
if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        const tableNumber = document.getElementById('modal-table-number').value;
        
        if (!tableNumber) {
            alert("กรุณาเลือกหมายเลขโต๊ะที่ต้องการสั่งอาหารก่อน!");
            return; 
        }

        const finalPrice = calculateFinalPrice(); 
        const notes = document.getElementById('modal-notes').value.trim();
        const sizeOptionEl = document.querySelector('#item-customization-form input[name="size"]:checked');
        const sizeOptionValue = sizeOptionEl ? sizeOptionEl.value : 'standard';

        const addons = Array.from(document.querySelectorAll('#item-customization-form input[name="addon"]:checked'))
                             .map(cb => cb.value);

        // สร้างชื่อสินค้าที่มีรายละเอียดตัวเลือก
        let itemNameWithOption = currentItem.name;
        // รวมตัวเลือกทั้งหมดในสตริงเดียว
        let optionString = '';

        if (sizeOptionValue === 'special') {
            optionString += 'พิเศษ';
        } else {
            optionString += 'ธรรมดา';
        }
        
        if (addons.length > 0) {
            optionString += ', ' + addons.join(', ');
        }
        
        // แสดงรายละเอียดทั้งหมดรวมกัน
        if (optionString) {
            itemNameWithOption += ` (${optionString})`;
        }


        // ตั้งค่าหมายเลขโต๊ะ (ถ้ายังไม่เคยตั้ง)
        if (!cart.table) {
            cart.table = tableNumber;
        } 
        
        // เพิ่มสินค้าลงตะกร้า (ส่ง notes ไปด้วยเพื่อให้แสดงใน cart.html ได้ง่าย)
        // ... โค้ดส่วนบนของฟังก์ชัน ...
// เพิ่มสินค้าลงตะกร้า
        cart.items.push({
            name: currentItem.name, // ชื่อหลัก
            options: optionString, // ตัวเลือกที่เลือก (สำหรับแสดงในรายละเอียด)
            notes: notes, // หมายเหตุ
            finalPrice: finalPrice,
            quantity: 1,
            // *** สำคัญ: ต้องมีบรรทัดนี้ ***
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

function placeOrder() {
    // ตรวจสอบว่ามีรายการในตะกร้าหรือไม่
    if (cart.items.length === 0) {
        alert("ไม่พบรายการในตะกร้าสินค้า กรุณาเพิ่มรายการอาหารก่อน!");
        window.location.href='index.html';
        return;
    }

    // ดึงข้อมูลคำสั่งซื้อและยอดรวม
    const finalTotal = parseFloat(document.getElementById('final-total-amount').textContent);

    const orderData = {
        table: cart.table,
        items: cart.items,
        total: finalTotal,
        timestamp: new Date().toLocaleString('th-TH'), 
        status: 'รอดำเนินการ' // สถานะเริ่มต้น
    };

    // ยืนยันคำสั่งซื้อกับผู้ใช้
    const confirmation = confirm(`ยืนยันการสั่งซื้อ โต๊ะ ${orderData.table} ยอดรวม ${orderData.total.toFixed(2)} บาท ใช่หรือไม่?`);

    if (confirmation) {

        // 1. ส่งข้อมูลไปยัง Firebase Realtime Database
        // db คือตัวแปรที่ถูกกำหนดไว้ใน cart.html แล้ว
        db.ref('orders').push(orderData) // ส่งข้อมูลไปที่โหนด 'orders'
            .then(() => {
                // 2. เมื่อส่งสำเร็จ: แจ้งเตือน ล้างตะกร้า และเปลี่ยนหน้า
                alert(`ทำการสั่งซื้อเสร็จสมบูรณ์แล้ว! (หมายเลขโต๊ะ: ${orderData.table} ยอดชำระ: ${orderData.total.toFixed(2)} บาท)\nระบบจะดำเนินการตามคำสั่งซื้อของท่าน`);

                clearCart(); // ล้างข้อมูลใน Session Storage
                window.location.href='index.html'; 
            })
            .catch((error) => {
                console.error("Error submitting order to Firebase:", error);
                alert("เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
            });
    }
}