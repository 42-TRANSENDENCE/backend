import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody } from "@nestjs/websockets";
import { Server } from "socket.io";


@WebSocketGateway()
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('send_message')
    listenForMessage(@MessageBody() data: string) {
        this.server.sockets.emit('recieve_message', data)
    }
}