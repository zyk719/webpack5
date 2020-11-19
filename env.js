const development = {
    // 后端开发本地
    VUE_APP_BASEURL: 'http://10.80.70.146:8080/xhljc',

    // 测试环境
    // VUE_APP_BASEURL: 'http://61.153.188.179:8088',

    // 新闻资讯生产环境
    VUE_APP_BASEURL_NEWS: 'http://www.xhlj.org.cn',

    /** 转发代理 */
    VUE_APP_PROXY_BASE: '/xhljc',
    VUE_APP_PROXY_BASE_NEWS: '/news',
}

const production = {
    // 后端开发本地
    // VUE_APP_BASEURL: 'http://10.80.70.146:8080/xhljc',

    // 测试环境
    VUE_APP_BASEURL: 'http://61.153.188.179:8088',

    // 生产环境
    // VUE_APP_BASEURL: 'http://xhlj.agri.hangzhou.gov.cn:8088/web',

    // 新闻资讯生产环境
    VUE_APP_BASEURL_NEWS: 'http://www.xhlj.org.cn/',
}

const env = process.env.NODE_ENV === 'development' ? development : production

module.exports = env
