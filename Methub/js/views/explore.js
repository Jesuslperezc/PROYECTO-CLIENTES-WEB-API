if (typeof RATE_CONFIG === 'undefined') {
    window.RATE_CONFIG = {
        MAX_CONCURRENT: 4,
        BATCH_DELAY_MS: 350,
        MAX_RETRIES: 3,
        RETRY_BASE_DELAY_MS: 700,
        REQUEST_TIMEOUT_MS: 10000
    };
}

if (typeof delay === 'undefined') {
    window.delay = ms => new Promise(res => setTimeout(res, ms));
}

if (typeof fetchObjetoConReintento === 'undefined') {
    window.fetchObjetoConReintento = async function fetchObjetoConReintento(id, signal, apiBase, intento = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RATE_CONFIG.REQUEST_TIMEOUT_MS);

            if (signal.aborted) {
                clearTimeout(timeoutId);
                return null;
            }

            const onExternalAbort = () => controller.abort();
            signal.addEventListener('abort', onExternalAbort);

            const response = await fetch(`${apiBase}/objects/${id}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            signal.removeEventListener('abort', onExternalAbort);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();

        } catch (err) {
            if (signal.aborted) return null;

            if (intento < RATE_CONFIG.MAX_RETRIES) {
                const esperaMs = RATE_CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, intento);
                console.warn(` Reintentando obj ${id} (intento ${intento + 1}) tras ${esperaMs}ms — ${err.message}`);
                await delay(esperaMs);
                return fetchObjetoConReintento(id, signal, apiBase, intento + 1);
            }

            console.error(` Objeto ${id} descartado tras ${RATE_CONFIG.MAX_RETRIES} reintentos:`, err.message);
            return null;
        }
    };
}

if (typeof containerClean === 'undefined') {
    window.containerClean = function containerClean(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    };
}

// --- ESTADO DEL EXPLORER ---
let exploreState = {
    objectIDs: [],
    obrasPorPagina: {},       // caché por página, igual que artistState
    currentPage: 0,
    itemsPerPage: 12,
    ultimoIdIndexProcesado: 0, // cursor persistente sobre objectIDs
    isLoading: false,
    abortController: null,
    filtroAnioInicio: null,    // capturado en el momento de la búsqueda
    filtroAnioFin: null
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

    const anioInicio = document.getElementById('date-begin')?.value.trim();
    const anioFin = document.getElementById('date-end')?.value.trim();

    const grid = document.getElementById('grid-explorar');
    const panelAgregados = document.getElementById('panel-agregados');
    grid.innerHTML="";

    panelAgregados.innerHTML = "";

    // Cancelar cualquier búsqueda/carga anterior en curso
    if (exploreState.abortController) {
        exploreState.abortController.abort();
    }
    exploreState.abortController = new AbortController();

    // Reset completo del estado para la nueva búsqueda
    exploreState.obrasPorPagina = {};
    exploreState.currentPage = 0;
    exploreState.ultimoIdIndexProcesado = 0;
    exploreState.isLoading = false;
    exploreState.filtroAnioInicio = anioInicio ? parseInt(anioInicio, 10) : null;
    exploreState.filtroAnioFin = anioFin ? parseInt(anioFin, 10) : null;

    let url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
    if (deptId) url += `&departmentId=${deptId}`;
    if (soloDestacadas) url += `&isHighlight=true`;
    if (soloImagenes) url += `&hasImages=true`;
    if (anioInicio) url += `&dateBegin=${encodeURIComponent(anioInicio)}`;
    if (anioFin) url += `&dateEnd=${encodeURIComponent(anioFin)}`;

    try {
        const res = await fetch(url, { signal: exploreState.abortController.signal });
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
        if (err.name === 'AbortError') {
            console.log(' Búsqueda cancelada (nueva búsqueda iniciada)');
            return;
        }
        console.error("Error:", err);
        grid.innerHTML = "";
        const moduloError = document.createElement('error-state');
        moduloError.render(
            "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
            () => { initExplorer(); }
        );
        grid.appendChild(moduloError);
    }
}

async function renderizarPaginaExplore() {
    console.log('[DEBUG] renderizarPaginaExplore llamado. isLoading:', exploreState.isLoading, '| currentPage:', exploreState.currentPage, '| cacheado?', !!exploreState.obrasPorPagina[exploreState.currentPage]);

    if (exploreState.isLoading) {
        console.log(' Ya hay una carga en proceso...');
        return;
    }

    const grid = document.getElementById('grid-explorar');
    if (!grid) return;

    exploreState.isLoading = true;

    const indexPagina = exploreState.currentPage;
    const signal = exploreState.abortController.signal;

    // Caché: si ya visitamos esta página, no volvemos a pedir nada
    if (exploreState.obrasPorPagina[indexPagina]) {
        console.log(` Usando caché para página ${indexPagina}`);
        dibujarTarjetasExplore(exploreState.obrasPorPagina[indexPagina]);
        renderizarControlesPaginacionExplore();
        actualizarBadgesMétricas();
        exploreState.isLoading = false;
        return;
    }

    grid.innerHTML = "";
    const spinnerRojo = document.createElement('loading-state');
    grid.appendChild(spinnerRojo);

    const { filtroAnioInicio, filtroAnioFin } = exploreState;
    const obrasValidasChunk = [];
    const tamañoLote = exploreState.itemsPerPage;
    const apiBase = window.API_BASE || API_BASE;

    try {
        while (obrasValidasChunk.length < tamañoLote &&
               exploreState.ultimoIdIndexProcesado < exploreState.objectIDs.length) {

            if (signal.aborted) {
                console.log(' Render de página cancelado');
                return;
            }

            // Mismos lotes chicos + delay fijo que en artist.js
            const loteSize = Math.min(RATE_CONFIG.MAX_CONCURRENT, exploreState.objectIDs.length - exploreState.ultimoIdIndexProcesado);
            const idsAEvaluar = exploreState.objectIDs.slice(
                exploreState.ultimoIdIndexProcesado,
                exploreState.ultimoIdIndexProcesado + loteSize
            );

            if (idsAEvaluar.length === 0) break;

            console.log(` Procesando lote ${exploreState.ultimoIdIndexProcesado + 1}-${exploreState.ultimoIdIndexProcesado + idsAEvaluar.length}`);
            exploreState.ultimoIdIndexProcesado += idsAEvaluar.length;

            const promesas = idsAEvaluar.map(id => fetchObjetoConReintento(id, signal, apiBase));
            const resultados = await Promise.all(promesas);

            if (signal.aborted) return;

            for (const obra of resultados) {
                if (!obra) continue;
                if (!obra.title || !obra.primaryImageSmall) continue;

                if (!isNaN(filtroAnioInicio) && !isNaN(filtroAnioFin) && filtroAnioInicio !== null && filtroAnioFin !== null) {
                    if (obra.objectBeginDate > filtroAnioFin || obra.objectEndDate < filtroAnioInicio) continue;
                } else if (filtroAnioInicio !== null && !isNaN(filtroAnioInicio) && obra.objectEndDate < filtroAnioInicio) {
                    continue;
                } else if (filtroAnioFin !== null && !isNaN(filtroAnioFin) && obra.objectBeginDate > filtroAnioFin) {
                    continue;
                }

                obrasValidasChunk.push(obra);
                if (obrasValidasChunk.length === tamañoLote) break;
            }

            // Delay fijo entre TODOS los lotes, igual que artist.js
            if (exploreState.ultimoIdIndexProcesado < exploreState.objectIDs.length) {
                await delay(RATE_CONFIG.BATCH_DELAY_MS);
            }
        }

        if (signal.aborted) return;

        exploreState.obrasPorPagina[indexPagina] = obrasValidasChunk;
        console.log(` Página ${indexPagina + 1}: ${obrasValidasChunk.length} obras válidas`);

        if (obrasValidasChunk.length === 0) {
            grid.innerHTML = "<p class='no-results'>No hay más imágenes disponibles con estos filtros.</p>";
        } else {
            dibujarTarjetasExplore(obrasValidasChunk);
        }

        renderizarControlesPaginacionExplore();
        actualizarBadgesMétricas();

    } catch (error) {
        if (signal.aborted) return;
        console.error("Error:", error);
        grid.innerHTML = `<p class='no-results' style="color: #d32f2f;"> Error: ${error.message}</p>`;
    } finally {
        exploreState.isLoading = false;
    }
}

function dibujarTarjetasExplore(obras) {
    const grid = document.getElementById('grid-explorar');
    grid.innerHTML = "";

    obras.forEach(obra => {
        const card = document.createElement('article');
        card.className = 'obra-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.hash = `#detail/${obra.objectID}`;
        });

        const img = document.createElement('img');
        img.src = obra.primaryImageSmall || 'assets/placeholder-no-image.png';
        img.alt = obra.title || 'Sin título';
        img.loading = 'lazy';
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
}

