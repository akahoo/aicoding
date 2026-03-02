/**
 * 掼蛋牌型规则
 * 支持判断各种牌型并比较大小
 */

const { CARD_WEIGHTS } = require('./deck');

// 牌型类型
const HandType = {
  SINGLE: 'single',           // 单张
  PAIR: 'pair',               // 对子
  TRIPLE: 'triple',           // 三张
  TRIPLE_WITH_PAIR: 'triple_pair',  // 三带二
  STRAIGHT: 'straight',       // 顺子（5 张连续）
  CONSECUTIVE_PAIRS: 'consecutive_pairs', // 连对（3 对以上连续）
  AIRPLANE: 'airplane',       // 飞机（两个或以上连续三张）
  AIRPLANE_WITH_PAIRS: 'airplane_pairs', // 飞机带对子
  FOUR_WITH_TWO: 'four_two',  // 四带二
  BOMB: 'bomb',               // 炸弹（四张相同）
  KING_BOMB: 'king_bomb',     // 王炸（双王）
  INVALID: 'invalid'          // 无效牌型
};

/**
 * 分析牌型
 */
function analyzeHand(cards) {
  if (!cards || cards.length === 0) {
    return { type: HandType.INVALID, weight: 0, length: 0 };
  }

  const weights = cards.map(c => c.weight).sort((a, b) => a - b);
  const length = weights.length;

  // 王炸
  if (length === 2 && weights.includes(16) && weights.includes(17)) {
    return { type: HandType.KING_BOMB, weight: 999, length: 2 };
  }

  // 单张
  if (length === 1) {
    return { type: HandType.SINGLE, weight: weights[0], length: 1 };
  }

  // 对子
  if (length === 2 && weights[0] === weights[1]) {
    return { type: HandType.PAIR, weight: weights[0], length: 2 };
  }

  // 三张
  if (length === 3 && weights[0] === weights[1] && weights[1] === weights[2]) {
    return { type: HandType.TRIPLE, weight: weights[0], length: 3 };
  }

  // 三带二
  if (length === 5) {
    const countMap = countByWeight(weights);
    const values = Object.keys(countMap).map(Number);
    if (values.length === 2) {
      const triple = values.find(v => countMap[v] === 3);
      const pair = values.find(v => countMap[v] === 2);
      if (triple && pair) {
        return { type: HandType.TRIPLE_WITH_PAIR, weight: triple, length: 5 };
      }
    }
  }

  // 顺子（5 张连续，不含王）
  if (length === 5 && isConsecutive(weights) && weights[4] < 16) {
    return { type: HandType.STRAIGHT, weight: weights[0], length: 5 };
  }

  // 连对（3 对以上连续）
  if (length >= 6 && length % 2 === 0) {
    const countMap = countByWeight(weights);
    const pairs = Object.entries(countMap)
      .filter(([_, count]) => count === 2)
      .map(([weight, _]) => Number(weight))
      .sort((a, b) => a - b);
    
    if (pairs.length >= 3 && pairs.length * 2 === length && isConsecutive(pairs) && pairs[pairs.length - 1] < 16) {
      return { type: HandType.CONSECUTIVE_PAIRS, weight: pairs[0], length: length };
    }
  }

  // 炸弹（四张相同）
  if (length === 4 && weights.every(w => w === weights[0])) {
    return { type: HandType.BOMB, weight: weights[0], length: 4 };
  }

  // 四带二
  if (length === 6) {
    const countMap = countByWeight(weights);
    const values = Object.keys(countMap).map(Number);
    if (values.length === 3) {
      const four = values.find(v => countMap[v] === 4);
      const others = values.filter(v => countMap[v] === 1);
      if (four && others.length === 2) {
        return { type: HandType.FOUR_WITH_TWO, weight: four, length: 6 };
      }
    }
  }

  return { type: HandType.INVALID, weight: 0, length: 0 };
}

/**
 * 统计各权重的牌数
 */
function countByWeight(weights) {
  const map = {};
  weights.forEach(w => {
    map[w] = (map[w] || 0) + 1;
  });
  return map;
}

/**
 * 判断是否连续
 */
function isConsecutive(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) return false;
  }
  return true;
}

/**
 * 判断牌型是否有效
 */
function isValidHand(cards) {
  const result = analyzeHand(cards);
  return result.type !== HandType.INVALID;
}

/**
 * 比较两个牌型
 * 返回：1-前者大，-1-后者大，0-无法比较（牌型不同）
 */
function compareHands(hand1, hand2) {
  const analysis1 = analyzeHand(hand1);
  const analysis2 = analyzeHand(hand2);

  // 无效牌型
  if (analysis1.type === HandType.INVALID || analysis2.type === HandType.INVALID) {
    return 0;
  }

  // 王炸最大
  if (analysis1.type === HandType.KING_BOMB) return 1;
  if (analysis2.type === HandType.KING_BOMB) return -1;

  // 炸弹比较
  if (analysis1.type === HandType.BOMB && analysis2.type !== HandType.BOMB) return 1;
  if (analysis2.type === HandType.BOMB && analysis1.type !== HandType.BOMB) return -1;
  if (analysis1.type === HandType.BOMB && analysis2.type === HandType.BOMB) {
    return analysis1.weight > analysis2.weight ? 1 : (analysis1.weight < analysis2.weight ? -1 : 0);
  }

  // 相同牌型比较权重
  if (analysis1.type === analysis2.type) {
    if (analysis1.length !== analysis2.length) return 0; // 长度不同无法比较
    return analysis1.weight > analysis2.weight ? 1 : (analysis1.weight < analysis2.weight ? -1 : 0);
  }

  // 不同牌型无法比较
  return 0;
}

/**
 * 检查出牌是否合法（与上家牌型比较）
 */
function canPlayHand(newHand, lastHand) {
  if (!lastHand || lastHand.length === 0) {
    // 自由出牌
    return isValidHand(newHand);
  }

  const newAnalysis = analyzeHand(newHand);
  const lastAnalysis = analyzeHand(lastHand);

  // 新牌型必须有效
  if (newAnalysis.type === HandType.INVALID) return false;

  // 王炸可以管任何牌
  if (newAnalysis.type === HandType.KING_BOMB) return true;

  // 炸弹可以管非炸弹
  if (newAnalysis.type === HandType.BOMB && lastAnalysis.type !== HandType.BOMB) return true;

  // 牌型必须相同且长度相同
  if (newAnalysis.type !== lastAnalysis.type || newAnalysis.length !== lastAnalysis.length) {
    return false;
  }

  // 比较权重
  return newAnalysis.weight > lastAnalysis.weight;
}

module.exports = {
  HandType,
  analyzeHand,
  isValidHand,
  compareHands,
  canPlayHand
};
