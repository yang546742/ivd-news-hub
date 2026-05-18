# IVD和生物医药行业信息源配置

SOURCES = {
    'ivd_sources': [
        {
            'name': 'Nature-医学研究',
            'type': 'rss',
            'rss': 'https://www.nature.com/subjects/medical-research.rss',
            'url': 'https://www.nature.com/subjects/medical-research'
        },
        {
            'name': 'ScienceDaily-医学',
            'type': 'rss',
            'rss': 'https://www.sciencedaily.com/rss/health_medicine/medical_biochemistry.xml',
            'url': 'https://www.sciencedaily.com'
        },
        {
            'name': '丁香园-最新资讯',
            'type': 'rss',
            'rss': 'https://rsshub.app/dxy/latest',
            'url': 'https://www.dxy.cn'
        },
        {
            'name': '生物谷新闻',
            'type': 'rss',
            'rss': 'https://rsshub.app/bioon/latest',
            'url': 'https://www.bioon.com'
        },
        {
            'name': 'IVD资讯精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'biotech_sources': [
        {
            'name': 'EurekAlert-医学',
            'type': 'rss',
            'rss': 'https://www.eurekalert.org/rss/medical.xml',
            'url': 'https://www.eurekalert.org'
        },
        {
            'name': 'Nature-生物技术',
            'type': 'rss',
            'rss': 'https://www.nature.com/subjects/biotechnology.rss',
            'url': 'https://www.nature.com/subjects/biotechnology'
        },
        {
            'name': 'ScienceDaily-生物',
            'type': 'rss',
            'rss': 'https://www.sciencedaily.com/rss/plants_animals/biology.xml',
            'url': 'https://www.sciencedaily.com'
        },
        {
            'name': '生物医药资讯精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'academic_sources': [
        {
            'name': 'Nature最新',
            'type': 'rss',
            'rss': 'https://www.nature.com/nature.rss',
            'url': 'https://www.nature.com'
        },
        {
            'name': 'Science新闻',
            'type': 'rss',
            'rss': 'https://www.science.org/rss/news.xml',
            'url': 'https://www.science.org'
        },
        {
            'name': 'PLOS ONE',
            'type': 'rss',
            'rss': 'https://journals.plos.org/plosone/feed/atom',
            'url': 'https://journals.plos.org/plosone'
        },
        {
            'name': '学术资讯精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'industry_data': [
        {
            'name': 'EurekAlert-科学',
            'type': 'rss',
            'rss': 'https://www.eurekalert.org/rss/science.xml',
            'url': 'https://www.eurekalert.org'
        },
        {
            'name': '药智网资讯',
            'type': 'rss',
            'rss': 'https://rsshub.app/yaozh/latest',
            'url': 'https://www.yaozh.com'
        },
        {
            'name': '行业数据精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'literature_sources': [
        {
            'name': '文献平台精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'ai_platforms': [
        {
            'name': 'AI平台精选',
            'type': 'curated',
            'url': '#'
        },
    ],
    'global_news': [
        {
            'name': '虎嗅-科技商业',
            'type': 'rss',
            'rss': 'https://www.huxiu.com/rss/0.xml',
            'url': 'https://www.huxiu.com'
        },
        {
            'name': '机器之心-AI',
            'type': 'rss',
            'rss': 'https://www.jiqizhixin.com/rss',
            'url': 'https://www.jiqizhixin.com'
        },
        {
            'name': '36氪-科技新闻',
            'type': 'rss',
            'rss': 'https://36kr.com/feed',
            'url': 'https://36kr.com'
        },
        {
            'name': 'Solidot-科技',
            'type': 'rss',
            'rss': 'https://www.solidot.org/index.rss',
            'url': 'https://www.solidot.org'
        },
    ],
    'hot_topics': [
        {
            'name': '科研通-每日热点',
            'type': 'ablesci',
            'url': 'https://www.ablesci.com/tophot'
        },
        # 各平台热点（从科研通页面提取）
        {
            'name': '今日头条',
            'type': 'ablesci_platform',
            'platform_key': 'toutiao',
        },
        {
            'name': '百度热搜',
            'type': 'ablesci_platform',
            'platform_key': 'baidu',
        },
        {
            'name': '微博热搜',
            'type': 'ablesci_platform',
            'platform_key': 'weibo',
        },
        {
            'name': '抖音热榜',
            'type': 'ablesci_platform',
            'platform_key': 'douyin',
        },
        {
            'name': '科学网要闻',
            'type': 'ablesci_platform',
            'platform_key': 'sciencenet-news',
        },
        {
            'name': '科学网博文',
            'type': 'ablesci_platform',
            'platform_key': 'sciencenet-blog',
        },
        {
            'name': '知乎热榜',
            'type': 'ablesci_platform',
            'platform_key': 'zhihu',
        },
        {
            'name': 'B站热门',
            'type': 'ablesci_platform',
            'platform_key': 'bilibili',
        },
        {
            'name': '小红书',
            'type': 'ablesci_platform',
            'platform_key': 'xiaohongshu',
        },
        {
            'name': '喷嚏图卦',
            'type': 'ablesci_platform',
            'platform_key': 'dapenti',
        },
        {
            'name': '热点资讯精选',
            'type': 'curated',
            'url': '#'
        },
    ]
}

# 爬虫配置
CRAWLER_CONFIG = {
    'timeout': 15,
    'retry_times': 3,
    'headers': {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    'max_items_per_source': 10,
}

# 定时任务配置
SCHEDULER_CONFIG = {
    'interval_hours': 12,
    'max_retries': 3,
}
