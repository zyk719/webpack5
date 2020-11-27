import axios from '@/libs/api.request'

const call = (url, method = 'post', sign = true) => (data) =>
    axios.request({ url, data, method, sign })

// 拿到 获取短信验证码所需的 token
export const msgTokenCall = call('/exCommon/getSendMsgToken.action')

// 获取短信验证码
export const msgCall = call('/exCommon/sendValidMsg.action')

// 设备状态
export const equipmentStatus = call('/equipmentInfo_equ/getEquStatus.action')

// 3.2.1茶农登录
export const userLoginCall = call('/equipmentLogin_equ/grower_login.action')

// 3.2.2茶农注销
export const userLogoutCall = call('/equipmentLogin_equ/grower_exit.action')

// 3.2.3茶农获取申领信息
export const supplyBaseCall = call('/equipmentMarkApply_equ/grower_info.action')

// 3.2.4茶农获取盒子发放茶标信息(吐标盒子的信息)
export const getBoxCall = call('/equipmentMarkApply_equ/grower_boxinfo.action')

// 3.2.5茶农发放茶标(已发放茶标信息上报)
export const putTakeCall = call('/equipmentMarkApply_equ/grower_apply.action')

// 3.2.6本机退标盒子信息
export const putBackBoxCall = call(
    '/equipmentMarkApply_equ/returnBoxinfo.action'
)

// 3.2.7茶农退标
export const submitBackCall = call(
    // '/equipmentMarkApply_equ/grower_giveBack.action'
    '/equipmentMarkApply_equ/grower_giveBackForNum.action'
)

// 3.2.8茶农剩余标量查询
export const userCurrentNumberCall = call(
    '/equipmentMarkApply_equ/grower_stockinfo.action'
)

// 3.2.9 得到茶农卡挂失信息
export const cardOwnerCall = call('/equipmentInfo_equ/getGrowerCard.action')

// 3.2.10挂失茶农卡
export const lossCall = call('/equipmentInfo_equ/updateIcStatus.action')

// 3.2.11 查询茶农协议是否已签订
export const hasSignCall = call('/growerSign_equ/getSignInfo.action')

// 3.2.12 茶农协议签订
export const signCall = call('/growerSign_equ/add.action')

// 3.2.13 茶农划转标评价列表
export const evaluationListCall = call('/markTransferPj_equ/datagrid.action')

// 3.2.15 茶农评价
export const evaluationSubmitCall = call('/markTransferPj_equ/evaluate.action')

// 3.2.19 申领/退标是否开放
export const isOpenCall = call('/equipmentMarkApply_equ/grower_cfg.action')
