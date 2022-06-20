const baseController = require('controllers/base.js');
const yapi = require('yapi.js');
const syncModel = require('../syncModel.js');
const projectModel = require('models/project.js');
const interfaceSyncUtils = require('../interfaceSyncUtils.js')

class syncController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.syncModel = yapi.getInst(syncModel);
    this.projectModel = yapi.getInst(projectModel);
    this.interfaceSyncUtils = yapi.getInst(interfaceSyncUtils);
  }

  /**
   * 儲存定時任務
   * @param {*} ctx 
   */
  async upSync(ctx) {
    let requestBody = ctx.request.body;
    let projectId = requestBody.project_id;
    if (!projectId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少專案Id'));
    }

    if ((await this.checkAuth(projectId, 'project', 'edit')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '沒有許可權'));
    }

    let result;
    if (requestBody.id) {
      result = await this.syncModel.up(requestBody);
    } else {
      result = await this.syncModel.save(requestBody);
    }

    //操作定時任務
    if (requestBody.is_sync_open) {
      this.interfaceSyncUtils.addSyncJob(projectId, requestBody.sync_cron, requestBody.sync_json_url, requestBody.sync_mode, requestBody.uid);
    } else {
      this.interfaceSyncUtils.deleteSyncJob(projectId);
    }
    return (ctx.body = yapi.commons.resReturn(result));
  }

  /**
   * 查詢定時任務
   * @param {*} ctx 
   */
  async getSync(ctx) {
    let projectId = ctx.query.project_id;
    if (!projectId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少專案Id'));
    }
    let result = await this.syncModel.getByProjectId(projectId);
    return (ctx.body = yapi.commons.resReturn(result));
  }

}


module.exports = syncController;