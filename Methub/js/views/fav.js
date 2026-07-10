
const FAVORITOS_KEY = 'methub_obras_favoritas';

// Lee la lista desde localStorage
function obtenerFavoritos() {
    const favoritos = localStorage.getItem(FAVORITOS_KEY);
    return favoritos ? JSON.parse(favoritos) : [];
}

// Guarda un ID nuevo si no está ya registrado
function agregarAFavoritos(id) {
    let favoritos = obtenerFavoritos();
    const idStr = String(id); 
    
    if (!favoritos.includes(idStr)) {
        favoritos.push(idStr);
        localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
        return true;
    }
    return false;
}

// Elimina un ID existente
function eliminarDeFavoritos(id) {
    let favoritos = obtenerFavoritos();
    const idStr = String(id);
    
    favoritos = favoritos.filter(favId => favId !== idStr);
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
}

// Comprueba si un ID ya está en la lista (para pintar la estrella activa/inactiva)
function esFavorito(id) {
    const favoritos = obtenerFavoritos();
    return favoritos.includes(String(id));
}