// cardapio.js - Lógica Central do Menu, Persistência de Dados e Admin

// =======================================================
// VARIÁVEIS DE ESTADO GLOBAIS (Acessíveis por outros scripts)
// =======================================================
let cardapioData = []; // Armazena os dados do cardápio (Local Storage ou JSON)
let carrinho = []; // Seu carrinho atual
let adicionaisGlobais = [];
let itemEmCustomizacao = null;
// CORREÇÃO: Usar o ID da seção para a lógica de customização
const ID_CATEGORIA_CUSTOMIZAVEL = 'hamburgueres-artesanais'; 

// Variáveis do Painel de Admin
const SENHA_ADMIN = "jottav2025"; // <<<<<< TROQUE ESTA SENHA!
let editorCardapioTabela;
let btnSalvarCardapio;

// NOVAS VARIÁVEIS PARA O MODAL ADMIN
let editorItemModal, fecharAdminModalBtn, editorItemForm, modalTituloItem, 
    itemNomeInput, itemDescricaoInput, itemPrecoInput, itemImagemInput, 
    itemSecaoIndexInput, itemItemIndexInput, itemIsNewInput;

// =======================================================
// LÓGICA DE ADMINISTRAÇÃO E ACESSO
// =======================================================

// FUNÇÃO CRÍTICA: LIGA OS NOVOS ELEMENTOS DO MODAL
function rebindAdminElements() {
    editorItemModal = document.getElementById('editor-item-modal');
    fecharAdminModalBtn = document.querySelector('.fechar-admin-modal');
    editorItemForm = document.getElementById('editor-item-form');
    modalTituloItem = document.getElementById('modal-titulo-item');
    
    itemNomeInput = document.getElementById('item-nome');
    itemDescricaoInput = document.getElementById('item-descricao');
    itemPrecoInput = document.getElementById('item-preco');
    itemImagemInput = document.getElementById('item-imagem');
    itemSecaoIndexInput = document.getElementById('item-secao-index');
    itemItemIndexInput = document.getElementById('item-item-index');
    itemIsNewInput = document.getElementById('item-is-new');

    // Listener para fechar o modal no 'X'
    if (fecharAdminModalBtn) {
        fecharAdminModalBtn.addEventListener('click', () => editorItemModal.style.display = 'none');
    }
    // Listener para fechar o modal clicando fora
    if (editorItemModal) {
        window.addEventListener('click', (event) => {
            if (event.target === editorItemModal) {
                editorItemModal.style.display = 'none';
            }
        });
    }
    // Listener para submissão do formulário
    if (editorItemForm) {
        editorItemForm.addEventListener('submit', salvarItemModal);
    }
}


function verificarAcessoAdmin() {
    // CORREÇÃO CRÍTICA: Verifica se estamos na página admin_jottav_burguer.html
    if (window.location.pathname.endsWith('admin_jottav_burguer.html')) {
        const painel = document.getElementById('painel-admin-container');
        const negado = document.getElementById('acesso-negado');
        editorCardapioTabela = document.getElementById('editor-cardapio-tabela');
        btnSalvarCardapio = document.getElementById('btn-salvar-cardapio');

        // LIGA OS ELEMENTOS DO MODAL
        rebindAdminElements(); 

        // Se a senha estiver salva na sessão
        if (sessionStorage.getItem('adminAutenticado') === 'true') {
            negado.style.display = 'none';
            painel.style.display = 'block';
            
            carregarCardapioAdmin();
            btnSalvarCardapio?.addEventListener('click', salvarCardapioAdmin); // Usa '?' para segurança

        } else {
            painel.style.display = 'none';
            negado.style.display = 'block';
            document.getElementById('btn-login-admin')?.addEventListener('click', solicitarLogin);
        }
        
        document.getElementById('btn-logout-admin')?.addEventListener('click', fazerLogout);
    }
}

function solicitarLogin() {
    const senha = prompt("Por favor, digite a senha de administrador:");
    
    if (senha === SENHA_ADMIN) {
        sessionStorage.setItem('adminAutenticado', 'true');
        alert("Acesso concedido! Lembre-se de trocar a senha padrão.");
        window.location.reload(); // Recarrega a página para mostrar o painel
    } else if (senha !== null && senha !== "") {
        alert("Senha incorreta.");
    }
}

function fazerLogout() {
    sessionStorage.removeItem('adminAutenticado');
    alert("Você saiu do painel de controle.");
    window.location.reload(); 
}

// =======================================================
// FUNÇÕES DE MANIPULAÇÃO DO LOCAL STORAGE
// =======================================================

