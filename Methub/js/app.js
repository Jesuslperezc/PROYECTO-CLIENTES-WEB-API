document.addEventListener('DOMContentLoaded', () => {
    const navbarElement = createNavBar();
    document.body.insertBefore(navbarElement, document.body.firstChild);
    document.body.appendChild(createFooter());
    inyectarMetsy();

    let ultimaVistaActiva = null;
// =======================================================================
// SOLUCIÓN AL BUG DE RECARGA EN ARTIST
// =======================================================================
    let ultimoArtistaCargado = null; // Guardará el nombre del último artista renderizado

    function navigate(currentHash) {
        if (!currentHash || currentHash === '#') {
            currentHash = '#home';
        }

        updateActiveNavLink(currentHash);

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
        let artistaActual = null;

        if (currentHash === '#home') idVista = 'V-01';
        else if (currentHash === '#explore') idVista = 'V-02';
        else if (currentHash === '#departments') idVista = 'V-04';
        else if (currentHash.startsWith('#artist/')) {
            idVista = 'V-05';
            artistaActual = decodeURIComponent(currentHash.split('/')[1]);
        }
        else if (currentHash === '#compare') idVista = 'V-06';

        // Bloqueo inteligente: Si ya estamos en la vista de ese mismo artista, no hacemos nada
        if (ultimaVistaActiva === idVista) {
            if (idVista !== 'V-05' || ultimoArtistaCargado === artistaActual) {
                return; 
            }
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
        } else if (currentHash.startsWith('#artist/')) {
            const artistaCodificado = currentHash.split('/')[1];
            const nombreArtista = decodeURIComponent(artistaCodificado);
            
            // Guardamos el nombre del artista que se va a procesar
            ultimoArtistaCargado = nombreArtista;

            if (typeof window.initArtistView === 'function') {
                console.log(' Inicializando vista de artista:', nombreArtista);
                window.initArtistView(nombreArtista);
            } else {
                console.error(' Error: initArtistView no está definida en window');
                // ... (resto de tu código de error intacto)
            }
        }
        else if (currentHash === '#compare') {
            initCompareView();
        }
    }

    window.addEventListener('hashchange', () => {
        navigate(window.location.hash);
    });

    const initialHash = window.location.hash || '#home';
    navigate(initialHash);
});