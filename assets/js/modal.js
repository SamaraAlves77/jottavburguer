// modal_carrinho.js - Lógica de UI do Carrinho, Checkout e Geolocalização

// =======================================================
// VARIÁVEIS DE ESTADO E REFERÊNCIAS DO DOM (Globais)
// =======================================================
let carrinhoModal, fecharModalBtn, carrinhoBtn, contadorCarrinho, fabCarrinho, fabContadorCarrinho, carrinhoItensContainer, carrinhoTotalSpan, notificacao, btnFinalizar, customizacaoModal, fecharCustomizacaoBtn, btnAdicionarCustomizado, listaAdicionaisContainer;
let btnAnexarLocalizacao;
let localizacaoStatus;
let coordenadasEnviadas = '';

// =======================================================
// FUNÇÕES DE UTILIDADE E UI
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
    setTimeout(() => {
        notificacao.classList.remove('show');
    }, 2000);
}

function updateContadorCarrinho() {
    const totalItens = (carrinho || []).reduce((acc, item) => acc + (item.quantidade || 0), 0);
    if (contadorCarrinho) contadorCarrinho.textContent = totalItens;
    if (fabContadorCarrinho) fabContadorCarrinho.textContent = totalItens;
    const bottomBadge = document.getElementById('bottom-nav-badge');
    if (bottomBadge) {
        bottomBadge.textContent = totalItens;
        bottomBadge.style.display = totalItens > 0 ? 'flex' : 'none';
    }
}

