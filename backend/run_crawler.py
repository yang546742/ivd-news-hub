"""GitHub Actions 独立爬虫脚本"""
from crawler import NewsCrawler

crawler = NewsCrawler()
crawler.crawl_all_sources()

total = sum(len(v) for k, v in crawler.all_news.items() if k != 'last_update')
print(f"\nDone! {total} news items collected.")
