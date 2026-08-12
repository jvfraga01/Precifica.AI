// ==========================================
// 1. GERENCIAMENTO DE DADOS (LOCALSTORAGE)
// ==========================================
const defaultProducts = [
  { id: 1, ean: "7891000100103", name: "Leite Integral 1L", cat: "Laticínios", costPrev: 3.0, costCurr: 3.45, priceCurr: 4.2, priceSugg: 4.89, marginMeta: 28.0, stock: 120, salesGiro: 450, daysToExpiry: 15, estimatedWeeklyLoss: 310.5 },
  { id: 2, ean: "7891000200202", name: "Costela Bovina Ripa kg", cat: "Açougue", costPrev: 18.2, costCurr: 19.5, priceCurr: 24.9, priceSugg: 24.0, marginMeta: 35.0, stock: 45, salesGiro: 120, daysToExpiry: 2, estimatedWeeklyLoss: 0 },
  { id: 3, ean: "7891000300301", name: "Arroz Branco 5kg", cat: "Mercearia", costPrev: 16.5, costCurr: 18.0, priceCurr: 22.5, priceSugg: 25.7, marginMeta: 30.0, stock: 210, salesGiro: 520, daysToExpiry: 180, estimatedWeeklyLoss: 44.5 }
];

let products = JSON.parse(localStorage.getItem('precifica_db')) || defaultProducts;

function saveProducts() {
  localStorage.setItem('precifica_db', JSON.stringify(products));
}

const brl = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

// ==========================================
// 2. LÓGICA DE NEGÓCIO E AVALIAÇÃO
// ==========================================
function calculateSuggPrice(cost, margin, daysToExpiry, category) {
  let basePrice = cost / (1 - (margin / 100));
  if (daysToExpiry <= 3 && ['Açougue', 'Laticínios', 'Hortifrúti'].includes(category)) {
    return basePrice * 0.8;
  }
  return basePrice;
}

function evaluateProduct(p) {
  p.priceSugg = calculateSuggPrice(p.costCurr, p.marginMeta, p.daysToExpiry, p.cat);
  const currentMargin = ((p.priceCurr - p.costCurr) / p.priceCurr) * 100;
  const costIncrease = p.costPrev > 0 ? ((p.costCurr - p.costPrev) / p.costPrev) * 100 : 0;
  
  let expStatus = 'Saudável', expCls = 'bg-success-theme text-success-theme';
  if (p.daysToExpiry < 10) { expStatus = 'Crítico'; expCls = 'bg-destructive-theme text-destructive-theme'; } 
  else if (p.daysToExpiry <= 30) { expStatus = 'Atenção'; expCls = 'bg-warning-theme text-warning-theme'; }

  return { currentMargin, costIncrease, expStatus, expCls };
}

