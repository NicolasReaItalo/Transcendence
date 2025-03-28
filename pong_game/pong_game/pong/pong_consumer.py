import json
import logging
import jwt
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.consumer import SyncConsumer
from .pong_game import Direction, PongEngine
from django.http import HttpResponse
from http import HTTPStatus
from django.conf import settings

log = logging.getLogger(__name__)

class PlayerConsumer(AsyncWebsocketConsumer):
    pong = dict.fromkeys(['name','game'])
    game_name = None
    for game in pong:
        pong[game] = None

    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode())
        token = query_params.get('token', [None])[0]
        if token:
            user_info = self.decode_token(token)
            if user_info:
                # Decode the token to get user_id and nickname
                self.user_id = user_info['user_id']
                self.nickname = user_info['nickname']
            else:
                await self.close()
                return HttpResponse("Invalid Token", status=HTTPStatus.UNAUTHORIZED) 
        else:
            await self.close()
            return HttpResponse("Token not provided", status=HTTPStatus.BAD_REQUEST)
        pong_game = 'pong_game'
        self.group_name = pong_game
        self.game = None

        # Suscribe to the game group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the game group
        log.debug(f"[pong.consumer] Player {self.user_id} disconnected")
        if self.game_name in self.pong:
            self.pong[self.game_name].engine.player_leave(self.user_id)
        # if self.user_id:
        #     await self.channel_layer.send(
        #         "game_engine",
        #         {"type": "player_leave", "user_id": self.user_id},
        #     )
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def create(self, data):
        data = data.get("data")
        game_name = data.get("name")

        if not game_name:
            log.error("[pong.consumer] Game name not provided")
            return  
        self.group_name = f"game_{game_name}"        
        if game_name not in self.pong:
            self.pong[game_name] = PongConsumer(group = self.group_name)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        log.info(f"[pong.consumer] Game created :{game_name}")
 
    async def receive(self, text_data=None, bytes_data=None):
        content = json.loads(text_data)
        msg_type = content.get("type")
        msg_data = content.get("data")
        log.debug("[pong.consumer] Received message: %s -- %s", msg_type, msg_data)
        if msg_type == "join":
            await self.join(msg_data)
        elif msg_type == "move_paddle":
            await self.move_paddle(msg_data) 
        elif msg_type == "create":
            await self.create(msg_data)
        elif msg_type == "ready":
            await self.ready()
        elif msg_type == "online":
            await self.online()
        elif msg_type == "giveup":
            log.debug("[pong.consumer] Player %s gave up with message %s", self.user_id, msg_data)
            if self.game_name in self.pong:
                self.pong[self.game_name].engine.player_leave(self.user_id)
        else:
            log.warning("[pong.consumer] Unknown message type: %s", msg_type)

    async def join(self, data):
        userid = data.get("userid")
        game_name = data.get("name")
        self.game_name = game_name
        self.group_name = f"game_{game_name}"  # Create a unique group name for the game
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        if game_name not in self.pong:
            self.pong[game_name] = PongConsumer(self.group_name)
        await self.pong[game_name].player_join({"userid": userid})
        
    async def move_paddle(self, data):
        if not self.user_id:
            log.error("[pong.consumer] User not correctly joined")
            return
        
        log.debug("[pong.consumer] User %s moved paddle", self.user_id)
        direction = data.get("direction")
        if self.game_name in self.pong:
            self.pong[self.game_name].engine.get_player_paddle_move(self.user_id, direction)


    async def ready(self):
        if not self.user_id:
            log.error("[pong.consumer] User not correctly joined")
            return
        log.debug("[pong.consumer] User %s is ready", self.user_id)
        if self.game_name in self.pong:
            self.pong[self.game_name].engine.player_ready(self.user_id)
    
    async def online(self):
        if not self.user_id:
            log.error("User not correctly joined")
            return
        log.info("[pong.consumer] User %s is online", self.user_id)
        if self.game_name in self.pong:
            await self.pong[self.game_name].engine.broadcast_starting_state()
        else:
            log.error("[pong.consumer] Game %s not found", self.game_name)

    async def game_update(self, event):
        log.debug("[pong.consumer] Game update: %s", event)
        await self.send(text_data=json.dumps(event))

    
    async def countdown(self, event):
        log.debug("[pong.consumer] Game update: %s", event)
        await self.send(text_data=json.dumps(event))
    
    async def game_init(self, event):
        log.debug("[pong.consumer] Game update: %s", event)
        await self.send(text_data=json.dumps(event))
    
    async def game_over(self, event):
        log.debug("[pong.consumer] Game update: %s", event)
        await self.send(text_data=json.dumps(event))
        if self.game_name in self.pong:
            self.pong.pop(self.game_name, None)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
            
    async def game_final_scores(self, event):
        game_over = event["game_over"]
        await self.send(text_data=json.dumps(game_over))
    
    def decode_token(self, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            log.error("[pong.consumer] Token expired")
        except jwt.InvalidTokenError:
            log.error("[pong.consumer] Invalid token")
        return None

from threading import Lock
import asyncio

class PongConsumer(SyncConsumer):
    def __init__(self, group, *args, **kwargs):
        log.info("[pong.consumer] Game Engine Consumer initialized: %s %s", args, kwargs)
        super().__init__(*args, **kwargs)
        self.group_name = group
        self.engine = PongEngine(self.group_name)
        self.engine.start()
        self.players = []
        self.lock = Lock()

    async def player_join(self, event):
        if len(self.players) >= 2:
            log.error("[pong.consumer] Game is full")
            return
        
        log.info("[pong.consumer] PongConsumer - Player joined: %s", event.get("userid"))
        self.players.append(event["userid"])

        await self.engine.add_player(event["userid"])
        
        if len(self.players) == 2:
            log.info("[pong.consumer] Starting game")
            self.engine.run()


    async def infos(self):
        await asyncio.sleep(0.2)
        log.debug("[pong.consumer] Sending game infos")
        if not self.game_name:
            log.error("[pong.consumer] Game name not set")
            return
        state = self.engine.state
        response = {
            "type": "init",
            "player_left": {
                "playername": state.player_left.playername,
                "score": state.player_left.score,
            },
            "player_right": {
                "playername": state.player_right.playername,
                "score": state.player_right.score,
            },
        }
        await self.send(text_data=json.dumps(response))

    
    def player_move_paddle(self, event):
        log.debug("[pong.consumer] Move paddle: %s", event)
        direction = event.get("direction")
        try:
            direction = Direction[direction]
        except KeyError:
            log.error("[pong.consumer] Invalid direction")
            return
        self.engine.get_player_paddle_move(event["userid"], direction)
