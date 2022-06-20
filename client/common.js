const moment = require('moment')
const constants = require('./constants/variable')
const Mock = require('mockjs')
const json5 = require('json5')
const MockExtra = require('common/mock-extra.js')

const Roles = {
  0: 'admin',
  10: 'owner',
  20: 'dev',
  30: 'guest',
  40: 'member',
}

const roleAction = {
  manageUserlist: 'admin',
  changeMemberRole: 'owner',
  editInterface: 'dev',
  viewPrivateInterface: 'guest',
  viewGroup: 'guest',
}

function isJson(json) {
  if (!json) {
    return false
  }
  try {
    json = JSON.parse(json)
    return json
  } catch (e) {
    return false
  }
}

exports.isJson = isJson

function isJson5(json) {
  if (!json) {
    return false
  }
  try {
    json = json5.parse(json)
    return json
  } catch (e) {
    return false
  }
}
exports.safeArray = function (arr) {
  return Array.isArray(arr) ? arr : []
}
exports.json5_parse = function (json) {
  try {
    return json5.parse(json)
  } catch (err) {
    return json
  }
}

exports.json_parse = function (json) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return json
  }
}

function deepCopyJson(json) {
  return JSON.parse(JSON.stringify(json))
}

exports.deepCopyJson = deepCopyJson

exports.isJson5 = isJson5

exports.checkAuth = (action, role) => {
  return Roles[roleAction[action]] <= Roles[role]
}
exports.formatTime = timestamp => {
  return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 防抖函式，減少高頻觸發的函式執行的頻率
// 請在 constructor 里使用:
// import { debounce } from '$/common';
// this.func = debounce(this.func, 400);
exports.debounce = (func, wait) => {
  let timeout
  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(func, wait)
  }
}

// 從 Javascript 對像中選取隨機屬性
exports.pickRandomProperty = obj => {
  let result
  let count = 0
  for (const prop in obj) {
    if (Math.random() < 1 / ++count) {
      result = prop
    }
  }
  return result
}
exports.getImgPath = (path, type) => {
  const rate = window.devicePixelRatio >= 2 ? 2 : 1
  return `${path}@${rate}x.${type}`
}
function trim(str) {
  if (!str) {
    return str
  }

  str = `${str }`
  return str.replace(/(^\s*)|(\s*$)/g, '')
}

exports.trim = trim

exports.handlePath = path => {
  path = trim(path)
  if (!path) {
    return path
  }
  if (path === '/') {
    return ''
  }
  path = path[0] !== '/' ? `/${ path}` : path
  path = path[path.length - 1] === '/' ? path.substr(0, path.length - 1) : path
  return path
}
exports.handleApiPath = path => {
  if (!path) {
    return ''
  }
  path = trim(path)
  path = path[0] !== '/' ? `/${ path}` : path
  return path
}

// 名稱限制 constants.NAME_LIMIT 字元
exports.nameLengthLimit = type => {
  // 返回字串長度，漢字計數為2
  const strLength = str => {
    let length = 0
    for (let i = 0; i < str.length; i++) {
      length += str.charCodeAt(i) > 255 ? 2 : 1
    }
    return length
  }
  // 返回 form中的 rules 校驗規則
  return [
    {
      required: true,
      validator(rule, value, callback) {
        const len = value ? strLength(value) : 0
        if (len > constants.NAME_LIMIT) {
          callback(
            `請輸入${ type }名稱，長度不超過${ constants.NAME_LIMIT }字元(中文算作2字元)!`,
          )
        } else if (len === 0) {
          callback(
            `請輸入${ type }名稱，長度不超過${ constants.NAME_LIMIT }字元(中文算作2字元)!`,
          )
        } else {
          return callback()
        }
      },
    },
  ]
}

// 去除所有html標籤只保留文字

exports.htmlFilter = html => {
  const reg = /<\/?.+?\/?>/g
  return html.replace(reg, '') || '新專案'
}

// 實現 Object.entries() 方法
exports.entries = obj => {
  const res = []
  for (const key in obj) {
    res.push([key, obj[key]])
  }
  return res
}
exports.getMockText = mockTpl => {
  try {
    return JSON.stringify(Mock.mock(MockExtra(json5.parse(mockTpl), {})), null, '  ')
  } catch (err) {
    return ''
  }
}
/**
 * 合併后新的對象屬性與 Obj 一致，nextObj 有對應屬性則取 nextObj 屬性值，否則取 Obj 屬性值
 * @param  {Object} Obj     舊對像
 * @param  {Object} nextObj 新對像
 * @return {Object}           合併后的對象
 */
exports.safeAssign = (Obj, nextObj) => {
  const keys = Object.keys(nextObj)
  return Object.keys(Obj).reduce((result, value) => {
    if (keys.indexOf(value) >= 0) {
      result[value] = nextObj[value]
    } else {
      result[value] = Obj[value]
    }
    return result
  }, {})
}

// 交換陣列的位置
exports.arrayChangeIndex = (arr, start, end) => {
  const newArr = [].concat(arr)
  // newArr[start] = arr[end];
  // newArr[end] = arr[start];
  const startItem = newArr[start]
  newArr.splice(start, 1)
  // end自動加1
  newArr.splice(end, 0, startItem)
  const changes = []
  newArr.forEach((item, index) => {
    changes.push({
      id: item._id,
      index: index,
    })
  })

  return changes
}
