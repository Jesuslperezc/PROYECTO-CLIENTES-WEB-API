let artistState = {
    todosLosIDs: [],           
    obrasPorPagina: {},        
    currentPage: 0,
    itemsPerPage: 12,
    currentArtistName: "",
    ultimoIdIndexProcesado: 0 
};

// --- FUNCIONES DE SOPORTE (Declaradas arriba para evitar el ReferenceError) ---

function containerClean(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

function crearContenedorPaginacionArtista() {
    let div = document.getElementById('paginacion-artista-controls');
    if (!div) {
        div = document.createElement('div');
        div.id = 'paginacion-artista-controls';
        div.style.textAlign = 'center';
        div.style.marginTop = '20px';
        div.style.display = 'flex';
        div.style.justifyContent = 'center';
        div.style.alignItems = 'center';
        
        const vista = document.getElementById('V-05');
        if (vista) vista.appendChild(div);
    }
    return div;
}

function dibujarTarjetas(obras) {
    const grid = document.getElementById('grid-artista');
    grid.innerHTML = "";

    if (obras.length === 0) {
        const noWorks = document.createElement('p');
        noWorks.className = 'no-results';
        noWorks.textContent = 'Las obras de esta página no contienen imágenes públicas disponibles.';
        grid.appendChild(noWorks);
        return;
    }

    obras.forEach(obra => {
        const card = document.createElement('article');
        card.className = 'obra-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.hash = `#detail/${obra.objectID}`;
        });

        const img = document.createElement('img');
        img.src = obra.primaryImageSmall;
        img.alt = obra.title;
        img.onerror = () => img.src = 'assets/placeholder-no-image.png';
        card.appendChild(img);

        const title = document.createElement('h4');
        title.textContent = obra.title;
        card.appendChild(title);

        const infoExtra = document.createElement('p');
        infoExtra.className = 'info-extra';
        infoExtra.textContent = `${obra.objectDate || 'S.F.'} | ${obra.department || 'General'}`;
        card.appendChild(infoExtra);

        grid.appendChild(card);
    });
}

function renderizarControlesPaginacionArtista() {
    const container = document.getElementById('paginacion-artista-controls');
    if (!container) return;
    containerClean(container);

    const btnAnt = document.createElement('button');
    btnAnt.textContent = "◀ Anterior";
    btnAnt.className = "btn-back";
    btnAnt.style.padding = "8px 16px";
    btnAnt.style.cursor = "pointer";
    btnAnt.disabled = artistState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        artistState.currentPage--;
        renderizarPaginaArtista();
    });

    const infoPagina = document.createElement('span');
    infoPagina.className = 'page-info-text';
    infoPagina.textContent = ` Página ${artistState.currentPage + 1} `;
    infoPagina.style.margin = "0 15px";
    infoPagina.style.fontWeight = "bold";

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ▶";
    btnSig.className = "btn-back";
    btnSig.style.padding = "8px 16px";
    btnSig.style.cursor = "pointer";
    
    btnSig.disabled = artistState.ultimoIdIndexProcesado >= artistState.todosLosIDs.length;
    btnSig.addEventListener('click', () => {
        artistState.currentPage++;
        renderizarPaginaArtista();
    });

    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);
}

// --- VISTAS Y CONTROLADORES PRINCIPALES ---

