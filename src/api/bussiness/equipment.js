import axios from '@/libs/api.request'

const call = (url, method = 'post', sign = true) => data =>
    axios.request({ url, data, method, sign })

// 3.1.2获取当前自助机信息
export const getEquipmentInfoCall = call(
    '/equipmentInfoAdmin_equ/getInfo.action'
)

// 3.1.3获取当前自助机盒子信息
export const getBoxInfoCall = call(
    '/equipmentBoxinfoAdmin_equ/getAllBox.action'
)
