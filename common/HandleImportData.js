const _ = require('underscore')
const axios = require('axios')

const isNode = typeof global === 'object' && global.global === global

async function handle(
  res,
  projectId,
  selectCatid,
  menuList,
  basePath,
  dataSync,
  messageError,
  messageSuccess,
  callback,
  token,
  port,
) {
  const taskNotice = _.throttle((index, len) => {
    messageSuccess(`正在匯入，已執行任務 ${index + 1} 個，共 ${len} 個`)
  }, 3000)

  const handleAddCat = async cats => {
    const catsObj = {}
    if (cats && Array.isArray(cats)) {
      for (let i = 0; i < cats.length; i++) {
        const cat = cats[i]
        const findCat = _.find(menuList, menu => menu.name === cat.name)
        catsObj[cat.name] = cat
        if (findCat) {
          cat.id = findCat._id
        } else {
          let apipath = '/api/interface/add_cat'
          if (isNode) {
            apipath = `http://127.0.0.1:${ port }${apipath}`
          }

          const data = {
            name: cat.name,
            project_id: projectId,
            desc: cat.desc,
            token,
          }
          const result = await axios.post(apipath, data)

          if (result.data.errcode) {
            messageError(result.data.errmsg)
            callback({showLoading: false})
            return false
          }
          cat.id = result.data.data._id
        }
      }
    }
    return catsObj
  }

  const handleAddInterface = async info => {
    const cats = await handleAddCat(info.cats)
    if (cats === false) {
      return
    }

    const res = info.apis
    const len = res.length
    let count = 0
    let successNum = len
    let existNum = 0
    if (len === 0) {
      messageError(`解析數據為空`)
      callback({showLoading: false})
      return
    }

    if (info.basePath) {
      let projectApiPath = '/api/project/up'
      if (isNode) {
        projectApiPath = `http://127.0.0.1:${ port }${projectApiPath}`
      }

      await axios.post(projectApiPath, {
        id: projectId,
        basepath: info.basePath,
        token,
      })
    }

    for (let index = 0; index < res.length; index++) {
      const item = res[index]
      const data = Object.assign(item, {
        project_id: projectId,
        catid: selectCatid,
      })
      if (basePath) {
        data.path
          = data.path.indexOf(basePath) === 0 ? data.path.substr(basePath.length) : data.path
      }
      if (
        data.catname
        && cats[data.catname]
        && typeof cats[data.catname] === 'object'
        && cats[data.catname].id
      ) {
        data.catid = cats[data.catname].id
      }
      data.token = token

      if (dataSync !== 'normal') {
        // 開啟同步功能
        count++
        let apipath = '/api/interface/save'
        if (isNode) {
          apipath = `http://127.0.0.1:${ port }${apipath}`
        }
        data.dataSync = dataSync
        const result = await axios.post(apipath, data)
        if (result.data.errcode) {
          successNum--
          callback({showLoading: false})
          messageError(result.data.errmsg)
        } else {
          existNum = existNum + result.data.data.length
        }
      } else {
        // 未開啟同步功能
        count++
        let apipath = '/api/interface/add'
        if (isNode) {
          apipath = `http://127.0.0.1:${ port }${apipath}`
        }
        const result = await axios.post(apipath, data)
        if (result.data.errcode) {
          successNum--
          if (result.data.errcode === 40022) {
            existNum++
          }
          if (result.data.errcode === 40033) {
            callback({showLoading: false})
            messageError('沒有許可權')
            break
          }
        }
      }
      if (count === len) {
        callback({showLoading: false})
        messageSuccess(`成功匯入介面 ${successNum} 個, 已存在的介面 ${existNum} 個`)
        return
      }

      taskNotice(index, res.length)
    }
  }

  return handleAddInterface(res)
}

module.exports = handle
