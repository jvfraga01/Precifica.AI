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
@@ -22,7 +40,7 @@ const brl = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
function calculateSuggPrice(cost, margin, daysToExpiry, category) {
let basePrice = cost / (1 - (margin / 100));
if (daysToExpiry <= 3 && ['Açougue', 'Laticínios', 'Hortifrúti'].includes(category)) {
    return basePrice * 0.8;
}
return basePrice;
}
@@ -36,7 +54,6 @@ function evaluateProduct(p) {
if (p.daysToExpiry < 10) { expStatus = 'Crítico'; expCls = 'bg-destructive-theme text-destructive-theme'; } 
else if (p.daysToExpiry <= 30) { expStatus = 'Atenção'; expCls = 'bg-warning-theme text-warning-theme'; }

let score = 10;
if (p.priceCurr < p.priceSugg && p.daysToExpiry > 10) score -= 3;
if (costIncrease > 5) score -= 2;
@@ -50,7 +67,7 @@ function evaluateProduct(p) {
// ==========================================
function renderDashboardTable() {
const tbody = document.getElementById('dashboard-table-body');
  if (!tbody) return;

const searchQuery = document.getElementById('search')?.value.toLowerCase() || '';
const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.ean.includes(searchQuery));
@@ -102,7 +119,6 @@ function renderDashboardTable() {
   </tr>`;
}).join('');

const avgScore = filtered.length > 0 ? (scoreSum / filtered.length).toFixed(1) : '10.0';
if(document.getElementById('kpi-score')) document.getElementById('kpi-score').innerText = avgScore;
if(document.getElementById('kpi-pending')) document.getElementById('kpi-pending').innerText = `${pendingCount} Itens`;
@@ -135,15 +151,11 @@ function renderProductsTable() {
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
@@ -233,7 +245,7 @@ function renderCharts() {
}

// ==========================================
// 5. AÇÕES GLOBAIS (APLICAR E CRUD)
// ==========================================
function showNotice(msg) {
const el = document.getElementById('notice');
@@ -306,22 +318,51 @@ function updateThemeIcons(isDark) {
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

  // Botões de Sair (Logout) em todas as páginas
  document.querySelectorAll('#btn-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('precifica_user');
      window.location.href = 'login.html';
    });
  });

  // OUTROS COMPONENTES
document.getElementById('theme-toggle')?.addEventListener('click', () => {
document.documentElement.classList.toggle('dark');
const isDarkNow = document.documentElement.classList.contains('dark');
