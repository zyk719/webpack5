import axios from '@/libs/api.request'

import { encrypt } from '@/libs/tripleDES'
import { setToken } from '@/libs/util'
import { Message } from 'view-design'

export const ADMIN_LOGIN_STATUS_NAME = 'adminLogin'

// 验证码
export const randImage = () => {
    return axios
        .request({
            url: '/randimage?' + new Date().getTime() + '-' + Math.random(),
            method: 'get',
            responseType: 'arraybuffer',
            sign: false,
        })
        .then(data => {
            const uint8Array = new Uint8Array(data).reduce(
                (acc, byte) => acc + String.fromCharCode(byte),
                ''
            )
            const img = 'data:image/png;base64,' + btoa(uint8Array)
            return img
        })
}

// 用户登录
export const login = ({ loginname, passwd, randNum }) => {
    const data = {
        loginname,
        randNum,
        passwd: encrypt(passwd),
    }
    return axios
        .request({
            url: '/sysUser/login.action',
            data,
            method: 'post',
            sign: true,
        })
        .then(res => {
            // 向 cookie 添加已登录标识符
            setToken(ADMIN_LOGIN_STATUS_NAME)
            Message.success('登录成功')
            return res
        })
}

// 用户退出
export const logout = () =>
    axios
        .request({
            url: '/sysUser/logout.action',
            method: 'post',
        })
        .then(res => {
            // 从 cookie 去除已登录标识符
            setToken('')
            Message.success('管理员已退出登录')
            return res
        })
