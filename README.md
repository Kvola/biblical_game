# 📖 Biblical Game - Module Odoo

Un module Odoo proposant un jeu interactif basé sur la Bible Louis Segond, alliant spiritualité et technologie moderne.

## 🎮 Description

**Biblical Game** est un module Odoo développé par **Kavola DIBI** qui transforme l'apprentissage biblique en une expérience ludique et interactive. Basé sur la traduction Louis Segond, ce jeu permet aux utilisateurs d'approfondir leurs connaissances des Écritures saintes tout en s'amusant.

## ✨ Fonctionnalités principales

- 🎯 **Jeu interactif** basé sur les textes bibliques Louis Segond
- 📚 **Gestion des références bibliques** avec affichage dynamique
- 🏆 **Système de progression** par étapes/niveaux
- 🎨 **Interface web moderne** intégrée à Odoo
- ⚙️ **Panneau de configuration** pour personnaliser l'expérience
- 📧 **Intégration email** pour partager les résultats
- 📊 **Suivi UTM** pour analyser l'engagement

## 🛠️ Architecture technique

### Technologies utilisées
- **Framework :** Odoo 16+ (Python/XML/JavaScript)
- **Frontend :** HTML5, CSS3, JavaScript ES6
- **Base de données :** PostgreSQL (via Odoo ORM)
- **Styling :** Font Awesome 5.15.4, CSS personnalisé
- **Intégrations :** Module Website, Mail, UTM d'Odoo

### Dépendances Odoo
- `base` - Module de base Odoo
- `website` - Interface web publique
- `mail` - Système de messagerie
- `utm` - Suivi des campagnes marketing

## 🚀 Installation

### Prérequis
- Odoo 16.0 ou version supérieure
- PostgreSQL 12+
- Python 3.8+
- Accès administrateur à l'instance Odoo

### Installation du module

1. **Cloner le dépôt dans le répertoire addons d'Odoo :**
```bash
cd /path/to/odoo/addons
git clone https://github.com/Kvola/biblical_game.git
```

2. **Redémarrer le serveur Odoo :**
```bash
sudo systemctl restart odoo
# ou
./odoo-bin -u biblical_game -d votre_base_de_donnees
```

3. **Activer le module :**
   - Aller dans **Applications**
   - Rechercher "Biblical Game"
   - Cliquer sur **Installer**

4. **Configuration initiale :**
   - Aller dans **Biblical Game > Configuration**
   - Configurer les paramètres du jeu selon vos préférences

## 🎯 Utilisation

### Interface d'administration
- **Menu principal :** `Biblical Game` dans la barre de navigation Odoo
- **Gestion Bible :** Administrer les versets et références
- **Étapes du jeu :** Configurer les niveaux et défis
- **Paramètres :** Personnaliser l'expérience utilisateur

### Interface publique
- Accéder au jeu via l'URL : `votre-domaine.com/biblical-game`
- Interface responsive accessible depuis n'importe quel appareil
- Progression sauvegardée automatiquement

## 📁 Structure du module

```
biblical_game/
├── __manifest__.py              # Manifeste du module
├── __init__.py                 # Initialisation Python
├── models/                     # Modèles de données Odoo
│   ├── __init__.py
│   ├── bible.py               # Modèle des données bibliques
│   ├── bible_settings.py     # Configuration du jeu
│   └── biblical_game_stage.py # Étapes/niveaux du jeu
├── views/                     # Vues XML Odoo
│   ├── bible_views.xml        # Interface gestion Bible
│   ├── bible_settings_views.xml # Paramètres
│   ├── biblical_game_stage_views.xml # Gestion étapes
│   ├── menu_views.xml         # Structure des menus
│   └── templates.xml          # Templates web
├── security/                  # Sécurité et droits d'accès
│   └── ir.model.access.csv    # Permissions des modèles
├── static/src/                # Ressources statiques
│   ├── css/
│   │   ├── biblical_game.css  # Styles principaux
│   │   └── ebng_biblical_game.css # Styles étendus
│   └── js/
│       ├── biblical_game.js   # Logique principale
│       ├── ebng_biblical_game.js # Fonctions étendues
│       └── display_reference.js # Affichage références
└── README.md                  # Cette documentation
```

