import HttpRequest from '@/libs/axios'

const baseUrl =
    process.env.NODE_ENV === 'development'
        ? process.env['VUE_APP_PROXY_BASE_NEWS']
        : process.env['VUE_APP_BASEURL_NEWS']

const axios = new HttpRequest(baseUrl)

const call = (url, method = 'post', sign = false) => (data) =>
    axios.request({ url, data, method, sign, withCredentials: false }, true)

// 新闻资讯
export const newsCall = call(
    '/exterior_portalContent/listForContent.action?owner_type=3000'
)

// 新闻详情
export const newsDetailsCall = call('/mobile_portalContent/view.action')

// 浏览量
export const newsReadCount = call(
    '/exterior_portalContent/updateReadcnt.action'
)
