import { useState } from 'react'
import Card from './Card'

export default function CardHand({ cards = [], selectedCards = [], onCardClick, disabled = false }) {
  const [sortBy, setSortBy] = useState('weight'); // 'weight' or 'value'

  const sortedCards = [...cards].sort((a, b) => {
    if (sortBy === 'weight') {
      return b.weight - a.weight;
    } else {
      // 按牌面值排序
      const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'SJ', 'BJ'];
      return order.indexOf(a.value) - order.indexOf(b.value);
    }
  });

  const handleSort = () => {
    setSortBy(prev => prev === 'weight' ? 'value' : 'weight');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/60 text-sm">
          点击选择要出的牌，再次点击取消
        </p>
        <button
          onClick={handleSort}
          className="text-white/60 hover:text-white text-sm underline"
        >
          排序：{sortBy === 'weight' ? '大小' : '牌面'}
        </button>
      </div>
      
      <div className="flex gap-1 md:gap-2 overflow-x-auto pb-4 px-4">
        {sortedCards.map((card, index) => (
          <Card
            key={card.id || index}
            card={card}
            selected={selectedCards.some(c => c.id === card.id)}
            onClick={() => onCardClick && onCardClick(card)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
