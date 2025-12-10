// --- 1. Global State และ DOM Elements ---
let cart = []; // ตะกร้าสินค้า
let total = 0; // ยอดรวมทั้งหมด

// Elements สำหรับ Floating Cart Summary (ด้านล่าง)
const cartCountElement = document.getElementById('cart-item-count');
const cartTotalElement = document.getElementById('cart-total'); 
const floatingCart = document.querySelector('.floating-cart-summary'); 

// Elements สำหรับ Modal (หน้าจอปรับแต่งรายละเอียดอาหาร)
const itemDetailModal = document.getElementById('item-detail-modal');
const modalNameEl = document.getElementById('modal-item-name');
const modalBasePriceEl = document.getElementById('modal-base-price');
const modalFinalPriceEl = document.getElementById('modal-final-price');
const modalImageEl = document.getElementById('modal-item-image');
const modalForm = document.getElementById('item-customization-form');
const addToCartConfirmBtn = document.getElementById('add-to-cart-confirm-btn');

// ตัวแปรสำหรับเก็บข้อมูลพื้นฐานของสินค้าที่กำลังเปิด Modal
let currentItem = {
    name: '',
    basePrice: 0,
    imageSrc: ''
};

// --- 2. ฟังก์ชันคำนวณและอัปเดตยอดรวม (Update Cart Summary) ---
function updateCartSummary() {
    // 2.1 คำนวณยอดรวมใหม่
    total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((count, item) => count + item.quantity, 0);
    
    // 2.2 อัปเดต Floating Cart Summary (ด้านล่าง)
    if (cartCountElement && cartTotalElement) {
        cartCountElement.textContent = totalItems;
        cartTotalElement.textContent = total.toFixed(2);
    }
    
    // 2.3 ซ่อน/แสดง Floating Cart
    if (floatingCart) {
        if (totalItems > 0) {
            floatingCart.style.display = 'flex';
        } else {
            floatingCart.style.display = 'none';
        }
    }

    // 2.4 อัปเดตหน้าตะกร้า (ถ้าผู้ใช้อยู่ในหน้า cart.html)
    // *หมายเหตุ: ต้องมี renderCartItems() ในไฟล์นี้ด้วย หากต้องการอัปเดตหน้าตะกร้า*
    // renderCartItems(); 
}

// --- 3. ฟังก์ชันเพิ่มสินค้าเข้าตะกร้า (Add Item to Cart) ---
// ฟังก์ชันนี้จะถูกเรียกจากปุ่ม "ยืนยันและเพิ่มลงตะกร้า" ใน Modal
function addItemToCart(itemName, itemPrice) {
    const itemPriceFloat = parseFloat(itemPrice);
    if (isNaN(itemPriceFloat)) return;

    // 3.1 ตรวจสอบว่าสินค้ามีในตะกร้าแล้วหรือยัง (เช็คตามชื่อที่รวม Option แล้ว)
    const existingItem = cart.find(item => item.name === itemName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: itemName,
            price: itemPriceFloat,
            quantity: 1
        });
    }

    console.log(`${itemName} ถูกเพิ่มลงในตะกร้าแล้ว!`);
    updateCartSummary(); // อัปเดตยอดรวม
}


// --- 4. ฟังก์ชันคำนวณราคาสุทธิ (Modal Real-time Calculation) ---
function calculateFinalPrice() {
    let finalPrice = currentItem.basePrice;
    
    // 4.1 คำนวณจากตัวเลือก Radio (ปริมาณ: พิเศษ/ธรรมดา)
    const sizeOption = modalForm.querySelector('input[name="size"]:checked');
    if (sizeOption) {
        const modifier = parseFloat(sizeOption.getAttribute('data-modifier'));
        finalPrice += modifier;
    }
    
    // 4.2 คำนวณจากตัวเลือก Checkbox (ตัวเลือกเสริม)
    const addonOptions = modalForm.querySelectorAll('input[name="addon"]:checked');
    addonOptions.forEach(checkbox => {
        const modifier = parseFloat(checkbox.getAttribute('data-modifier'));
        finalPrice += modifier;
    });

    // อัปเดตราคาที่แสดงบน Modal
    modalFinalPriceEl.textContent = finalPrice.toFixed(2);
    return finalPrice;
}


// --- 5. ฟังก์ชันเปิด Modal ---
// ฟังก์ชันนี้จะถูกเรียกจากปุ่ม "+ เพิ่ม" ในรายการอาหาร
function openModal(itemName, itemPriceStr, itemImageSrc) {
    const itemPrice = parseFloat(itemPriceStr);
    
    // 5.1 ตั้งค่า Global Item
    currentItem.name = itemName;
    currentItem.basePrice = itemPrice;
    currentItem.imageSrc = itemImageSrc;
    
    // 5.2 อัปเดตข้อมูลใน Modal
    modalNameEl.textContent = itemName;
    modalBasePriceEl.textContent = itemPrice.toFixed(2);
    modalImageEl.src = itemImageSrc;
    // *หมายเหตุ: ต้องเพิ่มโค้ดสำหรับ item description ด้วย ถ้ามี*
    
    // 5.3 รีเซ็ตตัวเลือกใน Form เป็นค่าเริ่มต้น
    modalForm.reset();
    
    // 5.4 คำนวณราคาเริ่มต้นและแสดง Modal
    calculateFinalPrice();
    itemDetailModal.style.display = 'block';
}

