from odoo import models, fields, api
from datetime import datetime

class BiblicalGameSession(models.Model):
    _name = 'biblical.game.session'
    _description = 'Session de jeu biblique'

    name = fields.Char(string="Nom de la Session", default="Nouvelle Session", required=True)
    user_id = fields.Many2one('res.users', string="Utilisateur", required=True)
    start_time = fields.Datetime(string="Heure de début", default=fields.Datetime.now, required=True)
    end_time = fields.Datetime(string="Heure de fin")
    score = fields.Integer(string="Score", default=0)
    stage_level = fields.Integer(string="Niveau de la Manche", default=0)
    state = fields.Selection([
        ('in_progress', 'En cours'),
        ('completed', 'Terminée')
    ], string="Statut", default='in_progress', required=True)

    @api.model
    def create_session(self, user_id):
        """Créer une session pour l'utilisateur"""
        return self.create({
            'user_id': user_id,
            'name': f"Session de {self.env['res.users'].browse(user_id).name}",
        })

    def end_session(self, final_score):
        """Terminer une session et enregistrer le score"""
        self.write({
            'end_time': datetime.now(),
            'score': final_score,
            'state': 'completed'
        })
