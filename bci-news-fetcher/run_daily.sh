#!/bin/bash

# 脑机接口新闻抓取定时任务脚本
# 每天上午10点执行

cd /root/aicoding/bci-news-fetcher

# 激活Python虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 安装依赖（如果需要）
pip install -r requirements.txt

# 执行新闻抓取脚本
python3 fetch_bci_news.py

# 获取输出结果并发送通知
echo "脑机接口领域每日资讯已更新，详情请查看 /root/aicoding/bci-news-fetcher/ 目录下的最新报告。"