// --- PAGINACIÓN DEL EXPLORER ---
function renderizarControlesPaginacionExplore() {
    const container = document.getElementById('paginacion-controls');
    if (!container) return;
    containerClean(container);

    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('flex-direction', 'row', 'important');
    container.style.setProperty('flex-wrap', 'nowrap', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    container.style.gap = "24px";
    container.style.marginTop = "25px";
    container.style.width = "100%";
    container.style.fontFamily = "'Times New Roman', Times, serif";

    const totalIDs = exploreState.objectIDs.length;
    const totalPaginas = Math.ceil(totalIDs / exploreState.itemsPerPage);
    const paginaActual = exploreState.currentPage + 1;

    // "No hay más" real: se acabaron los IDs crudos Y la página actual quedó vacía o incompleta
    const seAcabaronLosIDs = exploreState.ultimoIdIndexProcesado >= exploreState.objectIDs.length;
    const paginaActualIncompleta = (exploreState.obrasPorPagina[exploreState.currentPage] || []).length < exploreState.itemsPerPage;
    const esUltimaPagina = seAcabaronLosIDs && paginaActualIncompleta;

    const btnAnt = document.createElement('button');
    btnAnt.textContent = " Anterior";
    btnAnt.className = "btn-secondary";
    btnAnt.style.display = "inline-block";
    btnAnt.style.width = "auto";
    btnAnt.style.padding = "10px 20px";
    btnAnt.style.cursor = "pointer";
    btnAnt.style.borderRadius = "6px";
    btnAnt.style.border = "1px solid #c4a46a";
    btnAnt.style.fontWeight = "500";
    btnAnt.style.whiteSpace = "nowrap";
    btnAnt.style.transition = "all 0.2s ease";

    if (exploreState.currentPage === 0) {
        btnAnt.style.backgroundColor = "#f4f1ea";
        btnAnt.style.color = "#b5af9f";
        btnAnt.style.border = "1px solid #dcd7cc";
        btnAnt.style.cursor = "not-allowed";
    } else {
        btnAnt.style.backgroundColor = "#ffffff";
        btnAnt.style.color = "#111111";
    }

    btnAnt.disabled = exploreState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        if (exploreState.currentPage > 0) {
            exploreState.currentPage--;
            renderizarPaginaExplore();
        }
    });

    const infoPagina = document.createElement('span');
    infoPagina.className = 'page-info-text';
    infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;
    infoPagina.style.display = "inline-block";
    infoPagina.style.fontSize = "15px";
    infoPagina.style.color = "#2c2a27";
    infoPagina.style.fontWeight = "bold";
    infoPagina.style.whiteSpace = "nowrap";

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ";
    btnSig.className = "btn-secondary";
    btnSig.style.display = "inline-block";
    btnSig.style.width = "auto";
    btnSig.style.padding = "10px 20px";
    btnSig.style.cursor = "pointer";
    btnSig.style.borderRadius = "6px";
    btnSig.style.border = "1px solid #c4a46a";
    btnSig.style.fontWeight = "500";
    btnSig.style.whiteSpace = "nowrap";
    btnSig.style.transition = "all 0.2s ease";

    if (esUltimaPagina) {
        btnSig.style.backgroundColor = "#f4f1ea";
        btnSig.style.color = "#b5af9f";
        btnSig.style.border = "1px solid #dcd7cc";
        btnSig.style.cursor = "not-allowed";
    } else {
        btnSig.style.backgroundColor = "#ffffff";
        btnSig.style.color = "#111111";
    }

    btnSig.disabled = esUltimaPagina;
    btnSig.addEventListener('click', () => {
        console.log('[DEBUG] click en Siguiente. esUltimaPagina:', esUltimaPagina, '| disabled:', btnSig.disabled);
        if (!esUltimaPagina) {
            exploreState.currentPage++;
            console.log('[DEBUG] currentPage ahora es:', exploreState.currentPage);
            renderizarPaginaExplore();
        }
    });

    if (exploreState.currentPage > 0) {
        btnAnt.addEventListener('mouseenter', () => { btnAnt.style.backgroundColor = "#c4a46a"; btnAnt.style.color = "white"; });
        btnAnt.addEventListener('mouseleave', () => { btnAnt.style.backgroundColor = "white"; btnAnt.style.color = "#111111"; });
    }
    if (exploreState.currentPage < totalPaginas) {
        btnSig.addEventListener('mouseenter', () => { btnSig.style.backgroundColor = "#c4a46a"; btnSig.style.color = "white"; });
        btnSig.addEventListener('mouseleave', () => { btnSig.style.backgroundColor = "white"; btnSig.style.color = "#111111"; });
    }

    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);

    console.log('[DEBUG] Controles renderizados. esUltimaPagina:', esUltimaPagina, '| currentPage:', exploreState.currentPage, '| totalPaginas:', totalPaginas);
}

