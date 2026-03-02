import { useState } from 'react'

export default function JoinRoomPage({ roomId, onJoin, onBack }) {
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!nickname.trim()) {
      alert('请输入昵称');
      return;
    }
    
    setIsJoining(true);
    try {
      await onJoin(roomId, nickname.trim());
    } catch (err) {
      alert('加入失败：' + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="text-white/70 hover:text-white mb-4"
        >
          ← 返回
        </button>

        <h1 className="text-3xl font-bold text-white text-center mb-2">🃏 加入房间</h1>
        <p className="text-white/70 text-center mb-6">房间号：{roomId}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">输入昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入你的昵称"
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={isJoining || !nickname.trim()}
            className="w-full btn-success py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? '加入中...' : '🚪 加入房间'}
          </button>

          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <h3 className="text-white font-semibold mb-2">📖 游戏说明</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• 4 人游戏，2v2 组队对战</li>
              <li>• 使用两副牌，每人 27 张</li>
              <li>• 队友坐对门，先出完牌者获胜</li>
              <li>• 支持顺子、连对、飞机等牌型</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
