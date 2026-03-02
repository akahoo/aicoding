import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'
import JoinRoomPage from './pages/JoinRoomPage'

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5001';

// 从 URL 获取房间号
function getRoomIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/game\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [nickname, setNickname] = useState('');
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化 Socket 连接
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('已连接到服务器');
    });

    newSocket.on('room-update', (state) => {
      console.log('房间更新:', state);
      setGameState(state);
    });

    newSocket.on('player-joined', (data) => {
      console.log('玩家加入通知:', data);
    });

    newSocket.on('game-start', (data) => {
      console.log('游戏开始', data);
    });

    newSocket.on('game-state', (state) => {
      setGameState(state);
    });

    newSocket.on('hand-played', (data) => {
      console.log('出牌', data);
    });

    newSocket.on('player-pass', (data) => {
      console.log('过牌', data);
    });

    newSocket.on('game-over', (data) => {
      console.log('游戏结束', data);
      alert(`游戏结束！获胜方：${data.winnerTeam.join(', ')}`);
    });

    newSocket.on('error', (data) => {
      alert(data.message);
    });

    setSocket(newSocket);

    // 检查 URL 中的房间号
    const urlRoomId = getRoomIdFromUrl();
    if (urlRoomId) {
      console.log('从 URL 获取到房间号:', urlRoomId);
      setRoomId(urlRoomId);
      // 显示加入房间表单
      setCurrentPage('join');
    }
    
    setIsLoading(false);

    return () => {
      newSocket.close();
    };
  }, []);

  // 创建房间
  const createRoom = async (playerNickname) => {
    try {
      const res = await fetch(`${API_URL}/api/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: playerNickname })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setNickname(playerNickname);
      setCurrentPage('room');
      
      // 加入 Socket 房间
      socket.emit('join-room', { roomId: data.roomId, playerId: data.playerId });
      
      // 获取初始房间状态
      setTimeout(() => {
        fetch(`${API_URL}/api/room/${data.roomId}?playerId=${data.playerId}`)
          .then(res => res.json())
          .then(state => {
            console.log('获取初始房间状态:', state);
            setGameState(state);
          })
          .catch(err => console.error('获取房间状态失败:', err));
      }, 500);
    } catch (err) {
      alert('创建房间失败：' + err.message);
    }
  };

  // 加入房间
  const joinRoom = async (roomIdToJoin, playerNickname) => {
    try {
      const res = await fetch(`${API_URL}/api/room/${roomIdToJoin}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: playerNickname })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setNickname(playerNickname);
      setCurrentPage('room');
      
      // 加入 Socket 房间
      socket.emit('join-room', { roomId: data.roomId, playerId: data.playerId });
      
      // 延迟获取房间状态（确保 Socket 已加入）
      setTimeout(() => {
        fetch(`${API_URL}/api/room/${data.roomId}?playerId=${data.playerId}`)
          .then(res => res.json())
          .then(state => {
            console.log('获取房间状态:', state);
            setGameState(state);
          })
          .catch(err => console.error('获取房间状态失败:', err));
      }, 500);
    } catch (err) {
      alert('加入房间失败：' + err.message);
    }
  };

  // 获取随机昵称
  const getRandomNickname = async () => {
    try {
      const res = await fetch(`${API_URL}/api/nickname`);
      const data = await res.json();
      return data.nickname;
    } catch {
      return `玩家${Math.floor(Math.random() * 1000)}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900">
      {currentPage === 'home' && (
        <HomePage 
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          getRandomNickname={getRandomNickname}
        />
      )}

      {currentPage === 'join' && roomId && (
        <JoinRoomPage
          roomId={roomId}
          onJoin={joinRoom}
          onBack={() => {
            setCurrentPage('home');
            setRoomId(null);
          }}
        />
      )}
      
      {currentPage === 'room' && roomId && playerId && (
        <RoomPage
          socket={socket}
          roomId={roomId}
          playerId={playerId}
          nickname={nickname}
          gameState={gameState}
          setGameState={setGameState}
          onStartGame={() => socket.emit('start-game', { roomId, playerId })}
          onReady={() => socket.emit('player-ready', { roomId, playerId })}
          onGoToGame={() => setCurrentPage('game')}
        />
      )}

      {currentPage === 'game' && roomId && playerId && (
        <GamePage
          socket={socket}
          roomId={roomId}
          playerId={playerId}
          nickname={nickname}
          gameState={gameState}
          onPlayHand={(cards) => socket.emit('play-hand', { roomId, playerId, cards })}
          onPass={() => socket.emit('pass', { roomId, playerId })}
          onSendChat={(message) => socket.emit('chat-message', { roomId, playerId, message })}
          onBackToRoom={() => setCurrentPage('room')}
        />
      )}
    </div>
  )
}

export default App
