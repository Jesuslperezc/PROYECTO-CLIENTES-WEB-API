let compareState = {
    obraA: null,
    obraB: null
};


let compareAbortController = new AbortController();

function reiniciarAbortComparador() {
    compareAbortController.abort();
    compareAbortController = new AbortController();
    return compareAbortController.signal;
}

async function procesarEnLotes(items, worker) {
    for (let i = 0; i < items.length; i += RATE_CONFIG.MAX_CONCURRENT) {
        const lote = items.slice(i, i + RATE_CONFIG.MAX_CONCURRENT);
        await Promise.all(lote.map(worker));
        if (i + RATE_CONFIG.MAX_CONCURRENT < items.length) {
            await delay(RATE_CONFIG.BATCH_DELAY_MS);
        }
    }
}

/**
 * Inicializa la vista del comparador.
 */
async function initCompareView(idA = null, idB = null) {
    // Cancelamos cualquier fetch pendiente de una entrada anterior a la vista
    reiniciarAbortComparador();

    const panelA = document.getElementById('compare-panel-a');
    const panelB = document.getElementById('compare-panel-b');
    const tableContainer = document.getElementById('compare-table-container');

    containerClean(panelA);
    containerClean(panelB);
    containerClean(tableContainer);
    tableContainer.classList.add('d-none');

    panelA.appendChild(await crearPlaceholderPanel("A"));
    panelB.appendChild(await crearPlaceholderPanel("B"));

    if (idA) {
        await cargarObraEnPanel(idA, 'A');
    }

    if (idB && compareState.obraA) {
        await cargarObraEnPanel(idB, 'B');
    }

    actualizarFlujoYBloqueos();
}
function actualizarFlujoYBloqueos() {
    const panelB = document.getElementById('compare-panel-b');
    const selectA = document.getElementById('select-compare-a');
    const selectB = document.getElementById('select-compare-b');

    // Evaluamos PRIORITARIAMENTE el objeto de estado global
    const idActivoA = compareState.obraA ? parseInt(compareState.obraA.objectID) : (selectA && selectA.value ? parseInt(selectA.value) : null);
    const idActivoB = compareState.obraB ? parseInt(compareState.obraB.objectID) : (selectB && selectB.value ? parseInt(selectB.value) : null);

    // Si hay una obra en A (ya sea en el estado o en el select), desbloqueamos B
    if (!idActivoA) {
        if (panelB) {
            panelB.style.opacity = '0.5';
            panelB.style.pointerEvents = 'none';
        }
        if (selectB) selectB.disabled = true;
    } else {
        if (panelB) {
            panelB.style.opacity = '1';
            panelB.style.pointerEvents = 'auto';
        }
        if (selectB) selectB.disabled = false;
    }

    if (selectA) {
        Array.from(selectA.options).forEach(option => {
            if (!option.value) return;
            option.disabled = (parseInt(option.value) === idActivoB);
        });
    }

    if (selectB) {
        Array.from(selectB.options).forEach(option => {
            if (!option.value) return;
            option.disabled = (parseInt(option.value) === idActivoA);
        });
    }
}
// === MODIFICADO: Ahora es async y genera un select con tus favoritos ===
async function crearPlaceholderPanel(letra) {
    const div = document.createElement('div');
    div.className = 'compare-placeholder';
    div.style.textAlign = 'center';
    div.style.padding = '40px 20px';
    div.style.border = '2px dashed #c4a46a'; /* Oro viejo a juego con el museo */
    div.style.borderRadius = '8px';
    div.style.backgroundColor = '#fdfbf7';

    const p = document.createElement('p');
    p.textContent = `Selecciona una obra de tus favoritas para el Panel ${letra}.`;
    p.style.color = '#111111';
    p.style.fontFamily = "'Times New Roman', Times, serif";
    p.style.fontSize = '16px';
    div.appendChild(p);

    const favoritosIds = obtenerFavoritos(); // Llamada a tu favoritos.js

    if (favoritosIds.length === 0) {
        // Estado alternativo si no tienen favoritos guardados aún
        const aviso = document.createElement('p');
        aviso.textContent = " No tienes obras guardadas en favoritos. Agrégalas desde el menú de detalles o explora la galería.";
        aviso.style.fontSize = '13px';
        aviso.style.color = '#8a8475';
        aviso.style.fontStyle = 'italic';
        div.appendChild(aviso);
        return div;
    }

    // Creamos el selector desplegable elegante
    const selectFav = document.createElement('select');
    // FIX: id necesario para que actualizarFlujoYBloqueos() pueda encontrarlo
    // y aplicar el bloqueo cruzado de IDs entre panel A y panel B.
    selectFav.id = `select-compare-${letra.toLowerCase()}`;
    selectFav.style.margin = '15px 0';
    selectFav.style.padding = '10px';
    selectFav.style.width = '80%';
    selectFav.style.maxWidth = '300px';
    selectFav.style.borderRadius = '6px';
    selectFav.style.border = '1px solid #c4a46a';
    selectFav.style.fontFamily = "system-ui, sans-serif";
    selectFav.style.display = 'block';
    selectFav.style.marginLeft = 'auto';
    selectFav.style.marginRight = 'auto';

    // Opción por defecto
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = '--- Elige una obra favorita ---';
    selectFav.appendChild(optDefault);

    div.appendChild(selectFav);


    selectFav.addEventListener('change', async () => {
        const idSeleccionado = selectFav.value;
        if (idSeleccionado) {

            await cargarObraEnPanel(idSeleccionado, letra);


            actualizarFlujoYBloqueos();
        } else {
            // FIX: antes solo se limpiaba compareState.obraA; ahora también
            // se limpia compareState.obraB cuando se vuelve a la opción por
            // defecto en el panel B, evitando que quede un estado "fantasma".
            if (letra === 'A') {
                compareState.obraA = null;
            } else {
                compareState.obraB = null;
            }
            verificarYRenderizarTablaComparativa();
            actualizarFlujoYBloqueos();
        }
    });

    // Creamos primero todas las <option> en orden (para no alterar el orden
    // de favoritos aunque las respuestas lleguen desordenadas), y las vamos
    // completando a medida que resuelve cada lote.
    const itemsAPoblar = favoritosIds.map(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `Cargando ID: ${id}...`;
        selectFav.appendChild(option);
        return { id, option };
    });

    const signal = compareAbortController.signal;

    // Poblamos el select trayendo los nombres desde la API, en lotes
    // controlados por RATE_CONFIG (throttling + reintentos), en vez de
    // disparar un fetch por favorito en paralelo.
    procesarEnLotes(itemsAPoblar, async ({ id, option }) => {
        const data = await fetchObjetoConReintento(id, signal, API_BASE);
        if (data) {
            option.textContent = `${data.title || 'Sin título'} (ID: ${id})`;
        } else {
            option.textContent = `Obra inaccesible (ID: ${id})`;
        }

        // Re-aplicamos el bloqueo cruzado cada vez que se completa una
        // opción, por si la carga termina después de que ya había una obra
        // seleccionada en el otro panel.
        actualizarFlujoYBloqueos();
    });

    return div;
}

