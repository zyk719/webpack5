import store from '@/store'
import router from '@/router'
import { REPORT_INTERVAL } from '@/config'
import { putModuleStatusCall } from '@/api/bussiness/equipment'

export const STATUS_KEY = 'StDeviceStatus'

export const CONTROLLERS = {
    // 读卡器
    CardReader: 'idc',
    // 领标器1
    Checkout: 'chkout',
    // 领标器2
    // Checkout2: 'chkout2',
    // 领标器3
    // Checkout3: 'chkout3',
    // 退标器
    Checkin: 'chkin',
    // 指示灯
    GuideLight: 'glt',
    // 打印器
    Printer: 'rec',
    // 输入法
    Ime: 'ime',
    // 感应器
    Sensor: 'snr',
    // 扫码器
    Qr: 'bcr',
    // 取标门
    Door: 'dor',
}

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
    // 扫码器
    READ_QR: 1000 * 10,
    // 取标门
    FOR_TAKE: 1000 * 60,
}

export const LOGIC_NAME = {
    // 读卡器
    IDC: 'ICC310',
    IDC_TRACK_MAP: 'CHIP',
    // 领标器
    CHECKOUT: 'BillDispenser',
    CHECKOUT2: 'BillDispenserEX',
    CHECKOUT3: 'BillDispenserAUX',
    // 退标器
    CHECKIN: 'BillScanner',
    // 灯光
    GUIDE_LIGHTS: 'GuideLights',
    // 打印器
    PRINTER: 'ReceiptPrinter',
    // 感应器
    SENSOR: 'Sensors',
    // 扫码器
    QR: 'BCR310',
    // 门磁铁
    DOOR: 'SIU310',
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
    // 扫码器
    READ_QR: 'ReadBarcode',
    // 取标门
    READY: 'EnableAllEvents',
    DOOR_SWITCH: 'SetGuidLightSync',
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

// 返回首页
export const backHome = () => router.replace('/user/crossroad')

/**
 * 状态上报接口参数
 * module_type: 1|发标模块 2|退标模块 3|二维码 4|凭条打印机 5|双目摄像头 6|读卡器 7|安全门 8|人体感应 9|远程协助
 * module_status: 1|正常 2|异常 3|告警
 * module_status_desc: string
 */

// 领标器状态 1
const reportCheckout = async () => {
    const state = store.getters.checkoutStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 1,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || JSON.stringify(state),
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '领标器上报状态：', params)
}

// 退标器状态 2
const reportCheckin = async () => {
    const state = store.getters.checkinStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 2,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || JSON.stringify(state),
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '退标器上报状态：', params)
}

// 打印器状态 4
const reportPrinter = async () => {
    const state = store.getters.printerStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 4,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || JSON.stringify(state),
    }

    // 设备正常时检查是否缺纸
    const isFull = state.StPaperStatus === 'FULL'
    if (params.module_status === 1 && !isFull) {
        params.module_status = 2
        params.module_status_desc = '打印机缺纸'
        console.log('缺纸', !isFull)
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '打印器上报状态：', params)
}

// 读卡器状态 6
const reportCardReader = async () => {
    const state = store.getters.cardReaderStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 6,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || JSON.stringify(state),
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '读卡器上报状态：', params)
}

// 感应器状态 8
const reportSensor = async () => {
    const state = store.getters.SensorStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 8,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || JSON.stringify(state),
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '感应器上报状态：', params)
}

// 扫码器状态 3
const reportQr = async () => {
    const state = store.getters.qrStatus
    const status = state[STATUS_KEY]
    const statusMapper = {
        [STATUS.HEALTHY]: 1,
    }

    const params = {
        module_type: 3,
        module_status: statusMapper[status] || 2,
        module_status_desc: status || '',
    }

    await putModuleStatusCall(params)

    console.log(new Date().toLocaleString(), '扫码器上报状态：', params)
}

// 定时上报
export const reportEquipmentStatusInterval = () => {
    const report = async () => {
        await reportCheckout()
        // await reportCheckin()
        await reportQr()
        await reportPrinter()
        await reportCardReader()
        await reportSensor()
    }

    report().then(() => console.log('自助机启动后状态已上报'))

    setInterval(report, REPORT_INTERVAL)
}
