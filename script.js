// 1. KHAI BÁO BIẾN VÀ CẤU HÌNH
const balance = document.getElementById('balance');
const list = document.getElementById('list');
const form = document.getElementById('form');
const timeFilter = document.getElementById('timeFilter');
const searchInput = document.getElementById('search');

// Link Google Apps Script của bạn
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';

let transactions = [];
let myChart;

// 2. HÀM TIỆN ÍCH
function toggleForm() {
    const formElement = document.getElementById('form');
    if (formElement) formElement.classList.toggle('hidden');
}

// Tự động để ngày hôm nay
document.getElementById('date').valueAsDate = new Date();

// Nhận diện Icon thông minh
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

// 3. ĐỒNG BỘ DỮ LIỆU (ĐỌC TỪ SHEET)
async function loadTransactionsFromSheet() {
    list.innerHTML = '<p style="text-align:center; padding:20px; color:#a3aed0;">🔄 Đang tải dữ liệu chung...</p>';
    try {
        // Thêm tham số thời gian để tránh trình duyệt lấy bản cũ (cache)
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);
        const data = await response.json();
        transactions = data; 
        updateUI();
    } catch (error) {
        console.error("Lỗi tải dữ và hiển thị:", error);
        list.innerHTML = '<p style="color:#