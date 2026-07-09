let exploreState = {
    objectIDs: [],
    currentPage: 0,
    itemsPerPage: 12
};

async function initExplorer() {
    await cargarFiltroDepartamentos();
    setupExplorerEventListeners();
}

async function cargarFiltroDepartamentos() {
    const select = document.getElementById('select-departamento');
    if (select.children.length > 1) return; 

    try {
        const res = await fetch(`${API_BASE}/departments`);
        const data = await res.json();
        data.departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.departmentId;
            opt.textContent = dept.displayName;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

function setupExplorerEventListeners() {
    document.getElementById('btn-buscar').addEventListener('click', ejecutarFiltradoMet);
    document.getElementById('btn-limpiar').addEventListener('click', limpiarFiltrosExplore);
}

async function ejecutarFiltradoMet() {
    const query = document.getElementById('search-input').value.trim() || '*';
    const deptId = document.getElementById('select-departamento').value;
    const soloDestacadas = document.getElementById('check-destacadas').checked;
    const soloImagenes = document.getElementById('check-imagenes').checked;

    // REQUERIMIENTO COMPLETADO: Captura de rango de años desde el HTML
    const anioInicio = document.getElementById('date-begin')?.value.trim();
    const anioFin = document.getElementById('date-end')?.value.trim();

    const grid = document.getElementById('grid-explorar');
    const panelAgregados = document.getElementById('panel-agregados');
    
    grid.innerHTML = "<div class='loading-skeleton'>Buscando en los archivos del Met...</div>";
    panelAgregados.innerHTML = ""; 

    let url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
    if (deptId) url += `&departmentId=${deptId}`;
    if (soloDestacadas) url += `&isHighlight=true`;
    if (soloImagenes) url += `&hasImages=true`;
    
    // Concatenamos al fetch los parámetros oficiales del Met si el usuario colocó datos
    if (anioInicio) url += `&dateBegin=${encodeURIComponent(anioInicio)}`;
    if (anioFin) url += `&dateEnd=${encodeURIComponent(anioFin)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.objectIDs || data.objectIDs.length === 0) {
            grid.innerHTML = "";
            const noRes = document.createElement('p');
            noRes.className = 'no-results';
            noRes.textContent = 'No se encontraron obras con esos filtros.';
            grid.appendChild(noRes);

            document.getElementById('paginacion-controls').innerHTML = "";
            
            const bZero = document.createElement('span');
            bZero.className = 'badge';
            bZero.textContent = '0 resultados';
            panelAgregados.appendChild(bZero);
            return;
        }

        exploreState.objectIDs = data.objectIDs;
        exploreState.currentPage = 0;
        
        const bTotal = document.createElement('span');
        bTotal.className = 'badge';
        bTotal.textContent = `Coincidencias en bruto: ${data.total}`;

        const bVisual = document.createElement('span');
        bVisual.className = 'badge visual';
        bVisual.textContent = `Lote de exploración: 1`;

        panelAgregados.appendChild(bTotal);
        panelAgregados.appendChild(bVisual);

        await renderizarPaginaExplore();

    } catch (err) {
        console.error("Error:", err);
        grid.innerHTML = "";
        const moduloError = document.createElement('error-state');

        moduloError.render(
            "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
            () => { initExplorer(); }
        );
        grid.appendChild(moduloError);
}

async function renderizarPaginaExplore() {
    const grid = document.getElementById('grid-explorar');
    grid.innerHTML = "<div class='loading-skeleton'>Extrayendo metadatos...</div>";

    const filtroAnioInicio = parseInt(document.getElementById('date-begin')?.value.trim(), 10);
    const filtroAnioFin = parseInt(document.getElementById('date-end')?.value.trim(), 10);

    let obrasValidas = [];
    let puntero = exploreState.currentPage * exploreState.itemsPerPage;

    while (obrasValidas.length < exploreState.itemsPerPage && puntero < exploreState.objectIDs.length) {
        const limiteLote = Math.min(puntero + exploreState.itemsPerPage, exploreState.objectIDs.length);
        const subBloqueIds = exploreState.objectIDs.slice(puntero, limiteLote);
        puntero = limiteLote;

        const promesas = subBloqueIds.map(id =>
            fetch(`${API_BASE}/objects/${id}`).then(r => r.ok ? r.json() : null)
        );

        const resultados = await Promise.allSettled(promesas);

        resultados.forEach(item => {
            if (item.status === 'fulfilled' && item.value) {
                const obra = item.value;
                
                if (!obra.title || !obra.primaryImageSmall) return;
                if (!isNaN(filtroAnioInicio) && !isNaN(filtroAnioFin)) {
                    if (obra.objectBeginDate > filtroAnioFin || obra.objectEndDate < filtroAnioInicio) {
                        return; 
                    }
                } else if (!isNaN(filtroAnioInicio) && obra.objectEndDate < filtroAnioInicio) {
                    return;
                } else if (!isNaN(filtroAnioFin) && obra.objectBeginDate > filtroAnioFin) {
                    return;
                }

                if (obrasValidas.length < exploreState.itemsPerPage) {
                    obrasValidas.push(obra);
                }
            }
        });
    }

    grid.innerHTML = "";

    if (obrasValidas.length === 0) {
        const noWorks = document.createElement('p');
        noWorks.className = 'no-results';
        noWorks.textContent = 'No hay más imágenes disponibles en este bloque.';
        grid.appendChild(noWorks);
        return;
    }

    obrasValidas.forEach(obra => {
        const card = document.createElement('article');
        card.className = 'obra-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.hash = `#detail/${obra.objectID}`;
        });

        const img = document.createElement('img');
        img.src = obra.primaryImageSmall || 'assets/placeholder-no-image.png';
        img.alt = obra.title || 'Sin título';
        img.onerror = () => img.src = 'assets/placeholder-no-image.png';
        card.appendChild(img);

        const title = document.createElement('h4');
        title.textContent = obra.title || 'Sin título';
        card.appendChild(title);

        const artist = document.createElement('p');
        artist.className = 'artist-text';
        if (obra.artistDisplayName) {
            const artistLink = document.createElement('span');
            artistLink.className = 'artist-link';
            artistLink.style.color = '#4f46e5';
            artistLink.style.textDecoration = 'underline';
            artistLink.style.cursor = 'pointer';
            artistLink.textContent = obra.artistDisplayName;
            artistLink.addEventListener('click', (e) => {
                e.stopPropagation(); 
                window.location.hash = `#artist/${encodeURIComponent(obra.artistDisplayName)}`;
            });
            artist.appendChild(artistLink);
        } else {
            artist.textContent = 'Artista Desconocido';
        }
        card.appendChild(artist);

        const infoExtra = document.createElement('p');
        infoExtra.className = 'info-extra';
        infoExtra.textContent = `${obra.objectDate || 'S.F.'} | ${obra.department || 'General'}`;
        card.appendChild(infoExtra);

        grid.appendChild(card);
    });

    renderizarControlesPaginacion(puntero >= exploreState.objectIDs.length);
}
function renderizarControlesPaginacion(esFinDeColeccion) {
    const container = document.getElementById('paginacion-controls');
    container.innerHTML = "";

    // Si estamos en la primera tanda y ya no quedan IDs por evaluar en la API, ocultamos controles
    if (exploreState.currentPage === 0 && esFinDeColeccion) return;

    const btnAnt = document.createElement('button');
    btnAnt.textContent = "◀ Anterior";
    btnAnt.className = "btn-back"; 
    btnAnt.style.padding = "8px 16px";
    btnAnt.style.margin = "0 5px";
    btnAnt.style.cursor = "pointer";
    btnAnt.disabled = exploreState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        exploreState.currentPage--;
        actualizarBadgesMétricas();
        renderizarPaginaExplore();
    });

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ▶";
    btnSig.className = "btn-back";
    btnSig.style.padding = "8px 16px";
    btnSig.style.margin = "0 5px";
    btnSig.style.cursor = "pointer";
    btnSig.disabled = esFinDeColeccion;
    btnSig.addEventListener('click', () => {
        exploreState.currentPage++;
        actualizarBadgesMétricas();
        renderizarPaginaExplore();
    });

    container.appendChild(btnAnt);
    container.appendChild(btnSig);
}
}

function actualizarBadgesMétricas() {
    const badges = document.querySelectorAll('#panel-agregados .badge.visual');
    if(badges.length > 0) {
        badges[0].textContent = `Lote de exploración: ${exploreState.currentPage + 1}`;
    }
}

function limpiarFiltrosExplore() {
    if(document.getElementById('search-input')) document.getElementById('search-input').value = "";
    if(document.getElementById('select-departamento')) document.getElementById('select-departamento').value = "";
    if(document.getElementById('check-destacadas')) document.getElementById('check-destacadas').checked = false;
    if(document.getElementById('check-imagenes')) document.getElementById('check-imagenes').checked = true;
    if(document.getElementById('date-begin')) document.getElementById('date-begin').value = "";
    if(document.getElementById('date-end')) document.getElementById('date-end').value = "";
    
    document.getElementById('grid-explorar').innerHTML = "";
    document.getElementById('panel-agregados').innerHTML = "";
    document.getElementById('paginacion-controls').innerHTML = "";
    exploreState.objectIDs = [];
    exploreState.currentPage = 0;
}