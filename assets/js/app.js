/* =========================
   APP.JS — VERSÃO LIMPA E CORRIGIDA
   ========================= */

// Estado global do carrinho
window.carrinho = window.carrinho || [];

/* =========================
   ATUALIZAR CONTADOR
   ========================= */
function atualizarContadorCarrinho() {
    const contador = document.getElementById('contador-carrinho');
    if (!contador) return;

    contador.textContent = window.carrinho.length;
}

/* =========================
   ABRIR MODAL CARRINHO
   ========================= */
function abrirCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderizarCarrinho();
    }
}

/* =========================
   FECHAR MODAL
   ========================= */
function fecharCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/* =========================
   RENDERIZAR CARRINHO
   ========================= */
function renderizarCarrinho() {
    const container = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total');

    if (!container || !totalEl) return;

    container.innerHTML = '';

    let total = 0;

    window.carrinho.forEach(item => {
        total += item.preco * item.quantidade;

        const div = document.createElement('div');
        div.className = 'carrinho-item';

        div.innerHTML = `
            <span>${item.nome}</span>
            <span>R$ ${item.preco.toFixed(2)}</span>
        `;

        container.appendChild(div);
    });

    totalEl.textContent = total.toFixed(2);
}

/* =========================
   ABRIR CATEGORIA
   ========================= */
function abrirCategoria(categoriaId) {
    if (typeof window.renderizarCategoria === 'function') {
        window.renderizarCategoria(categoriaId);
    }
}

/* =========================
   BOTTOM NAV
   ========================= */
function renderizarBottomNav() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.innerHTML = `
        <button onclick="abrirCategoria('hamburgueres')">🍔<br>Hamb</button>
        <button onclick="abrirCategoria('combos')">🎯<br>Combo</button>
        <button onclick="abrirCategoria('acompanhamentos')">🍟<br>Acomp</button>
        <button onclick="abrirCategoria('bebidas')">🥤<br>Beb</button>
    `;
}

/* =========================
   EVENTOS INICIAIS
   ========================= */
document.addEventListener('DOMContentLoaded', () => {

    atualizarContadorCarrinho();
    renderizarBottomNav();

    const btnCarrinho = document.getElementById('carrinho-btn');
    if (btnCarrinho) {
        btnCarrinho.addEventListener('click', abrirCarrinho);
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fechar-modal')) {
            fecharCarrinho();
        }
    });

});
