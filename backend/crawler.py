import requests
import feedparser
from datetime import datetime
import json
import os
import sys
from sources import SOURCES, CRAWLER_CONFIG

# 修复编码问题
if sys.stdout.encoding is None or sys.stdout.encoding.lower() not in ['utf-8', 'utf8']:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class NewsCrawler:
    """爬虫类：爬取 RSS 源并提供精选数据保底"""

    def __init__(self):
        self.headers = CRAWLER_CONFIG['headers']
        self.timeout = CRAWLER_CONFIG['timeout']
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
        self.data_file = os.path.join(self.data_dir, 'news.json')
        # curated_news.json 保持在 backend/data/ 下作为回退数据
        self.curated_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'curated_news.json')
        self.load_existing_data()

    def load_existing_data(self):
        """加载现有数据"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.all_news = json.load(f)
            except:
                self.all_news = {}
        else:
            self.all_news = {}

    def save_data(self):
        """保存数据到JSON文件"""
        os.makedirs(self.data_dir, exist_ok=True)
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_news, f, ensure_ascii=False, indent=2)

    def fetch_rss(self, source):
        """爬取RSS源"""
        try:
            try:
                response = requests.get(source.get('rss'), headers=self.headers, timeout=self.timeout)
                feed = feedparser.parse(response.content)
            except:
                feed = feedparser.parse(source.get('rss'))

            news_list = []
            if not feed.entries:
                print(f"Warning: No entries found for {source['name']}")
                return []

            max_items = CRAWLER_CONFIG['max_items_per_source']
            for entry in feed.entries[:max_items]:
                try:
                    item = {
                        'title': entry.get('title', ''),
                        'link': entry.get('link', ''),
                        'summary': str(entry.get('summary', ''))[:200],
                        'published': entry.get('published', datetime.now().isoformat()),
                        'source': source['name'],
                    }
                    news_list.append(item)
                except Exception as item_error:
                    print(f"Error processing RSS entry from {source['name']}: {item_error}")
                    continue

            return news_list
        except Exception as e:
            print(f"Error fetching RSS from {source['name']}: {e}")
            return []

    def fetch_ablesci(self, source):
        """从科研通 (ablesci.com) 抓取每日热点及各平台热搜"""
        import re
        try:
            url = source.get('url', 'https://www.ablesci.com/tophot')
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            html = response.text

            # ---- 1. 提取"每天60秒读懂世界"的每日新闻摘要 ----
            idx = html.find('daily-summary-news-list')
            idx = html.find('daily-summary-news-list', idx + 1)
            idx = html.find('daily-summary-news-list', idx + 1)

            section = html[idx:]
            items = re.findall(
                r"<div class='daily-summary-news-item'>(.*?)</div>",
                section
            )

            news_list = []
            for item in items:
                text = re.sub(r'<span[^>]*>\d+</span>\s*', '', item).strip()
                if text:
                    news_list.append({
                        'title': text[:80],
                        'link': url,
                        'summary': text,
                        'published': datetime.now().isoformat(),
                        'source': '科研通-每日热点',
                    })

            print(f"  + Got {len(news_list)} hot topics from ablesci.com")

            # ---- 2. 提取各平台热搜数据 ----
            self.ablesci_platforms = {}
            platform_ids = [
                'toutiao', 'baidu', 'weibo', 'douyin',
                'sciencenet-news', 'sciencenet-blog',
                'zhihu', 'bilibili', 'xiaohongshu', 'dapenti'
            ]
            # 统一的中文名称映射
            platform_names = {
                'toutiao': '今日头条',
                'baidu': '百度热搜',
                'weibo': '微博热搜',
                'douyin': '抖音热榜',
                'sciencenet-news': '科学网要闻',
                'sciencenet-blog': '科学网博文',
                'zhihu': '知乎热榜',
                'bilibili': 'B站热门',
                'xiaohongshu': '小红书',
                'dapenti': '喷嚏图卦',
            }

            # 按平台ID分割HTML
            parts = html.split('id="tophot-')
            for part in parts[1:]:
                pid = part[:part.index('"')]  # 提取平台ID
                if pid not in platform_ids:
                    continue

                platform_name = platform_names.get(pid, pid)

                # 提取所有热搜条目 (href + class + title)
                links = re.findall(
                    r'<a\s+href="(https?://[^"]+)"[^>]*class="tophot-link"[^>]*title="([^"]*)"[^>]*>',
                    part
                )

                platform_items = []
                for href, title in links:
                    platform_items.append({
                        'title': title,
                        'link': href,
                        'published': datetime.now().isoformat(),
                        'source': platform_name,
                    })

                self.ablesci_platforms[pid] = platform_items
                print(f"  + Got {len(platform_items)} items for '{platform_name}'")

            return news_list
        except Exception as e:
            print(f"Error fetching ablesci.com: {e}")
            return []

    def fetch_ablesci_platform(self, source):
        """从已缓存的数据中读取单个平台的热搜"""
        platform_key = source.get('platform_key', '')
        if not hasattr(self, 'ablesci_platforms'):
            print(f"  ! No ablesci platform data cached")
            return []
        items = self.ablesci_platforms.get(platform_key, [])
        if items:
            print(f"  + Loaded {len(items)} items for {source['name']}")
        return items

    def load_curated_source(self, source):
        """从精选数据文件加载本地资讯"""
        if not os.path.exists(self.curated_file):
            print(f"Warning: curated_news.json not found at {self.curated_file}")
            return []
        try:
            with open(self.curated_file, 'r', encoding='utf-8') as f:
                curated_data = json.load(f)
            category_map = {
                'IVD资讯精选': 'ivd_sources',
                '生物医药资讯精选': 'biotech_sources',
                '学术资讯精选': 'academic_sources',
                '行业数据精选': 'industry_data',
                '文献平台精选': 'literature_sources',
                'AI平台精选': 'ai_platforms',
                '热点资讯精选': 'hot_topics',
            }
            key = category_map.get(source['name'])
            items = curated_data.get(key, []) if key else []
            for item in items:
                item['source'] = source['name']
            print(f"  + Loaded {len(items)} curated items for {source['name']}")
            return items
        except Exception as e:
            print(f"Error loading curated data: {e}")
            return []

    def _crawl_category(self, category_key, old_news):
        """爬取单个分类下的所有源"""
        new_items = []
        for source in SOURCES.get(category_key, []):
            print(f"Crawling: {source['name']}")
            try:
                if source['type'] == 'rss':
                    news = self.fetch_rss(source)
                elif source['type'] == 'curated':
                    news = self.load_curated_source(source)
                elif source['type'] == 'ablesci':
                    news = self.fetch_ablesci(source)
                elif source['type'] == 'ablesci_platform':
                    news = self.fetch_ablesci_platform(source)
                else:
                    news = []

                if news:
                    new_items.extend(news)
                    print(f"  + Got {len(news)} items from {source['name']}")
                else:
                    # 只保留该具体来源的旧数据，避免混入无关的硬编码内容
                    if category_key in old_news:
                        kept = [item for item in old_news[category_key] if item.get('source') == source['name']]
                        if kept:
                            new_items.extend(kept)
                            print(f"  - No data from {source['name']}, kept {len(kept)} existing items from this source")
            except Exception as e:
                print(f"  ! Error from {source['name']}: {e}")
                if category_key in old_news:
                    kept = [item for item in old_news[category_key] if item.get('source') == source['name']]
                    if kept:
                        new_items.extend(kept)
        return new_items

    def crawl_all_sources(self):
        """爬取所有信息源"""
        print(f"Starting crawl at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        old_news = self.all_news.copy()

        new_news = {
            'ivd_sources': self._crawl_category('ivd_sources', old_news),
            'biotech_sources': self._crawl_category('biotech_sources', old_news),
            'academic_sources': self._crawl_category('academic_sources', old_news),
            'industry_data': self._crawl_category('industry_data', old_news),
            'literature_sources': self._crawl_category('literature_sources', old_news),
            'ai_platforms': self._crawl_category('ai_platforms', old_news),
            'global_news': self._crawl_category('global_news', old_news),
            'hot_topics': self._crawl_category('hot_topics', old_news),
            'last_update': datetime.utcnow().isoformat() + 'Z'
        }

        self.all_news = new_news
        self.save_data()

        print(f"Crawl completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        total = sum(len(items) for key, items in self.all_news.items() if key != 'last_update')
        print(f"Total news items: {total}")

    def get_all_news(self):
        """获取所有新闻"""
        return self.all_news

    def search_news(self, keyword):
        """搜索新闻"""
        results = []
        kw = keyword.lower()
        for category, items in self.all_news.items():
            if category == 'last_update':
                continue
            for item in items:
                if kw in item.get('title', '').lower() or kw in item.get('summary', '').lower():
                    results.append({**item, 'category': category})
        return results
