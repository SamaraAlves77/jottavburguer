// navbar.js - Lógica da barra de navegação

let navLinks; // Variável global do index.js
let hamburgerBtn; // Variável global do index.js

function toggleHamburgerMenu() {
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// NOVO: Função dedicada para fechar o menu ao clicar em um link (para mobile)
function fecharMenuOnClick() {
    if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
}

function setupNavbarEventListeners() {
    if (hamburgerBtn) {
        // Remove o listener anterior para evitar duplicação (boa prática de rebind)
        hamburgerBtn.removeEventListener('click', toggleHamburgerMenu); 
        hamburgerBtn.addEventListener('click', toggleHamburgerMenu);
    }

    if (navLinks) {
        // Adiciona o listener para fechar o menu quando um link é clicado (no mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.removeEventListener('click', fecharMenuOnClick); // Remove duplicação
            link.addEventListener('click', fecharMenuOnClick);
        });
    }
}

// Fim do navbar.js
