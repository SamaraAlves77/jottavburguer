// modal.js — JottaV Burguer v3.1
// Carrinho, Checkout, Geolocalização

let carrinhoModal, fecharModalBtn, carrinhoBtn, contadorCarrinho,
    fabCarrinho, fabContadorCarrinho, carrinhoItensContainer,
    carrinhoTotalSpan, notificacao, btnFinalizar,
    customizacaoModal, fecharCustomizacaoBtn, btnAdicionarCustomizado,
    listaAdicionaisContainer, btnAnexarLocalizacao, localizacaoStatus;

let coordenadasEnviadas = '';

// ==========================================
// UTILITÁRIOS
// ==========================================

function mostrarModal(modalElement, mostrar) {
    if (!modalElement) return;
    modalElement.style.display = mostrar ? 'block' : 'none';
    document.body.style.overflow = mostrar ? 'hidden' : 'auto';
}

function formatarMoeda(valor) {
    return parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

function showNotification(msg) {
    const el = document.getElementById('notificacao');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
}

function updateContadorCarrinho() {
    const total = (window.carrinho || []).reduce((s, i) => s + (i.quantidade || 0), 0);
    if (contadorCarrinho)       contadorCarrinho.textContent = total;
    if (fabContadorCarrinho)    fabContadorCarrinho.textContent = total;
    const bottomBadge = document.getElementById('bottom-nav-badge');
    if (bottomBadge) {
        bottomBadge.textContent = total;
        bottomBadge.style.display = total > 0 ? 'flex' : 'none';
    }
}

// ==========================================
// RENDERIZAR CARRINHO
// ==========================================

function renderizarCarrinho() {
    if (!carrinhoItensContainer || !carrinhoTotalSpan) return;

    carrinhoItensContainer.innerHTML = '';
    const vazioMsg = document.getElementById('carrinho-vazio-msg');
    const finalizarEl = document.getElementById('carrinho-finalizar');
    const totalContainer = document.getElementById('carrinho-total-container');
    const btnLimpar = document.getElementById('btn-limpar-carrinho');

    if (!window.carrinho || window.carrinho.length === 0) {
        if (vazioMsg)       vazioMsg.style.display = 'flex';
        if (finalizarEl)    finalizarEl.style.display = 'none';
        if (totalContainer) totalContainer.style.display = 'none';
        if (btnLimpar)      btnLimpar.style.display = 'none';
        carrinhoTotalSpan.textContent = '0,00';
        return;
    }

    if (vazioMsg)       vazioMsg.style.display = 'none';
    if (finalizarEl)    finalizarEl.style.display = 'flex';
    if (totalContainer) totalContainer.style.display = 'flex';
    if (btnLimpar)      btnLimpar.style.display = 'flex';

    let total = 0;

    window.carrinho.forEach((item, index) => {
        const precoUnit  = item.precoTotal ?? item.preco ?? 0;
        const precoTotal = precoUnit * item.quantidade;
        total += precoTotal;

        const imgSrc = item.imagem ? `imagens/${item.imagem}` : 'assets/img/hamburguer.png';

        let adicionaisHTML = '';
        if (item.adicionais && item.adicionais.length > 0) {
            adicionaisHTML = `<div class="item-adicionais">
                ${item.adicionais.map(a =>
                    `<span>+ ${a.nome} (R$ ${formatarMoeda(a.preco)})</span>`
                ).join('')}
            </div>`;
        }

        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <img src="${imgSrc}" alt="${item.nome}" class="carrinho-item-img"
                 onerror="this.src='assets/img/hamburguer.png'">
            <div class="item-info">
                <span class="item-nome">${item.nome} (x${item.quantidade})</span>
                ${adicionaisHTML}
                <span class="item-preco">R$ ${formatarMoeda(precoTotal)}</span>
            </div>
            <div class="item-controles">
                <button class="remover-item" onclick="removerItem(${index})" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        carrinhoItensContainer.appendChild(div);
    });

    carrinhoTotalSpan.textContent = formatarMoeda(total);
}

function removerItem(index) {
    if (!window.carrinho || index < 0 || index >= window.carrinho.length) return;
    window.carrinho.splice(index, 1);
    try { localStorage.setItem('carrinhoJottaV', JSON.stringify(window.carrinho)); } catch(e) {}
    renderizarCarrinho();
    updateContadorCarrinho();
    showNotification('Item removido!');
}

function limparCarrinho() {
    window.carrinho = [];
    try { localStorage.removeItem('carrinhoJottaV'); } catch(e) {}
    renderizarCarrinho();
    updateContadorCarrinho();
}

// ==========================================
// GEOLOCALIZAÇÃO
// ==========================================

function solicitarLocalizacao() {
    if (!localizacaoStatus || !btnAnexarLocalizacao) return;
    coordenadasEnviadas = '';
    localizacaoStatus.textContent = 'Buscando localização...';
    localizacaoStatus.style.color = hslVar('muted-foreground');
    btnAnexarLocalizacao.disabled = true;

    if (!navigator.geolocation) {
        localizacaoStatus.textContent = 'Geolocalização não suportada neste navegador.';
        btnAnexarLocalizacao.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            coordenadasEnviadas = `${pos.coords.latitude},${pos.coords.longitude}`;
            localizacaoStatus.textContent = '✅ Localização anexada!';
            localizacaoStatus.style.color = 'hsl(142 70% 45%)';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-check-circle"></i> Localização Anexada';
        },
        (err) => {
            coordenadasEnviadas = '';
            localizacaoStatus.textContent = err.code === 1
                ? 'Permissão negada. Habilite a localização.'
                : 'Erro ao obter localização. Tente novamente.';
            localizacaoStatus.style.color = 'hsl(0 72% 50%)';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Tentar Novamente';
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

function hslVar(name) {
    return `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim()})`;
}

// ==========================================
// CHECKOUT / WHATSAPP
// ==========================================

function finalizarPedido() {
    if (!window.carrinho || window.carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nome       = document.getElementById('nome-cliente')?.value.trim() || '';
    const bairro     = document.getElementById('bairro-cliente')?.value.trim() || '';
    const endereco   = document.getElementById('endereco-cliente')?.value.trim() || '';
    const pagamento  = document.getElementById('forma-pagamento')?.value || '';
    const obs        = document.getElementById('observacoes-pedido')?.value.trim() || '';

    const wa  = window.siteConfig?.whatsapp_msg || {};
    const SEP = wa.separador       || '━━━━━━━━━━━━━━━━━━━━━━';
    const HDR = wa.header          || '🍔 *PEDIDO - JottaV BURGUER* 🍔';

    let msg = `${HDR}\n${SEP}\n`;
    msg += `*📋 DADOS DO CLIENTE:*\n`;
    msg += `👤 *Nome:* ${nome || 'Não informado'}\n`;
    msg += `📍 *Bairro:* ${bairro || 'Não informado'}\n`;
    msg += `🏠 *Endereço:* ${endereco || 'Não informado'}\n`;
    msg += `${SEP}\n*🛒 ITENS DO PEDIDO:*\n\n`;

    let totalPedido = 0;

    window.carrinho.forEach((item, i) => {
        const precoBase     = item.preco ?? 0;
        const precoComAdd   = item.precoTotal ?? precoBase;
        const totalItem     = precoComAdd * item.quantidade;
        totalPedido += totalItem;

        if (item.adicionais && item.adicionais.length > 0) {
            msg += `*${i + 1}. ${item.nome}* (x${item.quantidade})\n`;
            msg += `   Base: R$ ${formatarMoeda(precoBase)}\n`;
            item.adicionais.forEach(a => { msg += `   ➕ ${a.nome}: R$ ${formatarMoeda(a.preco)}\n`; });
            msg += `   💰 Subtotal: *R$ ${formatarMoeda(totalItem)}*\n\n`;
        } else {
            msg += `*${i + 1}. ${item.nome}* (x${item.quantidade}) — R$ ${formatarMoeda(totalItem)}\n\n`;
        }
    });

    msg += `${SEP}\n`;
    msg += `💵 *TOTAL:* R$ ${formatarMoeda(totalPedido)}\n`;
    msg += `💳 *PAGAMENTO:* ${pagamento ? pagamento.replace(/_/g, ' ').toUpperCase() : 'Não informado'}\n`;
    if (obs) msg += `📝 *OBS:* ${obs}\n`;
    msg += `${SEP}\n🛵 *TAXA DE ENTREGA:* A confirmar\n${SEP}\n`;

    // Localização
    msg += `📌 *LOCALIZAÇÃO:*\n`;
    if (coordenadasEnviadas) {
        msg += `🗺️ Google Maps: https://www.google.com/maps?q=${coordenadasEnviadas}\n`;
        msg += `🚗 Waze: https://waze.com/ul?ll=${coordenadasEnviadas}&navigate=yes\n`;
    } else if (endereco || bairro) {
        const cidade  = window.siteConfig?.negocio?.cidade || '';
        const estado  = window.siteConfig?.negocio?.estado || '';
        const local   = [endereco, bairro, cidade, estado].filter(Boolean).join(', ');
        const q       = encodeURIComponent(local);
        msg += `🗺️ Google Maps: https://www.google.com/maps/search/?q=${q}\n`;
        msg += `🚗 Waze: https://waze.com/ul?q=${q}\n`;
        msg += `_(Gerado pelo endereço informado)_\n`;
    } else {
        msg += `_(Localização não informada)_\n`;
    }

    const numero = window.siteConfig?.negocio?.whatsapp || '';
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');

    // Limpa carrinho
    limparCarrinho();
    mostrarModal(carrinhoModal, false);

    // Reset localização
    coordenadasEnviadas = '';
    if (btnAnexarLocalizacao) {
        btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Anexar Localização (Opcional)';
        btnAnexarLocalizacao.disabled = false;
    }
    if (localizacaoStatus) { localizacaoStatus.textContent = ''; }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function init() {
    if (typeof window.carrinho === 'undefined') window.carrinho = [];

    carrinhoModal           = document.getElementById('carrinho-modal');
    fecharModalBtn          = carrinhoModal?.querySelector('.fechar-modal');
    carrinhoItensContainer  = document.getElementById('carrinho-itens');
    carrinhoTotalSpan       = document.getElementById('carrinho-total');
    btnFinalizar            = document.getElementById('btn-finalizar-pedido');
    btnAnexarLocalizacao    = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus       = document.getElementById('localizacao-status');
    customizacaoModal       = document.getElementById('customizacao-modal');
    fecharCustomizacaoBtn   = customizacaoModal?.querySelector('.fechar-customizacao');
    btnAdicionarCustomizado = document.getElementById('btn-adicionar-customizado');

    renderizarCarrinho();
    updateContadorCarrinho();

    fecharModalBtn?.addEventListener('click', () => mostrarModal(carrinhoModal, false));
    fecharCustomizacaoBtn?.addEventListener('click', () => mostrarModal(customizacaoModal, false));
    btnFinalizar?.addEventListener('click', finalizarPedido);
    btnAnexarLocalizacao?.addEventListener('click', solicitarLocalizacao);

    document.getElementById('btn-limpar-carrinho')?.addEventListener('click', limparCarrinho);

    // Fechar modal clicando fora
    [carrinhoModal, customizacaoModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) mostrarModal(modal, false);
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
