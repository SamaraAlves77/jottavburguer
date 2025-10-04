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

function updateContadorCarrinho() {
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
        const precoUnitario = item.precoTotal || item.preco || 0; 
        const precoTotalItem = precoUnitario * item.quantidade;
        totalCarrinho += precoTotalItem;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('carrinho-item');
        itemDiv.setAttribute('data-index', index);

        let adicionaisHTML = '';
        if (item.adicionais && item.adicionais.length > 0) {
            const adicionaisStr = item.adicionais.map(add => 
                `+ ${add.nome} (R$ ${formatarMoeda(add.preco)})`
            ).join(', ');
            adicionaisHTML = `<p class="item-adicionais">Adicionais: ${adicionaisStr}</p>`;
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
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    renderizarCarrinho();
    updateContadorCarrinho();
}

// =======================================================
// LÓGICA DE GEOLOCALIZAÇÃO
// =======================================================

function solicitarLocalizacao() {
    if (!localizacaoStatus || !btnAnexarLocalizacao) return;

    // Limpa a variável para garantir que não use um valor antigo (como o do Starbucks).
    coordenadasEnviadas = ''; 
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
            // Salva a localização EXATA do dispositivo.
            coordenadasEnviadas = `${lat},${lon}`;
            localizacaoStatus.textContent = 'Localização Anexada com Sucesso!';
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.classList.add('localizacao-anexada');
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-check-circle"></i> Localização Anexada!';
        },
        (error) => {
            coordenadasEnviadas = '';
            // Exibe a mensagem de erro (como 'Timeout expired' ou 'Permissão negada').
            localizacaoStatus.textContent = `Erro ao obter localização: ${error.message}. Verifique a permissão do seu navegador.`;
            btnAnexarLocalizacao.disabled = false;
            btnAnexarLocalizacao.classList.remove('localizacao-anexada');
            btnAnexarLocalizacao.innerHTML = '<i class="fas fa-map-marker-alt"></i> Anexar Localização (Opcional)';
        },
        // OTIMIZAÇÃO: Forçando nova leitura (maximumAge: 0) e 15s de espera.
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
    );
}

// =======================================================
// LÓGICA DE CHECKOUT (WhatsApp)
// =======================================================

function finalizarPedido() {
    // 1. Coleta os dados
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
    
    let linkGpsFinal = ''; 

    // 3. Monta o cabeçalho
    let mensagem = `*PEDIDO JottaV BURGUER*\n`;
    mensagem += `*DADOS DO CLIENTE:*\n`;
    mensagem += `*Nome:* ${nome || 'Não Informado'}\n`;
    mensagem += `*Bairro:* ${bairro || 'Não Informado'}\n`;
    mensagem += `*Endereço:* ${endereco || 'Não Informado'}\n`;
    
    // BLOCO GPS: Usa a sintaxe que você forneceu.
    if (coordenadasEnviadas) {
        // CORREÇÃO: Usando a URL específica para forçar o preview de mapa.
        const urlGps = "https://www.google.com/maps/place/2%C2%B053'35.7%22S+41%C2%B042'10.9%22W/@-2.8932582,-41.7055957,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-2.8932582!4d-41.7030208?hl=pt-BR&entry=ttu&g_ep=EgoyMDI1MTAwMS4wIKXMDSoASAFQAw%3D%3D" + coordenadasEnviadas;
        
        linkGpsFinal = `\n*LINK DE RASTREAMENTO GPS:*\n${urlGps}\n`;
    }
    
    // 4. Monta a lista de itens
    mensagem += `*ITENS DO PEDIDO (${carrinho.length} itens):*\n`;

    let totalPedido = 0;
    carrinho.forEach((item, index) => {
        const precoItem = item.precoTotal || item.preco || 0;
        const totalItem = precoItem * item.quantidade;
        totalPedido += totalItem;

        mensagem += `*${index + 1}. ${item.nome} (x${item.quantidade}) - R$ ${formatarMoeda(totalItem)}*\n`;
        
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
    const numero = '5586994253258'; 
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
    
    // 7. Limpa o carrinho
    carrinho = [];
    localStorage.removeItem('carrinho');
    renderizarCarrinho();
    updateContadorCarrinho();
    mostrarModal(carrinhoModal, false);
}

// =======================================================
// INICIALIZAÇÃO E EVENT LISTENERS
// =======================================================

function init() {
    // Referências principais
    carrinhoModal = document.getElementById('carrinho-modal');
    fecharModalBtn = carrinhoModal ? carrinhoModal.querySelector('.fechar-modal') : null;
    carrinhoItensContainer = document.getElementById('carrinho-itens');
    carrinhoTotalSpan = document.getElementById('carrinho-total');
    btnFinalizar = document.getElementById('btn-finalizar-pedido');
    
    // Referências de Geolocalização
    btnAnexarLocalizacao = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus = document.getElementById('localizacao-status');

    // Inicializa o carrinho
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
}

document.addEventListener('DOMContentLoaded', init);
