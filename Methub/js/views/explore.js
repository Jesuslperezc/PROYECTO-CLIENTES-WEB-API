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

    const grid = document.getElementById('grid-explorar');
    const panelAgregados = document.getElementById('panel-agregados');
    
    grid.innerHTML = "<div class='loading-skeleton'>Buscando en los archivos del Met...</div>";
    panelAgregados.innerHTML = "";

    let url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
    if (deptId) url += `&departmentId=${deptId}`;
    if (soloDestacadas) url += `&isHighlight=true`;
    if (soloImagenes) url += `&hasImages=true`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.objectIDs || data.objectIDs.length === 0) {
            grid.innerHTML = "<p class='no-results'>No se encontraron obras con esos filtros.</p>";
            document.getElementById('paginacion-controls').innerHTML = "";
            panelAgregados.innerHTML = "<span class='badge'>0 resultados</span>";
            return;
        }

        exploreState.objectIDs = data.objectIDs;
        exploreState.currentPage = 0;
        
        panelAgregados.innerHTML = `
            <span class="badge">Total Encontrado: ${data.total} obras</span>
            <span class="badge visual">Página 1 de ${Math.ceil(data.total / exploreState.itemsPerPage)}</span>
        `;

        await renderizarPaginaExplore();

    } catch (err) {
        console.error("Error:", err);
        grid.innerHTML = "<p>Hubo un problema al conectar con la API de exploración.</p>";
    }
}

async function renderizarPaginaExplore() {
    const grid = document.getElementById('grid-explorar');
    grid.innerHTML = "<div class='loading-skeleton'>Extrayendo metadatos...</div>";

    const inicio = exploreState.currentPage * exploreState.itemsPerPage;
    const fin = inicio + exploreState.itemsPerPage;
    const bloqueIds = exploreState.objectIDs.slice(inicio, fin);

    const promesas = bloqueIds.map(id =>
        fetch(`${API_BASE}/objects/${id}`).then(r => r.ok ? r.json() : null)
    );

    const resultados = await Promise.allSettled(promesas);
    grid.innerHTML = "";

    resultados.forEach(item => {
        if (item.status === 'fulfilled' && item.value) {
            const obra = item.value;
            
            if (!obra.title || !obra.primaryImageSmall) return;

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
            artist.textContent = obra.artistDisplayName || 'Artista Desconocido';
            card.appendChild(artist);

            const infoExtra = document.createElement('p');
            infoExtra.className = 'info-extra';
            infoExtra.textContent = `${obra.objectDate || 'S.F.'} | ${obra.department || 'General'}`;
            card.appendChild(infoExtra);

            grid.appendChild(card);
        }
    });

    renderizarControlesPaginacion();
}

function renderizarControlesPaginacion() {
    const container = document.getElementById('paginacion-controls');
    container.innerHTML = "";

    const totalPaginas = Math.ceil(exploreState.objectIDs.length / exploreState.itemsPerPage);
    if (totalPaginas <= 1) return;

    const btnAnt = document.createElement('button');
    btnAnt.textContent = "◀ Anterior";
    btnAnt.disabled = exploreState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        exploreState.currentPage--;
        actualizarBadgesMétricas(totalPaginas);
        renderizarPaginaExplore();
    });

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ▶";
    btnSig.disabled = exploreState.currentPage >= totalPaginas - 1;
    btnSig.addEventListener('click', () => {
        exploreState.currentPage++;
        actualizarBadgesMétricas(totalPaginas);
        renderizarPaginaExplore();
    });

    container.appendChild(btnAnt);
    container.appendChild(btnSig);
}

function actualizarBadgesMétricas(totalPaginas) {
    const badges = document.querySelectorAll('#panel-agregados .badge.visual');
    if(badges.length > 0) {
        badges[0].textContent = `Página ${exploreState.currentPage + 1} de ${totalPaginas}`;
    }
}

function limpiarFiltrosExplore() {
    document.getElementById('search-input').value = "";
    document.getElementById('select-departamento').value = "";
    document.getElementById('check-destacadas').checked = false;
    document.getElementById('check-imagenes').checked = true;
    document.getElementById('grid-explorar').innerHTML = "";
    document.getElementById('panel-agregados').innerHTML = "";
    document.getElementById('paginacion-controls').innerHTML = "";
    exploreState.objectIDs = [];
    exploreState.currentPage = 0;
}