function salvarCardapioNoLocalStorage(data) {
    try {
        localStorage.setItem('cardapioJottaV', JSON.stringify(data));
        console.log("Cardápio salvo no Local Storage.");
    } catch (e) {
        console.error("Erro ao salvar cardápio no Local Storage:", e);
    }
}

function carregarCardapioDoLocalStorage() {
    try {
        const data = localStorage.getItem('cardapioJottaV');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Erro ao carregar cardápio do Local Storage:", e);
        return null;
    }
}

// =======================================================
// FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO DO CARDÁPIO
// =======================================================

// Função unificada de carregamento (usa Local Storage ou JSON)
async function carregarCardapio() {
    let dados = carregarCardapioDoLocalStorage();

    if (dados) {
        console.log("Cardápio carregado do Local Storage.");
        cardapioData = dados;
    } else {
        console.log("Local Storage vazio. Carregando cardápio do JSON.");
        try {
            const response = await fetch('cardapio.json');
            if (!response.ok) throw new Error('Falha ao carregar cardapio.json');
            cardapioData = await response.json();
            salvarCardapioNoLocalStorage(cardapioData); 
        } catch (error) {
            console.error("Erro ao carregar cardápio:", error);
            cardapioData = [];
        }
    }
    
    // Extrai adicionais globais no carregamento
    const adicionaisSecao = cardapioData.find(secao => secao.id === 'adicionais-extras');
    if (adicionaisSecao) {
        adicionaisGlobais = adicionaisSecao.itens.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco
        }));
    }

    // Checa se é a página do cardápio para renderizar
    if (document.getElementById('main-content-container')) {
        renderizarCardapio();
    }
}

async function carregarCardapioAdmin() {
    await carregarCardapio();
    renderizarEditorCardapio();
}

function renderizarCardapio() {
    const cardapioList = document.getElementById('main-content-container');
    
    if (!cardapioList) return;

    cardapioList.innerHTML = '';
    
    cardapioData.forEach(secao => {
        // CORREÇÃO: Não renderiza a seção de adicionais na tela principal
        if (secao.id === 'adicionais-extras') {
            return; 
        }
        
        const section = document.createElement('section');
        section.id = secao.id;
        section.classList.add('menu-section');
        // AQUI: Renderiza o nome da seção puxado do JSON (Combos)
        section.innerHTML = `<h2 class="section-title" id="${secao.id}-secao">${secao.nome}</h2><div class="cardapio-grid" id="grid-${secao.id}"></div>`;
        cardapioList.appendChild(section);

        const grid = document.getElementById(`grid-${secao.id}`);
        secao.itens.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('item-card');
            card.setAttribute('data-item-id', item.id);
            card.setAttribute('data-categoria-id', secao.id);
            
            const precoFormatado = item.preco ? item.preco.toFixed(2).replace('.', ',') : '0,00';

            // Verifica se a categoria é customizável (usando ID)
            const isCustomizavel = secao.id === ID_CATEGORIA_CUSTOMIZAVEL;
            
            card.innerHTML = `
                <img src="imagens/${item.imagem}" alt="${item.nome}">
                <h3>${item.nome}</h3>
                <p>${item.descricao || ''}</p>
                <div class="card-actions">
                    <div class="price">R$ ${precoFormatado}</div>
                    <button class="btn-adicionar" data-item-id="${item.id}" data-categoria-id="${secao.id}">
                        ${isCustomizavel ? 'Customizar e Adicionar' : 'Adicionar ao Carrinho'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
    
    document.querySelectorAll('.btn-adicionar').forEach(button => {
        button.addEventListener('click', handleAdicionarAoCarrinho);
    });
}


// =======================================================
// FUNÇÕES DE EDIÇÃO DO PAINEL DE ADMINISTRAÇÃO (CRUD)
// =======================================================

function renderizarEditorCardapio() {
    if (!editorCardapioTabela) return;

    editorCardapioTabela.innerHTML = ''; 
    
    cardapioData.forEach((secao, secaoIndex) => {
        const secaoTitulo = document.createElement('h3');
        secaoTitulo.innerHTML = `<i class="fas fa-grip-lines"></i> ${secao.nome} <button class="admin-btn btn-add-item" data-secao-index="${secaoIndex}"><i class="fas fa-plus"></i> Novo Item</button>`;
        editorCardapioTabela.appendChild(secaoTitulo);

        const itensContainer = document.createElement('div');
        itensContainer.classList.add('secao-itens-admin');

        secao.itens.forEach((item, itemIndex) => {
            const row = document.createElement('div');
            row.classList.add('item-row');
            const precoFormatado = item.preco ? item.preco.toFixed(2).replace('.', ',') : '0,00';
            row.innerHTML = `
                <div>
                    <strong>${item.nome}</strong> (ID: ${item.id}) - R$ ${precoFormatado}
                </div>
                <div>
                    <button class="admin-btn btn-editar" data-secao-index="${secaoIndex}" data-item-index="${itemIndex}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="admin-btn btn-excluir" data-secao-index="${secaoIndex}" data-item-index="${itemIndex}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            itensContainer.appendChild(row);
        });
        editorCardapioTabela.appendChild(itensContainer);
    });
    
    // Re-adiciona os listeners aos novos botões
    document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', editarItemAdmin));
    document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', excluirItemAdmin));
    document.querySelectorAll('.btn-add-item').forEach(btn => btn.addEventListener('click', adicionarItemAdmin));
}

