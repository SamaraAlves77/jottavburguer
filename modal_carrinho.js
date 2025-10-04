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
    // Garante que a formatação não falhe com valores nulos ou inválidos
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
    // Garante que o array carrinho exista, mesmo que vazio
    const totalItens = (carrinho || []).reduce((acc, item) => acc + (item.quantidade || 0), 0);
    if (contadorCarrinho) contadorCarrinho.textContent = totalItens;
    if (fabContadorCarrinho) fabContadorCarrinho.textContent = totalItens;
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
        // Usa precoTotal se existir (para customizados), senão usa preco
        const precoUnitario = item.precoTotal || item.preco || 0; 
        const precoTotalItem = precoUnitario * item.quantidade;
        totalCarrinho += precoTotalItem;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('carrinho-item');
        itemDiv.setAttribute('data-index', index);

        // Adicionais
        let adicionaisHTML = '';
        if (item.adicionais && item.adicionais.length > 0) {
            const adicionaisStr = item.adicionais.map(add => 
                `+ ${add.nome} (R$ ${formatarMoeda(add.preco)})`
            ).join(', ');
            adicionaisHTML = `<p class="item-adicionais">Adicionais: ${adicionaisStr}</p>`;
        }
        
        // NOVO HTML: Apenas o botão de lixeira no item-controles
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

// A função alterarQuantidade foi removida, pois os botões foram excluídos.

function removerItem(index) {
    if (!carrinho || index < 0 || index >= carrinho.length) return;

    carrinho.splice(index, 1);

    // Atualiza o localStorage e a UI
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    renderizarCarrinho();
    updateContadorCarrinho();
    showNotification('Item removido do carrinho!');
}

// =======================================================
// LÓGICA DE GEOLOCALIZAÇÃO (Corrigida: Timeout aumentado e texto de erro limpo)
// =======================================================

function solicitarLocalizacao() {
    if (!localizacaoStatus || !btnAnexarLocalizacao) return;

    localizacaoStatus.textContent = 'Buscando localização...';
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
            // Salva APENAS as coordenadas no formato 'LAT,LON'
            coordenadasEnviadas = `${lat},${lon}`;
            localizacaoStatus.textContent = 'Localização Anexada com Sucesso!';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.classList.add('localizacao-anexada');
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-check-circle"></i> Localização Anexada!';
        },
        (error) => {
            coordenadasEnviadas = '';
            // Texto de erro simplificado
            localizacaoStatus.textContent = `Erro ao obter localização: ${error.message}.`;
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.classList.remove('localizacao-anexada');
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Anexar Localização (Opcional)';
        },
        // TIMEOUT AUMENTADO PARA 15 SEGUNDOS (15000 ms)
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
    );
}

// =======================================================
// LÓGICA DE CHECKOUT (WhatsApp) (Corrigida: Link formatado e condicional)
// =======================================================

function finalizarPedido() {
    // 1. Coleta os dados do DOM
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
    
    // VARIÁVEL TEMPORÁRIA para guardar o link do GPS
    let linkGpsFinal = ''; 

    // 3. Monta o cabeçalho da mensagem
    let mensagem = `*PEDIDO JottaV BURGUER*\n`;
    mensagem += `*DADOS DO CLIENTE:*\n`;
    mensagem += `*Nome:* ${nome || 'Não Informado'}\n`;
    mensagem += `*Bairro:* ${bairro || 'Não Informado'}\n`;
    mensagem += `*Endereço:* ${endereco || 'Não Informado'}\n`;
    
    // NOVO BLOCO GPS: Prepara o link clicável APENAS SE A LOCALIZAÇÃO FOI OBTIDA
    if (coordenadasEnviadas) {
        // CORREÇÃO FINAL: Usa concatenação (+) para ser robusto no WhatsApp
        const urlGps = "https://maps.google.com9" + coordenadasEnviadas;
        
        // Monta a string que será adicionada à mensagem
        linkGpsFinal = `\n*LINK DE RASTREAMENTO GPS:*\n${urlGps}\n`;
    }
    
    // 4. Monta a lista de itens
    mensagem += `*ITENS DO PEDIDO (${carrinho.length} itens):*\n`;

    let totalPedido = 0;
    carrinho.forEach((item, index) => {
        const precoItem = item.precoTotal || item.preco || 0;
        const totalItem = precoItem * item.quantidade;
        totalPedido += totalItem;

        // Linha principal do item
        mensagem += `*${index + 1}. ${item.nome} (x${item.quantidade}) - R$ ${formatarMoeda(totalItem)}*\n`;
        
        // Adiciona os adicionais, se houver
        if (item.adicionais && item.adicionais.length > 0) {
            const adicionaisStr = item.adicionais.map(add => 
                `    + ${add.nome} (R$ ${formatarMoeda(add.preco)})`
            ).join('\n');
            mensagem += `${adicionaisStr}\n`;
        }
    });

    // 5. Monta o rodapé e Observações
    mensagem += `*TOTAL: R$ ${formatarMoeda(totalPedido)}*\n`;
    mensagem += `*FORMA DE PAGAMENTO:* ${pagamento ? pagamento.replace('_', ' ').toUpperCase() : 'Não Escolhida'}\n`;
    
    if (observacoes) {
        mensagem += `*OBSERVAÇÕES:* ${observacoes}\n`;
    } else {
        mensagem += `*OBSERVAÇÕES:* Nenhuma.\n`;
    }

    // AQUI: Adiciona o link do GPS APENAS SE ELE FOI GERADO
    mensagem += linkGpsFinal;

    // 6. Envia para o WhatsApp
    const numero = '5586994253258'; // Seu número de WhatsApp (incluir o 55 e DDD)
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
    
    // 7. Limpa o carrinho após o envio
    carrinho = [];
    localStorage.removeItem('carrinho');
    renderizarCarrinho();
    updateContadorCarrinho();
    mostrarModal(carrinhoModal, false);
}

// =======================================================
// INICIALIZAÇÃO E EVENT LISTENERS (Função para ligar o HTML ao JS)
// =======================================================

function init() {
    // Referências principais
    carrinhoModal = document.getElementById('carrinho-modal');
    fecharModalBtn = carrinhoModal ? carrinhoModal.querySelector('.fechar-modal') : null;
    carrinhoItensContainer = document.getElementById('carrinho-itens');
    carrinhoTotalSpan = document.getElementById('carrinho-total');
    btnFinalizar = document.getElementById('btn-finalizar-pedido');
    
    // Referências de Geolocalização (usando IDs do seu HTML)
    btnAnexarLocalizacao = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus = document.getElementById('localizacao-status');

    // Inicializa o carrinho e o contador ao carregar a página
    renderizarCarrinho();
    updateContadorCarrinho();

    // Event Listeners
    if (fecharModalBtn) {
        fecharModalBtn.addEventListener('click', () => mostrarModal(carrinhoModal, false));
    }

    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarPedido);
    }
    
    // Associa o botão de GPS à função de solicitação
    if (btnAnexarLocalizacao) {
        btnAnexarLocalizacao.addEventListener('click', solicitarLocalizacao);
    }
    
    // Adicione outras referências de DOM globais aqui, se necessário.
}

// Garante que a inicialização aconteça após o carregamento do DOM
document.addEventListener('DOMContentLoaded', init);
