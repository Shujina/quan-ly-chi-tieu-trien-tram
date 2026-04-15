const balance = document.getElementById('balance');
const list = document.getElementById('list');
const form = document.getElementById('form');
const timeFilter = document.getElementById('timeFilter');
const searchInput = document.getElementById('search');

// URL Google Apps Script của bạn
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIVBwynsx0a5RBkCbOgO9RJld861SvRjKB6no7gu7B9ESa7-ZNJdVtSewAJvDOiJHv/exec';

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart;

// Thiết lập ngày mặc định là hôm nay
document.getElementById('date').valueAsDate = new Date();

// --- CHỨC NĂNG CHÍNH ---

async function addTransaction(e) {
    e.preventDefault();
    
    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        text: document.getElementById('text').value,
        user: document.getElementById('user').value,
        date: document.getElementById('date').value,
        amount: document.getElementById('type').value === 'expense' ? 
                -Math.abs(+document.getElementById('amount').value) : 
                 Math.abs(+document.getElementById('amount').value)
    };

    // 1. Lưu vào bộ nhớ trình duyệt
    transactions.push(transaction);
    updateLocalStorage();
    updateUI();

    // 2. Đồng bộ lên Google Sheet (Chạy ngầm)
    syncToGoogleSheet(transaction);

    // 3. Reset form
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
}

// Hàm gửi dữ liệu lên Google Sheets
async function syncToGoogleSheet(transaction) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Tránh lỗi CORS trên trình duyệt
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
        });
        console.log("Đã đẩy dữ liệu lên Google Sheet thành công!");
    } catch (error) {
        console.error("Lỗi khi đồng bộ Google Sheet:", error);
    }
}

function removeTransaction(id) {
    if(confirm('Bạn có chắc muốn xóa giao dịch này khỏi bộ nhớ máy tính? (Lưu ý: Dữ liệu trên Google Sheet sẽ không bị xóa tự động)')) {
        transactions = transactions.filter(t => t.id !== id);
        updateLocalStorage();
        updateUI();
    }
}

// --- LOGIC LỌC VÀ TÌM KIẾM ---

function getFilteredTransactions() {
    const filter = timeFilter.value;
    const searchText = searchInput.value.toLowerCase();
    const now = new Date();
    
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        let matchTime = true;
        
        if (filter === 'today') {
            matchTime = tDate.toDateString() === now.toDateString();
        } else if (filter === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            matchTime = tDate >= startOfWeek;
        } else if (filter === 'month') {
            matchTime = tDate.getMonth() === new Date().getMonth() && tDate.getFullYear() === new Date().getFullYear();
        }

        const matchSearch = t.text.toLowerCase().includes(searchText) || 
                            t.user.toLowerCase().includes(searchText) || 
                            t.date.includes(searchText);

        return matchTime && matchSearch;
    });
}

// --- GIAO DIỆN ---

function updateUI() {
    const filtered = getFilteredTransactions();
    list.innerHTML = '';
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const item = document.createElement('li');
        item.classList.add(t.amount < 0 ? 'minus' : 'plus');
        
        item.innerHTML = `
            <div class="item-main">
                <span>${t.text} <small style="font-weight:normal; color:#666">(${t.user})</small></span>
                <span>${t.amount.toLocaleString()}đ</span>
            </div>
            <div class="item-sub">
                <span>📅 ${t.date}</span>
                <button class="delete-btn" onclick="removeTransaction(${t.id})">×</button>
            </div>
        `;
        list.appendChild(item);
    });

    const total = filtered.reduce((acc, item) => acc + item.amount, 0);
    balance.innerText = `${total.toLocaleString()}đ`;
    renderChart(filtered);
}

function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const income = data.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(data.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tiền vào (+)', 'Tiền ra (-)'],
            datasets: [{
                label: 'VND',
                data: [income, expense],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderRadius: 5
            }]
        },
        options: { 
            responsive: true, 
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function exportToCSV() {
    let csv = "\uFEFFTên,Người chi,Ngày,Số tiền\n";
    transactions.forEach(t => {
        csv += `${t.text},${t.user},${t.date},${t.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_cao_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Khởi chạy
form.addEventListener('submit', addTransaction);
updateUI();