import HttpRequest from '@/libs/axios'

const baseUrl =
    process.env.NODE_ENV === 'development'
        ? process.env['VUE_APP_PROXY_BASE']
        : process.env['VUE_APP_BASEURL']

const axios = new HttpRequest(baseUrl)
export default axios
