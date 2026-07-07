async function initDepartments() {
    const grid = document.getElementById('grid-departamentos');
    grid.innerHTML = "<div class='loading-skeleton'>Abriendo los salones del museo...</div>";

    try {
        const res = await fetch(`${API_BASE}/departments`);
        const data = await res.json();

        grid.innerHTML = ""; 

        data.departments.forEach(dept => {
            const card = document.createElement('article');
            card.className = 'dept-card';
            
            card.addEventListener('click', () => {
                 deptoSeleccionadoDesdeFuera(dept.departmentId);
            });

            card.innerHTML = `

                <h3>${dept.displayName}</h3>
                <p class="dept-action">Explorar colección →</p>
            `;

            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Error:", err);
        grid.innerHTML = "<p>No pudimos abrir las salas de exhibición. Inténtalo de nuevo.</p>";
    }
}

function deptoSeleccionadoDesdeFuera(idDepartamento) {
  
    window.location.hash = "#explore";
    
    setTimeout(() => {
        const selectDept = document.getElementById('select-departamento');
        if (selectDept) {
            selectDept.value = idDepartamento;

            ejecutarFiltradoMet();
        }
    }, 100);
}