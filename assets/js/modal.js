// modal_carrinho.js - Lógica de UI do Carrinho, Checkout e Geolocalização

// =======================================================
// VARIÁVEIS GLOBAIS
// =======================================================
let carrinhoModal, fecharModalBtn, carrinhoBtn, contadorCarrinho, fabCarrinho, fabContadorCarrinho;
let carrinhoItensContainer, carrinhoTotalSpan, notificacao, btnFinalizar;
let customizacaoModal, fecharCustomizacaoBtn, btnAdicionarCustomizado, listaAdicionaisContainer;
let btnAnexarLocalizacao, localizacaoStatus;

let coordenadasEnviadas = '';

// =======================================================
// UTILIDADES
// =======================================================

function mostrarModal(modalElement, mostrar) {
    if (!modalElement) return;
    modalElement.style.display = mostrar ? 'block' : 'none';
    document.body.style.overflow = mostrar ? 'hidden' : 'auto';
}

function formatarMoeda(valor) {
    const num = parseFloat(valor) || 0;
    return num.toFixed(2).replace('.', ',');
}

function showNotification(message) {
    if (!notificacao) return;
    notificacao.textContent = message;
    notificacao.classList.add('show');
    setTimeout(() => notificacao.classList.remove('show'), 2000);
}

// =======================================================
// CONTADOR
// =======================================================

function updateContadorCarrinho() {
    if (!Array.isArray(carrinho)) carrinho = [];

    const totalItens = carrinho.reduce((acc, item) => acc + (item.quantidade || 0), 0);

    if (contadorCarrinho) contadorCarrinho.textContent = totalItens;
    if (fabContadorCarrinho) fabContadorCarrinho.textContent = totalItens;
}

// =======================================================
// RENDER CARRINHO
// =======================================================

function renderizarCarrinho() {
    if (!Array.isArray(carrinho)) carrinho = [];

    if (!carrinhoItensContainer || !carrinhoTotalSpan) return;

    carrinhoItensContainer.innerHTML = '';
    let totalCarrinho = 0;

    if (carrinho.length === 0) {
        carrinhoItensContainer.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
        carrinhoTotalSpan.textContent = formatarMoeda(0);
        if (btnFinalizar) btnFinalizar.disabled = true;
        return;
    }

    if (btnFinalizar) btnFinalizar.disabled = false;

    carrinho.forEach((item, index) => {
        const precoUnitario = item.precoTotal ?? item.preco ?? 0;
        const precoTotalItem = precoUnitario * item.quantidade;
        totalCarrinho += precoTotalItem;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('carrinho-item');

        let adicionaisHTML = '';
        if (item.adicionais?.length > 0) {
            adicionaisHTML = `
                <div class="item-adicionais">
                    ${item.adicionais.map(add =>
                        `<span>+ ${add.nome} (R$ ${formatarMoeda(add.preco)})</span>`
                    ).join('')}
                </div>
            `;
        }

        itemDiv.innerHTML = `
            <div class="item-info">
                <span class="item-nome">${item.nome} (x${item.quantidade})</span>
                <span class="item-preco">R$ ${formatarMoeda(precoTotalItem)}</span>
                ${adicionaisHTML}
            </div>
            <div class="item-controles">
                <button class="remover-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        carrinhoItensContainer.appendChild(itemDiv);
    });

    carrinhoTotalSpan.textContent = formatarMoeda(totalCarrinho);

    bindEventosCarrinho();
}

// =======================================================
// EVENTOS DO CARRINHO
// =======================================================

function bindEventosCarrinho() {
    document.querySelectorAll('.remover-item').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            removerItem(index);
        };
    });
}

function removerItem(index) {
    if (!Array.isArray(carrinho)) return;
    if (index < 0 || index >= carrinho.length) return;

    carrinho.splice(index, 1);

    try {
        localStorage.setItem('carrinhoJottaV', JSON.stringify(carrinho));
    } catch (e) {}

    renderizarCarrinho();
    updateContadorCarrinho();
    showNotification('Item removido!');
}

// =======================================================
// GEOLOCALIZAÇÃO
// =======================================================

function solicitarLocalizacao() {
    if (!localizacaoStatus || !btnAnexarLocalizacao) return;

    coordenadasEnviadas = '';
    localizacaoStatus.textContent = 'Buscando localização...';
    btnAnexarLocalizacao.disabled = true;

    if (!navigator.geolocation) {
        localizacaoStatus.textContent = 'Não suportado.';
        btnAnexarLocalizacao.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            coordenadasEnviadas = `${pos.coords.latitude},${pos.coords.longitude}`;
            localizacaoStatus.textContent = 'Localização OK';
            btnAnexarLocalizacao.disabled = false;
        },
        () => {
            localizacaoStatus.textContent = 'Erro ao obter localização';
            btnAnexarLocalizacao.disabled = false;
        },
        { timeout: 15000 }
    );
}

// =======================================================
// CHECKOUT
// =======================================================

function finalizarPedido() {
    if (!Array.isArray(carrinho) || carrinho.length === 0) {
        alert('Carrinho vazio!');
        return;
    }

    const nome = document.getElementById('nome-cliente')?.value.trim() || '';
    const endereco = document.getElementById('endereco-cliente')?.value.trim() || '';
    const bairro = document.getElementById('bairro-cliente')?.value.trim() || '';
    const pagamento = document.getElementById('forma-pagamento')?.value || '';

    let mensagem = `🍔 *PEDIDO*\n\n`;
    mensagem += `👤 ${nome}\n📍 ${bairro}\n🏠 ${endereco}\n\n`;

    let total = 0;

    carrinho.forEach((item, i) => {
        const preco = item.precoTotal ?? item.preco ?? 0;
        const subtotal = preco * item.quantidade;
        total += subtotal;

        mensagem += `${i + 1}. ${item.nome} x${item.quantidade} - R$ ${formatarMoeda(subtotal)}\n`;
    });

    mensagem += `\n💰 TOTAL: R$ ${formatarMoeda(total)}\n`;
    mensagem += `💳 ${pagamento || 'Não informado'}\n`;

    const numero = window.siteConfig?.negocio?.whatsapp || '';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');

    carrinho = [];
    localStorage.removeItem('carrinhoJottaV');

    renderizarCarrinho();
    updateContadorCarrinho();
    mostrarModal(carrinhoModal, false);
}

// =======================================================
// INIT
// =======================================================

function init() {
    if (!Array.isArray(window.carrinho)) window.carrinho = [];

    carrinhoModal = document.getElementById('carrinho-modal');
    fecharModalBtn = document.querySelector('.fechar-modal');
    carrinhoItensContainer = document.getElementById('carrinho-itens');
    carrinhoTotalSpan = document.getElementById('carrinho-total');
    contadorCarrinho = document.getElementById('contador-carrinho');
    fabContadorCarrinho = document.getElementById('fab-contador-carrinho');
    notificacao = document.getElementById('notificacao');
    btnFinalizar = document.getElementById('btn-finalizar-pedido');
    btnAnexarLocalizacao = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus = document.getElementById('localizacao-status');

    renderizarCarrinho();
    updateContadorCarrinho();
}

document.addEventListener('DOMContentLoaded', init);
