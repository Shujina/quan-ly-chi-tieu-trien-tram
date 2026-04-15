const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';

let transactions = [];
let myChart;

// HÀM MỞ/ĐÓNG FORM (BẢN VÁ LỖI TREO)
function toggleForm() {
    const formElement = document.getElementById('form');
    if (formElement) {
        if (formElement.classList.contains('hidden')) {
            formElement.classList.remove('hidden');
            formElement.style.display = 'block';
        } else {
            formElement.classList.add('hidden');
            formElement.style.display = 'none';
        }
    }
}

// TẢI DỮ LIỆU TỪ SHEET (CÓ CHỐNG CACHE)
async function loadTransactionsFromSheet() {
    const list = document.getElementById('list');
    list.innerHTML = '<p style="text-align:center; padding:20px;">🔄 Đang đồng bộ...</p>';
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);
        const data = await response.json();
        transactions = data;
        updateUI();
    } catch (error) {
        list.innerHTML = '<p style="color:red; text-align:center;">Lỗi tải dữ liệu!</p>';
    }
}

// GỬI GIAO DỊCH (BẢN VÁ CHỐNG TREO)
document.getElementById('form').addEventListener('submit', function(e) {
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

    transactions.push(newTransaction);
    updateUI();

    fetch(GOOGLE_SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify(newTransaction) 
    });

    this.reset();
    document.getElementById('date').valueAsDate = new Date();
    toggleForm();
});

// CẬP NHẬT GIAO DIỆN
function updateUI() {
    const list = document.getElementById('list');
    const balance = document.getElementById('balance');
    const filter = document.getElementById('timeFilter').value;
    const search = document.getElementById('search').value.toLowerCase();
    const now = new Date();

    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        let timeMatch = true;
        if (filter === 'today') timeMatch = tDate.toDateString() === now.toDateString();
        if (filter === 'month') timeMatch = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        return (t.text.toLowerCase().includes(search) || t.user.toLowerCase().includes(search)) && timeMatch;
    });

    list.innerHTML = '';
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const item = document.createElement('li');
        item.className = t.amount < 0 ? 'minus' : 'plus';
        item.innerHTML = `
            <div><b>${t.text} (${t.user})</b><br><small>${t.date}</small></div>
            <div style="text-align:right">
                <p style="color:${t.amount < 0 ? '#ff4757' : '#2ecc71'}"><b>${Number(t.amount).toLocaleString()}đ</b></p>
                <button class="delete-btn" onclick="removeTransaction(${t.id})">Xóa</button>
            </div>`;
        list.appendChild(item);
    });

    const total = filtered.reduce((acc, t) => acc + Number(t.amount), 0);
    balance.innerText = `${total.toLocaleString()}đ`;
    renderChart(filtered);
}

function removeTransaction(id) {
    if(confirm('Xóa trên máy?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
    }
}

function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const income = data.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const expense = Math.abs(data.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0));
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Thu nhập', 'Chi tiêu'], datasets: [{ data: [income, expense], backgroundColor: ['#2ecc71', '#ff4757'], borderWidth: 0 }] },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
}

function exportToCSV() {
    let csv = "\uFEFFTên,Người chi,Ngày,Số tiền\n";
    transactions.forEach(t => csv += `${t.text},${t.user},${t.date},${t.amount}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "BaoCao.csv";
    link.click();
}

document.getElementById('date').valueAsDate = new Date();
loadTransactionsFromSheet();