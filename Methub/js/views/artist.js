// NO declares API_BASE aquí - ya existe en home.js
// Si quieres asegurarte de que existe, usa esto en lugar de var/const/let:

if (typeof API_BASE === 'undefined') {
    window.API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
}

let artistState = {
    todosLosIDs: [],           
    obrasPorPagina: {},        
    currentPage: 0,
    itemsPerPage: 12,
    currentArtistName: "",
    ultimoIdIndexProcesado: 0,
    isLoading: false,
    totalObrasEncontradas: 0
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

    // --- ALINEACIÓN ULTRA FORZADA EN LÍNEA ---
    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('flex-direction', 'row', 'important'); /* Fuerza que sea una fila */
    container.style.setProperty('flex-wrap', 'nowrap', 'important');    /* Prohíbe los saltos de línea */
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    container.style.gap = "24px"; /* Espaciado generoso entre los 3 elementos */
    container.style.marginTop = "25px";
    container.style.width = "100%"; /* Asegura que el contenedor tenga espacio para estirarse */
    container.style.fontFamily = "'Times New Roman', Times, serif";

    const totalIDs = artistState.todosLosIDs.length;
    const totalPaginas = Math.ceil(totalIDs / artistState.itemsPerPage);
    const paginaActual = artistState.currentPage + 1;

    // BOTÓN ANTERIOR
    const btnAnt = document.createElement('button');
    btnAnt.textContent = " Anterior";
    btnAnt.className = "btn-secondary";
    btnAnt.style.display = "inline-block"; /* Evita que se comporte como bloque completo */
    btnAnt.style.width = "auto";            /* Evita que ocupe el 100% del ancho */
    btnAnt.style.padding = "10px 20px";
    btnAnt.style.cursor = "pointer";
    btnAnt.style.borderRadius = "6px";
    btnAnt.style.border = "1px solid #c4a46a";
    btnAnt.style.fontWeight = "500";
    btnAnt.style.whiteSpace = "nowrap";     /* Evita que el texto del botón se rompa */
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

    // Hovers activos
    if (artistState.currentPage > 0) {
        btnAnt.addEventListener('mouseenter', () => { btnAnt.style.backgroundColor = "#c4a46a"; btnAnt.style.color = "white"; });
        btnAnt.addEventListener('mouseleave', () => { btnAnt.style.backgroundColor = "white"; btnAnt.style.color = "#111111"; });
    }
    if (!esUltimaPagina) {
        btnSig.addEventListener('mouseenter', () => { btnSig.style.backgroundColor = "#c4a46a"; btnSig.style.color = "white"; });
        btnSig.addEventListener('mouseleave', () => { btnSig.style.backgroundColor = "white"; btnSig.style.color = "#111111"; });
    }

    // Inyección limpia
    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);
}
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- FUNCIÓN PRINCIPAL ---

