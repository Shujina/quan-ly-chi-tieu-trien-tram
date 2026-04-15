const balance = document.getElementById('balance');
const list = document.getElementById('list');
const form = document.getElementById('form');
const timeFilter = document.getElementById('timeFilter');
const searchInput = document.getElementById('search');

// Link Google Apps Script đã nhúng
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';

let transactions = [];
let myChart;

// Tự động nhận diện Icon dựa trên từ khóa
const getIcon = (text) => {
    const t = text.toLowerCase();
    if(t.includes('ăn') || t.includes('uống') || t.includes('cafe') || t.includes('phở') || t.includes('cơm')) return '🍔';
    if(t.includes('lương') || t.includes('thưởng') || t.includes('tiền')) return '💰';
    if(t.includes('nhà') || t.includes('điện') || t.includes('nước') || t.includes('phòng')) return '🏠';
    if(t.includes('xe') || t.includes('xăng') || t.includes('grab')) return '🚗';
    if(t.includes('học') || t.includes('sách')) return '📚';
    if(t.includes('mua') || t.includes('shopee') || t.includes('tiki')) return '🛍️';
    return '💸';
};

function toggleForm() { form.classList.toggle('hidden'); }

// 1. TẢI DỮ LIỆU TỪ GOOGLE SHEET (Đồng bộ 2 chiều)
async function loadTransactionsFromSheet() {
    list.innerHTML = '<p style="text-align:center; padding:20px; color:#a3aed0;">🔄 Đang đồng bộ dữ liệu chung...</p>';
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();
        transactions = data; 
        updateUI();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        list.innerHTML = '<p style="color:red; text-align:center; padding:20px;">⚠️ Lỗi kết nối dữ liệu!</p>';
    }
}

// 2. THÊM GIAO DỊCH VÀ ĐẨY LÊN SHEET
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newTransaction = {
        id: Math.floor(Math.random() * 100000000),
        text: document.getElementById('text').value,
        user: document.getElementById('user').value,
        date: document.getElementById('date').value,
        amount: document.getElementById('type').value === 'expense' ? 
                -Math.abs(+document.getElementById('amount').value) : 
                 Math.abs(+document.getElementById('amount').value)
    };