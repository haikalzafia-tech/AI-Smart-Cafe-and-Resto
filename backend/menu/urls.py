from rest_framework.routers import SimpleRouter

from .views import MenuViewSet

router = SimpleRouter()
router.register("menu", MenuViewSet, basename="menu")

urlpatterns = router.urls
