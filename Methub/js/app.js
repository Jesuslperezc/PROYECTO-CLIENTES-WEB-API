document.addEventListener('DOMContentLoaded', () => {
    const navbarElement = createNavBar();
    document.body.insertBefore(navbarElement, document.body.firstChild);
    document.body.appendChild(createFooter());
    inyectarMetsy();

    let ultimaVistaActiva = null;

    function navigate(currentHash) {
        if (!currentHash || currentHash === '#') {
            currentHash = '#home';
        }

        updateActiveNavLink(currentHash);
        actualizarMensajeMetsy(currentHash);

        if (currentHash.startsWith('#detail/')) {
            const id = currentHash.split('/')[1];
            abrirModalDetalle(id);
            return; 
        }

        const modalExistente = document.getElementById('modal-detail');
        if (modalExistente) {
            modalExistente.remove();
        }

        let idVista;
        if (currentHash === '#home') idVista = 'V-01';
        else if (currentHash === '#explore') idVista = 'V-02';
        else if (currentHash === '#departments') idVista = 'V-04';
        else if (currentHash === '#compare') idVista = 'V-06';

        if (ultimaVistaActiva === idVista) {
            return;
        }

        document.querySelectorAll('.view').forEach(view => view.classList.add('d-none'));
        
        const contenedorVista = document.getElementById(idVista);
        if (contenedorVista) {
            contenedorVista.classList.remove('d-none');
        }

        ultimaVistaActiva = idVista;

        if (currentHash === '#home') {
            cargarVistaHome();
        } else if (currentHash === '#explore') {
            initExplorer(); 
        } else if (currentHash === '#departments') {
            initDepartments();
        }
    }

    window.addEventListener('hashchange', () => {
        navigate(window.location.hash);
    });

    const initialHash = window.location.hash || '#home';
    navigate(initialHash);
});