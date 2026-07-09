const FLUJO_SOPORTE = {
    'inicio': {
        texto: "¡Hola! Soy Metsy, tu guía en MetHub. ¿En qué nos enfocamos hoy?",
        opciones: [
            { texto: "💡 Datos Curiosos e Historias", siguienteNodo: "menu_curiosidades" },
            { texto: "🛠️ Ayuda y Soporte Técnico", siguienteNodo: "menu_usuario_soporte" }
        ]
    },

    // ==========================================
    // 💡 RAMA DE CURIOSIDADES 
    // ==========================================
    'menu_curiosidades': {
        texto: "¡El Met es un multiverso de historias locas! Elige un tema para volar la mente:",
        opciones: [
            { texto: "🗿 Jean-Antoine Houdon", siguienteNodo: "curiosidad_houdon" },
            { texto: "🐊 El Templo de Dendur y Egipto", siguienteNodo: "curiosidad_egipto" },
            { texto: "🎨 Secretos y Cuadros Ocultos", siguienteNodo: "curiosidad_pinturas" },
            { texto: "🎭 El Gran Engaño (Falsificaciones)", siguienteNodo: "curiosidad_estafas" },
            { texto: "⬅️ Volver al menú principal", siguienteNodo: "inicio" }
        ]
    },
    'curiosidad_houdon': {
        texto: "Jean-Antoine Houdon fue el escultor más top de la Ilustración. Lograba un realismo tan enfermo que la gente creía que hacía trampa. Para esculpir a George Washington, viajó a EE.UU. y le cubrió la cara con yeso vivo para tener una máscara exacta.",
        opciones: [
            { texto: "👀 ¿Qué truco usaba para los ojos?", siguienteNodo: "houdon_ojos" },
            { texto: "⬅️ Ver otros temas", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'houdon_ojos': {
        texto: "Esculpir ojos en mármol blanco y que no parezcan de estatua ciega es casi imposible. Houdon inventó un truco: dejaba un fragmento flotante de piedra arriba de la pupila para que proyectara una sombra natural, haciendo que la mirada 'brillara' según cómo le diera la luz de la sala.",
        opciones: [
            { texto: "✅ ¡Qué genio!", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'curiosidad_egipto': {
        texto: "El Met tiene un templo egipcio real por dentro: El Templo de Dendur. Fue un regalo de Egipto a EE.UU. en 1965 para salvarlo de inundarse por la represa de Asuán. Lo desmontaron piedra por piedra (más de 640 toneladas) y lo armaron en una sala gigante.",
        opciones: [
            { texto: "🐊 ¿Es verdad que hay graffitis viejos?", siguienteNodo: "egipto_graffiti" },
            { texto: "⬅️ Ver otros temas", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'egipto_graffiti': {
        texto: "¡Sí! Si te acercas a los muros de piedra del templo en el museo, puedes ver graffitis tallados por soldados romanos hace 2,000 años, y otros del siglo XIX dejados por turistas ingleses que querían poner 'Yo estuve aquí'.",
        opciones: [
            { texto: "🤯 Qué locura", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'curiosidad_pinturas': {
        texto: "Muchos pintores eran limpios (pobres) y reutilizaban lienzos. El Met usa rayos X en cuadros de Van Gogh y Picasso, descubriendo retratos completamente diferentes escondidos debajo de las capas de pintura que vemos hoy.",
        opciones: [
            { texto: "🖼️ ¿Qué pasa con 'Washington cruzando el Delaware'?", siguienteNodo: "cuadro_gigante" },
            { texto: "⬅️ Ver otros temas", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'cuadro_gigante': {
        texto: "Ese cuadro icónico es tan asquerosamente gigante (aprox. 4 x 6 metros) que cuando lo llevaron al museo en 1897 no cabía por ninguna puerta ni ventana. Tuvieron que romper literalmente una pared del museo para poder meterlo.",
        opciones: [
            { texto: "✅ Tremendo dato", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'curiosidad_estafas': {
        texto: "Ni los expertos del Met se salvan. En 1967, el museo descubrió que una de sus estatuas griegas más famosas, 'El Caballo de Bronce' (que costó una fortuna y llevaba décadas expuesta), era una falsificación total hecha en el siglo XX.",
        opciones: [
            { texto: "🕵️‍♂️ ¿Cómo los atraparon?", siguienteNodo: "detalles_estafa" },
            { texto: "⬅️ Ver otros temas", siguienteNodo: "menu_curiosidades" }
        ]
    },
    'detalles_estafa': {
        texto: "Científicos usaron tecnología de rayos gamma y descubrieron que la estructura interna del bronce usaba técnicas de fundición modernas que no existían en la antigua Grecia. El museo la dejó expuesta, pero ahora con un cartel que dice: 'Falsificación'.",
        opciones: [
            { texto: "🔥 Qué humillación", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_curiosidades" }
        ]
    },

    // ==========================================
    // 🛠️ RAMA DE SOPORTE PARA EL USUARIO (CORREGIDA)
    // ==========================================
    'menu_usuario_soporte': {
        texto: "Dime, ¿qué inconveniente tienes al navegar por MetHub?",
        opciones: [
            { texto: "⏳ La galería tarda mucho en cargar o sale vacía", siguienteNodo: "ayuda_carga" },
            { texto: "🔍 No encuentro la obra o artista que busco", siguienteNodo: "ayuda_busqueda" },
            { texto: "⚖️ ¿Cómo funciona el Comparador?", siguienteNodo: "ayuda_comparador" },
            { texto: "⬅️ Volver al inicio", siguienteNodo: "inicio" }
        ]
    },
    'ayuda_carga': {
        texto: "Como nos conectamos directamente con los servidores del Museo Metropolitano de Nueva York en tiempo real, si tu conexión a internet está un poco inestable, las imágenes pesadas pueden tardar unos segundos en mostrarse. ¡Prueba recargando la página!",
        opciones: [
            { texto: "🔄 Entendido, voy a recargar", siguienteNodo: "fin" },
            { texto: "⬅️ Ver otros problemas",Platform: "menu_usuario_soporte" }
        ]
    },
    'ayuda_busqueda': {
        texto: "Te recomiendo hacer las búsquedas usando palabras clave en inglés (por ejemplo, escribe 'Sunflowers' en vez de 'Girasoles', o 'Gold' en vez de 'Oro'). La base de datos original del museo está registrada en ese idioma.",
        opciones: [
            { texto: "💡 Buen consejo, gracias", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_usuario_soporte" }
        ]
    },
    'ayuda_comparador': {
        texto: "¡Es facilito! Ve a la sección del Comparador, selecciona una obra del museo de la lista para el lado izquierdo y otra para el lado derecho. La app te cruzará los datos de época, autor y materiales cara a cara para que analices las diferencias.",
        opciones: [
            { texto: "✅ ¡A comparar se ha dicho!", siguienteNodo: "fin" },
            { texto: "⬅️ Volver", siguienteNodo: "menu_usuario_soporte" }
        ]
    },

 
    'fin': {
        texto: "¡Perfecto! Aquí sigo por si quieren ver más historias o si les hace falta ayuda con otra sección.",
        opciones: [
            { texto: "🔄 Volver al menú de inicio", siguienteNodo: "inicio" }
        ]
    }
};
function crearMetsy() {
    const contenedor = document.createElement('div');
    contenedor.id = 'metsy-container';
    
    contenedor.innerHTML = `
        <div id="metsy-chat-box" class="metsy-oculto">
            <div class="metsy-header">
                <span class="metsy-status-dot"></span>
                <strong>Metsy Asistente</strong>
            </div>
            <div id="metsy-body">
                <div id="metsy-bubble"></div>
                <div id="metsy-options-container"></div>
            </div>
        </div>
        <div class="metsy-avatar-wrapper">
            <img id="metsy-avatar" src="assets/metsy_base.png" alt="Metsy">
        </div>
    `;

    const avatar = contenedor.querySelector('#metsy-avatar');
    const chatBox = contenedor.querySelector('#metsy-chat-box');

    avatar.addEventListener('click', () => {
        if (chatBox.classList.contains('metsy-oculto')) {
            // Abrir Chat
            chatBox.classList.remove('metsy-oculto');
            chatBox.classList.add('metsy-visible');
            avatar.classList.add('avatar-activo');
            irANodo('inicio'); 
        } else {
            // Cerrar Chat
            cerrarMetsy(avatar, chatBox);
        }
    });

    return contenedor;
}

function irANodo(nodoId) {
    const globo = document.getElementById('metsy-bubble');
    const opcionesContenedor = document.getElementById('metsy-options-container');
    const avatar = document.getElementById('metsy-avatar');
    const chatBody = document.getElementById('metsy-body');
    
    if (!globo || !opcionesContenedor) return;

    const nodo = FLUJO_SOPORTE[nodoId] || FLUJO_SOPORTE['inicio'];
    
    // Cambiar la expresión del avatar según el tipo de nodo
    if (nodoId === 'fin') {
        avatar.src = 'assets/metsy_base.png';
    } else if (nodoId.includes('curiosidad') || nodoId.includes('houdon') || nodoId.includes('egipto')) {
        // Si tienes un asset feliz o pensativo para las curiosidades
        avatar.src = 'assets/metsy_base.png'; 
    } else {
        avatar.src = 'assets/metsy_consulta.png'; 
    }

    // 1. Efecto de desvanecimiento para el texto nuevo
    globo.style.opacity = 0;
    setTimeout(() => {
        globo.textContent = nodo.texto;
        globo.style.opacity = 1;
        
        // Auto-scroll al recibir texto largo
        chatBody.scrollTop = 0;
    }, 150);

    // 2. Limpiar y renderizar botones con efecto cascada
    opcionesContenedor.innerHTML = '';
    nodo.opciones.forEach((opcion, index) => {
        const boton = document.createElement('button');
        boton.className = 'btn-metsy-opcion';
        boton.textContent = opcion.texto;
        boton.style.animationDelay = `${index * 0.08}s`; // Efecto cascada escalonado
        
        boton.addEventListener('click', () => {
            irANodo(opcion.siguienteNodo);
        });
        
        opcionesContenedor.appendChild(boton);
    });
}

function cerrarMetsy(avatar, chatBox) {
    chatBox.classList.remove('metsy-visible');
    chatBox.classList.add('metsy-oculto');
    avatar.classList.remove('avatar-activo');
    avatar.src = 'assets/metsy_base.png';
}

function inyectarMetsy() {
    if (!document.getElementById('metsy-container')) {
        document.body.appendChild(crearMetsy());
    }
}

