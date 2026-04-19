// cardapio.js — JottaV Burguer v3.1
// Correções: adicionais só para hamburgueres + acompanhamentos
// Melhorias: banners empilhados, cards de categoria

// ==========================================
// ESTADO GLOBAL
// ==========================================
let cardapioData   = [];
let adicionaisData = [];
let categoriaAtual = null;
let itemParaCustomizar = null;
const IMG_BASE = 'imagens/';

// Categorias que TÊM adicionais disponíveis
const CATS_COM_ADICIONAIS = ['hamburgueres-artesanais', 'acompanhamentos'];

// ==========================================
// UTILITÁRIOS
// ==========================================

function formatarPreco(valor) {
    return parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

function getImgSrc(imagem) {
    if (!imagem) return 'assets/img/hamburguer.png';
    return IMG_BASE + imagem;
}

function getCatIcone(id) {
    const map = {
        'hamburgueres-artesanais': '🍔',
        'combos-e-familia':        '🎯',
        'acompanhamentos':         '🍟',
        'bebidas':                 '🥤',
    };
    return map[id] || '🍽️';
}

function getCatDescricao(id) {
    const map = {
        'hamburgueres-artesanais': 'Artesanais e irresistíveis',
        'combos-e-familia':        'Completos pra toda ocasião',
        'acompanhamentos':         'Batatas e muito mais',
        'bebidas':                 'Geladas pra acompanhar',
    };
    return map[id] || '';
}

function getBadgeLabel(badge) {
    const map = { popular: '⭐ Mais Vendido', novo: '✨ Novo', promo: '🔥 Promo' };
    return map[badge] || badge;
}

// ==========================================
// NAVEGAÇÃO
// ==========================================

function navegarHome() {
    document.getElementById('view-home').classList.add('active');
    document.getElementById('view-categoria').classList.remove('active');
    categoriaAtual = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    atualizarSidebarAtivo(null);
    atualizarBottomNavAtivo('home');
}

function navegarCategoria(catId) {
    categoriaAtual = catId;
    document.getElementById('view-home').classList.remove('active');
    document.getElementById('view-categoria').classList.add('active');
    renderizarTelaCategoria(catId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    atualizarSidebarAtivo(catId);
    atualizarBottomNavAtivo('categoria');
}

function atualizarBottomNavAtivo(view) {
    const home = document.getElementById('btn-bottom-home');
    if (home) home.classList.toggle('ativo', view === 'home');
    const carr = document.getElementById('bottom-carrinho-btn');
    if (carr) carr.classList.remove('ativo');
}

// ==========================================
// CAROUSEL
// ==========================================

function renderizarCarousel(todosItens) {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    const destaques = todosItens.filter(i => i.destaque);
    if (destaques.length === 0) { container.style.display = 'none'; return; }

    container.style.display = '';
    let current = 0;
    let timer;

    function buildHTML(item) {
        return `
            <div class="carousel-slide">
                <img src="${getImgSrc(item.imagem)}" alt="${item.nome}"
                     class="carousel-img" onerror="this.src='assets/img/hamburguer.png'">
                <div class="carousel-overlay"></div>
                <div class="carousel-content">
                    <span class="carousel-badge">⭐ Destaque</span>
                    <h2 class="carousel-nome">${item.nome}</h2>
                    <p class="carousel-desc">${item.descricao || ''}</p>
                    <div class="carousel-footer">
                        <span class="carousel-preco">R$ ${formatarPreco(item.preco)}</span>
                        <button class="btn-adicionar" id="btn-add-c-${item.id}"
                                onclick="handleAdicionar(${item.id})">
                            <i class="fas fa-plus"></i> Adicionar
                        </button>
                    </div>
                </div>
                ${destaques.length > 1 ? `
                <button class="carousel-seta carousel-prev" onclick="carouselNav(-1)">
                    <i class="fas fa-chevron-left"></i></button>
                <button class="carousel-seta carousel-next" onclick="carouselNav(1)">
                    <i class="fas fa-chevron-right"></i></button>` : ''}
            </div>
            ${destaques.length > 1 ? `
            <div class="carousel-dots">
                ${destaques.map((_, i) =>
                    `<button class="carousel-dot ${i === 0 ? 'ativo' : ''}"
                             onclick="carouselGoTo(${i})"></button>`
                ).join('')}
            </div>` : ''}
        `;
    }

    function atualizarSlide() {
        const item = destaques[current];
        const img   = container.querySelector('.carousel-img');
        const nome  = container.querySelector('.carousel-nome');
        const desc  = container.querySelector('.carousel-desc');
        const preco = container.querySelector('.carousel-preco');
        const btn   = container.querySelector('.carousel-content .btn-adicionar');
        if (img)   { img.src = getImgSrc(item.imagem); img.alt = item.nome; }
        if (nome)  nome.textContent  = item.nome;
        if (desc)  desc.textContent  = item.descricao || '';
        if (preco) preco.textContent = 'R$ ' + formatarPreco(item.preco);
        if (btn)   {
            btn.id = `btn-add-c-${item.id}`;
            btn.onclick = () => handleAdicionar(item.id);
            btn.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
            btn.classList.remove('btn-adicionado');
        }
        container.querySelectorAll('.carousel-dot').forEach((dot, i) =>
            dot.classList.toggle('ativo', i === current));
    }

    function iniciarTimer() {
        clearInterval(timer);
        if (destaques.length > 1)
            timer = setInterval(() => { current = (current + 1) % destaques.length; atualizarSlide(); }, 5000);
    }

    window.carouselNav = (dir) => { current = (current + dir + destaques.length) % destaques.length; atualizarSlide(); iniciarTimer(); };
    window.carouselGoTo = (i) => { current = i; atualizarSlide(); iniciarTimer(); };

    container.innerHTML = buildHTML(destaques[0]);
    iniciarTimer();
}

// ==========================================
// BANNERS — EMPILHADOS
// ==========================================

function renderizarBanners() {
    const container = document.getElementById('banners-section');
    if (!container) return;
    const desc = window.siteConfig?.combo_desconto || window.siteConfig?.combo?.desconto || 10;

    container.innerHTML = `
        <div class="banners-stack">
            <div class="banner-card banner-combo" onclick="navegarCategoria('combos-e-familia')">
                <div class="banner-left">
                    <div class="banner-emoji">🎯</div>
                    <div class="banner-texto">
                        <strong>Combine e ganhe ${desc}% OFF</strong>
                        <span>Escolha itens de categorias diferentes e ganhe desconto</span>
                    </div>
                </div>
                <button class="btn-banner">Montar</button>
            </div>
            <div class="banner-card banner-batata" onclick="navegarCategoria('acompanhamentos')">
                <div class="banner-left">
                    <div class="banner-emoji">🍟</div>
                    <div class="banner-texto">
                        <strong>Monte sua Batata</strong>
                        <span>Escolha adicionais e molhos do seu jeito</span>
                    </div>
                </div>
                <button class="btn-banner">Personalizar</button>
            </div>
        </div>
    `;
}

// ==========================================
// CARDS DE CATEGORIA
// ==========================================

function renderizarCategorias(cats) {
    const container = document.getElementById('categoria-grid');
    if (!container) return;

    container.innerHTML = cats.map((cat, index) => {
        const foto  = getFotoDestaque(cat);
        const qtd   = cat.itens ? cat.itens.length : 0;
        const desc  = getCatDescricao(cat.id);
        const icone = getCatIcone(cat.id);
        return `
            <div class="cat-card ${index % 2 === 1 ? 'cat-card--offset' : ''}"
                 onclick="navegarCategoria('${cat.id}')">
                <div class="cat-card-img-wrapper">
                    <img src="${foto}" alt="${cat.nome}" class="cat-card-img"
                         onerror="this.src='assets/img/hamburguer.png'" loading="lazy">
                    <div class="cat-card-overlay"></div>
                    <div class="cat-card-badge">${icone} ${cat.nome}</div>
                </div>
                <div class="cat-card-info">
                    <p class="cat-card-desc">${desc}</p>
                    <span class="cat-card-qtd">${qtd} itens →</span>
                </div>
                <div class="cat-borda-top"></div>
                <div class="cat-borda-bottom"></div>
            </div>
        `;
    }).join('');

    renderizarSidebar(cats);
}

function getFotoDestaque(cat) {
    if (!cat.itens || cat.itens.length === 0) return 'assets/img/hamburguer.png';
    const dest = cat.itens.find(i => i.destaque && i.imagem) || cat.itens.find(i => i.imagem);
    return dest?.imagem ? IMG_BASE + dest.imagem : 'assets/img/hamburguer.png';
}

// ==========================================
// SIDEBAR
// ==========================================

function renderizarSidebar(cats) {
    const sidebar = document.getElementById('cardapio-sidebar');
    if (!sidebar) return;
    const logoSrc = window.siteConfig?.negocio?.logo || 'assets/img/hamburguer.png';
    const nome    = window.siteConfig?.negocio?.nome  || 'JottaV Burguer';

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <img src="${logoSrc}" alt="${nome}" class="sidebar-logo"
                 onerror="this.src='assets/img/hamburguer.png'">
            <span class="sidebar-nome">${nome}</span>
        </div>
        <nav class="sidebar-nav">
            <button class="sidebar-item sidebar-item--home ativo" onclick="navegarHome()">
                <span>🏠</span><span>Início</span>
            </button>
            ${cats.map(cat => `
                <button class="sidebar-item" id="sidebar-${cat.id}"
                        onclick="navegarCategoria('${cat.id}')">
                    <span>${getCatIcone(cat.id)}</span><span>${cat.nome}</span>
                </button>`).join('')}
        </nav>
        <button class="sidebar-carrinho" id="sidebar-btn-carrinho">
            <i class="fas fa-shopping-cart"></i>
            <span>Carrinho</span>
            <span class="sidebar-badge" id="sidebar-badge">0</span>
        </button>
    `;

    document.getElementById('sidebar-btn-carrinho')?.addEventListener('click', abrirCarrinho);
}

function atualizarSidebarAtivo(catId) {
    document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('ativo'));
    if (catId) document.getElementById(`sidebar-${catId}`)?.classList.add('ativo');
    else document.querySelector('.sidebar-item--home')?.classList.add('ativo');
}

function abrirCarrinho() {
    if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
    const modal = document.getElementById('carrinho-modal');
    if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
}

// ==========================================
// TELA DE CATEGORIA
// ==========================================

function renderizarTelaCategoria(catId) {
    const cat = cardapioData.find(c => c.id === catId);
    if (!cat) return;

    const tituloEl = document.getElementById('categoria-titulo-wrapper');
    if (tituloEl) {
        tituloEl.innerHTML = `
            <span class="cat-icone-titulo">${getCatIcone(catId)}</span>
            <h2 class="cat-nome-titulo">${cat.nome}</h2>
            <span class="cat-qtd-titulo">${cat.itens.length} itens</span>
        `;
    }

    const bannerEl = document.getElementById('banner-contextual');
    if (bannerEl) {
        const desc = window.siteConfig?.combo_desconto || 10;
        if (catId === 'hamburgueres-artesanais' || catId === 'combos-e-familia') {
            bannerEl.innerHTML = `<div class="banner-contextual-wrap">
                <div class="banner-card banner-combo" onclick="navegarCategoria('combos-e-familia')">
                    <div class="banner-left">
                        <div class="banner-emoji">🎯</div>
                        <div class="banner-texto">
                            <strong>Combine e ganhe ${desc}% OFF</strong>
                            <span>Itens de categorias diferentes</span>
                        </div>
                    </div>
                    <button class="btn-banner">Montar</button>
                </div></div>`;
        } else if (catId === 'acompanhamentos') {
            bannerEl.innerHTML = `<div class="banner-contextual-wrap">
                <div class="banner-card banner-batata">
                    <div class="banner-left">
                        <div class="banner-emoji">🍟</div>
                        <div class="banner-texto">
                            <strong>Monte sua Batata</strong>
                            <span>Adicionais e molhos do seu jeito</span>
                        </div>
                    </div>
                    <button class="btn-banner">Personalizar</button>
                </div></div>`;
        } else {
            bannerEl.innerHTML = '';
        }
    }

    const grid = document.getElementById('itens-grid');
    if (!grid) return;

    const isLista = catId === 'acompanhamentos' || catId === 'bebidas';
    if (isLista) {
        grid.className = 'itens-lista';
        grid.innerHTML  = cat.itens.map(renderCardLista).join('');
    } else {
        grid.className = 'itens-grade';
        grid.innerHTML  = cat.itens.map(renderCardGrade).join('');
    }
}

// ==========================================
// CARDS
// ==========================================

function _precoBlock(item) {
    return item.promoPreco
        ? `<div class="item-preco-block">
               <span class="item-preco-antigo">R$ ${formatarPreco(item.preco)}</span>
               <span class="item-preco">R$ ${formatarPreco(item.promoPreco)}</span>
           </div>`
        : `<div class="item-preco-block">
               <span class="item-preco">R$ ${formatarPreco(item.preco)}</span>
           </div>`;
}

function _badge(item) {
    return item.badge
        ? `<span class="item-badge item-badge--${item.badge}">${getBadgeLabel(item.badge)}</span>`
        : '';
}

function renderCardGrade(item) {
    return `
        <div class="item-card-grade">
            <div class="item-card-img-wrapper">
                <img src="${getImgSrc(item.imagem)}" alt="${item.nome}" class="item-card-img"
                     onerror="this.src='assets/img/hamburguer.png'" loading="lazy">
                ${_badge(item)}
            </div>
            <div class="item-card-body">
                <h3 class="item-card-nome">${item.nome}</h3>
                <p class="item-card-desc">${item.descricao || ''}</p>
                <div class="item-card-footer">
                    ${_precoBlock(item)}
                    <button class="btn-adicionar" id="btn-add-${item.id}"
                            onclick="handleAdicionar(${item.id})">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>`;
}

function renderCardLista(item) {
    return `
        <div class="item-card-lista">
            <div class="item-lista-img-wrapper">
                <img src="${getImgSrc(item.imagem)}" alt="${item.nome}" class="item-lista-img"
                     onerror="this.src='assets/img/hamburguer.png'" loading="lazy">
                ${_badge(item)}
            </div>
            <div class="item-card-body">
                <h3 class="item-card-nome">${item.nome}</h3>
                <p class="item-card-desc">${item.descricao || ''}</p>
                <div class="item-card-footer">
                    ${_precoBlock(item)}
                    <button class="btn-adicionar" id="btn-add-${item.id}"
                            onclick="handleAdicionar(${item.id})">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>`;
}

// ==========================================
// ADICIONAR — CORRIGIDO
// ==========================================

function handleAdicionar(itemId) {
    let item = null; let catId = null;
    for (const cat of cardapioData) {
        const found = cat.itens.find(i => i.id === itemId);
        if (found) { item = found; catId = cat.id; break; }
    }
    if (!item) return;

    // ✅ CORREÇÃO: adicionais APENAS para hamburgueres e acompanhamentos
    const temAdicionais = adicionaisData.length > 0 && CATS_COM_ADICIONAIS.includes(catId);
    if (temAdicionais) abrirModalAdicionais(item);
    else adicionarAoCarrinho(item, [], item.preco);
}

function abrirModalAdicionais(item) {
    itemParaCustomizar = item;
    const nomeEl  = document.getElementById('item-customizacao-nome');
    const listaEl = document.getElementById('adicionais-opcoes-lista');
    const baseEl  = document.getElementById('preco-base-customizacao');
    const addEl   = document.getElementById('preco-adicionais-customizacao');
    const totalEl = document.getElementById('preco-total-item-customizacao');
    if (!listaEl) return;
    if (nomeEl)  nomeEl.textContent  = item.nome;
    if (baseEl)  baseEl.textContent  = formatarPreco(item.preco);
    if (addEl)   addEl.textContent   = '0,00';
    if (totalEl) totalEl.textContent = formatarPreco(item.preco);

    listaEl.innerHTML = adicionaisData.map(add => `
        <div class="adicional-option">
            <input type="checkbox" id="add-${add.id}" value="${add.id}"
                   onchange="atualizarResumoAdicionais(${item.preco})">
            <label for="add-${add.id}">
                <span class="adicional-nome">${add.nome}</span>
                <span class="adicional-preco">+ R$ ${formatarPreco(add.preco)}</span>
            </label>
        </div>`).join('');

    const modal = document.getElementById('customizacao-modal');
    if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
}

window.atualizarResumoAdicionais = function(precoBase) {
    let totalAdd = 0;
    document.querySelectorAll('#adicionais-opcoes-lista input:checked').forEach(cb => {
        const add = adicionaisData.find(a => String(a.id) === cb.value);
        if (add) totalAdd += add.preco;
    });
    const addEl   = document.getElementById('preco-adicionais-customizacao');
    const totalEl = document.getElementById('preco-total-item-customizacao');
    if (addEl)   addEl.textContent   = formatarPreco(totalAdd);
    if (totalEl) totalEl.textContent = formatarPreco(precoBase + totalAdd);
};

window.adicionarItemCustomizadoAoCarrinho = function() {
    if (!itemParaCustomizar) return;
    const adicionaisSel = []; let totalAdd = 0;
    document.querySelectorAll('#adicionais-opcoes-lista input:checked').forEach(cb => {
        const add = adicionaisData.find(a => String(a.id) === cb.value);
        if (add) { adicionaisSel.push(add); totalAdd += add.preco; }
    });
    adicionarAoCarrinho(itemParaCustomizar, adicionaisSel, itemParaCustomizar.preco + totalAdd);
    const modal = document.getElementById('customizacao-modal');
    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
    itemParaCustomizar = null;
};

function adicionarAoCarrinho(item, adicionais, precoTotal) {
    if (typeof window.carrinho === 'undefined') window.carrinho = [];
    const addIds    = adicionais.map(a => a.id).sort().join(',');
    const existente = window.carrinho.find(ci => {
        const ciIds = (ci.adicionais || []).map(a => a.id).sort().join(',');
        return ci.id === item.id && ciIds === addIds;
    });
    if (existente) { existente.quantidade++; }
    else {
        window.carrinho.push({
            id: item.id, nome: item.nome, preco: item.preco,
            precoTotal, quantidade: 1, adicionais, imagem: item.imagem || ''
        });
    }
    try { localStorage.setItem('carrinhoJottaV', JSON.stringify(window.carrinho)); } catch(e) {}
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
    mostrarNotificacao(item.nome);
    animarBotaoAdicionado(item.id);
}

function mostrarNotificacao(nome) {
    const el = document.getElementById('notificacao');
    if (!el) return;
    el.textContent = `✓ ${nome} adicionado!`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
}

function animarBotaoAdicionado(itemId) {
    [`btn-add-${itemId}`, `btn-add-c-${itemId}`].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.add('btn-adicionado');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('btn-adicionado'); }, 600);
    });
}

function atualizarBadgeSidebar() {
    const total = (window.carrinho || []).reduce((s, i) => s + (i.quantidade || 0), 0);
    const badge = document.getElementById('sidebar-badge');
    if (badge) badge.textContent = total;
}

const _origUpdate = window.updateContadorCarrinho;
window.updateContadorCarrinho = function() {
    if (typeof _origUpdate === 'function') _origUpdate();
    atualizarBadgeSidebar();
};

// ==========================================
// CARGA PRINCIPAL
// ==========================================

async function carregarCardapio() {
    try {
        const saved = localStorage.getItem('carrinhoJottaV');
        if (saved) window.carrinho = JSON.parse(saved);
    } catch(e) {}

    try {
        const r = await fetch('data/cardapio.json?v=' + Date.now());
        if (!r.ok) throw new Error('Erro ao carregar cardápio');
        const data = await r.json();

        cardapioData   = data.filter(c => c.id !== 'adicionais-extras');
        const addCat   = data.find(c => c.id === 'adicionais-extras');
        adicionaisData = addCat ? addCat.itens : [];

        renderizarCarousel(cardapioData.flatMap(c => c.itens));
        renderizarBanners();
        renderizarCategorias(cardapioData);

        document.getElementById('btn-voltar')?.addEventListener('click', navegarHome);
        document.getElementById('btn-bottom-home')?.addEventListener('click', navegarHome);
        document.getElementById('bottom-carrinho-btn')?.addEventListener('click', abrirCarrinho);

    } catch(e) {
        console.error('Erro ao carregar cardápio:', e);
        const grid = document.getElementById('categoria-grid');
        if (grid) grid.innerHTML = `<p style="color:#888;padding:16px;grid-column:1/-1">
            Erro ao carregar o cardápio. Tente recarregar a página.</p>`;
    }
}
