const BANCO_MENSAJES = {
    '#home': { 
        inicial: "¡Hola! Soy Metsy, tu guía. Bienvenido a MetHub.", 
        aleatorios: ["¡Mira esas estadísticas!", "He filtrado las obras sin imagen.", "¡Disfruta las joyas del museo!"] 
    },
    '#explore': { 
        inicial: "Sección de exploración. ¿Qué buscamos hoy?", 
        aleatorios: ["Usa filtros para refinar tu búsqueda.", "Prueba buscando 'Gold' o 'Sunflowers'."] 
    },
    '#departments': { 
        inicial: "Estás en los Departamentos Curatoriales.", 
        aleatorios: ["Cada ala tiene siglos de historia.", "Elige un departamento para explorar."] 
    },
    '#compare': { 
        inicial: "Modo comparador. Elige dos obras.", 
        aleatorios: ["Analiza diferencias cara a cara.", "¡La comparación es clave para aprender!"] 
    },
    'default': { 
        inicial: "Explorando la metadata profunda...", 
        aleatorios: ["¿Curiosidad por el arte?", "Esta base de datos es inmensa."] 
    }
};

function crearMetsy() {
    const contenedor = document.createElement('div');
    contenedor.id = 'metsy-container';
    contenedor.innerHTML = `
        <div id="metsy-bubble">Hola, soy Metsy, tu guía turístico.</div>
        <img id="metsy-avatar" src="assets/metsy_base.png" alt="Metsy">
    `;

    const avatar = contenedor.querySelector('#metsy-avatar');
    const globo = contenedor.querySelector('#metsy-bubble');

    avatar.addEventListener('click', () => {
        avatar.src = 'assets/metsy_consulta.png';
        const hash = window.location.hash || '#home';
        const data = BANCO_MENSAJES[hash] || BANCO_MENSAJES['default'];
        
        globo.textContent = data.aleatorios[Math.floor(Math.random() * data.aleatorios.length)];
        globo.classList.remove('d-none');

        resetMetsy(avatar, globo);
    });

    return contenedor;
}

function actualizarMensajeMetsy(hash, isInitialLoad = false) {
    const globo = document.getElementById('metsy-bubble');
    const avatar = document.getElementById('metsy-avatar');
    if (!globo) return;

    if (!isInitialLoad) {
        avatar.src = 'assets/metsy_consulta.png';
        const data = BANCO_MENSAJES[hash] || BANCO_MENSAJES['default'];
        globo.textContent = data.inicial;
        globo.classList.remove('d-none');
        resetMetsy(avatar, globo);
    }
}

function resetMetsy(avatar, globo) {
    if (window.metsyFaceTimeout) clearTimeout(window.metsyFaceTimeout);
    window.metsyFaceTimeout = setTimeout(() => { avatar.src = 'assets/metsy_base.png'; }, 4000);

    if (window.metsyTimeout) clearTimeout(window.metsyTimeout);
    window.metsyTimeout = setTimeout(() => { globo.classList.add('d-none'); }, 5000);
}

function inyectarMetsy() {
    if (!document.getElementById('metsy-container')) {
        document.body.appendChild(crearMetsy());
    }
}