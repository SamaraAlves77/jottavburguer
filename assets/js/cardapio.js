/* =========================
   CARDAPIO.JS — VERSÃO CORRIGIDA
   ========================= */

/* =========================
   RENDERIZAR CATEGORIA
   ========================= */
window.renderizarCategoria = function(categoriaId) {
    const container = document.getElementById('main-content-container');
    if (!container) return;

    const categoria = window.cardapio.find(c => c.id == categoriaId);
    if (!categoria) return;

    let html = `<h2>${categoria.nome}</h2>`;

    html += `<div class="lista-itens">`;

    categoria.itens.forEach(item => {
        html += `
            <div class="item-lista-card">
                <img src="${item.imagem}" alt="${item.nome}" />

                <div class="item-info">
                    <h3>${item.nome}</h3>
                    <p>${item.descricao || ''}</p>
                    <span>R$ ${item.preco.toFixed(2)}</span>
                </div>

                <button class="btn-adicionar"
                    data-item-id="${item.id}"
                    data-categoria-id="${categoria.id}">
                    Adicionar
                </button>
            </div>
        `;
    });

    html += `</div>`;

    container.innerHTML = html;
};

/* =========================
   ADICIONAR AO CARRINHO
   ========================= */
function handleAdicionarAoCarrinho(event) {
    const btn = event.currentTarget;

    const itemId = btn.dataset.itemId;
    const categoriaId = btn.dataset.categoriaId;

    if (!itemId || !categoriaId) {
        console.error("Dados inválidos");
        return;
    }

    const categoria = window.cardapio.find(c => c.id == categoriaId);
    if (!categoria) return;

    const item = categoria.itens.find(i => i.id == itemId);
    if (!item) return;

    const itemCarrinho = {
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: 1
    };

    window.carrinho.push(itemCarrinho);

    if (typeof atualizarContadorCarrinho === 'function') {
        atualizarContadorCarrinho();
    }

    console.log("Adicionado ao carrinho:", itemCarrinho);
}

/* =========================
   EVENTO GLOBAL (CORRIGE BUG)
   ========================= */
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-adicionar');
    if (!btn) return;

    e.preventDefault();

    handleAdicionarAoCarrinho({ currentTarget: btn });
});
