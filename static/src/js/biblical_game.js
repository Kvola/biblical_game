/** @odoo-module **/

import { jsonrpc } from "@web/core/network/rpc_service";

/**
 * Configuration des constantes du jeu
 */
const GAME_CONFIG = {
    MAX_LEVELS: 7,
    DEFAULT_TIMER: 30,
    POINTS: {
        CORRECT: 10,
        INCORRECT: -5,
        TIMEOUT: -3
    },
    DELAYS: {
        MEDAL_ANIMATION: 2000,
        STAGE_TRANSITION: 1500,
        ANSWER_FEEDBACK: 3000,
        TROPHY_CELEBRATION: 10000
    }
};

/**
 * Configuration des sons
 */
const SOUNDS_CONFIG = {
    wrongAnswer: '/biblical_game/static/src/sounds/wrong_answer.mp3',
    correctAnswer: '/biblical_game/static/src/sounds/correct.mp3',
    pause: '/biblical_game/static/src/sounds/pause.mp3',
    resume: '/biblical_game/static/src/sounds/resume.mp3',
    medalBronze: '/biblical_game/static/src/sounds/bronze_medal.mp3',
    medalSilver: '/biblical_game/static/src/sounds/silver_medal.mp3',
    medalGold: '/biblical_game/static/src/sounds/gold_medal.mp3',
    stageCompleted: '/biblical_game/static/src/sounds/stage_completed.mp3',
    trophyMusic: '/biblical_game/static/src/sounds/trophy_music.mp3',
    gameStart: '/biblical_game/static/src/sounds/game_start.mp3',
};

/**
 * Configuration des médailles avec textes statiques
 */
const MEDAL_CONFIG = {
    gold: {
        classes: 'medal-gold text-white',
        content: 'Or <span class="ml-1">🏅</span>',
        sound: 'medalGold',
        text: 'Médaille d\'or obtenue !'
    },
    silver: {
        classes: 'medal-silver text-dark',
        content: 'Argent <span class="ml-1">🥈</span>',
        sound: 'medalSilver',
        text: 'Médaille d\'argent obtenue !'
    },
    bronze: {
        classes: 'medal-bronze text-white',
        content: 'Bronze <span class="ml-1">🥉</span>',
        sound: 'medalBronze',
        text: 'Médaille de bronze obtenue !'
    },
    none: {
        classes: 'badge-secondary',
        content: 'En cours <span class="ml-1">⌛</span>'
    }
};

/**
 * Messages statiques pour éviter les problèmes de traduction
 */
const MESSAGES = {
    // Messages d'interface
    selectSetting: "-- Sélectionnez un paramètre --",
    loading: "Chargement...",
    loadingSettings: "⏳ Chargement des paramètres...",
    reload: "Recharger",
    retry: "Réessayer",
    
    // Messages de jeu
    correctAnswer: "✅ Bonne réponse ! 🎉",
    wrongAnswer: "❌ Mauvaise réponse. 😞",
    timeUp: "⏰ Temps écoulé !",
    correctAnswerWas: "La bonne réponse était : ",
    score: "Score",
    points: "points",
    
    // Messages de médaille
    goldMedal: "🏅 Médaille d'or obtenue !",
    silverMedal: "🥈 Médaille d'argent obtenue !",
    bronzeMedal: "🥉 Médaille de bronze obtenue !",
    nextThreshold: "Prochain seuil",
    forGold: "points pour l'or",
    forSilver: "points pour l'argent",
    maxLevel: "Niveau maximum atteint !",
    
    // Messages d'erreur
    selectSettings: "Veuillez sélectionner des paramètres de jeu",
    errorStarting: "Erreur lors du démarrage du jeu",
    errorLoading: "Erreur lors du chargement",
    loadingError: "Erreur de chargement",
    serverError: "Erreur de connexion au serveur",
    initError: "Erreur lors de l'initialisation du jeu. Veuillez recharger la page.",
    unexpectedError: "Une erreur inattendue s'est produite.",
    
    // Messages de statut
    gameReady: "Jeu prêt !",
    soundsEnabled: "Sons activés",
    soundsDisabled: "Sons désactivés",
    
    // Messages de boutons
    pauseGame: "Mettre en pause",
    resumeGame: "Reprendre le jeu",
    reloadPage: "Recharger la page",
    
    // Messages d'initialisation
    initializationError: "Erreur d'initialisation",
    gameInitError: "Le jeu biblique n'a pas pu être initialisé. Veuillez recharger la page."
};

/**
 * Classe utilitaire pour la gestion DOM
 */
class DOMHelper {
    /**
     * Trouver un élément avec gestion d'erreur
     */
    static findElement(selector, required = false) {
        const element = document.querySelector(selector);
        if (required && !element) {
            console.warn(`Required element not found: ${selector}`);
        }
        return element;
    }

