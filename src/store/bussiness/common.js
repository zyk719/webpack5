import EventNotifiers from '@/store/bussiness/EventNotifiers'
import router from '@/router'

export const STATUS_KEY = 'StDeviceStatus'

export const STATUS = {
    OPEN: ['OpenCompleted', 'ConnectionOpened'],
    CLOSE: 'ConnectionClosed',
    HEALTHY: 'HEALTHY',
    NO_DEVICE: 'NODEVICE',
    POWER_OFF: 'POWEROFF',
    TIMEOUT: 'Timeout',
    // 领标器
    READ_IMAGE_COMPLETE: 'ReadImageComplete',
    // 读卡器
    CARD_ACCEPTED: 'CardAccepted',
    CARD_TAKEN: 'CardTaken',
}

export const TIMEOUT = {
    CONNECT: 1000 * 10,
    // 读卡器
    INSERT: 1000 * 10,
    EJECT: 1000 * 60 * 15,
    READ: 1000 * 60,
    // 领标器
    READ_IMAGE: 1000 * 60 * 5,
    // 退标器
    CHECKIN: 1000 * 60 * 10,
}

export const LOGIC_NAME = {
    // 读卡器
    IDC: 'ICC310',
    IDC_TRACK_MAP: 'CHIP',
    // 领标器
    CHECKOUT: 'BillDispenser',
    // 退标器
    CHECKIN: 'BillScanner',
    // 灯光
    GUIDE_LIGHTS: 'GuideLights',
    // 打印器
    PRINTER: 'ReceiptPrinter',
    // 感应器
    SENSOR: 'Sensors',
}

export const API = {
    GET_MAC: 'GetMacInfo',
    CONNECT: 'Open',
    GET_STATE: 'GetState',
    // 领标器、退标器
    READ_IMAGE: 'ReadImage',
    // 读卡器
    INSERT: 'AcceptAndReadTracks',
    CANCEL_INSERT: 'CancelAccept',
    EJECT: 'Eject',
    READ: 'ChipSendSync',
    // 灯光
    LIGHT: 'SetGuidLigtEx',
    // 退标完成
    DONE_CHECKIN: 'HaltPrint',
    // 打印凭条
    PRINT: 'ExtendedPrint',
    // 感应器
    START_SENSOR: 'EnableProximity',
    STOP_SENSOR: 'DisableProximity',
}

/**
 * opened promise
 */

export const pResRej = () => {
    let res, rej
    const p = new Promise((resolve, reject) => {
        res = resolve
        rej = reject
    })
    return { p, res, rej }
}

// 设备连接
export const confirmOpen = async (state, name, logicName) => {
    const { ret } = await state.controller[API.CONNECT](
        logicName,
        TIMEOUT.CONNECT
    )

    if (!STATUS.OPEN.includes(ret)) {
        throw new Error(`无法连接到${name}(${ret})`)
    }
}

// 设备状态
export const confirmHealthy = async (state, name) => {
    const res = await state.controller[API.GET_STATE]()
    const ret = res[STATUS_KEY]

    if (ret !== STATUS.HEALTHY) {
        throw new Error(`${name}状态异常(${ret})`)
    }
}

// 返回首页
export const backHome = () => router.replace('/user/crossroad')

// 消息中心初始化
export const initSubscriber = (modules) => {
    const listeners = controllers.map(
        (controller) => new EventNotifiers(controller)
    )
    return
}
