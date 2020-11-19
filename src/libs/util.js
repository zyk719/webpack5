import { forEach, objEqual } from '@/libs/tools'

import Cookies from 'js-cookie'
import CryptoJS from 'crypto-js'
// cookie保存的天数
import config from '@/config'

const { title, cookieExpires } = config

export const TOKEN_KEY = 'token'

export const setToken = token => {
    Cookies.set(TOKEN_KEY, token, {
        expires: cookieExpires || 1,
    })
}

export const getToken = () => {
    const token = Cookies.get(TOKEN_KEY)
    if (token) return token
    else return false
}

export const hasChild = item => {
    return item.children && item.children.length !== 0
}
/**
 * @param {Array} list 通过路由列表得到菜单列表
 * @returns {Array}
 */
export const getMenuByRouter = list => {
    let res = []
    forEach(list, item => {
        if (!item.meta || (item.meta && !item.meta.hideInMenu)) {
            let obj = {
                icon: (item.meta && item.meta.icon) || '',
                iconcolor: item.iconcolor,
                name: item.name,
                meta: item.meta,
            }
            if (hasChild(item) || (item.meta && item.meta.showAlways)) {
                obj.children = getMenuByRouter(item.children)
            }
            if (item.meta && item.meta.href) obj.href = item.meta.href
            res.push(obj)
        }
    })
    return res
}

/**
 * @param {Array} routeMetched 当前路由metched
 * @returns {Array}
 */
export const getBreadCrumbList = (route, homeRoute) => {
    let homeItem = {
        ...homeRoute,
        icon: homeRoute.meta.icon,
    }
    let routeMetched = route.matched
    if (routeMetched.some(item => item.name === homeRoute.name))
        return [homeItem]
    let res = routeMetched
        .filter(item => {
            return item.meta === undefined || !item.meta.hideInBread
        })
        .map(item => {
            let meta = {
                ...item.meta,
            }
            if (meta.title && typeof meta.title === 'function') {
                meta.__titleIsFunction__ = true
                meta.title = meta.title(route)
            }
            let obj = {
                icon: (item.meta && item.meta.icon) || '',
                name: item.name,
                meta: meta,
            }
            return obj
        })
    res = res.filter(item => {
        return !item.meta.hideInMenu
    })
    return [
        {
            ...homeItem,
            to: homeRoute.path,
        },
        ...res,
    ]
}

export const getRouteTitleHandled = route => {
    let router = {
        ...route,
    }
    let meta = {
        ...route.meta,
    }
    let title = ''
    if (meta.title) {
        if (typeof meta.title === 'function') {
            meta.__titleIsFunction__ = true
            title = meta.title(router)
        } else title = meta.title
    }
    meta.title = title
    router.meta = meta
    return router
}

export const showTitle = (item, vm) => {
    let { title } = item.meta
    if (!title) return
    title = (item.meta && item.meta.title) || item.name
    return title
}

/**
 * @description 本地存储和获取标签导航列表
 */
export const setTagNavListInLocalstorage = list => {
    localStorage.tagNaveList = JSON.stringify(list)
}
/**
 * @returns {Array} 其中的每个元素只包含路由原信息中的name, path, meta三项
 */
export const getTagNavListFromLocalstorage = () => {
    const list = localStorage.tagNaveList
    return list ? JSON.parse(list) : []
}

/**
 * @param {Array} routers 路由列表数组
 * @description 用于找到路由列表中name为home的对象
 */
export const getHomeRoute = (routers, homeName = 'home') => {
    let i = -1
    let len = routers.length
    let homeRoute = {}
    while (++i < len) {
        let item = routers[i]
        if (item.children && item.children.length) {
            let res = getHomeRoute(item.children, homeName)
            if (res.name) return res
        } else {
            if (item.name === homeName) homeRoute = item
        }
    }
    return homeRoute
}

/**
 * @param {*} list 现有标签导航列表
 * @param {*} newRoute 新添加的路由原信息对象
 * @description 如果该newRoute已经存在则不再添加
 */
export const getNewTagList = (list, newRoute) => {
    const { name, path, meta } = newRoute
    let newList = [...list]
    if (newList.findIndex(item => item.name === name) >= 0) return newList
    else {
        newList.push({
            name,
            path,
            meta,
        })
    }
    return newList
}

/**
 * @param {String} url
 * @description 从URL中解析参数
 */
export const getParams = url => {
    const keyValueArr = url.split('?')[1].split('&')
    let paramObj = {}
    keyValueArr.forEach(item => {
        const keyValue = item.split('=')
        paramObj[keyValue[0]] = keyValue[1]
    })
    return paramObj
}

/**
 * @param {Array} list 标签列表
 * @param {String} name 当前关闭的标签的name
 */
export const getNextRoute = (list, route) => {
    let res = {}
    if (list.length === 2) {
        res = getHomeRoute(list)
    } else {
        const index = list.findIndex(item => routeEqual(item, route))
        if (index === list.length - 1) res = list[list.length - 2]
        else res = list[index + 1]
    }
    return res
}

