from odoo import http
import random

class BiblicalGameController(http.Controller):
    @http.route(
        "/start_biblical_contest_game", auth="public", type="http", website=True, csrf=False
    )
    def start_biblical_game(self):
        return http.request.render("biblical_game.second_biblical_contest_game_main", {})
    
    @http.route('/get_game_settings', type='json', auth='public', csrf=False)
    def get_game_settings(self):
        """Retourne la liste des paramètres de jeu disponibles."""
        settings = http.request.env['biblical.game.settings'].sudo().search([('active','=',True)])
        return [{
            'id': setting.id,
            'name': setting.name,
            'timer_duration': setting.timer_duration,
            'book_ids': [book.name for book in setting.book_ids]
        } for setting in settings]
    
    @http.route('/get_timer_duration', type='json', auth='public', csrf=False)
    def get_timer_duration(self):
        """Retourne la durée du compteur définie dans les paramètres."""
        settings = http.request.env['biblical.game.settings'].sudo().search([('active','=',True)], limit=1)
        return {'duration': settings.timer_duration if settings else 30}
    
    @http.route('/play_biblical_game', type='json', auth='public', csrf=False)
    def play_biblical_game(self, **post):
        """Retourne un verset aléatoire à partir des livres sélectionnés."""
        
        params = post.get('params')
        # Récupérer les paramètres du jeu
        settings = http.request.env['biblical.game.settings'].sudo().search([('active','=',True),('id','=', params.get('setting'))], limit=1)
        if not settings or not settings.book_ids:
            return {'text': "Aucun livre sélectionné.", 'reference': ""}

        # Filtrer les versets par les livres sélectionnés
        selected_books = settings.book_ids.ids
        Verse = http.request.env['biblical.game.verse'].sudo()
        verses = Verse.search([('chapter_id.book_id', 'in', selected_books)])

        if verses:
            random_verse = random.choice(verses)
            return {
                'text': random_verse.text,
                'reference': random_verse.name,
            }
        return {'text': "Aucun verset disponible.", 'reference': ""}

    
