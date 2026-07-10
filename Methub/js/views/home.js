const API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

async function cargarVistaHome() {
    const statsContainer = document.getElementById('stats-container');
    const gridDestacados = document.getElementById('grid-destacados');
    
    statsContainer.textContent = "";
    gridDestacados.textContent = "";

    const spinnerRojo = document.createElement('loading-state');
    gridDestacados.appendChild(spinnerRojo);

    try {
        const [resDept, resObras] = await Promise.all([
            fetch(`${API_BASE}/departments`),
            fetch(`${API_BASE}/search?q=art&isHighlight=true&hasImages=true`)
        ]);

        const dataDept = await resDept.json();
        const dataObras = await resObras.json();

        const totalDept = dataDept.departments.length;
        const totalDestacadas = dataObras.total;
        
        statsContainer.textContent = "";

        const card1 = document.createElement('div');
        card1.className = 'stat-card';
        const num1 = document.createElement('h3');
        num1.textContent = totalDept; 
        const text1 = document.createElement('p');
        text1.textContent = 'Departamentos';
        card1.appendChild(num1);
        card1.appendChild(text1);

        const card2 = document.createElement('div');
        card2.className = 'stat-card';
        const num2 = document.createElement('h3');
        num2.textContent = totalDestacadas; 
        const text2 = document.createElement('p');
        text2.textContent = 'Obras Destacadas con Imagen';
        card2.appendChild(num2);
        card2.appendChild(text2);

        statsContainer.appendChild(card1);
        statsContainer.appendChild(card2);

        const idsAInterrogar = dataObras.objectIDs.slice(0, 15);

        const promesasObjetos = idsAInterrogar.map(id => 
            fetch(`${API_BASE}/objects/${id}`).then(res => {
                if (!res.ok) throw new Error(`Error con el ID ${id}`);
                return res.json();
            })
        );

        const resultados = await Promise.allSettled(promesasObjetos);

        gridDestacados.textContent = "";

        let tarjetasRenderizadas = 0;

        resultados.forEach(item => {
            if (tarjetasRenderizadas >= 10) return;

            if (item.status === 'fulfilled') {
                const obra = item.value; 

                if (!obra.primaryImageSmall) {
                    return;
                }

                tarjetasRenderizadas++;

                const card = document.createElement('article');
                card.className = 'obra-card';
                
            
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.hash = `#detail/${obra.objectID}`;
                });

                const img = document.createElement('img');
                img.src = obra.primaryImageSmall;
                img.alt = obra.title || 'Obra de arte sin título';
                img.onerror = () => card.remove();
                card.appendChild(img);

                const title = document.createElement('h4');
                title.textContent = obra.title || 'Sin título';
                card.appendChild(title);

                const artist = document.createElement('p');
                artist.className = 'artist-text';
                if (obra.artistDisplayName) {
                    artist.innerHTML = `<span class="artist-link" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">${obra.artistDisplayName}</span>`;
                    artist.querySelector('.artist-link').addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        window.location.hash = `#artist/${encodeURIComponent(obra.artistDisplayName)}`;
                    });
                } else {
                    artist.textContent = 'Artista Desconocido';
                }
                card.appendChild(artist);

             
                const infoExtra = document.createElement('p');
                infoExtra.className = 'info-extra';
                infoExtra.textContent = `${obra.objectDate} | ${obra.department}`;
                card.appendChild(infoExtra);

                gridDestacados.appendChild(card);
            } else {
                console.warn("No se pudo cargar una de las obras:", item.reason);
            }
        });

    } catch (error) {
        console.error("Error crítico en la carga del Home:", error);
        
        statsContainer.textContent = "";
        gridDestacados.textContent = "";
        const moduloError = document.createElement('error-state');

        moduloError.render(
            "Hubo un problema al conectar con el Met. Por favor, verifica tu conexión.",
            () => { cargarVistaHome(); }
        );
        gridDestacados.appendChild(moduloError);
    }
}