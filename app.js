// ==========================================
// 0. AUTENTICAÇÃO (PROTEÇÃO DE ROTAS)
// ==========================================
// Verifica se o usuário está "logado" através do localStorage
const currentUser = localStorage.getItem('precifica_user');
const currentPath = window.location.pathname;

// Se a página atual é Login ou Cadastro
const isAuthPage = currentPath.includes('login.html') || currentPath.includes('cadastro.html');

if (!currentUser && !isAuthPage) {
  // Se não tem usuário logado e tentar acessar o painel -> vai pro login
  window.location.href = 'login.html';
} else if (currentUser && isAuthPage) {
  // Se tem usuário logado e tenta acessar login/cadastro -> vai pro painel
  window.location.href = 'index.html';
}

// ==========================================
// 1. GERENCIAMENTO DE DADOS (LOCALSTORAGE)
// ==========================================
const defaultProducts = [
  { id: 1, ean: "7891000100103", name: "Leite Integral 1L", cat: "Laticínios", costPrev: 3.0, costCurr: 3.45, priceCurr: 4.2, priceSugg: 4.89, marginMeta: 28.0, stock: 120, salesGiro: 450, daysToExpiry: 15, estimatedWeeklyLoss: 310.5 },
  { id: 2, ean: "7891000200202", name: "Costela Bovina Ripa kg", cat: "Açougue", costPrev: 18.2, costCurr: 19.5, priceCurr: 24.9, priceSugg: 24.0, marginMeta: 35.0, stock: 45, salesGiro: 120, daysToExpiry: 2, estimatedWeeklyLoss: 0 },
  { id: 3, ean: "7891000300301", name: "Arroz Branco 5kg", cat: "Mercearia", costPrev: 16.5, costCurr: 18.0, priceCurr: 22.5, priceSugg: 25.7, marginMeta: 30.0, stock: 210, salesGiro: 520, daysToExpiry: 180, estimatedWeeklyLoss: 44.5 },
  { id: 4, ean: "7891000400400", name: "Óleo de Soja 900ml", cat: "Mercearia", costPrev: 5.1, costCurr: 5.1, priceCurr: 6.8, priceSugg: 7.28, marginMeta: 30.0, stock: 140, salesGiro: 340, daysToExpiry: 120, estimatedWeeklyLoss: 0.0 }
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

  let score = 10;
  if (p.priceCurr < p.priceSugg && p.daysToExpiry > 10) score -= 3;
  if (costIncrease > 5) score -= 2;
  if (p.daysToExpiry < 10) score -= 4;

  return { score, currentMargin, costIncrease, expStatus, expCls };
}