function renderizarCarrinho() {
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
        // CORREÇÃO: usa nullish coalescing para evitar falsy 0
        const precoUnitario = item.precoTotal ?? item.preco ?? 0;
        const precoTotalItem = precoUnitario * item.quantidade;
        totalCarrinho += precoTotalItem;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('carrinho-item');
        itemDiv.setAttribute('data-index', index);

        let adicionaisHTML = '';
        if (item.adicionais && item.adicionais.length > 0) {
            const adicionaisStr = item.adicionais.map(add =>
                `<span>+ ${add.nome} (R$ ${formatarMoeda(add.preco)})</span>`
            ).join('');
            adicionaisHTML = `<div class="item-adicionais">${adicionaisStr}</div>`;
        }

        itemDiv.innerHTML = `
            <div class="item-info">
                <span class="item-nome">${item.nome} (x${item.quantidade})</span>
                <span class="item-preco">R$ ${formatarMoeda(precoTotalItem)}</span>
                ${adicionaisHTML}
            </div>
            <div class="item-controles">
                <button class="remover-item" onclick="removerItem(${index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        carrinhoItensContainer.appendChild(itemDiv);
    });

    carrinhoTotalSpan.textContent = formatarMoeda(totalCarrinho);
}

function removerItem(index) {
    if (!carrinho || index < 0 || index >= carrinho.length) return;
    carrinho.splice(index, 1);
    try { localStorage.setItem('carrinhoJottaV', JSON.stringify(carrinho)); } catch(e) {}
    renderizarCarrinho();
    updateContadorCarrinho();
    showNotification('Item removido do carrinho!');
}

// =======================================================
// LÓGICA DE GEOLOCALIZAÇÃO
// =======================================================

function solicitarLocalizacao() {
    if (!localizacaoStatus || !btnAnexarLocalizacao) return;

    coordenadasEnviadas = '';
    localizacaoStatus.textContent = 'Buscando sua localização...';
    btnAnexarLocalizacao.disabled = true;

    if (!navigator.geolocation) {
        localizacaoStatus.textContent = 'Geolocalização não é suportada pelo seu navegador.';
        btnAnexarLocalizacao.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Salva as coordenadas REAIS do cliente
            coordenadasEnviadas = `${lat},${lon}`;
            localizacaoStatus.textContent = '✅ Localização anexada com sucesso!';
            localizacaoStatus.style.color = '#45a135';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-check-circle"></i> Localização Anexada!';
        },
        (error) => {
            coordenadasEnviadas = '';
            let mensagemErro = 'Erro ao obter localização.';
            if (error.code === error.PERMISSION_DENIED) {
                mensagemErro = 'Permissão negada. Habilite a localização no seu navegador.';
            } else if (error.code === error.TIMEOUT) {
                mensagemErro = 'Tempo esgotado. Tente novamente.';
            }
            localizacaoStatus.textContent = mensagemErro;
            localizacaoStatus.style.color = '#e53935';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Tentar Novamente';
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// =======================================================
// LÓGICA DE CHECKOUT (WhatsApp)
// =======================================================

function finalizarPedido() {
    if (!carrinho || carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nomeInput = document.getElementById('nome-cliente');
    const bairroInput = document.getElementById('bairro-cliente');
    const enderecoInput = document.getElementById('endereco-cliente');
    const pagamentoSelect = document.getElementById('forma-pagamento');
    const observacoesInput = document.getElementById('observacoes-pedido');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const bairro = bairroInput ? bairroInput.value.trim() : '';
    const endereco = enderecoInput ? enderecoInput.value.trim() : '';
    const pagamento = pagamentoSelect ? pagamentoSelect.value : '';
    const observacoes = observacoesInput ? observacoesInput.value.trim() : '';

    // Usa config.json se disponível
    const wa = (window.siteConfig && window.siteConfig.whatsapp) ? window.siteConfig.whatsapp : {};
    const SEP  = wa.separador       || '━━━━━━━━━━━━━━━━━━━━━━';
    const HDR  = wa.header          || '🍔 *PEDIDO - JottaV BURGUER* 🍔';
    const LBL_DADOS = wa.label_dados || '*📋 DADOS DO CLIENTE:*';
    const LBL_ITENS = wa.label_itens || '*🛒 ITENS DO PEDIDO:*';
    const LBL_TOTAL = wa.label_total || '💵 *TOTAL DO PEDIDO:*';
    const LBL_PAG   = wa.label_pagamento || '💳 *PAGAMENTO:*';
    const LBL_OBS   = wa.label_observacoes || '📝 *OBSERVAÇÕES:*';
    const LBL_TAXA  = wa.label_taxa  || '🛵 *TAXA DE ENTREGA:* A confirmar';
    const LBL_TAXA_SUB = wa.label_taxa_sub || '_(Por favor, informe se há taxa de entrega para o endereço acima)_';
    const LBL_LOC   = wa.label_localizacao || '📌 *LOCALIZAÇÃO DO CLIENTE:*';
    const CIDADE    = wa.cidade      || '';
    const NUMERO    = wa.numero      || '';

    // Cabeçalho
    let mensagem = `${HDR}\n`;
    mensagem += `${SEP}\n`;
    mensagem += `${LBL_DADOS}\n`;
    mensagem += `👤 *Nome:* ${nome || 'Não informado'}\n`;
    mensagem += `📍 *Bairro:* ${bairro || 'Não informado'}\n`;
    mensagem += `🏠 *Endereço:* ${endereco || 'Não informado'}\n`;
    mensagem += `${SEP}\n`;

    // Itens do pedido
    mensagem += `${LBL_ITENS}\n\n`;

    let totalPedido = 0;

    carrinho.forEach((item, index) => {
        // CORREÇÃO: usa nullish coalescing para preço correto
        const precoBase = item.preco ?? 0;
        const precoComAdicionais = item.precoTotal ?? precoBase;
        const totalItem = precoComAdicionais * item.quantidade;
        totalPedido += totalItem;

        // Item com adicionais: mostra base + adicionais + subtotal
        if (item.adicionais && item.adicionais.length > 0) {
            mensagem += `*${index + 1}. ${item.nome}* (x${item.quantidade})\n`;
            mensagem += `   Preço base: R$ ${formatarMoeda(precoBase)}\n`;
            item.adicionais.forEach(add => {
                mensagem += `   ➕ ${add.nome}: R$ ${formatarMoeda(add.preco)}\n`;
            });
            mensagem += `   💰 Subtotal: *R$ ${formatarMoeda(totalItem)}*\n\n`;
        } else {
            // Item simples: mostra direto
            mensagem += `*${index + 1}. ${item.nome}* (x${item.quantidade}) — R$ ${formatarMoeda(totalItem)}\n\n`;
        }
    });

    mensagem += `${SEP}\n`;
    mensagem += `${LBL_TOTAL} R$ ${formatarMoeda(totalPedido)}\n`;
    mensagem += `${LBL_PAG} ${pagamento ? pagamento.replace('_', ' ').toUpperCase() : 'Não escolhido'}\n`;

    if (observacoes) {
        mensagem += `${LBL_OBS} ${observacoes}\n`;
    }

    // Taxa de entrega
    mensagem += `${SEP}\n`;
    mensagem += `${LBL_TAXA}\n`;
    mensagem += `${LBL_TAXA_SUB}\n`;

    // Localização: GPS (se anexado) OU endereço digitado como fallback
    mensagem += `${SEP}\n`;
    mensagem += `${LBL_LOC}\n`;

    if (coordenadasEnviadas) {
        const urlMaps = `https://www.google.com/maps?q=${coordenadasEnviadas}`;
        const urlWaze = `https://waze.com/ul?ll=${coordenadasEnviadas}&navigate=yes`;
        mensagem += `🗺️ Google Maps: ${urlMaps}\n`;
        mensagem += `🚗 Waze: ${urlWaze}\n`;
    } else {
        const enderecoTexto = [endereco, bairro].filter(Boolean).join(', ');
        if (enderecoTexto) {
            const cidade = window.siteConfig?.negocio?.cidade || 'sua cidade';
            const estado = window.siteConfig?.negocio?.estado || '';
            const localidade = estado ? `${cidade}, ${estado}` : cidade;
            const query = encodeURIComponent(enderecoTexto + ', ' + localidade);
            const urlMaps = `https://www.google.com/maps/search/?q=${query}`;
            const urlWaze = `https://waze.com/ul?q=${query}`;
            mensagem += `🗺️ Google Maps: ${urlMaps}\n`;
            mensagem += `🚗 Waze: ${urlWaze}\n`;
            mensagem += `_(Gerado pelo endereço informado)_\n`;
        } else {
            mensagem += `_(Localização não informada)_\n`;
        }
    }

    // Número do WhatsApp do config (sem hardcode)
    const numero = window.siteConfig?.negocio?.whatsapp
        || window.siteConfig?.whatsapp?.numero
        || '';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');

    // Limpa o carrinho (memória + localStorage)
    carrinho = [];
    try { localStorage.removeItem('carrinhoJottaV'); } catch(e) {}
    renderizarCarrinho();
    updateContadorCarrinho();
    mostrarModal(carrinhoModal, false);

    // Reseta o botão de localização
    coordenadasEnviadas = '';
    if (btnAnexarLocalizacao) {
        btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Anexar Localização (Opcional)';
        btnAnexarLocalizacao.disabled = false;
    }
    if (localizacaoStatus) {
        localizacaoStatus.textContent = '';
        localizacaoStatus.style.color = '';
    }
}

// =======================================================
// INICIALIZAÇÃO
// =======================================================

function init() {
    // Garantir que carrinho existe antes de usar
    if (typeof carrinho === 'undefined') window.carrinho = [];

    carrinhoModal = document.getElementById('carrinho-modal');
    fecharModalBtn = carrinhoModal ? carrinhoModal.querySelector('.fechar-modal') : null;
    carrinhoItensContainer = document.getElementById('carrinho-itens');
    carrinhoTotalSpan = document.getElementById('carrinho-total');
    btnFinalizar = document.getElementById('btn-finalizar-pedido');
    btnAnexarLocalizacao = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus = document.getElementById('localizacao-status');

    renderizarCarrinho();
    updateContadorCarrinho();

    if (fecharModalBtn) {
        fecharModalBtn.addEventListener('click', () => mostrarModal(carrinhoModal, false));
    }
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarPedido);
    }
    if (btnAnexarLocalizacao) {
        btnAnexarLocalizacao.addEventListener('click', solicitarLocalizacao);
    }
}

document.addEventListener('DOMContentLoaded', init);
