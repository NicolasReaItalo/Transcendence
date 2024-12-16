from django.contrib import admin
from django.urls import path, include

from pong.views import pong_view, test

import logging





logger = logging.getLogger(__name__)
logger.error("url")

def view500(request):
    logger.error(request)

urlpatterns = [
    path('admin/', admin.site.urls),
	# path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
	# # path('pong/start/', StartGameView.as_view(), name='start_game'),
	# # path('pong/move/', MovePaddle.as_view(), name='move_paddle'),
	# # path('pong/state/', GameState.as_view(), name='game_state'),
    # path('pong/', pong_view, name='pong'),
    path('', test.as_view(), name='test'),
]

handler500=view500

logger.error("url2")