/**
 * @param {Number} times 回调函数需要执行的次数
 * @param {Function} callback 回调函数
 */
export const doCustomTimes = (times, callback) => {
    let i = -1
    while (++i < times) {
        callback(i)
    }
}

/**
 * @param {Object} file 从上传组件得到的文件对象
 * @returns {Promise} resolve参数是解析后的二维数组
 * @description 从Csv文件中解析出表格，解析成二维数组
 */
export const getArrayFromFile = file => {
    let nameSplit = file.name.split('.')
    let format = nameSplit[nameSplit.length - 1]
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.readAsText(file) // 以文本格式读取
        let arr = []
        reader.onload = function(evt) {
            let data = evt.target.result // 读到的数据
            let pasteData = data.trim()
            arr = pasteData
                .split(/[\n\u0085\u2028\u2029]|\r\n?/g)
                .map(row => {
                    return row.split('\t')
                })
                .map(item => {
                    return item[0].split(',')
                })
            if (format === 'csv') resolve(arr)
            else reject(new Error('[Format Error]:你上传的不是Csv文件'))
        }
    })
}

/**
 * @param {Array} array 表格数据二维数组
 * @returns {Object} { columns, tableData }
 * @description 从二维数组中获取表头和表格数据，将第一行作为表头，用于在iView的表格中展示数据
 */
export const getTableDataFromArray = array => {
    let columns = []
    let tableData = []
    if (array.length > 1) {
        let titles = array.shift()
        columns = titles.map(item => {
            return {
                title: item,
                key: item,
            }
        })
        tableData = array.map(item => {
            let res = {}
            item.forEach((col, i) => {
                res[titles[i]] = col
            })
            return res
        })
    }
    return {
        columns,
        tableData,
    }
}

export const findNodeUpper = (ele, tag) => {
    if (ele.parentNode) {
        if (ele.parentNode.tagName === tag.toUpperCase()) {
            return ele.parentNode
        } else {
            return findNodeUpper(ele.parentNode, tag)
        }
    }
}

export const findNodeUpperByClasses = (ele, classes) => {
    let parentNode = ele.parentNode
    if (parentNode) {
        let classList = parentNode.classList
        if (
            classList &&
            classes.every(className => classList.contains(className))
        ) {
            return parentNode
        } else {
            return findNodeUpperByClasses(parentNode, classes)
        }
    }
}

export const findNodeDownward = (ele, tag) => {
    const tagName = tag.toUpperCase()
    if (ele.childNodes.length) {
        let i = -1
        let len = ele.childNodes.length
        while (++i < len) {
            let child = ele.childNodes[i]
            if (child.tagName === tagName) return child
            else return findNodeDownward(child, tag)
        }
    }
}

/**
 * @description 根据name/params/query判断两个路由对象是否相等
 * @param {*} route1 路由对象
 * @param {*} route2 路由对象
 */
export const routeEqual = (route1, route2) => {
    const params1 = route1.params || {}
    const params2 = route2.params || {}
    const query1 = route1.query || {}
    const query2 = route2.query || {}
    return (
        route1.name === route2.name &&
        objEqual(params1, params2) &&
        objEqual(query1, query2)
    )
}

/**
 * 判断打开的标签列表里是否已存在这个新添加的路由对象
 */
export const routeHasExist = (tagNavList, routeItem) => {
    let len = tagNavList.length
    let res = false
    doCustomTimes(len, index => {
        if (routeEqual(tagNavList[index], routeItem)) res = true
    })
    return res
}

// scrollTop animation
export const scrollTop = (el, from = 0, to, duration = 500, endCallback) => {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame =
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                return window.setTimeout(callback, 1000 / 60)
            }
    }
    const difference = Math.abs(from - to)
    const step = Math.ceil((difference / duration) * 50)

    const scroll = (start, end, step) => {
        if (start === end) {
            endCallback && endCallback()
            return
        }

        let d = start + step > end ? end : start + step
        if (start > end) {
            d = start - step < end ? end : start - step
        }

        if (el === window) {
            window.scrollTo(d, d)
        } else {
            el.scrollTop = d
        }
        window.requestAnimationFrame(() => scroll(d, end, step))
    }
    scroll(from, to, step)
}

/**
 * @description 根据当前跳转的路由设置显示在浏览器标签的title
 * @param {Object} routeItem 路由对象
 * @param {Object} vm Vue实例
 */
export const setTitle = (routeItem, vm) => {
    const handledRoute = getRouteTitleHandled(routeItem)
    const pageTitle = showTitle(handledRoute, vm)
    const resTitle = pageTitle ? `${title} - ${pageTitle}` : title
    window.document.title = resTitle
}
export const getNowFormatDate = () => {
    let date = new Date()
    let seperator1 = ''
    let seperator2 = ''
    let month = date.getMonth() + 1
    let strDate = date.getDate()
    if (month >= 1 && month <= 9) month = '0' + month
    if (strDate >= 0 && strDate <= 9) strDate = '0' + strDate
    let currentdate =
        date.getFullYear() +
        seperator1 +
        month +
        seperator1 +
        strDate +
        date.getHours() +
        seperator2 +
        date.getMinutes() +
        seperator2 +
        date.getSeconds()
    return currentdate
}