async function initArtistView(nombreArtista) {
    artistState.todosLosIDs = [];
    artistState.obrasPorPagina = {};
    artistState.currentPage = 0;
    artistState.currentArtistName = nombreArtista;
    artistState.ultimoIdIndexProcesado = 0; 

    document.getElementById('artist-name-title').textContent = nombreArtista;
    document.getElementById('artist-bio').textContent = "Buscando colecciones directamente en el Met...";
    document.getElementById('artist-total-works').textContent = "";
    
    const grid = document.getElementById('grid-artista');
    grid.innerHTML = "<div class='loading-skeleton'>Buscando obras válidas (esto puede tardar unos segundos)...</div>";

    const btnVolver = document.getElementById('btn-volver-artista');
    btnVolver.onclick = () => { window.history.back(); };

    // Ahora se ejecuta perfectamente porque la función ya está declarada arriba en el scope
    const contenedorPaginacion = document.getElementById('paginacion-artista-controls') || crearContenedorPaginacionArtista();
    containerClean(contenedorPaginacion);

    try {
        const res = await fetch(`${API_BASE}/search?artistOrCulture=true&q=${encodeURIComponent(nombreArtista)}`);
        if (!res.ok) throw new Error('Error al conectar con el servidor del Met');
        const data = await res.json();

        if (!data.objectIDs || data.objectIDs.length === 0) {
            grid.innerHTML = "";
            const noRes = document.createElement('p');
            noRes.className = 'no-results';
            noRes.textContent = 'No se encontraron obras registradas para este artista.';
            grid.appendChild(noRes);
            document.getElementById('artist-bio').textContent = "No hay registros disponibles.";
            return;
        }

        artistState.todosLosIDs = data.objectIDs;
        document.getElementById('artist-total-works').textContent = `Procesando colección de ${nombreArtista}...`;
        document.getElementById('artist-bio').textContent = `Exhibición de piezas de ${nombreArtista}.`;

        await renderizarPaginaArtista();

    } catch (err) {
        console.error("Error:", err);
        grid.innerHTML = "";
        const moduloError = document.createElement('error-state');
        moduloError.render(
            "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
            () => { initArtistView(nombreArtista); }
        );
        grid.appendChild(moduloError);
    }
}

async function renderizarPaginaArtista() {
    const grid = document.getElementById('grid-artista');
    grid.innerHTML = "<div class='loading-skeleton'>Buscando 12 obras con imágenes disponibles...</div>";

    const indexPagina = artistState.currentPage;

    if (artistState.obrasPorPagina[indexPagina]) {
        dibujarTarjetas(artistState.obrasPorPagina[indexPagina]);
        renderizarControlesPaginacionArtista();
        return;
    }

    const obrasValidasChunk = [];
    const tamañoLote = artistState.itemsPerPage; 

    try {
        while (obrasValidasChunk.length < tamañoLote && artistState.ultimoIdIndexProcesado < artistState.todosLosIDs.length) {
            
            const faltan = tamañoLote - obrasValidasChunk.length;
            const idsAEvaluar = artistState.todosLosIDs.slice(artistState.ultimoIdIndexProcesado, artistState.ultimoIdIndexProcesado + (faltan * 2));
            
            if (idsAEvaluar.length === 0) break;

            artistState.ultimoIdIndexProcesado += idsAEvaluar.length;

            const promesas = idsAEvaluar.map(id => {
                return fetch(`${API_BASE}/objects/${id}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null);
            });

            const resultados = await Promise.allSettled(promesas);

            for (let item of resultados) {
                if (item.status === 'fulfilled' && item.value) {
                    const obra = item.value;
                    
                    if (!obra.title || !obra.primaryImageSmall) continue;
                    if (obra.artistDisplayName && !obra.artistDisplayName.toLowerCase().includes(artistState.currentArtistName.toLowerCase())) continue;
                    
                    obrasValidasChunk.push(obra);

                    if (obrasValidasChunk.length === tamañoLote) {
                        break;
                    }
                }
            }
        }

        if (obrasValidasChunk.length === 0 && indexPagina === 0) {
            grid.innerHTML = "<p class='no-results'>Este artista no posee ninguna obra con imagen pública disponible.</p>";
            return;
        }

        artistState.obrasPorPagina[indexPagina] = obrasValidasChunk;

        dibujarTarjetas(obrasValidasChunk);
        renderizarControlesPaginacionArtista();

    } catch (error) {
        console.error("Error al procesar el lote de la página:", error);
        grid.innerHTML = "<p class='no-results'>Error al recuperar las obras de este lote.</p>";
    }
}