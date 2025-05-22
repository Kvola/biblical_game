/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

let goodReference = null; // Référence correcte

let timerDuration = 30; // Durée par défaut

let timer; // Timer global
let remainingTime = 30; // Temps initial en secondes

let selectedSettingId = null; // Store the selected game setting

let currentLevel = 0;  // Niveau actuel

let playerScore = 0;   // Score du joueur

const wrongAnswerSound= new Audio('/biblical_game/static/src/sounds/wrong_answer.mp3');
const correctAnswerSound = new Audio('/biblical_game/static/src/sounds/correct.mp3');

let isPaused = false; // État de pause
let isBegun = false; // État de pause

const pauseSound = new Audio('/biblical_game/static/src/sounds/pause.mp3');
const resumeSound = new Audio('/biblical_game/static/src/sounds/resume.mp3');

const sounds = {
    medalBronze: new Audio('/biblical_game/static/src/sounds/bronze_medal.mp3'),
    medalSilver: new Audio('/biblical_game/static/src/sounds/silver_medal.mp3'),
    medalGold: new Audio('/biblical_game/static/src/sounds/gold_medal.mp3'),
    stageCompleted: new Audio('/biblical_game/static/src/sounds/stage_completed.mp3'),
    trophyMusic: new Audio('/biblical_game/static/src/sounds/trophy_music.mp3'),
    gameStart: new Audio('/biblical_game/static/src/sounds/game_start.mp3'),
};

let isGotBronze = false;
let isGotSilver = false;
let isGameStart = false;

// Jouer un son spécifique
function playSound(audio) {
    if (audio) {
        audio.currentTime = 0; // Repartir au début du son
        audio.play().catch((error) => {
            console.error("Erreur lors de la lecture du son :", error);
        });
    }
}
function togglePause() {
    const pauseOverlay = document.querySelector('#pause_overlay');
    const pauseButton = document.querySelector('#pause_button');

    isPaused = !isPaused;

    if (isPaused) {
        pauseOverlay.classList.add('active');
        pauseButton.textContent = "Reprendre le jeu";
        pauseSound.play(); // Lecture du son de pause
        pauseTimer();
    } else {
        pauseOverlay.classList.remove('active');
        pauseButton.textContent = "Mettre en pause";
        resumeSound.play(); // Lecture du son de reprise
        resumeTimer();
    }
}

function updateMedalDisplay(medal) {
    const medalElement = document.getElementById("current_medal");
    medalElement.className = 'badge'; // Reset classes
    if (medal === 'Or 🏅') {
        medalElement.classList.add('medal-gold');
    } else if (medal === 'Argent 🥈') {
        medalElement.classList.add('medal-silver');
    } else if (medal === 'Bronze 🥉') {
        medalElement.classList.add('medal-bronze');
    }
}

function applyMedalEffect() {
    const medalElement = document.getElementById("current_medal");
    medalElement.classList.add("medal-won");
    setTimeout(() => medalElement.classList.remove("medal-won"), 2000);
}

