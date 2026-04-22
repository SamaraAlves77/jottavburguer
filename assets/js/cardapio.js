// =======================================================
// ESTADO GLOBAL
// =======================================================
let cardapioData = [];
let carrinho = [];
let adicionaisGlobais = [];
let itemEmCustomizacao = null;

const CATEGORIAS_CUSTOMIZAVEIS = ['hamburgueres-artesanais', 'acompanhamentos'];

// 🔥 NOVO: controle de categoria ativa (modo app)
let categoriaAtiva = null;

// =======================================================
// CARREGAMENTO
// =======================================================
async function carregarCardapio() {
    try {
        const response = await fetch('data/cardapio.json', { cache: 'no-store' });
        cardapioData = await response.json();
    } catch (e) {
        console.error("Erro ao carregar cardápio:", e);
        cardapioData = [];
    }

    carregarCarrinhoLocal();

    // Define primeira categoria como padrão
    if (!categoriaAtiva && cardapioData.length > 0) {
        categoriaAtiva = cardapioData[0].id;
    }

    renderizarCardapio();
}

// =======================================================
// RENDERIZAÇÃO PRINCIPAL (MODO APP)
// =======================================================
function renderizarCardapio() {
    const container = document.getElementById('main-content-container');
    if (!container) return;

    container.innerHTML = '';

    // 🔥 FILTRA APENAS UMA CATEGORIA
    const secoes = cardapioData.filter(s => s.id === categoriaAtiva);

    secoes.forEach(secao => {
        const section = document.createElement('section');
        section.classList.add('menu-section');

        section.innerHTML = `
            <h2 class="section-title">${secao.nome}</h2>

            <div class="cardapio-lista">
                ${secao.itens.map(item => {
                    const preco = (item.preco || 0).toFixed(2).replace('.', ',');

                    return `
                        <div class="item-row">
                            <img src="${item.imagem ? 'imagens/'+item.imagem : 'assets/img/hamburguer.png'}">

                            <div class="item-info">
                                <h3>${item.nome}</h3>
                                <p>${item.descricao || ''}</p>
                                <span class="preco">R$ ${preco}</span>
                            </div>

                            <button class="btn-add"
                                data-id="${item.id}"
                                data-cat="${secao.id}">
                                +
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.appendChild(section);
    });

    bindBotoes();
    renderizarCategoriasPills();
}

// =======================================================
// EVENTOS BOTÕES
// =======================================================
function bindBotoes() {
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const cat = btn.getAttribute('data-cat');

            const secao = cardapioData.find(s => s.id === cat);
            const item = secao.itens.find(i => i.id === id);

            handleAdicionarAoCarrinho(item, cat);
        });
    });
}

// =======================================================
// CARRINHO
// =======================================================
function handleAdicionarAoCarrinho(item, categoriaId) {
    if (!item) return;

    if (CATEGORIAS_CUSTOMIZAVEIS.includes(categoriaId)) {
        itemEmCustomizacao = item;
        alert("Abrir customização (implementar depois)");
    } else {
        adicionarItemSimplesAoCarrinho(item, categoriaId);
    }
}

function adicionarItemSimplesAoCarrinho(item, categoriaId) {
    const existente = carrinho.find(i => i.id === item.id);

    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({
            ...item,
            quantidade: 1
        });
    }

    salvarCarrinhoLocal();
    atualizarCarrinhoUI();

    console.log("Carrinho:", carrinho);
}

// =======================================================
// CATEGORIAS (PILLS)
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

// =======================================================
// UI CARRINHO (SIMPLES)
// =======================================================
function atualizarCarrinhoUI() {
    const total = carrinho.reduce((s, i) => s + i.quantidade, 0);

    const el = document.getElementById('cart-count');
    if (el) el.innerText = total;
}

// =======================================================
// INIT
// =======================================================
document.addEventListener('DOMContentLoaded', carregarCardapio);
