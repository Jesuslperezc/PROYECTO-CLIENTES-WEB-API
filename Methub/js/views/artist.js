let artistState = {
    obrasFiltradas: [], // Aquí guardaremos solo los objetos reales con imagen
    currentPage: 0,
    itemsPerPage: 12,
    currentArtistName: ""
};

async function initArtistView(nombreArtista) {
    artistState.obrasFiltradas = [];
    artistState.currentPage = 0;
    artistState.currentArtistName = nombreArtista;

    document.getElementById('artist-name-title').textContent = nombreArtista;
    document.getElementById('artist-bio').textContent = "Analizando y filtrando colección del Met...";
    document.getElementById('artist-total-works').textContent = "";
    
    const grid = document.getElementById('grid-artista');
    grid.innerHTML = "<div class='loading-skeleton'>Buscando obras válidas (esto puede tardar unos segundos)...</div>";

    const btnVolver = document.getElementById('btn-volver-artista');
    btnVolver.onclick = () => {
        window.history.back();
    };

    const contenedorPaginacion = document.getElementById('paginacion-artista-controls') || crearContenedorPaginacionArtista();
    containerClean(contenedorPaginacion);

    try {
        const res = await fetch(`${API_BASE}/search?artistOrCulture=true&q=${encodeURIComponent(nombreArtista)}`);
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

        
        const idsAEnsayar = data.objectIDs.slice(0, 150);
        document.getElementById('artist-bio').textContent = `Indexando galería virtual para ${nombreArtista}...`;

        const promesas = idsAEnsayar.map(id =>
            fetch(`${API_BASE}/objects/${id}`).then(r => r.ok ? r.json() : null)
        );

        const resultados = await Promise.allSettled(promesas);

        resultados.forEach(item => {
            if (item.status === 'fulfilled' && item.value) {
                const obra = item.value;
                if (!obra.artistDisplayName || !obra.artistDisplayName.toLowerCase().includes(nombreArtista.toLowerCase())) return;
                if (!obra.title || !obra.primaryImageSmall) return;
                
                artistState.obrasFiltradas.push(obra);
            }
        });

        document.getElementById('artist-total-works').textContent = `${artistState.obrasFiltradas.length} obras con imagen listas`;
        document.getElementById('artist-bio').textContent = `Exhibición optimizada de piezas de ${nombreArtista}.`;

        renderizarPaginaArtista();

    } catch (err) {
        console.error("Error:", err);
        grid.innerHTML = "";
        const errMsg = document.createElement('p');
        errMsg.textContent = 'Error al conectar con los servidores del museo.';
        grid.appendChild(errMsg);
    }
}

function renderizarPaginaArtista() {
    const grid = document.getElementById('grid-artista');
    grid.innerHTML = "";

    if (artistState.obrasFiltradas.length === 0) {
        const noWorks = document.createElement('p');
        noWorks.className = 'no-results';
        noWorks.textContent = 'No se encontraron obras con imágenes directas para este autor.';
        grid.appendChild(noWorks);
        return;
    }

    const inicio = artistState.currentPage * artistState.itemsPerPage;
    const fin = inicio + artistState.itemsPerPage;
    const obrasDeLaPagina = artistState.obrasFiltradas.slice(inicio, fin);

    obrasDeLaPagina.forEach(obra => {
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

    renderizarControlesPaginacionArtista();
}

function renderizarControlesPaginacionArtista() {
    const container = document.getElementById('paginacion-artista-controls');
    if (!container) return;
    containerClean(container);

    const totalPaginas = Math.ceil(artistState.obrasFiltradas.length / artistState.itemsPerPage);
    if (totalPaginas <= 1) return;

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
    infoPagina.textContent = ` Lote ${artistState.currentPage + 1} de ${totalPaginas} `;
    infoPagina.style.margin = "0 15px";
    infoPagina.style.fontWeight = "bold";

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ▶";
    btnSig.className = "btn-back";
    btnSig.style.padding = "8px 16px";
    btnSig.style.cursor = "pointer";
    btnSig.disabled = artistState.currentPage >= totalPaginas - 1;
    btnSig.addEventListener('click', () => {
        artistState.currentPage++;
        renderizarPaginaArtista();
    });

    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);
}

function crearContenedorPaginacionArtista() {
    const div = document.createElement('div');
    div.id = 'paginacion-artista-controls';
    div.style.textAlign = 'center';
    div.style.marginTop = '20px';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';
    
    const vista = document.getElementById('V-05');
    if (vista) vista.appendChild(div);
    return div;
}

function containerClean(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}