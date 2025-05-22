from odoo import models, api
import json
import logging

_logger = logging.getLogger(__name__)

class PreloadData(models.AbstractModel):
    _name = "base.module.preload"

    @api.model
    def _preload_bible_data(self):
        """Charge la Bible depuis un fichier JSON au moment de l'installation."""
        with open('/mnt/backup/bible_louis_segond.json', 'r') as file:
            bible_data = json.load(file)
        
        Book = self.env['biblical.game.book']
        Chapter = self.env['biblical.game.chapter']
        Verse = self.env['biblical.game.verse']
        books = {}

        for verse in bible_data['verses']:
            # Gestion des Livres
            if verse['book_name'] not in books:
                books[verse['book_name']] = Book.create({
                    'name': verse['book_name'],
                    'book_number': verse['book'],
                })

            # Gestion des Chapitres
            chapter = Chapter.search([
                ('book_id', '=', books[verse['book_name']].id),
                ('chapter_number', '=', verse['chapter'])
            ], limit=1)
            if not chapter:
                chapter = Chapter.create({
                    'chapter_number': verse['chapter'],
                    'book_id': books[verse['book_name']].id
                })

            # Gestion des Versets
            Verse.create({
                'verse_number': verse['verse'],
                'text': verse['text'],
                'chapter_id': chapter.id
            })
        _logger.info("Données bibliques chargées avec succès.")
