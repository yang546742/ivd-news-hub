const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 所有新闻数据
            allNews: {},
            allNewsFlat: [],
            searchResults: [],

            // UI状态
            activeCategory: 'hot_topics',
            searchKeyword: '',
            currentPage: 1,
            itemsPerPage: 12,
            isLoading: false,
            isSearching: false,

            // 统计信息
            lastUpdate: '加载中...',
            totalNews: 0,

            // 热点平台子分类
            activePlatform: 'all',

            // 分类配置
            categories: [
                { key: 'hot_topics', name: '🔥 热点平台' },
                { key: 'ivd_sources', name: '🧬 IVD信息源' },
                { key: 'biotech_sources', name: '🔬 生物医药' },
                { key: 'academic_sources', name: '📚 学术信息' },
                { key: 'literature_sources', name: '📖 文献平台' },
                { key: 'ai_platforms', name: '🤖 AI平台' },
                { key: 'industry_data', name: '📊 行业数据' },
            ],

            // 热点平台子分类
            platforms: [
                { key: 'all', name: '全部' },
                { key: 'daily', name: '📰 60秒', source: '科研通-每日热点' },
                { key: 'toutiao', name: '📰 头条', source: '今日头条' },
                { key: 'baidu', name: '🔍 百度', source: '百度热搜' },
                { key: 'weibo', name: '💬 微博', source: '微博热搜' },
                { key: 'douyin', name: '🎬 抖音', source: '抖音热榜' },
                { key: 'sciencenet-news', name: '🔬 科学网', source: '科学网要闻' },
                { key: 'sciencenet-blog', name: '📝 科博', source: '科学网博文' },
                { key: 'zhihu', name: '💡 知乎', source: '知乎热榜' },
                { key: 'bilibili', name: '📺 B站', source: 'B站热门' },
                { key: 'xiaohongshu', name: '📕 小红书', source: '小红书' },
                { key: 'dapenti', name: '🖼️ 喷嚏', source: '喷嚏图卦' },
            ],
        }
    },

    computed: {
        // 当前分类的新闻（未分页）
        categoryNews() {
            if (this.searchResults.length > 0) {
                return this.searchResults;
            }
            return this.allNews[this.activeCategory] || [];
        },

        // 热点平台过滤后的新闻
        filteredPlatformNews() {
            if (this.activeCategory !== 'hot_topics' || this.activePlatform === 'all') {
                return this.categoryNews;
            }
            const platform = this.platforms.find(p => p.key === this.activePlatform);
            if (!platform || !platform.source) return this.categoryNews;
            return this.categoryNews.filter(item => item.source === platform.source);
        },

        // 计算总页数
        totalPages() {
            return Math.ceil(this.filteredPlatformNews.length / this.itemsPerPage);
        },

        // 计算当前页的新闻
        displayedNews() {
            const source = this.searchResults.length > 0 ? this.searchResults : this.filteredPlatformNews;
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return source.slice(start, end);
        },
    },

    methods: {
        // 初始化应用
        async init() {
            await this.loadNews();
        },

        // 加载新闻数据 — 直接读取本地 news.json
        async loadNews() {
            this.isLoading = true;
            try {
                const resp = await fetch('data/news.json?_=' + Date.now());
                const data = await resp.json();

                this.allNews = {};
                this.allNewsFlat = [];
                this.lastUpdate = '未知';

                for (const [key, value] of Object.entries(data)) {
                    if (key === 'last_update') {
                        this.lastUpdate = value;
                    } else if (Array.isArray(value)) {
                        this.allNews[key] = value;
                        value.forEach(item =>
                            this.allNewsFlat.push({ ...item, _category: key })
                        );
                    }
                }

                this.totalNews = this.allNewsFlat.length;
                this.currentPage = 1;
            } catch (error) {
                console.error('加载新闻失败:', error);
                alert('加载新闻失败，请确认 data/news.json 文件存在');
            } finally {
                this.isLoading = false;
            }
        },

        // 刷新数据（重新读取 news.json）
        async refreshNews() {
            this.isLoading = true;
            await this.loadNews();
            this.isLoading = false;
        },

        // 搜索 — 客户端过滤
        searchNews() {
            const keyword = this.searchKeyword.trim();
            if (!keyword) {
                alert('请输入搜索关键词');
                return;
            }
            this.isSearching = true;
            const kw = keyword.toLowerCase();
            this.searchResults = this.allNewsFlat.filter(item =>
                item.title.toLowerCase().includes(kw) ||
                (item.summary && item.summary.toLowerCase().includes(kw))
            );
            this.currentPage = 1;
            this.isSearching = false;
            if (this.searchResults.length === 0) {
                alert('未找到相关信息');
            }
        },

        // 清除搜索
        clearSearch() {
            this.searchKeyword = '';
            this.searchResults = [];
            this.currentPage = 1;
        },

        // 切换热点平台子分类
        switchPlatform(platformKey) {
            this.activePlatform = platformKey;
            this.currentPage = 1;
        },

        // 计算相对时间
        formatDate(dateString) {
            if (!dateString) return '未知';
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diff = now - date;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(hours / 24);

                if (hours < 1) return '刚刚';
                if (hours < 24) return `${hours}小时前`;
                if (days < 7) return `${days}天前`;
                return date.toLocaleDateString('zh-CN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        },

        // 卡片顶部分隔线颜色
        sourceAccent(source) {
            const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1'];
            let hash = 0;
            for (let i = 0; i < source.length; i++) {
                hash = source.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colors[Math.abs(hash) % colors.length];
        },
    },

    mounted() {
        this.init();
    }
});

app.mount('#app');
