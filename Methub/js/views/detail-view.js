function abrirModalDetalle(id) {
    if (document.getElementById('modal-detail')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-detail';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeModal = document.createElement('span');
    closeModal.className = 'close-modal';
    closeModal.textContent = 'x';

    const modalBody = document.createElement('div');
    modalBody.id = 'modal-body';
    modalBody.textContent = 'Cargando detalles...';

    modalContent.appendChild(closeModal);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    const cerrarYRegresar = () => {
        modal.remove();
        if (window.location.hash.startsWith('#detail/')) {
            window.history.back();
        }
    };

    closeModal.addEventListener('click', cerrarYRegresar);
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) cerrarYRegresar(); 
    });

    fetch(`${API_BASE}/objects/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Obra no encontrada');
            return res.json();
        })
        .then(obra => {
            modalBody.textContent = "";

            const title = document.createElement('h2');
            title.textContent = obra.title || 'Sin Título';

            const img = document.createElement('img');
            img.src = obra.primaryImage || 'assets/placeholder-no-image.png';
            img.style.width = '100%';

            const artistP = document.createElement('p');
            const artistStrong = document.createElement('strong');
            artistStrong.textContent = 'Artista: ';
            artistP.appendChild(artistStrong);

            if (obra.artistDisplayName) {
                const aLink = document.createElement('span');
                aLink.style.color = '#4f46e5';
                aLink.style.textDecoration = 'underline';
                aLink.style.cursor = 'pointer';
                aLink.textContent = obra.artistDisplayName;
                aLink.addEventListener('click', () => {
                    window.location.hash = `#artist/${encodeURIComponent(obra.artistDisplayName)}`;
                });
                artistP.appendChild(aLink);
            } else {
                artistP.appendChild(document.createTextNode('Desconocido'));
            }

            const dateP = document.createElement('p');
            const dateStrong = document.createElement('strong');
            dateStrong.textContent = 'Fecha: ';
            dateP.appendChild(dateStrong);
            dateP.appendChild(document.createTextNode(obra.objectDate || 'S.F.'));

            modalBody.appendChild(title);
            modalBody.appendChild(img);
            modalBody.appendChild(artistP);
            modalBody.appendChild(dateP);
        })
        .catch(err => {
            console.error("Error:", err);
            modalBody.textContent = "No se pudieron cargar los detalles de esta obra.";
        });
}