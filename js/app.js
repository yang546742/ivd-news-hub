const { createApp } = Vue;

// ==================== 每日金句库 ====================
const QUOTES = [
    "种一棵树最好的时间是十年前，其次是现在。",
    "生活不是等待风暴过去，而是学会在雨中翩翩起舞。",
    "你的任务不是寻找爱，而是寻找并拆除你内心建造的障碍。",
    "山不向我走来，我便向山走去。",
    "世界上只有一种真正的英雄主义，那就是认清生活真相后依然热爱生活。",
    "所有的事到最后都会是好事，如果还不是，那它还没到最后。",
    "不要因为走得太远，而忘了我们为什么出发。",
    "平凡的人，也可以拥有不平凡的一生。",
    "道阻且长，行则将至；行而不辍，未来可期。",
    "每个人都是自己的救世主，你的光就在你心里。",
    "人生没有白走的路，每一步都算数。",
    "不是所有坚持都有结果，但总有一些坚持，能从一寸冰封的土地里，培育出十万朵怒放的蔷薇。",
    "无论你去哪里，无论你做什么，记得带上自己的阳光。",
    "既然选择了远方，便只顾风雨兼程。",
    "日出之美便在于它脱胎于最深的黑暗。",
    "人生的意义在于拓展，而不在于固守。",
    "勇敢的人不是不落泪的人，而是愿意含着泪继续奔跑的人。",
    "且视他人之疑目如盏盏鬼火，大胆去走你的夜路。",
    "生活不需要比别人好，但一定要比以前好。",
    "愿你千山暮雪，海棠依旧。不为岁月惊扰，平添忧愁。",
    "心之所向，素履以往。",
    "没有一个冬天不可逾越，没有一个春天不会来临。",
    "星光不问赶路人，时光不负有心人。",
    "慢慢来，比较快。",
    "心中有丘壑，眉目作山河。",
];

// ==================== AI 辣评模板 ====================
const AI_REVIEW_TEMPLATES = [
    (items) => {
        const t = items.map(i => i.title.replace(/^【[^】]*】\s*/, '').slice(0, 15)).join('、');
        return `📡 今日雷达扫描完毕，最热三条：${t}…… 世界变化太快，小编表示CPU已干烧。`;
    },
    (items) => {
        const t = items.map(i => i.title.replace(/^【[^】]*】\s*/, '').slice(0, 12));
        return `🔥 今日头条《${t[0]}》，微博热搜《${t[1] || '暂无'}》，知乎热议《${t[2] || '暂无'}》。总结：人类又在整活了。`;
    },
    (items) => {
        const t = items[0]?.title.replace(/^【[^】]*】\s*/, '').slice(0, 20) || '这个世界';
        return `🤯 今日最炸裂：${t}。想知道详情？点进去看看就知道了。`;
    },
    (items) => {
        const t1 = items[0]?.title.replace(/^【[^】]*】\s*/, '').slice(0, 15) || '新闻';
        const t2 = items[1]?.title.replace(/^【[^】]*】\s*/, '').slice(0, 15) || '新闻';
        return `🎯 当《${t1}》碰到《${t2}》，我放下手机沉思了三秒——人类的智慧真是无穷无尽。`;
    },
    (items) => {
        const t = items.slice(0, 2).map(i => i.source).join(' vs ');
        return `⚡ ${t} 同时炸场，今天的热点浓度超标了。建议备好瓜子饮料再看。`;
    },
];

// ==================== 中文停用词 ====================
const STOP_WORDS = new Set([
    '的', '了', '在', '是', '我', '你', '他', '她', '它', '我们', '你们', '他们',
    '们', '这', '那', '和', '与', '就', '又', '也', '还', '都', '要', '有', '不',
    '很', '会', '能', '对', '上', '下', '中', '大', '小', '多', '少', '好', '新',
    '年', '月', '日', '时', '等', '及', '或', '而', '但', '更', '让', '被', '把',
    '从', '以', '到', '去', '说', '来', '为', '之', '所', '其', '一', '个', '人',
    '中国', '没有', '进行', '可以', '通过', '以及', '一个', '不是', '就是',
    '这个', '那个', '这些', '那些', '已经', '成为', '使用', '研究', '发现',
    '这是', '还是', '之间', '用于', '来自', '为什', '怎么', '如何', '哪些',
]);

