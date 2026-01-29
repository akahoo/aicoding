# BCI News Fetcher - 脑机接口领域资讯自动抓取系统

此项目用于自动从多个脑机接口相关网站抓取最新资讯，并整理成中文摘要。

## 功能特点

- 每天上午10点自动运行（北京时间）
- 从以下来源抓取信息：
  - 国际科技媒体（Wired、Tom's Hardware、Times of India）
  - 中文财经科技新闻（新浪财经、界面新闻、东方财富网）
  - 行业公司官网（Neuralink、Synchron、OpenBCI）
  - 学术资源（arXiv论文）
  - 社区平台（Reddit的r/Neuralink、r/BCI等）
- 自动生成Markdown格式的日报
- 支持去重和智能摘要

## 文件结构

- `fetch_bci_news.py` - 主要的新闻抓取脚本
- `requirements.txt` - Python依赖列表
- `run_daily.sh` - 启动脚本
- `daily_log.txt` - 日志输出文件
- `bci_news_YYYYMMDD.md` - 每日生成的新闻摘要文件

## 定时任务

系统已设置cron任务，每天上午10点自动运行新闻抓取脚本：
```
0 10 * * * cd /root/aicoding/bci-news-fetcher && /usr/bin/python3 fetch_bci_news.py >> /root/aicoding/bci-news-fetcher/daily_log.txt 2>&1
```

## 使用方法

手动运行：
```bash
cd /root/aicoding/bci-news-fetcher
python3 fetch_bci_news.py
```

查看最近的抓取结果：
```bash
ls -la *.md
```

## 维护

如需修改抓取的网站或调整频率，编辑相应的脚本文件并更新cron任务即可。

## 注意事项

- 所有抓取的数据均按原样呈现，仅供参考
- 请注意遵守各网站的robots.txt和使用条款
- 如遇到反爬虫机制，可能需要调整请求频率或增加代理