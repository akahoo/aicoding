import { useState } from 'react'

export default function HomePage({ onCreateRoom, onJoinRoom, getRandomNickname }) {
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    let nick = nickname.trim();
    if (!nick) {
      setIsLoading(true);
      nick = await getRandomNickname();
      setIsLoading(false);
    }
    onCreateRoom(nick);
  };

  const handleJoinRoom = async () => {
    if (!roomIdInput.trim()) {
      alert('请输入房间号');
      return;
    }
    
    let nick = nickname.trim();
    if (!nick) {
      setIsLoading(true);
      nick = await getRandomNickname();
      setIsLoading(false);
    }
    
    onJoinRoom(roomIdInput.trim(), nick);
  };

  const handleGetRandomNickname = async () => {
    const nick = await getRandomNickname();
    setNickname(nick);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-2">🃏 掼蛋</h1>
        <p className="text-white/70 text-center mb-8">在线扑克游戏 - 4 人欢乐对战</p>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">昵称（可选）</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="不填则随机生成"
                className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handleGetRandomNickname}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                随机
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full btn-success py-3 text-lg"
          >
            {isLoading ? '生成中...' : '🏠 创建房间'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/70">或加入房间</span>
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">房间号</label>
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="输入 8 位房间号"
              maxLength={8}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !roomIdInput.trim()}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚪 加入房间
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
