// cardapio.js - Lógica Central do Menu, Persistência de Dados e Admin

// =======================================================
// VARIÁVEIS DE ESTADO GLOBAIS (Acessíveis por outros scripts)
// =======================================================
let cardapioData = [];
let carrinho = [];
let adicionaisGlobais = [];
let itemEmCustomizacao = null;
const CATEGORIAS_CUSTOMIZAVEIS = ['hamburgueres-artesanais', 'acompanhamentos'];

// Variáveis do Painel de Admin
const SENHA_ADMIN = "jottav2025";
let editorCardapioTabela;
let btnSalvarCardapio;

let editorItemModal, fecharAdminModalBtn, editorItemForm, modalTituloItem,
    itemNomeInput, itemDescricaoInput, itemPrecoInput, itemImagemInput,
    itemSecaoIndexInput, itemItemIndexInput, itemIsNewInput;

// =======================================================
// LÓGICA DE ADMINISTRAÇÃO E ACESSO
// =======================================================

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

    if (fecharAdminModalBtn) {
        fecharAdminModalBtn.addEventListener('click', () => editorItemModal.style.display = 'none');
    }
    if (editorItemModal) {
        window.addEventListener('click', (event) => {
            if (event.target === editorItemModal) {
                editorItemModal.style.display = 'none';
            }
        });
    }
    if (editorItemForm) {
        editorItemForm.addEventListener('submit', salvarItemModal);
    }
}

function verificarAcessoAdmin() {
    if (window.location.pathname.endsWith('admin_jottav_burguer.html')) {
        const painel = document.getElementById('painel-admin-container');
        const negado = document.getElementById('acesso-negado');
        editorCardapioTabela = document.getElementById('editor-cardapio-tabela');
        btnSalvarCardapio = document.getElementById('btn-salvar-cardapio');

        rebindAdminElements();

        if (sessionStorage.getItem('adminAutenticado') === 'true') {
            negado.style.display = 'none';
            painel.style.display = 'block';
            carregarCardapioAdmin();
            btnSalvarCardapio?.addEventListener('click', salvarCardapioAdmin);
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
        alert("Acesso concedido!");
        window.location.reload();
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

async function carregarCardapio() {
    // Remove cache antigo do cardápio (não do carrinho)
    localStorage.removeItem('cardapioJottaV');
    // Restaura carrinho da sessão anterior
    carregarCarrinhoLocal();
    try {
        // cache: 'no-store' força busca real ignorando cache do browser E do CDN
        const response = await fetch('cardapio.json', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) throw new Error('Falha ao carregar cardapio.json');
        cardapioData = await response.json();
    } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
        cardapioData = [];
    }

    // Extrai adicionais globais
    const adicionaisSecao = cardapioData.find(secao => secao.id === 'adicionais-extras');
    if (adicionaisSecao) {
        adicionaisGlobais = adicionaisSecao.itens.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco
        }));
    }

    if (document.getElementById('main-content-container')) {
        renderizarCardapio();
    }
}

async function carregarCardapioAdmin() {
    await carregarCardapio();
    renderizarEditorCardapio();
}

// CORREÇÃO: Função auxiliar para gerar HTML de imagem com tratamento de erro
function gerarImagemCard(item) {
    if (item.imagem) {
        return `<img
            src="imagens/${item.imagem}"
            alt="${item.nome}"
            loading="lazy"
            decoding="async"
            onerror="this.src='hamburguer.png';this.style.objectFit='contain';this.style.padding='24px';this.style.mixBlendMode='screen';this.style.opacity='0.5'">`;
    }
    return `<img src="hamburguer.png" alt="Sem imagem" loading="lazy"
        style="width:100%;height:100%;object-fit:contain;padding:24px;mix-blend-mode:screen;opacity:0.45">`;
}

