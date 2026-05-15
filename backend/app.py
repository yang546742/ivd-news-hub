from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from crawler import NewsCrawler
from scheduler import NewsScheduler
import os
import sys

# 修复编码问题
if sys.stdout.encoding is None or sys.stdout.encoding.lower() not in ['utf-8', 'utf8']:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 获取前端目录的绝对路径
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')

# 创建Flask应用 - 分别配置静态文件夹和URL路径
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 初始化爬虫和定时任务
crawler = NewsCrawler()
scheduler = NewsScheduler(crawler=crawler)

# 启动定时任务
scheduler.start()

# ==================== API 路由 ====================

@app.route('/', methods=['GET'])
def home():
    """主页"""
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/api', methods=['GET'])
def api_home():
    """API主页"""
    return {
        'message': 'IVD Industry News Hub API',
        'version': '1.0.0',
        'endpoints': {
            '/api/news': 'Get all news',
            '/api/news/search': 'Search news by keyword',
            '/api/news/category/<category>': 'Get news by category',
            '/api/status': 'Get crawler status',
            '/api/crawl-now': 'Trigger crawl immediately (POST)',
        }
    }

@app.route('/api/news', methods=['GET'])
def get_all_news():
    """获取所有新闻"""
    try:
        news = crawler.get_all_news()
        return jsonify({
            'success': True,
            'data': news,
            'total_items': sum(len(items) for key, items in news.items() if key != 'last_update')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/news/category/<category>', methods=['GET'])
def get_news_by_category(category):
    """按分类获取新闻"""
    try:
        news = crawler.get_all_news()
        
        from sources import SOURCES
        valid_categories = list(SOURCES.keys())

        if category not in valid_categories:
            return jsonify({
                'success': False,
                'error': f'Invalid category. Valid categories: {", ".join(valid_categories)}'
            }), 400
        
        category_news = news.get(category, [])
        
        return jsonify({
            'success': True,
            'category': category,
            'data': category_news,
            'total_items': len(category_news)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/news/search', methods=['GET'])
def search_news():
    """搜索新闻"""
    try:
        keyword = request.args.get('q', '').strip()
        
        if not keyword:
            return jsonify({
                'success': False,
                'error': 'Search keyword is required'
            }), 400
        
        results = crawler.search_news(keyword)
        
        return jsonify({
            'success': True,
            'keyword': keyword,
            'results': results,
            'total_items': len(results)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """获取爬虫状态"""
    try:
        jobs = scheduler.get_jobs()
        last_update = scheduler.get_last_update()
        
        return jsonify({
            'success': True,
            'status': 'running' if scheduler.is_running else 'stopped',
            'last_update': last_update,
            'scheduled_jobs': len(jobs),
            'next_crawl': jobs[0].next_run_time.isoformat() if jobs else 'Not scheduled'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/crawl-now', methods=['POST'])
def crawl_now():
    """立即执行爬虫"""
    try:
        crawler.crawl_all_sources()
        
        return jsonify({
            'success': True,
            'message': 'Crawl completed',
            'last_update': crawler.get_all_news().get('last_update')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/static/<path:path>')
def send_static(path):
    """提供静态文件（CSS、JS等）"""
    return send_from_directory(frontend_dir, path)

@app.route('/<path:path>')
def send_any_static(path):
    """提供任何静态文件（JS、CSS等）"""
    file_path = os.path.join(frontend_dir, path)
    if os.path.isfile(file_path):
        return send_from_directory(frontend_dir, path)
    # 如果文件不存在，返回主页
    return send_from_directory(frontend_dir, 'index.html')

# ==================== 错误处理 ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'error': 'Not found'
    }), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("=" * 50)
    print("IVD News Hub API Server")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("Open http://localhost:5000/static/index.html in your browser")
    print("=" * 50)
    
    # 运行Flask应用
    app.run(debug=False, host='0.0.0.0', port=5000)
