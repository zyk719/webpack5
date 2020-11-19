/**
 * Triple DES 加密和解密
 * CryptoJS.enc.Hex.parse 把 16 进制 转为 wordArray
 * CryptoJS.enc.Base64.parse 把 base64 转为 wordArray
 */

import CryptoJS from 'crypto-js'
import { DESKey, DESIv } from '@/config'

const key = CryptoJS.enc.Hex.parse(DESKey)
const iv = CryptoJS.enc.Hex.parse(DESIv)
const cfg = {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
}

export const encrypt = data =>
    CryptoJS.TripleDES.encrypt(data, key, cfg).toString()

export const decrypt = ciphertext => {
    const wordArray = CryptoJS.enc.Base64.parse(ciphertext)
    const decrypted = CryptoJS.TripleDES.decrypt(
        {
            ciphertext: wordArray,
        },
        key,
        cfg
    )
    // decrypted.toString() 默认返回的是 16 进制，需转为字符串
    const decrypt = decrypted.toString(CryptoJS.enc.Utf8)
    return decrypt
}
