import axios from '@/libs/api.request'

const call = (url, sign = true, method = 'post') => data =>
    axios.request({ url, data, method, sign })

export const sysDdCall = call('/sysDd/getKeyValues.action')

/**
 * 请求文件路径
 * 参数是文件 hash 值
 * 多个用 ; 隔开
 */
export const getFileList = call('/uploaddown/getFileList.action', false)
