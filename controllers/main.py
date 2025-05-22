import random
from odoo import http
from odoo.http import request

class BiblicalGameController(http.Controller):
    @http.route(
        "/start_biblical_game", auth="public", type="http", website=True, csrf=False
    )
    def start_biblical_game(self):
        return request.render("biblical_game.my_biblical_game_main", {})
    
    @http.route('/get_stage_thresholds', type='json', auth='public')
    def get_stage_thresholds(self, level):
        """Fetch medal thresholds (bronze, silver, gold) for a given stage/level."""
        try:
            # Fetch the stage with the specified level
            stage = request.env['biblical.game.stage'].sudo().search([('level', '=', int(level))], limit=1)
            
            if not stage:
                return {'error': f"Aucun niveau trouvé pour le niveau {level}."}

            # Return the thresholds
            return {
                'bronze': stage.bronze_threshold,
                'silver': stage.silver_threshold,
                'gold': stage.gold_threshold
            }
        except Exception as e:
            return {'error': f"Une erreur s'est produite : {str(e)}"}
            
    @http.route('/get_stage_medal', type='json', auth='public')
    def get_stage_medal(self, level, score):
        """Determine the medal for a given stage and score."""
        stage = request.env['biblical.game.stage'].sudo().search([('level', '=', level)], limit=1)
        if not stage:
            return {'error': "Niveau introuvable."}

        if score >= stage.gold_threshold:
            return {'medal': 'Or 🏅'}
        elif score >= stage.silver_threshold:
            return {'medal': 'Argent 🥈'}
        elif score >= stage.bronze_threshold:
            return {'medal': 'Bronze 🥉'}
        else:
            return {'medal': 'Aucune médaille'}
    
    @http.route('/get_solo_game_settings', type='json', auth='public')
    def get_solo_game_settings(self):
        """Fetch all records from biblical.game.settings."""
        settings = request.env['biblical.game.settings'].sudo().search([('active','=',True)])
        return [{
            'id': setting.id,
            'name': setting.name,
            'timer_duration': setting.timer_duration,
            'book_ids': [book.name for book in setting.book_ids]
        } for setting in settings]

    @http.route('/get_question_with_setting', type='json', auth='public')
    def get_question_with_setting(self, setting_id):
        """Fetch a random passage related to the selected game setting."""
        try:
            # Fetch the selected setting
            setting = request.env['biblical.game.settings'].sudo().browse(int(setting_id))

            if not setting.exists():
                return {'error': "Le paramètre sélectionné est introuvable."}

            # Check if there are associated books
            if not setting.book_ids:
                return {'error': "Aucun livre associé à ce paramètre."}

            # Fetch all verses linked to the selected books
            verses = request.env['biblical.game.verse'].sudo().search([
                ('chapter_id.book_id', 'in', setting.book_ids.ids)
            ])

            if not verses:
                return {'error': "Aucun passage trouvé pour les livres sélectionnés."}
            
            if len(verses) < 3:
                return {'error': "Il faut au moins 3 versets pour générer des réponses."}

             # Sélectionner un verset aléatoire
            selected_verse = random.choice(verses)

            # Bonne réponse : référence du verset
            good_reference = selected_verse.name
            
            # Deux mauvaises réponses : autres références
            other_verses = [verse for verse in verses if verse.id != selected_verse.id]
            bad_references = random.sample(other_verses, 2)
            
            return {
                'verse': {
                    'text': selected_verse.text
                },
                'good': good_reference,
                'bad': [bad.name for bad in bad_references]
            }

        except Exception as e:
            return {'error': f"Une erreur s'est produite : {str(e)}"}


    @http.route('/get_reference_question', type='json', auth='public', csrf=False)
    def get_reference_question(self):
        """Retourne un verset, sa référence correcte et deux mauvaises références."""
        # Récupérer tous les versets disponibles
        verses = request.env['biblical.game.verse'].sudo().search([])
        if len(verses) < 3:
            return {'error': "Il faut au moins 3 versets pour générer des réponses."}

        # Sélectionner un verset aléatoire
        selected_verse = random.choice(verses)

        # Bonne réponse : référence du verset
        good_reference = selected_verse.name

        # Deux mauvaises réponses : autres références
        other_verses = [verse for verse in verses if verse.id != selected_verse.id]
        bad_references = random.sample(other_verses, 2)

        return {
            'verse': {
                'text': selected_verse.text
            },
            'good': good_reference,
            'bad': [bad.name for bad in bad_references]
        }