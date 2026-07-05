document.addEventListener('DOMContentLoaded', () => {
    const navbarElement = createNavBar();
    document.body.insertBefore(navbarElement, document.body.firstChild);
    document.body.appendChild(createFooter());
    inyectarMetsy();

    function abrirModalDetalle(id) {
    const modal = document.createElement('div');
    modal.id = 'modal-detail';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="modal-body">Cargando detalles...</div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
        window.history.back(); // Regresa al hash anterior
    });

    // Fetch del objeto y renderizado en #modal-body
    fetch(`${API_BASE}/objects/${id}`)
        .then(res => res.json())
        .then(obra => {
            document.getElementById('modal-body').innerHTML = `
                <h2>${obra.title}</h2>
                <img src="${obra.primaryImage}" style="width:100%">
                <p><strong>Artista:</strong> ${obra.artistDisplayName || 'Desconocido'}</p>
                <p><strong>Fecha:</strong> ${obra.objectDate}</p>
            `;
        });
}

   function navigate(currentHash) {
    updateActiveNavLink(currentHash);
    actualizarMensajeMetsy(currentHash);
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => view.classList.add('d-none'));

    if (currentHash.startsWith('#detail/')) {
        const id = currentHash.split('/')[1];
        abrirModalDetalle(id);
    }
    else if (currentHash.startsWith('#artist/')) {
        document.getElementById('V-05').classList.remove('d-none');
    }
    // 2. Rutas estáticas después
    else if (currentHash === '#home' || currentHash === '' || currentHash === '#') {
        document.getElementById('V-01').classList.remove('d-none');
        cargarVistaHome();
    } 
    else if (currentHash === '#explore') {
        document.getElementById('V-02').classList.remove('d-none');
    } 
    else if (currentHash === '#departments') {
        document.getElementById('V-04').classList.remove('d-none');
    } 
    else if (currentHash === '#compare') {
        document.getElementById('V-06').classList.remove('d-none');
    }
}

    window.addEventListener('hashchange', () => {
        navigate(window.location.hash);
    });

    const initialHash = window.location.hash || '#home';
    navigate(initialHash);
});