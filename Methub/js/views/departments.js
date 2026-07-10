async function initDepartments() {
    const grid = document.getElementById('grid-departamentos');
       const spinnerRojo = document.createElement('loading-state');
        grid.appendChild(spinnerRojo);
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
        const moduloError = document.createElement('error-state');
        grid.innerHTML = "";
        moduloError.render(

            "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
            () => { initDepartments(); }
        );
        grid.appendChild(moduloError)
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