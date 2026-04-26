// navbar.js
// Stubs mantidos para compatibilidade com app.js
function toggleHamburgerMenu() {}
function fecharMenuOnClick() {}
function setupNavbarEventListeners() {}

// ═══════════════════════════════════════════════════
// TAB BAR — Navegação inferior estilo app nativo
// Sincroniza com os pills existentes via MutationObserver
// ═══════════════════════════════════════════════════
(function () {
    'use strict';

    // ── Mapa de ícones por palavra-chave ──
    const ICONES = [
        { palavras: ['burger', 'hambur', 'smash', 'artesanal', 'classic'], ico: '🍔' },
        { palavras: ['combo'],                                              ico: '🎯' },
        { palavras: ['acompan', 'batata', 'porcao', 'porção', 'fritas'],   ico: '🍟' },
        { palavras: ['bebida', 'drink', 'suco', 'refri', 'agua'],          ico: '🥤' },
        { palavras: ['sobremesa', 'doce', 'milk', 'sorvete'],              ico: '🍰' },
        { palavras: ['molho', 'adicional', 'extra'],                       ico: '🧂' },
    ];

    function getIcone(nome) {
        const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const { palavras, ico } of ICONES) {
            if (palavras.some(p => n.includes(p))) return ico;
        }
        return '🍽️';
    }

    // ── Abrevia nomes longos para caber na tab bar ──
    const ABREVIACOES = {
        'hambúrgueres artesanais': 'Burgers',
        'hambúrgueres':            'Burgers',
        'hamburgueres artesanais': 'Burgers',
        'hamburgueres':            'Burgers',
        'acompanhamentos':         'Acompan.',
        'sobremesas':              'Sobremesas',
        'bebidas':                 'Bebidas',
        'combos':                  'Combos',
    };

    function abreviarNome(nome) {
        const key = nome.toLowerCase().trim();
        if (ABREVIACOES[key]) return ABREVIACOES[key];
        return nome.length > 9 ? nome.substring(0, 8).trim() + '.' : nome;
    }

    // ── Injeta o nome da loja ao lado do logo ──
    function injetarNomeLoja() {
        const logo = document.querySelector('.logo');
        if (!logo || logo.querySelector('.logo-nome')) return;
        const span = document.createElement('span');
        span.className = 'logo-nome';
        span.textContent = 'JottaV Burguer';
        logo.appendChild(span);
    }

    // ── Cria o elemento #app-tab-bar no DOM ──
    function criarTabBar() {
        if (document.getElementById('app-tab-bar')) return;
        const nav = document.createElement('nav');
        nav.id = 'app-tab-bar';
        nav.setAttribute('role', 'tablist');
        nav.setAttribute('aria-label', 'Navegação do cardápio');
        nav.innerHTML = '<div class="tab-bar-inner" id="tab-bar-itens"></div>';
        document.body.appendChild(nav);
    }

    // ── Cria uma aba de categoria ──
    function criarAbaCategoria(pill) {
        const nome  = pill.textContent.trim();
        const icone = getIcone(nome);
        const label = abreviarNome(nome);
        const ativo = pill.classList.contains('ativo');

        const btn = document.createElement('button');
        btn.className = 'tab-item' + (ativo ? ' ativo' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', ativo ? 'true' : 'false');
        btn.dataset.pillRef = nome;

        btn.innerHTML =
            `<span class="tab-icone">${icone}</span>` +
            `<span class="tab-label">${label}</span>` +
            (ativo ? '<div class="tab-indicator"></div>' : '');

        btn.addEventListener('click', () => {
            pill.click(); // dispara a lógica de filtro original
            definirAbaAtiva(btn);
        });

        return btn;
    }

    // ── Cria a aba do carrinho ──
    function criarAbaCarrinho() {
        const btn = document.createElement('button');
        btn.className = 'tab-item tab-carrinho';
        btn.id = 'tab-btn-carrinho';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', 'Carrinho');

        btn.innerHTML =
            `<span class="tab-icone">` +
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"` +
                ` stroke="currentColor" stroke-width="2"` +
                ` stroke-linecap="round" stroke-linejoin="round">` +
                `<circle cx="9" cy="21" r="1"/>` +
                `<circle cx="20" cy="21" r="1"/>` +
                `<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72` +
                `a2 2 0 0 0 2-1.61L23 6H6"/>` +
                `</svg>` +
                `<span class="tab-badge" id="tab-contador-carrinho">0</span>` +
            `</span>` +
            `<span class="tab-label">Carrinho</span>`;

        btn.addEventListener('click', () => {
            // Aciona o botão de carrinho existente (qualquer seletor que existir)
            const alvo =
                document.querySelector('.carrinho-btn') ||
                document.getElementById('fab-carrinho');
            if (alvo) alvo.click();
        });

        return btn;
    }

    // ── Popula as abas a partir dos pills encontrados ──
    function popularAbas(pills) {
        const container = document.getElementById('tab-bar-itens');
        if (!container || pills.length === 0) return;

        container.innerHTML = '';

        pills.forEach(pill => {
            container.appendChild(criarAbaCategoria(pill));
        });

        container.appendChild(criarAbaCarrinho());
    }

    // ── Marca uma aba como ativa e remove das demais ──
    function definirAbaAtiva(abaAtiva) {
        document.querySelectorAll('#app-tab-bar .tab-item').forEach(tab => {
            const estaAtivo = tab === abaAtiva;
            tab.classList.toggle('ativo', estaAtivo);
            tab.setAttribute('aria-selected', estaAtivo ? 'true' : 'false');

            const ind = tab.querySelector('.tab-indicator');
            if (estaAtivo && !ind) {
                const div = document.createElement('div');
                div.className = 'tab-indicator';
                tab.appendChild(div);
            } else if (!estaAtivo && ind) {
                ind.remove();
            }
        });
    }

    // ── Observa os pills (navbar ou categorias-pills) ──
    function observarPills() {
        // Tenta os dois containers possíveis
        const alvo =
            document.querySelector('.navbar-pills') ||
            document.getElementById('categorias-pills');

        if (!alvo) {
            // Ainda não renderizado — tenta novamente
            setTimeout(observarPills, 150);
            return;
        }

        function coletar() {
            return Array.from(alvo.querySelectorAll('.cat-pill, .categoria-pill'));
        }

        // Popula imediatamente se já houver pills
        const existentes = coletar();
        if (existentes.length > 0) popularAbas(existentes);

        // Observa adições futuras (app.js renderiza depois)
        const observer = new MutationObserver(() => {
            const pills = coletar();
            if (pills.length > 0) popularAbas(pills);
        });
        observer.observe(alvo, { childList: true, subtree: true });

        // Observa mudança de classe .ativo nos pills (filtro ativado)
        const activeObs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (
                    m.type === 'attributes' &&
                    m.attributeName === 'class' &&
                    m.target.classList.contains('ativo')
                ) {
                    const nome = m.target.textContent.trim();
                    const abaCorrespondente = document.querySelector(
                        `#app-tab-bar .tab-item[data-pill-ref="${nome}"]`
                    );
                    if (abaCorrespondente) definirAbaAtiva(abaCorrespondente);
                }
            });
        });
        activeObs.observe(alvo, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });
    }

    // ── Atualiza contadores em TODOS os lugares ──
    // Chamada pelo restante do app: atualizarContadorCarrinho(n)
    window.atualizarContadorCarrinho = function (n) {
        const num = parseInt(n, 10) || 0;

        // Navbar topo
        const contNavbar = document.getElementById('contador-carrinho');
        if (contNavbar) {
            contNavbar.textContent = num;
            contNavbar.style.display = num > 0 ? 'flex' : 'none';
        }

        // FAB original (ainda pode ser referenciado por app.js)
        const contFab = document.getElementById('fab-contador-carrinho');
        if (contFab) contFab.textContent = num;

        // Tab bar rodapé
        const contTab = document.getElementById('tab-contador-carrinho');
        if (contTab) {
            contTab.textContent = num;
            contTab.style.display = num > 0 ? 'flex' : 'none';
        }
    };

    // ── Inicialização ──
    function init() {
        injetarNomeLoja();
        criarTabBar();
        observarPills();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