async function cargarObraEnPanel(id, letra) {
    const targetPanel = document.getElementById(`compare-panel-${letra.toLowerCase()}`);
    containerClean(targetPanel);
    
    const loading = document.createElement('div');
    loading.className = 'loading-skeleton';
    loading.textContent = `Extrayendo metadatos de la pieza ${id}...`;
    targetPanel.appendChild(loading);

    try {
        const obra = await fetchObjetoConReintento(id, compareAbortController.signal, API_BASE);
        if (!obra) throw new Error('Obra inválida');

        if (letra === 'A') compareState.obraA = obra;
        else compareState.obraB = obra;

        containerClean(targetPanel);

        const cardView = document.createElement('div');
        cardView.className = 'compare-card-active';

        const btnRemover = document.createElement('button');
        btnRemover.textContent = '✕ Quitar';
        btnRemover.style.float = 'right';
        btnRemover.style.backgroundColor = '#111111'; /* Cambiado a negro carbón del museo */
        btnRemover.style.color = '#fff';
        btnRemover.style.border = '1px solid #c4a46a';
        btnRemover.style.padding = '6px 12px';
        btnRemover.style.cursor = 'pointer';
        btnRemover.style.borderRadius = '4px';
        btnRemover.style.fontFamily = "'Times New Roman', Times, serif";
        
        btnRemover.addEventListener('click', async () => {
            if (letra === 'A') compareState.obraA = null;
            else compareState.obraB = null;
            containerClean(targetPanel);
            
            // Re-inyectamos el placeholder de favoritos asíncronamente
            targetPanel.appendChild(await crearPlaceholderPanel(letra));
            verificarYRenderizarTablaComparativa();
            actualizarFlujoYBloqueos();
        });
        cardView.appendChild(btnRemover);

        const img = document.createElement('img');
        img.src = obra.primaryImageSmall || 'assets/placeholder-no-image.png';
        img.alt = obra.title || 'Sin título';
        img.style.width = '100%';
        img.style.maxHeight = '300px';
        img.style.objectFit = 'contain';
        img.style.marginTop = '10px';
        img.onerror = () => img.src = 'assets/placeholder-no-image.png';
        cardView.appendChild(img);

        const h3 = document.createElement('h3');
        h3.textContent = obra.title || 'Sin Título';
        h3.style.marginTop = '10px';
        cardView.appendChild(h3);

        const pArtista = document.createElement('p');
        pArtista.style.fontStyle = 'italic';
        pArtista.textContent = obra.artistDisplayName ? `Por: ${obra.artistDisplayName}` : 'Artista Desconocido';
        cardView.appendChild(pArtista);
        targetPanel.appendChild(cardView);
        verificarYRenderizarTablaComparativa();
        actualizarFlujoYBloqueos()
        

    } catch (err) {
        console.error("Error al cargar en comparador:", err);
        containerClean(targetPanel);
        const errP = document.createElement('p');
        errP.style.color = '#ef4444';
        errP.textContent = `No se pudo encontrar o cargar el ID: ${id}`;
        targetPanel.appendChild(errP);
        
        // Caída segura regresando al selector de favoritos
        const nuevoPlaceholder = await crearPlaceholderPanel(letra);
        targetPanel.appendChild(nuevoPlaceholder);

    }
}

