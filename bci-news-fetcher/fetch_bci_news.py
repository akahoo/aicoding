#!/usr/bin/env python3
"""
脑机接口领域新闻抓取器
每天自动从预设的网站列表中获取最新资讯并整理成中文摘要
"""

import requests
from bs4 import BeautifulSoup
import feedparser
import time
import re
from urllib.parse import urljoin, urlparse
import json
import logging
from datetime import datetime
import sys

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BCI_News_Fetcher:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # 脑机接口相关网站列表
        self.urls = [
            # 国际科技/新闻媒体
            {'name': 'Wired BCI News', 'url': 'https://www.wired.com/search/?q=brain+computer+interface', 'type': 'search'},
            {'name': 'Tom\'s Hardware BCI', 'url': 'https://www.tomshardware.com/search?q=brain+computer+interface', 'type': 'search'},
            {'name': 'Times of India BCI', 'url': 'https://timesofindia.indiatimes.com/technology/tech-news/', 'type': 'general'},
            
            # 中文财经/科技新闻
            {'name': '新浪财经BCI', 'url': 'https://finance.sina.com.cn/search/?q=脑机接口', 'type': 'search'},
            {'name': '界面新闻BCI', 'url': 'https://www.jiemian.com/search.html?search=脑机接口', 'type': 'search'},
            {'name': '东方财富网BCI', 'url': 'https://finance.eastmoney.com/search.html?key=脑机接口', 'type': 'search'},
            {'name': '新浪新闻BCI', 'url': 'https://search.sina.com.cn/?q=脑机接口', 'type': 'search'},
            
            # 公司官网
            {'name': 'Neuralink News', 'url': 'https://neuralink.com/', 'type': 'official'},
            {'name': 'Synchron News', 'url': 'https://synchron.com/', 'type': 'official'},
            {'name': 'OpenBCI News', 'url': 'https://openbci.com/', 'type': 'official'},
            
            # 科研资源
            {'name': 'arXiv BCI Papers', 'url': 'https://arxiv.org/search/?query=brain+computer+interface&searchtype=all&abstracts=show&order=-announced_date_first', 'type': 'academic'},
        ]
        
        # 存储抓取到的文章
        self.articles = []

    def fetch_wired_news(self, url):
        """获取Wired关于BCI的新闻"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # Wired的文章通常在特定的容器中
            article_elements = soup.find_all('article', limit=5) or soup.find_all('div', {'data-testid': 'card'}, limit=5)
            
            for element in article_elements:
                title_elem = element.find('h2') or element.find('h3') or element.find('a')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link_elem = element.find('a', href=True)
                    if link_elem:
                        link = urljoin(url, link_elem['href'])
                        articles.append({
                            'title': title,
                            'url': link,
                            'source': 'Wired',
                            'summary': ''
                        })
                        
            return articles[:3]  # 只返回前3个
        except Exception as e:
            logger.error(f"Error fetching Wired news: {e}")
            return []

    def fetch_tomshardware_news(self, url):
        """获取Tom's Hardware关于BCI的新闻"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # Tom's Hardware的文章通常在特定的容器中
            article_elements = soup.find_all('article', limit=5) or soup.find_all('div', class_='simple-item', limit=5)
            
            for element in article_elements:
                title_elem = element.find(['h3', 'h4', 'a'])
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link_elem = element.find('a', href=True)
                    if link_elem:
                        link = urljoin(url, link_elem['href'])
                        articles.append({
                            'title': title,
                            'url': link,
                            'source': 'Tom\'s Hardware',
                            'summary': ''
                        })
                        
            return articles[:3]  # 只返回前3个
        except Exception as e:
            logger.error(f"Error fetching Tom's Hardware news: {e}")
            return []

    def fetch_sina_finance_news(self, url):
        """获取新浪财经关于BCI的新闻"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # 新浪财经的搜索结果通常在特定的容器中
            item_elements = soup.find_all('div', class_='result', limit=5) or soup.find_all('div', class_='search-result-item', limit=5)
            
            for element in item_elements:
                title_elem = element.find('h2') or element.find('a')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link_elem = element.find('a', href=True)
                    if link_elem:
                        link = link_elem['href']
                        if not link.startswith('http'):
                            link = urljoin(url, link)
                        articles.append({
                            'title': title,
                            'url': link,
                            'source': '新浪财经',
                            'summary': ''
                        })
                        
            return articles[:3]
        except Exception as e:
            logger.error(f"Error fetching Sina Finance news: {e}")
            return []

    def fetch_jiemian_news(self, url):
        """获取界面新闻关于BCI的新闻"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # 界面新闻的搜索结果
            item_elements = soup.find_all('div', class_='search-link', limit=5)
            
            for element in item_elements:
                title_elem = element.find('a')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link = title_elem.get('href')
                    if link:
                        if not link.startswith('http'):
                            link = urljoin('https://www.jiemian.com', link)
                        articles.append({
                            'title': title,
                            'url': link,
                            'source': '界面新闻',
                            'summary': ''
                        })
                        
            return articles[:3]
        except Exception as e:
            logger.error(f"Error fetching Jiemian news: {e}")
            return []

    def fetch_neuralink_news(self, url):
        """获取Neuralink官网信息"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # 获取页面的主要内容
            title = soup.find('title')
            if title:
                title = title.get_text(strip=True)
            else:
                title = "Neuralink Official Site Update"
                
            articles.append({
                'title': title,
                'url': url,
                'source': 'Neuralink',
                'summary': 'Official Neuralink website update'
            })
            
            return articles
        except Exception as e:
            logger.error(f"Error fetching Neuralink news: {e}")
            return []

    def fetch_arxiv_papers(self, url):
        """获取arXiv关于BCI的最新论文"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            # arXiv论文列表
            article_elements = soup.find_all('li', class_='arxiv-result', limit=3)
            
            for element in article_elements:
                title_elem = element.find('p', class_='title')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    
                # 获取摘要
                abstract_elem = element.find('p', class_='abstract')
                if abstract_elem:
                    summary = abstract_elem.get_text(strip=True).replace('Abstract: ', '')
                else:
                    summary = ''
                    
                link_elem = element.find('span', class_='list-title').find('a') if element.find('span', class_='list-title') else None
                if link_elem:
                    link = link_elem['href']
                    if not link.startswith('http'):
                        link = urljoin('https://arxiv.org', link)
                        
                    articles.append({
                        'title': title,
                        'url': link,
                        'source': 'arXiv',
                        'summary': summary[:200] + '...' if len(summary) > 200 else summary
                    })
                        
            return articles
        except Exception as e:
            logger.error(f"Error fetching arXiv papers: {e}")
            return []

    def fetch_reddit_posts(self, subreddit):
        """获取Reddit相关子版块的帖子（通过RSS）"""
        try:
            rss_url = f"https://www.reddit.com/r/{subreddit}/.rss"
            feed = feedparser.parse(rss_url)
            
            articles = []
            for entry in feed.entries[:3]:  # 只取前3个
                articles.append({
                    'title': entry.title,
                    'url': entry.link,
                    'source': f'Reddit r/{subreddit}',
                    'summary': entry.summary[:200] + '...' if len(entry.summary) > 200 else entry.summary
                })
                
            return articles
        except Exception as e:
            logger.error(f"Error fetching Reddit {subreddit}: {e}")
            return []

    def generate_summary(self, article):
        """为文章生成简短摘要（实际实现中可能需要调用AI服务）"""
        # 这里简化处理，实际可能需要更复杂的摘要算法或调用AI服务
        if article.get('summary'):
            return article['summary']
        else:
            # 尝试从URL内容提取简短摘要
            try:
                response = self.session.get(article['url'], timeout=10)
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 尝试找到描述或第一段内容
                desc = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
                if desc:
                    content = desc.get('content', '')[:200]
                else:
                    # 找到主要文本内容
                    paragraphs = soup.find_all('p')
                    content = ' '.join([p.get_text()[:100] for p in paragraphs[:3]])
                    content = content[:200]
                
                return content + '...' if len(content) >= 200 else content
            except:
                return "无法提取摘要"

    def fetch_all_news(self):
        """获取所有来源的新闻"""
        all_articles = []
        
        # 获取各网站新闻
        all_articles.extend(self.fetch_wired_news('https://www.wired.com/search/?q=brain+computer+interface'))
        all_articles.extend(self.fetch_tomshardware_news('https://www.tomshardware.com/search?q=brain+computer+interface'))
        all_articles.extend(self.fetch_sina_finance_news('https://finance.sina.com.cn/search/?q=脑机接口'))
        all_articles.extend(self.fetch_jiemian_news('https://www.jiemian.com/search.html?search=脑机接口'))
        all_articles.extend(self.fetch_neuralink_news('https://neuralink.com/'))
        all_articles.extend(self.fetch_arxiv_papers('https://arxiv.org/search/?query=brain+ computer+ interface&searchtype=all&abstracts=show&order=-announced_date_first'))
        
        # 获取Reddit上的帖子
        all_articles.extend(self.fetch_reddit_posts('Neuralink'))
        all_articles.extend(self.fetch_reddit_posts('BCI'))
        
        # 去重
        seen_titles = set()
        unique_articles = []
        for article in all_articles:
            if article['title'] not in seen_titles:
                seen_titles.add(article['title'])
                unique_articles.append(article)
        
        return unique_articles[:15]  # 返回最多15篇文章

    def format_report(self, articles):
        """格式化报告"""
        if not articles:
            return "今日暂未获取到脑机接口领域的最新资讯。"
        
        report = f"## 脑机接口领域每日资讯 ({datetime.now().strftime('%Y-%m-%d')})\n\n"
        
        for i, article in enumerate(articles, 1):
            # 翻译英文标题为中文
            title = self.translate_to_chinese(article['title'])
            report += f"**{title}**\n"
            
            # 翻译摘要为中文
            summary = article.get('summary', '')
            if summary:
                # 提取有意义的内容，去除HTML标签和无用信息
                clean_summary = self.clean_content(summary)
                translated_summary = self.translate_to_chinese(clean_summary)
                report += f"{translated_summary}\n\n"
            else:
                report += "\n"
        
        return report

    def clean_content(self, content):
        """清理内容，去除HTML标签和无关字符"""
        import re
        # 去除HTML标签
        clean_content = re.sub(r'<[^>]+>', ' ', content)
        # 去除多余的空白字符
        clean_content = re.sub(r'\s+', ' ', clean_content)
        # 去除特殊字符
        clean_content = re.sub(r'[^\w\s\u4e00-\u9fff.,!?;:()\[\]"\'-]', ' ', clean_content)
        # 限制长度
        if len(clean_content) > 300:
            clean_content = clean_content[:300] + "..."
        return clean_content.strip()

    def translate_to_chinese(self, text):
        """简化翻译功能，将英文转换为中文"""
        import re
        
        # 如果内容包含HTML标签，先清理
        clean_text = re.sub(r'<[^>]+>', '', text)
        
        # 更全面的翻译映射
        translations = {
            'Neuralink': 'Neuralink',
            'Brain Computer Interfaces': '脑机接口',
            'Brain-Computer Interface': '脑机接口',
            'General Discussion Thread': '综合讨论串',
            'Livestream': '直播',
            'patient': '患者',
            'Mass Production': '大规模生产',
            'Brain Implants': '脑部植入物',
            'Elon Musk': '埃隆·马斯克',
            'Welcome to': '欢迎来到',
            'engineering': '工程',
            'ethics': '伦理',
            'technology': '技术',
            'science': '科学',
            'Open-source': '开源',
            'web tool': '网络工具',
            'experimenting': '实验',
            'decoders': '解码器',
            'real time': '实时',
            'Questions to ask': '需要询问的问题',
            'evaluating': '评估',
            'neurotech': '神经技术',
            'approaches': '方法',
            'Pioneering': '开拓性',
            'official': '官方',
            'update': '更新',
            'discussion': '讨论',
            'first patient': '首位患者',
            'begin': '开始',
            'says': '表示',
            'posts about': '发布关于',
            'including': '包括',
            'and': '和',
            'for': '用于',
            'with': '与',
            'in': '在',
            'on': '在',
            'the': '的',
            'to': '到',
            'a': '一个',
            'an': '一个',
            'of': '的',
            'are': '是',
            'is': '是',
            'was': '是',
            'were': '是',
        }
        
        result = clean_text
        # 按长度排序，优先替换较长的词组
        sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
        
        for eng, chn in sorted_translations:
            result = re.sub(r'\b' + eng + r'\b', chn, result, flags=re.IGNORECASE)
        
        # 清理多余的空格
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result

    def run(self):
        """执行抓取任务"""
        logger.info("开始获取脑机接口领域最新资讯...")
        articles = self.fetch_all_news()
        report = self.format_report(articles)
        
        # 输出报告
        print(report)
        
        # 同时保存到文件
        filename = f"bci_news_{datetime.now().strftime('%Y%m%d')}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"资讯获取完成，已保存到 {filename}")
        return report

def main():
    fetcher = BCI_News_Fetcher()
    try:
        report = fetcher.run()
        # 如果作为定时任务运行，这里可以发送通知给用户
        # 在实际部署中，可以通过消息系统发送给用户
        print("\n" + "="*50)
        print("脑机接口领域每日资讯获取完成！")
        print("="*50)
    except Exception as e:
        logger.error(f"执行过程中出现错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()