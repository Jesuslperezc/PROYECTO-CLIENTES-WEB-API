let compareState = {
    obraA: null,
    obraB: null
};

/**
 * Inicializa la vista del comparador.
 */
async function initCompareView(idA = null, idB = null) {
    const panelA = document.getElementById('compare-panel-a');
    const panelB = document.getElementById('compare-panel-b');
    const tableContainer = document.getElementById('compare-table-container');

    containerClean(panelA);
    containerClean(panelB);
    containerClean(tableContainer);
    tableContainer.classList.add('d-none');

    // Inicializamos estados de carga visual usando await por el flujo de favoritos
    panelA.appendChild(await crearPlaceholderPanel("A"));
    panelB.appendChild(await crearPlaceholderPanel("B"));

    if (idA) await cargarObraEnPanel(idA, 'A');
    if (idB) await cargarObraEnPanel(idB, 'B');
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

    // Al cambiar la opción del select, carga la obra automáticamente
    selectFav.addEventListener('change', () => {
        const idSeleccionado = selectFav.value;
        if (idSeleccionado) {
            cargarObraEnPanel(idSeleccionado, letra);
        }
    });

    // Poblamos el select trayendo los nombres desde la API de forma asíncrona e inmediata
    favoritosIds.forEach(async (id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `Cargando ID: ${id}...`;
        selectFav.appendChild(option);

        try {
            const res = await fetch(`${API_BASE}/objects/${id}`);
            if (res.ok) {
                const data = await res.json();
                option.textContent = `${data.title || 'Sin título'} (ID: ${id})`;
            } else {
                option.textContent = `Obra inaccesible (ID: ${id})`;
            }
        } catch {
            option.textContent = `Error al cargar ID: ${id}`;
        }
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
        const res = await fetch(`${API_BASE}/objects/${id}`);
        if (!res.ok) throw new Error('Obra inválida');
        const obra = await res.json();

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

        const tdValA = document.createElement('td');
        tdValA.textContent = compareState.obraA[campo.key] || campo.default;

        const tdValB = document.createElement('td');
        tdValB.textContent = compareState.obraB[campo.key] || campo.default;

        tr.appendChild(tdLabel);
        tr.appendChild(tdValA);
        tr.appendChild(tdValB);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

function containerClean(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}