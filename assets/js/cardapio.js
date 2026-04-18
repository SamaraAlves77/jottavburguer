// cardapio.js — JottaV Burguer v3.0
// Lógica: Home, Categorias, Cards, Carousel, Adicionais, Carrinho

// ==========================================
// ESTADO GLOBAL
// ==========================================
let cardapioData = [];
let adicionaisData = [];
let categoriaAtual = null;
let itemParaCustomizar = null;
const IMG_BASE = 'imagens/';

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
        'combos-e-familia': '🎯',
        'acompanhamentos': '🍟',
        'bebidas': '🥤',
    };
    return map[id] || '🍽️';
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
    const carr = document.getElementById('bottom-carrinho-btn');
    if (home) home.classList.toggle('ativo', view === 'home');
    if (carr) carr.classList.remove('ativo');
}

// ==========================================
// CAROUSEL
// ==========================================

function renderizarCarousel(todosItens) {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    const destaques = todosItens.filter(i => i.destaque);
    if (destaques.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    let current = 0;
    let timer;

    function buildHTML(item) {
        return `
            <div class="carousel-slide">
                <img src="${getImgSrc(item.imagem)}"
                     alt="${item.nome}"
                     class="carousel-img"
                     onerror="this.src='assets/img/hamburguer.png'">
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
                <button class="carousel-seta carousel-prev" onclick="carouselNav(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-seta carousel-next" onclick="carouselNav(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="carousel-dots">
                ${destaques.map((_, i) =>
                    `<button class="carousel-dot ${i === 0 ? 'ativo' : ''}"
                             onclick="carouselGoTo(${i})"></button>`
                ).join('')}
            </div>
        `;
    }

    function atualizarSlide() {
        const item = destaques[current];
        const img = container.querySelector('.carousel-img');
        const nome = container.querySelector('.carousel-nome');
        const desc = container.querySelector('.carousel-desc');
        const preco = container.querySelector('.carousel-preco');
        const btn = container.querySelector('.btn-adicionar');

        if (img) img.src = getImgSrc(item.imagem);
        if (nome) nome.textContent = item.nome;
        if (desc) desc.textContent = item.descricao || '';
        if (preco) preco.textContent = 'R$ ' + formatarPreco(item.preco);
        if (btn) {
            btn.id = `btn-add-c-${item.id}`;
            btn.onclick = () => handleAdicionar(item.id);
        }

        container.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('ativo', i === current);
        });
    }

    function iniciarTimer() {
        clearInterval(timer);
        if (destaques.length > 1) {
            timer = setInterval(() => {
                current = (current + 1) % destaques.length;
                atualizarSlide();
            }, 5000);
        }
    }

    window.carouselNav = (dir) => {
        current = (current + dir + destaques.length) % destaques.length;
        atualizarSlide();
        iniciarTimer();
    };

    window.carouselGoTo = (i) => {
        current = i;
        atualizarSlide();
        iniciarTimer();
    };

    container.innerHTML = buildHTML(destaques[0]);
    iniciarTimer();
}

// ==========================================
// BANNERS DE AÇÃO
// ==========================================

function renderizarBanners() {
    const container = document.getElementById('banners-section');
    if (!container) return;

    container.innerHTML = `
        <div class="banners-grid">
            <div class="banner-card" onclick="navegarCategoria('hamburgueres-artesanais')">
                <div class="banner-icon">🎯</div>
                <div class="banner-texto">
                    <strong>Combine e ganhe 10% OFF</strong>
                    <span>Escolha itens de categorias diferentes</span>
                </div>
                <button class="btn-banner">Montar</button>
            </div>
            <div class="banner-card" onclick="navegarCategoria('acompanhamentos')">
                <div class="banner-icon">🍟</div>
                <div class="banner-texto">
                    <strong>Monte sua Batata</strong>
                    <span>Escolha adicionais e molhos do seu jeito</span>
                </div>
                <button class="btn-banner">Personalizar</button>
            </div>
        </div>
    `;
}

// ==========================================
// CARDS DE CATEGORIA (estilo Suburbia adaptado)
// ==========================================

