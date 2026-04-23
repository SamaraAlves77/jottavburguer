// =======================================================
// ESTADO GLOBAL
// =======================================================
let cardapioData = [];
let carrinho = [];
let categoriaAtiva = null;

// =======================================================
// INIT
// =======================================================
async function carregarCardapio() {
    try {
        const response = await fetch('data/cardapio.json');
        cardapioData = await response.json();

        if (!categoriaAtiva && cardapioData.length > 0) {
            categoriaAtiva = cardapioData[0].id;
        }

        carregarCarrinhoLocal();
        renderizarCardapio();

    } catch (e) {
        console.error('Erro ao carregar cardápio:', e);
    }
}

// =======================================================
// RENDER PRINCIPAL
// =======================================================
function renderizarCardapio() {
    const container = document.getElementById('main-content-container');
    if (!container) return;

    container.innerHTML = '';

    const secao = cardapioData.find(s => s.id === categoriaAtiva);
    if (!secao) return;

    const section = document.createElement('section');
    section.classList.add('menu-section');

    section.innerHTML = `
        <h2 class="section-title">${secao.nome}</h2>
        <div class="cardapio-grid">
            ${secao.itens.map(item => criarCardHTML(item, secao.id)).join('')}
        </div>
    `;

    container.appendChild(section);

    bindEventosCards();
    renderizarCategoriasPills();
}

// =======================================================
// CARD
// =======================================================
function criarCardHTML(item, categoriaId) {
    const preco = (item.preco || 0).toFixed(2).replace('.', ',');

    return `
        <div class="item-card" data-id="${item.id}" data-cat="${categoriaId}">
            
            <div class="card-img-wrapper">
                <img src="${item.imagem ? 'imagens/' + item.imagem : 'assets/img/hamburguer.png'}">
            </div>

            <div class="card-body">
                <div class="card-nome">${item.nome}</div>
                <div class="card-desc">${item.descricao || ''}</div>
            </div>

            <div class="card-footer">
                <span class="card-preco">R$ ${preco}</span>
                <button class="card-btn">Adicionar</button>
            </div>
        </div>
    `;
}

// =======================================================
// EVENTOS
// =======================================================
function bindEventosCards() {
    document.querySelectorAll('.card-btn').forEach(btn => {
        btn.onclick = (e) => {
            const card = e.target.closest('.item-card');
            if (!card) return;

            const id = parseInt(card.dataset.id);
            const cat = card.dataset.cat;

            const secao = cardapioData.find(s => s.id === cat);
            if (!secao) return;

            const item = secao.itens.find(i => i.id === id);
            if (!item) return;

            adicionarAoCarrinho(item);
        };
    });
}

// =======================================================
// CARRINHO
// =======================================================
function adicionarAoCarrinho(item) {
    const existente = carrinho.find(i => i.id === item.id);

    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({ ...item, quantidade: 1 });
    }

    salvarCarrinhoLocal();

    updateContadorCarrinho?.();
    showNotification?.('Item adicionado!');
    pulseFab?.();
}

// =======================================================
// CATEGORIAS
// =======================================================
function renderizarCategoriasPills() {
    const container = document.getElementById('navbar-pills-container');
    if (!container) return;

    container.innerHTML = '';

    cardapioData.forEach(sec => {
        const pill = document.createElement('div');
        pill.className = 'cat-pill';
        if (sec.id === categoriaAtiva) pill.classList.add('ativo');

        pill.innerText = sec.nome;

        pill.onclick = () => {
            categoriaAtiva = sec.id;
            renderizarCardapio();
        };

        container.appendChild(pill);
    });
}

// =======================================================
// STORAGE
// =======================================================
function salvarCarrinhoLocal() {
    localStorage.setItem('carrinhoJottaV', JSON.stringify(carrinho));
}

function carregarCarrinhoLocal() {
    const data = localStorage.getItem('carrinhoJottaV');
    if (data) carrinho = JSON.parse(data);
}