async function initArtistView(nombreArtista) {
    console.log(' Iniciando vista de artista:', nombreArtista);

    // Resetear estado
    artistState.todosLosIDs = [];
    artistState.obrasPorPagina = {};
    artistState.currentPage = 0;
    artistState.currentArtistName = nombreArtista;
    artistState.ultimoIdIndexProcesado = 0;
    artistState.isLoading = false;
    artistState.totalObrasEncontradas = 0;
   const spinnerRojo = document.createElement('loading-state');
    // Actualizar UI
    const titleElement = document.getElementById('artist-name-title');
    if (titleElement) titleElement.textContent = nombreArtista;
    
    const bioElement = document.getElementById('artist-bio');
    if (bioElement) bioElement.textContent = " Buscando colecciones en el Met...";
    
    const totalElement = document.getElementById('artist-total-works');


    const grid = document.getElementById('grid-artista');
    if (grid) {
           grid.appendChild(spinnerRojo);
    }

    const btnVolver = document.getElementById('btn-volver-artista');
    if (btnVolver) {
        btnVolver.onclick = () => { window.history.back(); };
    }

    const contenedorPaginacion = crearContenedorPaginacionArtista();
    if (contenedorPaginacion) {
        containerClean(contenedorPaginacion);
    }

    try {
        // Usar API_BASE de home.js
        const searchUrl = `${window.API_BASE || API_BASE}/search?q=${encodeURIComponent(nombreArtista)}&hasImages=true`;
        console.log(' Buscando en:', searchUrl);
        
        const res = await fetch(searchUrl);
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
        console.error(" Error en initArtistView:", err);
        if (grid) {
            grid.innerHTML = "";
              const moduloError = document.createElement('error-state');
                moduloError.render(
                    "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
                    () => { initArtistView(nombreArtista); }
                );
                grid.appendChild(errorDiv);
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
     const spinnerRojo = document.createElement('loading-state');
     grid.innerHTML = "";
     grid.appendChild(spinnerRojo);


    const indexPagina = artistState.currentPage;

    if (artistState.obrasPorPagina[indexPagina]) {
        console.log(` Usando caché para página ${indexPagina}`);
        dibujarTarjetas(artistState.obrasPorPagina[indexPagina]);
        renderizarControlesPaginacionArtista();
        artistState.isLoading = false;
        return;
    }

    const obrasValidasChunk = [];
    const tamañoLote = artistState.itemsPerPage;

    try {
        while (obrasValidasChunk.length < tamañoLote && 
               artistState.ultimoIdIndexProcesado < artistState.todosLosIDs.length) {
            
            const loteSize = Math.min(8, artistState.todosLosIDs.length - artistState.ultimoIdIndexProcesado);
            const idsAEvaluar = artistState.todosLosIDs.slice(
                artistState.ultimoIdIndexProcesado, 
                artistState.ultimoIdIndexProcesado + loteSize
            );
            
            if (idsAEvaluar.length === 0) break;

            console.log(` Procesando lote ${artistState.ultimoIdIndexProcesado + 1}-${artistState.ultimoIdIndexProcesado + idsAEvaluar.length}`);
            artistState.ultimoIdIndexProcesado += idsAEvaluar.length;

            const promesas = idsAEvaluar.map(id => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const apiBase = window.API_BASE || API_BASE;
                return fetch(`${apiBase}/objects/${id}`, { signal: controller.signal })
                    .then(response => {
                        clearTimeout(timeoutId);
                        if (!response.ok) return null;
                        return response.json();
                    })
                    .catch(err => {
                        clearTimeout(timeoutId);
                        return null;
                    });
            });

            const resultados = await Promise.all(promesas);

            for (const obra of resultados) {
                if (!obra) continue;
                if (obra.title && obra.primaryImageSmall) {
                    obrasValidasChunk.push(obra);
                    if (obrasValidasChunk.length === tamañoLote) break;
                }
            }

            if (obrasValidasChunk.length < tamañoLote && 
                artistState.ultimoIdIndexProcesado < artistState.todosLosIDs.length) {
                await delay(300);
            }
        }

        artistState.obrasPorPagina[indexPagina] = obrasValidasChunk;
        console.log(` Página ${indexPagina + 1}: ${obrasValidasChunk.length} obras válidas`);

        if (obrasValidasChunk.length === 0 && indexPagina === 0) {
            grid.innerHTML = "<p class='no-results'> Este artista no posee obras con imagen pública disponible.</p>";
        } else {
            dibujarTarjetas(obrasValidasChunk);
        }
        
        renderizarControlesPaginacionArtista();

    } catch (error) {
        console.error(" Error:", error);
        grid.innerHTML = `<p class='no-results' style="color: #d32f2f;"> Error: ${error.message}</p>`;
    } finally {
        artistState.isLoading = false;
    }
}

// --- EXPONER FUNCIONES GLOBALMENTE ---
window.initArtistView = initArtistView;
window.renderizarPaginaArtista = renderizarPaginaArtista;

console.log(' artist.js cargado correctamente');
console.log(' Funciones disponibles: initArtistView, renderizarPaginaArtista',{
        initArtistView: typeof window.initArtistView === 'function',
    renderizarPaginaArtista: typeof window.renderizarPaginaArtista === 'function'
});