function salvarCardapioAdmin() {
    salvarCardapioNoLocalStorage(cardapioData);
    alert("Cardápio salvo com sucesso no Local Storage! As mudanças estão visíveis no cardapio.html.");
    renderizarEditorCardapio();
}

function editarItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    const itemIndex = event.currentTarget.getAttribute('data-item-index');
    const item = cardapioData[secaoIndex].itens[itemIndex];
    
    modalTituloItem.textContent = `Editar Item: ${item.nome}`;
    
    // Preenche o formulário com os dados atuais
    itemNomeInput.value = item.nome;
    itemDescricaoInput.value = item.descricao || '';
    itemPrecoInput.value = item.preco;
    itemImagemInput.value = item.imagem;

    // Campos ocultos para referência
    itemSecaoIndexInput.value = secaoIndex;
    itemItemIndexInput.value = itemIndex;
    itemIsNewInput.value = 'false';
    
    editorItemModal.style.display = 'block';
}

function adicionarItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    
    modalTituloItem.textContent = `Adicionar Novo Item na Seção "${cardapioData[secaoIndex].nome}"`;
    
    // Limpa o formulário e define valores padrão
    itemNomeInput.value = '';
    itemDescricaoInput.value = '';
    itemPrecoInput.value = '0.00';
    itemImagemInput.value = '';

    // Campos ocultos para referência
    itemSecaoIndexInput.value = secaoIndex;
    itemItemIndexInput.value = ''; // Não tem índice ainda
    itemIsNewInput.value = 'true';
    
    editorItemModal.style.display = 'block';
}

function salvarItemModal(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const secaoIndex = parseInt(itemSecaoIndexInput.value);
    const itemIndex = itemItemIndexInput.value !== '' ? parseInt(itemItemIndexInput.value) : -1;
    const isNew = itemIsNewInput.value === 'true';
    
    const nome = itemNomeInput.value;
    const descricao = itemDescricaoInput.value;
    // O JS usa ponto para parsear, então trocamos vírgula por ponto na entrada
    const preco = parseFloat(itemPrecoInput.value.toString().replace(',', '.')); 
    const imagem = itemImagemInput.value;
    
    if (isNaN(preco) || preco < 0) {
        alert("Preço inválido.");
        return;
    }

    if (isNew) {
        // Lógica de Novo Item
        const ultimoId = cardapioData.flatMap(s => s.itens).reduce((max, item) => Math.max(max, item.id || 0), 0);
        const novoId = ultimoId + 1;
        
        const novoItem = { id: novoId, nome, descricao, preco, imagem };
        cardapioData[secaoIndex].itens.push(novoItem);
        alert(`Item "${nome}" adicionado. Não se esqueça de SALVAR.`);
        
    } else {
        // Lógica de Edição de Item Existente
        let item = cardapioData[secaoIndex].itens[itemIndex];
        item.nome = nome;
        item.descricao = descricao;
        item.preco = preco;
        item.imagem = imagem;
        alert(`Item "${nome}" editado. Não se esqueça de SALVAR.`);
    }

    editorItemModal.style.display = 'none'; // Fecha o modal
    renderizarEditorCardapio(); // Atualiza a tabela
}

function excluirItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    const itemIndex = event.currentTarget.getAttribute('data-item-index');
    const nomeItem = cardapioData[secaoIndex].itens[itemIndex].nome;
    
    if (confirm(`Tem certeza que deseja excluir o item: ${nomeItem}?`)) {
        cardapioData[secaoIndex].itens.splice(itemIndex, 1);
        renderizarEditorCardapio();
        alert(`Item "${nomeItem}" excluído. Não se esqueça de SALVAR.`);
    }
}


// =======================================================
// LÓGICA DO CARRINHO (Adicionar e Customizar)
// =======================================================

