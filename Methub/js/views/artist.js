// NO declares API_BASE aquí - ya existe en home.js
if (typeof API_BASE === 'undefined') {
    window.API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
}

// --- CONFIGURACIÓN DE THROTTLING ---
// Estos valores son la clave para evitar los "CORS" fantasma:
// el Met API no te devuelve un 429 limpio, corta los headers CORS
// cuando te banea temporalmente por exceso de requests concurrentes.
const RATE_CONFIG = {
    MAX_CONCURRENT: 4,        // bajado de 8 -> 4 requests simultáneas
    BATCH_DELAY_MS: 350,      // delay FIJO entre cada lote, siempre (no condicional)
    MAX_RETRIES: 3,           // reintentos por objectID si falla
    RETRY_BASE_DELAY_MS: 700, // backoff exponencial: 700, 1400, 2800...
    REQUEST_TIMEOUT_MS: 10000
};

let artistState = {
    todosLosIDs: [],
    obrasPorPagina: {},
    currentPage: 0,
    itemsPerPage: 12,
    currentArtistName: "",
    ultimoIdIndexProcesado: 0,
    isLoading: false,
    totalObrasEncontradas: 0,
    abortController: null   // <- controla y cancela cargas viejas
};

// --- FUNCIONES DE SOPORTE ---

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
        div.style.gap = '10px';
        div.style.flexWrap = 'wrap';

        const vista = document.getElementById('V-05');
        if (vista) {
            const grid = document.getElementById('grid-artista');
            if (grid && grid.parentNode) {
                grid.parentNode.insertBefore(div, grid.nextSibling);
            } else {
                vista.appendChild(div);
            }
        }
    }
    return div;
}

function dibujarTarjetas(obras) {
    const grid = document.getElementById('grid-artista');
    if (!grid) {
        console.error('Grid de artista no encontrado');
        return;
    }
    grid.innerHTML = "";

    if (!obras || obras.length === 0) {
        const noWorks = document.createElement('p');
        noWorks.className = 'no-results';
        noWorks.textContent = 'No hay obras con imágenes disponibles en esta página.';
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
        img.src = obra.primaryImageSmall || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
        img.alt = obra.title || 'Obra sin título';
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
        };
        card.appendChild(img);

        const title = document.createElement('h4');
        title.textContent = obra.title || 'Sin título';
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

    // =======================================================================
    // LOGICA DE ASIGNACIÓN PARA EL BOTÓN DE VOLVER (EVITA DESAPARECER)
    // =======================================================================
    const btnVolver = document.createElement('button');
    btnVolver.textContent = " Volver";
    btnVolver.className = "btn-secondary";
    btnVolver.style.display = "inline-block";
    btnVolver.style.width = "auto";
    btnVolver.style.padding = "10px 20px";
    btnVolver.style.cursor = "pointer";
    btnVolver.style.borderRadius = "6px";
    btnVolver.style.border = "1px solid #c4a46a";
    btnVolver.style.fontWeight = "500";
    btnVolver.style.whiteSpace = "nowrap";
    btnVolver.style.transition = "all 0.2s ease";
        btnVolver.onclick = () => { 
            // Cancela cargas activas del artista para evitar bugs en segundo plano
            if (artistState.abortController) {
                artistState.abortController.abort();
            }
            window.location.hash = '#explore'; 
        };
    
    // =======================================================================

    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('flex-direction', 'row', 'important');
    container.style.setProperty('flex-wrap', 'nowrap', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    container.style.gap = "24px";
    container.style.marginTop = "25px";
    container.style.width = "100%";
    container.style.fontFamily = "'Times New Roman', Times, serif";

    const totalIDs = artistState.todosLosIDs.length;
    const totalPaginas = Math.ceil(totalIDs / artistState.itemsPerPage);
    const paginaActual = artistState.currentPage + 1;

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

    if (artistState.currentPage === 0) {
        btnAnt.style.backgroundColor = "#f4f1ea";
        btnAnt.style.color = "#b5af9f";
        btnAnt.style.border = "1px solid #dcd7cc";
        btnAnt.style.cursor = "not-allowed";
    } else {
        btnAnt.style.backgroundColor = "#ffffff";
        btnAnt.style.color = "#111111";
    }

    btnAnt.disabled = artistState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        if (artistState.currentPage > 0) {
            artistState.currentPage--;
            renderizarPaginaArtista();
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

    const esUltimaPagina = artistState.currentPage >= totalPaginas - 1;
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
        if (artistState.currentPage < totalPaginas - 1) {
            artistState.currentPage++;
            renderizarPaginaArtista();
        }
    });

    if (artistState.currentPage > 0) {
        btnAnt.addEventListener('mouseenter', () => { btnAnt.style.backgroundColor = "#c4a46a"; btnAnt.style.color = "white"; });
        btnAnt.addEventListener('mouseleave', () => { btnAnt.style.backgroundColor = "white"; btnAnt.style.color = "#111111"; });
    }
    if (!esUltimaPagina) {
        btnSig.addEventListener('mouseenter', () => { btnSig.style.backgroundColor = "#c4a46a"; btnSig.style.color = "white"; });
        btnSig.addEventListener('mouseleave', () => { btnSig.style.backgroundColor = "white"; btnSig.style.color = "#111111"; });
    }

    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);
    container.appendChild(btnVolver);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// --- FETCH CON REINTENTOS Y BACKOFF ---
