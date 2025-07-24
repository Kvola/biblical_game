from odoo import api, models, fields, _
from odoo.exceptions import ValidationError

class BiblicalGameSettings(models.Model):
    _name = 'biblical.game.settings'
    _inherit = ['mail.thread', 'mail.activity.mixin', 'image.mixin']
    _description = 'Paramètres du Jeu Biblique'
    _rec_name = 'name'
    
    # Singleton pattern - un seul enregistrement de configuration
    _sql_constraints = [
        ('unique_settings', 'EXCLUDE (id WITH <>)', 'Un seul enregistrement de paramètres autorisé')
    ]

    name = fields.Char(
        string='Nom', 
        default="Paramètres du Jeu Biblique", 
        required=True,
        tracking=True
    )
    book_ids = fields.Many2many(
        'biblical.game.book', 
        string='Livres Sélectionnés',
        help="Livres bibliques utilisés dans le jeu",
        tracking=True
    )
    timer_duration = fields.Integer(
        string='Durée du Compteur (secondes)', 
        default=30, 
        required=True,
        help="Durée en secondes pour le compteur avant d'afficher un message.",
        tracking=True
    )
    active = fields.Boolean(
        string='Actif', 
        default=True,
        tracking=True
    )
    
    # Nouveaux champs pour améliorer la configuration
    max_questions_per_game = fields.Integer(
        string='Questions par partie',
        default=10,
        help="Nombre maximum de questions par partie"
    )
    difficulty_level = fields.Selection([
        ('easy', 'Facile'),
        ('medium', 'Moyen'),
        ('hard', 'Difficile')
    ], string='Niveau de difficulté', default='medium')
    
    allow_hints = fields.Boolean(
        string='Autoriser les indices',
        default=True,
        help="Permet aux joueurs d'obtenir des indices"
    )

    @api.constrains("timer_duration")
    def _check_timer_duration(self):
        """Validation de la durée du timer"""
        for record in self:
            if record.timer_duration <= 0:
                raise ValidationError(_("La durée doit être strictement positive !"))
            if record.timer_duration > 300:  # 5 minutes max
                raise ValidationError(_("La durée ne peut pas dépasser 5 minutes (300 secondes)"))

    @api.constrains("max_questions_per_game")
    def _check_max_questions(self):
        """Validation du nombre de questions"""
        for record in self:
            if record.max_questions_per_game <= 0:
                raise ValidationError(_("Le nombre de questions doit être positif"))
            if record.max_questions_per_game > 100:
                raise ValidationError(_("Le nombre de questions ne peut pas dépasser 100"))

    @api.model
    def get_settings(self):
        """Récupère les paramètres de jeu (singleton)"""
        settings = self.search([], limit=1)
        if not settings:
            settings = self.create({})
        return settings

    def get_selected_books_count(self):
        """Retourne le nombre de livres sélectionnés"""
        return len(self.book_ids)

    @api.model
    def setup_book_associations(self):
        """Associe automatiquement les livres aux configurations"""
        # Nouveau Testament (livres 40-66)
        nt_books = self.env['biblical.game.book'].search([('book_number', '>=', 40)])
        nt_settings = self.env.ref('biblical_game.new_testament_settings')
        nt_settings.book_ids = nt_books
        
        # Ancien Testament (livres 1-39)
        ot_books = self.env['biblical.game.book'].search([('book_number', '<=', 39)])
        ot_settings = self.env.ref('biblical_game.old_testament_settings')
        ot_settings.book_ids = ot_books
        
        # Etc...