const WORD_CLOUD_COLORS = [
    '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
    '#ca8a04', '#16a34a', '#0891b2', '#4f46e5', '#be185d',
    '#0369a1', '#6d28d9', '#b91c1c', '#c2410c', '#a16207',
];

// ==================== 提取热词（客户端中文分词） ====================
function extractHotWords(items, maxWords = 30) {
    try {
        const text = items.map(item => item.title).join(' ');
        const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
        const segments = segmenter.segment(text);

        const freq = {};
        for (const seg of segments) {
            const word = seg.segment.trim();
            if (seg.isWordLike && word.length >= 2 && !STOP_WORDS.has(word)) {
                // 过滤纯数字、纯标点、URL
                if (/^[\d\s\p{P}]+$/u.test(word)) continue;
                if (word.startsWith('http') || word.includes('.')) continue;
                freq[word] = (freq[word] || 0) + 1;
            }
        }

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxWords)
            .map(([text, count]) => ({ text, count }));
    } catch (e) {
        // Intl.Segmenter 不支持时的降级
        console.warn('Intl.Segmenter not supported, using fallback');
        const allText = items.map(item => item.title).join(' ');
        return extractHotWordsFallback(allText, maxWords);
    }
}

function extractHotWordsFallback(text, maxWords = 30) {
    const freq = {};
    // 简单 2-gram 方式
    for (let i = 0; i < text.length - 1; i++) {
        const word = text.slice(i, i + 2).trim();
        if (word.length === 2 && !STOP_WORDS.has(word) && /[一-鿿]/.test(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }
    // 也试试 3-gram
    for (let i = 0; i < text.length - 2; i++) {
        const word = text.slice(i, i + 3).trim();
        if (word.length === 3 && !STOP_WORDS.has(word) && /^[一-鿿]{3}$/.test(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxWords)
        .map(([text, count]) => ({ text, count }));
}

// ==================== 平台水印图标映射 ====================
const SOURCE_WATERMARKS = {
    '今日头条': '📰',
    '百度热搜': '🔍',
    '微博热搜': '💬',
    '抖音热榜': '🎵',
    '科学网要闻': '🔬',
    '科学网博文': '📝',
    '知乎热榜': '💡',
    'B站热门': '📺',
    '小红书': '📕',
    '喷嚏图卦': '🖼️',
    '科研通-每日热点': '📰',
    'Nature': '🧬',
    'Science': '🔭',
    '丁香园': '💊',
    '生物谷': '🧫',
    'PubMed': '📋',
    'Google Scholar': '🎓',
    'arXiv': '📄',
};

// ==================== 随机颜色（基于字符串哈希） ====================
function hashColor(str) {
    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// ==================== 应用 ====================
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

            // 热词云
            hotWords: [],

            // 随机骰子
            randomResult: null,
            isRandoming: false,

            // AI 辣评
            aiHotReview: '',

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
        // 每日金句
        dailyQuote() {
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 0);
            const diff = today - start;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            return QUOTES[dayOfYear % QUOTES.length];
        },

        // 随机翻牌 accent 颜色
        randomAccent() {
            if (!this.randomResult) return '#292524';
            return hashColor(this.randomResult.source);
        },

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

        // 加载新闻数据
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

                // 生成热词云和AI辣评
                this.generateHotWords();
                this.generateAiReview();
            } catch (error) {
                console.error('加载新闻失败:', error);
                alert('加载新闻失败，请确认 data/news.json 文件存在');
            } finally {
                this.isLoading = false;
            }
        },

        // ---------- 热词云 ----------
        generateHotWords() {
            if (this.allNewsFlat.length === 0) return;
            this.hotWords = extractHotWords(this.allNewsFlat, 30);
        },

        wordStyle(word) {
            const min = this.hotWords[this.hotWords.length - 1]?.count || 1;
            const max = this.hotWords[0]?.count || 1;
            const range = Math.max(max - min, 1);
            const ratio = (word.count - min) / range;

            const size = 11 + ratio * 7;  // 11px ~ 18px
            let h = 0;
            for (let i = 0; i < word.text.length; i++) h = word.text.charCodeAt(i) + ((h << 5) - h);
            const color = WORD_CLOUD_COLORS[Math.abs(h) % WORD_CLOUD_COLORS.length];

            return {
                fontSize: `${size.toFixed(1)}px`,
                color: color,
                opacity: 0.55 + ratio * 0.45,
                fontWeight: ratio > 0.6 ? 700 : 500,
            };
        },

        // 点击热词搜索
        searchWord(word) {
            this.searchKeyword = word;
            // 使用 nextTick 确保 input 已更新
            this.$nextTick(() => {
                this.searchNews();
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },

        // ---------- 卡片水印 ----------
        sourceWatermark(source) {
            for (const [key, emoji] of Object.entries(SOURCE_WATERMARKS)) {
                if (source.includes(key)) return emoji;
            }
            return '📄';
        },

        // ---------- 热度暴击判定 ----------
        isHotItem(item) {
            if (!item || !item.title) return false;
            // 基于标题哈希的确定性判定，约15%的卡片获得🔥
            let hash = 0;
            for (let i = 0; i < item.title.length; i++) {
                hash = item.title.charCodeAt(i) + ((hash << 5) - hash);
            }
            return Math.abs(hash) % 7 === 0;
        },

        // ---------- 随机骰子 ----------
        randomPick() {
            if (this.allNewsFlat.length === 0) return;
            this.isRandoming = true;

            // 小延迟增加仪式感
            setTimeout(() => {
                const idx = Math.floor(Math.random() * this.allNewsFlat.length);
                this.randomResult = this.allNewsFlat[idx];
                this.isRandoming = false;
            }, 300);
        },

        closeRandom() {
            this.randomResult = null;
        },

        // ---------- AI 辣评 ----------
        generateAiReview() {
            // 取热点平台 + 所有分类的 top 新闻
            const candidates = this.allNewsFlat
                .filter(item => item.title && !item.title.startsWith('[占位]'))
                .sort(() => Math.random() - 0.5);  // 随机打乱增加多样性

            if (candidates.length === 0) {
                this.aiHotReview = '暂无数据，无法生成辣评。';
                return;
            }

            // 优先取热点平台的新闻
            const hotItems = candidates.filter(i => i._category === 'hot_topics');
            const topNews = hotItems.length >= 3
                ? hotItems.slice(0, 3)
                : candidates.slice(0, 3);

            const templateIdx = new Date().getDate() % AI_REVIEW_TEMPLATES.length;
            this.aiHotReview = AI_REVIEW_TEMPLATES[templateIdx](topNews);
        },

        // ---------- 刷新 ----------
        async refreshNews() {
            this.isLoading = true;
            await this.loadNews();
            this.isLoading = false;
        },

        // ---------- 搜索 ----------
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
            return hashColor(source);
        },
    },

    mounted() {
        this.init();
        this.$nextTick(() => this.initTvDrag());
    },

    // ---------- 复古电视拖拽 ----------
    initTvDrag() {
        const widget = document.getElementById('retro-tv-widget');
        const handle = widget?.querySelector('.tv-drag-handle');
        if (!widget || !handle) return;

        let isDragging = false, startX, startY, origX, origY;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'IFRAME') return;
            isDragging = true;
            const rect = widget.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origX = rect.left;
            origY = rect.top;
            widget.style.position = 'fixed';
            widget.style.left = origX + 'px';
            widget.style.top = origY + 'px';
            widget.style.zIndex = 200;
            widget.style.margin = '0';
            widget.style.width = rect.width + 'px';
            widget.style.maxWidth = '560px';
            document.body.appendChild(widget);

            const onMove = (ev) => {
                if (!isDragging) return;
                widget.style.left = (origX + ev.clientX - startX) + 'px';
                widget.style.top = (origY + ev.clientY - startY) + 'px';
            };
            const onUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    },
});

app.mount('#app');
