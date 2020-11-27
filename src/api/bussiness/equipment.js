import axios from '@/libs/api.request'

const call = (url, method = 'post', sign = true) => (data) =>
    axios.request({ url, data, method, sign })

// 3.1.2获取当前自助机信息
export const getEquipmentInfoCall = call(
    '/equipmentInfoAdmin_equ/getInfo.action'
)

// 3.1.3获取当前自助机盒子信息
export const getBoxInfoCall = call(
    '/equipmentBoxinfoAdmin_equ/getAllBox.action'
)

// 3.3.1申报模块状态
// module_type: 1|发标模块 2|退标模块 3|二维码 4|凭条打印机 5|双目摄像头 6|读卡器 7|安全门 8|人体感应 9|远程协助
// module_status: 1|正常 2|异常 3|告警
// module_status_desc: string
export const putModuleStatusCall = call('/equipmentModule_equ/add.action')
