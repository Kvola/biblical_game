/** @odoo-module **/

async function displayreference() {
    // Récupérer les éléments HTML
    const checkbox = document.getElementById('toggleParagraph');
    const paragraph = document.getElementById('verse_ref');

    // Ajouter un écouteur d'événement sur la case à cocher
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            // Afficher le paragraphe
            paragraph.style.display = 'block';
        } else {
            // Cacher le paragraphe
            paragraph.style.display = 'none';
        }
    });

}

// Assurez-vous que la fonction fetchVerse est accessible globalement
window.displayreference = displayreference;
