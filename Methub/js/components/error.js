class ErrorState extends HTMLElement {
    constructor() {
        super();
        this.mensajeError = 'Hubo un problema al conectar con el Met.';
        this.callbackReintento = null;
    }

    render(mensaje, callbackReintento) {
        if (mensaje) this.mensajeError = mensaje;
        if (callbackReintento) this.callbackReintento = callbackReintento;
        
        if (this.isConnected) {
            this.connectedCallback();
        }
    }

    connectedCallback() {
        this.innerHTML = ''; 

        const container = document.createElement('div');
        container.className = 'error-container';

        const icon = document.createElement('div');
        icon.className = 'error-icon';
        icon.textContent = '⚠️';

        const text = document.createElement('p');
        text.className = 'error-text';
        text.textContent = this.mensajeError;

        container.appendChild(icon);
        container.appendChild(text);

        if (this.callbackReintento && typeof this.callbackReintento === 'function') {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn-retry';
            retryBtn.textContent = 'Reintentar';
            retryBtn.addEventListener('click', () => {
                this.callbackReintento();
            });
            container.appendChild(retryBtn);
        }

        this.appendChild(container);
    }
}

if (!customElements.get('error-state')) {
    customElements.define('error-state', ErrorState);
}
