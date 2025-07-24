import random
import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)

class BiblicalGameController(http.Controller):
    
    # ===== ROUTES PRINCIPALES =====
    @http.route('/web/user-guide', type='http', auth='user', website=False)
    def user_guide(self, **kwargs):
        """Main user guide page"""
        return request.render('custom_novago.biblical_game_guide_template', {
            'base_url': request.httprequest.url_root
        })

    @http.route("/start_biblical_game", auth="public", type="http", website=True, csrf=False)
    def start_biblical_game(self):
        """Page principale du jeu biblique"""
        try:
            # Vérifier si des données sont disponibles
            settings_count = request.env['biblical.game.settings'].sudo().search_count([('active', '=', True)])
            verses_count = request.env['biblical.game.verse'].sudo().search_count([])
            
            # Préparer le contexte avec les vérifications de données
            context = {
                'settings_available': settings_count > 0,
                'verses_available': verses_count > 0,
                'min_verses_required': 3,
                'settings_count': settings_count,
                'verses_count': verses_count
            }
            
            _logger.info(f"Chargement de la page principale - Paramètres: {settings_count}, Versets: {verses_count}")
            
            return request.render("biblical_game.biblical_game_main", context)
            
        except Exception as e:
            _logger.error(f"Erreur lors du chargement de la page principale: {e}")
            return request.render("biblical_game.error_page", {'error': str(e)})

    # ===== GESTION DES PARAMÈTRES =====
    
    @http.route('/get_solo_game_settings', type='json', auth='public', csrf=False)
    def get_solo_game_settings(self):
        """Récupère tous les paramètres de jeu actifs"""
        try:
            _logger.info("Début de récupération des paramètres de jeu")
            
            # Rechercher les paramètres actifs
            settings = request.env['biblical.game.settings'].sudo().search([
                ('active', '=', True)
            ], order='name asc')
            
            if not settings:
                _logger.warning("Aucun paramètre de jeu actif trouvé")
                return {
                    'success': False,
                    'error': "Aucun paramètre de jeu actif trouvé",
                    'error_code': 'NO_SETTINGS'
                }
            
            settings_data = []
            for setting in settings:
                try:
                    # Récupérer les informations des livres associés
                    book_info = []
                    if setting.book_ids:
                        for book in setting.book_ids:
                            book_info.append({
                                'id': book.id,
                                'name': book.name,
                                'testament': book.testament,
                                'chapter_count': book.chapter_count,
                                'verse_count': book.verse_count
                            })
                    
                    # Calculer le nombre total de versets disponibles
                    total_verses = sum(book.get('verse_count', 0) for book in book_info)
                    
                    setting_data = {
                        'id': setting.id,
                        'name': setting.name,
                        'timer_duration': setting.timer_duration,
                        'max_questions_per_game': setting.max_questions_per_game,
                        'difficulty_level': setting.difficulty_level,
                        'allow_hints': setting.allow_hints,
                        'books': book_info,
                        'books_count': len(book_info),
                        'total_verses': total_verses
                    }
                    
                    settings_data.append(setting_data)
                    _logger.debug(f"Paramètre ajouté: {setting.name} - {len(book_info)} livres")
                    
                except Exception as e:
                    _logger.error(f"Erreur lors du traitement du paramètre {setting.name}: {e}")
                    continue
            
            if not settings_data:
                return {
                    'success': False,
                    'error': "Aucun paramètre valide trouvé",
                    'error_code': 'NO_VALID_SETTINGS'
                }
            
            _logger.info(f"Paramètres récupérés avec succès: {len(settings_data)} éléments")
            return {
                'success': True,
                'data': settings_data,
                'count': len(settings_data)
            }
            
        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des paramètres: {e}", exc_info=True)
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    @http.route('/get_setting_details', type='json', auth='public', csrf=False)
    def get_setting_details(self, setting_id):
        """Récupère les détails d'un paramètre spécifique"""
        try:
            setting_id = int(setting_id)
            setting = request.env['biblical.game.settings'].sudo().browse(setting_id)

            if not setting.exists() or not setting.active:
                return {
                    'success': False,
                    'error': "Paramètre introuvable ou inactif",
                    'error_code': 'SETTING_NOT_FOUND'
                }

            # Vérifier la disponibilité des versets
            if setting.book_ids:
                available_verses = request.env['biblical.game.verse'].sudo().search_count([
                    ('chapter_id.book_id', 'in', setting.book_ids.ids)
                ])
            else:
                available_verses = 0

            return {
                'success': True,
                'data': {
                    'id': setting.id,
                    'name': setting.name,
                    'timer_duration': setting.timer_duration,
                    'max_questions_per_game': setting.max_questions_per_game,
                    'difficulty_level': setting.difficulty_level,
                    'allow_hints': setting.allow_hints,
                    'available_verses': available_verses,
                    'books_count': len(setting.book_ids),
                    'is_playable': available_verses >= 3
                }
            }

        except (ValueError, TypeError):
            return {
                'success': False,
                'error': "ID de paramètre invalide",
                'error_code': 'INVALID_SETTING_ID'
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des détails: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    # ===== GESTION DES NIVEAUX ET MÉDAILLES =====
    
    @http.route('/get_stage_thresholds', type='json', auth='public', csrf=False)
    def get_stage_thresholds(self, level):
        """Récupère les seuils de médailles pour un niveau donné"""
        try:
            level = int(level)
            stage = request.env['biblical.game.stage'].sudo().search([
                ('level', '=', level),
                ('is_active', '=', True)
            ], limit=1)
            
            if not stage:
                # Retourner des valeurs par défaut si aucun niveau configuré
                default_thresholds = {
                    0: {'bronze': 20, 'silver': 50, 'gold': 100},
                    1: {'bronze': 30, 'silver': 70, 'gold': 120},
                    2: {'bronze': 40, 'silver': 90, 'gold': 150},
                    3: {'bronze': 50, 'silver': 110, 'gold': 180},
                    4: {'bronze': 60, 'silver': 130, 'gold': 210},
                    5: {'bronze': 70, 'silver': 150, 'gold': 240},
                    6: {'bronze': 80, 'silver': 170, 'gold': 270}
                }
                
                thresholds = default_thresholds.get(level, default_thresholds[0])
                
                return {
                    'success': True,
                    'data': {
                        'level': level,
                        'name': f"Niveau {level + 1}",
                        'bronze_threshold': thresholds['bronze'],
                        'silver_threshold': thresholds['silver'],
                        'gold_threshold': thresholds['gold'],
                        'unlock_score': level * 10,
                        'description': f"Niveau {level + 1} - Défi biblique",
                        'bronze': thresholds['bronze'],
                        'silver': thresholds['silver'],
                        'gold': thresholds['gold']
                    }
                }

            return {
                'success': True,
                'data': {
                    'level': stage.level,
                    'name': stage.name,
                    'bronze': stage.bronze_threshold,
                    'silver': stage.silver_threshold,
                    'gold': stage.gold_threshold,
                    'unlock_score': stage.unlock_score,
                    'description': stage.description,
                    'bronze_threshold': stage.bronze_threshold,
                    'silver_threshold': stage.silver_threshold,
                    'gold_threshold': stage.gold_threshold
                }
            }
        except ValueError:
            return {
                'success': False,
                'error': "Le niveau doit être un nombre entier",
                'error_code': 'INVALID_LEVEL'
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des seuils: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }
            
    @http.route('/get_stage_medal', type='json', auth='public', csrf=False)
    def get_stage_medal(self, level, score):
        """Détermine la médaille obtenue pour un niveau et score donnés"""
        try:
            level = int(level)
            score = int(score)
            
            # Récupérer les seuils du niveau
            thresholds_response = self.get_stage_thresholds(level)
            if not thresholds_response.get('success'):
                return thresholds_response
            
            thresholds = thresholds_response['data']
            medal_info = self._calculate_medal(thresholds, score)
            
            return {
                'success': True,
                'data': {
                    'medal': medal_info['medal'],
                    'medal_emoji': medal_info['emoji'],
                    'medal_color': medal_info['color'],
                    'score': score,
                    'next_threshold': medal_info['next_threshold'],
                    'progress_percentage': medal_info['progress'],
                    'bronze_threshold': thresholds['bronze_threshold'],
                    'silver_threshold': thresholds['silver_threshold'],
                    'gold_threshold': thresholds['gold_threshold']
                }
            }
        except (ValueError, TypeError):
            return {
                'success': False,
                'error': "Paramètres invalides",
                'error_code': 'INVALID_PARAMS'
            }
        except Exception as e:
            _logger.error(f"Erreur lors du calcul de médaille: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    # ===== GESTION DES QUESTIONS =====
    
    @http.route('/get_question_with_setting', type='json', auth='public', csrf=False)
    def get_question_with_setting(self, setting_id, difficulty_level=None):
        """Génère une question basée sur les paramètres sélectionnés"""
        try:
            setting_id = int(setting_id)
            setting = request.env['biblical.game.settings'].sudo().browse(setting_id)

            if not setting.exists() or not setting.active:
                return {
                    'success': False,
                    'error': "Paramètre introuvable ou inactif",
                    'error_code': 'SETTING_NOT_FOUND'
                }

            if not setting.book_ids:
                return {
                    'success': False,
                    'error': "Aucun livre associé à ce paramètre",
                    'error_code': 'NO_BOOKS'
                }

            # Construire le domaine de recherche
            domain = [('chapter_id.book_id', 'in', setting.book_ids.ids)]
            
            # Appliquer le niveau de difficulté
            difficulty = difficulty_level or setting.difficulty_level
            if difficulty == 'easy':
                domain.append(('is_popular', '=', True))
            elif difficulty == 'hard':
                domain.append(('word_count', '>', 15))
            
            verses = request.env['biblical.game.verse'].sudo().search(domain)

            if not verses:
                return {
                    'success': False,
                    'error': "Aucun verset trouvé pour les critères sélectionnés",
                    'error_code': 'NO_VERSES'
                }
            
            if len(verses) < 3:
                return {
                    'success': False,
                    'error': "Il faut au moins 3 versets pour générer une question",
                    'error_code': 'INSUFFICIENT_VERSES'
                }

            # Générer la question
            question_data = self._generate_reference_question(verses)
            question_data['setting_info'] = {
                'name': setting.name,
                'timer_duration': setting.timer_duration,
                'difficulty_level': difficulty,
                'allow_hints': setting.allow_hints
            }
            
            return {
                'success': True,
                'data': question_data
            }

        except (ValueError, TypeError):
            return {
                'success': False,
                'error': "ID de paramètre invalide",
                'error_code': 'INVALID_SETTING_ID'
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la génération de question: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    # ===== GESTION DES SESSIONS =====
    
    @http.route('/create_game_session', type='json', auth='public', csrf=False)
    def create_game_session(self, setting_id):
        """Crée une nouvelle session de jeu"""
        try:
            setting_id = int(setting_id)
            
            # Vérifier si l'utilisateur est connecté
            if request.env.user._is_public():
                # Pour les utilisateurs publics, créer une session temporaire
                session_data = {
                    'session_id': f"public_{datetime.now().timestamp()}",
                    'user_name': 'Invité',
                    'start_time': datetime.now().isoformat(),
                    'is_public': True
                }
            else:
                user_id = request.env.user.id
                
                # Vérifier si l'utilisateur a une session en cours
                existing_session = request.env['biblical.game.session'].sudo().search([
                    ('user_id', '=', user_id),
                    ('state', '=', 'in_progress')
                ], limit=1)
                
                if existing_session:
                    return {
                        'success': False,
                        'error': "Une session est déjà en cours",
                        'error_code': 'SESSION_IN_PROGRESS',
                        'session_id': existing_session.id
                    }
                
                # Créer une nouvelle session
                try:
                    session = request.env['biblical.game.session'].sudo().create_session(user_id)
                    session_data = {
                        'session_id': session.id,
                        'user_name': session.user_id.name,
                        'start_time': session.start_time.isoformat(),
                        'is_public': False
                    }
                except AttributeError:
                    # Si la méthode create_session n'existe pas, créer manuellement
                    session_vals = {
                        'user_id': user_id,
                        'start_time': datetime.now(),
                        'state': 'in_progress',
                        'setting_id': setting_id
                    }
                    session = request.env['biblical.game.session'].sudo().create(session_vals)
                    session_data = {
                        'session_id': session.id,
                        'user_name': session.user_id.name,
                        'start_time': session.start_time.isoformat(),
                        'is_public': False
                    }
            
            return {
                'success': True,
                'data': session_data
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la création de session: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    @http.route('/end_game_session', type='json', auth='public', csrf=False)
    def end_game_session(self, session_id, final_score, questions_answered=0, correct_answers=0):
        """Termine une session de jeu"""
        try:
            # Vérifier si c'est une session publique
            if isinstance(session_id, str) and session_id.startswith('public_'):
                return {
                    'success': True,
                    'data': {
                        'session_id': session_id,
                        'final_score': final_score,
                        'duration': 0,
                        'accuracy': correct_answers / max(questions_answered, 1) * 100,
                        'medal_earned': 'none',
                        'is_public': True
                    }
                }
            
            session_id = int(session_id)
            session = request.env['biblical.game.session'].sudo().browse(session_id)
            
            if not session.exists():
                return {
                    'success': False,
                    'error': "Session introuvable",
                    'error_code': 'SESSION_NOT_FOUND'
                }
            
            if not request.env.user._is_public() and session.user_id.id != request.env.user.id:
                return {
                    'success': False,
                    'error': "Accès non autorisé à cette session",
                    'error_code': 'UNAUTHORIZED'
                }
            
            # Terminer la session
            try:
                session.end_session(final_score, questions_answered, correct_answers)
            except AttributeError:
                # Si la méthode end_session n'existe pas, mettre à jour manuellement
                session.write({
                    'end_time': datetime.now(),
                    'final_score': final_score,
                    'questions_answered': questions_answered,
                    'correct_answers': correct_answers,
                    'state': 'completed'
                })
            
            return {
                'success': True,
                'data': {
                    'session_id': session.id,
                    'final_score': final_score,
                    'duration': session.duration if hasattr(session, 'duration') else 0,
                    'accuracy': correct_answers / max(questions_answered, 1) * 100,
                    'medal_earned': getattr(session, 'medal_earned', 'none')
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la fin de session: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }

    # ===== MÉTHODES UTILITAIRES =====
    
    def _generate_reference_question(self, verses):
        """Génère une question de référence à partir des versets"""
        # Sélectionner un verset aléatoire
        selected_verse = random.choice(verses)
        
        # Bonne réponse
        correct_answer = selected_verse.name
        
        # Générer des mauvaises réponses
        other_verses = verses.filtered(lambda v: v.id != selected_verse.id)
        wrong_answers = random.sample(other_verses, min(2, len(other_verses)))
        
        # Mélanger les options
        options = [correct_answer] + [v.name for v in wrong_answers]
        random.shuffle(options)
        
        return {
            'question_id': selected_verse.id,
            'verse_text': selected_verse.text,
            'correct_answer': correct_answer,
            'options': options,
            'correct_option_index': options.index(correct_answer),
            'verse_info': {
                'book': selected_verse.chapter_id.book_id.name,
                'chapter': selected_verse.chapter_id.chapter_number,
                'verse_number': selected_verse.verse_number,
                'word_count': getattr(selected_verse, 'word_count', 0),
                'difficulty_score': getattr(selected_verse, 'difficulty_score', 1),
                'is_popular': getattr(selected_verse, 'is_popular', False)
            }
        }
    
    def _calculate_medal(self, thresholds, score):
        """Calcule la médaille et les informations associées"""
        gold_threshold = thresholds.get('gold_threshold', thresholds.get('gold', 100))
        silver_threshold = thresholds.get('silver_threshold', thresholds.get('silver', 50))
        bronze_threshold = thresholds.get('bronze_threshold', thresholds.get('bronze', 20))
        
        if score >= gold_threshold:
            medal = 'gold'
            emoji = '🏅'
            color = '#FFD700'
            next_threshold = None
            progress = 100
        elif score >= silver_threshold:
            medal = 'silver'
            emoji = '🥈'
            color = '#C0C0C0'
            next_threshold = gold_threshold
            progress = (score - silver_threshold) / (gold_threshold - silver_threshold) * 100
        elif score >= bronze_threshold:
            medal = 'bronze'
            emoji = '🥉'
            color = '#CD7F32'
            next_threshold = silver_threshold
            progress = (score - bronze_threshold) / (silver_threshold - bronze_threshold) * 100
        else:
            medal = 'none'
            emoji = '❌'
            color = '#808080'
            next_threshold = bronze_threshold
            progress = score / bronze_threshold * 100 if bronze_threshold > 0 else 0
        
        return {
            'medal': medal,
            'emoji': emoji,
            'color': color,
            'next_threshold': next_threshold,
            'progress': min(progress, 100)
        }

    # ===== ROUTES DE DEBUGGING ET MAINTENANCE =====
    
    @http.route('/debug/test_settings', type='json', auth='public', csrf=False)
    def debug_test_settings(self):
        """Test de récupération des paramètres (pour débogage)"""
        try:
            # Compter les éléments
            settings_count = request.env['biblical.game.settings'].sudo().search_count([])
            active_settings_count = request.env['biblical.game.settings'].sudo().search_count([('active', '=', True)])
            verses_count = request.env['biblical.game.verse'].sudo().search_count([])
            books_count = request.env['biblical.game.book'].sudo().search_count([])
            
            # Récupérer un échantillon de paramètres
            sample_settings = request.env['biblical.game.settings'].sudo().search([], limit=3)
            sample_data = []
            
            for setting in sample_settings:
                try:
                    sample_data.append({
                        'id': setting.id,
                        'name': setting.name,
                        'active': setting.active,
                        'books_count': len(setting.book_ids),
                        'timer_duration': setting.timer_duration
                    })
                except Exception as e:
                    sample_data.append({
                        'id': setting.id,
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'data': {
                    'counts': {
                        'total_settings': settings_count,
                        'active_settings': active_settings_count,
                        'verses': verses_count,
                        'books': books_count
                    },
                    'sample_settings': sample_data,
                    'env_user': {
                        'id': request.env.user.id,
                        'name': request.env.user.name,
                        'is_public': request.env.user._is_public()
                    }
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors du test des paramètres: {e}")
            return {
                'success': False,
                'error': f"Erreur de test: {str(e)}",
                'error_code': 'TEST_ERROR'
            }

    @http.route('/debug/create_test_data', type='json', auth='user', csrf=False)
    def create_test_data(self):
        """Crée des données de test (uniquement pour le développement)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': "Accès non autorisé",
                    'error_code': 'UNAUTHORIZED'
                }
            
            # Créer une configuration par défaut si elle n'existe pas
            existing_settings = request.env['biblical.game.settings'].sudo().search([])
            if not existing_settings:
                # Vérifier s'il y a des livres disponibles
                books = request.env['biblical.game.book'].sudo().search([], limit=5)
                if books:
                    setting = request.env['biblical.game.settings'].sudo().create({
                        'name': 'Configuration par défaut',
                        'timer_duration': 30,
                        'max_questions_per_game': 10,
                        'difficulty_level': 'medium',
                        'active': True,
                        'book_ids': [(6, 0, books.ids)]
                    })
                    created_settings = 1
                else:
                    created_settings = 0
            else:
                created_settings = 0
            
            # Créer les niveaux si le modèle existe
            created_stages = 0
            try:
                stage_model = request.env['biblical.game.stage'].sudo()
                existing_stages = stage_model.search([])
                if not existing_stages:
                    if hasattr(stage_model, 'create_stages'):
                        stages = stage_model.create_stages()
                        created_stages = len(stages)
            except Exception as e:
                _logger.warning(f"Impossible de créer les niveaux: {e}")
            
            return {
                'success': True,
                'data': {
                    'settings_created': created_settings,
                    'stages_created': created_stages,
                    'message': 'Données de test créées avec succès'
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la création des données de test: {e}")
            return {
                'success': False,
                'error': f"Erreur interne: {str(e)}",
                'error_code': 'INTERNAL_ERROR'
            }