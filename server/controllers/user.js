const userModel = require('../models/user.js')
const yapi = require('../yapi.js')
const baseController = require('./base.js')
const common = require('../utils/commons.js')
const ldap = require('../utils/ldap.js')

const interfaceModel = require('../models/interface.js')
const groupModel = require('../models/group.js')
const projectModel = require('../models/project.js')
const avatarModel = require('../models/avatar.js')

const jwt = require('jsonwebtoken')

class userController extends baseController {
  constructor(ctx) {
    super(ctx)
    this.Model = yapi.getInst(userModel)
  }

  /**
   * 使用者登錄介面
   * @interface /user/login
   * @method POST
   * @category user
   * @foldnumber 10
   * @param {String} email email名稱，不能為空
   * @param  {String} password 密碼，不能為空
   * @returns {Object}
   * @example ./api/user/login.json
   */
  async login(ctx) {
    //登錄
    const userInst = yapi.getInst(userModel) //建立user實體
    const email = ctx.request.body.email
    const password = ctx.request.body.password

    if (!email) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'email不能為空'))
    }
    if (!password) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '密碼不能為空'))
    }

    const result = await userInst.findByEmail(email)

    if (!result) {
      return (ctx.body = yapi.commons.resReturn(null, 404, '該使用者不存在'))
    } else if (yapi.commons.generatePassword(password, result.passsalt) === result.password) {
      this.setLoginCookie(result._id, result.passsalt)

      return (ctx.body = yapi.commons.resReturn(
        {
          username: result.username,
          role: result.role,
          uid: result._id,
          email: result.email,
          add_time: result.add_time,
          up_time: result.up_time,
          type: 'site',
          study: result.study,
        },
        0,
        'logout success...',
      ))
    }
    return (ctx.body = yapi.commons.resReturn(null, 405, '密碼錯誤'))
  }

  /**
   * 退出登錄介面
   * @interface /user/logout
   * @method GET
   * @category user
   * @foldnumber 10
   * @returns {Object}
   * @example ./api/user/logout.json
   */

  async logout(ctx) {
    ctx.cookies.set('_yapi_token', null)
    ctx.cookies.set('_yapi_uid', null)
    ctx.body = yapi.commons.resReturn('ok')
  }

  /**
   * 更新
   * @interface /user/up_study
   * @method GET
   * @category user
   * @foldnumber 10
   * @returns {Object}
   * @example
   */

  async upStudy(ctx) {
    const userInst = yapi.getInst(userModel) //建立user實體
    const data = {
      up_time: yapi.commons.time(),
      study: true,
    }
    try {
      const result = await userInst.update(this.getUid(), data)
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message)
    }
  }

  async loginByToken(ctx) {
    try {
      const ret = await yapi.emitHook('third_login', ctx)
      const login = await this.handleThirdLogin(ret.email, ret.username)
      if (login === true) {
        yapi.commons.log('login success')
        ctx.redirect('/group')
      }
    } catch (e) {
      yapi.commons.log(e.message, 'error')
      ctx.redirect('/')
    }
  }

  /**
   * ldap登錄
   * @interface /user/login_by_ldap
   * @method
   * @category user
   * @foldnumber 10
   * @param {String} email email名稱，不能為空
   * @param  {String} password 密碼，不能為空
   * @returns {Object}
   *
   */
  async getLdapAuth(ctx) {
    try {
      const {email, password} = ctx.request.body
      // const username = email.split(/\@/g)[0];
      const {info: ldapInfo} = await ldap.ldapQuery(email, password)
      const emailPrefix = email.split(/@/g)[0]
      const emailPostfix = yapi.WEBCONFIG.ldapLogin.emailPostfix

      const emailParams
        = ldapInfo[yapi.WEBCONFIG.ldapLogin.emailKey || 'mail']
        || (emailPostfix ? emailPrefix + emailPostfix : email)
      const username = ldapInfo[yapi.WEBCONFIG.ldapLogin.usernameKey] || emailPrefix

      const login = await this.handleThirdLogin(emailParams, username)

      if (login === true) {
        const userInst = yapi.getInst(userModel) //建立user實體
        const result = await userInst.findByEmail(emailParams)
        return (ctx.body = yapi.commons.resReturn(
          {
            username: result.username,
            role: result.role,
            uid: result._id,
            email: result.email,
            add_time: result.add_time,
            up_time: result.up_time,
            type: result.type || 'third',
            study: result.study,
          },
          0,
          'logout success...',
        ))
      }
    } catch (e) {
      yapi.commons.log(e.message, 'error')
      return (ctx.body = yapi.commons.resReturn(null, 401, e.message))
    }
  }

  // 處理第三方登錄
  async handleThirdLogin(email, username) {
    let user, data, passsalt
    const userInst = yapi.getInst(userModel)

    try {
      user = await userInst.findByEmail(email)

      // 新建使用者資訊
      if (!user || !user._id) {
        passsalt = yapi.commons.randStr()
        data = {
          username: username,
          password: yapi.commons.generatePassword(passsalt, passsalt),
          email: email,
          passsalt: passsalt,
          role: 'member',
          add_time: yapi.commons.time(),
          up_time: yapi.commons.time(),
          type: 'third',
        }
        user = await userInst.save(data)
        await this.handlePrivateGroup(user._id, username, email)
        yapi.commons.sendMail({
          to: email,
          contents: `<h3>親愛的使用者：</h3><p>您好，感謝使用YApi平臺，你的郵箱賬號是：${email}</p>`,
        })
      }

      this.setLoginCookie(user._id, user.passsalt)
      return true
    } catch (e) {
      console.error('third_login:', e.message); // eslint-disable-line
      throw new Error(`third_login: ${e.message}`)
    }
  }

  /**
   * 修改使用者密碼
   * @interface /user/change_password
   * @method POST
   * @category user
   * @param {Number} uid 使用者ID
   * @param {Number} [old_password] 舊密碼, 非admin使用者必須傳
   * @param {Number} password 新密碼
   * @return {Object}
   * @example ./api/user/change_password.json
   */
  async changePassword(ctx) {
    const params = ctx.request.body
    const userInst = yapi.getInst(userModel)

    if (!params.uid) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'uid不能為空'))
    }

    if (!params.password) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '密碼不能為空'))
    }

    const user = await userInst.findById(params.uid)
    if (this.getRole() !== 'admin' && params.uid != this.getUid()) {
      return (ctx.body = yapi.commons.resReturn(null, 402, '沒有許可權'))
    }

    if (this.getRole() !== 'admin' || user.role === 'admin') {
      if (!params.old_password) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '舊密碼不能為空'))
      }

      if (yapi.commons.generatePassword(params.old_password, user.passsalt) !== user.password) {
        return (ctx.body = yapi.commons.resReturn(null, 402, '舊密碼錯誤'))
      }
    }

    const passsalt = yapi.commons.randStr()
    const data = {
      up_time: yapi.commons.time(),
      password: yapi.commons.generatePassword(params.password, passsalt),
      passsalt: passsalt,
    }
    try {
      const result = await userInst.update(params.uid, data)
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message)
    }
  }

  async handlePrivateGroup(uid) {
    const groupInst = yapi.getInst(groupModel)
    await groupInst.save({
      uid: uid,
      group_name: `User-${ uid}`,
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time(),
      type: 'private',
    })
  }

  setLoginCookie(uid, passsalt) {
    const token = jwt.sign({uid: uid}, passsalt, {expiresIn: '7 days'})

    this.ctx.cookies.set('_yapi_token', token, {
      expires: yapi.commons.expireDate(7),
      httpOnly: true,
    })
    this.ctx.cookies.set('_yapi_uid', uid, {
      expires: yapi.commons.expireDate(7),
      httpOnly: true,
    })
  }

  /**
   * 使用者註冊介面
   * @interface /user/reg
   * @method POST
   * @category user
   * @foldnumber 10
   * @param {String} email email名稱，不能為空
   * @param  {String} password 密碼，不能為空
   * @param {String} [username] 使用者名稱
   * @returns {Object}
   * @example ./api/user/login.json
   */
  async reg(ctx) {
    //註冊
    if (yapi.WEBCONFIG.closeRegister) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '禁止註冊，請聯繫管理員'))
    }
    const userInst = yapi.getInst(userModel)
    let params = ctx.request.body //獲取請求的參數,檢查是否存在使用者名稱和密碼

    params = yapi.commons.handleParams(params, {
      username: 'string',
      password: 'string',
      email: 'string',
    })

    if (!params.email) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '郵箱不能為空'))
    }

    if (!params.password) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '密碼不能為空'))
    }

    const checkRepeat = await userInst.checkRepeat(params.email) //然後檢查是否已經存在該使用者

    if (checkRepeat > 0) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '該email已經註冊'))
    }

    const passsalt = yapi.commons.randStr()
    const data = {
      username: params.username,
      password: yapi.commons.generatePassword(params.password, passsalt), //加密
      email: params.email,
      passsalt: passsalt,
      role: 'member',
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time(),
      type: 'site',
    }

    if (!data.username) {
      data.username = data.email.substr(0, data.email.indexOf('@'))
    }

    try {
      const user = await userInst.save(data)

      this.setLoginCookie(user._id, user.passsalt)
      await this.handlePrivateGroup(user._id, user.username, user.email)
      ctx.body = yapi.commons.resReturn({
        uid: user._id,
        email: user.email,
        username: user.username,
        add_time: user.add_time,
        up_time: user.up_time,
        role: 'member',
        type: user.type,
        study: false,
      })
      yapi.commons.sendMail({
        to: user.email,
        contents: `<h3>親愛的使用者：</h3><p>您好，感謝使用YApi視覺化介面平臺,您的賬號 ${
          params.email
        } 已經註冊成功</p>`,
      })
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message)
    }
  }

  /**
   * 獲取使用者列表
   * @interface /user/list
   * @method GET
   * @category user
   * @foldnumber 10
   * @param {Number} [page] 分頁頁碼
   * @param {Number} [limit] 分頁大小,預設為10條
   * @returns {Object}
   * @example
   */
  async list(ctx) {
    const page = ctx.request.query.page || 1,
      limit = ctx.request.query.limit || 10

    const userInst = yapi.getInst(userModel)
    try {
      const user = await userInst.listWithPaging(page, limit)
      const count = await userInst.listCount()
      return (ctx.body = yapi.commons.resReturn({
        count: count,
        total: Math.ceil(count / limit),
        list: user,
      }))
    } catch (e) {
      return (ctx.body = yapi.commons.resReturn(null, 402, e.message))
    }
  }

  /**
   * 獲取使用者個人資訊
   * @interface /user/find
   * @method GET
   * @param id 使用者uid
   * @category user
   * @foldnumber 10
   * @returns {Object}
   * @example
   */
  async findById(ctx) {
    //根據id獲取使用者資訊
    try {
      const userInst = yapi.getInst(userModel)
      const id = ctx.request.query.id

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'uid不能為空'))
      }

      const result = await userInst.findById(id)

      if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 402, '不存在的使用者'))
      }

      return (ctx.body = yapi.commons.resReturn({
        uid: result._id,
        username: result.username,
        email: result.email,
        role: result.role,
        type: result.type,
        add_time: result.add_time,
        up_time: result.up_time,
      }))
    } catch (e) {
      return (ctx.body = yapi.commons.resReturn(null, 402, e.message))
    }
  }

  /**
   * 刪除使用者,只有admin使用者才有此許可權
   * @interface /user/del
   * @method POST
   * @param id 使用者uid
   * @category user
   * @foldnumber 10
   * @returns {Object}
   * @example
   */
  async del(ctx) {
    //根據id刪除一個使用者
    try {
      if (this.getRole() !== 'admin') {
        return (ctx.body = yapi.commons.resReturn(null, 402, 'Without permission.'))
      }

      const userInst = yapi.getInst(userModel)
      const id = ctx.request.body.id
      if (id == this.getUid()) {
        return (ctx.body = yapi.commons.resReturn(null, 403, '禁止刪除管理員'))
      }
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'uid不能為空'))
      }

      const result = await userInst.del(id)

      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message)
    }
  }

  /**
   * 更新使用者個人資訊
   * @interface /user/update
   * @method POST
   * @param uid  使用者uid
   * @param [role] 使用者角色,只有管理員有許可權修改
   * @param [username] String
   * @param [email] String
   * @category user
   * @foldnumber 10
   * @returns {Object}
   * @example
   */
  async update(ctx) {
    //更新使用者資訊
    try {
      let params = ctx.request.body

      params = yapi.commons.handleParams(params, {
        username: 'string',
        email: 'string',
      })

      if (this.getRole() !== 'admin' && params.uid != this.getUid()) {
        return (ctx.body = yapi.commons.resReturn(null, 401, '沒有許可權'))
      }

      const userInst = yapi.getInst(userModel)
      const id = params.uid

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'uid不能為空'))
      }

      const userData = await userInst.findById(id)
      if (!userData) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'uid不存在'))
      }

      const data = {
        up_time: yapi.commons.time(),
      }

      params.username && (data.username = params.username)
      params.email && (data.email = params.email)

      if (data.email) {
        const checkRepeat = await userInst.checkRepeat(data.email) //然後檢查是否已經存在該使用者
        if (checkRepeat > 0) {
          return (ctx.body = yapi.commons.resReturn(null, 401, '該email已經註冊'))
        }
      }

      const member = {
        uid: id,
        username: data.username || userData.username,
        email: data.email || userData.email,
      }
      const groupInst = yapi.getInst(groupModel)
      await groupInst.updateMember(member)
      const projectInst = yapi.getInst(projectModel)
      await projectInst.updateMember(member)

      const result = await userInst.update(id, data)
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message)
    }
  }

  /**
   * 上傳使用者頭像
   * @interface /user/upload_avatar
   * @method POST
   * @param {*} basecode  base64編碼，通過h5 api傳給後端
   * @category user
   * @returns {Object}
   * @example
   */

  async uploadAvatar(ctx) {
    try {
      let basecode = ctx.request.body.basecode
      if (!basecode) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'basecode不能為空'))
      }
      const pngPrefix = 'data:image/png;base64,'
      const jpegPrefix = 'data:image/jpeg;base64,'
      let type
      if (basecode.substr(0, pngPrefix.length) === pngPrefix) {
        basecode = basecode.substr(pngPrefix.length)
        type = 'image/png'
      } else if (basecode.substr(0, jpegPrefix.length) === jpegPrefix) {
        basecode = basecode.substr(jpegPrefix.length)
        type = 'image/jpeg'
      } else {
        return (ctx.body = yapi.commons.resReturn(null, 400, '僅支援jpeg和png格式的圖片'))
      }
      const strLength = basecode.length
      if (parseInt(strLength - (strLength / 8) * 2) > 200000) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '圖片大小不能超過200kb'))
      }

      const avatarInst = yapi.getInst(avatarModel)
      const result = await avatarInst.up(this.getUid(), basecode, type)
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message)
    }
  }

  /**
   * 根據使用者uid頭像
   * @interface /user/avatar
   * @method GET
   * @param {*} uid
   * @category user
   * @returns {Object}
   * @example
   */

  async avatar(ctx) {
    try {
      const uid = ctx.query.uid ? ctx.query.uid : this.getUid()
      const avatarInst = yapi.getInst(avatarModel)
      const data = await avatarInst.get(uid)
      let dataBuffer, type
      if (!data || !data.basecode) {
        dataBuffer = yapi.fs.readFileSync(yapi.path.join(yapi.WEBROOT, 'static/image/avatar.png'))
        type = 'image/png'
      } else {
        type = data.type
        dataBuffer = new Buffer(data.basecode, 'base64')
      }

      ctx.set('Content-type', type)
      ctx.body = dataBuffer
    } catch (err) {
      ctx.body = `error:${ err.message}`
    }
  }

  /**
   * 模糊搜索使用者名稱或者email
   * @interface /user/search
   * @method GET
   * @category user
   * @foldnumber 10
   * @param {String} q
   * @return {Object}
   * @example ./api/user/search.json
   */
  async search(ctx) {
    const {q} = ctx.request.query

    if (!q) {
      return (ctx.body = yapi.commons.resReturn(void 0, 400, 'No keyword.'))
    }

    if (!yapi.commons.validateSearchKeyword(q)) {
      return (ctx.body = yapi.commons.resReturn(void 0, 400, 'Bad query.'))
    }

    const queryList = await this.Model.search(q)
    const rules = [
      {
        key: '_id',
        alias: 'uid',
      },
      'username',
      'email',
      'role',
      {
        key: 'add_time',
        alias: 'addTime',
      },
      {
        key: 'up_time',
        alias: 'upTime',
      },
    ]

    const filteredRes = common.filterRes(queryList, rules)

    return (ctx.body = yapi.commons.resReturn(filteredRes, 0, 'ok'))
  }

  /**
   * 根據路由id初始化專案數據
   * @interface /user/project
   * @method GET
   * @category user
   * @foldnumber 10
   * @param {String} type 可選group|interface|project
   * @param {Number} id
   * @return {Object}
   * @example
   */
  async project(ctx) {
    let {id, type} = ctx.request.query
    const result = {}
    try {
      if (type === 'interface') {
        const interfaceInst = yapi.getInst(interfaceModel)
        const interfaceData = await interfaceInst.get(id)
        result.interface = interfaceData
        type = 'project'
        id = interfaceData.project_id
      }

      if (type === 'project') {
        const projectInst = yapi.getInst(projectModel)
        const projectData = await projectInst.get(id)
        result.project = projectData.toObject()
        const ownerAuth = await this.checkAuth(id, 'project', 'danger')
        let devAuth
        if (ownerAuth) {
          result.project.role = 'owner'
        } else {
          devAuth = await this.checkAuth(id, 'project', 'site')
          if (devAuth) {
            result.project.role = 'dev'
          } else {
            result.project.role = 'member'
          }
        }
        type = 'group'
        id = projectData.group_id
      }

      if (type === 'group') {
        const groupInst = yapi.getInst(groupModel)
        const groupData = await groupInst.get(id)
        result.group = groupData.toObject()
        const ownerAuth = await this.checkAuth(id, 'group', 'danger')
        let devAuth
        if (ownerAuth) {
          result.group.role = 'owner'
        } else {
          devAuth = await this.checkAuth(id, 'group', 'site')
          if (devAuth) {
            result.group.role = 'dev'
          } else {
            result.group.role = 'member'
          }
        }
      }

      return (ctx.body = yapi.commons.resReturn(result))
    } catch (e) {
      return (ctx.body = yapi.commons.resReturn(result, 422, e.message))
    }
  }
}

module.exports = userController