function handleAdicionarAoCarrinho(event) {
    const itemId = parseInt(event.currentTarget.getAttribute('data-item-id'));
    const categoriaId = event.currentTarget.getAttribute('data-categoria-id');
    const secao = cardapioData.find(s => s.id === categoriaId);
    const item = secao?.itens.find(i => i.id === itemId);

    if (!item) return;

    // LÓGICA REVISADA: Usa ID para acionar a customização
    if (categoriaId === ID_CATEGORIA_CUSTOMIZAVEL) {
        itemEmCustomizacao = { ...item, categoriaId: categoriaId };
        setupCustomizacaoModal(item);
        if (typeof mostrarModal === 'function' && typeof customizacaoModal !== 'undefined') {
            mostrarModal(customizacaoModal, true); 
        } 
    } else {
        adicionarItemSimplesAoCarrinho(item);
        if (typeof showNotification === 'function') showNotification("Item adicionado ao carrinho!"); 
        if (typeof pulseFab === 'function') pulseFab(); 
    }
}

function adicionarItemSimplesAoCarrinho(item) {
    const existingItem = carrinho.find(c => c.id === item.id && !c.adicionais);

    if (existingItem) {
        existingItem.quantidade++;
    } else {
        carrinho.push({ ...item, quantidade: 1 });
    }
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho(); 
}

function setupCustomizacaoModal(item) {
    if (!document.getElementById('item-customizacao-nome')) return;

    document.getElementById('item-customizacao-nome').textContent = item.nome;
    if (typeof formatarMoeda === 'function') {
        document.getElementById('preco-base-customizacao').textContent = formatarMoeda(item.preco);
        document.getElementById('preco-adicionais-customizacao').textContent = formatarMoeda(0);
        document.getElementById('preco-total-item-customizacao').textContent = formatarMoeda(item.preco); // Preço inicial
    }

    if (!listaAdicionaisContainer) return;

    // Garante que o container de adicionais esteja limpo
    listaAdicionaisContainer.innerHTML = '';
    
    // Renderiza os adicionais globais
    adicionaisGlobais.forEach(adicional => {
        const div = document.createElement('div');
        div.classList.add('adicional-option');
        if (typeof formatarMoeda === 'function') {
            div.innerHTML = `
                <input type="checkbox" id="add-${adicional.id}" data-preco="${adicional.preco}" data-nome="${adicional.nome}">
                <label for="add-${adicional.id}">
                    ${adicional.nome} <span>+ R$ ${formatarMoeda(adicional.preco)}</span>
                </label>
            `;
        }
        listaAdicionaisContainer.appendChild(div);
    });

    listaAdicionaisContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', recalcularAdicionais); 
    });
}

function recalcularAdicionais() {
    if (!itemEmCustomizacao) return;

    let totalAdicionais = 0;
    
    if (listaAdicionaisContainer) {
        listaAdicionaisContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            totalAdicionais += parseFloat(checkbox.getAttribute('data-preco'));
        });
    }
    
    const precoBase = itemEmCustomizacao.preco;
    const precoFinal = precoBase + totalAdicionais; 
    
    if (typeof formatarMoeda === 'function') {
        // Atualiza o valor dos adicionais
        document.getElementById('preco-adicionais-customizacao').textContent = formatarMoeda(totalAdicionais);
        
        // Atualiza o preço total do item no modal
        const totalFinalSpan = document.getElementById('preco-total-item-customizacao');
        if (totalFinalSpan) {
            totalFinalSpan.textContent = formatarMoeda(precoFinal);
        }
    }
}


function adicionarItemCustomizadoAoCarrinho() {
    if (!itemEmCustomizacao || !listaAdicionaisContainer) return;

    let totalAdicionais = 0;
    const adicionaisSelecionados = [];

    listaAdicionaisContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const preco = parseFloat(checkbox.getAttribute('data-preco'));
        const nome = checkbox.getAttribute('data-nome');
        totalAdicionais += preco;
        adicionaisSelecionados.push({ nome: nome, preco: preco });
    });

    const precoFinal = itemEmCustomizacao.preco + totalAdicionais;
    const nomeItem = itemEmCustomizacao.nome;
    
    carrinho.push({
        ...itemEmCustomizacao,
        adicionais: adicionaisSelecionados,
        precoTotal: precoFinal,
        quantidade: 1 
    });

    itemEmCustomizacao = null; 
    
    if (typeof mostrarModal === 'function' && typeof customizacaoModal !== 'undefined') {
        mostrarModal(customizacaoModal, false); 
    }
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho(); 
    if (typeof showNotification === 'function') showNotification(`${nomeItem} customizado adicionado!`); 
    if (typeof pulseFab === 'function') pulseFab(); 
}
