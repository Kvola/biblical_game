from odoo import models, fields, api

class BiblicalGameStage(models.Model):
    _name = 'biblical.game.stage'
    _description = 'Game Stages with Medal Thresholds'

    name = fields.Char(string="Nom de la Manche", required=True)
    level = fields.Integer(string="Niveau", required=True)
    bronze_threshold = fields.Integer(string="Seuil Bronze")
    silver_threshold = fields.Integer(string="Seuil Argent")
    gold_threshold = fields.Integer(string="Seuil Or")

    @api.model
    def create_stages(self):
        """Generate the 7 levels dynamically."""
        base_thresholds = {'bronze': 20, 'silver': 50, 'gold': 100}
        self.env['biblical.game.stage'].sudo().unlink()  # Nettoyage des anciens niveaux

        for level in range(8):  # 8 niveaux (0 à 7)
            factor = 2 ** level  # Doublement des seuils à chaque niveau
            self.create({
                'name': f"Manche {level}",
                'level': level,
                'bronze_threshold': base_thresholds['bronze'] * factor,
                'silver_threshold': base_thresholds['silver'] * factor,
                'gold_threshold': base_thresholds['gold'] * factor,
            })
