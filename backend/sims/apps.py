from django.apps import AppConfig


class SimsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sims'
    verbose_name = 'SIMS Core'

    def ready(self):
        import sims.signals  # noqa: F401
