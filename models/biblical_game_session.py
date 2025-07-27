from odoo import models, fields, api
from datetime import datetime
import logging

_logger = logging.getLogger(__name__)

class BiblicalGameSession(models.Model):
    _name = 'biblical.game.session'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Session de jeu biblique'
    _order = 'start_time desc'
    _rec_name = 'name'

    name = fields.Char(
        string="Nom de la Session", 
        required=True, 
        index=True,
        tracking=True
    )
    user_id = fields.Many2one(
        'res.users', 
        string="Utilisateur", 
        required=True, 
        index=True,
        ondelete='cascade',
        tracking=True
    )
    
    # Champs temporels avec contraintes
    start_time = fields.Datetime(
        string="Heure de début", 
        default=fields.Datetime.now, 
        required=True, 
        index=True,
        tracking=True
    )
    end_time = fields.Datetime(
        string="Heure de fin",
        tracking=True
    )
    duration = fields.Float(
        string="Durée (minutes)", 
        compute='_compute_duration', 
        store=True,
        help="Durée calculée automatiquement"
    )
    
    # Statistiques de jeu avec valeurs par défaut sécurisées
    score = fields.Integer(
        string="Score", 
        default=0,
        tracking=True,
        help="Score total obtenu durant la session"
    )
    stage_level = fields.Integer(
        string="Niveau atteint", 
        default=0,
        help="Dernier niveau atteint"
    )
    questions_answered = fields.Integer(
        string="Questions répondues", 
        default=0,
        help="Nombre total de questions répondues"
    )
    correct_answers = fields.Integer(
        string="Réponses correctes", 
        default=0,
        help="Nombre de réponses correctes"
    )
    accuracy = fields.Float(
        string="Précision (%)", 
        compute='_compute_accuracy', 
        store=True,
        help="Pourcentage de réponses correctes"
    )
    
    # État de la session avec validation
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('abandoned', 'Abandonnée'),
        ('error', 'Erreur')
    ], 
        string="Statut", 
        default='draft', 
        required=True, 
        index=True,
        tracking=True
    )

    # Champs calculés et métadonnées
    medal_earned = fields.Selection([
        ('bronze', 'Bronze'),
        ('silver', 'Argent'),
        ('gold', 'Or'),
        ('none', 'Aucune')
    ], 
        string="Médaille obtenue", 
        compute='_compute_medal', 
        store=True
    )
    
    # Nouveaux champs pour améliorer le suivi
    setting_id = fields.Many2one(
        'biblical.game.settings',
        string="Paramètres utilisés",
        help="Configuration de jeu utilisée"
    )
    completion_rate = fields.Float(
        string="Taux de complétion (%)",
        compute='_compute_completion_rate',
        store=True
    )

    stage_id = fields.Many2one(
        'biblical.game.stage',
        string="Niveau",
        required=True,
        ondelete='cascade'
    )
    
    # Contraintes SQL pour assurer l'intégrité
    _sql_constraints = [
        ('positive_score', 'CHECK(score >= 0)', 'Le score ne peut pas être négatif'),
        ('positive_questions', 'CHECK(questions_answered >= 0)', 'Le nombre de questions ne peut pas être négatif'),
        ('positive_correct', 'CHECK(correct_answers >= 0)', 'Le nombre de réponses correctes ne peut pas être négatif'),
        ('logical_answers', 'CHECK(correct_answers <= questions_answered)', 
         'Le nombre de réponses correctes ne peut pas dépasser le nombre total de questions'),
        ('logical_duration', 'CHECK(duration >= 0)', 'La durée ne peut pas être négative'),
        ('logical_times', 'CHECK(end_time IS NULL OR end_time >= start_time)', 
         'L\'heure de fin doit être postérieure à l\'heure de début')
    ]

    @api.depends('start_time', 'end_time')
    def _compute_duration(self):
        """Calcul sécurisé de la durée avec gestion d'erreurs"""
        for session in self:
            try:
                if session.start_time and session.end_time:
                    delta = session.end_time - session.start_time
                    session.duration = max(0, delta.total_seconds() / 60.0)
                else:
                    session.duration = 0.0
            except Exception as e:
                _logger.warning(f"Erreur lors du calcul de durée pour session {session.id}: {e}")
                session.duration = 0.0

    @api.depends('questions_answered', 'correct_answers')
    def _compute_accuracy(self):
        """Calcul sécurisé de la précision"""
        for session in self:
            try:
                if session.questions_answered > 0:
                    session.accuracy = round(
                        (session.correct_answers / session.questions_answered) * 100, 2
                    )
                else:
                    session.accuracy = 0.0
            except Exception as e:
                _logger.warning(f"Erreur lors du calcul de précision pour session {session.id}: {e}")
                session.accuracy = 0.0

    @api.depends('questions_answered', 'setting_id')
    def _compute_completion_rate(self):
        """Calcul du taux de complétion basé sur les paramètres"""
        for session in self:
            try:
                if session.setting_id and session.setting_id.max_questions_per_game > 0:
                    session.completion_rate = min(
                        100.0,
                        (session.questions_answered / session.setting_id.max_questions_per_game) * 100
                    )
                else:
                    session.completion_rate = 0.0
            except Exception as e:
                _logger.warning(f"Erreur lors du calcul de complétion pour session {session.id}: {e}")
                session.completion_rate = 0.0

    @api.depends('score', 'stage_level', 'state')
    def _compute_medal(self):
        """Calcul robuste de la médaille avec gestion d'erreurs"""
        for session in self:
            session.medal_earned = 'none'  # Valeur par défaut
            
            if session.state != 'completed':
                continue
                
            try:
                stage = self.env['biblical.game.stage'].search([
                    ('level', '=', session.stage_level),
                    ('is_active', '=', True)
                ], limit=1)
                
                if not stage:
                    continue
                    
                if session.score >= stage.gold_threshold:
                    session.medal_earned = 'gold'
                elif session.score >= stage.silver_threshold:
                    session.medal_earned = 'silver'
                elif session.score >= stage.bronze_threshold:
                    session.medal_earned = 'bronze'
                    
            except Exception as e:
                _logger.warning(f"Erreur lors du calcul de médaille pour session {session.id}: {e}")

    @api.model
    def create_session(self, user_id, setting_id=None):
        """Créer une session sécurisée pour l'utilisateur"""
        try:
            user = self.env['res.users'].browse(user_id)
            if not user.exists():
                raise ValueError(f"Utilisateur {user_id} introuvable")
            
            # Vérifier s'il y a déjà une session en cours
            existing_session = self.search([
                ('user_id', '=', user_id),
                ('state', '=', 'in_progress')
            ], limit=1)
            
            if existing_session:
                _logger.warning(f"Session en cours détectée pour utilisateur {user_id}")
                return existing_session
            
            session_vals = {
                'user_id': user_id,
                'name': f"Session de {user.name} - {fields.Datetime.now().strftime('%d/%m/%Y %H:%M')}",
                'state': 'in_progress',
                'start_time': fields.Datetime.now(),
            }
            
            if setting_id:
                setting = self.env['biblical.game.settings'].browse(setting_id)
                if setting.exists():
                    session_vals['setting_id'] = setting_id
            
            session = self.create(session_vals)
            _logger.info(f"Session créée avec succès: {session.id} pour utilisateur {user.name}")
            return session
            
        except Exception as e:
            _logger.error(f"Erreur lors de la création de session: {e}")
            raise

    def action_view_details(self):
        """Afficher les détails de la session avec vérification des droits"""
        self.ensure_one()
        
        # Vérifier les droits d'accès
        if not self.user_has_groups('base.group_user'):
            return {'type': 'ir.actions.act_window_close'}
        
        return {
            'type': 'ir.actions.act_window',
            'name': f'Détails - {self.name}',
            'res_model': 'biblical.game.session',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'current',
            'context': {'default_user_id': self.user_id.id}
        }

    def end_session(self, final_score=None, questions_answered=None, correct_answers=None):
        """Terminer une session avec validation complète"""
        self.ensure_one()
        
        try:
            # Vérifier que la session peut être terminée
            if self.state != 'in_progress':
                _logger.warning(f"Tentative de fin de session {self.id} avec état {self.state}")
                return False
            
            # Préparer les valeurs de mise à jour
            vals = {
                'end_time': fields.Datetime.now(),
                'state': 'completed'
            }
            
            # Mettre à jour les statistiques si fournies
            if final_score is not None:
                vals['score'] = max(0, int(final_score))
            if questions_answered is not None:
                vals['questions_answered'] = max(0, int(questions_answered))
            if correct_answers is not None:
                vals['correct_answers'] = max(0, min(int(correct_answers), vals.get('questions_answered', self.questions_answered)))
            
            self.write(vals)
            
            # Log des statistiques
            _logger.info(
                f"Session terminée - ID: {self.id}, Utilisateur: {self.user_id.name}, "
                f"Score: {self.score}, Précision: {self.accuracy:.1f}%, "
                f"Durée: {self.duration:.1f}min, Médaille: {self.medal_earned}"
            )
            
            # Notifier l'utilisateur si possible
            self.message_post(
                body=f"Session terminée avec succès ! Score: {self.score} points, "
                     f"Précision: {self.accuracy:.1f}%",
                message_type='notification'
            )
            
            return True
            
        except Exception as e:
            _logger.error(f"Erreur lors de la fin de session {self.id}: {e}")
            self.write({'state': 'error'})
            return False

    def abandon_session(self, reason=None):
        """Abandonner une session avec raison optionnelle"""
        self.ensure_one()
        
        try:
            if self.state not in ['in_progress', 'draft']:
                return False
            
            vals = {
                'end_time': fields.Datetime.now(),
                'state': 'abandoned'
            }
            
            self.write(vals)
            
            # Log de l'abandon
            reason_msg = f" (Raison: {reason})" if reason else ""
            _logger.info(f"Session abandonnée - ID: {self.id}, Utilisateur: {self.user_id.name}{reason_msg}")
            
            if reason:
                self.message_post(
                    body=f"Session abandonnée: {reason}",
                    message_type='comment'
                )
            
            return True
            
        except Exception as e:
            _logger.error(f"Erreur lors de l'abandon de session {self.id}: {e}")
            return False

    @api.model
    def cleanup_old_sessions(self, days=30):
        """Nettoyer les anciennes sessions (à exécuter via cron)"""
        try:
            cutoff_date = fields.Datetime.now() - timedelta(days=days)
            old_sessions = self.search([
                ('create_date', '<', cutoff_date),
                ('state', 'in', ['abandoned', 'error'])
            ])
            
            if old_sessions:
                count = len(old_sessions)
                old_sessions.unlink()
                _logger.info(f"Nettoyage effectué: {count} anciennes sessions supprimées")
                
        except Exception as e:
            _logger.error(f"Erreur lors du nettoyage des sessions: {e}")

    @api.model
    def get_user_statistics(self, user_id, period_days=None):
        """Récupérer les statistiques d'un utilisateur avec période optionnelle"""
        try:
            domain = [
                ('user_id', '=', user_id),
                ('state', '=', 'completed')
            ]
            
            if period_days:
                cutoff_date = fields.Datetime.now() - timedelta(days=period_days)
                domain.append(('start_time', '>=', cutoff_date))
            
            sessions = self.search(domain)
            
            if not sessions:
                return {
                    'total_sessions': 0,
                    'total_score': 0,
                    'average_score': 0,
                    'best_score': 0,
                    'average_accuracy': 0,
                    'total_playtime': 0,
                    'medals': {'gold': 0, 'silver': 0, 'bronze': 0, 'none': 0}
                }
            
            scores = sessions.mapped('score')
            accuracies = sessions.mapped('accuracy')
            durations = sessions.mapped('duration')
            
            return {
                'total_sessions': len(sessions),
                'total_score': sum(scores),
                'average_score': round(sum(scores) / len(scores), 2) if scores else 0,
                'best_score': max(scores) if scores else 0,
                'average_accuracy': round(sum(accuracies) / len(accuracies), 2) if accuracies else 0,
                'total_playtime': round(sum(durations), 2),
                'medals': {
                    'gold': len(sessions.filtered(lambda s: s.medal_earned == 'gold')),
                    'silver': len(sessions.filtered(lambda s: s.medal_earned == 'silver')),
                    'bronze': len(sessions.filtered(lambda s: s.medal_earned == 'bronze')),
                    'none': len(sessions.filtered(lambda s: s.medal_earned == 'none')),
                }
            }
            
        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des statistiques utilisateur {user_id}: {e}")
            return {}

    def unlink(self):
        """Suppression sécurisée avec vérifications"""
        for session in self:
            if session.state == 'in_progress':
                raise UserError("Impossible de supprimer une session en cours")
        return super().unlink()