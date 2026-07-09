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

    const totalIDs = artistState.todosLosIDs.length;
    const totalPaginas = Math.ceil(totalIDs / artistState.itemsPerPage);
    const paginaActual = artistState.currentPage + 1;

    const btnAnt = document.createElement('button');
    btnAnt.textContent = "◀ Anterior";
    btnAnt.className = "btn-secondary";
    btnAnt.style.padding = "8px 16px";
    btnAnt.style.cursor = "pointer";
    btnAnt.style.borderRadius = "4px";
    btnAnt.style.border = "1px solid #ddd";
    btnAnt.style.backgroundColor = artistState.currentPage === 0 ? "#f5f5f5" : "white";
    btnAnt.style.color = artistState.currentPage === 0 ? "#999" : "#333";
    btnAnt.disabled = artistState.currentPage === 0;
    btnAnt.addEventListener('click', () => {
        if (artistState.currentPage > 0) {
            artistState.currentPage--;
            renderizarPaginaArtista();
        }
    });

    const infoPagina = document.createElement('span');
    infoPagina.className = 'page-info-text';
    infoPagina.textContent = ` Página ${paginaActual} de ${totalPaginas || 1} `;
    infoPagina.style.margin = "0 15px";
    infoPagina.style.fontWeight = "bold";

    const btnSig = document.createElement('button');
    btnSig.textContent = "Siguiente ▶";
    btnSig.className = "btn-secondary";
    btnSig.style.padding = "8px 16px";
    btnSig.style.cursor = "pointer";
    btnSig.style.borderRadius = "4px";
    btnSig.style.border = "1px solid #ddd";
    btnSig.style.backgroundColor = "white";
    btnSig.style.color = "#333";
    btnSig.disabled = artistState.currentPage >= totalPaginas - 1;
    btnSig.addEventListener('click', () => {
        if (artistState.currentPage < totalPaginas - 1) {
            artistState.currentPage++;
            renderizarPaginaArtista();
        }
    });

    container.appendChild(btnAnt);
    container.appendChild(infoPagina);
    container.appendChild(btnSig);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// --- FUNCIÓN PRINCIPAL ---

async function initArtistView(nombreArtista) {
    console.log('🎨 Iniciando vista de artista:', nombreArtista);

    // Resetear estado
    artistState.todosLosIDs = [];
    artistState.obrasPorPagina = {};
    artistState.currentPage = 0;
    artistState.currentArtistName = nombreArtista;
    artistState.ultimoIdIndexProcesado = 0;
    artistState.isLoading = false;
    artistState.totalObrasEncontradas = 0;

    // Actualizar UI
    const titleElement = document.getElementById('artist-name-title');
    if (titleElement) titleElement.textContent = nombreArtista;
    
    const bioElement = document.getElementById('artist-bio');
    if (bioElement) bioElement.textContent = "🔍 Buscando colecciones en el Met...";
    
    const totalElement = document.getElementById('artist-total-works');
    if (totalElement) totalElement.textContent = "Cargando...";

    const grid = document.getElementById('grid-artista');
    if (grid) {
        grid.innerHTML = "<div class='loading-skeleton'>🔍 Buscando obras de " + nombreArtista + "...</div>";
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
        console.log('📡 Buscando en:', searchUrl);
        
        const res = await fetch(searchUrl);
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('📊 Resultados encontrados:', data.total || 0);

        if (!data.objectIDs || data.objectIDs.length === 0) {
            if (grid) {
                grid.innerHTML = "";
                const noRes = document.createElement('p');
                noRes.className = 'no-results';
                noRes.textContent = `🎨 No se encontraron obras para "${nombreArtista}". Intenta con otro nombre.`;
                grid.appendChild(noRes);
            }
            if (bioElement) bioElement.textContent = "No se encontraron registros.";
            if (totalElement) totalElement.textContent = "0 obras";
            return;
        }

        artistState.todosLosIDs = data.objectIDs;
        artistState.totalObrasEncontradas = data.objectIDs.length;
        
        if (totalElement) {
            totalElement.textContent = `${data.objectIDs.length} obras encontradas`;
        }
        if (bioElement) {
            bioElement.textContent = `🖼️ Mostrando obras de ${nombreArtista}`;
        }

        console.log(`📦 Total de IDs a procesar: ${data.objectIDs.length}`);
        await renderizarPaginaArtista();

    } catch (err) {
        console.error("❌ Error en initArtistView:", err);
        if (grid) {
            grid.innerHTML = "";
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.padding = '20px';
            errorDiv.style.textAlign = 'center';
            errorDiv.innerHTML = `
                <p style="color: #d32f2f; font-weight: bold;">❌ Error: ${err.message}</p>
                <p>No se pudo conectar con la API del Met Museum.</p>
                <button onclick="window.initArtistView('${nombreArtista.replace(/'/g, "\\'")}')" 
                        style="padding: 10px 20px; margin-top: 10px; cursor: pointer; border: 1px solid #4f46e5; border-radius: 4px; background: #4f46e5; color: white;">
                    🔄 Reintentar
                </button>
            `;
            grid.appendChild(errorDiv);
        }
    }
}

async function renderizarPaginaArtista() {
    if (artistState.isLoading) {
        console.log('⏳ Ya hay una carga en proceso...');
        return;
    }

    const grid = document.getElementById('grid-artista');
    if (!grid) {
        console.error('❌ Grid de artista no encontrado');
        return;
    }

    artistState.isLoading = true;
    grid.innerHTML = "<div class='loading-skeleton'>⏳ Cargando obras...</div>";

    const indexPagina = artistState.currentPage;

    if (artistState.obrasPorPagina[indexPagina]) {
        console.log(`📦 Usando caché para página ${indexPagina}`);
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

            console.log(`📥 Procesando lote ${artistState.ultimoIdIndexProcesado + 1}-${artistState.ultimoIdIndexProcesado + idsAEvaluar.length}`);
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
        console.log(`✅ Página ${indexPagina + 1}: ${obrasValidasChunk.length} obras válidas`);

        if (obrasValidasChunk.length === 0 && indexPagina === 0) {
            grid.innerHTML = "<p class='no-results'>🎨 Este artista no posee obras con imagen pública disponible.</p>";
        } else {
            dibujarTarjetas(obrasValidasChunk);
        }
        
        renderizarControlesPaginacionArtista();

    } catch (error) {
        console.error("❌ Error:", error);
        grid.innerHTML = `<p class='no-results' style="color: #d32f2f;">❌ Error: ${error.message}</p>`;
    } finally {
        artistState.isLoading = false;
    }
}

// --- EXPONER FUNCIONES GLOBALMENTE ---
window.initArtistView = initArtistView;
window.renderizarPaginaArtista = renderizarPaginaArtista;

console.log('✅ artist.js cargado correctamente');
console.log('📌 Funciones disponibles: initArtistView, renderizarPaginaArtista',{
        initArtistView: typeof window.initArtistView === 'function',
    renderizarPaginaArtista: typeof window.renderizarPaginaArtista === 'function'
});
