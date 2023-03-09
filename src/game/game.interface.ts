import { Socket } from "socket.io";

export interface Vector2D {
    x: number,
    y: number
};

interface Ball {
    pos : Vector2D;
    vel : Vector2D;
};

export enum State {
    WAIT,
    START,
    INGAME,
    END
};

interface Player {
    socketid: Socket;
    username: string;
    y_pos : number;
}

export interface Gameinfo {
    score: Array<number>;
    state: State;
    ball: Ball;
    p1 : Player;
    p2 : Player;
}

export interface Roominfo {
    roomid : string;
    gameinfo : Gameinfo;
    watchers : Array<string>;
};