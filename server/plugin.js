const yapi = require('./yapi.js')

const plugin_path = yapi.path.join(yapi.WEBROOT, 'node_modules')
const plugin_system_path = yapi.path.join(yapi.WEBROOT, 'exts')
const initPlugins = require('../common/plugin.js').initPlugins
let extConfig = require('../common/config.js').exts

/**
 * 鉤子配置
 */
const hooks = {
  /**
   * 第三方sso登錄鉤子，暫只支援設定一個
   * @param ctx
   * @return 必需返回一個 promise 對象，resolve({username: '', email: ''})
   */
  third_login: {
    type: 'single',
    listener: null,
  },
  /**
   * 客戶端增加介面成功后觸發
   * @param data 介面的詳細資訊
   */
  interface_add: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端刪除介面成功后觸發
   * @param data 介面id
   */
  interface_del: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端更新介面成功后觸發
   * @param id 介面id
   */
  interface_update: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端獲取介面數據列表
   * @param list 返回介面的數據列表
   */
  interface_list: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端獲取一條介面資訊觸發
   * @param data 介面的詳細資訊
   */
  interface_get: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端增加一個新專案
   * @param id 專案id
   */
  project_add: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端更新一個新專案
   * @param id 專案id
   */
  project_up: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端獲取一個專案
   * @param id 專案id
   */
  project_get: {
    type: 'multi',
    listener: [],
  },
  /**
   * 客戶端刪除刪除一個專案
   * @param id 專案id
   */
  project_del: {
    type: 'multi',
    listener: [],
  },
  /**
     * 導出 markdown 數據
     * @param context Object
     * {
     *  projectData: project,
        interfaceData: interfaceData,
        ctx: ctx,
        mockJson: res
     * }
     *
     */
  export_markdown: {
    type: 'multi',
    listener: [],
  },
  /**
     * MockServer產生mock數據后觸發
     * @param context Object
     * {
     *  projectData: project,
        interfaceData: interfaceData,
        ctx: ctx,
        mockJson: res
     * }
     *
     */
  mock_after: {
    type: 'multi',
    listener: [],
  },
  /**
   * 增加路由的鉤子
   * type Sync
   * @param addPluginRouter Function
   * @info
   * addPLuginPLugin(config)
   *
   * config = {
   *  path,      // String 路由名稱
   *  method,    // String 請求方法 get post ...
   *  controller // Class 繼承baseController的class
   *  action     // String controller的Action
   * }
   *
   * 示例：
   * config = {
   *  path:  "export/pdf",
   *  method: "get",
   *  controller: controller,
   *  action: "exportPdf"
   * }
   */
  add_router: {
    type: 'multi',
    listener: [],
  },
  /**
   * 增加websocket路由的鉤子
   * type Sync
   * @param addPluginRouter Function
   * @info
   * addPLuginPLugin(config)
   *
   * config = {
   *  path,      // String 路由名稱
   *  method,    // String 請求方法 get post ...
   *  controller // Class 繼承baseController的class
   *  action     // String controller的Action
   * }
   *
   * 示例：
   * config = {
   *  path:  "export/pdf",
   *  method: "get",
   *  controller: controller,
   *  action: "exportPdf"
   * }
   */
  add_ws_router: {
    type: 'multi',
    listener: [],
  },

  import_data: {
    type: 'multi',
    listener: [],
  },

  /**
   * addNoticePlugin(config)
   *
   * config.weixin = {
   *    title: 'wechat',
   *    hander: (emails, title, content)=> {...}
   * }
   */
  addNotice: {
    type: 'multi',
    listener: [],
  },
}

function bindHook(name, listener) {
  if (!name) throw new Error('缺少hookname')
  if (name in hooks === false) {
    throw new Error('不存在的hookname')
  }
  if (hooks[name].type === 'multi') {
    hooks[name].listener.push(listener)
  } else {
    if (typeof hooks[name].listener === 'function') {
      throw new Error(`重複繫結singleHook(${ name }), 請檢查`)
    }
    hooks[name].listener = listener
  }
}

/**
 *
 * @param {*} hookname
 * @return promise
 */
function emitHook(name) {
  if (hooks[name] && typeof hooks[name] === 'object') {
    const args = Array.prototype.slice.call(arguments, 1)
    if (hooks[name].type === 'single' && typeof hooks[name].listener === 'function') {
      return Promise.resolve(hooks[name].listener.apply(yapi, args))
    }
    const promiseAll = []
    if (Array.isArray(hooks[name].listener)) {
      const listenerList = hooks[name].listener
      for (let i = 0, l = listenerList.length; i < l; i++) {
        promiseAll.push(Promise.resolve(listenerList[i].apply(yapi, args)))
      }
    }
    return Promise.all(promiseAll)
  }
}

yapi.bindHook = bindHook
yapi.emitHook = emitHook
yapi.emitHookSync = emitHook

const pluginsConfig = initPlugins(yapi.WEBCONFIG.plugins, 'plugin')
pluginsConfig.forEach(plugin => {
  if (!plugin || plugin.enable === false || plugin.server === false) return null

  if (
    !yapi.commons.fileExist(
      yapi.path.join(plugin_path, `yapi-plugin-${ plugin.name }/server.js`),
    )
  ) {
    throw new Error(`config.json配置了外掛${plugin},但plugins目錄沒有找到此外掛，請安裝此外掛`)
  }
  const pluginModule = require(yapi.path.join(
    plugin_path,
    `yapi-plugin-${ plugin.name }/server.js`,
  ))
  pluginModule.call(yapi, plugin.options)
})
extConfig = initPlugins(extConfig, 'ext')

extConfig.forEach(plugin => {
  if (!plugin || plugin.enable === false || plugin.server === false) return null

  if (
    !yapi.commons.fileExist(
      yapi.path.join(plugin_system_path, `yapi-plugin-${ plugin.name }/server.js`),
    )
  ) {
    throw new Error(`config.json配置了外掛${plugin},但plugins目錄沒有找到此外掛，請安裝此外掛`)
  }
  const pluginModule = require(yapi.path.join(
    plugin_system_path,
    `yapi-plugin-${ plugin.name }/server.js`,
  ))
  pluginModule.call(yapi, plugin.options)
})

//delete bindHook方法，避免誤操作
delete yapi.bindHook
