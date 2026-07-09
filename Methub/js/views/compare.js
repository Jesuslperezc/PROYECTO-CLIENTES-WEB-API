let compareState = {
    obraA: null,
    obraB: null
};

/**
 * Inicializa la vista del comparador.
 * Puede recibir IDs opcionales si se decide enviar obras directamente desde el detalle.
 */
async function initCompareView(idA = null, idB = null) {
    const panelA = document.getElementById('compare-panel-a');
    const panelB = document.getElementById('compare-panel-b');
    const tableContainer = document.getElementById('compare-table-container');

    containerClean(panelA);
    containerClean(panelB);
    containerClean(tableContainer);
    tableContainer.classList.add('d-none');

    // Inicializamos estados de carga visual o placeholders
    panelA.appendChild(crearPlaceholderPanel("A"));
    panelB.appendChild(crearPlaceholderPanel("B"));

    // Si entran IDs específicos por la URL (ej: #compare/1234/5678) los cargamos directamente
    if (idA) await cargarObraEnPanel(idA, 'A');
    if (idB) await cargarObraEnPanel(idB, 'B');
}

function crearPlaceholderPanel(letra) {
    const div = document.createElement('div');
    div.className = 'compare-placeholder';
    div.style.textAlign = 'center';
    div.style.padding = '40px 20px';
    div.style.border = '2px dashed #444';
    div.style.borderRadius = '8px';

    const p = document.createElement('p');
    p.textContent = `No hay ninguna obra seleccionada para el Panel ${letra}.`;
    p.style.color = '#888';

    // Un input rápido de texto por si quieres buscar o meter un ID a mano directamente en el panel
    const inputId = document.createElement('input');
    inputId.type = 'number';
    inputId.placeholder = 'Ingresa ID de la obra...';
    inputId.className = 'search-input'; // Reutiliza tus estilos de inputs
    inputId.style.margin = '10px 5px';
    inputId.style.padding = '6px';

    const btnCargar = document.createElement('button');
    btnCargar.textContent = `Cargar en ${letra}`;
    btnCargar.className = 'btn-back'; // Reutiliza tus estilos de botones
    btnCargar.style.padding = '6px 12px';
    btnCargar.addEventListener('click', () => {
        const id = inputId.value.trim();
        if (id) cargarObraEnPanel(id, letra);
    });

    div.appendChild(p);
    div.appendChild(inputId);
    div.appendChild(btnCargar);
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

        // Guardamos en el estado local
        if (letra === 'A') compareState.obraA = obra;
        else compareState.obraB = obra;

        containerClean(targetPanel);

        // Construcción segura del contenedor de la tarjeta de comparación
        const cardView = document.createElement('div');
        cardView.className = 'compare-card-active';

        const btnRemover = document.createElement('button');
        btnRemover.textContent = '✕ Quitar';
        btnRemover.style.float = 'right';
        btnRemover.style.backgroundColor = '#ef4444';
        btnRemover.style.color = '#fff';
        btnRemover.style.border = 'none';
        btnRemover.style.padding = '4px 8px';
        btnRemover.style.cursor = 'pointer';
        btnRemover.style.borderRadius = '4px';
        btnRemover.addEventListener('click', () => {
            if (letra === 'A') compareState.obraA = null;
            else compareState.obraB = null;
            containerClean(targetPanel);
            targetPanel.appendChild(crearPlaceholderPanel(letra));
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

        // Evaluamos si ya podemos construir la tabla comparativa técnica abajo
        verificarYRenderizarTablaComparativa();

    } catch (err) {
        console.error("Error al cargar en comparador:", err);
        containerClean(targetPanel);
        const errP = document.createElement('p');
        errP.style.color = '#ef4444';
        errP.textContent = `No se pudo encontrar o cargar el ID: ${id}`;
        targetPanel.appendChild(errP);
        targetPanel.appendChild(crearPlaceholderPanel(letra));
    }
}

function verificarYRenderizarTablaComparativa() {
    const tableContainer = document.getElementById('compare-table-container');
    containerClean(tableContainer);

    // Si falta alguna de las dos obras, volvemos a ocultar la tabla de abajo
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

    // Encabezado seguro
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

    // Mapeo ordenado de filas técnicas a contrastar
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