// --- 6. ฟังก์ชันปิด Modal ---
function closeModal() {
    itemDetailModal.style.display = 'none';
}


// --- 7. Event Listeners ---

// 7.1 Real-time Calculation: เมื่อมีการเปลี่ยนตัวเลือกใดๆ ในฟอร์ม Modal
if (modalForm) {
    modalForm.addEventListener('change', calculateFinalPrice);
}

// 7.2 Confirmation: เมื่อกดปุ่ม "ยืนยันและเพิ่มลงตะกร้า"
if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        // 1. ดึงข้อมูลและคำนวณราคาสุดท้าย
        const finalPrice = calculateFinalPrice(); 
        const notes = document.getElementById('modal-notes').value.trim();
        const sizeOptionEl = modalForm.querySelector('input[name="size"]:checked');
        const sizeOption = sizeOptionEl ? sizeOptionEl.value : 'standard';

        const addons = Array.from(modalForm.querySelectorAll('input[name="addon"]:checked'))
                            .map(cb => cb.value);

        // 2. สร้างชื่อสินค้าที่รวม Option เข้าไปด้วย
        let itemNameWithOption = currentItem.name;
        if (sizeOption === 'special') {
            itemNameWithOption += ' (พิเศษ)';
        }
        if (addons.length > 0) {
            itemNameWithOption += ' + (' + addons.join(', ') + ')';
        }
        if (notes) {
             itemNameWithOption += ` [โน้ต: ${notes}]`;
        }

        // 3. เพิ่มสินค้าลงตะกร้า
        addItemToCart(itemNameWithOption, finalPrice); 

        // 4. ปิด Modal
        closeModal();
    });
}

// 7.3 ปิด Modal เมื่อคลิกนอกพื้นที่ Modal
window.onclick = function(event) {
    if (event.target == itemDetailModal) {
        closeModal();
    }
}

// 7.4 โหลดข้อมูลเมื่อเริ่มต้น (Initialization)
document.addEventListener('DOMContentLoaded', () => {
    // ต้องเรียกฟังก์ชันนี้เพื่อซ่อน Floating Cart เมื่อเริ่มหน้าเว็บ
    updateCartSummary(); 
});

// --- 7.2 Confirmation: เมื่อกดปุ่ม "ยืนยันและเพิ่มลงตะกร้า" (แก้ไขใหม่) ---
if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        
        // 1. ตรวจสอบหมายเลขโต๊ะก่อน
        const tableNumber = document.getElementById('modal-table-number').value;
        if (!tableNumber) {
            alert("กรุณาเลือกหมายเลขโต๊ะที่ต้องการสั่งอาหารก่อน!");
            // หยุดการทำงานถ้ายังไม่ได้เลือกโต๊ะ
            return; 
        }

        // 2. ดึงข้อมูลและคำนวณราคาสุดท้าย
        const finalPrice = calculateFinalPrice(); 
        const notes = document.getElementById('modal-notes').value.trim();
        const sizeOptionEl = modalForm.querySelector('input[name="size"]:checked');
        const sizeOption = sizeOptionEl ? sizeOptionEl.value : 'standard';

        const addons = Array.from(modalForm.querySelectorAll('input[name="addon"]:checked'))
                            .map(cb => cb.value);

        // 3. สร้างชื่อสินค้าที่รวม Option เข้าไปด้วย
        let itemNameWithOption = currentItem.name;
        if (sizeOption === 'special') {
            itemNameWithOption += ' (พิเศษ)';
        }
        if (addons.length > 0) {
            itemNameWithOption += ' + (' + addons.join(', ') + ')';
        }
        if (notes) {
             itemNameWithOption += ` [โน้ต: ${notes}]`;
        }
        
        // 4. เพิ่มข้อมูลโต๊ะลงในตะกร้า (ถ้ายังไม่มี)
        if (!cart.table) {
            cart.table = tableNumber;
        } else if (cart.table !== tableNumber) {
            // ถ้ามีการพยายามสั่งสินค้าโต๊ะอื่น ให้เตือน (โดยทั่วไประบบสั่งต่อครั้งจะเป็นโต๊ะเดียว)
            alert(`คำเตือน: ในตะกร้ามีรายการสำหรับโต๊ะ ${cart.table} อยู่แล้ว รายการนี้จะถูกเพิ่มเข้าไปในโต๊ะเดียวกัน`);
        }

        // 5. เพิ่มสินค้าลงตะกร้า
        addItemToCart(itemNameWithOption, finalPrice); 

        // 6. ปิด Modal
        closeModal();
    });
}