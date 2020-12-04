import axios from '@/libs/api.request'

const call = (url, method = 'post', sign = true) => (data) =>
    axios.request({ url, data, method, sign })

// 3.1.4存放茶标
export const putSignCall = call('/equipmentBoxinfoAdmin_equ/save.action')

// 3.1.5取出茶标
export const takeSignCall = call('/equipmentBoxinfoAdmin_equ/takeOut.action')

// 3.1.6清空茶标（领标盒子和退标盒子）
export const clearSignCall = call('/equipmentBoxinfoAdmin_equ/clear.action')

// 3.1.7设备盒子存取记录列表
export const boxSignFlowCall = call('/equipmentBtradeAdmin_equ/datagrid.action')

// 3.1.8根据ID得到设备盒子存取记录
export const boxSignFlowByIdCall = call(
    '/equipmentBtradeAdmin_equ/getBase.action'
)

// 3.1.9解决故障
export const clearFaultCall = call('/equipmentInfoAdmin_equ/fixError.action')
