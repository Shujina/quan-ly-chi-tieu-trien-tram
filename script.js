const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGJapb8KZCs4ERmp6aVHLj0NA0aJaNL2lPQ_6fYpCXxYaLoo67TlJebFgYbZquLluU/exec';
let transactions = [];
let myChart;
let activeUser = 'Tất cả';
const SAVING_GOAL = 10000000;
const MONTHLY_LIMIT = 8000000;

// Icon thông minh
const getIcon = (txt) => {
    const t = txt.toLowerCase();
    if(t.match(/ăn|uống|cafe|phở/)) return { i: '🍲', c: '#ffedd5' };
    if(t.match(/lương|thưởng|tiền/)) return { i: '💵', c: '#dcfce7' };
    if(t.match(/xe|xăng|grab/)) return { i: '🛵', c: '#e0e7ff' };
    return { i: '💳', c: '#f1f5f9' };
};

// Tải dữ liệu
async function loadData() {
    document.getElementById('list').innerHTML = '<div style="text-align:center;padding:20px;opacity:0.6">🔄 Đang đồng bộ...</div>';
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
        transactions = (await res.json()).filter(t => t.text && t.amount);
        updateUI();
    } catch (e) { console.log(e); }
}

function updateUI() {
    const filter = document.getElementById('timeFilter').value;
    const search = document.getElementById('search').value.toLowerCase();
    const now = new Date();

    // 1. Lọc dữ liệu chính
    let filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        const mMatch = filter === 'month' ? tDate.getMonth() === now.getMonth() : true;
        const sMatch = t.text.toLowerCase().includes(search) || t.user.toLowerCase().includes(search);
        return mMatch && sMatch;
    });

    // 2. Chip lọc người dùng
    const users = ['Tất cả', ...new Set(transactions.map(t => t.user))];
    const chipBox = document.getElementById('user-filters');
    chipBox.innerHTML = users.map(u => `<div class="chip ${activeUser === u ? 'active' : ''}" onclick="activeUser='${u}'; updateUI();">${u}</div>`).join('');
    if(activeUser !== 'Tất cả') filtered = filtered.filter(t => t.user === activeUser);

    // 3. Tính toán con số
    const inc = filtered.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const exp = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0);
    const total = inc + exp;

    // 4. Dashboard & Cảnh báo
    animateValue("balance", total);
    document.getElementById('total-income').innerText = `+${inc.toLocaleString()}đ`;
    document.getElementById('total-expense').innerText = `${exp.toLocaleString()}đ`;
    document.getElementById('chart-center-val').innerText = `${Math.abs(exp).toLocaleString()}đ`;
    document.getElementById('budget-alert').style.display = Math.abs(exp) > MONTHLY_LIMIT ? 'block' : 'none';

    const pct = Math.min(Math.round((total / SAVING_GOAL) * 100), 100);
    document.getElementById('goal-bar').style.width = (pct > 0 ? pct : 0) + '%';
    document.getElementById('goal-percent').innerText = (pct > 0 ? pct : 0) + '%';

    // 5. Render List theo ngày
    const list = document.getElementById('list');
    list.innerHTML = '';
    let lastDate = "";
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        if(t.date !== lastDate) {
            const dLabel = document.createElement('div');
            dLabel.className = 'date-label';
            dLabel.innerText = t.date === now.toISOString().split('T')[0] ? "Hôm nay" : t.date;
            list.appendChild(dLabel);
            lastDate = t.date;
        }
        const s = getIcon(t.text);
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex;align-items:center">
                <div style="width:42px;height:42px;border-radius:12px;background:${s.c};display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:18px">${s.i}</div>
                <div><b>${t.text}</b><br><small style="color:#94a3b8">${t.user}</small></div>
            </div>
            <div style="text-align:right">
                <p style="color:${t.amount < 0 ? 'var(--danger)':'var(--success)'};font-weight:800">${Number(t.amount).toLocaleString()}đ</p>
                <button onclick="removeTx(${t.id})" style="border:none;background:none;font-size:10px;color:#cbd5e1">Xóa</button>
            </div>`;
        list.appendChild(li);
    });
    renderChart(filtered);
}

// 6. Phân tích Chart theo người dùng
function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const legendBox = document.getElementById('chart-legend');
    
    const userStats = {};
    const expensesOnly = data.filter(t => t.amount < 0);
    expensesOnly.forEach(t => { userStats[t.user] = (userStats[t.user] || 0) + Math.abs(t.amount); });

    const labels = Object.keys(userStats);
    const vals = Object.values(userStats);
    const totalExp = vals.reduce((s, v) => s + v, 0);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0 }] },
        options: { cutout: '82%', plugins: { legend: { display: false } } }
    });

    legendBox.innerHTML = labels.map((l, i) => `
        <div class="legend-item">
            <div class="l-color" style="background:${colors[i % colors.length]}"></div>
            <span>${l}: <b>${((vals[i]/totalExp)*100).toFixed(0)}%</b></span>
        </div>
    `).join('');
}

// Gửi form & Haptic
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    if(window.navigator.vibrate) window.navigator.vibrate(50);
    
    const tx = {
        id: Date.now(),
        text: document.getElementById('text').value,
        user: document.getElementById('user').value,
        date: document.getElementById('date').value,
        amount: document.getElementById('type').value === 'expense' ? -Math.abs(+document.getElementById('amount').value) : Math.abs(+document.getElementById('amount').value)
    };

    transactions.push(tx);
    updateUI();
    const btn = document.getElementById('submit-btn');
    btn.innerText = "🚀 Đang lưu...";
    btn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(tx) }).then(() => {
        btn.innerText = "✅ Xong!";
        setTimeout(() => { toggleForm(); btn.innerText = "Xác nhận giao dịch"; btn.disabled = false; }, 800);
    });
    this.reset();
    document.getElementById('date').valueAsDate = new Date();
});

function animateValue(id, end) {
    const obj = document.getElementById(id);
    let start = parseInt(obj.innerText.replace(/\D/g,'')) || 0;
    const duration = 800;
    let startTimestamp = null;
    const step = (ts) => {
        if (!startTimestamp) startTimestamp = ts;
        const p = Math.min((ts - startTimestamp) / duration, 1);
        obj.innerText = Math.floor(p * (end - start) + start).toLocaleString() + "đ";
        if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function toggleForm() {
    const o = document.getElementById('overlay');
    o.classList.toggle('hidden');
    document.getElementById('fab').style.transform = o.classList.contains('hidden') ? "rotate(0)" : "rotate(45deg)";
}

function removeTx(id) { if(confirm('Xóa?')) { transactions = transactions.filter(t => t.id !== id); updateUI(); } }

function exportToCSV() {
    let csv = "\uFEFFTên,Người,Ngày,Số tiền\n";
    transactions.forEach(t => csv += `${t.text},${t.user},${t.date},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Finance_Report.csv`;
    link.click();
}

document.getElementById('date').valueAsDate = new Date();
loadData();