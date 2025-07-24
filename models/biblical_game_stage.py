from odoo import models, fields, api

# biblical_game_stage.py (optimisé)
class BiblicalGameStage(models.Model):
    _name = 'biblical.game.stage'
    _description = 'Étapes du Jeu avec Seuils de Médailles'
    _order = 'level'

    name = fields.Char(string="Nom de la Manche", required=True)
    level = fields.Integer(string="Niveau", required=True, index=True)
    bronze_threshold = fields.Integer(string="Seuil Bronze", required=True)
    silver_threshold = fields.Integer(string="Seuil Argent", required=True)
    gold_threshold = fields.Integer(string="Seuil Or", required=True)
    
    # Nouveaux champs
    description = fields.Text(string="Description")
    unlock_score = fields.Integer(string="Score de déblocage", help="Score nécessaire pour débloquer ce niveau")
    is_active = fields.Boolean(string="Actif", default=True)

    def get_stage_thresholds(self, level):
        """Retourne les seuils pour un niveau donné"""
        stage = self.search([('level', '=', level), ('is_active', '=', True)], limit=1)
        if not stage:
            return None
        
        return {
            'bronze': stage.bronze_threshold,
            'silver': stage.silver_threshold,
            'gold': stage.gold_threshold,
            'unlock_score': stage.unlock_score,
            'description': stage.description
        }

    @api.model
    def create_stages(self):
        """Génère les 8 niveaux dynamiquement de manière optimisée."""
        base_thresholds = {'bronze': 20, 'silver': 50, 'gold': 100}
        
        # Suppression des anciens niveaux
        existing_stages = self.search([])
        if existing_stages:
            existing_stages.unlink()
            _logger.info(f"Suppression de {len(existing_stages)} anciens niveaux")

        # Préparation des données pour création en lot
        stages_data = []
        for level in range(8):  # 8 niveaux (0 à 7)
            factor = 2 ** level
            stages_data.append({
                'name': f"Manche {level + 1}" if level > 0 else "Manche Découverte",
                'level': level,
                'bronze_threshold': base_thresholds['bronze'] * factor,
                'silver_threshold': base_thresholds['silver'] * factor,
                'gold_threshold': base_thresholds['gold'] * factor,
                'unlock_score': (base_thresholds['bronze'] * (factor // 2)) if level > 0 else 0,
                'description': f"Niveau {level + 1} - Difficulté {'Débutant' if level < 2 else 'Intermédiaire' if level < 5 else 'Expert'}"
            })

        # Création en lot
        created_stages = self.create(stages_data)
        _logger.info(f"Création de {len(created_stages)} nouveaux niveaux")
        return created_stages

    _sql_constraints = [
        ('unique_level', 'UNIQUE(level)', 'Le niveau doit être unique'),
        ('check_thresholds', 'CHECK(bronze_threshold < silver_threshold AND silver_threshold < gold_threshold)', 
         'Les seuils doivent être croissants')
    ]