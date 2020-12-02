/**
 * 校验规则
 */

/** helpers */
/**
 * view design ui 单独校验一个字段时：formRef.validateField(prop, cb)
 * 此行为与整个表单校验返回值是 promise 不一致，故做一致性处理
 * @param formRef
 * @param prop
 * @returns {Promise}
 */
export const validateField = (formRef, prop) =>
    new Promise((resolve) =>
        formRef.validateField(prop, (err) => resolve(!err))
    )

const BLUR = 'blur'
const CHANGE = 'change'

const TYPE_STRING = 'string'
const TYPE_NUMBER = 'number'
const TYPE_EMAIL = 'email'

// 字符串必填校验
export const ruleString = (prop, required = true, trigger = 'change') => ({
    message: `请输入${prop}`,
    required,
    trigger,
})

// 下拉必填校验
export const ruleSelect = (prop, required = true, trigger = 'change') => ({
    message: `请选择${prop}`,
    type: 'number',
    required,
    trigger,
})

// 正则校验 factory
export const ruleRegExp = (message, pattern, trigger = BLUR) => ({
    message,
    pattern,
    trigger,
})

// 自定义校验

/**
 * 针对性的校验规则
 */
// 手机号校验
export const rulePhone = (required = true) => {
    const rule = [
        {
            required,
            message: '请输入手机号',
            trigger: CHANGE,
        },
        {
            message: '请输入11位长度的手机号',
            trigger: BLUR,
            min: 11,
            max: 11,
        },
        ruleRegExp('手机号格式错误', /^1[3456789]\d{9}$/),
    ]

    return rule
}
// 手机号后带后缀校验：13388887777_123
export const rulePhoneSpecial = (required = true) => {
    const rule = [
        {
            required,
            message: '请输入手机号',
            trigger: CHANGE,
        },
        {
            message: '手机号格式错误',
            pattern: /^1[3456789]\d{9}$/,
            trigger: BLUR,
            transform: (value) => value.substr(0, 11),
        },
    ]

    return rule
}

// 邮箱校验
export const ruleEmail = (required = true) => {
    const rule = [
        {
            required,
            message: '请输入电子邮箱',
            trigger: CHANGE,
        },
        {
            message: '电子邮箱格式错误',
            trigger: BLUR,
            type: TYPE_EMAIL,
        },
    ]

    return rule
}

// 范围数字校验
export const ruleNumber = (min, max, message, required = true) => {
    const rule = [
        {
            required,
            message,
            trigger: BLUR,
            type: TYPE_NUMBER,
        },
        {
            message: `请输入${min}~${max}之间的值`,
            trigger: CHANGE,
            min,
            max,
        },
    ]

    return rule
}

/**
 * TODO 对一个字段进行多种校验时可以使用元素时校验规则对象的数组
 *
 * 表单校验规则对象 https://github.com/yiminghe/async-validator#type
 *
 * message：提示消息，any
 *
 * trigger：触发方式，（'blur' | 'change'）
 *
 * type：校验类型，在 options 中会有默认的校验失败 message
 *      string, number, boolean, method, regexp, integer,
 *      float, array, object, enum, date, url, hex, email, any
 *
 * Required：TODO (required)
 *
 * Pattern：正则表达式，校验值是否符合规则，RegExp
 *
 * range:  for string.length, array.length, number range, TODO (max, min)
 *
 * length: for string.length, array.length, number equal, TODO (len)
 *
 * Enumerable：TODO (enum)
 *      To validate a value from a list of possible values use the enum type
 *      with a enum property listing the valid values for the field
 *      {type: "enum", enum: ['admin', 'user', 'guest']}
 *      匹配是否有 enum 中的值
 *
 * Whitespace：The rule must be a string type. TODO (whitespace)
 *      不设置只包含空格的字符串会报错，若要空格可设置为 true
 *
 * Deep Rules：校验嵌套数据 TODO (fields)
 *      例子：
 *      address: {
 *          type: "object", required: true,
 *          fields: {
 *             street: {type: "string", required: true},
 *             city: {type: "string", required: true},
 *             zip: {type: "string", required: true, len: 8, message: "invalid zip"}
 *          }
 *      }
 *
 * defaultField：数组和对象的默认值 TODO (defaultField: { type: 'url' })
 *      can be used with the array or object type for validating all values of the container
 *
 * Transform：在校验前对值进行转换 TODO (transform(value) { return value.trim() })
 *      Sometimes it is necessary to transform a value before validation
 *
 * Messages：先不用
 *
 * validator：用于校验的函数，会被传入五个参数
 *      rule：对应的校验规则对象
 *      value：待校验字段的值
 *      callback：控制校验流程
 *      source：字段和值的对象，例如：{ password: 123456 }
 *      options：Additional options
 *
 * asyncValidator：
 *
 */
