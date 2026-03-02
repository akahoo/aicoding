/**
 * 房间管理
 * 管理游戏房间、玩家、游戏状态
 */

const { v4: uuidv4 } = require('uuid');
const { Deck } = require('./deck');
const { canPlayHand, analyzeHand, HandType } = require('./rules');

// 游戏状态
const GameState = {
  WAITING: 'waiting',     // 等待玩家
  PLAYING: 'playing',     // 游戏中
  FINISHED: 'finished'    // 游戏结束
};

// 玩家状态
const PlayerState = {
  WAITING: 'waiting',
  READY: 'ready',
  PLAYING: 'playing',
  LEFT: 'left'
};

class Player {
  constructor(id, socketId, nickname) {
    this.id = id;
    this.socketId = socketId;
    this.nickname = nickname;
    this.hand = [];       // 手牌
    this.state = PlayerState.WAITING;
    this.team = null;     // 队伍（0 或 1）
    this.isLandlord = false; // 是否是庄家
  }

  toJSON() {
    return {
      id: this.id,
      nickname: this.nickname,
      state: this.state,
      team: this.team,
      isLandlord: this.isLandlord,
      handCount: this.hand.length
    };
  }
}

class Room {
  constructor(id, hostId) {
    this.id = id;
    this.hostId = hostId;
    this.players = [];
    this.state = GameState.WAITING;
    this.deck = null;
    this.currentPlayerIndex = 0;
    this.lastHand = null;     // 上一手牌
    this.lastPlayIndex = -1;  // 上一手牌的玩家索引
    this.passCount = 0;       // 连续不要的次數
    this.winner = null;       // 获胜队伍
  }

  // 添加玩家
  addPlayer(socketId, nickname) {
    if (this.players.length >= 4) {
      return { success: false, error: '房间已满' };
    }
    if (this.state !== GameState.WAITING) {
      return { success: false, error: '游戏已开始' };
    }

    const playerId = uuidv4();
    const player = new Player(playerId, socketId, nickname);
    this.players.push(player);

    return { success: true, playerId };
  }

