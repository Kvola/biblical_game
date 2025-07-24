{
    "name": "Biblical Game",
    "version": "1.0",
    "author": "Kavola DIBI",
    "category": "Game",
    "summary": "Un jeu basé sur la Bible Louis Segond",
    "depends": [
        "base",
        "website",
        "mail",
        "utm",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/bible_views.xml",
        "views/bible_settings_views.xml",
        'views/biblical_game_stage_views.xml',
        "views/templates.xml",
        "views/user_guide_templates.xml",
        "views/biblical_game_session_views.xml",
        "views/user_guide_templates.xml",
        "views/menu_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "biblical_game/static/src/js/user_menu.js",
        ],
        "web.assets_frontend": [
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
            "biblical_game/static/src/css/biblical_game.css",
            "biblical_game/static/src/js/biblical_game.js",
        ],
    },
    "post_init_hook": "post_init_hook",
    "application": True,
}
