// index.js - Ponto de Entrada, Carregamento de Componentes e Setup

// =======================================================
// FUNÇÕES DE CARREGAMENTO DINÂMICO DE HTML (Fetch)
// =======================================================

async function loadHTML(url, elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        // Se o elemento não existe (ex: modal_carrinho.html no index.html), ignora.
        if (url === 'navbar.html' || url === 'modal_carrinho.html') return true; 
        console.error(`Contêiner de destino '${elementId}' não encontrado.`);
        return false;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Aviso: Arquivo ${url} não encontrado, mas a execução continua.`);
            return false;
        }
        element.innerHTML = await response.text();
        return true;
    } catch (e) {
        console.error(`Erro ao carregar ${url}:`, e);
        return false;
    }
}

// =======================================================
// FUNÇÕES DE UTILIDADE E SETUP
// =======================================================

function rebindElements() {
    // Esta função encontra e atribui todas as variáveis DOM globais de todos os arquivos.
    
    // modal_carrinho.js DOM
    carrinhoModal = document.getElementById('carrinho-modal');
    fecharModalBtn = document.querySelector('.fechar-modal');
    carrinhoBtn = document.getElementById('carrinho-btn');
    contadorCarrinho = document.getElementById('contador-carrinho');
    fabCarrinho = document.getElementById('fab-carrinho');
    fabContadorCarrinho = document.getElementById('fab-contador-carrinho');
    carrinhoItensContainer = document.getElementById('carrinho-itens');
    carrinhoTotalSpan = document.getElementById('carrinho-total');
    notificacao = document.getElementById('notificacao');
    
    // Elementos do Checkout
    btnFinalizar = document.getElementById('btn-finalizar-pedido');
    btnAnexarLocalizacao = document.getElementById('btn-anexar-localizacao');
    localizacaoStatus = document.getElementById('localizacao-status');

    // Elementos do Modal de Customização
    customizacaoModal = document.getElementById('customizacao-modal');
    fecharCustomizacaoBtn = document.querySelector('.fechar-customizacao');
    btnAdicionarCustomizado = document.getElementById('btn-adicionar-customizado');
    listaAdicionaisContainer = document.getElementById('adicionais-opcoes-lista');

    // Navbar:
    navLinks = document.querySelector('.nav-links');
    hamburgerBtn = document.getElementById('hamburger-menu-btn');
    
    // Admin (cardapio.js):
    // rebindAdminElements(); // Chamado em checkAdminAccess se for o caso.
}


// NOVO: EFEITO DE SCROLL DA NAVBAR (Sticky Shadow)
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) { // Adiciona a classe após rolar 50px
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

// NOVO: LÓGICA DE ANIMAÇÃO DO FAB (Feedback Visual)
function pulseFab() {
    if (fabCarrinho) {
        fabCarrinho.classList.remove('pulsing'); 
        // Força o reflow para reiniciar a animação CSS
        void fabCarrinho.offsetWidth; 
        fabCarrinho.classList.add('pulsing');
        setTimeout(() => {
            fabCarrinho.classList.remove('pulsing');
        }, 1000); 
    }
}


function setupEventListeners() {
    // Listeners do Modal de Carrinho (modal_carrinho.js)
    if (fecharModalBtn) fecharModalBtn.addEventListener('click', () => mostrarModal(carrinhoModal, false));
    if (carrinhoBtn) carrinhoBtn.addEventListener('click', () => {
        // Função que renderiza o carrinho, definida em modal_carrinho.js
        if (typeof renderizarCarrinho === 'function') renderizarCarrinho(); 
        mostrarModal(carrinhoModal, true);
    });
    if (fabCarrinho) fabCarrinho.addEventListener('click', () => {
        if (typeof renderizarCarrinho === 'function') renderizarCarrinho(); 
        mostrarModal(carrinhoModal, true);
    });
    
    // Listeners do Modal de Customização (cardapio.js)
    if (fecharCustomizacaoBtn) fecharCustomizacaoBtn.addEventListener('click', () => mostrarModal(customizacaoModal, false));
    if (btnAdicionarCustomizado) btnAdicionarCustomizado.addEventListener('click', adicionarItemCustomizadoAoCarrinho);    
    
    // Listeners do Checkout (modal_carrinho.js)
    if (btnFinalizar) btnFinalizar.addEventListener('click', finalizarPedido);
    if (btnAnexarLocalizacao) btnAnexarLocalizacao.addEventListener('click', solicitarLocalizacao);
    
    // Listener de Scroll para o efeito "Sticky Shadow" na Navbar
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Listeners da Navbar (navbar.js)
    if (typeof setupNavbarEventListeners === 'function') {
        setupNavbarEventListeners();
    }
}


// =======================================================
// FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carrega os componentes HTML
    const navbarOK = await loadHTML('navbar.html', 'navbar-container');
    const modalOK = await loadHTML('modal_carrinho.html', 'modal-container');
    
    if (navbarOK && modalOK) {
        
        // 2. Re-liga os elementos injetados às variáveis JS
        rebindElements(); 
        
        // 3. Carrega os dados do Cardápio (cardapio.js)
        if (typeof carregarCardapio === 'function') {
            await carregarCardapio(); 
        }
        
        // 4. Configura os Listeners
        setupEventListeners();
        
        // Garante que o contador inicial seja 0
        updateContadorCarrinho();
        
    } else {
        console.error("Não foi possível carregar componentes essenciais.");
    }
});
// Fim do index.js