  // 移除玩家
  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.players.splice(index, 1);
    }
  }

  // 获取玩家
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  // 通过 socketId 获取玩家
  getPlayerBySocketId(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  // 玩家准备
  playerReady(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, error: '玩家不存在' };
    
    player.state = PlayerState.READY;
    
    // 检查是否所有玩家都准备好了
    if (this.players.length === 4 && this.players.every(p => p.state === PlayerState.READY)) {
      return { success: true, allReady: true };
    }
    
    return { success: true, allReady: false };
  }

  // 开始游戏
  startGame() {
    if (this.players.length !== 4) {
      return { success: false, error: '需要 4 名玩家' };
    }
    if (this.state !== GameState.WAITING) {
      return { success: false, error: '游戏状态不正确' };
    }

    // 分配队伍（对家为同一队）
    this.players[0].team = 0;
    this.players[1].team = 1;
    this.players[2].team = 0;
    this.players[3].team = 1;

    // 随机选择庄家
    const landlordIndex = Math.floor(Math.random() * 4);
    this.players[landlordIndex].isLandlord = true;

    // 洗牌发牌
    this.deck = new Deck();
    this.deck.shuffle();
    const { hands } = this.deck.deal(4, 27);

    this.players.forEach((player, index) => {
      player.hand = hands[index].sort((a, b) => b.weight - a.weight);
      player.state = PlayerState.PLAYING;
    });

    // 庄家先出牌
    this.currentPlayerIndex = landlordIndex;
    this.lastHand = null;
    this.lastPlayIndex = -1;
    this.passCount = 0;
    this.state = GameState.PLAYING;

    return { 
      success: true, 
      landlordIndex,
      currentPlayerIndex: landlordIndex
    };
  }

  // 出牌
  playHand(playerId, cards) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, error: '玩家不存在' };
    }

    if (playerIndex !== this.currentPlayerIndex) {
      return { success: false, error: '不是你的回合' };
    }

    const player = this.players[playerIndex];
    
    // 检查牌是否在手牌中
    const cardIds = cards.map(c => c.id);
    const hasAllCards = cardIds.every(id => 
      player.hand.some(card => card.id === id)
    );
    if (!hasAllCards) {
      return { success: false, error: '牌不在手牌中' };
    }

    // 检查牌型是否合法
    if (this.lastHand && this.lastHand.playerIndex !== playerIndex) {
      // 需要管上家的牌
      if (!canPlayHand(cards, this.lastHand.cards)) {
        return { success: false, error: '牌型不合法或小于上家' };
      }
    } else {
      // 自由出牌
      const analysis = analyzeHand(cards);
      if (analysis.type === HandType.INVALID) {
        return { success: false, error: '无效的牌型' };
      }
    }

    // 从手牌中移除
    player.hand = player.hand.filter(card => !cardIds.includes(card.id));

    // 更新游戏状态
    this.lastHand = {
      cards,
      playerId,
      playerIndex,
      analysis: analyzeHand(cards)
    };
    this.lastPlayIndex = playerIndex;
    this.passCount = 0;

    // 检查是否获胜
    if (player.hand.length === 0) {
      this.winner = player.team;
      this.state = GameState.FINISHED;
      return { 
        success: true, 
        hand: cards,
        remaining: 0,
        isWin: true,
        winner: this.winner
      };
    }

    // 轮到下一个玩家
    this.currentPlayerIndex = (playerIndex + 1) % 4;
    this.passCount = 0;

    return {
      success: true,
      hand: cards,
      remaining: player.hand.length,
      nextPlayerIndex: this.currentPlayerIndex
    };
  }

  // 不要（过）
  pass(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, error: '玩家不存在' };
    }

    if (playerIndex !== this.currentPlayerIndex) {
      return { success: false, error: '不是你的回合' };
    }

    // 如果是第一个出牌的，不能过
    if (!this.lastHand || this.lastHand.playerIndex === playerIndex) {
      return { success: false, error: '你是第一个出牌的，不能过' };
    }

    this.passCount++;
    
    // 如果连续 3 个人不要，重新开始一轮
    if (this.passCount >= 3) {
      this.lastHand = null;
      this.lastPlayIndex = -1;
      this.passCount = 0;
      // 当前玩家继续出牌
    } else {
      // 轮到下一个玩家
      this.currentPlayerIndex = (playerIndex + 1) % 4;
    }

    return {
      success: true,
      passCount: this.passCount,
      nextPlayerIndex: this.currentPlayerIndex
    };
  }

  // 获取游戏状态
  getGameState(viewPlayerId) {
    const viewPlayer = this.getPlayer(viewPlayerId);
    if (!viewPlayer) return null;

    return {
      roomId: this.id,
      state: this.state,
      players: this.players.map((p, index) => ({
        ...p.toJSON(),
        index,
        isCurrent: index === this.currentPlayerIndex,
        // 只看自己的手牌详情
        hand: p.id === viewPlayerId ? p.hand.map(c => c.toJSON()) : null
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      lastHand: this.lastHand ? {
        cards: this.lastHand.cards.map(c => c.toJSON()),
        playerIndex: this.lastHand.playerIndex,
        analysis: this.lastHand.analysis
      } : null,
      passCount: this.passCount,
      winner: this.winner
    };
  }
}

// 房间管理器
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  // 创建房间
  createRoom(hostId) {
    const roomId = uuidv4().substring(0, 8);
    const room = new Room(roomId, hostId);
    this.rooms.set(roomId, room);
    return room;
  }

  // 获取房间
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // 删除房间
  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  // 通过玩家 ID 获取房间
  getRoomByPlayerId(playerId) {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) {
        return room;
      }
    }
    return null;
  }
}

module.exports = { Room, RoomManager, GameState, PlayerState };
