import { useState, useEffect } from 'react'

export default function RoomPage({ 
  socket, 
  roomId, 
  playerId, 
  nickname, 
  gameState, 
  setGameState,
  onStartGame, 
  onReady,
  onGoToGame 
}) {
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/game/${roomId}` 
    : `/game/${roomId}`;

  // 监听房间事件
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = (state) => {
      console.log('📢 房间状态更新:', state);
      console.log('玩家列表:', state?.players?.map(p => ({ nickname: p.nickname, state: p.state })));
      setGameState(state);
    };

    const handlePlayerJoined = (data) => {
      console.log('🎉 新玩家加入:', data);
      setNotification(`🎉 ${data.nickname} 加入了房间！`);
      setTimeout(() => setNotification(null), 3000);
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 玩家离开:', data);
      setNotification(`👋 ${data.nickname} 离开了房间`);
      setTimeout(() => setNotification(null), 3000);
    };

    const handleAllReady = () => {
      console.log('✅ 所有玩家已准备！');
      setNotification('✅ 所有玩家已准备，房主可以开始游戏！');
      setTimeout(() => setNotification(null), 5000);
    };

    socket.on('room-update', handleRoomUpdate);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('all-ready', handleAllReady);

    // 调试：定期检查状态
    const debugInterval = setInterval(() => {
      if (gameState?.players) {
        const isHost = playerId === gameState.players[0]?.id;
        const allReady = gameState.players.length === 4 && 
                        gameState.players.every(p => p.state === 'ready');
        const canStartGame = isHost && allReady;
        
        console.log('🔍 调试 - 当前玩家数:', gameState.players.length);
        console.log('🔍 调试 - 准备状态:', gameState.players.map(p => `${p.nickname}:${p.state}`));
        console.log('🔍 调试 - 是房主:', isHost);
        console.log('🔍 调试 - 可以开始:', canStartGame);
      }
    }, 5000);

    return () => {
      socket.off('room-update', handleRoomUpdate);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('all-ready', handleAllReady);
      clearInterval(debugInterval);
    };
  }, [socket, setGameState, gameState, playerId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = playerId === gameState?.players?.[0]?.id;
  const allReady = gameState?.players?.length === 4 && 
                   gameState?.players?.every(p => p.state === 'ready');
  const canStart = isHost && allReady;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* 通知 */}
        {notification && (
          <div className="bg-yellow-500 text-white p-3 rounded-lg mb-4 text-center animate-pulse">
            {notification}
          </div>
        )}

        {/* 头部 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🃏 房间：{roomId}</h1>
              <p className="text-white/70">欢迎你，{nickname}</p>
            </div>
            <button
              onClick={onGoToGame}
              className="btn-secondary"
            >
              返回大厅
            </button>
          </div>
        </div>

        {/* 邀请区域 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4">
          <h2 className="text-white font-semibold mb-2">📢 邀请好友</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white/70 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="btn-primary whitespace-nowrap"
            >
              {copied ? '✅ 已复制' : '📋 复制链接'}
            </button>
          </div>
          <p className="text-white/60 text-sm mt-2">
            将链接发送给好友，4 人即可开始游戏
          </p>
        </div>

        {/* 玩家列表 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4">
          <h2 className="text-white font-semibold mb-4">👥 玩家 ({gameState?.players?.length || 0}/4)</h2>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => {
              const player = gameState?.players?.[index];
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    player 
                      ? 'bg-white/20' 
                      : 'bg-white/5 border-2 border-dashed border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white">
                      {player ? player.nickname[0] : '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {player ? player.nickname : '等待加入...'}
                      </p>
                      {player && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          player.state === 'ready' 
                            ? 'bg-green-500/50 text-green-200' 
                            : 'bg-yellow-500/50 text-yellow-200'
                        }`}>
                          {player.state === 'ready' ? '✅ 已准备' : '⏳ 等待中'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
          {!gameState?.players?.find(p => p.id === playerId)?.state === 'ready' ? (
            <button
              onClick={onReady}
              className="w-full btn-success py-4 text-xl"
            >
              ✅ 准备开始
            </button>
          ) : (
            <div className="text-center">
              <p className="text-white/80 text-lg mb-4">✅ 已准备，等待其他玩家...</p>
              {canStart ? (
                <button
                  onClick={onStartGame}
                  className="w-full btn-success py-4 text-xl animate-pulse"
                >
                  🎮 开始游戏
                </button>
              ) : (
                <p className="text-white/60">
                  {allReady 
                    ? '等待房主开始游戏...' 
                    : `已准备 (${gameState?.players?.length || 0}/4)`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-4 p-4 bg-white/10 rounded-lg">
          <h3 className="text-white/80 font-semibold mb-2">📖 游戏规则</h3>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• 两副牌共 108 张，4 人游戏，每人 27 张</li>
            <li>• 对家为队友，先出完牌的队伍获胜</li>
            <li>• 牌型：单张、对子、三张、顺子、连对、飞机、炸弹等</li>
            <li>• 炸弹可以管任何非炸弹牌型，王炸最大</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