// ==========================================
// 3. RENDERIZAÇÃO DAS TABELAS
// ==========================================
function renderDashboardTable() {
  const tbody = document.getElementById('dashboard-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('search')?.value.toLowerCase() || '';
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.ean.includes(searchQuery));

  tbody.innerHTML = filtered.map(p => {
    const ev = evaluateProduct(p);
    const isUpdated = Math.abs(p.priceCurr - p.priceSugg) < 0.05;
    const isDiscount = p.priceSugg < p.priceCurr;
    
    let warningBadge = p.daysToExpiry < 10 
      ? `<div class="text-[10px] text-destructive-theme font-bold mt-1">⚠ Bloquear Reposição</div>` 
      : '';

    return `<tr class="transition hover:bg-secondary/60 border-b border-theme">
      <td class="py-3 px-2">
        <p class="font-bold">${p.name}</p>
        <p class="text-[10px] text-muted">EAN: ${p.ean} · ${p.cat}</p>
        ${warningBadge}
      </td>
      <td class="py-3 text-muted px-2">
        <span class="line-through">${brl(p.costPrev)}</span> → <span class="font-semibold text-foreground">${brl(p.costCurr)}</span>
      </td>
      <td class="py-3 font-semibold px-2">${brl(p.priceCurr)}</td>
      <td class="py-3 font-bold px-2 ${isDiscount ? 'text-destructive-theme' : 'text-primary-theme'}">
         ${brl(p.priceSugg)}
      </td>
      <td class="py-3 px-2"><span class="rounded-full px-2 py-0.5 text-[10px] font-bold ${ev.expCls}">${p.daysToExpiry} dias</span></td>
      <td class="py-3 text-right px-2">
        ${isUpdated 
          ? `<span class="text-[11px] font-bold text-success flex items-center justify-end gap-1">✔ PDV Sinc.</span>` 
          : `<button onclick="applyOne(${p.id})" class="rounded-xl bg-[var(--sidebar)] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--primary)] transition">Aplicar Sugestão</button>`
        }
      </td>
    </tr>`;
  }).join('');
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('search')?.value.toLowerCase() || '';
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.ean.includes(searchQuery));

  tbody.innerHTML = filtered.map(p => {
    const ev = evaluateProduct(p);
    return `<tr class="transition hover:bg-secondary/40 border-b border-theme">
      <td class="p-3"><p class="font-bold">${p.name}</p><p class="text-[10px] text-muted">EAN: ${p.ean}</p></td>
      <td class="p-3"><span class="font-semibold">${p.cat}</span><p class="text-[10px] text-muted">Markup: ${p.marginMeta}%</p></td>
      <td class="p-3 font-semibold">${brl(p.costCurr)}</td>
      <td class="p-3 font-bold">${brl(p.priceCurr)}</td>
      <td class="p-3">
        <span class="rounded px-2 py-0.5 text-[10px] font-bold ${ev.expCls}">${p.daysToExpiry} dias</span>
        <p class="text-[10px] text-muted mt-1">Giro: ${p.salesGiro}/mês</p>
      </td>
      <td class="p-3 text-right">
        <button onclick="openModal(${p.id})" class="mr-2 p-1.5 rounded-lg bg-secondary border border-theme text-primary-theme font-bold hover:bg-primary-theme hover:text-white transition">Editar</button>
        <button onclick="deleteProduct(${p.id})" class="p-1.5 rounded-lg bg-secondary border border-theme text-destructive-theme font-bold hover:bg-destructive-theme hover:text-white transition">Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

// ==========================================
// 4. GRÁFICOS (CHART.JS)
// ==========================================
let marginChartInstance = null;
let analyticsChartInstance = null;

function renderCharts() {
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#94a3b8' : '#6b7d73';

  // Gráfico Dashboard
  const ctxM = document.getElementById('marginChart');
  if (ctxM) {
    if (marginChartInstance) marginChartInstance.destroy();
    marginChartInstance = new Chart(ctxM, {
      type: 'line',
      data: {
        labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
        datasets: [
          {
            label: 'Com Otimização IA',
            data: [23.5, 25.0, 26.2, 28.4],
            borderColor: isDark ? '#a7f3d0' : '#1b4332',
            backgroundColor: isDark ? 'rgba(167,243,208,0.15)' : 'rgba(27,67,50,0.12)',
            fill: true, tension: 0.4, borderWidth: 2
          },
          {
            label: 'Sem Reajuste',
            data: [23.5, 22.0, 20.4, 18.9],
            borderColor: isDark ? '#f87171' : '#c0392b',
            borderDash: [4, 4], tension: 0.4, borderWidth: 2, pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor }, grid: { color: gridColor, borderDash: [3,3] } }
        }
      }
    });
  }

  // Gráfico Analytics
  const ctxA = document.getElementById('analyticsChart');
  if (ctxA) {
    if (analyticsChartInstance) analyticsChartInstance.destroy();
    const sortedProducts = [...products].sort((a,b) => a.daysToExpiry - b.daysToExpiry);
    const barColors = sortedProducts.map(p => {
        if(p.daysToExpiry < 10) return '#c0392b';
        if(p.daysToExpiry <= 30) return '#f9a825';
        return '#2e8b57';
    });

    analyticsChartInstance = new Chart(ctxA, {
      type: 'bar',
      data: {
        labels: sortedProducts.map(p => p.name.substring(0, 15) + '...'),
        datasets: [{
          label: 'Giro Mensal',
          data: sortedProducts.map(p => p.salesGiro),
          backgroundColor: barColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: (ctx) => `Validade: ${sortedProducts[ctx.dataIndex].daysToExpiry} dias` } }
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }
}

// ==========================================
// 5. AÇÕES DO SISTEMA E CRUD
// ==========================================
function showNotice(msg) {
  const el = document.getElementById('notice');
  if(!el) { alert(msg); return; }
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.remove('opacity-0'), 10);
  setTimeout(() => {
    el.classList.add('opacity-0');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 2600);
}

function applyOne(id) {
  products = products.map(p => {
    if(p.id === id) return { ...p, priceCurr: calculateSuggPrice(p.costCurr, p.marginMeta, p.daysToExpiry, p.cat), estimatedWeeklyLoss: 0 };
    return p;
  });
  saveProducts();
  renderDashboardTable();
  showNotice('Preço aprovado e sincronizado no PDV.');
}

function applyAll() {
  products = products.map(p => ({ ...p, priceCurr: calculateSuggPrice(p.costCurr, p.marginMeta, p.daysToExpiry, p.cat), estimatedWeeklyLoss: 0 }));
  saveProducts();
  renderDashboardTable();
  showNotice('Todos os reajustes foram aplicados (Lote).');
}

function deleteProduct(id) {
  if(confirm('Tem certeza que deseja apagar este produto?')) {
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsTable();
    showNotice('Produto removido.');
  }
}

function openModal(id = null) {
  const m = document.getElementById('product-modal');
  if(!m) return;
  m.classList.remove('hidden');
  document.getElementById('product-form').reset();
  
  if(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('modal-title').innerText = 'Editar Produto';
    document.getElementById('form-id').value = p.id;
    document.getElementById('form-name').value = p.name;
    document.getElementById('form-ean').value = p.ean;
    document.getElementById('form-cat').value = p.cat;
    document.getElementById('form-cost').value = p.costCurr;
    document.getElementById('form-price').value = p.priceCurr;
    document.getElementById('form-expiry').value = p.daysToExpiry;
    document.getElementById('form-giro').value = p.salesGiro;
  } else {
    document.getElementById('modal-title').innerText = 'Adicionar Produto';
    document.getElementById('form-id').value = '';
  }
}

function closeModal() {
  const m = document.getElementById('product-modal');
  if(m) m.classList.add('hidden');
}

document.getElementById('product-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('form-id').value;
  const cat = document.getElementById('form-cat').value;
  let meta = cat === 'Açougue' ? 35 : (cat === 'Laticínios' ? 28 : 30);

  const pData = {
    name: document.getElementById('form-name').value,
    ean: document.getElementById('form-ean').value,
    cat: cat,
    costCurr: parseFloat(document.getElementById('form-cost').value),
    priceCurr: parseFloat(document.getElementById('form-price').value),
    daysToExpiry: parseInt(document.getElementById('form-expiry').value),
    salesGiro: parseInt(document.getElementById('form-giro').value),
    marginMeta: meta,
  };

  if (id) {
    products = products.map(p => p.id == id ? { ...p, ...pData, costPrev: p.costCurr !== pData.costCurr ? p.costCurr : p.costPrev } : p);
  } else {
    products.push({ id: Date.now(), costPrev: pData.costCurr, estimatedWeeklyLoss: 0, stock: 100, ...pData });
  }
  
  saveProducts();
  closeModal();
  renderProductsTable();
  showNotice(id ? 'Produto atualizado.' : 'Novo produto adicionado.');
});

// ==========================================
// 6. TEMA E INICIALIZAÇÃO
// ==========================================
function updateThemeIcons(isDark) {
  document.getElementById('icon-moon')?.classList.toggle('hidden', isDark);
  document.getElementById('icon-sun')?.classList.toggle('hidden', !isDark);
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons(isDark);
  if (typeof renderCharts === 'function') renderCharts();
});

document.getElementById('search')?.addEventListener('input', () => {
  renderDashboardTable();
  renderProductsTable();
});

document.addEventListener('DOMContentLoaded', () => {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeIcons(isDark);

  renderDashboardTable();
  renderProductsTable();
  setTimeout(renderCharts, 50); 
});