function renderizarCardapio() {
    const cardapioList = document.getElementById('main-content-container');
    if (!cardapioList) return;

    cardapioList.innerHTML = '';

    cardapioData.forEach(secao => {
        if (secao.id === 'adicionais-extras') return;

        const section = document.createElement('section');
        section.id = secao.id;
        section.classList.add('menu-section');
        section.innerHTML = `<h2 class="section-title">${secao.nome}</h2><div class="cardapio-grid" id="grid-${secao.id}"></div>`;
        cardapioList.appendChild(section);

        const grid = document.getElementById(`grid-${secao.id}`);
        secao.itens.forEach(item => {
            if (item.ativo === false) return;
            const card = document.createElement('div');
            card.classList.add('item-card');
            card.setAttribute('data-item-id', item.id);
            card.setAttribute('data-categoria-id', secao.id);

            const precoFormatado = item.preco ? item.preco.toFixed(2).replace('.', ',') : '0,00';
            const isCustomizavel = CATEGORIAS_CUSTOMIZAVEIS.includes(secao.id);

            card.innerHTML = `
                <div class="card-img-wrapper">
                    ${gerarImagemCard(item)}
                </div>
                <div class="card-body">
                    <h3 class="card-nome">${item.nome}</h3>
                    <p class="card-desc">${item.descricao || ''}</p>
                    <div class="card-footer">
                        <span class="card-preco">R$ ${precoFormatado}</span>
                        <button class="card-btn btn-adicionar" data-item-id="${item.id}" data-categoria-id="${secao.id}">
                            ${isCustomizavel ? '🔧 Customizar' : '+ Adicionar'}
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    });

    document.querySelectorAll('.btn-adicionar').forEach(button => {
        button.addEventListener('click', handleAdicionarAoCarrinho);
    });

    // Renderiza pills de categoria
    renderizarCategoriasPills();
}

function renderizarCategoriasPills() {
    const container = document.getElementById('categorias-pills');
    if (!container) return;
    container.innerHTML = '';

    cardapioData.forEach(sec => {
        if (sec.id === 'adicionais-extras') return;
        const pill = document.createElement('a');
        pill.className = 'cat-pill';
        pill.href = '#' + sec.id;
        pill.textContent = sec.nome;
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('ativo'));
            pill.classList.add('ativo');
            const section = document.getElementById(sec.id);
            if (section) {
                const offset = 120;
                window.scrollTo({ top: section.offsetTop - offset, behavior: 'smooth' });
            }
        });
        container.appendChild(pill);
    });

    // Primeiro pill ativo
    const first = container.querySelector('.cat-pill');
    if (first) first.classList.add('ativo');

    // Scroll spy
    window.addEventListener('scroll', () => {
        const sections = cardapioData
            .filter(s => s.id !== 'adicionais-extras')
            .map(s => document.getElementById(s.id))
            .filter(Boolean);

        let current = sections[0]?.id || '';
        sections.forEach(sec => {
            if (sec.offsetTop - 140 <= window.scrollY) current = sec.id;
        });

        container.querySelectorAll('.cat-pill').forEach(pill => {
            const ativo = pill.getAttribute('href') === '#' + current;
            pill.classList.toggle('ativo', ativo);
        });
    }, { passive: true });
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

    document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', editarItemAdmin));
    document.querySelectorAll('.btn-excluir').forEach(btn => btn.addEventListener('click', excluirItemAdmin));
    document.querySelectorAll('.btn-add-item').forEach(btn => btn.addEventListener('click', adicionarItemAdmin));
}

function salvarCardapioAdmin() {
    
    alert("Cardápio salvo com sucesso!");
    renderizarEditorCardapio();
}

function editarItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    const itemIndex = event.currentTarget.getAttribute('data-item-index');
    const item = cardapioData[secaoIndex].itens[itemIndex];

    modalTituloItem.textContent = `Editar Item: ${item.nome}`;
    itemNomeInput.value = item.nome;
    itemDescricaoInput.value = item.descricao || '';
    itemPrecoInput.value = item.preco;
    itemImagemInput.value = item.imagem || '';
    itemSecaoIndexInput.value = secaoIndex;
    itemItemIndexInput.value = itemIndex;
    itemIsNewInput.value = 'false';

    editorItemModal.style.display = 'block';
}

function adicionarItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    if (!editorItemModal || !modalTituloItem) return;

    modalTituloItem.textContent = `Adicionar Novo Item na Seção "${cardapioData[secaoIndex].nome}"`;
    itemNomeInput.value = '';
    itemDescricaoInput.value = '';
    itemPrecoInput.value = '0.00';
    itemImagemInput.value = '';
    itemSecaoIndexInput.value = secaoIndex;
    itemItemIndexInput.value = '';
    itemIsNewInput.value = 'true';

    editorItemModal.style.display = 'block';
}

function salvarItemModal(event) {
    event.preventDefault();

    const secaoIndex = parseInt(itemSecaoIndexInput.value);
    const itemIndex = itemItemIndexInput.value !== '' ? parseInt(itemItemIndexInput.value) : -1;
    const isNew = itemIsNewInput.value === 'true';

    const nome = itemNomeInput.value;
    const descricao = itemDescricaoInput.value;
    const preco = parseFloat(itemPrecoInput.value.toString().replace(',', '.'));
    const imagem = itemImagemInput.value;

    if (isNaN(preco) || preco < 0) {
        alert("Preço inválido.");
        return;
    }

    if (isNew) {
        const ultimoId = cardapioData.flatMap(s => s.itens).reduce((max, item) => Math.max(max, item.id || 0), 0);
        const novoId = ultimoId + 1;
        cardapioData[secaoIndex].itens.push({ id: novoId, nome, descricao, preco, imagem });
        alert(`Item "${nome}" adicionado. Não se esqueça de SALVAR.`);
    } else {
        let item = cardapioData[secaoIndex].itens[itemIndex];
        item.nome = nome;
        item.descricao = descricao;
        item.preco = preco;
        item.imagem = imagem;
        alert(`Item "${nome}" editado. Não se esqueça de SALVAR.`);
    }

    editorItemModal.style.display = 'none';
    renderizarEditorCardapio();
}

function excluirItemAdmin(event) {
    const secaoIndex = event.currentTarget.getAttribute('data-secao-index');
    const itemIndex = event.currentTarget.getAttribute('data-item-index');
    const nomeItem = cardapioData[secaoIndex].itens[itemIndex].nome;

    if (confirm(`Tem certeza que deseja excluir: ${nomeItem}?`)) {
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

    if (CATEGORIAS_CUSTOMIZAVEIS.includes(categoriaId)) {
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
    salvarCarrinhoLocal(); // persiste carrinho
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
}

function salvarCarrinhoLocal() {
    try { localStorage.setItem('carrinhoJottaV', JSON.stringify(carrinho)); } catch(e) {}
}

function carregarCarrinhoLocal() {
    try {
        const saved = localStorage.getItem('carrinhoJottaV');
        if (saved) carrinho = JSON.parse(saved);
    } catch(e) { carrinho = []; }
}

function setupCustomizacaoModal(item) {
    if (!document.getElementById('item-customizacao-nome')) return;

    document.getElementById('item-customizacao-nome').textContent = item.nome;
    if (typeof formatarMoeda === 'function') {
        document.getElementById('preco-base-customizacao').textContent = formatarMoeda(item.preco);
        document.getElementById('preco-adicionais-customizacao').textContent = formatarMoeda(0);
        document.getElementById('preco-total-item-customizacao').textContent = formatarMoeda(item.preco);
    }

    if (!listaAdicionaisContainer) return;
    listaAdicionaisContainer.innerHTML = '';

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
        document.getElementById('preco-adicionais-customizacao').textContent = formatarMoeda(totalAdicionais);
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

    salvarCarrinhoLocal(); // persiste carrinho
    itemEmCustomizacao = null;

    if (typeof mostrarModal === 'function' && typeof customizacaoModal !== 'undefined') {
        mostrarModal(customizacaoModal, false);
    }
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
    if (typeof showNotification === 'function') showNotification(`${nomeItem} adicionado ao carrinho!`);
    if (typeof pulseFab === 'function') pulseFab();
}
