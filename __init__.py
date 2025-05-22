from . import models
def post_init_hook(env):
    env['base.module.preload']._preload_bible_data()
from . import controllers

