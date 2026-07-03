// Crea el footer y gestiona el endscreen 
function createFooter() {
    const footer = document.createElement('footer');
    footer.id = 'main-footer';
    const footerBox = document.createElement('div');
    footerBox.className = 'footer-clickable-box';

    const credits = document.createElement('p');
    credits.className = 'footer-credits';
    credits.textContent = '© 2026 MetHub. Desarrollado por Jesús Pérez y Rosavirginia Lujan.';
    const disclaimer = document.createElement('p');
    disclaimer.className = 'api-disclaimer';
     disclaimer.textContent = 'Datos provistos por la Open Access API del Metropolitan Museum of Art. Esta aplicación no está afiliada al museo.';

    footerBox.appendChild(credits);
    footerBox.appendChild(disclaimer);
    
    footer.appendChild(footerBox);
    footerBox.addEventListener('click', () => {
        showEndscreen();
    });
    return footer;
}

// Crea y despliega el endscreen
function showEndscreen() {
    const overlay = document.createElement('div');
    overlay.className = 'endscreen-overlay';

    const content = document.createElement('div');
    content.className = 'endscreen-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'endscreen-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });

    content.innerHTML = `
        <h2>Acerca de MetHub</h2>
        <hr class="endscreen-divider">
        
        <div class="endscreen-section">
            <h3>Los Desarrolladores</h3>
            <p>Este explorador de arte fue diseñado y programado con pasión por <strong>Jesús Pérez</strong> y <strong>Rosavirginia Lujan</strong> estudiantes de ingeniería en computación.</p>
        </div>

        <div class="endscreen-section">
            <h3>API del Met</h3>
            <p>Los datos, imágenes y descripciones técnicas mostradas en esta aplicación se consumen en tiempo real desde <strong>The Metropolitan Museum of Art Open Access API</strong>.</p>
            <p>Este proyecto fue desarrollado con fines estrictamente académicos para la materia de Clientes Web (2026).</p>
        </div>
    `;
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}