/**
 * @description 将后端菜单树转换为路由树
 * @param {Array} menus
 * @returns {Array}
 */
export const backendMenusToRouters = menus => {
    let routers = []
    forEach(menus, menu => {
        // 将后端数据转换成路由数据
        let route = backendMenuToRoute(menu)
        // 如果后端数据有下级，则递归处理下级
        if (menu.children && menu.children.length !== 0) {
            route.children = backendMenusToRouters(menu.children)
        }
        routers.push(route)
    })
    return routers
}

/**
 * @description 将后端菜单转换为路由
 * @param {Object} menu
 * @returns {Object}
 */
const backendMenuToRoute = menu => {
    // 具体内容根据自己的数据结构来定，这里需要注意的一点是
    // 原先routers写法是component: () => import('@/view/error-page/404.vue')
    // 经过json数据转换，这里会丢失，所以需要按照上面提过的做转换，下面只写了核心点，其他自行处理
    let route = Object.assign({}, menu)
    // 指定路由的 path
    route.path = menu.vuepath || 'menu-' + menu.id
    // 指定路由的 name
    route.name = menu.vuename || 'menu-' + menu.id

    route.meta = {
        // 图标
        icon: menu.icon || 'md-menu',
        // 标题
        title: menu.text,
        // 资源 id
        sourceId: menu.id,
    }
    if (menu.showpos === 3) {
        route.meta.href = menu.vueurl
    }
    if (menu.vueurl && menu.showpos === 1) {
        route.component = resolve => {
            require(['@/' + menu.vueurl], resolve)
        }
    }
    return route
}
export const treeData = (source, id, parentid, currentId) => {
    id = id || 'id'
    parentid = parentid || 'parentid'
    let cloneData = JSON.parse(JSON.stringify(source))
    return cloneData.filter(father => {
        let branchArr = cloneData.filter(child => {
            // console.log(child[ parentid ])
            return father[id] === child[parentid]
        })
        if (branchArr.length > 0) {
            father.children = branchArr
        }
        father.isDisabled =
            currentId === father[id] || father[parentid] === currentId
        let res = cloneData.find((item, index, arr) => {
            return father[parentid] === item[id]
        })

        // return father[ parentid ] === -1 || father[ parentid ] === 'source_-1'
        return res === undefined
    })
}

export const normalizer = node => {
    return {
        id: node.id,
        label: node.text,
        children: node.children,
    }
}

export const iconList = [
    'md-add',
    'md-create',
    'md-trash',
    'md-key',
    'md-help-circle',
    'md-cog',
    'md-briefcase',
    'md-person',
    'logo-buffer',
    'md-grid',
    'md-bookmarks',
    'md-list',
    'md-happy',
    'md-bookmarks',
    'md-git-network',
    'md-paper',
    'md-hand',
    'md-help-buoy',
    'md-globe',
]
// 3DES加密 Pkcs7填充方式
export const encryptByDES = message => {
    const keyHex = CryptoJS.enc.Utf8.parse(hex2str(config.DESKey))
    const ivHex = CryptoJS.enc.Utf8.parse(hex2str(config.DESIv))
    const encrypted = CryptoJS.TripleDES.encrypt(message, keyHex, {
        iv: ivHex,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.toString()
}
// 3DES解密
export const decryptByDES = ciphertext => {
    const keyHex = CryptoJS.enc.Utf8.parse(hex2str(config.DESKey))
    const ivHex = CryptoJS.enc.Utf8.parse(hex2str(config.DESIv))
    const decrypted = CryptoJS.TripleDES.decrypt(
        {
            ciphertext: CryptoJS.enc.Base64.parse(ciphertext),
        },
        keyHex,
        {
            iv: ivHex,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }
    )
    return decrypted.toString(CryptoJS.enc.Utf8)
}
// 16进制转字符串
const hex2str = hex => {
    let trimedStr = hex.trim()
    let rawStr =
        trimedStr.substr(0, 2).toLowerCase() === '0x'
            ? trimedStr.substr(2)
            : trimedStr
    let len = rawStr.length
    if (len % 2 !== 0) {
        alert('非法格式的ASCII代码!')
        return ''
    }
    let curCharCode
    let resultStr = []
    for (let i = 0; i < len; i = i + 2) {
        curCharCode = parseInt(rawStr.substr(i, 2), 16)
        resultStr.push(String.fromCharCode(curCharCode))
    }
    return resultStr.join('')
}

// 千分位转换
export const formatNumber = num => {
    if (!/^(\+|-)?(\d+)(\.\d+)?$/.test(num)) {
        return num
    }
    let a = RegExp.$1
    let b = RegExp.$2
    let c = RegExp.$3
    let re = new RegExp().compile('(\\d)(\\d{3})(,|$)')
    while (re.test(b)) {
        b = b.replace(re, '$1,$2$3')
    }
    return a + '' + b + '' + c
}
