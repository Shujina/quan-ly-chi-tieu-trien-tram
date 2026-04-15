const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';

let transactions = [];
let myChart;

// 1. ĐỒNG BỘ DỮ LIỆU TỪ SHEET
async function loadData() {
    const list = document.getElementById('list');
    list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">🔄 Đang tải dữ liệu...</div>';
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);
        const data = await response.json();
        // Lọc bỏ dòng trống ngay từ đầu
        transactions = data.filter(t => t.text && t.amount);
        updateUI();
    } catch (error) {
        list.innerHTML = '<div style="color:red; text-align:center;">Lỗi kết nối. Hãy tải lại trang!</div>';
    }
}

// 2. GỬI DỮ LIỆU (VỚI FEEDBACK NÚT BẤM)
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerText;

    const newTx = {
        id: Date.now(),
        text: document.getElementById('text').value.trim(),
        user: document.getElementById('user').value.trim(),
        date: document.getElementById('date').value,
        amount: document.getElementById('type').value === 'expense' ? 
                -Math.abs(+document.getElementById('amount').value) : 
                 Math.abs(+document.getElementById('amount').value)
    };

    // Hiển thị ngay
    transactions.push(newTx);
    updateUI();

    // Hiệu ứng nút bấm
    btn.innerText = "Đang lưu... ⏳";
    btn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify(newTx) 
    }).then(() => {
        btn.innerText = "Thành công! ✅";
        btn.style.background = "#2ecc71";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.disabled = false;
            toggleForm();
        }, 1000);
    });

    this.reset();
    document.getElementById('date').valueAsDate = new Date();
});

// 3. CẬP NHẬT UI (CÓ QUICK STATS)
function updateUI() {
    const list = document.getElementById('list');
    const balance = document.getElementById('balance');
    const incDisplay = document.getElementById('total-income');
    const expDisplay = document.getElementById('total-expense');
    
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

    // Tính toán thống kê
    const income = filtered.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const expense = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0);
    const total = income + expense;

    balance.innerText = `${total.toLocaleString()}đ`;
    incDisplay.innerText = `+${income.toLocaleString()}đ`;
    expDisplay.innerText = `${expense.toLocaleString()}đ`;

    list.innerHTML = '';
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const item = document.createElement('li');
        item.className = t.amount < 0 ? 'minus' : 'plus';
        item.innerHTML = `
            <div>
                <b style="font-size:15px;">${t.text}</b>
                <div style="font-size:12px; color:#64748b;">${t.user} • ${t.date}</div>
            </div>
            <div style="text-align:right">
                <p style="font-weight:700; color:${t.amount < 0 ? '#ff4757' : '#2ecc71'}">
                    ${Number(t.amount).toLocaleString()}đ
                </p>
                <button class="delete-btn" onclick="removeTx(${t.id})">Xóa</button>
            </div>`;
        list.appendChild(item);
    });

    renderChart(income, Math.abs(expense));
}

function toggleForm() {
    const f = document.getElementById('form');
    f.classList.toggle('hidden');
}

function removeTx(id) {
    if(confirm('Xóa trên máy?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
    }
}

function renderChart(inc, exp) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Thu', 'Chi'],
            datasets: [{ data: [inc, exp], backgroundColor: ['#2ecc71', '#ff4757'], borderWidth: 0 }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } } }
    });
}

function exportToCSV() {
    let csv = "\uFEFFTên,Người chi,Ngày,Số tiền\n";
    transactions.forEach(t => csv += `${t.text},${t.user},${t.date},${t.amount}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `BaoCao_TaiChinh.csv`;
    link.click();
}

document.getElementById('date').valueAsDate = new Date();
loadData();