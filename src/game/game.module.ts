import { Module } from '@nestjs/common'
import { GameGateway } from './game.gateway'
import { GameService } from './game.service'
import { LobbyService } from './lobby.service'

@Module ({
    providers: [GameGateway, LobbyService, GameService],
    //controllers: [GameService, LobbyService]
})

export class GameModule {}