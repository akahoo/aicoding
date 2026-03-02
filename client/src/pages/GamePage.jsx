import { useState, useEffect } from 'react'
import Card from '../components/Card'
import CardHand from '../components/CardHand'

export default function GamePage({
  socket,
  roomId,
  playerId,
  nickname,
  gameState,
  onPlayHand,
  onPass,
  onSendChat,
  onBackToRoom
}) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // 监听聊天消息
  useEffect(() => {
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.off('chat-message');
    };
  }, [socket]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const myHand = myPlayer?.hand || [];
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const isMyTurn = currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId);
  const canPlay = isMyTurn && gameState.state === 'playing';
  const lastHand = gameState.lastHand;
  const isLastPlayer = lastHand && lastHand.playerIndex === gameState.players.findIndex(p => p.id === playerId);

  const handleCardClick = (card) => {
    if (!canPlay) return;
    
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  const handlePlay = () => {
    if (selectedCards.length === 0) {
      alert('请选择要出的牌');
      return;
    }
    onPlayHand(selectedCards);
    setSelectedCards([]);
  };

  const handlePass = () => {
    if (isLastPlayer) {
      alert('你是上一轮第一个出牌的，不能过');
      return;
    }
    onPass();
  };

  const handleSendChat = () => {
    if (chatMessage.trim()) {
      onSendChat(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleSortHand = () => {
    // 手牌已经由后端排序
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-black/30 backdrop-blur-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBackToRoom} className="text-white/80 hover:text-white">
            ← 返回
          </button>
          <span className="text-white font-semibold">房间：{roomId}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/80">
            {gameState.state === 'waiting' && '⏳ 等待开始'}
            {gameState.state === 'playing' && '🎮 游戏中'}
            {gameState.state === 'finished' && '✅ 游戏结束'}
          </span>
          <button
            onClick={() => setShowChat(!showChat)}
            className="btn-secondary py-1 px-4 text-sm"
          >
            💬 聊天 {messages.length > 0 && `(${messages.length})`}
          </button>
        </div>
      </div>

      {/* 游戏区域 */}
      <div className="flex-1 game-table m-4 p-4 relative overflow-hidden">
        {/* 上方玩家（对家） */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 player-seat">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
            {gameState.players[2]?.nickname?.[0] || '?'}
          </div>
          <p className="text-white text-sm font-medium">{gameState.players[2]?.nickname || '玩家 2'}</p>
          <p className="text-white/60 text-xs">手牌：{gameState.players[2]?.handCount || 0}张</p>
          {currentPlayerIndex === 2 && (
            <div className="mt-2 px-3 py-1 bg-yellow-500 rounded-full text-white text-xs animate-pulse">
              出牌中...
            </div>
          )}
        </div>

        {/* 左侧玩家 */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 player-seat">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
            {gameState.players[1]?.nickname?.[0] || '?'}
          </div>
          <p className="text-white text-sm font-medium">{gameState.players[1]?.nickname || '玩家 1'}</p>
          <p className="text-white/60 text-xs">手牌：{gameState.players[1]?.handCount || 0}张</p>
          {currentPlayerIndex === 1 && (
            <div className="mt-2 px-3 py-1 bg-yellow-500 rounded-full text-white text-xs animate-pulse">
              出牌中...
            </div>
          )}
        </div>

        {/* 右侧玩家 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 player-seat">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
            {gameState.players[3]?.nickname?.[0] || '?'}
          </div>
          <p className="text-white text-sm font-medium">{gameState.players[3]?.nickname || '玩家 3'}</p>
          <p className="text-white/60 text-xs">手牌：{gameState.players[3]?.handCount || 0}张</p>
          {currentPlayerIndex === 3 && (
            <div className="mt-2 px-3 py-1 bg-yellow-500 rounded-full text-white text-xs animate-pulse">
              出牌中...
            </div>
          )}
        </div>

        {/* 中央出牌区域 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/20 rounded-xl p-6 min-h-[200px] min-w-[400px] flex items-center justify-center">
            {lastHand ? (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">
                  {gameState.players[lastHand.playerIndex]?.nickname} 出的牌
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {lastHand.cards.map((card, index) => (
                    <Card key={index} card={card} small />
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-2">
                  牌型：{lastHand.analysis.type}
                </p>
              </div>
            ) : (
              <p className="text-white/40">等待出牌...</p>
            )}
          </div>
        </div>

        {/* 聊天框 */}
        {showChat && (
          <div className="absolute top-4 right-4 w-64 chat-box">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold">💬 聊天</span>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="h-48 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-blue-600">{msg.nickname}:</span>
                  <span className="text-gray-700 ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="输入消息..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSendChat} className="btn-primary py-2 px-4 text-sm">
                发送
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部我的手牌 */}
      <div className="bg-black/30 backdrop-blur-lg p-4">
        <div className="max-w-6xl mx-auto">
          {/* 玩家信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white">
                {nickname[0]}
              </div>
              <div>
                <p className="text-white font-semibold">{nickname}</p>
                <p className="text-white/60 text-sm">手牌：{myHand.length}张</p>
              </div>
            </div>
            {currentPlayerIndex === 0 && (
              <div className="px-4 py-2 bg-yellow-500 rounded-full text-white font-semibold animate-pulse">
                你的回合
              </div>
            )}
          </div>

          {/* 手牌 */}
          <CardHand 
            cards={myHand}
            selectedCards={selectedCards}
            onCardClick={handleCardClick}
            disabled={!canPlay}
          />

          {/* 操作按钮 */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handlePass}
              disabled={!canPlay || isLastPlayer}
              className="btn-secondary py-3 px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✋ 不要
            </button>
            <button
              onClick={handleSortHand}
              className="btn-secondary py-3 px-8 text-lg"
            >
              🔄 理牌
            </button>
            <button
              onClick={handlePlay}
              disabled={!canPlay || selectedCards.length === 0}
              className="btn-success py-3 px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ 出牌 {selectedCards.length > 0 && `(${selectedCards.length}张)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