// ==========================================
// 3. RENDERIZAÇÃO DAS TABELAS
// ==========================================
function renderDashboardTable() {
  const tbody = document.getElementById('dashboard-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('search')?.value.toLowerCase() || '';
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.ean.includes(searchQuery));

  let pendingCount = 0;
  let criticalCount = 0;
  let totalLoss = 0;
  let scoreSum = 0;

  tbody.innerHTML = filtered.map(p => {
    const ev = evaluateProduct(p);
    const isUpdated = Math.abs(p.priceCurr - p.priceSugg) < 0.05;
    const isDiscount = p.priceSugg < p.priceCurr;
    
    if (!isUpdated) pendingCount++;
    if (ev.expStatus === 'Crítico') criticalCount++;
    if (!isUpdated) totalLoss += (p.estimatedWeeklyLoss || 0);
    scoreSum += ev.score;

    let warningBadge = p.daysToExpiry < 10 
      ? `<div class="text-[10px] text-destructive-theme font-bold mt-1.5 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Bloquear Reposição (Gôndola Cheia)</div>` 
      : '';

    let priceLabel = isDiscount ? '↓ Sugestão de Desconto (Giro Rápido)' : `Meta: ${p.marginMeta.toFixed(1)}%`;

    return `<tr class="transition hover:bg-secondary/60 border-b border-theme">
      <td class="py-4 px-2">
        <p class="font-bold text-sm mb-0.5">${p.name}</p>
        <p class="text-[11px] text-muted">EAN: ${p.ean} · ${p.cat}</p>
        ${warningBadge}
      </td>
      <td class="py-4 text-muted px-2 text-sm">
        <span class="line-through">${brl(p.costPrev)}</span> → <span class="font-bold text-foreground">${brl(p.costCurr)}</span>
      </td>
      <td class="py-4 font-bold px-2 text-sm">${brl(p.priceCurr)}</td>
      <td class="py-4 font-bold px-2 text-sm ${isDiscount ? 'text-destructive-theme' : 'text-[var(--sidebar)] dark:text-white'}">
         ${brl(p.priceSugg)}
         <span class="block text-[10px] font-normal text-muted mt-0.5">${priceLabel}</span>
      </td>
      <td class="py-4 px-2">
        <span class="rounded bg-warning-theme/20 text-warning-theme px-2 py-1 text-[11px] font-bold">${p.daysToExpiry} dias</span>
      </td>
      <td class="py-4 text-right px-2">
        ${isUpdated 
          ? `<span class="text-[11px] font-bold text-success flex items-center justify-end gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Aplicado</span>` 
          : `<button onclick="applyOne(${p.id})" class="rounded-xl bg-[var(--sidebar)] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[var(--primary)] transition shadow-sm">Aplicar Sugestão</button>`
        }
      </td>
    </tr>`;
  }).join('');

  const avgScore = filtered.length > 0 ? (scoreSum / filtered.length).toFixed(1) : '10.0';
  if(document.getElementById('kpi-score')) document.getElementById('kpi-score').innerText = avgScore;
  if(document.getElementById('kpi-pending')) document.getElementById('kpi-pending').innerText = `${pendingCount} Itens`;
  if(document.getElementById('kpi-critical')) document.getElementById('kpi-critical').innerText = `${criticalCount} Itens`;
  if(document.getElementById('kpi-loss')) document.getElementById('kpi-loss').innerText = brl(totalLoss);
  if(document.getElementById('banner-title')) {
    document.getElementById('banner-title').innerText = pendingCount > 0 
      ? `${pendingCount} produtos fora da margem ou precisando de giro!` 
      : 'Todos os produtos estão otimizados!';
  }
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
        <div class="flex justify-end gap-2">
          <button onclick="openModal(${p.id})" class="flex items-center gap-1 p-1.5 px-3 rounded-lg bg-secondary border border-theme text-primary-theme font-bold hover:bg-primary-theme hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Editar
          </button>
          <button onclick="deleteProduct(${p.id})" class="flex items-center gap-1 p-1.5 px-3 rounded-lg bg-secondary border border-theme text-destructive-theme font-bold hover:bg-destructive-theme hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Excluir
          </button>
        </div>
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
// 5. AÇÕES GLOBAIS (APLICAR E CRUD)
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

function updateThemeIcons(isDark) {
  document.getElementById('icon-moon')?.classList.toggle('hidden', isDark);
  document.getElementById('icon-sun')?.classList.toggle('hidden', !isDark);
}

// ==========================================
// 6. INICIALIZAÇÃO SEGURA E EVENTOS DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeIcons(isDark);

  renderDashboardTable();
  renderProductsTable();
  setTimeout(renderCharts, 50);

  // AÇÕES DE AUTENTICAÇÃO (LOGIN/CADASTRO/LOGOUT)
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    localStorage.setItem('precifica_user', JSON.stringify({ email }));
    window.location.href = 'index.html'; // Redireciona para o dashboard
  });

  document.getElementById('cadastro-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    const confSenha = document.getElementById('cad-conf-senha').value;
    
    if (senha !== confSenha) {
      showNotice('As senhas não coincidem!');
      return;
    }
    
    // Auto-login após cadastro
    localStorage.setItem('precifica_user', JSON.stringify({ nome, email }));
    window.location.href = 'index.html';
  });

  // AÇÃO DO BOTÃO DE SAIR
  document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('precifica_user'); // Remove a sessão do usuário
    window.location.replace('login.html');     // Joga para a tela de login
  });
  });

  // OUTROS COMPONENTES
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDarkNow = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    updateThemeIcons(isDarkNow);
    if (typeof renderCharts === 'function') renderCharts();
  });

  document.getElementById('search')?.addEventListener('input', () => {
    renderDashboardTable();
    renderProductsTable();
  });

  document.getElementById('form-config')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotice('Configurações salvas com sucesso.');
  });

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
});
