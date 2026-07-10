function createNavBar() {
    const nav = document.createElement('nav');
    nav.id = 'navbar';
    const logo = document.createElement('a');
    logo.href = '#home';
    logo.id = 'logo';
    logo.textContent = 'MetHub';
    // Contenedor para los enlaces de navegación
    const linksContainer = document.createElement('div');
    linksContainer.className = 'nav-links';

    const linksData = [
        { text: 'Inicio', hash: '#home' },
        { text: 'Explorar', hash: '#explore' },
        { text: 'Departamentos', hash: '#departments' },
        { text: 'Comparar', hash: '#compare' }
    ];

    linksData.forEach(data => {
        const link = document.createElement('a');
        link.href = data.hash;
        link.className = 'nav-link';
        link.textContent = data.text;
        link.setAttribute('data-hash', data.hash);
        linksContainer.appendChild(link);
    });

    // Slot donde Metsy se va a insertar (ver metsy.js -> inyectarMetsy)
    const metsySlot = document.createElement('div');
    metsySlot.id = 'navbar-metsy-slot';

    nav.appendChild(logo);
    nav.appendChild(linksContainer);
    nav.appendChild(metsySlot);
    return nav;
}

// Resalta la pestaña activa
function updateActiveNavLink(currentHash) {
    let baseHash = currentHash;
    if (currentHash.startsWith('#detail/')) baseHash = '#explore';
    if (currentHash.startsWith('#artist/')) baseHash = '#explore'; 
    if (baseHash === '' || baseHash === '#') baseHash = '#home';
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        const linkHash = link.getAttribute('data-hash');
        if (linkHash === baseHash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}