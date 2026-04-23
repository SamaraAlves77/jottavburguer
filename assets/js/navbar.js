// navbar.js
// Controle das categorias (pills)

// NÃO precisa mais de DOMContentLoaded aqui
// app.js já controla ciclo de vida

function inicializarNavbar() {
    const container = document.getElementById('navbar-pills-container');
    if (!container) return;

    // Evita duplicação
    if (container.dataset.inicializado === 'true') return;
    container.dataset.inicializado = 'true';

    container.addEventListener('click', (e) => {
        const pill = e.target.closest('.cat-pill');
        if (!pill) return;

        const categoriaId = pill.dataset.id;
        if (!categoriaId) return;

        // Atualiza categoria global
        if (typeof categoriaAtiva !== 'undefined') {
            categoriaAtiva = categoriaId;
        }

        // Re-renderiza cardápio
        if (typeof renderizarCardapio === 'function') {
            renderizarCardapio();
        }

        atualizarPillAtiva(categoriaId);
    });
}

// =======================================================
// ATUALIZA VISUAL DA PILL ATIVA
// =======================================================

function atualizarPillAtiva(idAtivo) {
    document.querySelectorAll('.cat-pill').forEach(pill => {
        pill.classList.toggle('ativo', pill.dataset.id === idAtivo);
    });
}
