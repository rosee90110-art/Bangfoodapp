// ตั้งค่า Firebase (ต้องเป็น Config เดียวกับหน้า Admin)
const firebaseConfig = {
    apiKey: "AIzaSyCYIFwwhW7LeM92FqZykqAsDnte09iU9QQ",
    authDomain: "bangfood-cb30f.firebaseapp.com",
    databaseURL: "https://bangfood-cb30f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bangfood-cb30f",
    storageBucket: "bangfood-cb30f.firebasestorage.app",
    messagingSenderId: "390955623784",
    appId: "1:390955623784:web:aed47e64d2e9dd9e7be2dd"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ดึงข้อมูลมาแสดงผล
db.ref('history').on('value', (snapshot) => {
    const historyList = document.getElementById('history-list');
    const totalBillsEl = document.getElementById('total-bills');
    const totalRevenueEl = document.getElementById('total-revenue');

    let totalRevenue = 0;
    let totalBills = 0;
    let html = '';

    if (!snapshot.exists()) {
        historyList.innerHTML = '<p class="status-msg">ยังไม่มีประวัติการขาย</p>';
        totalBillsEl.textContent = '0';
        totalRevenueEl.textContent = '0.00';
        return;
    }

    snapshot.forEach((child) => {
        const order = child.val();
        totalBills++;
        totalRevenue += parseFloat(order.total || 0);

        // จัดรูปแบบวันเวลา
        const date = new Date(order.archivedAt).toLocaleString('th-TH', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // รายการอาหาร
        const itemsHtml = order.items ? order.items.map(item => 
            `<div style="display:flex; justify-content:space-between; font-size:0.9em; color:#ccc;">
                <span>- ${item.name} (${item.options || 'ธรรมดา'})</span>
                <span>${parseFloat(item.finalPrice).toFixed(2)}</span>
            </div>`
        ).join('') : 'ไม่มีข้อมูลรายการ';

        html = `
            <div class="stat-card" style="text-align: left; margin-bottom: 10px; border-left: 4px solid #4CAF50;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
                    <small style="color: #4CAF50;">${date}</small>
                    <b style="color: #fff;">โต๊ะ: ${order.tableNumber || order.table}</b>
                </div>
                <div style="margin-bottom: 10px; border-top: 1px solid #333; padding-top: 5px;">
                    ${itemsHtml}
                </div>
                <div style="text-align: right; border-top: 1px dashed #444; padding-top: 5px;">
                    <span style="font-size: 0.8em; color: #aaa;">ยอดรวม:</span>
                    <span style="color: #4CAF50; font-weight: bold; margin-left: 10px;">${parseFloat(order.total).toFixed(2)} ฿</span>
                </div>
            </div>
        ` + html; // เรียงจากใหม่ไปเก่า
    });

    historyList.innerHTML = html;
    totalBillsEl.textContent = totalBills;
    totalRevenueEl.textContent = totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 });
});
// ฟังก์ชันค้นหาตามวันที่
function filterHistoryByDate() {
    const searchDate = document.getElementById('search-date').value; // จะได้ค่าเป็น YYYY-MM-DD
    const historyContainer = document.getElementById('history-list-container');
    
    if (!searchDate) {
        alert("กรุณาเลือกวันที่ก่อนกดค้นหา");
        return;
    }

    db.ref('history').once('value', (snapshot) => {
        const historyData = snapshot.val();
        historyContainer.innerHTML = ''; // ล้างรายการเก่า
        
        let totalRevenue = 0;
        let billCount = 0;

        if (historyData) {
            Object.keys(historyData).reverse().forEach(id => {
                const entry = historyData[id];
                // แปลง Timestamp จาก Firebase เป็นวันที่ YYYY-MM-DD
                const entryDateObj = new Date(entry.archivedAt || entry.timestamp);
                const entryDate = entryDateObj.toISOString().split('T')[0];

                if (entryDate === searchDate) {
                    renderHistoryItem(id, entry); // ใช้ฟังก์ชันวาด Card เดิมที่คุณมี
                    totalRevenue += parseFloat(entry.total || 0);
                    billCount++;
                }
            });
        }

        // อัปเดตตัวเลขสรุปบนหน้าจอ
        document.getElementById('total-bills').textContent = billCount;
        document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2);

        if (billCount === 0) {
            historyContainer.innerHTML = `<p style="text-align:center; color:#aaa; margin-top:20px;">❌ ไม่พบข้อมูลการขายของวันที่ ${searchDate}</p>`;
        }
    });
}

// ฟังก์ชันล้างการกรองเพื่อแสดงทั้งหมด
function resetHistoryFilter() {
    document.getElementById('search-date').value = '';
    // เรียกฟังก์ชันโหลดประวัติเริ่มต้นของคุณ (เช่น loadHistory() หรือ loadFullHistory())
    location.reload(); 
}