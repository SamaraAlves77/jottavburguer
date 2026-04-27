// ════════════════════════════════════════════════════════════
//  JOTTAV BURGUER — navbar.js  (v3 — QA aprovado)
//  Stubs de compatibilidade + Tab Bar robusto
// ════════════════════════════════════════════════════════════

// Stubs legados — não remover (app.js pode chamar)
function toggleHamburgerMenu() {}
function fecharMenuOnClick()   {}
function setupNavbarEventListeners() {}

(function () {
    'use strict';

    // ── Ícones por palavra-chave ──────────────────────────────
    var ICONES = [
        { p: ['burger','hambur','smash','artesanal','classic','jotta'], i: '🍔' },
        { p: ['combo'],                                                  i: '🎯' },
        { p: ['acompan','batata','porcao','porcão','fritas'],            i: '🍟' },
        { p: ['bebida','drink','suco','refri','agua','lata'],            i: '🥤' },
        { p: ['sobremesa','doce','milk','sorvete'],                      i: '🍰' },
        { p: ['molho','adicional','extra'],                              i: '🧂' },
    ];

    function getIcone(nome) {
        var n = (nome || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (var k = 0; k < ICONES.length; k++) {
            for (var j = 0; j < ICONES[k].p.length; j++) {
                if (n.indexOf(ICONES[k].p[j]) !== -1) return ICONES[k].i;
            }
        }
        return '🍽️';
    }

    // ── Abrevia texto para tab bar ────────────────────────────
    var ABREV = {
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
        var k = (nome || '').toLowerCase().trim();
        if (ABREV[k]) return ABREV[k];
        return nome.length > 9 ? nome.substring(0, 8).trim() + '.' : nome;
    }

    // ════════════════════════════════════════════════════════
    //  NOME DA LOJA — injeta ao lado do logo
    //  Tenta até o .logo existir no DOM
    // ════════════════════════════════════════════════════════
    function injetarNomeLoja() {
        var logo = document.querySelector('.logo');
        if (!logo) {
            setTimeout(injetarNomeLoja, 100);
            return;
        }
        if (logo.querySelector('.logo-nome')) return;
        var span = document.createElement('span');
        span.className = 'logo-nome';
        span.textContent = 'JottaV Burguer';
        logo.appendChild(span);
    }

    // ════════════════════════════════════════════════════════
    //  TAB BAR — cria estrutura no <body>
    // ════════════════════════════════════════════════════════
    function criarTabBar() {
        if (document.getElementById('app-tab-bar')) return;
        var nav = document.createElement('nav');
        nav.id = 'app-tab-bar';
        nav.setAttribute('role', 'tablist');
        nav.setAttribute('aria-label', 'Navegação do cardápio');
        nav.innerHTML = '<div class="tab-bar-inner" id="tab-bar-itens"></div>';
        document.body.appendChild(nav);
    }

    // ── Botão de categoria ────────────────────────────────────
    function criarAbaCategoria(nome, ativo) {
        var btn = document.createElement('button');
        btn.className = 'tab-item' + (ativo ? ' ativo' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', ativo ? 'true' : 'false');
        btn.dataset.pillNome = nome;

        btn.innerHTML =
            '<span class="tab-icone">' + getIcone(nome) + '</span>' +
            '<span class="tab-label">' + abreviar(nome) + '</span>' +
            (ativo ? '<div class="tab-indicator"></div>' : '');

        btn.addEventListener('click', function () {
            var pills = document.querySelectorAll(
                '.navbar-pills .cat-pill, .categorias-pills .cat-pill, ' +
                '#categorias-pills .cat-pill, .cat-pill'
            );
            for (var i = 0; i < pills.length; i++) {
                if (pills[i].textContent.trim() === nome) {
                    pills[i].click();
                    break;
                }
            }
            setAbaAtiva(btn);
        });

        return btn;
    }

    // ── Botão do carrinho ─────────────────────────────────────
    function criarAbaCarrinho() {
        var btn = document.createElement('button');
        btn.className = 'tab-item';
        btn.id = 'tab-btn-carrinho';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', 'Carrinho');

        btn.innerHTML =
            '<span class="tab-icone">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"' +
                ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<circle cx="9" cy="21" r="1"/>' +
                '<circle cx="20" cy="21" r="1"/>' +
                '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72' +
                'a2 2 0 0 0 2-1.61L23 6H6"/>' +
                '</svg>' +
                '<span class="tab-badge" id="tab-contador-carrinho"></span>' +
            '</span>' +
            '<span class="tab-label">Carrinho</span>';

        btn.addEventListener('click', function () {
            var alvo =
                document.querySelector('.carrinho-btn') ||
                document.getElementById('fab-carrinho');
            if (alvo) alvo.click();
        });

        return btn;
    }

    // ── Popula abas ───────────────────────────────────────────
    function popularAbas(dados) {
        var container = document.getElementById('tab-bar-itens');
        if (!container || dados.length === 0) return;

        var carrinhoBtn = document.getElementById('tab-btn-carrinho');
        container.innerHTML = '';

        dados.forEach(function (item, idx) {
            container.appendChild(criarAbaCategoria(item.nome, item.ativo || idx === 0));
        });

        container.appendChild(carrinhoBtn || criarAbaCarrinho());
    }

    // ── Ativa aba e desativa demais ───────────────────────────
    function setAbaAtiva(alvo) {
        document.querySelectorAll('#app-tab-bar .tab-item').forEach(function (tab) {
            var ativo = tab === alvo;
            tab.classList.toggle('ativo', ativo);
            tab.setAttribute('aria-selected', ativo ? 'true' : 'false');
            var ind = tab.querySelector('.tab-indicator');
            if (ativo && !ind) {
                var div = document.createElement('div');
                div.className = 'tab-indicator';
                tab.insertBefore(div, tab.firstChild);
            } else if (!ativo && ind) {
                ind.remove();
            }
        });
    }

    // ── Observa mudança de .ativo nos pills ──────────────────
    function observarAtivos(pills) {
        pills.forEach(function (pill) {
            new MutationObserver(function () {
                if (pill.classList.contains('ativo')) {
                    var nome = pill.textContent.trim();
                    var aba = document.querySelector(
                        '#app-tab-bar .tab-item[data-pill-nome="' + nome + '"]'
                    );
                    if (aba) setAbaAtiva(aba);
                }
            }).observe(pill, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ════════════════════════════════════════════════════════
    //  BUSCA DE PILLS — retry robusto até 5 segundos
    // ════════════════════════════════════════════════════════
    var _tentativas    = 0;
    var _populado      = false;

    function coletarPills() {
        var seletores = [
            '.navbar-pills .cat-pill',
            '#categorias-pills .cat-pill',
            '.categorias-pills .cat-pill',
            '.cat-pill',
        ];
        for (var i = 0; i < seletores.length; i++) {
            var found = document.querySelectorAll(seletores[i]);
            if (found.length > 0) return Array.from(found);
        }
        return [];
    }

    function tentarPopularAbas() {
        if (_populado) return;

        var pills = coletarPills();

        if (pills.length > 0) {
            _populado = true;
            var dados = pills.map(function (pill) {
                return {
                    nome:  pill.textContent.trim(),
                    ativo: pill.classList.contains('ativo'),
                };
            });
            popularAbas(dados);
            observarAtivos(pills);
            return;
        }

        _tentativas++;
        if (_tentativas < 25) { // 25 × 200ms = 5 segundos
            setTimeout(tentarPopularAbas, 200);
        }
    }

    // ════════════════════════════════════════════════════════
    //  CONTADOR CARRINHO — sincroniza navbar + tab bar
    //  Chamada pelo app.js: window.atualizarContadorCarrinho(n)
    // ════════════════════════════════════════════════════════
    window.atualizarContadorCarrinho = function (n) {
        var num = Math.max(0, parseInt(n, 10) || 0);

        var cNavbar = document.getElementById('contador-carrinho');
        if (cNavbar) {
            cNavbar.textContent = num;
            cNavbar.style.display = num > 0 ? 'flex' : 'none';
        }

        var cFab = document.getElementById('fab-contador-carrinho');
        if (cFab) cFab.textContent = num;

        var cTab = document.getElementById('tab-contador-carrinho');
        if (cTab) {
            cTab.textContent = num;
            cTab.style.display = num > 0 ? 'flex' : 'none';
        }
    };

    // ════════════════════════════════════════════════════════
    //  INIT
    // ════════════════════════════════════════════════════════
    function init() {
        criarTabBar();
        injetarNomeLoja();
        tentarPopularAbas();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
