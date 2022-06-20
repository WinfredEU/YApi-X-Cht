/**
 * type component  元件
 *      listener   監聽函式
 * mulit 是否繫結多個監聽函式
 */

const hooks = {
  /**
   * 第三方登錄 //可參考 yapi-plugin-qsso 外掛
   */
  third_login: {
    type: 'component',
    mulit: false,
    listener: null,
  },
  /**
   * 匯入數據
   * @param Object importDataModule
   *
   * @info
   * 可參考 vendors/exts/yapi-plugin-import-swagger外掛
   * importDataModule = {};
   */
  import_data: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 導出數據
   * @param Object exportDataModule
   * @param projectId
   * @info
   * exportDataModule = {};
   * exportDataModule.pdf = {
   *   name: 'Pdf',
   *   route: '/api/plugin/export/pdf',
   *   desc: '導出專案介面文件為 pdf 檔案'
   * }
   */
  export_data: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 介面頁面 tab 鉤子
   * @param InterfaceTabs
   *
   * @info
   * 可參考 vendors/exts/yapi-plugin-advanced-mock
   * let InterfaceTabs = {
      view: {
        component: View,
        name: '預覽'
      },
      edit: {
        component: Edit,
        name: '編輯'
      },
      run: {
        component: Run,
        name: '執行'
      }
    }
   */
  interface_tab: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 在執行頁面或單個測試也里每次發送請求前呼叫
   * 可以用外掛針對某個介面的請求頭或者數據進行修改或者記錄
  */
  before_request: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 在執行頁面或單個測試也里每次發送完成後呼叫
   * 返回值為響應原始值 +
   * {
   *   type: 'inter' | 'case',
   *   projectId: string,
   *   interfaceId: string
   * }
  */
  after_request: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 在測試集里執行每次發送請求前呼叫
  */
  before_col_request: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * 在測試集里執行每次發送請求后呼叫
   * 返回值為響應原始值 +
   * {
   *   type: 'col',
   *   caseId: string,
   *   projectId: string,
   *   interfaceId: string
   * }
  */
  after_col_request: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * header下拉菜單 menu 鉤子
   * @param HeaderMenu
   *
   * @info
   * 可參考 vendors/exts/yapi-plugin-statistics
   * let HeaderMenu = {
  user: {
    path: '/user/profile',
    name: '個人中心',
    icon: 'user',
    adminFlag: false
  },
  star: {
    path: '/follow',
    name: '我的關注',
    icon: 'star-o',
    adminFlag: false
  },
  solution: {
    path: '/user/list',
    name: '使用者管理',
    icon: 'solution',
    adminFlag: true

  },
  logout: {
    path: '',
    name: '退出',
    icon: 'logout',
    adminFlag: false

  }
};
   */
  header_menu: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /**
   * Route路由列表鉤子
   * @param AppRoute
   *
   * @info
   * 可參考 vendors/exts/yapi-plugin-statistics
   * 新增位置在Application.js 中
   * let AppRoute = {
  home: {
    path: '/',
    component: Home
  },
  group: {
    path: '/group',
    component: Group
  },
  project: {
    path: '/project/:id',
    component: Project
  },
  user: {
    path: '/user',
    component: User
  },
  follow: {
    path: '/follow',
    component: Follows
  },
  addProject: {
    path: '/add-project',
    component: AddProject
  },
  login: {
    path: '/login',
    component: Login
  }
};
};
   */
  app_route: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /*
   * 新增 reducer
   * @param Object reducerModules
   *
   * @info
   * importDataModule = {};
   */

  add_reducer: {
    type: 'listener',
    mulit: true,
    listener: [],
  },

  /*
   * 新增 subnav 鉤子
   * @param Object reducerModules
   *
   *  let routers = {
      interface: { name: '介面', path: "/project/:id/interface/:action", component:Interface },
      activity: { name: '動態', path: "/project/:id/activity", component:  Activity},
      data: { name: '數據管理', path: "/project/:id/data",  component: ProjectData},
      members: { name: '成員管理', path: "/project/:id/members" , component: ProjectMember},
      setting: { name: '設定', path: "/project/:id/setting" , component: Setting}
    }
   */
  sub_nav: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
  /*
   * 新增專案設定 nav
   * @param Object routers
   *
   *  let routers = {
      interface: { name: 'xxx', component: Xxx },
    }
   */
  sub_setting_nav: {
    type: 'listener',
    mulit: true,
    listener: [],
  },
}

function bindHook(name, listener) {
  if (!name) {
    throw new Error('缺少hookname')
  }
  if (name in hooks === false) {
    throw new Error('不存在的hookname')
  }
  if (hooks[name].mulit === true) {
    hooks[name].listener.push(listener)
  } else {
    hooks[name].listener = listener
  }
}

function emitHook(name, ...args) {
  if (!hooks[name]) {
    throw new Error('不存在的hook name')
  }
  const hook = hooks[name]
  if (hook.mulit === true && hook.type === 'listener') {
    if (Array.isArray(hook.listener)) {
      const promiseAll = []
      hook.listener.forEach(item => {
        if (typeof item === 'function') {
          promiseAll.push(Promise.resolve(item.call(pluginModule, ...args)))
        }
      })
      return Promise.all(promiseAll)
    }
  } else if (hook.mulit === false && hook.type === 'listener') {
    if (typeof hook.listener === 'function') {
      return Promise.resolve(hook.listener.call(pluginModule, ...args))
    }
  } else if (hook.type === 'component') {
    return hook.listener
  }
}

const pluginModule = {
  hooks: hooks,
  bindHook: bindHook,
  emitHook: emitHook,
}
let pluginModuleList
try {
  pluginModuleList = require('./plugin-module.js')
} catch (err) {
  pluginModuleList = {}
}

Object.keys(pluginModuleList).forEach(plugin => {
  if (!pluginModuleList[plugin]) return null
  if (pluginModuleList[plugin] && typeof pluginModuleList[plugin].module === 'function') {
    pluginModuleList[plugin].module.call(pluginModule, pluginModuleList[plugin].options)
  }
})

module.exports = pluginModule
