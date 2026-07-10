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
            modalBody.appendChild(title);

            // ==========================================
            // === INTEGRACIÓN DE FAVORITOS ===
            // ==========================================
            const btnFav = document.createElement('button');
            btnFav.id = 'btn-modal-favorito';
            btnFav.className = 'btn-favorito-modal';
            
            // Función auxiliar interna para actualizar el texto y clase del botón
            const refrescarEstadoBoton = () => {
                if (esFavorito(id)) {
                    btnFav.classList.add('es-favorito');
                    btnFav.innerHTML = `<span class="icono-estrella">★</span> Quitar de Favoritos`;
                } else {
                    btnFav.classList.remove('es-favorito');
                    btnFav.innerHTML = `<span class="icono-estrella">☆</span> Agregar a Favoritos`;
                }
            };

            // Evaluamos el estado inicial en el localStorage al abrir
            refrescarEstadoBoton();

            // Guardar o eliminar de la "base de datos" al dar clic
            btnFav.addEventListener('click', () => {
                if (esFavorito(id)) {
                    eliminarDeFavoritos(id);
                } else {
                    agregarAFavoritos(id);
                }
                refrescarEstadoBoton(); // Volver a pintar el botón con el nuevo estado
            });

            modalBody.appendChild(btnFav);
            // ==========================================

            const imgContainer = document.createElement('div');
            imgContainer.className = 'modal-media-container';
            imgContainer.style.marginTop = '15px'; // Espacio respecto al nuevo botón

            const img = document.createElement('img');
            img.src = obra.primaryImage || 'assets/placeholder-no-image.png';
            img.style.width = '100%';
            imgContainer.appendChild(img);

            if (obra.additionalImages && obra.additionalImages.length > 0) {
                const thumbsContainer = document.createElement('div');
                thumbsContainer.className = 'modal-thumbs-container';
                thumbsContainer.style.display = 'flex';
                thumbsContainer.style.gap = '8px';
                thumbsContainer.style.marginTop = '10px';

                obra.additionalImages.slice(0, 2).forEach(imgUrl => {
                    const thumb = document.createElement('img');
                    thumb.src = imgUrl;
                    thumb.className = 'thumb-secundario';
                    thumb.style.width = '60px';
                    thumb.style.height = '60px';
                    thumb.style.objectFit = 'cover';
                    thumb.style.cursor = 'pointer';
                    thumb.style.border = '2px solid #e5e7eb';
                    thumb.style.borderRadius = '4px';
                    
                    thumb.addEventListener('click', () => {
                        img.src = imgUrl;
                    });
                    
                    thumbsContainer.appendChild(thumb);
                });
                imgContainer.appendChild(thumbsContainer);
            }

            modalBody.appendChild(imgContainer);

            const tableFicha = document.createElement('table');
            tableFicha.className = 'modal-ficha-tecnica';
            tableFicha.style.width = '100%';
            tableFicha.style.borderCollapse = 'collapse';
            tableFicha.style.marginTop = '15px';

            const camposAComparar = [
                { label: 'Artista / Creador', key: 'artistDisplayName', default: 'Desconocido' },
                { label: 'Fecha / Período', key: 'objectDate', default: 'S.F.' },
                { label: 'Cultura / Origen', key: 'culture', default: 'No especificada' },
                { label: 'Medio / Materiales', key: 'medium', default: 'No especificado' },
                { label: 'Dimensiones Reales', key: 'dimensions', default: 'No registradas' },
                { label: 'Departamento del Museo', key: 'department', default: 'General' },
                { label: 'Línea de Crédito', key: 'creditLine', default: 'Colección Privada' }
            ];

            camposAComparar.forEach(campo => {
                const tr = document.createElement('tr');
                
                const tdLabel = document.createElement('td');
                tdLabel.style.padding = '6px';
                tdLabel.style.fontWeight = 'bold';
                tdLabel.textContent = campo.label + ':';
                
                const tdValue = document.createElement('td');
                tdValue.style.padding = '6px';

                if (campo.key === 'artistDisplayName' && obra[campo.key]) {
                    const aLink = document.createElement('span');
                    aLink.style.color = '#c4a46a'; // Ajustado al oro de tu museo
                    aLink.style.textDecoration = 'underline';
                    aLink.style.cursor = 'pointer';
                    aLink.textContent = obra[campo.key];
                    aLink.addEventListener('click', () => {
                        modal.remove();
                        window.location.hash = `#artist/${encodeURIComponent(obra[campo.key])}`;
                    });
                    tdValue.appendChild(aLink);
                } else {
                    tdValue.textContent = obra[campo.key] || campo.default;
                }
                tr.appendChild(tdLabel);
                tr.appendChild(tdValue);
                tableFicha.appendChild(tr);
            });

            modalBody.appendChild(tableFicha);
        })
        .catch(err => {
            console.error("Error:", err);
   
            modalBody.textContent = "";
            const moduloError = document.createElement('error-state');

            moduloError.render(
                "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
                () => { 
                    modal.remove(); 
                    abrirModalDetalle(id); 
                }
            );
            modalBody.appendChild(moduloError);
        });
}