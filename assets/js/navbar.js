// ════════════════════════════════════════════════════════════
//  JOTTAV BURGUER — navbar.js
//  Stubs mantidos para compatibilidade + Tab Bar completo
// ════════════════════════════════════════════════════════════

// Stubs legados — mantidos para não quebrar app.js
function toggleHamburgerMenu() {}
function fecharMenuOnClick() {}
function setupNavbarEventListeners() {}

// ════════════════════════════════════════════════════════════
//  TAB BAR — gerado automaticamente via pills existentes
// ════════════════════════════════════════════════════════════
(function () {
    'use strict';

    // ── Mapa de ícones por palavra-chave no nome da categoria ──
    const ICONES = [
        { palavras: ['burger','hambur','smash','artesanal','classic','jotta'], ico: '🍔' },
        { palavras: ['combo'],                                                 ico: '🎯' },
        { palavras: ['acompan','batata','porcao','porção','fritas'],           ico: '🍟' },
        { palavras: ['bebida','drink','suco','refri','agua','lata'],           ico: '🥤' },
        { palavras: ['sobremesa','doce','milk','sorvete'],                     ico: '🍰' },
        { palavras: ['molho','adicional','extra'],                             ico: '🧂' },
    ];

    function getIcone(nome) {
        const n = nome.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

    function abreviar(nome) {
        const key = nome.toLowerCase().trim();
        if (ABREVIACOES[key]) return ABREVIACOES[key];
        return nome.length > 9 ? nome.substring(0, 8).trim() + '.' : nome;
    }

    // ── Injeta nome da loja ao lado do logo (uma vez só) ──
    function injetarNomeLoja() {
        const logo = document.querySelector('.logo');
        if (!logo || logo.querySelector('.logo-nome')) return;
        const span = document.createElement('span');
        span.className = 'logo-nome';
        span.textContent = 'JottaV Burguer';
        logo.appendChild(span);
    }

    // ── Cria o elemento #app-tab-bar no <body> ──
    function criarTabBar() {
        if (document.getElementById('app-tab-bar')) return;
        const nav = document.createElement('nav');
        nav.id = 'app-tab-bar';
        nav.setAttribute('role', 'tablist');
        nav.setAttribute('aria-label', 'Navegação do cardápio');
        nav.innerHTML = '<div class="tab-bar-inner" id="tab-bar-itens"></div>';
        document.body.appendChild(nav);
    }

    // ── Cria botão de aba para uma categoria ──
    function criarAbaCategoria(pill) {
        const nome  = pill.textContent.trim();
        const ativo = pill.classList.contains('ativo');

        const btn = document.createElement('button');
        btn.className = 'tab-item' + (ativo ? ' ativo' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', ativo ? 'true' : 'false');
        btn.dataset.pillNome = nome;

        btn.innerHTML =
            `<span class="tab-icone">${getIcone(nome)}</span>` +
            `<span class="tab-label">${abreviar(nome)}</span>` +
            (ativo ? '<div class="tab-indicator"></div>' : '');

        btn.addEventListener('click', () => {
            pill.click();           // dispara filtro original do app.js
            setAbaAtiva(btn);
        });

        return btn;
    }

    // ── Cria aba do carrinho ──
    function criarAbaCarrinho() {
        const btn = document.createElement('button');
        btn.className = 'tab-item';
        btn.id = 'tab-btn-carrinho';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', 'Carrinho');

        btn.innerHTML =
            `<span class="tab-icone">` +
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"` +
                ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
                `<circle cx="9" cy="21" r="1"/>` +
                `<circle cx="20" cy="21" r="1"/>` +
                `<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>` +
                `</svg>` +
                `<span class="tab-badge" id="tab-contador-carrinho"></span>` +
            `</span>` +
            `<span class="tab-label">Carrinho</span>`;

        btn.addEventListener('click', () => {
            // Aciona o botão de carrinho existente na navbar ou o FAB
            const alvo =
                document.querySelector('.carrinho-btn') ||
                document.getElementById('fab-carrinho');
            if (alvo) alvo.click();
        });

        return btn;
    }

    // ── Popula as abas a partir dos pills ──
    function popularAbas(pills) {
        const container = document.getElementById('tab-bar-itens');
        if (!container || pills.length === 0) return;

        // Preserva aba do carrinho se já existir
        const carrinhoExistente = document.getElementById('tab-btn-carrinho');
        container.innerHTML = '';

        pills.forEach(pill => container.appendChild(criarAbaCategoria(pill)));
        container.appendChild(carrinhoExistente || criarAbaCarrinho());
    }

    // ── Marca aba ativa, limpa as demais ──
    function setAbaAtiva(abaAlvo) {
        document.querySelectorAll('#app-tab-bar .tab-item').forEach(tab => {
            const ativo = tab === abaAlvo;
            tab.classList.toggle('ativo', ativo);
            tab.setAttribute('aria-selected', ativo ? 'true' : 'false');

            const ind = tab.querySelector('.tab-indicator');
            if (ativo && !ind) {
                const div = document.createElement('div');
                div.className = 'tab-indicator';
                tab.insertBefore(div, tab.firstChild);
            } else if (!ativo && ind) {
                ind.remove();
            }
        });
    }

    // ── Sincroniza aba ativa com o pill ativo (quando app.js filtra) ──
    function sincronizarAtivo(pills) {
        pills.forEach(pill => {
            const observer = new MutationObserver(() => {
                if (pill.classList.contains('ativo')) {
                    const nome = pill.textContent.trim();
                    const aba = document.querySelector(
                        `#app-tab-bar .tab-item[data-pill-nome="${nome}"]`
                    );
                    if (aba) setAbaAtiva(aba);
                }
            });
            observer.observe(pill, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ── Observa container de pills até ele existir e ter filhos ──
    function observarPills() {
        const container =
            document.querySelector('.navbar-pills') ||
            document.getElementById('categorias-pills');

        if (!container) {
            setTimeout(observarPills, 150);
            return;
        }

        function coletarPills() {
            return Array.from(container.querySelectorAll('.cat-pill, .categoria-pill'));
        }

        const existentes = coletarPills();
        if (existentes.length > 0) {
            popularAbas(existentes);
            sincronizarAtivo(existentes);
        }

        // Aguarda app.js renderizar os pills dinamicamente
        const obs = new MutationObserver(() => {
            const pills = coletarPills();
            if (pills.length > 0) {
                popularAbas(pills);
                sincronizarAtivo(pills);
                obs.disconnect(); // para de observar após primeiro render
            }
        });
        obs.observe(container, { childList: true, subtree: true });
    }

    // ════════════════════════════════════════════════════════
    //  CONTADOR CARRINHO — sincroniza navbar + tab bar
    //  Exposto globalmente para app.js chamar:
    //  window.atualizarContadorCarrinho(n)
    // ════════════════════════════════════════════════════════
    window.atualizarContadorCarrinho = function (n) {
        const num = Math.max(0, parseInt(n, 10) || 0);

        // Navbar (topo)
        const cNavbar = document.getElementById('contador-carrinho');
        if (cNavbar) {
            cNavbar.textContent = num;
            cNavbar.style.display = num > 0 ? 'flex' : 'none';
        }

        // FAB original (pode ainda ser referenciado em app.js)
        const cFab = document.getElementById('fab-contador-carrinho');
        if (cFab) cFab.textContent = num;

        // Tab bar (rodapé)
        const cTab = document.getElementById('tab-contador-carrinho');
        if (cTab) {
            cTab.textContent = num;
            cTab.style.display = num > 0 ? 'flex' : 'none';
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