async function checkStageMedal() {
    const feedbackMessage = document.querySelector('#feedback_message');
    const response = await jsonrpc('/get_stage_medal', { level: currentLevel, score: playerScore });

    if (response.error) {
        console.error("Erreur :", response.error);
        return;
    }
    // Mettre à jour la médaille affichée dans l'interface
    const medalElement = document.getElementById("current_medal");
    medalElement.textContent = response.medal;

    updateMedalDisplay();
    applyMedalEffect();

    // Vérifier si la médaille est en or 🏅
    if (response.medal === 'Or 🏅') {
        feedbackMessage.textContent = "🏅 Médaille d'or obtenue !";
        sounds.medalBronze.volume = 1; // 100% du volume
        playSound(sounds.medalGold);
        setTimeout(() => {
            alert("🎉 Médaille d'or obtenue ! Passage à la manche suivante...");
            nextStage();
        }, 500); // Petite pause avant de passer à la manche suivante
    }else if (response.medal === 'Argent 🥈') { 
        sounds.medalBronze.volume = 0.75; // 75% du volume
        if (!isGotSilver){
            feedbackMessage.textContent = "🥈 Médaille d'argent obtenue !";
            playSound(sounds.medalSilver);
            isGotSilver = true;
        }
    } else if (response.medal === 'Bronze 🥉') {
        sounds.medalBronze.volume = 0.5; // 50% du volume
        if (!isGotBronze){
            feedbackMessage.textContent = "🥉 Médaille de bronze obtenue !";
            playSound(sounds.medalBronze);
            isGotBronze = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStageThresholds();
});

async function loadStageThresholds() {
    const bronzeElement = document.querySelector('#bronze_threshold');
    const silverElement = document.querySelector('#silver_threshold');
    const goldElement = document.querySelector('#gold_threshold');

    if (!bronzeElement || !silverElement || !goldElement) {
        console.error("Les éléments pour afficher les seuils sont manquants.");
        return;
    }

    const thresholds = await fetchStageThresholds(currentLevel);

    // Update the UI with the fetched thresholds
    bronzeElement.textContent = thresholds.bronze;
    silverElement.textContent = thresholds.silver;
    goldElement.textContent = thresholds.gold;
}

async function fetchStageThresholds(level) {
    try {
        // Call the backend to fetch thresholds for the given level
        const response = await jsonrpc('/get_stage_thresholds', { level: level });

        if (response.error) {
            console.error("Erreur :", response.error);
            return { bronze: 0, silver: 0, gold: 0 }; // Default values if error
        }

        // Return the thresholds
        return {
            bronze: response.bronze,
            silver: response.silver,
            gold: response.gold
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des seuils :", error);
        return { bronze: 0, silver: 0, gold: 0 }; // Default fallback
    }
}

function showTrophyCelebration() {
    const trophyCelebration = document.querySelector('#trophy_celebration');
    if (trophyCelebration) {
        trophyCelebration.classList.remove('d-none');
        playSound(sounds.trophyMusic);

        // Masquer l'animation après 10 secondes
        setTimeout(() => {
            trophyCelebration.classList.add('d-none');
        }, 10000);
    }
}

function nextStage() {
    if (currentLevel < 7) {
        currentLevel++; // Incrémente la manche
        playerScore = 0; // Réinitialise le score

        playSound(sounds.stageCompleted); // Joue le son de fin de manche

        // Met à jour l'interface utilisateur
        document.querySelector('#current_stage').textContent = currentLevel;
        document.querySelector('#player_score').textContent = playerScore;
        document.querySelector('#current_medal').textContent = "Aucune";

        // Recharger les seuils pour la nouvelle manche
        loadStageThresholds();

        isGotBronze = false;
        isGotSilver = false;

        alert(`Manche ${currentLevel} commencée. Bonne chance !`);
    }else {
        // Fin du jeu après la 7e manche
        // Joueur atteint la fin du jeu
        showTrophyCelebration(); // Jouer la musique du trophée
        alert("🏆 Félicitations ! Vous avez remporté le trophée final !");
    }
}



// Load game settings and populate the dropdown
async function loadSoloGameSettings() {
    const settingsDropdown = document.querySelector('#settings_dropdown');
    const loadGameParams = document.querySelector('#load_game_params');
    const startGameButton = document.querySelector('#start_game_button');
    
    try {
        const settings = await jsonrpc('/get_solo_game_settings', {});
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
                selectedSettingId = selectedSetting.id;
            } else {
                // Réinitialiser si aucun paramètre n'est sélectionné
                timerDuration = 30;
                selectedSettingId = null;
            }
        });
        loadGameParams.style.display = 'none'
        startGameButton.style.display = 'inline'
    } catch (error) {
        console.error("Erreur lors du chargement des paramètres :", error);
    }
    loadStageThresholds();
    // Listen for dropdown changes
    settingsDropdown.addEventListener('change', event => {
        selectedSettingId = event.target.value;
        console.log("Paramètre sélectionné :", selectedSettingId);
    });
}

