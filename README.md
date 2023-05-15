# **42 Pong**

## **ft_transcendence**

### **Project Overview**

ft_transcendence is final inner-circle project of the 42 cursus.
This website is SPA(Single Page Application) that users can play Pong with others.
It provides a cool UI, chat, and real-time multiplayer online games.

### **Participants**

**Frontend**

- [keokim](https://github.com/keonwoo98)
- [dkim2](https://github.com/u-lo-l)

**Backend**

- [minjkim2](https://github.com/minjune8506)
- [junyopar](https://github.com/maindishes)

### **Period**

**2023.02.09 ~ 2023.05.05**

### **Technologies and Libraries Used**

**Frontend**

- Typescript
- React
- React-router-dom
- ReactQuery
- Socket.io
- Styled-component
- Git
- Docker
- Vite
- Figma

**Backend**

- Typescript
- NestJS
- PostgreSQL
- TypeORM
- Jest
- Swagger
- Socket.io
- AWS EC2
- Docker
- Git

### **Main Features**

**User**

- The user can login using the OAuth system of 42 intranet.
- The user can choose a unique nickname that will be displayed on the website. (Nickname can be updated)
- The user can update an avatar. Default avatar is the avatar from 42 intranet.
- The user can enable two-factor authentication by Google Authenticator.
- The user can add, delete, block other users as friends.
- The user can see friend's current status. (online, offline, in a game)
- Stats(nickname, avatar, wins and losses, achievements, add / delete / block friend button) are displayed on the user profile.
- The user can delete their account.

**Chat**

- The user can create channels(chat rooms) that can be either public or protected by a password.
- The user can send direct messages to other users.
- The user can block other users. This way, they will see no more messages from the account they blocked.
- The user who has created a new channel is automatically set as the channel owner until they leave it.
- The channel owner can set a password required to access the channel, change it, and also remove it.
- The channel owner is a channel administrator. They can set other users as administrators.
- A user who is an administrator of a channel can kick, ban or mute other users, but not the channel owners.
- The user can access other user's profiles through the chat interface.

**Game**

- The user can play a live Pong game versus another player directly on the website.
- There is a matchmaking system: the user can join a queue until they get automatically matched with someone else.
- The user can invite a friend to play Pong game together.
- The user can select a normal version or chose version of the game.
- There is a spectator mode. The user can watch friends' live games.

### **Page Images**

**Login**
![](./imgs/1.%20login.png)
**Sign up**
![](./imgs/2.%20signup.png)
**Two-factor authentication**
![](./imgs/3.%202FA.png)
**Home**
![](./imgs/4.%20home.png)
**User setting modal**
![](./imgs/5.%20setting%20modal.png)
**DM**
![](./imgs/6.%20DM.png)
**Channel**
![](./imgs/7.%20Channel.png)
**Game lobby**
![](./imgs/8.%20game%20lobby.png)
**Playing pong game**
![](./imgs/9.%20playing%20game.png)

**Installation and Running Instructions**

- Clone repository from [this link](https://github.com/42-TRANSENDENCE/PongGame).
- Add `.env` file.
- Run `git submodule init`.
- Run `git submodule update --recursive`.
- Run `make` or `docker-compose up --build`.
