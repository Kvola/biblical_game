from odoo import models, fields, api
from datetime import datetime

class BiblicalGameSession(models.Model):
    _name = 'biblical.game.session'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Session de jeu biblique'
    _order = 'start_time desc'

    name = fields.Char(string="Nom de la Session", required=True)
    user_id = fields.Many2one('res.users', string="Utilisateur", required=True, index=True)
    start_time = fields.Datetime(string="Heure de début", default=fields.Datetime.now, required=True, index=True)
    end_time = fields.Datetime(string="Heure de fin")
    duration = fields.Float(string="Durée (minutes)", compute='_compute_duration', store=True)
    score = fields.Integer(string="Score", default=0)
    stage_level = fields.Integer(string="Niveau atteint", default=0)
    questions_answered = fields.Integer(string="Questions répondues", default=0)
    correct_answers = fields.Integer(string="Réponses correctes", default=0)
    accuracy = fields.Float(string="Précision (%)", compute='_compute_accuracy', store=True)
    
    state = fields.Selection([
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('abandoned', 'Abandonnée')
    ], string="Statut", default='in_progress', required=True, index=True)

    # Champs calculés
    medal_earned = fields.Selection([
        ('bronze', 'Bronze'),
        ('silver', 'Argent'),
        ('gold', 'Or'),
        ('none', 'Aucune')
    ], string="Médaille obtenue", compute='_compute_medal', store=True)

    @api.depends('start_time', 'end_time')
    def _compute_duration(self):
        for session in self:
            if session.start_time and session.end_time:
                delta = session.end_time - session.start_time
                session.duration = delta.total_seconds() / 60.0
            else:
                session.duration = 0.0

    @api.depends('questions_answered', 'correct_answers')
    def _compute_accuracy(self):
        for session in self:
            if session.questions_answered > 0:
                session.accuracy = (session.correct_answers / session.questions_answered) * 100
            else:
                session.accuracy = 0.0

    @api.depends('score', 'stage_level')
    def _compute_medal(self):
        for session in self:
            if session.state == 'completed':
                stage = self.env['biblical.game.stage'].search([('level', '=', session.stage_level)], limit=1)
                if stage:
                    if session.score >= stage.gold_threshold:
                        session.medal_earned = 'gold'
                    elif session.score >= stage.silver_threshold:
                        session.medal_earned = 'silver'
                    elif session.score >= stage.bronze_threshold:
                        session.medal_earned = 'bronze'
                    else:
                        session.medal_earned = 'none'
                else:
                    session.medal_earned = 'none'
            else:
                session.medal_earned = 'none'

    @api.model
    def create_session(self, user_id):
        """Créer une session pour l'utilisateur"""
        user = self.env['res.users'].browse(user_id)
        return self.create({
            'user_id': user_id,
            'name': f"Session de {user.name} - {fields.Datetime.now().strftime('%d/%m/%Y %H:%M')}",
        })

    def action_view_details(self):
        """Afficher les détails de la session"""
        return {
            'type': 'ir.actions.act_window',
            'name': 'Détails de la Session',
            'res_model': 'biblical.game.session',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def end_session(self, final_score, questions_answered=0, correct_answers=0):
        """Terminer une session et enregistrer les statistiques"""
        self.write({
            'end_time': fields.Datetime.now(),
            'score': final_score,
            'questions_answered': questions_answered,
            'correct_answers': correct_answers,
            'state': 'completed'
        })
        
        # Log des statistiques
        _logger.info(f"Session terminée - Utilisateur: {self.user_id.name}, Score: {final_score}, Précision: {self.accuracy:.1f}%")

    def abandon_session(self):
        """Abandonner une session"""
        self.write({
            'end_time': fields.Datetime.now(),
            'state': 'abandoned'
        })