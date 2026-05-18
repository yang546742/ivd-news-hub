#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成初始新闻数据脚本
从精选数据文件 (curated_news.json) 生成初始 news.json

用法: python generate_test_data.py
"""

import json
import os
import sys
from datetime import datetime

# 修复编码问题
if sys.stdout.encoding is None or sys.stdout.encoding.lower() not in ['utf-8', 'utf8']:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


def generate_initial_data():
    """从精选数据生成初始新闻数据"""

    curated_path = os.path.join('data', 'curated_news.json')
    if not os.path.exists(curated_path):
        print(f"Error: curated_news.json not found at {curated_path}")
        print("Please ensure data/curated_news.json exists")
        return

    with open(curated_path, 'r', encoding='utf-8') as f:
        curated = json.load(f)

    news_data = {
        'ivd_sources': curated.get('ivd_sources', []),
        'biotech_sources': curated.get('biotech_sources', []),
        'academic_sources': curated.get('academic_sources', []),
        'industry_data': curated.get('industry_data', []),
        'literature_sources': curated.get('literature_sources', []),
        'ai_platforms': curated.get('ai_platforms', []),
        'hot_topics': curated.get('hot_topics', []),
        'global_news': curated.get('global_news', []),
        'last_update': datetime.utcnow().isoformat() + 'Z'
    }

    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)

    news_path = os.path.join(data_dir, 'news.json')
    with open(news_path, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)

    total = sum(len(items) for key, items in news_data.items() if key != 'last_update')
    print("Initial data generated successfully!")
    print(f"Saved to: {news_path}")
    print(f"Total: {total} news items")
    print(f"  - IVD sources: {len(news_data['ivd_sources'])}")
    print(f"  - Biotech: {len(news_data['biotech_sources'])}")
    print(f"  - Academic: {len(news_data['academic_sources'])}")
    print(f"  - Industry: {len(news_data['industry_data'])}")
    print(f"  - Literature: {len(news_data['literature_sources'])}")
    print(f"  - AI platforms: {len(news_data['ai_platforms'])}")
    print(f"  - Hot topics: {len(news_data['hot_topics'])}")
    print(f"  - Global news: {len(news_data['global_news'])}")
    print("\nStart the app and open http://localhost:5000 to view!")


if __name__ == '__main__':
    generate_initial_data()
