from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from crawler import NewsCrawler
from sources import SCHEDULER_CONFIG
from datetime import datetime
import atexit

class NewsScheduler:
    """定时任务调度器"""

    def __init__(self, crawler=None):
        self.scheduler = BackgroundScheduler()
        self.crawler = crawler if crawler else NewsCrawler()
        self.is_running = False
    
    def start(self):
        """启动定时任务"""
        if not self.is_running:
            # 先执行一次爬虫
            print("Performing initial crawl...")
            self.crawler.crawl_all_sources()
            
            # 添加定时任务
            interval_hours = SCHEDULER_CONFIG['interval_hours']
            self.scheduler.add_job(
                func=self.crawler.crawl_all_sources,
                trigger=IntervalTrigger(hours=interval_hours),
                id='news_crawler_job',
                name='Crawl IVD & Biotech news every {} hours'.format(interval_hours),
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            print(f"Scheduler started. Next crawl in {interval_hours} hours.")
            
            # 注册退出时关闭调度器
            atexit.register(self.shutdown)
    
    def shutdown(self):
        """关闭定时任务"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            print("Scheduler shutdown.")
    
    def get_jobs(self):
        """获取所有定时任务"""
        return self.scheduler.get_jobs()
    
    def get_last_update(self):
        """获取最后更新时间"""
        news = self.crawler.get_all_news()
        return news.get('last_update', 'Never')
