#!/usr/bin/env python3
"""
脑机接口领域新闻抓取器（精简版）
每天自动从预设的网站列表中获取最新资讯并整理成中文摘要
"""

import requests
from bs4 import BeautifulSoup
import feedparser
import time
import re
from urllib.parse import urljoin
import logging
from datetime import datetime
import sys

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BCI_News_Fetcher_Simple:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # 脑机接口相关网站列表
        self.urls = [
            # Reddit 社区（最活跃的BCI讨论）
            {'name': 'Reddit r/Neuralink', 'url': 'https://www.reddit.com/r/Neuralink/.rss', 'type': 'rss'},
            {'name': 'Reddit r/BCI', 'url': 'https://www.reddit.com/r/BCI/.rss', 'type': 'rss'},
        ]

    def fetch_reddit_posts(self, rss_url, source):
        """获取Reddit RSS内容"""
        try:
            response = self.session.get(rss_url, timeout=10)
            feed = feedparser.parse(response.content)
            
            articles = []
            for entry in feed.entries[:5]:  # 只取前5个
                # 清理标题中的特殊字符
                title = re.sub(r'<[^>]+>|&[^;]+;', '', entry.title)
                # 清理摘要
                summary = re.sub(r'<[^>]+>|&[^;]+;', ' ', entry.summary)
                summary = ' '.join(summary.split()[:30]) + '...'  # 限制长度
                
                articles.append({
                    'title': title,
                    'url': entry.link,
                    'source': source,
                    'summary': summary
                })
                
            return articles
        except Exception as e:
            logger.error(f"Error fetching {source}: {e}")
            return []

    def fetch_all_news(self):
        """获取所有来源的新闻"""
        all_articles = []
        
        # 获取Reddit上的帖子
        all_articles.extend(self.fetch_reddit_posts('https://www.reddit.com/r/Neuralink/.rss', 'Reddit r/Neuralink'))
        all_articles.extend(self.fetch_reddit_posts('https://www.reddit.com/r/BCI/.rss', 'Reddit r/BCI'))
        
        # 去重
        seen_titles = set()
        unique_articles = []
        for article in all_articles:
            clean_title = re.sub(r'[^\w\s\u4e00-\u9fff]', '', article['title']).lower()
            if clean_title and clean_title not in seen_titles:
                seen_titles.add(clean_title)
                unique_articles.append(article)
        
        return unique_articles[:10]  # 返回最多10篇文章

    def translate_basic(self, text):
        """基础翻译功能"""
        # 简单的术语翻译
        translations = {
            'Neuralink': 'Neuralink',
            'Elon Musk': '埃隆·马斯克',
            'patient': '患者',
            'trial': '试验',
            'FDA': '美国食品药品监督管理局',
            'implant': '植入物',
            'brain': '大脑',
            'computer': '计算机',
            'interface': '接口',
            'technology': '技术',
            'research': '研究',
            'study': '研究',
            'news': '新闻',
            'update': '更新',
            'development': '发展',
            'breakthrough': '突破',
            'clinical': '临床',
            'approval': '批准',
            'funding': '融资',
            'startup': '初创公司',
            'competition': '竞争',
            'regulation': '监管',
            'ethics': '伦理',
            'safety': '安全',
            'performance': '性能',
            'results': '结果',
            'data': '数据',
            'livestream': '直播',
            'demonstration': '演示',
            'first': '首个',
            'human': '人类',
            'testing': '测试',
            'paralysis': '瘫痪',
            'movement': '运动',
            'signals': '信号',
            'monitoring': '监控',
            'wireless': '无线',
            'chip': '芯片',
            'surgery': '手术',
            'recovery': '恢复',
            'therapy': '治疗',
            'prosthetics': '假肢',
            'restoration': '恢复',
            'communication': '通讯',
            'control': '控制',
            'device': '设备',
            'system': '系统',
            'algorithm': '算法',
            'AI': '人工智能',
            'machine': '机器',
            'learning': '学习',
            'feedback': '反馈',
            'accuracy': '准确性',
            'precision': '精确度',
            'resolution': '分辨率',
            'bandwidth': '带宽',
            'latency': '延迟',
            'scalability': '可扩展性',
            'commercialization': '商业化',
            'market': '市场',
            'investment': '投资',
            'partnership': '合作',
            'collaboration': '协作',
            'innovation': '创新',
            'future': '未来',
            'potential': '潜力',
            'challenges': '挑战',
            'risks': '风险',
            'benefits': '益处',
            'applications': '应用',
            'advances': '进展',
            'progress': '进展',
            'milestone': '里程碑',
            'achievement': '成就',
            'success': '成功',
            'failure': '失败',
            'setback': '挫折',
            'issue': '问题',
            'solution': '解决方案',
            'design': '设计',
            'architecture': '架构',
            'materials': '材料',
            'biocompatibility': '生物相容性',
            'durability': '耐用性',
            'longevity': '寿命',
            'maintenance': '维护',
            'upgrade': '升级',
            'accessibility': '可访问性',
            'affordability': '负担能力',
            'equality': '平等',
            'privacy': '隐私',
            'security': '安全',
            'consent': '同意',
            'autonomy': '自主权',
            'identity': '身份',
            'consciousness': '意识',
            'cognition': '认知',
            'memory': '记忆',
            'thought': '思维',
            'mind': '心智',
            'control': '控制',
            'freedom': '自由',
            'dependence': '依赖',
            'enhancement': '增强',
            'transhumanism': '超人类主义',
            'cyborg': '半机械人',
            'augmentation': '增强',
            'modification': '改造',
            'integration': '整合',
            'fusion': '融合',
            'evolution': '进化',
            'revolution': '革命',
            'disruption': '颠覆',
            'transformation': '变革',
            'impact': '影响',
            'society': '社会',
            'culture': '文化',
            'economy': '经济',
            'politics': '政治',
            'law': '法律',
            'policy': '政策',
            'governance': '治理',
            'oversight': '监督',
            'framework': '框架',
            'guidelines': '指南',
            'standards': '标准',
            'compliance': '合规',
            'certification': '认证',
            'licensing': '许可',
            'patent': '专利',
            'intellectual property': '知识产权',
            'copyright': '版权',
            'trademark': '商标',
            'competition': '竞争',
            'monopoly': '垄断',
            'regulation': '监管',
            'intervention': '干预',
            'protection': '保护',
            'consumer': '消费者',
            'patient': '患者',
            'user': '用户',
            'provider': '提供商',
            'manufacturer': '制造商',
            'developer': '开发者',
            'researcher': '研究人员',
            'clinician': '临床医生',
            'surgeon': '外科医生',
            'engineer': '工程师',
            'scientist': '科学家',
            'entrepreneur': '企业家',
            'investor': '投资者',
            'regulator': '监管者',
            'advocate': '倡导者',
            'critic': '批评者',
            'supporter': '支持者',
            'opponent': '反对者',
            'neutral': '中立者',
            'public': '公众',
            'community': '社区',
            'family': '家庭',
            'friends': '朋友',
            'colleagues': '同事',
            'peers': '同行',
            'mentors': '导师',
            'students': '学生',
            'teachers': '教师',
            'experts': '专家',
            'specialists': '专家',
            'practitioners': '从业者',
            'professionals': '专业人士',
            'amateurs': '业余爱好者',
            'hobbyists': '爱好者',
            'enthusiasts': '爱好者',
            'fans': '粉丝',
            'followers': '关注者',
            'leaders': '领导者',
            'managers': '管理者',
            'employees': '员工',
            'staff': '员工',
            'team': '团队',
            'organization': '组织',
            'company': '公司',
            'corporation': '公司',
            'enterprise': '企业',
            'business': '业务',
            'industry': '行业',
            'sector': '部门',
            'field': '领域',
            'domain': '领域',
            'area': '区域',
            'region': '地区',
            'nation': '国家',
            'country': '国家',
            'state': '州',
            'province': '省',
            'city': '城市',
            'town': '城镇',
            'village': '村庄',
            'global': '全球',
            'international': '国际',
            'national': '国家',
            'local': '本地',
            'regional': '区域',
            'continental': '大陆',
            'universal': '普遍',
            'common': '共同',
            'shared': '共享',
            'collective': '集体',
            'individual': '个人',
            'personal': '个人',
            'private': '私人',
            'public': '公共',
            'open': '开放',
            'closed': '封闭',
            'restricted': '受限',
            'limited': '有限',
            'unlimited': '无限',
            'free': '免费',
            'paid': '付费',
            'cost': '成本',
            'price': '价格',
            'value': '价值',
            'worth': '价值',
            'benefit': '利益',
            'profit': '利润',
            'revenue': '收入',
            'income': '收入',
            'expense': '支出',
            'investment': '投资',
            'return': '回报',
            'gain': '收益',
            'loss': '损失',
            'risk': '风险',
            'reward': '奖励',
            'incentive': '激励',
            'motivation': '动机',
            'drive': '动力',
            'energy': '能量',
            'power': '力量',
            'strength': '力量',
            'force': '力',
            'pressure': '压力',
            'stress': '压力',
            'tension': '紧张',
            'relaxation': '放松',
            'calm': '平静',
            'peace': '和平',
            'harmony': '和谐',
            'balance': '平衡',
            'equilibrium': '平衡',
            'stability': '稳定',
            'instability': '不稳定',
            'change': '变化',
            'transformation': '转变',
            'evolution': '演变',
            'revolution': '革命',
            'innovation': '创新',
            'creation': '创造',
            'production': '生产',
            'manufacturing': '制造',
            'assembly': '组装',
            'construction': '建设',
            'building': '建筑',
            'development': '发展',
            'growth': '增长',
            'expansion': '扩张',
            'contraction': '收缩',
            'reduction': '减少',
            'increase': '增加',
            'decrease': '减少',
            'rise': '上升',
            'fall': '下降',
            'peak': '顶峰',
            'valley': '低谷',
            'mountain': '山',
            'hill': '丘陵',
            'plain': '平原',
            'desert': '沙漠',
            'forest': '森林',
            'ocean': '海洋',
            'sea': '海',
            'river': '河流',
            'lake': '湖',
            'water': '水',
            'land': '陆地',
            'earth': '地球',
            'world': '世界',
            'planet': '行星',
            'space': '空间',
            'universe': '宇宙',
            'galaxy': '星系',
            'star': '恒星',
            'sun': '太阳',
            'moon': '月亮',
            'light': '光',
            'darkness': '黑暗',
            'day': '白天',
            'night': '夜晚',
            'time': '时间',
            'moment': '时刻',
            'period': '时期',
            'era': '时代',
            'age': '年龄',
            'year': '年',
            'month': '月',
            'week': '周',
            'day': '天',
            'hour': '小时',
            'minute': '分钟',
            'second': '秒',
            'millisecond': '毫秒',
            'microsecond': '微秒',
            'nanosecond': '纳秒',
        }
        
        result = text
        # 按长度排序，优先替换较长的词组
        sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
        
        for eng, chn in sorted_translations:
            result = re.sub(r'\b' + eng + r'\b', chn, result, flags=re.IGNORECASE)
        
        # 清理多余空格
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result

    def format_report(self, articles):
        """格式化报告"""
        if not articles:
            return "今日暂未获取到脑机接口领域的最新资讯。"
        
        report = f"# 脑机接口领域每日资讯 ({datetime.now().strftime('%Y-%m-%d')})\n\n"
        
        for i, article in enumerate(articles, 1):
            # 翻译标题和摘要
            title = self.translate_basic(article['title'])
            summary = self.translate_basic(article['summary']) if article.get('summary') else ""
            
            report += f"**{title}**\n"
            if summary:
                report += f"{summary}\n"
            report += "\n"
        
        return report

    def run(self):
        """执行抓取任务"""
        logger.info("开始获取脑机接口领域最新资讯...")
        articles = self.fetch_all_news()
        report = self.format_report(articles)
        
        # 输出报告
        print(report)
        
        # 同时保存到文件
        filename = f"bci_news_{datetime.now().strftime('%Y%m%d')}_simple.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"资讯获取完成，已保存到 {filename}")
        return report

def main():
    fetcher = BCI_News_Fetcher_Simple()
    try:
        report = fetcher.run()
        # 如果作为定时任务运行，这里可以发送通知给用户
        print("\n" + "="*50)
        print("脑机接口领域每日资讯获取完成！")
        print("="*50)
    except Exception as e:
        logger.error(f"执行过程中出现错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()