function verificarYRenderizarTablaComparativa() {
    const tableContainer = document.getElementById('compare-table-container');
    containerClean(tableContainer);

    if (!compareState.obraA || !compareState.obraB) {
        tableContainer.classList.add('d-none');
        return;
    }

    tableContainer.classList.remove('d-none');

    const table = document.createElement('table');
    table.className = 'compare-table-data';
    table.style.width = '100%';
    table.style.marginTop = '30px';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const thCaracteristica = document.createElement('th');
    thCaracteristica.textContent = 'Característica Técnica';
    
    const thObraA = document.createElement('th');
    thObraA.textContent = compareState.obraA.title || 'Obra A';
    
    const thObraB = document.createElement('th');
    thObraB.textContent = compareState.obraB.title || 'Obra B';

    headerRow.appendChild(thCaracteristica);
    headerRow.appendChild(thObraA);
    headerRow.appendChild(thObraB);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

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
        tdLabel.style.fontWeight = 'bold';
        tdLabel.textContent = campo.label;

        // Obtenemos los valores limpios para contrastar
        const valA = compareState.obraA[campo.key] || campo.default;
        const valB = compareState.obraB[campo.key] || campo.default;

        const tdValA = document.createElement('td');
        tdValA.textContent = valA;

        const tdValB = document.createElement('td');
        tdValB.textContent = valB;


        if (valA.toLowerCase().trim() !== valB.toLowerCase().trim()) {
            tr.classList.add('fila-diferencia'); 
            tr.title = "Diferencia detectada en este atributo técnico"
        }
        // =======================================================

        tr.appendChild(tdLabel);
        tr.appendChild(tdValA);
        tr.appendChild(tdValB);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

