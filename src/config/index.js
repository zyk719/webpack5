module.exports = {
    /** token在Cookie中存储的天数，默认1天 */
    cookieExpires: 1,

    // 密码3DES加密
    DESKey: '7A6A6863736F667431333233323332317A6A6863736F6674',
    DESIv: '0102030405060708',

    // axios请求加密
    signKey: 'zzsoftBase',

    /** 分页默认每页条数 */
    DEFAULT_PAGE_SIZE: 10,

    /** 验证码时长 */
    COUNT_DOWN_LONG: 60,

    /** 点击进入管理界面次数 */
    CLICK_TO_ADMIN_COUNT: 5,

    /** websocket address */
    WEBSOCKET_ADDRESS: 'ws://localhost:12348',

    /** 屏幕保护时间 */
    SCREEN_SAVER_INTERVAL: 1000 * 60 * 5,
}
