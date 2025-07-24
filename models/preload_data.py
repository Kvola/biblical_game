from odoo import models, api
import json
import logging
from collections import defaultdict

_logger = logging.getLogger(__name__)

class PreloadData(models.AbstractModel):
    _name = "base.module.preload"

    @api.model
    def _preload_bible_data(self):
        """Charge la Bible depuis un fichier JSON au moment de l'installation."""
        try:
            # 1. Chargement du fichier JSON
            with open('/mnt/backup/bible_louis_segond.json', 'r', encoding='utf-8') as file:
                bible_data = json.load(file)
            
            # 2. Récupération des modèles
            Book = self.env['biblical.game.book']
            Chapter = self.env['biblical.game.chapter']
            Verse = self.env['biblical.game.verse']
            
            # 3. Préparation des structures de données
            books_to_create = {}
            chapters_to_create = defaultdict(set)  # {book_name: {chapter_numbers}}
            verses_to_create = []
            
            # 4. Analyse des données pour identifier ce qui doit être créé
            for verse in bible_data['verses']:
                book_name = verse['book_name']
                chapter_num = verse['chapter']
                
                # Collecter les livres uniques
                if book_name not in books_to_create:
                    books_to_create[book_name] = {
                        'name': book_name,
                        'book_number': verse['book']
                    }
                
                # Collecter les chapitres uniques par livre
                chapters_to_create[book_name].add(chapter_num)
                
                # Préparer les versets (sera complété après création des chapitres)
                verses_to_create.append(verse)
            
            # 5. Création en lot des livres
            _logger.info(f"Création de {len(books_to_create)} livres...")
            books_data = list(books_to_create.values())
            created_books = Book.create(books_data)
            
            # Mapping nom du livre -> record
            book_map = {book.name: book for book in created_books}
            
            # 6. Création en lot des chapitres
            chapters_data = []
            chapter_key_map = {}  # {(book_name, chapter_num): futur_index}
            
            for book_name, chapter_numbers in chapters_to_create.items():
                book_id = book_map[book_name].id
                for chapter_num in chapter_numbers:
                    chapter_key_map[(book_name, chapter_num)] = len(chapters_data)
                    chapters_data.append({
                        'chapter_number': chapter_num,
                        'book_id': book_id
                    })
            
            _logger.info(f"Création de {len(chapters_data)} chapitres...")
            created_chapters = Chapter.create(chapters_data)
            
            # 7. Création en lot des versets
            verses_data = []
            for verse in verses_to_create:
                chapter_index = chapter_key_map[(verse['book_name'], verse['chapter'])]
                chapter_id = created_chapters[chapter_index].id
                
                verses_data.append({
                    'verse_number': verse['verse'],
                    'text': verse['text'],
                    'chapter_id': chapter_id
                })
            
            # Création par batch pour éviter les limites mémoire
            batch_size = 1000
            total_verses = len(verses_data)
            _logger.info(f"Création de {total_verses} versets en lots de {batch_size}...")
            
            for i in range(0, total_verses, batch_size):
                batch = verses_data[i:i + batch_size]
                Verse.create(batch)
                _logger.info(f"Lot {i//batch_size + 1}/{(total_verses-1)//batch_size + 1} créé")
            
            _logger.info("Données bibliques chargées avec succès.")
            
        except FileNotFoundError:
            _logger.error("Fichier bible_louis_segond.json non trouvé")
            raise
        except json.JSONDecodeError as e:
            _logger.error(f"Erreur de parsing JSON: {e}")
            raise
        except Exception as e:
            _logger.error(f"Erreur lors du chargement des données bibliques: {e}")
            raise

    @api.model
    def _preload_bible_data_with_transaction_control(self):
        """Version avec contrôle transactionnel pour de très gros volumes."""
        try:
            with open('/mnt/backup/bible_louis_segond.json', 'r', encoding='utf-8') as file:
                bible_data = json.load(file)
            
            # Utilisation de savepoint pour pouvoir faire du rollback partiel si nécessaire
            with self.env.cr.savepoint():
                self._preload_bible_data()
                
        except Exception as e:
            _logger.error(f"Erreur avec rollback automatique: {e}")
            raise