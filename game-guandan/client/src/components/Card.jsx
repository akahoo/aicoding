export default function Card({ card, small = false, selected = false, onClick, disabled = false }) {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';
  const isJoker = card.value === 'SJ' || card.value === 'BJ';
  
  const sizeClasses = small 
    ? 'w-10 h-14 text-base' 
    : 'w-12 h-16 md:w-16 md:h-24 text-lg md:text-xl';

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(card);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        ${sizeClasses}
        bg-white rounded-lg shadow-md 
        flex flex-col items-center justify-center
        font-bold select-none
        transition-all duration-200
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2'}
        ${selected ? '-translate-y-4 ring-2 ring-yellow-400' : ''}
        ${isRed ? 'text-red-600' : 'text-gray-900'}
      `}
      style={{
        minWidth: small ? '40px' : '48px',
        minHeight: small ? '56px' : '64px'
      }}
    >
      {isJoker ? (
        <>
          <span className="text-2xl">{card.value === 'BJ' ? '🃏' : '🤡'}</span>
          <span className="text-xs">{card.value === 'BJ' ? '大王' : '小王'}</span>
        </>
      ) : (
        <>
          <span className="text-lg md:text-xl">{card.value}</span>
          <span className="text-xl md:text-2xl">{card.suit}</span>
        </>
      )}
    </div>
  );
}
