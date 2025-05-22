/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

let timer; // Timer global
let timerDuration = 30; // Durée par défaut
let selectedBooks = []; // Liste des livres sélectionnés par défaut
let selectedSettingId = null; // Paramètre sélectionné

// Charger les paramètres disponibles
async function loadGameSettings() {
    const settingsDropdown = document.querySelector('#game_settings');
    
    try {
        const settings = await jsonrpc('/get_game_settings', {});
        settings.forEach(setting => {
            if (settingsDropdown.length -1 < settings.length)
            {
                const option = document.createElement('option');
                option.value = setting.id;
                option.textContent = `${setting.name} (Durée: ${setting.timer_duration}s)`;
                settingsDropdown.appendChild(option);
            }
            
        });

        // Gérer la sélection du paramètre
        settingsDropdown.addEventListener('change', (event) => {
            const selectedOption = event.target.value;
            if (selectedOption) {
                const selectedSetting = settings.find(s => s.id == selectedOption);
                timerDuration = selectedSetting.timer_duration;
                selectedBooks = selectedSetting.book_ids;
                selectedSettingId = selectedSetting.id;
            } else {
                // Réinitialiser si aucun paramètre n'est sélectionné
                timerDuration = 30;
                selectedBooks = [];
                selectedSettingId = null;
            }
        });
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
    }
}

// Fonction pour récupérer un verset
async function fetchVerse() {
    const spinner = document.querySelector('#loading_spinner');
    const buttonText = document.querySelector('#play_button');
    const verseText = document.querySelector('#verse_text');
    const verseRef = document.querySelector('#verse_ref');
    const timerCount = document.querySelector('#timer_count');
    const timeUpMessage = document.querySelector('#time_up_message');

    if (!verseRef) {
        console.error("Élément HTML manquant : #verse_ref");
        return;
    }
    if (!spinner) {
        console.error("Élément HTML manquant : #spinner");
        return;
    }
    if (!buttonText) {
        console.error("Élément HTML manquant : #buttonText");
        return;
    }
    if (!verseText) {
        console.error("Élément HTML manquant : #verseText");
        return;
    }
    if (!timerCount) {
        console.error("Élément HTML manquant : #timerCount");
        return;
    }
    if (!timeUpMessage) {
        console.error("Élément HTML manquant : #timeUpMessage");
        return;
    }

    // Masquer le message de temps écoulé
    timeUpMessage.classList.add('d-none');

    spinner.classList.remove('d-none');
    buttonText.style.display = 'none';

    try {
        const result = await jsonrpc('/play_biblical_game', { params: { setting : selectedSettingId } });

        if (result) {
            verseText.classList.remove('fade-in');
            verseRef.classList.remove('fade-in');

            setTimeout(() => {
                verseText.textContent = result.text || 'Aucun verset disponible.';
                verseRef.textContent = result.reference || '';

                verseText.classList.add('fade-in');
                verseRef.classList.add('fade-in');

                spinner.classList.add('d-none');
                buttonText.style.display = 'inline';
            }, 300);
        } else {
            throw new Error('No verse data returned');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du verset:', error);
        alert('Erreur lors de la récupération du verset.');
        spinner.classList.add('d-none');
        buttonText.style.display = 'inline';
    }

    // Réinitialiser le compteur
    resetTimer(timerCount, timeUpMessage);
}

// Fonction pour réinitialiser le compteur
function resetTimer(timerCount, timeUpMessage) {
    if (timer) {
        clearInterval(timer);
    }

    let seconds = timerDuration; // Utiliser la durée configurée
    timerCount.textContent = seconds;

    timer = setInterval(() => {
        seconds -= 1;
        timerCount.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(timer);
            timeUpMessage.classList.remove('d-none'); // Afficher le message de temps écoulé
        }
    }, 1000);
}

// Initialiser les paramètres dès que la page est chargée
document.addEventListener('DOMContentLoaded', async function () {
    await loadGameSettings(); // Charger les paramètres disponibles
});


// Rendre fetchVerse globalement accessible
window.loadGameSettings = loadGameSettings;
window.fetchVerse = fetchVerse;