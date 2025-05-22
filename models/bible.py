from odoo import api, models, fields, _
from odoo.exceptions import ValidationError

class BiblicalGameSettings(models.Model):
    _name = 'biblical.game.settings'
    _inherit = ['mail.thread', 'mail.activity.mixin', 'image.mixin']
    _description = 'Paramètres du Jeu Biblique'

    @api.constrains("timer_duration")
    def _check_college_class_ids_length(self):
        for s in self:
            if s.timer_duration <= 0:
                raise ValidationError(_("La durée doit être strictement positive !!!"))
            
    #name = fields.Char(string='Nom', default="Paramètres du Jeu Biblique", readonly=True)
    name = fields.Char(string='Nom', default="Paramètres du Jeu Biblique", required=True)
    book_ids = fields.Many2many('biblical.game.book', string='Livres Sélectionnés')
    timer_duration = fields.Integer(string='Durée du Compteur (secondes)', default=30, required=True,
                                    help="Durée en secondes pour le compteur avant d'afficher un message.")
    active = fields.Boolean(string='Actif', default=True)

class BibleBook(models.Model):
    _name = 'biblical.game.book'
    _description = 'Livre de la Bible'

    name = fields.Char(string='Nom du Livre', required=True)
    book_number = fields.Integer(string='Numéro du Livre')

class BibleChapter(models.Model):
    _name = 'biblical.game.chapter'
    _description = 'Chapitre de la Bible'

    name = fields.Char(string='Chapitre', compute='_compute_name', store=True)
    chapter_number = fields.Integer(string='Numéro du Chapitre', required=True)
    book_id = fields.Many2one('biblical.game.book', string='Livre', required=True)

    @api.depends('book_id', 'chapter_number')
    def _compute_name(self):
        for chapter in self:
            chapter.name = f"{chapter.book_id.name} {chapter.chapter_number}"

class BibleVerse(models.Model):
    _name = 'biblical.game.verse'
    _description = 'Verset de la Bible'

    name = fields.Char(string='Nom du Verset', compute='_compute_name', store=True)
    text = fields.Text(string='Texte du Verset', required=True)
    chapter_id = fields.Many2one('biblical.game.chapter', string='Chapitre', required=True)
    verse_number = fields.Integer(string='Numéro du Verset', required=True)

    @api.depends('chapter_id', 'verse_number')
    def _compute_name(self):
        for verse in self:
            verse.name = f"{verse.chapter_id.name}:{verse.verse_number}"
