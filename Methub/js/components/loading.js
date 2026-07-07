class LoadingState extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = ''; 

        const container = document.createElement('div');
        container.className = 'loading-container';
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        const text = document.createElement('p');
        text.className = 'loading-text';
        text.textContent = 'Buscando en la colección del Met...';

        container.appendChild(spinner);
        container.appendChild(text);
        this.appendChild(container);
    }
}
if (!customElements.get('loading-state')) {
    customElements.define('loading-state', LoadingState);
}
