// navbar.js
// Controle da navegação por categorias (pills no topo)

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavbar();
});

function inicializarNavbar() {
    const container = document.getElementById('categorias-pills');
    if (!container) return;

    // Evita duplicação caso renderize novamente
    if (container.dataset.inicializado === 'true') return;
    container.dataset.inicializado = 'true';

    // Scroll suave ao clicar nas categorias
    container.addEventListener('click', function (e) {
        const target = e.target.closest('.cat-pill');
        if (!target) return;

        e.preventDefault();

        const sectionId = target.getAttribute('href').replace('#', '');
        const section = document.getElementById(sectionId);

        if (section) {
            const offset = 80; // altura da navbar
            const top = section.offsetTop - offset;

            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    });

    ativarScrollSpy();
}

// =======================================================
// SCROLL SPY — destaca categoria ativa
// =======================================================

function ativarScrollSpy() {
    const offset = 100;

    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.menu-section');
        const pills = document.querySelectorAll('.cat-pill');

        let current = '';

        sections.forEach(section => {
            const top = section.offsetTop - offset;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        pills.forEach(pill => {
            pill.classList.remove('ativo');
            if (pill.getAttribute('href') === '#' + current) {
                pill.classList.add('ativo');
            }
        });
    });
}
