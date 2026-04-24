// =======================================================
// ESTADO GLOBAL
// =======================================================
let cardapioData = [];
let carrinho = [];

// =======================================================
// INIT
// =======================================================
async function carregarCardapio() {
    const response = await fetch('data/cardapio.json');
    cardapioData = await response.json();

    carregarCarrinhoLocal();
    renderizarTudo();
}

// =======================================================
// RENDER GERAL (ESTILO APP)
// =======================================================
function renderizarTudo() {
    const container = document.getElementById('main-content-container');
    container.innerHTML = '';

    cardapioData.forEach(secao => {
        const section = document.createElement('section');
        section.classList.add('menu-section');
        section.id = secao.id;

        section.innerHTML = `
            <h2 class="section-title">${secao.nome}</h2>

            <div class="scroll-horizontal">
                ${secao.itens.map(item => criarCardHTML(item, secao.id)).join('')}
            </div>
        `;

        container.appendChild(section);
    });

    renderizarCategorias();
    bindEventosCards();
}

// =======================================================
// TEMPLATE CARD
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
                <button class="card-btn">+</button>
            </div>
        </div>
    `;
}

// =======================================================
// EVENTOS
// =======================================================
function bindEventosCards() {
    document.querySelectorAll('.card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.item-card');
            const id = parseInt(card.dataset.id);
            const cat = card.dataset.cat;

            const secao = cardapioData.find(s => s.id === cat);
            const item = secao.itens.find(i => i.id === id);

            adicionarAoCarrinho(item);
        });
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

    if (typeof updateContadorCarrinho === 'function') {
        updateContadorCarrinho();
    }

    if (typeof showNotification === 'function') {
        showNotification('Item adicionado!');
    }

    if (typeof pulseFab === 'function') {
        pulseFab();
    }
}

// =======================================================
// CATEGORIAS (COM SCROLL)
// =======================================================
function renderizarCategorias() {
    const container = document.getElementById('navbar-pills-container');
    if (!container) return;

    container.innerHTML = '';

    cardapioData.forEach(sec => {
        const pill = document.createElement('div');
        pill.className = 'cat-pill';
        pill.innerText = sec.nome;

        pill.onclick = () => {
            document.getElementById(sec.id).scrollIntoView({
                behavior: 'smooth'
            });
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
