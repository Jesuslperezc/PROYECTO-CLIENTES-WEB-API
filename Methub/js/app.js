document.addEventListener('DOMContentLoaded', () => {
const navbarElement = createNavBar();
document.body.insertBefore(navbarElement, document.body.firstChild);

window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    updateActiveNavLink(hash);
});
})