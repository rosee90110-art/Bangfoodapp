// ใช้ชื่อกุญแจที่แยกตามโต๊ะ
tableNo = localStorage.getItem('selectedTable') || '1';
cartKey = 'bangfood_cart_table_' + tableNo;
cart = JSON.parse(sessionStorage.getItem(cartKey)) || { items: [] };
// ==========================================
// 1. CONFIG & GLOBAL VARIABLES (ประกาศครั้งเดียว)
// ==========================================
const urlParams = new URLSearchParams(window.location.search);

// ฟังก์ชันหาชื่อถุงตามเลขโต๊ะ (หัวใจของการแยกโต๊ะ)
function getCartKey() {
    const tableNo = urlParams.get('table') || localStorage.getItem('selectedTable') || '1';
    localStorage.setItem('selectedTable', tableNo); // จำลงเครื่องไว้ด้วย
    return 'bangfood_cart_table_' + tableNo;
}

// ประกาศตัวแปรตะกร้า โดยดึงจากถุงที่ถูกต้อง
let cart = JSON.parse(sessionStorage.getItem(getCartKey())) || { items: [], table: null };

// ตัวแปรสำหรับ Modal
let currentItem = {
    name: '',
    basePrice: 0,
    imageSrc: '',
};

// DOM Elements
cartCountElement = document.getElementById('cart-item-count');
cartTotalElement = document.getElementById('cart-total');
const addToCartConfirmBtn = document.getElementById('add-to-cart-confirm-btn');

// ==========================================
// 2. CART FUNCTIONS (จัดการตะกร้า)
// ==========================================

function saveCart() {
    sessionStorage.setItem(getCartKey(), JSON.stringify(cart));
    updateCartSummary();
}

function updateCartSummary() {
    const totalItems = cart.items.length;
    const totalPrice = cart.items.reduce((sum, item) => sum + (parseFloat(item.finalPrice) || 0), 0);

    if (cartCountElement && cartTotalElement) {
        cartCountElement.textContent = totalItems;
        cartTotalElement.textContent = totalPrice.toFixed(2);
    }
    
    const floatingCart = document.querySelector('.floating-cart-summary');
    if (floatingCart) {
        floatingCart.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ==========================================
// 3. MENU & MODAL FUNCTIONS
// ==========================================

function calculateFinalPrice() {
    let finalPrice = parseFloat(document.getElementById('modal-base-price').textContent) || 0;
    
    // คำนวณจาก Radio และ Checkbox
    const options = document.querySelectorAll('#item-customization-form input:checked');
    options.forEach(opt => {
        const modifier = parseFloat(opt.getAttribute('data-modifier')) || 0;
        finalPrice += modifier;
    });

    const modalFinalPriceEl = document.getElementById('modal-final-price');
    if (modalFinalPriceEl) {
        modalFinalPriceEl.textContent = finalPrice.toFixed(2);
    }
    return finalPrice;
}

// ปุ่มกดยืนยันเพิ่มลงตะกร้า
if (addToCartConfirmBtn) {
    addToCartConfirmBtn.addEventListener('click', () => {
        const tableNumber = localStorage.getItem('selectedTable') || '1';
        
        // ดึงตัวเลือกที่ติ๊กไว้
        const selectedOptions = [];
        const checkedInputs = document.querySelectorAll('#item-customization-form input:checked');
        checkedInputs.forEach(input => {
            selectedOptions.push(input.parentElement.textContent.trim());
        });

        cart.items.push({
            name: document.getElementById('modal-item-name').textContent,
            finalPrice: calculateFinalPrice(),
            options: selectedOptions.join(', '),
            quantity: 1
        });

        saveCart();
        window.location.href = `cart.html?table=${tableNumber}`;
    });
}

// ==========================================
// 4. FIREBASE & MENU LOADING
// ==========================================

function loadMenuFromFirebase() {
    if (typeof db === 'undefined') return;
    const productsRef = db.ref('products'); 
    
    productsRef.on('value', (snapshot) => {
        const products = snapshot.val();
        const containers = ['food-container', 'noodle-container', 'drink-container'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        if (!products) return;

        for (let id in products) {
            const p = products[id];
            const isOut = p.status === 'out_of_stock';
            const tableNo = localStorage.getItem('selectedTable') || '1';

            const productHTML = `
                <div class="menu-item ${isOut ? 'item-disabled' : ''}" style="${isOut ? 'opacity: 0.6;' : ''}">
                    <img src="${p.img}" alt="${p.name}" class="item-image">
                    <div class="item-details">
                        <h3 class="item-name">${p.name} ${isOut ? '<span style="color:red;">(หมด)</span>' : ''}</h3>
                        <div class="item-price"><span>${p.price}</span> บาท</div>
                    </div>
                    ${isOut 
                        ? `<button class="add-to-cart-btn" disabled>หมด</button>` 
                        : `<a href="${p.category === 'เครื่องดื่ม' ? 'drink.html' : 'menu.html'}?name=${encodeURIComponent(p.name)}&price=${p.price}&img=${p.img}&table=${tableNo}" class="add-to-cart-btn"> + เพิ่ม </a>`
                    }
                </div>`;

            let containerId = p.category === 'อาหาร' ? 'food-container' : 
                              p.category === 'ก๋วยเตี๋ยว' ? 'noodle-container' : 'drink-container';
            const container = document.getElementById(containerId);
            if (container) container.innerHTML += productHTML;
        }
    });
}

// ==========================================
// 5. INITIALIZE (ทำงานตอนโหลดหน้า)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMenuFromFirebase();
    updateCartSummary();

    // แสดงเลขโต๊ะที่แถบสถานะ
    const tableDisplay = document.getElementById('table-status-bar');
    const tableNo = localStorage.getItem('selectedTable');
    if (tableDisplay && tableNo) {
        tableDisplay.innerText = "📍 กำลังสั่งอาหารจาก: โต๊ะ " + tableNo;
    }
});

// ฟังก์ชันสลับหมวดหมู่
window.switchCategory = function(category) {
    const containers = { 'อาหาร': 'food-container', 'ก๋วยเตี๋ยว': 'noodle-container', 'เครื่องดื่ม': 'drink-container' };
    Object.values(containers).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const activeEl = document.getElementById(containers[category]);
    if (activeEl) activeEl.style.display = 'grid';
    
    document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.querySelector(`.menu-tab[data-category="${category}"]`);
    if (targetTab) targetTab.classList.add('active');
};