## ⚙️ Configuration

### Paramètres disponibles
- **Niveau de difficulté :** Facile, Moyen, Difficile
- **Thèmes bibliques :** Ancien Testament, Nouveau Testament, Paraboles
- **Affichage des références :** Activation/désactivation
- **Système de points :** Configuration des scores

### Personnalisation
Le module peut être étendu en :
- Ajoutant de nouvelles questions dans les modèles
- Modifiant les templates pour changer l'apparence
- Créant de nouveaux types d'étapes de jeu

## 🎨 Interface utilisateur

### Fonctionnalités frontend
- **Design responsive** adapté à tous les écrans
- **Animations CSS** pour une expérience fluide
- **Icônes Font Awesome** pour une interface moderne
- **Affichage dynamique** des références bibliques
- **Progression visuelle** des étapes accomplies

## 📖 Base biblique

Le jeu s'appuie sur :
- **Version Louis Segond** de la Bible
- **Ancien et Nouveau Testament** complets
- **Références précises** avec chapitres et versets
- **Thématiques variées** : histoire, prophéties, paraboles, enseignements

## 🤝 Contribution

### Comment contribuer
1. **Fork** le projet sur GitHub
2. Créez une **branche feature** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Développez** votre fonctionnalité en respectant les standards Odoo
4. **Testez** sur une instance Odoo de développement
5. **Committez** : `git commit -m "Ajout: nouvelle fonctionnalité"`
6. **Push** : `git push origin feature/nouvelle-fonctionnalite`
7. Créez une **Pull Request**

### Standards de développement
- Respect des conventions Odoo (PEP8, structure MVC)
- Documentation des nouvelles fonctionnalités
- Tests unitaires recommandés
- Traductions multilingues encouragées

## 🐛 Support et bugs

### Rapporter un problème
- **GitHub Issues :** [Signaler un bug](https://github.com/Kvola/biblical_game/issues)
- Inclure la version d'Odoo utilisée
- Décrire les étapes de reproduction
- Fournir les logs d'erreur si disponibles

### Logs utiles
```bash
# Logs Odoo avec debug activé
./odoo-bin --log-level=debug --log-handler=odoo.addons.biblical_game:DEBUG
```

## 📋 Roadmap

### Version 1.1 (prévue)
- [ ] Mode multijoueur
- [ ] Système d'achievements avancé
- [ ] Export des statistiques
- [ ] API REST pour intégrations externes

### Version 1.2 (prévue)
- [ ] Support multilingue complet
- [ ] Application mobile compagnon
- [ ] Intégration réseaux sociaux
- [ ] Parcours d'apprentissage personnalisé

## 📜 Licence

Ce module est distribué sous licence **LGPL-3.0** (compatible avec Odoo).

## 👨‍💻 Auteur

**Kavola DIBI**
- GitHub: [@Kvola](https://github.com/Kvola)
- Module Odoo Apps: [Profil développeur]

## 🙏 Remerciements

- **Communauté Odoo** pour le framework et les outils
- **Traduction Louis Segond** pour la base biblique authentique
- **Contributeurs** qui enrichissent le projet
- **Testeurs** qui assurent la qualité du module

## 📞 Contact

- **Issues GitHub :** Questions techniques et bugs
- **Odoo Community :** Discussions sur le forum Odoo
- **Email professionnel :** [Votre email si souhaité]

## 🎯 Mission

Rendre l'étude biblique accessible, interactive et enrichissante grâce aux technologies modernes, tout en préservant l'authenticité et la profondeur des Écritures saintes.

---

*"Que ce livre de la loi ne s'éloigne point de ta bouche; médite-le jour et nuit, pour agir fidèlement selon tout ce qui y est écrit; car c'est alors que tu auras du succès dans tes entreprises, c'est alors que tu réussiras."* - Josué 1:8 (Louis Segond)