# biblical_game_book.py
class BibleBook(models.Model):
    _name = 'biblical.game.book'
    _description = 'Livre de la Bible'
    _order = 'book_number'
    _rec_name = 'name'

    name = fields.Char(string='Nom du Livre', required=True, index=True)
    book_number = fields.Integer(string='Numéro du Livre', required=True, index=True)
    chapter_count = fields.Integer(string='Nombre de chapitres', compute='_compute_chapter_count', store=True)
    verse_count = fields.Integer(string='Nombre de versets', compute='_compute_verse_count', store=True)
    testament = fields.Selection([
        ('old', 'Ancien Testament'),
        ('new', 'Nouveau Testament')
    ], string='Testament', compute='_compute_testament', store=True)
    
    # Relations
    chapter_ids = fields.One2many('biblical.game.chapter', 'book_id', string='Chapitres')
    
    @api.depends('chapter_ids')
    def _compute_chapter_count(self):
        for book in self:
            book.chapter_count = len(book.chapter_ids)

    @api.depends('chapter_ids.verse_ids')
    def _compute_verse_count(self):
        for book in self:
            book.verse_count = sum(chapter.verse_count for chapter in book.chapter_ids)

    @api.depends('book_number')
    def _compute_testament(self):
        """Détermine le testament selon le numéro du livre"""
        for book in self:
            book.testament = 'old' if book.book_number <= 39 else 'new'

    _sql_constraints = [
        ('unique_book_number', 'UNIQUE(book_number)', 'Le numéro de livre doit être unique'),
        ('unique_book_name', 'UNIQUE(name)', 'Le nom du livre doit être unique')
    ]

# biblical_game_chapter.py
class BibleChapter(models.Model):
    _name = 'biblical.game.chapter'
    _description = 'Chapitre de la Bible'
    _order = 'book_id, chapter_number'
    _rec_name = 'name'

    name = fields.Char(string='Chapitre', compute='_compute_name', store=True)
    chapter_number = fields.Integer(string='Numéro du Chapitre', required=True, index=True)
    book_id = fields.Many2one('biblical.game.book', string='Livre', required=True, ondelete='cascade', index=True)
    verse_count = fields.Integer(string='Nombre de versets', compute='_compute_verse_count', store=True)
    
    # Relations
    verse_ids = fields.One2many('biblical.game.verse', 'chapter_id', string='Versets')

    @api.depends('book_id', 'chapter_number')
    def _compute_name(self):
        for chapter in self:
            if chapter.book_id:
                chapter.name = f"{chapter.book_id.name} {chapter.chapter_number}"
            else:
                chapter.name = f"Chapitre {chapter.chapter_number}"

    @api.depends('verse_ids')
    def _compute_verse_count(self):
        for chapter in self:
            chapter.verse_count = len(chapter.verse_ids)

    _sql_constraints = [
        ('unique_chapter_per_book', 'UNIQUE(book_id, chapter_number)', 
         'Le numéro de chapitre doit être unique par livre')
    ]


# biblical_game_verse.py
class BibleVerse(models.Model):
    _name = 'biblical.game.verse'
    _description = 'Verset de la Bible'
    _order = 'chapter_id, verse_number'
    _rec_name = 'name'

    name = fields.Char(string='Référence', compute='_compute_name', store=True, index=True)
    text = fields.Text(string='Texte du Verset', required=True)
    chapter_id = fields.Many2one('biblical.game.chapter', string='Chapitre', required=True, ondelete='cascade', index=True)
    verse_number = fields.Integer(string='Numéro du Verset', required=True, index=True)
    word_count = fields.Integer(string='Nombre de mots', compute='_compute_word_count', store=True)
    
    # Champs pour le jeu
    difficulty_score = fields.Float(string='Score de difficulté', compute='_compute_difficulty_score', store=True)
    is_popular = fields.Boolean(string='Verset populaire', default=False, help="Verset bien connu")

    @api.depends('chapter_id', 'verse_number')
    def _compute_name(self):
        for verse in self:
            if verse.chapter_id:
                verse.name = f"{verse.chapter_id.name}:{verse.verse_number}"
            else:
                verse.name = f"Verset {verse.verse_number}"

    @api.depends('text')
    def _compute_word_count(self):
        for verse in self:
            verse.word_count = len(verse.text.split()) if verse.text else 0

    @api.depends('word_count', 'is_popular')
    def _compute_difficulty_score(self):
        """Calcule un score de difficulté basé sur la longueur et la popularité"""
        for verse in self:
            base_score = verse.word_count * 0.1
            if verse.is_popular:
                base_score *= 0.8  # Les versets populaires sont plus faciles
            verse.difficulty_score = base_score

    _sql_constraints = [
        ('unique_verse_per_chapter', 'UNIQUE(chapter_id, verse_number)', 
         'Le numéro de verset doit être unique par chapitre')
    ]
