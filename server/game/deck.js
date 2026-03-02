/**
 * 牌堆管理
 * 掼蛋使用两副牌，共 108 张
 */

// 牌面值：3-10, J, Q, K, A, 2, 小王，大王
const CARD_VALUES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'SJ', 'BJ'];

// 牌面值对应的权重（用于比较大小）
const CARD_WEIGHTS = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'SJ': 16, 'BJ': 17
};

// 花色
const SUITS = ['♠', '♥', '♣', '♦'];

class Card {
  constructor(value, suit, weight) {
    this.value = value;  // 牌面值
    this.suit = suit;    // 花色
    this.weight = weight; // 权重
    this.id = `${value}${suit}`;
  }

  toJSON() {
    return {
      value: this.value,
      suit: this.suit,
      weight: this.weight,
      id: this.id
    };
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  // 重置牌堆（两副牌）
  reset() {
    this.cards = [];
    
    // 每副牌 54 张，两副共 108 张
    for (let deck = 0; deck < 2; deck++) {
      // 添加 4 种花色的牌
      for (const value of CARD_VALUES.slice(0, -2)) {
        for (const suit of SUITS) {
          this.cards.push(new Card(value, suit, CARD_WEIGHTS[value]));
        }
      }
      // 添加小王和大王（各 2 张）
      this.cards.push(new Card('SJ', '', CARD_WEIGHTS['SJ']));
      this.cards.push(new Card('BJ', '', CARD_WEIGHTS['BJ']));
    }
  }

  // 洗牌
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // 发牌
  deal(numPlayers = 4, cardsPerPlayer = 27) {
    const hands = [];
    
    // 给每个玩家发牌
    for (let i = 0; i < numPlayers; i++) {
      hands.push([]);
      for (let j = 0; j < cardsPerPlayer; j++) {
        if (this.cards.length > 0) {
          hands[i].push(this.cards.pop());
        }
      }
    }
    
    // 剩余的牌作为底牌（掼蛋通常不留底牌）
    const remaining = this.cards;
    this.cards = [];
    
    return { hands, remaining };
  }

  // 获取剩余牌数
  remaining() {
    return this.cards.length;
  }
}

module.exports = { Card, Deck, CARD_WEIGHTS, CARD_VALUES };
