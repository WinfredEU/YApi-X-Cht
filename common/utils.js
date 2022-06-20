const Mock = require('mockjs')
const filter = require('./power-string.js').filter
const stringUtils = require('./power-string.js').utils
const json5 = require('json5')
const Ajv = require('ajv')
/**
 * 作用：解析規則串 key ，然後根據規則串的規則以及路徑找到在 json 中對應的數據
 * 規則串：$.{key}.{body||params}.{dataPath} 其中 body 為返回數據，params 為請求數據，datapath 為數據的路徑
 * 陣列：$.key.body.data.arr[0]._id  (獲取 key 所指向請求的返回數據的 arr 陣列的第 0 項元素的 _id 屬性)
 * 對像：$.key.body.data.obj._id ((獲取 key 所指向請求的返回數據的 obj 對象的 _id 屬性))
 *
 * @param String key 規則串
 * @param Object json 數據
 * @returns
 */
function simpleJsonPathParse(key, json) {
  if (!key || typeof key !== 'string' || key.indexOf('$.') !== 0 || key.length <= 2) {
    return null
  }
  let keys = key.substr(2).split('.')
  keys = keys.filter(item => {
    return item
  })
  for (let i = 0, l = keys.length; i < l; i++) {
    try {
      const m = keys[i].match(/(.*?)\[([0-9]+)\]/)
      if (m) {
        json = json[m[1]][m[2]]
      } else {
        json = json[keys[i]]
      }
    } catch (e) {
      json = ''
      break
    }
  }

  return json
}

// 全域性變數 {{ global.value }}
// value 是在環境變數中定義的欄位
function handleGlobalWord(word, json) {
  if (!word || typeof word !== 'string' || word.indexOf('global.') !== 0) return word
  let keys = word.split('.')
  keys = keys.filter(item => {
    return item
  })
  return json[keys[0]][keys[1]] || word
}

function handleMockWord(word) {
  if (!word || typeof word !== 'string' || word[0] !== '@') return word
  return Mock.mock(word)
}

/**
 *
 * @param {*} data
 * @param {*} handleValueFn 處理參數值函式
 */
function handleJson(data, handleValueFn) {
  if (!data) {
    return data
  }
  if (typeof data === 'string') {
    return handleValueFn(data)
  } else if (typeof data === 'object') {
    for (const i in data) {
      data[i] = handleJson(data[i], handleValueFn)
    }
  } else {
    return data
  }
  return data
}

function handleValueWithFilter(context) {
  return function (match) {
    if (match[0] === '@') {
      return handleMockWord(match)
    } else if (match.indexOf('$.') === 0) {
      return simpleJsonPathParse(match, context)
    } else if (match.indexOf('global.') === 0) {
      return handleGlobalWord(match, context)
    }
    return match
  }
}

function handleFilter(str, match, context) {
  match = match.trim()
  try {
    const a = filter(match, handleValueWithFilter(context))

    return a
  } catch (err) {
    return str
  }
}

function handleParamsValue(val, context = {}) {
  const variableRegexp = /\{\{\s*([^}]+?)\}\}/g
  if (!val || typeof val !== 'string') {
    return val
  }
  val = val.trim()

  const match = val.match(/^\{\{([^}]+)\}\}$/)
  if (!match) {
    // val ==> @name 或者 $.body
    if (val[0] === '@' || val[0] === '$') {
      return handleFilter(val, val, context)
    }
  } else {
    return handleFilter(val, match[1], context)
  }

  return val.replace(variableRegexp, (str, match) => {
    return handleFilter(str, match, context)
  })
}

exports.handleJson = handleJson
exports.handleParamsValue = handleParamsValue

exports.simpleJsonPathParse = simpleJsonPathParse
exports.handleMockWord = handleMockWord

exports.joinPath = (domain, joinPath) => {
  const l = domain.length
  if (domain[l - 1] === '/') {
    domain = domain.substr(0, l - 1)
  }
  if (joinPath[0] !== '/') {
    joinPath = joinPath.substr(1)
  }
  return domain + joinPath
}

// exports.safeArray = arr => {
//   return Array.isArray(arr) ? arr : [];
// };
function safeArray(arr) {
  return Array.isArray(arr) ? arr : []
}
exports.safeArray = safeArray

exports.isJson5 = function isJson5(json) {
  if (!json) return false
  try {
    json = json5.parse(json)
    return json
  } catch (e) {
    return false
  }
}

function isJson(json) {
  if (!json) return false
  try {
    json = JSON.parse(json)
    return json
  } catch (e) {
    return false
  }
}

exports.isJson = isJson

exports.unbase64 = function (base64Str) {
  try {
    return stringUtils.unbase64(base64Str)
  } catch (err) {
    return base64Str
  }
}
exports.json_parse = function (json) {
  try {
    return JSON.parse(json)
  } catch (err) {
    return json
  }
}

exports.json_format = function (json) {
  try {
    return JSON.stringify(JSON.parse(json), null, '   ')
  } catch (e) {
    return json
  }
}

exports.ArrayToObject = function (arr) {
  const obj = {}
  safeArray(arr).forEach(item => {
    obj[item.name] = item.value
  })
  return obj
}

exports.timeago = function (timestamp) {
  let hours, days, mouth, year
  const timeNow = parseInt(new Date().getTime() / 1000)
  const seconds = timeNow - timestamp
  if (seconds > 86400 * 30 * 12) {
    year = parseInt(seconds / (86400 * 30 * 12))
  } else {
    year = 0
  }
  if (seconds > 86400 * 30) {
    mouth = parseInt(seconds / (86400 * 30))
  } else {
    mouth = 0
  }
  if (seconds > 86400) {
    days = parseInt(seconds / 86400)
  } else {
    days = 0
  }
  if (seconds > 3600) {
    hours = parseInt(seconds / 3600)
  } else {
    hours = 0
  }
  const minutes = parseInt(seconds / 60)
  if (year > 0) {
    return `${year }年前`
  } else if (mouth > 0 && year <= 0) {
    return `${mouth }月前`
  } else if (days > 0 && mouth <= 0) {
    return `${days }天前`
  } else if (days <= 0 && hours > 0) {
    return `${hours }小時前`
  } else if (hours <= 0 && minutes > 0) {
    return `${minutes }分鐘前`
  } else if (minutes <= 0 && seconds > 0) {
    if (seconds < 30) {
      return '剛剛'
    }
    return `${seconds }秒前`
  }
  return '剛剛'
}

// json schema 驗證器
exports.schemaValidator = function (schema, params) {
  try {
    const ajv = new Ajv({
      format: false,
      meta: false,
    })
    const metaSchema = require('ajv/lib/refs/json-schema-draft-04.json')
    ajv.addMetaSchema(metaSchema)
    ajv._opts.defaultMeta = metaSchema.id
    ajv._refs['http://json-schema.org/schema'] = 'http://json-schema.org/draft-04/schema'
    const localize = require('ajv-i18n')

    schema = schema || {
      type: 'object',
      title: 'empty object',
      properties: {},
    }
    const validate = ajv.compile(schema)
    const valid = validate(params)

    let message = ''
    if (!valid) {
      localize.zh(validate.errors)
      message += ajv.errorsText(validate.errors, {separator: '\n'})
    }

    return {
      valid: valid,
      message: message,
    }
  } catch (e) {
    return {
      valid: false,
      message: e.message,
    }
  }
}
