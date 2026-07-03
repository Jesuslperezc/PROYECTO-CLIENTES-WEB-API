document.addEventListener('DOMContentLoaded', () => {
    const navbarElement = createNavBar();
    document.body.insertBefore(navbarElement, document.body.firstChild);

    const initialHash = window.location.hash || '#home';
    updateActiveNavLink(initialHash);

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        updateActiveNavLink(hash);
    });
    function navigate(currentHash) {
        updateActiveNavLink(currentHash);
        document.querySelectorAll('.view').forEach(view => view.classList.add('d-none'));
        if (currentHash === '#home' || currentHash === '') {
            document.getElementById('V-01').classList.remove('d-none');
        } 
        else if (currentHash === '#explore') {
            document.getElementById('V-02').classList.remove('d-none');
        } 
        else if (currentHash.startsWith('#detail/')) {
            document.getElementById('V-03').classList.remove('d-none');
        } 
        else if (currentHash === '#departments') {
            document.getElementById('V-04').classList.remove('d-none');
        } 
        else if (currentHash.startsWith('#artist/')) {
            document.getElementById('V-05').classList.remove('d-none');
        } 
        else if (currentHash === '#compare') {
            document.getElementById('V-06').classList.remove('d-none');
        }
    }
})

document.addEventListener('DOMContentLoaded', () => {
document.body.appendChild(createFooter());
})