function renderizarCategorias(cats) {
    const container = document.getElementById('categoria-grid');
    if (!container) return;

    container.innerHTML = cats.map((cat, index) => {
        const fotoDestaque = getFotoDestaque(cat);
        const qtd = cat.itens ? cat.itens.length : 0;
        const icone = getCatIcone(cat.id);

        return `
            <div class="cat-card ${index % 2 === 1 ? 'cat-card--offset' : ''}"
                 onclick="navegarCategoria('${cat.id}')">
                <div class="cat-card-img-wrapper">
                    <img src="${fotoDestaque}"
                         alt="${cat.nome}"
                         class="cat-card-img"
                         onerror="this.src='assets/img/hamburguer.png'"
                         loading="lazy">
                    <div class="cat-card-overlay"></div>
                </div>
                <div class="cat-card-info">
                    <span class="cat-card-icone">${icone}</span>
                    <h3 class="cat-card-nome">${cat.nome}</h3>
                    <span class="cat-card-qtd">${qtd} itens</span>
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
    if (!dest || !dest.imagem) return 'assets/img/hamburguer.png';
    return IMG_BASE + dest.imagem;
}

// ==========================================
// SIDEBAR DESKTOP
// ==========================================

function renderizarSidebar(cats) {
    const sidebar = document.getElementById('cardapio-sidebar');
    if (!sidebar) return;

    const logoSrc = window.siteConfig?.negocio?.logo || 'assets/img/hamburguer.png';
    const nome = window.siteConfig?.negocio?.nome || 'JottaV Burguer';

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
                    <span>${getCatIcone(cat.id)}</span>
                    <span>${cat.nome}</span>
                </button>
            `).join('')}
        </nav>
        <button class="sidebar-carrinho" id="sidebar-btn-carrinho">
            <i class="fas fa-shopping-cart"></i>
            <span>Carrinho</span>
            <span class="sidebar-badge" id="sidebar-badge">0</span>
        </button>
    `;

    document.getElementById('sidebar-btn-carrinho')?.addEventListener('click', () => {
        document.getElementById('carrinho-btn')?.click();
    });
}

function atualizarSidebarAtivo(catId) {
    document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('ativo'));
    if (catId) {
        document.getElementById(`sidebar-${catId}`)?.classList.add('ativo');
    } else {
        document.querySelector('.sidebar-item--home')?.classList.add('ativo');
    }
}

// ==========================================
// TELA DE CATEGORIA
// ==========================================

function renderizarTelaCategoria(catId) {
    const cat = cardapioData.find(c => c.id === catId);
    if (!cat) return;

    // Título
    const tituloEl = document.getElementById('categoria-titulo-wrapper');
    if (tituloEl) {
        tituloEl.innerHTML = `
            <span class="cat-icone-titulo">${getCatIcone(catId)}</span>
            <h2 class="cat-nome-titulo">${cat.nome}</h2>
            <span class="cat-qtd-titulo">${cat.itens.length} itens</span>
        `;
    }

    // Banner contextual
    const bannerEl = document.getElementById('banner-contextual');
    if (bannerEl) {
        if (catId === 'hamburgueres-artesanais' || catId === 'combos-e-familia') {
            bannerEl.innerHTML = `
                <div class="banner-contextual-wrap" onclick="navegarCategoria('hamburgueres-artesanais')">
                    <div class="banner-card banner-card--contextual">
                        <div class="banner-icon">🎯</div>
                        <div class="banner-texto">
                            <strong>Combine e ganhe 10% OFF</strong>
                            <span>Escolha itens de categorias diferentes</span>
                        </div>
                        <button class="btn-banner">Montar</button>
                    </div>
                </div>
            `;
        } else if (catId === 'acompanhamentos') {
            bannerEl.innerHTML = `
                <div class="banner-contextual-wrap">
                    <div class="banner-card banner-card--contextual">
                        <div class="banner-icon">🍟</div>
                        <div class="banner-texto">
                            <strong>Monte sua Batata</strong>
                            <span>Escolha adicionais e molhos do seu jeito</span>
                        </div>
                        <button class="btn-banner">Personalizar</button>
                    </div>
                </div>
            `;
        } else {
            bannerEl.innerHTML = '';
        }
    }

    // Grid de itens
    const grid = document.getElementById('itens-grid');
    if (!grid) return;

    // Acomp. e bebidas em lista; o resto em grade
    const isLista = catId === 'acompanhamentos' || catId === 'bebidas';

    if (isLista) {
        grid.className = 'itens-lista';
        grid.innerHTML = cat.itens.map(item => renderCardLista(item)).join('');
    } else {
        grid.className = 'itens-grade';
        grid.innerHTML = cat.itens.map(item => renderCardGrade(item)).join('');
    }
}

// ==========================================
// CARD VERTICAL (grade — burgers/combos)
// ==========================================

function renderCardGrade(item) {
    const imgSrc = getImgSrc(item.imagem);
    const badge = item.badge
        ? `<span class="item-badge item-badge--${item.badge}">${getBadgeLabel(item.badge)}</span>`
        : '';
    const precoBlock = item.promoPreco
        ? `<div class="item-preco-block">
               <span class="item-preco-antigo">R$ ${formatarPreco(item.preco)}</span>
               <span class="item-preco">R$ ${formatarPreco(item.promoPreco)}</span>
           </div>`
        : `<div class="item-preco-block">
               <span class="item-preco">R$ ${formatarPreco(item.preco)}</span>
           </div>`;

    return `
        <div class="item-card-grade">
            <div class="item-card-img-wrapper">
                <img src="${imgSrc}" alt="${item.nome}" class="item-card-img"
                     onerror="this.src='assets/img/hamburguer.png'" loading="lazy">
                ${badge}
            </div>
            <div class="item-card-body">
                <h3 class="item-card-nome">${item.nome}</h3>
                <p class="item-card-desc">${item.descricao || ''}</p>
                <div class="item-card-footer">
                    ${precoBlock}
                    <button class="btn-adicionar" id="btn-add-${item.id}"
                            onclick="handleAdicionar(${item.id})">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// CARD LISTA (acompanhamentos / bebidas)
// ==========================================

function renderCardLista(item) {
    const imgSrc = getImgSrc(item.imagem);
    const badge = item.badge
        ? `<span class="item-badge item-badge--${item.badge}">${getBadgeLabel(item.badge)}</span>`
        : '';
    const precoBlock = item.promoPreco
        ? `<div class="item-preco-block">
               <span class="item-preco-antigo">R$ ${formatarPreco(item.preco)}</span>
               <span class="item-preco">R$ ${formatarPreco(item.promoPreco)}</span>
           </div>`
        : `<div class="item-preco-block">
               <span class="item-preco">R$ ${formatarPreco(item.preco)}</span>
           </div>`;

    return `
        <div class="item-card-lista">
            <div class="item-lista-img-wrapper">
                <img src="${imgSrc}" alt="${item.nome}" class="item-lista-img"
                     onerror="this.src='assets/img/hamburguer.png'" loading="lazy">
                ${badge}
            </div>
            <div class="item-card-body">
                <h3 class="item-card-nome">${item.nome}</h3>
                <p class="item-card-desc">${item.descricao || ''}</p>
                <div class="item-card-footer">
                    ${precoBlock}
                    <button class="btn-adicionar" id="btn-add-${item.id}"
                            onclick="handleAdicionar(${item.id})">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// LÓGICA DE ADICIONAR
// ==========================================

function handleAdicionar(itemId) {
    let item = null;
    for (const cat of cardapioData) {
        const found = cat.itens.find(i => i.id === itemId);
        if (found) { item = found; break; }
    }
    if (!item) return;

    if (adicionaisData.length > 0) {
        abrirModalAdicionais(item);
    } else {
        adicionarAoCarrinho(item, [], item.preco);
    }
}

function abrirModalAdicionais(item) {
    itemParaCustomizar = item;

    const nomeEl   = document.getElementById('item-customizacao-nome');
    const listaEl  = document.getElementById('adicionais-opcoes-lista');
    const baseEl   = document.getElementById('preco-base-customizacao');
    const addEl    = document.getElementById('preco-adicionais-customizacao');
    const totalEl  = document.getElementById('preco-total-item-customizacao');

    if (!listaEl) return;

    if (nomeEl) nomeEl.textContent = item.nome;
    if (baseEl) baseEl.textContent = formatarPreco(item.preco);
    if (addEl)  addEl.textContent  = '0,00';
    if (totalEl) totalEl.textContent = formatarPreco(item.preco);

    listaEl.innerHTML = adicionaisData.map(add => `
        <div class="adicional-option">
            <input type="checkbox" id="add-${add.id}" value="${add.id}"
                   onchange="atualizarResumoAdicionais(${item.preco})">
            <label for="add-${add.id}">
                <span class="adicional-nome">${add.nome}</span>
                <span class="adicional-preco">+ R$ ${formatarPreco(add.preco)}</span>
            </label>
        </div>
    `).join('');

    const modal = document.getElementById('customizacao-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function atualizarResumoAdicionais(precoBase) {
    const checks = document.querySelectorAll('#adicionais-opcoes-lista input:checked');
    let totalAdd = 0;
    checks.forEach(cb => {
        const add = adicionaisData.find(a => String(a.id) === cb.value);
        if (add) totalAdd += add.preco;
    });
    const addEl   = document.getElementById('preco-adicionais-customizacao');
    const totalEl = document.getElementById('preco-total-item-customizacao');
    if (addEl)   addEl.textContent   = formatarPreco(totalAdd);
    if (totalEl) totalEl.textContent = formatarPreco(precoBase + totalAdd);
}

// Chamado pelo app.js via btn-adicionar-customizado
window.adicionarItemCustomizadoAoCarrinho = function() {
    if (!itemParaCustomizar) return;

    const checks = document.querySelectorAll('#adicionais-opcoes-lista input:checked');
    const adicionaisSel = [];
    let totalAdd = 0;

    checks.forEach(cb => {
        const add = adicionaisData.find(a => String(a.id) === cb.value);
        if (add) { adicionaisSel.push(add); totalAdd += add.preco; }
    });

    adicionarAoCarrinho(itemParaCustomizar, adicionaisSel, itemParaCustomizar.preco + totalAdd);

    const modal = document.getElementById('customizacao-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    itemParaCustomizar = null;
};

function adicionarAoCarrinho(item, adicionais, precoTotal) {
    if (typeof carrinho === 'undefined') window.carrinho = [];

    const addIds = adicionais.map(a => a.id).sort().join(',');
    const existente = carrinho.find(ci => {
        const ciIds = (ci.adicionais || []).map(a => a.id).sort().join(',');
        return ci.id === item.id && ciIds === addIds;
    });

    if (existente) {
        existente.quantidade++;
    } else {
        carrinho.push({
            id: item.id,
            nome: item.nome,
            preco: item.preco,
            precoTotal: precoTotal,
            quantidade: 1,
            adicionais: adicionais,
            imagem: item.imagem || '',
        });
    }

    try { localStorage.setItem('carrinhoJottaV', JSON.stringify(carrinho)); } catch(e) {}

    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
    mostrarNotificacao(item.nome);
    animarBotaoAdicionado(item.id);
}

function mostrarNotificacao(nome) {
    const el = document.getElementById('notificacao');
    if (!el) return;
    el.textContent = `✓ ${nome} adicionado!`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
}

function animarBotaoAdicionado(itemId) {
    // Pode ter dois botões: grade e carousel
    [`btn-add-${itemId}`, `btn-add-c-${itemId}`].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.add('btn-adicionado');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('btn-adicionado');
        }, 600);
    });
}

// ==========================================
// ATUALIZAR BADGE SIDEBAR
// ==========================================

function atualizarBadgeSidebar() {
    const total = (window.carrinho || []).reduce((s, i) => s + (i.quantidade || 0), 0);
    const badge = document.getElementById('sidebar-badge');
    if (badge) badge.textContent = total;
}

// Sobrescreve updateContadorCarrinho para incluir sidebar
const _origUpdateContador = window.updateContadorCarrinho;
window.updateContadorCarrinho = function() {
    if (typeof _origUpdateContador === 'function') _origUpdateContador();
    atualizarBadgeSidebar();
};

// ==========================================
// CARGA PRINCIPAL
// ==========================================

async function carregarCardapio() {
    // Restaura carrinho do localStorage
    try {
        const saved = localStorage.getItem('carrinhoJottaV');
        if (saved) window.carrinho = JSON.parse(saved);
    } catch(e) {}

    try {
        const r = await fetch('data/cardapio.json?v=' + Date.now());
        if (!r.ok) throw new Error('Erro ao carregar cardápio');
        const data = await r.json();

        // Separa adicionais
        cardapioData   = data.filter(c => c.id !== 'adicionais-extras');
        const addCat   = data.find(c => c.id === 'adicionais-extras');
        adicionaisData = addCat ? addCat.itens : [];

        const todosItens = cardapioData.flatMap(c => c.itens);

        // Renderiza home
        renderizarCarousel(todosItens);
        renderizarBanners();
        renderizarCategorias(cardapioData);

        // Botão voltar
        const btnVoltar = document.getElementById('btn-voltar');
        if (btnVoltar) btnVoltar.onclick = navegarHome;

        // Bottom nav carrinho
        const bottomCarr = document.getElementById('bottom-carrinho-btn');
        if (bottomCarr) {
            bottomCarr.onclick = () => {
                if (typeof renderizarCarrinho === 'function') renderizarCarrinho();
                const carrinhoModal = document.getElementById('carrinho-modal');
                if (carrinhoModal) {
                    carrinhoModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            };
        }

    } catch(e) {
        console.error('Erro ao carregar cardápio:', e);
        const grid = document.getElementById('categoria-grid');
        if (grid) grid.innerHTML = '<p style="color:hsl(var(--muted-foreground));padding:16px">Erro ao carregar o cardápio. Tente recarregar a página.</p>';
    }
}
