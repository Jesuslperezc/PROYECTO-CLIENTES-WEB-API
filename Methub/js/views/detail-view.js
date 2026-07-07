function abrirModalDetalle(id) {
    if (document.getElementById('modal-detail')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-detail';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="modal-body">Cargando detalles...</div>
        </div>
    `;

    document.body.appendChild(modal);
    
    const cerrarYRegresar = () => {
        modal.remove();
        if (window.location.hash.startsWith('#detail/')) {
            window.history.back();
        }
    };

    modal.querySelector('.close-modal').addEventListener('click', cerrarYRegresar);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarYRegresar();
    });

    fetch(`${API_BASE}/objects/${id}`)
        .then(res => res.json())
        .then(obra => {
            document.getElementById('modal-body').innerHTML = `
                <h2>${obra.title || 'Sin Título'}</h2>
                <img src="${obra.primaryImage || 'assets/placeholder-no-image.png'}" style="width:100%">
                <p><strong>Artista:</strong> ${obra.artistDisplayName || 'Desconocido'}</p>
                <p><strong>Fecha:</strong> ${obra.objectDate || 'S.F.'}</p>
            `;
        })
        .catch(err => {
            console.error("Error:", err);
            document.getElementById('modal-body').innerHTML = "<p>No se pudieron cargar los detalles de la obra.</p>";
        });
}