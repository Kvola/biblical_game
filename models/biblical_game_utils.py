from odoo import models, fields, api

class BiblicalGameUtils(models.AbstractModel):
    _name = 'biblical.game.utils'
    _description = 'Utilitaires pour le jeu biblique'

    @api.model
    def get_random_verse(self, book_ids=None, difficulty_level='medium'):
        """Récupère un verset aléatoire selon les critères"""
        domain = []
        
        if book_ids:
            domain.append(('chapter_id.book_id', 'in', book_ids))
        
        if difficulty_level == 'easy':
            domain.append(('is_popular', '=', True))
        elif difficulty_level == 'hard':
            domain.append(('word_count', '>', 15))
        
        verses = self.env['biblical.game.verse'].search(domain)
        if verses:
            return verses[0]  # Utiliser random.choice en production
        return False

    @api.model
    def get_user_statistics(self, user_id):
        """Récupère les statistiques d'un utilisateur"""
        sessions = self.env['biblical.game.session'].search([
            ('user_id', '=', user_id),
            ('state', '=', 'completed')
        ])
        
        if not sessions:
            return {}
        
        return {
            'total_sessions': len(sessions),
            'total_score': sum(sessions.mapped('score')),
            'average_score': sum(sessions.mapped('score')) / len(sessions),
            'best_score': max(sessions.mapped('score')),
            'average_accuracy': sum(sessions.mapped('accuracy')) / len(sessions),
            'medals': {
                'gold': len(sessions.filtered(lambda s: s.medal_earned == 'gold')),
                'silver': len(sessions.filtered(lambda s: s.medal_earned == 'silver')),
                'bronze': len(sessions.filtered(lambda s: s.medal_earned == 'bronze')),
            }
        }