function actualizarBadgesMétricas() {
    const badges = document.querySelectorAll('#panel-agregados .badge.visual');
    if (badges.length > 0) {
        badges[0].textContent = `Lote de exploración: ${exploreState.currentPage + 1}`;
    }
}

function limpiarFiltrosExplore() {
    if (exploreState.abortController) {
        exploreState.abortController.abort();
    }

    if (document.getElementById('search-input')) document.getElementById('search-input').value = "";
    if (document.getElementById('select-departamento')) document.getElementById('select-departamento').value = "";
    if (document.getElementById('check-destacadas')) document.getElementById('check-destacadas').checked = false;
    if (document.getElementById('check-imagenes')) document.getElementById('check-imagenes').checked = true;
    if (document.getElementById('date-begin')) document.getElementById('date-begin').value = "";
    if (document.getElementById('date-end')) document.getElementById('date-end').value = "";

    document.getElementById('grid-explorar').innerHTML = "";
    document.getElementById('panel-agregados').innerHTML = "";
    document.getElementById('paginacion-controls').innerHTML = "";

    exploreState.objectIDs = [];
    exploreState.obrasPorPagina = {};
    exploreState.currentPage = 0;
    exploreState.ultimoIdIndexProcesado = 0;
    exploreState.isLoading = false;
    exploreState.filtroAnioInicio = null;
    exploreState.filtroAnioFin = null;
}

window.initExplorer = initExplorer;
window.ejecutarFiltradoMet = ejecutarFiltradoMet;
window.renderizarPaginaExplore = renderizarPaginaExplore;

console.log(' explore.js cargado correctamente (con throttling y reintentos)');
