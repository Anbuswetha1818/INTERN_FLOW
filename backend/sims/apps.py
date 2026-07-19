from django.apps import AppConfig


class SimsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sims'
    verbose_name = 'SIMS Core'

    def ready(self):
        import sims.signals  # noqa: F401
        
        # Auto-seed database on first startup if empty (e.g. on Render)
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username="ADM0001").exists():
                import sys
                from pathlib import Path
                backend_dir = Path(__file__).resolve().parent.parent
                if str(backend_dir) not in sys.path:
                    sys.path.insert(0, str(backend_dir))
                import init_db  # noqa: F401
        except Exception as e:
            print(f"Auto-seed check note: {e}")
