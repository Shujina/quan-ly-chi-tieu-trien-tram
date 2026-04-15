const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';

let transactions = [];
let myChart;
const SAVING_GOAL = 10000000; // Đặt mục tiêu 10 triệu (bạn có thể sửa số này)

// 1. ICON VÀ MÀU SẮC TỰ ĐỘNG
const getStyle = (text) => {
    const t = text.toLowerCase();
    if(t.includes('ăn') || t.includes('uống') || t.includes('cafe') || t.includes('cơm')) return { i: '🍕', b: '#ffedd5' };
    if(t.includes('lương') || t.includes('thưởng')) return { i: '💰', b: '#dcfce7' };
    if(t.includes('xe') || t.includes('xăng') || t.includes('grab')) return { i: '🚲', b: '#e0e7ff' };
    if(t.includes('nhà') || t.includes('điện') || t.includes('nước')) return { i: '🏠', b: '#fef9c3' };
    if(t.includes('mua') || t.includes('shopee')) return { i: '🛍️', b: '#fce7f3' };
    return { i: '💸', b: '#f1f5f9' };
};

// 2. TẢI DỮ LIỆU
async function loadData() {
    const list = document.getElementById('list');
    list.innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">🔄 Đang lấy dữ liệu từ mây...</p>';
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
        const data = await res.json();
        transactions = data.filter(t => t.text && t.amount);
        updateUI();
    } catch (e) {
        list.innerHTML = '<p style="text-align:center; color:red;">Lỗi kết nối. Hãy vuốt xuống tải lại!</p>';
    }
}

// 3. GỬI DỮ LIỆU CHỐNG TREO
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const originalText = btn.innerText;

    const tx = {
        id: Date.now(),
        text: document.getElementById('text').value,
        user: document.getElementById('user').value,
        date: document.getElementById('date').value,
        amount: document.getElementById('type').value === 'expense' ? 
                -Math.abs(+document.getElementById('amount').value) : 
                 Math.abs(+document.getElementById('amount').value)
    };

    transactions.push(tx);
    updateUI();

    btn.innerText = "Đang lưu... ⏳";
    btn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(tx) })
    .then(() => {
        btn.innerText = "Thành công! ✅";
        btn.style.background = "#10b981";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.disabled = false;
            toggleForm();
        }, 800);
    });

    this.reset();
    document.getElementById('date').valueAsDate = new Date();
});

// 4. CẬP NHẬT UI & HIỆU ỨNG NHẢY SỐ
function updateUI() {
    const list = document.getElementById('list');
    const filter = document.getElementById('timeFilter').value;
    const search = document.getElementById('search').value.toLowerCase();
    const now = new Date();

    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        let timeMatch = true;
        if (filter === 'today') timeMatch = tDate.toDateString() === now.toDateString();
        if (filter === 'month') timeMatch = tDate.getMonth() === now.getMonth();
        return (t.text.toLowerCase().includes(search) || t.user.toLowerCase().includes(search)) && timeMatch;
    });

    const income = filtered.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const expense = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0);
    const total = income + expense;

    // Nhảy số
    animateValue("balance", total);
    document.getElementById('total-income').innerText = `+${income.toLocaleString()}đ`;
    document.getElementById('total-expense').innerText = `${expense.toLocaleString()}đ`;
    document.getElementById('chart-center-val').innerText = `${Math.abs(expense).toLocaleString()}đ`;

    // Cập nhật Saving Goal
    const percent = Math.min(Math.round((total / SAVING_GOAL) * 100), 100);
    document.getElementById('goal-bar').style.width = (percent > 0 ? percent : 0) + '%';
    document.getElementById('goal-percent').innerText = (percent > 0 ? percent : 0) + '%';

    list.innerHTML = '';
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const s = getStyle(t.text);
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div class="category-icon" style="background:${s.b}">${s.i}</div>
                <div class="tx-info"><b>${t.text}</b><small>${t.user} • ${t.date}</small></div>
            </div>
            <div class="tx-amount">
                <p style="color:${t.amount < 0 ? 'var(--danger)':'var(--success)'}">${Number(t.amount).toLocaleString()}đ</p>
                <button class="delete-btn" onclick="removeTx(${t.id})">Xóa</button>
            </div>`;
        list.appendChild(li);
    });
    renderChart(income, Math.abs(expense));
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    let start = parseInt(obj.innerText.replace(/\D/g,'')) || 0;
    if (isNaN(start)) start = 0;
    const duration = 500;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerText = val.toLocaleString() + "đ";
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function toggleForm() {
    const f = document.getElementById('form');
    const btn = document.getElementById('main-toggle-btn');
    f.classList.toggle('hidden');
    btn.innerText = f.classList.contains('hidden') ? "+ Thêm giao dịch" : "Đóng lại";
}

function renderChart(inc, exp) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{ data: [inc, exp], backgroundColor: ['#10b981', '#fb7185'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: { cutout: '85%', plugins: { legend: { display: false } } }
    });
}

function removeTx(id) { if(confirm('Xóa trên máy?')) { transactions = transactions.filter(t => t.id !== id); updateUI(); } }

function exportToCSV() {
    let csv = "\uFEFFTên,Người chi,Ngày,Số tiền\n";
    transactions.forEach(t => csv += `${t.text},${t.user},${t.date},${t.amount}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `BaoCao_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

document.getElementById('date').valueAsDate = new Date();
loadData();