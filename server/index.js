/**
 * 掼蛋游戏服务器
 * Express + Socket.IO
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { RoomManager } = require('./game/room');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（生产环境）
app.use(express.static(path.join(__dirname, '../client/dist')));

// 房间管理器
const roomManager = new RoomManager();

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.rooms.size });
});

// 创建房间
app.post('/api/room/create', (req, res) => {
  const { nickname } = req.body;
  
  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: '昵称不能为空' });
  }

  const room = roomManager.createRoom(req.socket.remoteAddress);
  
  // 房主自动加入
  const result = room.addPlayer(req.socket.remoteAddress, nickname.trim());
  
  if (!result.success) {
    roomManager.deleteRoom(room.id);
    return res.status(400).json({ error: result.error });
  }

  res.json({
    roomId: room.id,
    playerId: result.playerId,
    inviteUrl: `${req.protocol}://${req.get('host')}/game/${room.id}`
  });
});

// 加入房间
app.post('/api/room/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { nickname } = req.body;

  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: '昵称不能为空' });
  }

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  const result = room.addPlayer(req.socket.remoteAddress, nickname.trim());
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    roomId: room.id,
    playerId: result.playerId
  });
});

// 获取房间状态
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.query;

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  res.json(room.getGameState(playerId));
});

// 生成随机昵称
app.get('/api/nickname', (req, res) => {
  const adjectives = ['快乐', '幸运', '聪明', '勇敢', '开心', '幸福', '潇洒', '帅气'];
  const nouns = ['玩家', '高手', '达人', '王者', '大师', '队长', '明星', '英雄'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  res.json({ nickname: `${adj}${noun}${num}` });
});

// Socket.IO 连接
io.on('connection', (socket) => {
  console.log('玩家连接:', socket.id);

  // 加入房间 Socket
  socket.on('join-room', ({ roomId, playerId }) => {
    socket.join(`room:${roomId}`);
    console.log(`玩家 ${playerId} 加入房间 ${roomId}`);
  });

  // 玩家准备
  socket.on('player-ready', ({ roomId, playerId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const result = room.playerReady(playerId);
    
    // 广播房间状态
    io.to(`room:${roomId}`).emit('room-update', room.getGameState(playerId));

    // 如果所有人都准备好了，通知可以开始
    if (result.success && result.allReady) {
      io.to(`room:${roomId}`).emit('all-ready');
    }
  });

  // 开始游戏
  socket.on('start-game', ({ roomId, playerId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    // 只有房主可以开始游戏
    if (playerId !== room.hostId) {
      socket.emit('error', { message: '只有房主可以开始游戏' });
      return;
    }

    const result = room.startGame();
    
    if (result.success) {
      // 广播游戏开始
      io.to(`room:${roomId}`).emit('game-start', {
        landlordIndex: result.landlordIndex,
        currentPlayerIndex: result.currentPlayerIndex
      });

      // 发送每个玩家的初始状态
      room.players.forEach((player, index) => {
        const playerState = room.getGameState(player.id);
        io.to(`room:${roomId}`).emit('game-state', playerState);
      });
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 出牌
  socket.on('play-hand', ({ roomId, playerId, cards }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const result = room.playHand(playerId, cards);
    
    if (result.success) {
      // 广播出牌
      io.to(`room:${roomId}`).emit('hand-played', {
        playerId,
        hand: result.hand,
        remaining: result.remaining,
        nextPlayerIndex: result.nextPlayerIndex,
        isWin: result.isWin,
        winner: result.winner
      });

      // 发送更新后的游戏状态
      room.players.forEach(player => {
        io.to(`room:${roomId}`).emit('game-state', room.getGameState(player.id));
      });

      // 如果游戏结束
      if (result.isWin) {
        io.to(`room:${roomId}`).emit('game-over', {
          winner: result.winner,
          winnerTeam: room.players.filter(p => p.team === result.winner).map(p => p.nickname)
        });
      }
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 不要（过）
  socket.on('pass', ({ roomId, playerId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const result = room.pass(playerId);
    
    if (result.success) {
      // 广播过牌
      io.to(`room:${roomId}`).emit('player-pass', {
        playerId,
        passCount: result.passCount,
        nextPlayerIndex: result.nextPlayerIndex
      });

      // 发送更新后的游戏状态
      room.players.forEach(player => {
        io.to(`room:${roomId}`).emit('game-state', room.getGameState(player.id));
      });
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 聊天
  socket.on('chat-message', ({ roomId, playerId, message }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player) return;

    io.to(`room:${roomId}`).emit('chat-message', {
      playerId,
      nickname: player.nickname,
      message,
      timestamp: Date.now()
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('玩家断开:', socket.id);
    
    // 从所有房间移除
    for (const room of roomManager.rooms.values()) {
      const player = room.getPlayerBySocketId(socket.id);
      if (player) {
        room.removePlayer(player.id);
        io.to(`room:${room.id}`).emit('player-left', {
          playerId: player.id,
          nickname: player.nickname
        });
        
        // 如果房间空了，删除房间
        if (room.players.length === 0) {
          roomManager.deleteRoom(room.id);
        }
      }
    }
  });
});

// SPA 路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🎮 掼蛋游戏服务器已启动`);
  console.log(`📍 端口：${PORT}`);
  console.log(`🌐 访问：http://localhost:${PORT}`);
});

module.exports = { app, server, io };
