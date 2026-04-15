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
    // Carrega config central se ainda não carregado
    if (!window.siteConfig) {
        try {
            const r = await fetch('data/config.json', { cache: 'no-store' });
            if (r.ok) window.siteConfig = await r.json();
        } catch(e) { window.siteConfig = {}; }
    }
    try {
        // cache: 'no-store' força busca real ignorando cache do browser E do CDN
        const response = await fetch('data/cardapio.json', {
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
            onerror="this.src='assets/img/hamburguer.png';this.style.objectFit='contain';this.style.padding='24px';this.style.mixBlendMode='screen';this.style.opacity='0.5'">`;
    }
    return `<img src="assets/img/hamburguer.png" alt="Sem imagem" loading="lazy"
        style="width:100%;height:100%;object-fit:contain;padding:24px;mix-blend-mode:screen;opacity:0.45">`;
}

function renderizarCardapio() {
    const container = document.getElementById('main-content-container');
    if (!container) return;
    container.innerHTML = '';

    // ── CARROSSEL GLOBAL DE DESTAQUES (topo único) ──────────────
    const todosDestaques = cardapioData.flatMap(secao =>
        secao.itens
            .filter(i => i.ativo !== false && i.destaque === true)
            .map(i => ({ ...i, secaoId: secao.id, secaoNome: secao.nome }))
    );

    if (todosDestaques.length > 0) {
        const carWrap = document.createElement('div');
        carWrap.className = 'destaque-wrap';
        carWrap.innerHTML = `
            <div class="destaque-track">
                <div class="destaque-slides" id="slides-global">
                    ${todosDestaques.map(item => {
                        const preco = (item.preco || 0).toFixed(2).replace('.', ',');
                        const badge = item.badge || item.secaoNome;
                        const fotoSrc = item.imagem ? `imagens/${item.imagem}` : 'assets/img/hamburguer.png';
                        return `
                        <div class="destaque-slide">
                            <div class="destaque-foto">
                                <img src="${fotoSrc}" alt="${item.nome}" loading="lazy"
                                    onerror="this.src='assets/img/hamburguer.png';this.style.objectFit='contain';this.style.padding='20px';this.style.opacity='.4'">
                                <div class="destaque-foto-fade"></div>
                            </div>
                            <div class="destaque-body">
                                ${badge ? `<span class="destaque-badge">${badge}</span>` : ''}
                                <h3 class="destaque-nome">${item.nome}</h3>
                                <p class="destaque-desc">${item.descricao || ''}</p>
                                <div class="destaque-footer">
                                    <span class="destaque-preco">R$ ${preco}</span>
                                    <button class="card-btn btn-adicionar destaque-btn"
                                        data-item-id="${item.id}" data-categoria-id="${item.secaoId}">
                                        Adicionar 🛒
                                    </button>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            ${todosDestaques.length > 1 ? `
            <div class="destaque-dots" id="dots-global">
                ${todosDestaques.map((_, i) => `
                    <div class="destaque-dot ${i===0?'ativo':''}" data-idx="${i}" data-secao="global"></div>
                `).join('')}
            </div>` : ''}
        `;
        container.appendChild(carWrap);
        if (todosDestaques.length > 1) inicializarCarrossel('global', todosDestaques.length);
    }

    // ── BANNERS COMBO + BATATA ───────────────────────────────────
    renderizarBannersEspeciais();

    // ── GRADE COMPLETA — TODOS OS ITENS POR SEÇÃO ───────────────
    cardapioData.forEach(secao => {
        if (secao.id === 'adicionais-extras') return;

        const itensAtivos = secao.itens.filter(i => i.ativo !== false);
        if (itensAtivos.length === 0) return;

        const section = document.createElement('section');
        section.id = secao.id;
        section.classList.add('menu-section');

        section.innerHTML = `
            <h2 class="section-title">${secao.nome}</h2>
            <div class="cardapio-grid">
                ${itensAtivos.map(item => {
                    const preco = (item.preco || 0).toFixed(2).replace('.', ',');
                    return `
                    <div class="item-card" data-item-id="${item.id}" data-categoria-id="${secao.id}">
                        <div class="card-img-wrapper">${gerarImagemCard(item)}</div>
                        <div class="card-body">
                            <h3 class="card-nome">${item.nome}</h3>
                            <p class="card-desc">${item.descricao || ''}</p>
                            <div class="card-footer">
                                <span class="card-preco">R$ ${preco}</span>
                                <button class="card-btn btn-adicionar"
                                    data-item-id="${item.id}" data-categoria-id="${secao.id}">
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;

        container.appendChild(section);
    });

    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', handleAdicionarAoCarrinho);
    });

    renderizarCategoriasPills();
}

// ── BANNERS ESPECIAIS (Combo + Batata) ──────────────────────
function renderizarBannersEspeciais() {
    const container = document.getElementById('main-content-container');
    if (!container) return;

    // Inserir banners antes do primeiro section
    const firstSection = container.querySelector('section');
    if (!firstSection) return;

    // Remover banners anteriores se existirem
    const anterior = document.getElementById('banners-especiais');
    if (anterior) anterior.remove();

    const div = document.createElement('div');
    div.id = 'banners-especiais';
    div.innerHTML = `
        <div class="combo-banner" onclick="abrirComboModal()">
            <div class="combo-banner-left">
                <div class="combo-ico">🎯</div>
                <div>
                    <div class="combo-banner-title">Combine e ganhe 10% OFF</div>
                    <div class="combo-banner-sub">Escolha itens de categorias diferentes e ganhe desconto</div>
                </div>
            </div>
            <button class="combo-banner-cta">Montar →</button>
        </div>
        <div class="batata-banner" onclick="abrirBatataModal()">
            <div class="combo-banner-left">
                <div class="batata-ico">🍟</div>
                <div>
                    <div class="combo-banner-title">Monte sua Batata</div>
                    <div class="combo-banner-sub">Escolha adicionais e molhos do seu jeito</div>
                </div>
            </div>
            <button class="batata-banner-cta">Personalizar →</button>
        </div>
    `;
    container.insertBefore(div, firstSection);
}

// ── MODAL COMBO INTELIGENTE ──────────────────────────────────
function abrirComboModal() {
    // Categorias que fazem sentido no combo (exceto adicionais e combos prontos)
    const CATS_COMBO = ['hamburgueres-artesanais', 'acompanhamentos', 'bebidas'];
    const cats = cardapioData.filter(s =>
        CATS_COMBO.includes(s.id) &&
        s.itens.some(i => i.ativo !== false)
    );

    let selecionados = {}; // { catId: { item, preco } }

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.id = 'combo-modal-overlay';

    overlay.innerHTML = `
        <div class="combo-modal">
            <div class="combo-modal-header">
                <span class="combo-modal-titulo">🎯 Monte seu Combo — 10% OFF</span>
                <button class="combo-modal-close" onclick="fecharComboModal()">✕</button>
            </div>
            <div class="combo-modal-cats" id="combo-modal-cats">
                ${cats.map(s => `
                    <button class="combo-cat-tab ${cats[0].id === s.id ? 'ativo' : ''}"
                        data-cat="${s.id}" onclick="trocarCatCombo('${s.id}')">
                        ${s.nome}
                    </button>
                `).join('')}
            </div>
            <div class="combo-aviso" id="combo-aviso">
                Selecione itens de 2 ou mais categorias para ganhar 10% OFF
            </div>
            <div class="combo-modal-lista" id="combo-modal-lista"></div>
            <div class="combo-modal-resumo" id="combo-modal-resumo">
                <div class="combo-resumo-itens" id="combo-resumo-itens"></div>
                <div class="combo-resumo-sep"></div>
                <div class="combo-resumo-total-row">
                    <span class="combo-resumo-label">Total</span>
                    <div>
                        <div class="combo-resumo-original" id="combo-orig" style="display:none"></div>
                        <div class="combo-resumo-final" id="combo-total">R$ 0,00</div>
                    </div>
                </div>
            </div>
            <div class="combo-modal-footer">
                <button class="combo-btn-cancel" onclick="fecharComboModal()">Cancelar</button>
                <button class="combo-btn-add" id="combo-btn-add" disabled onclick="adicionarComboAoCarrinho()">
                    Adicionar ao Carrinho 🛒
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharComboModal(); });

    // Estado do modal
    window._comboState = { cats, selecionados, catAtual: cats[0]?.id };
    renderizarListaCombo();
    atualizarResumoCombo();
}

function fecharComboModal() {
    const el = document.getElementById('combo-modal-overlay');
    if (el) el.remove();
}

function trocarCatCombo(catId) {
    window._comboState.catAtual = catId;
    document.querySelectorAll('.combo-cat-tab').forEach(t => {
        t.classList.toggle('ativo', t.getAttribute('data-cat') === catId);
    });
    renderizarListaCombo();
}

function renderizarListaCombo() {
    const { cats, selecionados, catAtual } = window._comboState;
    const secao = cats.find(s => s.id === catAtual);
    if (!secao) return;
    const lista = document.getElementById('combo-modal-lista');
    if (!lista) return;

    lista.innerHTML = secao.itens
        .filter(i => i.ativo !== false)
        .map(item => {
            const preco = (item.preco || 0).toFixed(2).replace('.', ',');
            const sel = selecionados[catAtual]?.id === item.id;
            const fotoSrc = item.imagem ? `imagens/${item.imagem}` : 'assets/img/hamburguer.png';
            return `
            <div class="combo-item-row ${sel ? 'sel' : ''}" onclick="selecionarComboItem('${catAtual}', ${item.id})">
                <img class="combo-item-img" src="${fotoSrc}" alt="${item.nome}"
                    onerror="this.src='assets/img/hamburguer.png';this.style.objectFit='contain';this.style.padding='6px'">
                <div class="combo-item-info">
                    <div class="combo-item-nome">${item.nome}</div>
                    <div class="combo-item-preco">R$ ${preco}</div>
                </div>
                <div class="combo-item-check">${sel ? '✓' : ''}</div>
            </div>`;
        }).join('');
}

function selecionarComboItem(catId, itemId) {
    const { cats, selecionados } = window._comboState;
    const secao = cats.find(s => s.id === catId);
    const item = secao?.itens.find(i => i.id === itemId);
    if (!item) return;

    if (selecionados[catId]?.id === itemId) {
        delete selecionados[catId];
    } else {
        selecionados[catId] = item;
    }

    // Atualizar tab com check
    document.querySelectorAll('.combo-cat-tab').forEach(t => {
        const id = t.getAttribute('data-cat');
        const temSel = selecionados[id] !== undefined;
        t.textContent = (temSel ? '✓ ' : '') + (cats.find(s => s.id === id)?.nome || '');
    });

    renderizarListaCombo();
    atualizarResumoCombo();
}

function atualizarResumoCombo() {
    const { selecionados } = window._comboState;
    const entries = Object.entries(selecionados);
    const ncats = entries.length;
    const subtotal = entries.reduce((s, [, item]) => s + (item.preco || 0), 0);
    const temDesc = ncats >= 2;
    const total = temDesc ? subtotal * 0.9 : subtotal;
    const desconto = subtotal - total;

    const aviso = document.getElementById('combo-aviso');
    if (aviso) {
        if (temDesc) {
            aviso.textContent = '🎉 10% OFF aplicado no seu combo!';
            aviso.className = 'combo-aviso ativo';
        } else if (ncats === 1) {
            aviso.textContent = 'Adicione mais 1 categoria para ganhar 10% OFF';
            aviso.className = 'combo-aviso';
        } else {
            aviso.textContent = 'Selecione itens de 2 ou mais categorias para ganhar 10% OFF';
            aviso.className = 'combo-aviso';
        }
    }

    const resumoItens = document.getElementById('combo-resumo-itens');
    if (resumoItens) {
        resumoItens.innerHTML = entries.length
            ? entries.map(([, item]) => `
                <div class="combo-resumo-item">
                    <span>${item.nome}</span>
                    <span>R$ ${(item.preco||0).toFixed(2).replace('.', ',')}</span>
                </div>`).join('')
            : '<div class="combo-resumo-vazio">Nenhum item selecionado</div>';
    }

    const origEl = document.getElementById('combo-orig');
    const totalEl = document.getElementById('combo-total');
    if (origEl) {
        origEl.style.display = temDesc ? '' : 'none';
        origEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }
    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    const btn = document.getElementById('combo-btn-add');
    if (btn) btn.disabled = ncats < 1;
}

function adicionarComboAoCarrinho() {
    const { selecionados } = window._comboState;
    const entries = Object.entries(selecionados);
    const ncats = entries.length;
    if (ncats < 1) return;

    const subtotal = entries.reduce((s, [, item]) => s + (item.preco || 0), 0);
    const temDesc = ncats >= 2;
    const total = temDesc ? subtotal * 0.9 : subtotal;

    // Adicionar como item único de combo
    carrinho.push({
        id: 'combo-' + Date.now(),
        nome: '🎯 Combo ' + entries.map(([,i]) => i.nome).join(' + '),
        preco: total,
        precoTotal: total,
        quantidade: 1,
        isCombo: true,
        itensCombo: entries.map(([, i]) => i),
        desconto: temDesc ? 10 : 0
    });

    salvarCarrinhoLocal();
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
    fecharComboModal();
    if (typeof showNotification === 'function') showNotification(temDesc ? '🎉 Combo adicionado com 10% OFF!' : '✅ Itens adicionados ao carrinho!');
}

// ── MODAL MONTE SUA BATATA ───────────────────────────────────
function abrirBatataModal() {
    const secaoAcomp = cardapioData.find(s => s.id === 'acompanhamentos');
    const secaoAdic = cardapioData.find(s => s.id === 'adicionais-extras');
    const batataBase = secaoAcomp?.itens.find(i =>
        i.ativo !== false && i.nome.toLowerCase().includes('batata frita')
    ) || secaoAcomp?.itens.find(i => i.ativo !== false);

    if (!batataBase) { alert('Nenhuma batata disponível no cardápio.'); return; }

    const adicionais = secaoAdic?.itens.filter(i => i.ativo !== false) || [];
    let selecionados = new Set();

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.id = 'batata-modal-overlay';

    overlay.innerHTML = `
        <div class="combo-modal">
            <div class="combo-modal-header">
                <span class="combo-modal-titulo">🍟 Monte sua Batata</span>
                <button class="combo-modal-close" onclick="fecharBatataModal()">✕</button>
            </div>
            <div style="padding:10px 14px 0;color:#888;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase">
                Base
            </div>
            <div class="batata-base-item">
                <img src="${batataBase.imagem ? 'imagens/'+batataBase.imagem : 'assets/img/hamburguer.png'}"
                    class="combo-item-img" alt="${batataBase.nome}"
                    onerror="this.src='assets/img/hamburguer.png';this.style.objectFit='contain';this.style.padding='6px'">
                <div class="combo-item-info">
                    <div class="combo-item-nome">${batataBase.nome}</div>
                    <div class="combo-item-preco">R$ ${(batataBase.preco||0).toFixed(2).replace('.', ',')}</div>
                </div>
                <div class="combo-item-check" style="background:#45a135;border-color:#45a135;color:#fff">✓</div>
            </div>
            <div style="padding:10px 14px 6px;color:#888;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase">
                Adicionais (escolha quantos quiser)
            </div>
            <div class="batata-adicionais" id="batata-adicionais">
                ${adicionais.map((a, i) => `
                    <div class="batata-chip" id="chip-${i}" onclick="toggleAdicionalBatata(${i}, ${a.preco || 0}, '${a.nome}')">
                        <span class="batata-chip-nome">${a.nome}</span>
                        <span class="batata-chip-preco">+R$ ${(a.preco||0).toFixed(2).replace('.', ',')}</span>
                    </div>
                `).join('')}
            </div>
            <div class="combo-modal-resumo" id="batata-resumo">
                <div class="combo-resumo-itens" id="batata-resumo-itens">
                    <div class="combo-resumo-item">
                        <span>${batataBase.nome}</span>
                        <span>R$ ${(batataBase.preco||0).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                <div class="combo-resumo-sep"></div>
                <div class="combo-resumo-total-row">
                    <span class="combo-resumo-label">Total</span>
                    <div class="combo-resumo-final" id="batata-total">R$ ${(batataBase.preco||0).toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
            <div class="combo-modal-footer">
                <button class="combo-btn-cancel" onclick="fecharBatataModal()">Cancelar</button>
                <button class="combo-btn-add" onclick="adicionarBatataAoCarrinho()">
                    Adicionar ao Carrinho 🛒
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharBatataModal(); });
    window._batataState = { batataBase, adicionais, selecionados };
}

function fecharBatataModal() {
    const el = document.getElementById('batata-modal-overlay');
    if (el) el.remove();
}

function toggleAdicionalBatata(idx, preco, nome) {
    const { selecionados } = window._batataState;
    const chip = document.getElementById('chip-' + idx);
    if (selecionados.has(idx)) {
        selecionados.delete(idx);
        chip?.classList.remove('sel');
    } else {
        selecionados.add(idx);
        chip?.classList.add('sel');
    }
    atualizarResumoBatata();
}

function atualizarResumoBatata() {
    const { batataBase, adicionais, selecionados } = window._batataState;
    let total = batataBase.preco || 0;
    let html = `<div class="combo-resumo-item"><span>${batataBase.nome}</span><span>R$ ${total.toFixed(2).replace('.', ',')}</span></div>`;

    selecionados.forEach(idx => {
        const a = adicionais[idx];
        if (a) {
            total += a.preco || 0;
            html += `<div class="combo-resumo-item"><span>+ ${a.nome}</span><span>R$ ${(a.preco||0).toFixed(2).replace('.', ',')}</span></div>`;
        }
    });

    document.getElementById('batata-resumo-itens').innerHTML = html;
    document.getElementById('batata-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function adicionarBatataAoCarrinho() {
    const { batataBase, adicionais, selecionados } = window._batataState;
    let total = batataBase.preco || 0;
    const adics = [];
    selecionados.forEach(idx => {
        const a = adicionais[idx];
        if (a) { total += a.preco || 0; adics.push(a); }
    });

    carrinho.push({
        id: 'batata-' + Date.now(),
        nome: '🍟 ' + batataBase.nome + (adics.length ? ' + ' + adics.map(a => a.nome).join(', ') : ''),
        preco: total,
        precoTotal: total,
        quantidade: 1,
        adicionais: adics
    });

    salvarCarrinhoLocal();
    if (typeof updateContadorCarrinho === 'function') updateContadorCarrinho();
    fecharBatataModal();
    if (typeof showNotification === 'function') showNotification('🍟 Batata personalizada adicionada!');
}

function inicializarCarrossel(secaoId, total) {
    const slides  = document.getElementById(`slides-${secaoId}`);
    const dotsEl  = document.getElementById(`dots-${secaoId}`);
    if (!slides) return;

    let atual = 0;

    const getDots = () => dotsEl ? dotsEl.querySelectorAll('.destaque-dot') : [];

    function irPara(n) {
        atual = ((n % total) + total) % total;
        slides.style.transform = `translateX(-${atual * 100}%)`;
        getDots().forEach((d, i) => d.classList.toggle('ativo', i === atual));
    }

    // Dots clicáveis
    if (dotsEl) {
        dotsEl.querySelectorAll('.destaque-dot').forEach(d => {
            d.addEventListener('click', () => irPara(parseInt(d.getAttribute('data-idx'))));
        });
    }

    // Auto-play
    let timer = setInterval(() => irPara(atual + 1), 7000);
    slides.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
    slides.parentElement.addEventListener('mouseleave', () => {
        timer = setInterval(() => irPara(atual + 1), 4000);
    });

    // Touch/swipe
    let startX = 0;
    slides.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
    slides.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) irPara(atual + (diff > 0 ? 1 : -1));
    });
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
