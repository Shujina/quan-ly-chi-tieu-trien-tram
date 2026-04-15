const balance = document.getElementById('balance');
const list = document.getElementById('list');
const form = document.getElementById('form');
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIVBwynsx0a5RBkCbOgO9RJld861SvRjKB6no7gu7B9ESa7-ZNJdVtSewAJvDOiJHv/exec';

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart;

// Tự động nhận diện Icon dựa trên tên giao dịch
const getIcon = (text) => {
    const t = text.toLowerCase();
    if(t.includes('ăn') || t.includes('uống') || t.includes('cafe')) return '🍔';
    if(t.includes('lương') || t.includes('thưởng')) return '💰';
    if(t.includes('nhà') || t.includes('điện') || t.includes('nước')) return '🏠';
    if(t.includes('xe') || t.includes('xăng')) return '🚗';
    if(t.includes('học')) return '📚';
    return '💸';
};

function toggleForm() { form.classList.toggle('hidden'); }

document.getElementById('date').valueAsDate = new Date();

form.addEventListener('submit', async (e) => {
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

    transactions.push(transaction);
    updateLocalStorage();
    updateUI();
    
    // Gửi đến Google Sheet
    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(transaction) });

    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    toggleForm();
});

function removeTransaction(id) {
    if(confirm('Xóa giao dịch này?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateLocalStorage();
        updateUI();
    }
}

function updateUI() {
    const filter = document.getElementById('timeFilter').value;
    const search = document.getElementById('search').value.toLowerCase();
    const now = new Date();

    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        let timeMatch = true;
        if (filter === 'today') timeMatch = tDate.toDateString() === now.toDateString();
        if (filter === 'month') timeMatch = tDate.getMonth() === now.getMonth();

        const searchMatch = t.text.toLowerCase().includes(search) || t.user.toLowerCase().includes(search);
        return timeMatch && searchMatch;
    });

    list.innerHTML = '';
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const item = document.createElement('li');
        item.className = t.amount < 0 ? 'minus' : 'plus';
        item.innerHTML = `
            <div class="item-left">
                <b>${getIcon(t.text)} ${t.text} <small>(${t.user})</small></b>
                <small>📅 ${t.date}</small>
            </div>
            <div class="item-right">
                <p style="color: ${t.amount < 0 ? 'var(--expense)' : 'var(--income)'}">
                    ${t.amount.toLocaleString()}đ
                </p>
                <button class="delete-btn" onclick="removeTransaction(${t.id})">Xóa</button>
            </div>
        `;
        list.appendChild(item);
    });

    const total = filtered.reduce((acc, t) => acc + t.amount, 0);
    balance.innerText = `${total.toLocaleString()}đ`;
    renderChart(filtered);
}

function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const income = data.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = Math.abs(data.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Thu nhập', 'Chi tiêu'],
            datasets: [{ data: [income, expense], backgroundColor: ['#2ecc71', '#ff4757'], borderWidth: 0 }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
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

function updateLocalStorage() { localStorage.setItem('transactions', JSON.stringify(transactions)); }
updateUI();