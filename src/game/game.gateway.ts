import * as WS from '@nestjs/websockets'
import { Socket, Namespace } from "socket.io";
import { GameService } from './game.service';
import { LobbyService } from './lobby.service';

@WS.WebSocketGateway({namespace: '/game'})
export class GameGateway
implements WS.OnGatewayInit
{
    constructor(
        private readonly ingame : GameService,
        private readonly lobby : LobbyService,
    ){}

    @WS.WebSocketServer() nsp: Namespace;

    games : Array<string> = [];

    afterInit() {
        console.log(`game : 게이트웨이 생성됨✅`);
    }

    handleConnection(@WS.ConnectedSocket() socket: Socket) {
        console.log(`game : ${socket.id} 연결 됨`);
    }
    
    handleDisconnect(@WS.ConnectedSocket() socket: Socket) {
        this.lobby.quit_queue(socket);
        this.ingame.quitGame(this.nsp, socket.id);
        console.log(`game : ${socket.id} 연결 끊어짐.`);
    }

    /*=========================*/
    /*                         */
    /*        GameLobby        */
    /*                         */
    /*=========================*/

    @WS.SubscribeMessage('invite')
    handleInviteEvent(
      @WS.ConnectedSocket() socket: Socket,
      @WS.MessageBody() userinfo: string,
    ) {
        this.lobby.invite_to_game(socket, userinfo);
    }

    @WS.SubscribeMessage('watch')
    handleWatchEvent(
      @WS.ConnectedSocket() socket: Socket,
      @WS.MessageBody() userinfo: string,
    ) {
        this.lobby.spectate_game(socket, userinfo);
    }

    @WS.SubscribeMessage('join_queue')
    handleQueueEvent(
      @WS.ConnectedSocket() socket: Socket,
    ) {
        if (this.lobby.join_queue(this.nsp, socket))
            console.log("방 만들어짐")
    }

    @WS.SubscribeMessage('quit_queue')
    handleQuitQueueEvent(
      @WS.ConnectedSocket() socket: Socket,
    ) {
        this.lobby.quit_queue(socket);
    }
    
    /*=========================*/
    /*                         */
    /*        In  Game         */
    /*                         */
    /*=========================*/

    @WS.SubscribeMessage('ready')
    handlePlayerReady(
        @WS.ConnectedSocket() socket: Socket,
        @WS.MessageBody() roomId : string
    ){
        this.ingame.handlePlayerReady(this.nsp, roomId, socket.id);
    }

    @WS.SubscribeMessage('quit_game')
    handleQuitGame(
        @WS.ConnectedSocket() socket: Socket,
    ){
        this.ingame.quitGame(this.nsp, socket.id);
    }

    @WS.SubscribeMessage('keypress')
    handleKeyPressed(
      @WS.ConnectedSocket() socket: Socket,
      @WS.MessageBody() payload : any
    ) {
        const roomId : string = payload[0];
        const keyCode : string = payload[1];
        this.ingame.handleKeyPressed(roomId, socket.id, keyCode)
    }

    @WS.SubscribeMessage('keyrelease')
    handleKeyReleased(
      @WS.ConnectedSocket() socket: Socket,
      @WS.MessageBody() payload : any
    ) {
        const roomId : string = payload[0];
        const keyCode : string = payload[1];
        this.ingame.handleKeyReleased(roomId, socket.id, keyCode)
    }

};