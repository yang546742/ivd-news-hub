const { createApp } = Vue;

// ==================== 十二星座数据 ====================
const ZODIAC = [
    { name: '白羊座', eng: 'Aries', emoji: '♈', date: '3.21-4.19' },
    { name: '金牛座', eng: 'Taurus', emoji: '♉', date: '4.20-5.20' },
    { name: '双子座', eng: 'Gemini', emoji: '♊', date: '5.21-6.21' },
    { name: '巨蟹座', eng: 'Cancer', emoji: '♋', date: '6.22-7.22' },
    { name: '狮子座', eng: 'Leo', emoji: '♌', date: '7.23-8.22' },
    { name: '处女座', eng: 'Virgo', emoji: '♍', date: '8.23-9.22' },
    { name: '天秤座', eng: 'Libra', emoji: '♎', date: '9.23-10.23' },
    { name: '天蝎座', eng: 'Scorpio', emoji: '♏', date: '10.24-11.22' },
    { name: '射手座', eng: 'Sagittarius', emoji: '♐', date: '11.23-12.21' },
    { name: '摩羯座', eng: 'Capricorn', emoji: '♑', date: '12.22-1.19' },
    { name: '水瓶座', eng: 'Aquarius', emoji: '♒', date: '1.20-2.18' },
    { name: '双鱼座', eng: 'Pisces', emoji: '♓', date: '2.19-3.20' },
];

const FORTUNES = [
    '机遇涌动，大胆把握', '稳中求进，不宜冒进', '贵人相助，事半功倍',
    '心平气和，顺其自然', '思维活跃，创意无限', '人际关系佳，合作顺利',
    '专注当下，必有收获', '小有波折，终将化解', '宜静不宜动，韬光养晦',
    '桃花旺盛，情感升温', '财运亨通，正偏皆宜', '健康优先，劳逸结合',
];

// 当日天数（模块级，避免重复计算）
const __today = new Date();
const __start = new Date(__today.getFullYear(), 0, 0);
const DAY_OF_YEAR = Math.floor((__today - __start) / (1000 * 60 * 60 * 24));

function generateZodiac(idx, dayOfYear) {
    const seed = dayOfYear * 7 + idx * 13;
    const rand = (n) => Math.abs(Math.sin(seed * (n + 1))) * 100 % 100 / 100;
    const luck = Math.floor(rand(1) * 5) + 1;
    const fi = Math.floor(rand(2) * FORTUNES.length);
    const sign = ZODIAC[idx];
    return {
        name: sign.name,
        emoji: sign.emoji,
        luck,
        fortune: FORTUNES[fi],
        date: sign.date,
    };
}

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
    '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
    '#93c5fd', '#bfdbfe', '#1e3a8a', '#1e40af', '#2563eb',
    '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af',
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
            activeCategory: 'academic_sources',
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

            // 右侧栏折叠
            zodiacCollapsed: true,

            // 白噪音
            activeNoise: '',
            noiseTypes: [
                { key: 'rain', label: '🌧️ 雨声' },
                { key: 'forest', label: '🌲 森林' },
                { key: 'campfire', label: '🔥 篝火' },
            ],

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
                { key: 'toutiao', name: '📰 今日头条', source: '今日头条' },
                { key: 'baidu', name: '🔍 百度热搜', source: '百度热搜' },
                { key: 'weibo', name: '💬 微博', source: '微博热搜' },
                { key: 'douyin', name: '🎬 抖音', source: '抖音热榜' },
                { key: 'sciencenet-news', name: '🔬 科学网-要闻', source: '科学网要闻' },
                { key: 'sciencenet-blog', name: '📝 科学网-热点博文', source: '科学网博文' },
                { key: 'zhihu', name: '💡 知乎热榜', source: '知乎热榜' },
                { key: 'bilibili', name: '📺 哔哩哔哩', source: 'B站热门' },
                { key: 'xiaohongshu', name: '📕 小红书', source: '小红书' },
                { key: 'dapenti', name: '🖼️ 喷嚏图卦', source: '喷嚏图卦' },
            ],
        }
    },

    computed: {
        // 今日星座运势
        zodiac() {
            return ZODIAC.map((_, i) => generateZodiac(i, DAY_OF_YEAR));
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

            // 骰子旋转动画
            const btn = document.querySelector('.dice-btn');
            if (btn) btn.classList.add('spinning');

            const delay = 650;
            setTimeout(() => {
                const idx = Math.floor(Math.random() * this.allNewsFlat.length);
                this.randomResult = this.allNewsFlat[idx];
                this.isRandoming = false;
                if (btn) btn.classList.remove('spinning');
            }, delay);
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

        // ---------- 星座运势 ----------
        zodiacStyle(luck) {
            const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6'];
            return { '--zodiac-accent': colors[luck] || '#eab308' };
        },

        starString(luck) {
            return '★'.repeat(luck) + '☆'.repeat(5 - luck);
        },

        // ---------- 白噪音 ----------
        toggleNoise(type) {
            if (this.activeNoise === type) { this.stopNoise(); return; }
            this.startNoise(type);
        },

        startNoise(type) {
            this.stopNoise();
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                this._noiseCtx = ctx;
                const bufferSize = ctx.sampleRate * 2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    if (type === 'rain') data[i] = (Math.random() * 2 - 1) * 0.4;
                    else if (type === 'forest') {
                        data[i] = (Math.random() * 2 - 1) * 0.3;
                        if (i > 0) data[i] += data[i - 1] * 0.7;
                        data[i] *= 0.15;
                    } else {
                        data[i] = (Math.random() * 2 - 1) * 0.5;
                        if (i % 200 < 2) data[i] *= 3;
                    }
                }
                const source = ctx.createBufferSource();
                source.buffer = buffer; source.loop = true;
                if (type === 'rain') {
                    const lp = ctx.createBiquadFilter();
                    lp.type = 'lowpass'; lp.frequency.value = 800;
                    source.connect(lp); lp.connect(ctx.destination);
                } else if (type === 'forest') {
                    const hp = ctx.createBiquadFilter();
                    hp.type = 'highpass'; hp.frequency.value = 100;
                    const lp = ctx.createBiquadFilter();
                    lp.type = 'lowpass'; lp.frequency.value = 1000;
                    source.connect(hp); hp.connect(lp); lp.connect(ctx.destination);
                } else {
                    const bp = ctx.createBiquadFilter();
                    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.5;
                    source.connect(bp); bp.connect(ctx.destination);
                }
                source.start();
                this._noiseSource = source;
                this.activeNoise = type;
            } catch(e) {
                console.warn('白噪音播放失败:', e);
                this.activeNoise = '';
            }
        },

        stopNoise() {
            try {
                if (this._noiseSource) { this._noiseSource.stop(); this._noiseSource = null; }
                if (this._noiseCtx) { this._noiseCtx.close(); this._noiseCtx = null; }
            } catch(e) {}
            this.activeNoise = '';
        },
    },

    mounted() {
        this.init();
    },
});

app.mount('#app');