// Clave: si el Met te está limitando, un "Failed to fetch" (que en consola
// aparece como error de CORS) no significa que el objeto no exista.
// Reintentamos con backoff antes de descartarlo.
async function fetchObjetoConReintento(id, signal, apiBase, intento = 0) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RATE_CONFIG.REQUEST_TIMEOUT_MS);

        // Si la carga global fue cancelada, no seguimos
        if (signal.aborted) {
            clearTimeout(timeoutId);
            return null;
        }

        // Enlazamos el abort externo (cambio de página/artista) al request individual
        const onExternalAbort = () => controller.abort();
        signal.addEventListener('abort', onExternalAbort);

        const response = await fetch(`${apiBase}/objects/${id}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', onExternalAbort);

        if (!response.ok) {
            // 403/429 suelen llegar así, o directamente como network error abajo
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();

    } catch (err) {
        if (signal.aborted) return null; // cancelado a propósito, no reintentar

        if (intento < RATE_CONFIG.MAX_RETRIES) {
            const esperaMs = RATE_CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, intento);
            console.warn(` Reintentando obj ${id} (intento ${intento + 1}) tras ${esperaMs}ms — ${err.message}`);
            await delay(esperaMs);
            return fetchObjetoConReintento(id, signal, apiBase, intento + 1);
        }

        console.error(` Objeto ${id} descartado tras ${RATE_CONFIG.MAX_RETRIES} reintentos:`, err.message);
        return null;
    }
}

// --- FUNCIÓN PRINCIPAL ---
async function initArtistView(nombreArtista) {
    console.log(' Iniciando vista de artista:', nombreArtista);

    // Cancelar cualquier carga anterior en curso (evita condiciones de carrera)
    if (artistState.abortController) {
        artistState.abortController.abort();
    }
    artistState.abortController = new AbortController();

    artistState.todosLosIDs = [];
    artistState.obrasPorPagina = {};
    artistState.currentPage = 0;
    artistState.currentArtistName = nombreArtista;
    artistState.ultimoIdIndexProcesado = 0;
    artistState.isLoading = false;
    artistState.totalObrasEncontradas = 0;

    const titleElement = document.getElementById('artist-name-title');
    if (titleElement) titleElement.textContent = nombreArtista;

    const bioElement = document.getElementById('artist-bio');
    if (bioElement) bioElement.textContent = " Buscando colecciones en el Met...";

    const totalElement = document.getElementById('artist-total-works');
    const grid = document.getElementById('grid-artista');
    if (grid) {
        grid.innerHTML = "";
        const spinnerRojo = document.createElement('loading-state');
        grid.appendChild(spinnerRojo);
    }

    // === MODIFICACIÓN DEL BOTÓN DE RETORNO DIRECTO AL EXPLORADOR ===
    const btnVolver = document.getElementById('btn-volver-artista');
    if (btnVolver) {
        btnVolver.onclick = () => { 
            window.location.hash = '#explore'; // Redirección interna por Hash sin refrescar
        };
    }
    // ==============================================================

    const contenedorPaginacion = crearContenedorPaginacionArtista();
    if (contenedorPaginacion) {
        containerClean(contenedorPaginacion);
    }

    try {
        const searchUrl = `${window.API_BASE || API_BASE}/search?q=${encodeURIComponent(nombreArtista)}&hasImages=true`;
        console.log(' Buscando en:', searchUrl);

        const res = await fetch(searchUrl, { signal: artistState.abortController.signal });
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
        }

        const data = await res.json();
        console.log(' Resultados encontrados:', data.total || 0);

        if (!data.objectIDs || data.objectIDs.length === 0) {
            if (grid) {
                grid.innerHTML = "";
                const noRes = document.createElement('p');
                noRes.className = 'no-results';
                noRes.textContent = ` No se encontraron obras para "${nombreArtista}". Intenta con otro nombre.`;
                grid.appendChild(noRes);
            }
            if (bioElement) bioElement.textContent = "No se encontraron registros.";
            if (totalElement) totalElement.textContent = "0 obras";
            return;
        }

        artistState.todosLosIDs = data.objectIDs;
        artistState.totalObrasEncontradas = data.objectIDs.length;

        if (bioElement) {
            bioElement.textContent = ` Mostrando obras de ${nombreArtista}`;
        }

        console.log(` Total de IDs a procesar: ${data.objectIDs.length}`);
        await renderizarPaginaArtista();

    } catch (err) {
        if (err.name === 'AbortError') {
            console.log(' Carga cancelada (nueva búsqueda iniciada)');
            return;
        }
        console.error(" Error en initArtistView:", err);
        if (grid) {
            grid.innerHTML = "";
            const moduloError = document.createElement('error-state');
            moduloError.render(
                "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
                () => { initArtistView(nombreArtista); }
            );
            grid.appendChild(moduloError);
        }
    }
}
async function renderizarPaginaArtista() {
    if (artistState.isLoading) {
        console.log(' Ya hay una carga en proceso...');
        return;
    }

    const grid = document.getElementById('grid-artista');
    if (!grid) {
        console.error(' Grid de artista no encontrado');
        return;
    }

    artistState.isLoading = true;

    const indexPagina = artistState.currentPage;
    const signal = artistState.abortController.signal;

    if (artistState.obrasPorPagina[indexPagina]) {
        console.log(` Usando caché para página ${indexPagina}`);
        dibujarTarjetas(artistState.obrasPorPagina[indexPagina]);
        renderizarControlesPaginacionArtista();
        artistState.isLoading = false;
        return;
    }

    grid.innerHTML = "";
    const spinnerRojo = document.createElement('loading-state');
    grid.appendChild(spinnerRojo);

    const obrasValidasChunk = [];
    const tamañoLote = artistState.itemsPerPage;
    const apiBase = window.API_BASE || API_BASE;

    try {
        while (obrasValidasChunk.length < tamañoLote &&
               artistState.ultimoIdIndexProcesado < artistState.todosLosIDs.length) {

            if (signal.aborted) {
                console.log(' Render de página cancelado');
                return;
            }

            // Lotes más chicos y con delay FIJO entre cada uno (no condicional)
            const loteSize = Math.min(RATE_CONFIG.MAX_CONCURRENT, artistState.todosLosIDs.length - artistState.ultimoIdIndexProcesado);
            const idsAEvaluar = artistState.todosLosIDs.slice(
                artistState.ultimoIdIndexProcesado,
                artistState.ultimoIdIndexProcesado + loteSize
            );

            if (idsAEvaluar.length === 0) break;

            console.log(` Procesando lote ${artistState.ultimoIdIndexProcesado + 1}-${artistState.ultimoIdIndexProcesado + idsAEvaluar.length}`);
            artistState.ultimoIdIndexProcesado += idsAEvaluar.length;

            const promesas = idsAEvaluar.map(id => fetchObjetoConReintento(id, signal, apiBase));
            const resultados = await Promise.all(promesas);

            if (signal.aborted) return;

            for (const obra of resultados) {
                if (!obra) continue;
                if (obra.title && obra.primaryImageSmall) {
                    obrasValidasChunk.push(obra);
                    if (obrasValidasChunk.length === tamañoLote) break;
                }
            }

            // Delay FIJO siempre entre lotes, haya o no completado el cupo.
            // Esto es lo que evita que el Met te empiece a devolver
            // respuestas sin headers CORS (rate limit disfrazado).
            if (artistState.ultimoIdIndexProcesado < artistState.todosLosIDs.length) {
                await delay(RATE_CONFIG.BATCH_DELAY_MS);
            }
        }

        if (signal.aborted) return;

        artistState.obrasPorPagina[indexPagina] = obrasValidasChunk;
        console.log(` Página ${indexPagina + 1}: ${obrasValidasChunk.length} obras válidas`);

        if (obrasValidasChunk.length === 0 && indexPagina === 0) {
            grid.innerHTML = "<p class='no-results'> Este artista no posee obras con imagen pública disponible.</p>";
        } else {
            dibujarTarjetas(obrasValidasChunk);
        }

        renderizarControlesPaginacionArtista();

    } catch (error) {
        if (signal.aborted) return;
        console.error(" Error:", error);
        grid.innerHTML = `<p class='no-results' style="color: #d32f2f;"> Error: ${error.message}</p>`;
    } finally {
        artistState.isLoading = false;
    }
}

// --- EXPONER FUNCIONES GLOBALMENTE ---
window.initArtistView = initArtistView;
window.renderizarPaginaArtista = renderizarPaginaArtista;

console.log(' artist.js cargado correctamente (con throttling y reintentos)');