    /**
     * Mettre à jour le contenu textuel d'un élément
     */
    static updateText(selector, content) {
        const element = this.findElement(selector);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Mettre à jour le contenu HTML d'un élément
     */
    static updateHTML(selector, content) {
        const element = this.findElement(selector);
        if (element) {
            element.innerHTML = content;
        }
    }

    /**
     * Basculer une classe CSS
     */
    static toggleClass(selector, className, force = null) {
        const element = this.findElement(selector);
        if (element) {
            if (force !== null) {
                element.classList.toggle(className, force);
            } else {
                element.classList.toggle(className);
            }
        }
    }

    /**
     * Ajouter une classe avec suppression automatique
     */
    static addTemporaryClass(selector, className, duration = 1000) {
        const element = this.findElement(selector);
        if (element) {
            element.classList.add(className);
            setTimeout(() => element.classList.remove(className), duration);
        }
    }
}

/**
 * Classe pour la gestion des sons
 */
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.initSounds();
    }

    /**
     * Initialiser les sons
     */
    initSounds() {
        Object.entries(SOUNDS_CONFIG).forEach(([key, path]) => {
            try {
                const audio = new Audio(path);
                audio.preload = 'auto';
                audio.volume = 0.7;
                this.sounds[key] = audio;
            } catch (error) {
                console.warn(`Failed to load sound ${key}:`, error);
                this.sounds[key] = null;
            }
        });
    }

    /**
     * Jouer un son
     */
    play(soundKey) {
        if (!this.enabled) return;
        
        const audio = this.sounds[soundKey];
        if (!audio) return;
        
        try {
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Cannot play sound ${soundKey}:`, error);
                });
            }
        } catch (error) {
            console.warn(`Audio error ${soundKey}:`, error);
        }
    }

    /**
     * Activer/désactiver les sons
     */
    toggle() {
        this.enabled = !this.enabled;
    }

    /**
     * Définir le volume global
     */
    setVolume(volume) {
        Object.values(this.sounds).forEach(audio => {
            if (audio) audio.volume = Math.max(0, Math.min(1, volume));
        });
    }
}

/**
 * Classe pour la gestion du timer
 */
class GameTimer {
    constructor(duration = GAME_CONFIG.DEFAULT_TIMER) {
        this.duration = duration;
        this.remaining = duration;
        this.interval = null;
        this.isPaused = false;
        this.callbacks = {
            onTick: null,
            onTimeout: null
        };
    }

    /**
     * Démarrer le timer
     */
    start() {
        this.stop();
        this.remaining = this.duration;
        this.isPaused = false;
        
        this.updateDisplay();
        
        this.interval = setInterval(() => {
            if (this.isPaused) return;
            
            this.remaining--;
            this.updateDisplay();
            
            if (this.callbacks.onTick) {
                this.callbacks.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.callbacks.onTimeout) {
                    this.callbacks.onTimeout();
                }
            }
        }, 1000);
    }

    /**
     * Arrêter le timer
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Mettre en pause/reprendre
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return !this.isPaused;
    }

    /**
     * Mettre à jour l'affichage
     */
    updateDisplay() {
        const timerCount = DOMHelper.findElement('#timer_count');
        const timerProgress = DOMHelper.findElement('#timer_progress');
        
        if (timerCount) {
            timerCount.textContent = this.remaining;
        }
        
        if (timerProgress) {
            const progressPercentage = Math.max(0, (this.remaining / this.duration) * 100);
            timerProgress.style.width = `${progressPercentage}%`;
        }
    }

    /**
     * Définir la durée
     */
    setDuration(duration) {
        this.duration = duration;
        this.remaining = duration;
    }
}

/**
 * Classe principale pour gérer le jeu biblique
 */
class BiblicalGame {
    constructor() {
        this.initializeState();
        this.soundManager = new SoundManager();
        this.timer = new GameTimer();
        this.setupTimerCallbacks();
        this.bindMethods();
    }

    /**
     * Initialiser l'état du jeu
     */
    initializeState() {
        this.goodReference = null;
        this.selectedSettingId = null;
        this.currentLevel = 0;
        this.playerScore = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentSessionId = null;
        this.isPaused = false;
        this.isGameActive = false;
        this.settingsLoaded = false; // Nouveau flag pour suivre le chargement des paramètres
        
        this.medalStatus = {
            bronze: false,
            silver: false,
            gold: false
        };
    }

    /**
     * Configurer les callbacks du timer
     */
    setupTimerCallbacks() {
        this.timer.callbacks.onTimeout = () => this.handleTimeout();
    }

    /**
     * Binding des méthodes
     */
    bindMethods() {
        this.togglePause = this.togglePause.bind(this);
        this.startGameSession = this.startGameSession.bind(this);
        this.loadGameSettings = this.loadGameSettings.bind(this);
        this.loadReferenceQuestion = this.loadReferenceQuestion.bind(this);
        this.checkAnswer = this.checkAnswer.bind(this);
        this.handleReloadSettings = this.handleReloadSettings.bind(this);
    }

    // ==================== GESTION DES ERREURS ET DIAGNOSTICS ====================

    /**
     * Diagnostic de chargement des éléments DOM
     */
    diagnoseLoadingIssues() {
        console.group('=== GAME INITIALIZATION DIAGNOSTIC ===');
        
        const criticalElements = [
            'settings_dropdown',
            'load_game_params', 
            'start_game_button',
            'pause_button',
            'timer_count',
            'player_score'
        ];
        
        const results = criticalElements.map(id => {
            const element = document.querySelector(`#${id}`);
            const status = element ? '✅ Found' : '❌ MISSING';
            console.log(`${id}: ${status}`);
            return { id, found: !!element };
        });
        
        console.log('jsonrpc available:', typeof jsonrpc !== 'undefined');
        console.groupEnd();
        
        // Test de connectivité amélioré avec retry
        this.testConnectivityWithRetry();
        
        return results.every(r => r.found);
    }

    /**
     * Test de connectivité avec retry automatique
     */
    async testConnectivityWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Testing server connectivity (attempt ${attempt}/${maxRetries})...`);
                const response = await jsonrpc('/get_solo_game_settings', {});
                console.log('✅ Connectivity OK:', response);
                return true;
            } catch (error) {
                console.warn(`❌ Connectivity attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    console.error('❌ All connectivity attempts failed');
                    this.showAlert(MESSAGES.serverError, "danger");
                    return false;
                } else {
                    // Attendre avant le prochain essai
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        return false;
    }

    /**
     * Test de connectivité avec le serveur
     */
    async testConnectivity() {
        try {
            console.log('🔄 Testing server connectivity...');
            const response = await jsonrpc('/get_solo_game_settings', {});
            console.log('✅ Connectivity OK:', response);
            return true;
        } catch (error) {
            console.error('❌ Connectivity error:', error);
            this.showAlert(MESSAGES.serverError, "danger");
            return false;
        }
    }

    /**
     * Afficher une alerte utilisateur
     */
    showAlert(message, type = "info", duration = 5000) {
        // Supprimer les alertes existantes
        document.querySelectorAll('.biblical-game-alert').forEach(alert => {
            alert.remove();
        });

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed biblical-game-alert`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
    }

    // ==================== GESTION DU JEU ====================

    /**
     * Basculer entre pause et reprise
     */
    togglePause() {
        if (!this.isGameActive) return;
        
        const pauseOverlay = DOMHelper.findElement('#pause_overlay');
        const pauseButton = DOMHelper.findElement('#pause_button');

        if (!pauseOverlay || !pauseButton) {
            console.warn('Pause elements not found');
            return;
        }

        const isResuming = this.timer.togglePause();
        this.isPaused = !isResuming;

        if (this.isPaused) {
            pauseOverlay.classList.remove('d-none');
            pauseButton.innerHTML = '<i class="fa fa-play"></i> ' + MESSAGES.resumeGame;
            this.soundManager.play('pause');
        } else {
            pauseOverlay.classList.add('d-none');
            pauseButton.innerHTML = '<i class="fa fa-pause"></i> ' + MESSAGES.pauseGame;
            this.soundManager.play('resume');
        }
    }

    /**
     * Démarrer une nouvelle session de jeu
     */
    async startGameSession() {
        try {
            if (!this.selectedSettingId) {
                this.showAlert(MESSAGES.selectSettings, "warning");
                return;
            }
            
            this.resetGameForNewSession();
            
            const response = await jsonrpc('/create_game_session', { 
                setting_id: this.selectedSettingId 
            });
            
            if (!response?.success) {
                throw new Error(response?.error || "Cannot create session");
            }

            this.currentSessionId = response.data.session_id;
            this.soundManager.play('gameStart');
            
            await this.prepareGameInterface();
            
        } catch (error) {
            console.error("Error starting game session:", error);
            this.showAlert(MESSAGES.errorStarting, "danger");
        }
    }

    /**
     * Réinitialiser le jeu pour une nouvelle session
     */
    resetGameForNewSession() {
        this.currentLevel = 0;
        this.playerScore = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.medalStatus = { bronze: false, silver: false, gold: false };
        this.isGameActive = true;
        this.isPaused = false;
    }

    /**
     * Préparer l'interface de jeu
     */
    async prepareGameInterface() {
        this.updateGameDisplay();
        await this.loadStageThresholds();
        
        DOMHelper.toggleClass('#general_params', 'd-none', true);
        
        setTimeout(() => {
            this.loadReferenceQuestion();
        }, 1000);
    }

    /**
     * Terminer la session de jeu
     */
    async endGameSession() {
        if (!this.currentSessionId) return;
        
        try {
            const response = await jsonrpc('/end_game_session', {
                session_id: this.currentSessionId,
                final_score: this.playerScore,
                questions_answered: this.questionsAnswered,
                correct_answers: this.correctAnswers,
                level_reached: this.currentLevel + 1
            });
            
            if (!response?.success) {
                console.error("Error ending session:", response?.error || "Invalid response");
            }
        } catch (error) {
            console.error("Error ending session:", error);
        } finally {
            this.resetSessionState();
        }
    }

    /**
     * Réinitialiser l'état de la session
     */
    resetSessionState() {
        this.currentSessionId = null;
        this.isGameActive = false;
        this.timer.stop();
        
        DOMHelper.toggleClass('#general_params', 'd-none', false);
    }

    // ==================== GESTION DES NIVEAUX ET MÉDAILLES ====================

    /**
     * Mettre à jour l'affichage de la médaille
     */
    updateMedalDisplay(medal) {
        const medalElement = DOMHelper.findElement("#current_medal");
        if (!medalElement) return;
        
        medalElement.className = 'badge badge-medal p-2 font-weight-bold';
        
        const config = MEDAL_CONFIG[medal] || MEDAL_CONFIG.none;
        medalElement.classList.add(...config.classes.split(' '));
        medalElement.innerHTML = config.content;
    }

    /**
     * Appliquer l'effet visuel de médaille gagnée
     */
    applyMedalEffect() {
        DOMHelper.addTemporaryClass("#current_medal", "medal-won", GAME_CONFIG.DELAYS.MEDAL_ANIMATION);
    }

    /**
     * Vérifier la médaille obtenue pour le niveau actuel
     */
    async checkStageMedal() {
        try {
            const response = await jsonrpc('/get_stage_medal', { 
                level: this.currentLevel, 
                score: this.playerScore 
            });

            if (!response?.success) {
                console.error("Medal error:", response?.error || "Invalid response");
                return;
            }

            const { medal, progress_percentage, next_threshold, bronze_threshold, silver_threshold, gold_threshold } = response.data;
            
            this.updateMedalDisplay(medal);
            this.applyMedalEffect();
            this.updateProgressBar(progress_percentage);
            this.updateNextThresholdInfo(next_threshold);
            this.updateThresholds({ bronze_threshold, silver_threshold, gold_threshold, next_threshold });
            this.handleMedalMessages(medal, next_threshold);

        } catch (error) {
            console.error("Error checking stage medal:", error);
        }
    }

    /**
     * Charger les seuils du niveau actuel
     */
    async loadStageThresholds() {
        try {
            const response = await jsonrpc('/get_stage_thresholds', { level: this.currentLevel });
            
            if (!response?.success || !response.data) {
                console.error("Error loading thresholds");
                return;
            }

            const { bronze_threshold, silver_threshold, gold_threshold, description, level } = response.data;

            this.updateThresholds({ bronze_threshold, silver_threshold, gold_threshold });
            this.updateStageInfo(description, level);
            this.resetStageDisplay();

        } catch (error) {
            console.error("Error loading thresholds:", error);
        }
    }

    /**
     * Mettre à jour la barre de progression
     */
    updateProgressBar(percentage) {
        const progressBar = DOMHelper.findElement('#medal_progress_bar');
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    /**
     * Mettre à jour l'information du prochain seuil
     */
    updateNextThresholdInfo(nextThreshold) {
        const message = nextThreshold 
            ? `${MESSAGES.nextThreshold}: ${nextThreshold} ${MESSAGES.points}`
            : MESSAGES.maxLevel;
        DOMHelper.updateText('#next_threshold_info', message);
    }

    /**
     * Mettre à jour les seuils affichés
     */
    updateThresholds({ bronze_threshold, silver_threshold, gold_threshold, next_threshold }) {
        DOMHelper.updateText('#bronze_threshold', next_threshold || bronze_threshold);
        DOMHelper.updateText('#silver_threshold', silver_threshold);
        DOMHelper.updateText('#gold_threshold', gold_threshold);
    }

    /**
     * Mettre à jour les informations du niveau
     */
    updateStageInfo(description, level) {
        if (description) {
            DOMHelper.updateText('#stage_description', description);
            DOMHelper.toggleClass('#stage_description_card', 'd-none', false);
        } else {
            DOMHelper.toggleClass('#stage_description_card', 'd-none', true);
        }
        
        DOMHelper.updateText('#current_stage', level + 1);
    }

    /**
     * Réinitialiser l'affichage du niveau
     */
    resetStageDisplay() {
        this.updateProgressBar(0);
        this.updateNextThresholdInfo(20);
        this.updateMedalDisplay('none');
    }

    /**
     * Gérer les messages d'obtention de médaille
     */
    handleMedalMessages(medal, nextThreshold) {
        if (medal === 'none' || this.medalStatus[medal]) return;

        const feedbackMessage = DOMHelper.findElement('#feedback_message');
        if (!feedbackMessage) return;

        const medalMessages = {
            gold: {
                html: `<div class="alert alert-success text-center">
                    <h4>🏅 ${MESSAGES.goldMedal}</h4>
                    <p>${MESSAGES.score}: ${this.playerScore} ${MESSAGES.points}</p>
                </div>`,
                action: () => setTimeout(() => this.nextStage(), GAME_CONFIG.DELAYS.MEDAL_ANIMATION)
            },
            silver: {
                html: `<div class="alert alert-info text-center">
                    <h4>🥈 ${MESSAGES.silverMedal}</h4>
                    <p>${MESSAGES.score}: ${this.playerScore} ${MESSAGES.points}</p>
                    <p>${MESSAGES.nextThreshold}: ${nextThreshold} ${MESSAGES.forGold}</p>
                </div>`
            },
            bronze: {
                html: `<div class="alert alert-warning text-center">
                    <h4>🥉 ${MESSAGES.bronzeMedal}</h4>
                    <p>${MESSAGES.score}: ${this.playerScore} ${MESSAGES.points}</p>
                    <p>${MESSAGES.nextThreshold}: ${nextThreshold} ${MESSAGES.forSilver}</p>
                </div>`
            }
        };

        const config = medalMessages[medal];
        if (config) {
            feedbackMessage.innerHTML = config.html;
            this.soundManager.play(MEDAL_CONFIG[medal].sound);
            this.medalStatus[medal] = true;
            
            if (config.action) config.action();
        }
    }

    /**
     * Passer au niveau suivant
     */
    async nextStage() {
        if (this.currentLevel < GAME_CONFIG.MAX_LEVELS - 1) {
            this.currentLevel++;
            this.resetGameStats();
            await this.loadStageThresholds();
            this.soundManager.play('stageCompleted');
            
            setTimeout(() => {
                this.loadReferenceQuestion();
            }, GAME_CONFIG.DELAYS.STAGE_TRANSITION);
        } else {
            await this.endGame();
        }
    }

    /**
     * Réinitialiser les statistiques du jeu
     */
    resetGameStats() {
        this.playerScore = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.medalStatus = { bronze: false, silver: false, gold: false };
        
        this.updateGameDisplay();
    }

    /**
     * Terminer le jeu
     */
    async endGame() {
        this.isGameActive = false;
        this.showTrophyCelebration();
        await this.endGameSession();
    }

    /**
     * Afficher la célébration du trophée
     */
    showTrophyCelebration() {
        const trophyCelebration = DOMHelper.findElement('#trophy_celebration');
        if (trophyCelebration) {
            trophyCelebration.classList.remove('d-none');
            this.soundManager.play('trophyMusic');
            setTimeout(() => {
                trophyCelebration.classList.add('d-none');
            }, GAME_CONFIG.DELAYS.TROPHY_CELEBRATION);
        }
    }

    // ==================== GESTION DES QUESTIONS ====================

    /**
     * Charger une nouvelle question
     */
    async loadReferenceQuestion() {
        if (!this.isGameActive) return;
        
        this.prepareQuestionInterface();
        this.timer.stop();

        try {
            if (!this.currentSessionId) {
                await this.startGameSession();
                return;
            }

            const result = await jsonrpc('/get_question_with_setting', { 
                setting_id: this.selectedSettingId 
            });

            if (result?.success && result.data) {
                this.displayQuestion(result.data);
                this.timer.start();
            } else {
                this.displayError(result?.error || MESSAGES.errorLoading);
            }

        } catch (error) {
            console.error('Question loading error:', error);
            this.displayError(MESSAGES.errorLoading);
        }
    }

    /**
     * Préparer l'interface pour une nouvelle question
     */
    prepareQuestionInterface() {
        DOMHelper.toggleClass('#feedback_message', 'd-none', true);
        DOMHelper.toggleClass('#correct_answer', 'd-none', true);
        
        const responseOptions = DOMHelper.findElement('#response_options');
        if (responseOptions) {
            responseOptions.innerHTML = '';
        }
    }

    /**
     * Afficher une question
     */
    displayQuestion(data) {
        DOMHelper.updateHTML('#verse_text', `<p class="mb-0">${data.verse_text}</p>`);
        
        this.goodReference = data.correct_answer;

        const responseOptions = DOMHelper.findElement('#response_options');
        if (responseOptions && data.options) {
            data.options.forEach(option => {
                const button = this.createAnswerButton(option);
                responseOptions.appendChild(button);
            });
        }
    }

    /**
     * Créer un bouton de réponse
     */
    createAnswerButton(option) {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary col-md-5 m-1';
        button.textContent = option;
        button.onclick = () => this.checkAnswer(option === this.goodReference, button);
        return button;
    }

    /**
     * Afficher une erreur
     */
    displayError(errorMessage) {
        DOMHelper.updateHTML('#verse_text', `<p class="mb-0 text-danger">${errorMessage}</p>`);
    }

    /**
     * Vérifier la réponse
     */
    checkAnswer(isCorrect, button) {
        if (this.isPaused || !this.isGameActive) return;
        
        this.timer.stop();
        this.updateQuestionStats(isCorrect);

        if (isCorrect) {
            this.handleCorrectAnswer(button);
        } else {
            this.handleIncorrectAnswer(button);
        }
        
        this.disableAllAnswerButtons();

        setTimeout(() => {
            this.loadReferenceQuestion();
        }, GAME_CONFIG.DELAYS.ANSWER_FEEDBACK);
    }

    /**
     * Gérer une réponse correcte
     */
    handleCorrectAnswer(button) {
        this.soundManager.play('correctAnswer');
        
        const feedbackMessage = DOMHelper.findElement('#feedback_message');
        if (feedbackMessage) {
            feedbackMessage.textContent = MESSAGES.correctAnswer;
            feedbackMessage.className = 'alert alert-success text-center mt-4';
            feedbackMessage.classList.remove('d-none');
        }
        
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-success');
        this.addPoints(GAME_CONFIG.POINTS.CORRECT);
    }

    /**
     * Gérer une réponse incorrecte
     */
    handleIncorrectAnswer(button) {
        this.soundManager.play('wrongAnswer');
        
        const feedbackMessage = DOMHelper.findElement('#feedback_message');
        const correctAnswerElement = DOMHelper.findElement('#correct_answer');
        
        if (feedbackMessage) {
            feedbackMessage.textContent = MESSAGES.wrongAnswer;
            feedbackMessage.className = 'alert alert-danger text-center mt-4';
            feedbackMessage.classList.remove('d-none');
        }
        
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-danger');
        
        if (correctAnswerElement) {
            correctAnswerElement.textContent = MESSAGES.correctAnswerWas + this.goodReference;
            correctAnswerElement.className = "alert alert-info text-center mt-2";
            correctAnswerElement.classList.remove('d-none');
        }
        
        this.addPoints(GAME_CONFIG.POINTS.INCORRECT);
        this.highlightCorrectAnswer();
    }

    /**
     * Gérer le timeout
     */
    handleTimeout() {
        if (this.isPaused || !this.isGameActive) return;

        const responseOptions = document.querySelectorAll('#response_options button');
        
        responseOptions.forEach(button => {
            button.disabled = true;
            if (button.textContent.trim() === this.goodReference) {
                button.classList.add('btn-success');
            } else {
                button.classList.add('btn-secondary');
            }
        });

        this.showTimeoutFeedback();
        this.updateQuestionStats(false);
        this.addPoints(GAME_CONFIG.POINTS.TIMEOUT);
        
        setTimeout(() => {
            this.loadReferenceQuestion();
        }, GAME_CONFIG.DELAYS.ANSWER_FEEDBACK);
    }

    /**
     * Afficher le feedback de timeout
     */
    showTimeoutFeedback() {
        const feedbackMessage = DOMHelper.findElement('#feedback_message');
        const correctAnswerElement = DOMHelper.findElement('#correct_answer');
        
        if (feedbackMessage) {
            feedbackMessage.textContent = MESSAGES.timeUp;
            feedbackMessage.className = 'alert alert-warning text-center mt-4';
            feedbackMessage.classList.remove('d-none');
        }
        
        if (correctAnswerElement) {
            correctAnswerElement.textContent = MESSAGES.correctAnswerWas + this.goodReference;
            correctAnswerElement.className = "alert alert-info text-center mt-2";
            correctAnswerElement.classList.remove('d-none');
        }
    }

    /**
     * Mettre en évidence la bonne réponse
     */
    highlightCorrectAnswer() {
        document.querySelectorAll('#response_options button').forEach(btn => {
            if (btn.textContent.trim() === this.goodReference) {
                btn.classList.add('btn-success');
            }
        });
    }

    /**
     * Désactiver tous les boutons de réponse
     */
    disableAllAnswerButtons() {
        document.querySelectorAll('#response_options button').forEach(btn => {
            btn.disabled = true;
        });
    }

    // ==================== GESTION DU SCORE ====================

    /**
     * Ajouter des points au score
     */
    addPoints(points) {
        this.playerScore = Math.max(0, this.playerScore + points);
        const scoreElement = DOMHelper.findElement('#player_score');
        
        if (scoreElement) {
            scoreElement.textContent = this.playerScore;
            
            if (points > 0) {
                DOMHelper.addTemporaryClass('#player_score', 'text-success', 1000);
            } else if (points < 0) {
                DOMHelper.addTemporaryClass('#player_score', 'text-danger', 1000);
            }
        }
        
        this.checkStageMedal();
    }

    /**
     * Mettre à jour les statistiques de questions
     */
    updateQuestionStats(isCorrect) {
        this.questionsAnswered++;
        if (isCorrect) this.correctAnswers++;
        
        DOMHelper.updateText('#questions_answered', this.questionsAnswered);
        DOMHelper.updateText('#correct_answers', this.correctAnswers);
    }

    /**
     * Mettre à jour l'affichage du jeu
     */
    updateGameDisplay() {
        DOMHelper.updateText('#current_stage', this.currentLevel + 1);
        DOMHelper.updateText('#player_score', this.playerScore);
        DOMHelper.updateText('#questions_answered', this.questionsAnswered);
        DOMHelper.updateText('#correct_answers', this.correctAnswers);
        
        this.updateMedalDisplay('none');
    }

    // ==================== GESTION DES PARAMÈTRES ====================

    /**
     * Charger les paramètres de jeu avec retry automatique
     */
    async loadGameSettings() {
        const settingsDropdown = DOMHelper.findElement('#settings_dropdown');
        const reloadButton = DOMHelper.findElement('#load_game_params');
        
        if (!settingsDropdown) {
            console.warn('Settings dropdown not found');
            return false;
        }
        
        this.setLoadingState(reloadButton, true);
        
        // Afficher immédiatement un message de chargement
        settingsDropdown.innerHTML = `<option value="">${MESSAGES.loadingSettings}</option>`;
        
        let lastError = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Loading settings (attempt ${attempt}/${maxRetries})...`);
                
                const response = await jsonrpc('/get_solo_game_settings', {});
                
                if (response?.success && response.data) {
                    this.populateSettingsDropdown(settingsDropdown, response.data);
                    this.setupSettingsEventListener(settingsDropdown, response.data);
                    this.settingsLoaded = true;
                    
                    console.log('✅ Settings loaded successfully:', response.data.length, 'items');
                    this.showAlert("Paramètres chargés avec succès !", "success", 2000);
                    return true;
                } else {
                    throw new Error(response?.error || "Invalid response structure");
                }
            } catch (error) {
                lastError = error;
                console.warn(`❌ Settings loading attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    // Attendre avant le prochain essai avec backoff exponentiel
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Mettre à jour le message de chargement
                    settingsDropdown.innerHTML = `<option value="">${MESSAGES.loadingSettings} (${attempt + 1}/${maxRetries})</option>`;
                }
            }
        }
        
        // Toutes les tentatives ont échoué
        console.error("❌ All settings loading attempts failed:", lastError);
        settingsDropdown.innerHTML = `<option value="">${MESSAGES.loadingError}</option>`;
        this.showAlert(MESSAGES.loadingError, "danger");
        this.settingsLoaded = false;
        
        return false;
    }

    /**
     * Définir l'état de chargement du bouton
     */
    setLoadingState(button, isLoading) {
        if (!button) return;
        
        button.disabled = isLoading;
        button.innerHTML = isLoading 
            ? '<i class="fa fa-spinner fa-spin"></i> ' + MESSAGES.loading
            : '<i class="fa fa-refresh"></i> ' + MESSAGES.reload;
    }

    /**
     * Peupler le dropdown des paramètres
     */
    populateSettingsDropdown(dropdown, settings) {
        dropdown.innerHTML = `<option value="">${MESSAGES.selectSetting}</option>`;
        
        settings.forEach(setting => {
            const option = document.createElement('option');
            option.value = setting.id;
            option.textContent = `${setting.name} (${setting.timer_duration}s)`;
            dropdown.appendChild(option);
        });
        
        // Activer le dropdown après le peuplement
        dropdown.disabled = false;
    }

    /**
     * Configurer l'écouteur d'événement pour la sélection des paramètres
     */
    setupSettingsEventListener(dropdown, settings) {
        // Supprimer les anciens écouteurs pour éviter les doublons
        const newDropdown = dropdown.cloneNode(true);
        dropdown.parentNode.replaceChild(newDropdown, dropdown);
        
        newDropdown.addEventListener('change', (event) => {
            this.selectedSettingId = event.target.value;
            if (this.selectedSettingId) {
                const selectedSetting = settings.find(s => s.id == this.selectedSettingId);
                if (selectedSetting) {
                    this.timer.setDuration(selectedSetting.timer_duration);
                    console.log(`✅ Setting selected: ${selectedSetting.name} (${selectedSetting.timer_duration}s)`);
                    
                    // Activer le bouton de démarrage
                    const startButton = DOMHelper.findElement('#start_game_button');
                    if (startButton) {
                        startButton.disabled = false;
                        startButton.classList.remove('btn-secondary');
                        startButton.classList.add('btn-success');
                    }
                }
            } else {
                // Désactiver le bouton de démarrage si aucun paramètre n'est sélectionné
                const startButton = DOMHelper.findElement('#start_game_button');
                if (startButton) {
                    startButton.disabled = true;
                    startButton.classList.remove('btn-success');
                    startButton.classList.add('btn-secondary');
                }
            }
        });
    }

    /**
     * Gestionnaire de rechargement des paramètres
     */
    async handleReloadSettings() {
        console.log('🔄 Manual settings reload triggered...');
        
        // Réinitialiser le flag de chargement
        this.settingsLoaded = false;
        
        // Désactiver temporairement le bouton de démarrage
        const startButton = DOMHelper.findElement('#start_game_button');
        if (startButton) {
            startButton.disabled = true;
            startButton.classList.remove('btn-success');
            startButton.classList.add('btn-secondary');
        }
        
        // Recharger les paramètres
        await this.loadGameSettings();
    }

    // ==================== INITIALISATION ET CONFIGURATION ====================

    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        const eventMap = [
            { selector: '#start_game_button', event: 'click', handler: this.startGameSession },
            { selector: '#pause_button', event: 'click', handler: this.togglePause },
            { selector: '#load_game_params', event: 'click', handler: this.handleReloadSettings }
        ];

        eventMap.forEach(({ selector, event, handler }) => {
            const element = DOMHelper.findElement(selector);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ Event listener attached: ${selector}`);
            } else {
                console.warn(`❌ Element not found: ${selector}`);
            }
        });
        
        // Désactiver le bouton de démarrage initialement
        const startButton = DOMHelper.findElement('#start_game_button');
        if (startButton) {
            startButton.disabled = true;
            startButton.classList.remove('btn-success');
            startButton.classList.add('btn-secondary');
        }
    }

    /**
     * Gérer les erreurs d'initialisation
     */
    handleInitializationError(error) {
        console.error("❌ Initialization error:", error);
        
        const reloadButton = DOMHelper.findElement('#load_game_params');
        if (reloadButton) {
            reloadButton.disabled = false;
            reloadButton.innerHTML = '<i class="fa fa-refresh"></i> ' + MESSAGES.retry;
        }

        this.showAlert(MESSAGES.initError, "danger");
        
        // Essayer de recharger automatiquement les paramètres après un délai
        setTimeout(() => {
            console.log('🔄 Auto-retry loading settings after initialization error...');
            this.loadGameSettings();
        }, 3000);
    }

    /**
     * Vérifier la disponibilité des données depuis le template
     */
    checkTemplateData() {
        // Vérifier les données transmises depuis le template Odoo
        const gameData = window.gameData;
        
        if (!gameData) {
            console.warn('❌ GameData not available from template');
            return false;
        }
        
        console.log('✅ Template data available:', {
            settingsAvailable: gameData.settingsAvailable,
            versesAvailable: gameData.versesAvailable,
            userId: gameData.userId
        });
        
        // Vérifier si les données de base sont disponibles
        if (gameData.settingsAvailable === 'false' || gameData.versesAvailable === 'false') {
            console.warn('❌ Required game data not available from backend');
            this.showAlert("Configuration du jeu incomplète. Contactez l'administrateur.", "warning");
            return false;
        }
        
        return true;
    }

    /**
     * Initialiser le jeu avec gestion d'erreur améliorée
     */
    async init() {
        try {
            console.log("🚀 Initializing Biblical Game...");
            
            // Vérifier les données du template d'abord
            if (!this.checkTemplateData()) {
                throw new Error("Template data validation failed");
            }
            
            // Diagnostic des éléments DOM
            const domReady = this.diagnoseLoadingIssues();
            if (!domReady) {
                throw new Error("Critical DOM elements missing");
            }
            
            // Préparer l'interface
            this.updateMedalDisplay('none');
            this.setupEventListeners();
            
            // Chargement initial des données avec retry
            console.log("📊 Loading initial game data...");
            
            const loadingPromises = [
                this.loadGameSettings(),
                this.loadStageThresholds()
            ];
            
            const results = await Promise.allSettled(loadingPromises);
            
            // Vérifier les résultats
            const settingsResult = results[0];
            const thresholdsResult = results[1];
            
            if (settingsResult.status === 'rejected') {
                console.error('❌ Settings loading failed:', settingsResult.reason);
                // Essayer un rechargement automatique après un délai
                setTimeout(() => this.loadGameSettings(), 2000);
            }
            
            if (thresholdsResult.status === 'rejected') {
                console.error('❌ Thresholds loading failed:', thresholdsResult.reason);
            }
            
            console.log("✅ Biblical game initialization completed");
            
            // Afficher un message de succès seulement si les paramètres sont chargés
            if (this.settingsLoaded) {
                this.showAlert(MESSAGES.gameReady, "success", 3000);
            } else {
                this.showAlert("Jeu initialisé. Rechargement des paramètres en cours...", "info", 3000);
            }
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    /**
     * Nettoyer les ressources du jeu
     */
    cleanup() {
        this.timer.stop();
        if (this.currentSessionId && this.isGameActive) {
            this.endGameSession().catch(console.error);
        }
    }

    /**
     * Obtenir l'état actuel du jeu
     */
    getGameState() {
        return {
            currentLevel: this.currentLevel,
            playerScore: this.playerScore,
            questionsAnswered: this.questionsAnswered,
            correctAnswers: this.correctAnswers,
            isGameActive: this.isGameActive,
            isPaused: this.isPaused,
            selectedSettingId: this.selectedSettingId,
            currentSessionId: this.currentSessionId,
            settingsLoaded: this.settingsLoaded
        };
    }

    /**
     * Activer/désactiver les sons
     */
    toggleSounds() {
        this.soundManager.toggle();
        const status = this.soundManager.enabled ? MESSAGES.soundsEnabled : MESSAGES.soundsDisabled;
        this.showAlert(status, "info", 2000);
    }

    /**
     * Définir le volume des sons
     */
    setSoundVolume(volume) {
        this.soundManager.setVolume(volume);
    }

    /**
     * Méthode de diagnostic pour vérifier l'état du jeu
     */
    diagnose() {
        console.group('=== BIBLICAL GAME DIAGNOSTIC ===');
        console.log('Settings loaded:', this.settingsLoaded);
        console.log('Selected setting ID:', this.selectedSettingId);
        console.log('Game active:', this.isGameActive);
        console.log('Current session ID:', this.currentSessionId);
        console.log('DOM elements check:');
        
        const criticalElements = [
            'settings_dropdown',
            'start_game_button',
            'load_game_params'
        ];
        
        criticalElements.forEach(id => {
            const element = document.querySelector(`#${id}`);
            console.log(`  ${id}:`, element ? 'Found' : 'MISSING');
        });
        
        console.groupEnd();
        return this.getGameState();
    }
}

// ==================== INSTANCE GLOBALE ET INITIALISATION ====================

/**
 * Instance globale du jeu
 */
let biblicalGameInstance = null;

/**
 * Fonction utilitaire pour attendre que le DOM soit complètement chargé
 */
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

/**
 * Fonction utilitaire pour attendre qu'un élément existe
 */
function waitForElement(selector, maxWait = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${maxWait}ms`));
        }, maxWait);
    });
}

/**
 * Initialisation sécurisée au chargement de la page
 */
async function initializeBiblicalGame() {
    try {
        console.log("📖 Biblical Game Module Loading...");
        
        // Attendre que le DOM soit prêt
        await waitForDOM();
        console.log("✅ DOM ready");
        
        // Attendre que les éléments critiques soient présents
        await Promise.race([
            waitForElement('#settings_dropdown'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for elements')), 15000))
        ]);
        console.log("✅ Critical elements found");
        
        // Créer l'instance du jeu
        biblicalGameInstance = new BiblicalGame();
        await biblicalGameInstance.init();
        
        // Exposer les fonctions principales pour la compatibilité
        window.biblicalGame = {
            instance: biblicalGameInstance,
            loadReferenceQuestion: () => biblicalGameInstance.loadReferenceQuestion(),
            togglePause: () => biblicalGameInstance.togglePause(),
            startGameSession: () => biblicalGameInstance.startGameSession(),
            loadGameSettings: () => biblicalGameInstance.loadGameSettings(),
            toggleSounds: () => biblicalGameInstance.toggleSounds(),
            getGameState: () => biblicalGameInstance.getGameState(),
            diagnose: () => biblicalGameInstance.diagnose()
        };
        
        // Compatibilité avec l'ancien code (fonctions globales)
        window.loadReferenceQuestion = () => biblicalGameInstance.loadReferenceQuestion();
        window.togglePause = () => biblicalGameInstance.togglePause();
        window.startGameSession = () => biblicalGameInstance.startGameSession();
        window.loadGameSettings = () => biblicalGameInstance.loadGameSettings();
        
        console.log("✅ Biblical Game fully loaded and ready");
        
    } catch (error) {
        console.error("❌ Critical initialization error:", error);
        
        // Afficher une erreur critique à l'utilisateur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger position-fixed';
        errorDiv.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; min-width: 400px;';
        errorDiv.innerHTML = `
            <h4>${MESSAGES.initializationError}</h4>
            <p>${MESSAGES.gameInitError}</p>
            <button class="btn btn-primary" onclick="location.reload()">${MESSAGES.reloadPage}</button>
        `;
        document.body.appendChild(errorDiv);
        
        // Essayer une réinitialisation automatique après un délai
        setTimeout(() => {
            console.log("🔄 Attempting automatic reinitialization...");
            initializeBiblicalGame();
        }, 10000);
    }
}

// Lancer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBiblicalGame);
} else {
    initializeBiblicalGame();
}

// ==================== GESTIONNAIRES D'ERREURS GLOBAUX ====================

/**
 * Gestionnaire d'erreurs JavaScript globales
 */
window.addEventListener('error', (event) => {
    console.error('❌ Global JavaScript error:', event.error);
    if (biblicalGameInstance) {
        biblicalGameInstance.showAlert(MESSAGES.unexpectedError, "warning");
    }
});

/**
 * Gestionnaire des promesses rejetées
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
    if (biblicalGameInstance) {
        biblicalGameInstance.showAlert(MESSAGES.serverError, "warning");
    }
});

/**
 * Nettoyage lors de la fermeture de la page
 */
window.addEventListener('beforeunload', () => {
    if (biblicalGameInstance) {
        biblicalGameInstance.cleanup();
    }
});

/**
 * Gestion de la perte de focus/reprise de focus
 */
document.addEventListener('visibilitychange', () => {
    if (biblicalGameInstance && biblicalGameInstance.isGameActive) {
        if (document.hidden && !biblicalGameInstance.isPaused) {
            // Auto-pause quand l'onglet perd le focus
            biblicalGameInstance.togglePause();
        }
    }
});

// ==================== EXPORTS ====================

export { BiblicalGame, DOMHelper, SoundManager, GameTimer, GAME_CONFIG };