function startTimer() {
    const timerCount = document.querySelector('#timer_count');
    const timerProgress = document.querySelector('#timer_progress');
    //remainingTime = 30;
    if (!isBegun){
        remainingTime = timerDuration;
        isBegun = true;
    }
    
    timerCount.textContent = remainingTime;

    timer = setInterval(() => {
        if (isPaused) return; // Ne pas réduire le temps si en pause
        remainingTime -= 1;
        timerCount.textContent = remainingTime;

        // Mettre à jour la barre de progression
        const progressPercentage = (remainingTime / timerDuration) * 100;
        timerProgress.style.width = `${progressPercentage}%`;

        button_pause.style.display = 'inline';
        if (remainingTime <= 0) {
            clearInterval(timer); // Arrêter le timer
            autoSelectAnswer(); // Sélectionner automatiquement la réponse
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer); // Arrête la minuterie
}

function resumeTimer() {
    startTimer(); // Reprend la minuterie
}

// Sélectionner automatiquement la bonne réponse
function autoSelectAnswer() {
    const feedbackMessage = document.querySelector('#feedback_message');
    const correctAnswerElement = document.querySelector('#correct_answer');
    const responseOptions = document.querySelectorAll('#response_options button');
    const button_pause = document.querySelector('#button_pause');

    if (isPaused) {
        console.log("Le jeu est en pause. Question suivante bloquée.");
        return;
    }

    // Trouver le bouton correspondant à la bonne réponse
    responseOptions.forEach(button => {
        if (button.textContent === goodReference) {
            button.classList.add('btn-success');
            feedbackMessage.textContent = "Temps écoulé !";
            feedbackMessage.className = 'correct text-center mt-4';
            feedbackMessage.classList.remove('d-none');
            button_pause.style.display = 'none';
            // Affiche la bonne réponse
            correctAnswerElement.textContent = 'La bonne réponse était : ' + goodReference;
            correctAnswerElement.className = "text-primary font-weight-bold text-center mt-2";
            feedbackMessage.classList.remove('d-none');
        } else {
            button.classList.add('btn-secondary'); // Désactiver les mauvaises réponses
        }
        button.disabled = true; // Désactiver tous les boutons
    });

    // Charger une nouvelle question après un délai
    setTimeout(() => {
        loadReferenceQuestion();
    }, 3000);
}

// Charger la question et démarrer le timer
async function loadReferenceQuestion() {
    const verseText = document.querySelector('#verse_text');
    const responseOptions = document.querySelector('#response_options');
    const feedbackMessage = document.querySelector('#feedback_message');
    const correctAnswerElement = document.querySelector('#correct_answer');
    const startGameButton = document.querySelector('#start_game_button');
    const generalParams = document.querySelector('#general_params');
    feedbackMessage.classList.add('d-none'); // Masquer le feedback
    correctAnswerElement.classList.add('d-none'); // Masquer le correctAnswer
    responseOptions.innerHTML = ''; // Réinitialiser les options

    try {
        if (!selectedSettingId) {
            alert("Veuillez sélectionner un paramètre pour commencer le jeu.");
            return;
        }
        const result = await jsonrpc('/get_question_with_setting', { setting_id: selectedSettingId });

        if (result.error) {
            verseText.textContent = result.error;
            return;
        }

        if (!isGameStart){
            playSound(sounds.gameStart); // Jouer le son de démarrage
            isGameStart = true;
        }

        // Afficher le verset
        verseText.textContent = result.verse.text;

        // Enregistrer la bonne réponse
        goodReference = result.good;

        // Mélanger les réponses
        const responses = [
            { text: result.good, isCorrect: true },
            ...result.bad.map(bad => ({ text: bad, isCorrect: false }))
        ];
        shuffleArray(responses);

        // Ajouter les boutons de réponse
        responses.forEach(response => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-primary col-md-3';
            button.textContent = response.text;
            button.onclick = () => {
                clearInterval(timer); // Arrêter le timer à la sélection
                checkAnswer(response.isCorrect, button, feedbackMessage, correctAnswerElement);
            };
            responseOptions.appendChild(button);
        });
        startGameButton.style.display = 'none';
        generalParams.style.display = 'none';
        // Démarrer le timer pour cette question
        isBegun = false;
        startTimer();
    } catch (error) {
        console.error('Erreur lors du chargement de la question :', error);
    }
}

function addPoints(points) {
    playerScore += points; // Ajoute des points au score
    document.querySelector('#player_score').textContent = playerScore;

    // Vérifie automatiquement la médaille après l'ajout des points
    checkStageMedal();
}

// Mettre à jour le score
function updateScore(isCorrect) {
    const scoreValue = document.querySelector('#player_score');
    if (isCorrect) {
        addPoints(10);
        scoreValue.classList.add('increment'); // Ajouter l'animation
        setTimeout(() => scoreValue.classList.remove('increment'), 500);
    } else {
        addPoints(-5);
        scoreValue.classList.add('decrement'); // Ajouter l'animation
        setTimeout(() => scoreValue.classList.remove('decrement'), 500);
    }
}

// Vérifier la réponse de l'utilisateur
function checkAnswer(isCorrect, button, feedbackMessage, correctAnswerElement) {
    // Vérification si les éléments existent
    if (!feedbackMessage) {
        console.error("Les éléments requis (#feedback_message) sont manquants dans le DOM.");
        return;
    }
    if (isPaused) {
        console.log("Le jeu est en pause. Réponse bloquée.");
        return;
    }
    if (isCorrect) {
        correctAnswerSound.play();
        feedbackMessage.textContent = "Bonne réponse ! 🎉";
        feedbackMessage.className = 'correct text-center mt-4';
        button.classList.add('btn-success');
        correctAnswerElement.classList.add('d-none'); // Masquer le correctAnswer
        updateScore(true); // Incrémenter le score
    } else {
        wrongAnswerSound.play();
        feedbackMessage.textContent = "Mauvaise réponse. 😞 Essayez encore.";
        feedbackMessage.className = 'incorrect text-center mt-4';
        button.classList.add('btn-danger');
        //Bonne réponse
        correctAnswerElement.textContent = 'La bonne réponse était : ' + goodReference;
        correctAnswerElement.className = "text-primary font-weight-bold text-center mt-2";
        correctAnswerElement.classList.remove('d-none'); // Afficher la bonne réponse
        updateScore(false); // Décrémenter le score
    }
    
    feedbackMessage.classList.remove('d-none'); // Afficher le feedback

    // Désactiver tous les boutons après la sélection
    document.querySelectorAll('#response_options button').forEach(btn => {
        btn.disabled = true;
    });

    // Charger une nouvelle question après un délai
    setTimeout(() => {
        loadReferenceQuestion();
    }, 5000);
}

// Mélanger un tableau
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Charger la première question dès que la page est prête
document.addEventListener('DOMContentLoaded', async function () {
    await loadReferenceQuestion();
});

// Load settings on page load
document.addEventListener('DOMContentLoaded', loadSoloGameSettings);

document.addEventListener('DOMContentLoaded', () => {
    loadStageThresholds();
});

// Rendre loadReferenceQuestion globalement accessible
window.loadSoloGameSettings = loadSoloGameSettings;
window.loadReferenceQuestion = loadReferenceQuestion;
window.togglePause = togglePause;