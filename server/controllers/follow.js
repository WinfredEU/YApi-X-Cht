const yapi = require('../yapi.js')
const baseController = require('./base.js')
const followModel = require('../models/follow')
const projectModel = require('../models/project')

class followController extends baseController {
  constructor(ctx) {
    super(ctx)
    this.Model = yapi.getInst(followModel)
    this.projectModel = yapi.getInst(projectModel)
  }

  /**
   * 獲取關注專案列表
   * @interface /follow/list
   * @method GET
   * @category follow
   * @foldnumber 10
   * @param {Number} [page] 分頁頁碼
   * @param {Number} [limit] 分頁大小
   * @returns {Object}
   * @example /follow/list
   */

  async list(ctx) {
    const uid = this.getUid()
    // 關注列表暫時不分頁 page & limit 為分頁配置
    // page = ctx.request.query.page || 1,
    // limit = ctx.request.query.limit || 10;

    if (!uid) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '使用者id不能為空'))
    }

    try {
      const result = await this.Model.list(uid)

      ctx.body = yapi.commons.resReturn({
        list: result,
      })
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message)
    }
  }

  /**
   * 取消關注
   * @interface /follow/del
   * @method POST
   * @category follow
   * @foldnumber 10
   * @param {Number} projectid
   * @returns {Object}
   * @example /follow/del
   */

  async del(ctx) {
    const params = ctx.request.body,
      uid = this.getUid()

    if (!params.projectid) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'))
    }

    const checkRepeat = await this.Model.checkProjectRepeat(uid, params.projectid)

    if (checkRepeat == 0) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '專案未關注'))
    }

    try {
      const result = await this.Model.del(params.projectid, this.getUid())
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message)
    }
  }

  /**
   * 新增關注
   * @interface /follow/add
   * @method GET
   * @category follow
   * @foldnumber 10
   * @param {Number} projectid 專案id
   * @param {String} projectname 專案名
   * @param {String} icon 專案icon
   * @returns {Object}
   * @example /follow/add
   */

  async add(ctx) {
    let params = ctx.request.body
    params = yapi.commons.handleParams(params, {
      projectid: 'number',
    })

    const uid = this.getUid()

    if (!params.projectid) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'))
    }

    const checkRepeat = await this.Model.checkProjectRepeat(uid, params.projectid)

    if (checkRepeat) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '專案已關注'))
    }

    try {
      const project = await this.projectModel.get(params.projectid)
      const data = {
        uid: uid,
        projectid: params.projectid,
        projectname: project.name,
        icon: project.icon,
        color: project.color,
        logo: project.logo,
      }
      let result = await this.Model.save(data)
      result = yapi.commons.fieldSelect(result, [
        '_id',
        'uid',
        'projectid',
        'projectname',
        'icon',
        'color',
        'logo',
      ])
      ctx.body = yapi.commons.resReturn(result)
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message)
    }
  }
}

module.exports = followController
