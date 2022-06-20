const schedule = require('node-schedule');
const openController = require('controllers/open.js');
const projectModel = require('models/project.js');
const syncModel = require('./syncModel.js');
const tokenModel = require('models/token.js');
const yapi = require('yapi.js')
const sha = require('sha.js');
const md5 = require('md5');
const { getToken } = require('utils/token');
const jobMap = new Map();

class syncUtils {

    constructor(ctx) {
        yapi.commons.log("-------------------------------------swaggerSyncUtils constructor-----------------------------------------------");
        this.ctx = ctx;
        this.openController = yapi.getInst(openController);
        this.syncModel = yapi.getInst(syncModel);
        this.tokenModel = yapi.getInst(tokenModel)
        this.projectModel = yapi.getInst(projectModel);
        this.init()
    }

    //初始化定時任務
    async init() {
        let allSyncJob = await this.syncModel.listAll();
        for (let i = 0, len = allSyncJob.length; i < len; i++) {
            let syncItem = allSyncJob[i];
            if (syncItem.is_sync_open) {
                this.addSyncJob(syncItem.project_id, syncItem.sync_cron, syncItem.sync_json_url, syncItem.sync_mode, syncItem.uid);
            }
        }
    }

    /**
     * 新增同步任務.
     * @param {*} projectId 專案id
     * @param {*} cronExpression cron表達式,針對定時任務
     * @param {*} swaggerUrl 獲取swagger的地址
     * @param {*} syncMode 同步模式
     * @param {*} uid 使用者id
     */
    async addSyncJob(projectId, cronExpression, swaggerUrl, syncMode, uid) {
        if(!swaggerUrl)return;
        let projectToken = await this.getProjectToken(projectId, uid);
        //立即執行一次
        this.syncInterface(projectId, swaggerUrl, syncMode, uid, projectToken);
        let scheduleItem = schedule.scheduleJob(cronExpression, async () => {
            this.syncInterface(projectId, swaggerUrl, syncMode, uid, projectToken);
        });

        //判斷是否已經存在這個任務
        let jobItem = jobMap.get(projectId);
        if (jobItem) {
            jobItem.cancel();
        }
        jobMap.set(projectId, scheduleItem);
    }

    //同步介面
    async syncInterface(projectId, swaggerUrl, syncMode, uid, projectToken) {
        yapi.commons.log('定時器觸發, syncJsonUrl:' + swaggerUrl + ",合併模式:" + syncMode);
        let oldPorjectData;
        try {
            oldPorjectData = await this.projectModel.get(projectId);
        } catch(e) {
            yapi.commons.log('獲取專案:' + projectId + '失敗');
            this.deleteSyncJob(projectId);
            //刪除數據庫定時任務
            await this.syncModel.delByProjectId(projectId);
            return;
        }
        //如果專案已經刪除了
        if (!oldPorjectData) {
            yapi.commons.log('專案:' + projectId + '不存在');
            this.deleteSyncJob(projectId);
            //刪除數據庫定時任務
            await this.syncModel.delByProjectId(projectId);
            return;
        }
        let newSwaggerJsonData;
        try {
            newSwaggerJsonData = await this.getSwaggerContent(swaggerUrl)
            if (!newSwaggerJsonData || typeof newSwaggerJsonData !== 'object') {
                yapi.commons.log('數據格式出錯，請檢查')
                this.saveSyncLog(0, syncMode, "數據格式出錯，請檢查", uid, projectId);
            }
            newSwaggerJsonData = JSON.stringify(newSwaggerJsonData)
        } catch (e) {
            this.saveSyncLog(0, syncMode, "獲取數據失敗，請檢查", uid, projectId);
            yapi.commons.log('獲取數據失敗' + e.message)
        }

        let oldSyncJob = await this.syncModel.getByProjectId(projectId);

        //更新之前判斷本次swagger json數據是否跟上次的相同,相同則不更新
        if (newSwaggerJsonData && oldSyncJob.old_swagger_content && oldSyncJob.old_swagger_content == md5(newSwaggerJsonData)) {
            //記錄日誌
            this.saveSyncLog(0, syncMode, "介面無更新", uid, projectId);
            oldSyncJob.last_sync_time = yapi.commons.time();
            await this.syncModel.upById(projectId, oldSyncJob);
            return;
        }

        let _params = {
            type: 'swagger',
            json: newSwaggerJsonData,
            project_id: projectId,
            merge: syncMode,
            token: projectToken
        }
        let requestObj = {
            params: _params
        };
        await this.openController.importData(requestObj);

        //同步成功就更新同步表的數據
        if (requestObj.body.errcode == 0) {
            //修改sync_model的屬性
            oldSyncJob.last_sync_time = yapi.commons.time();
            oldSyncJob.old_swagger_content = md5(newSwaggerJsonData);
            await this.syncModel.upById(oldSyncJob._id, oldSyncJob);
        }
        //記錄日誌
        this.saveSyncLog(requestObj.body.errcode, syncMode, requestObj.body.errmsg, uid, projectId);
    }

    getSyncJob(projectId) {
        return jobMap.get(projectId);
    }

    deleteSyncJob(projectId) {
        let jobItem = jobMap.get(projectId);
        if (jobItem) {
            jobItem.cancel();
        }
    }

    /**
     * 記錄同步日誌
     * @param {*} errcode 
     * @param {*} syncMode 
     * @param {*} moremsg 
     * @param {*} uid 
     * @param {*} projectId 
     */
    saveSyncLog(errcode, syncMode, moremsg, uid, projectId) {
        yapi.commons.saveLog({
            content: '自動同步介面狀態:' + (errcode == 0 ? '成功,' : '失敗,') + "合併模式:" + this.getSyncModeName(syncMode) + ",更多資訊:" + moremsg,
            type: 'project',
            uid: uid,
            username: "自動同步使用者",
            typeid: projectId
        });
    }

    /**
     * 獲取專案token,因為匯入介面需要鑒權.
     * @param {*} project_id 專案id
     * @param {*} uid 使用者id
     */
    async getProjectToken(project_id, uid) {
        try {
            let data = await this.tokenModel.get(project_id);
            let token;
            if (!data) {
                let passsalt = yapi.commons.randStr();
                token = sha('sha1')
                    .update(passsalt)
                    .digest('hex')
                    .substr(0, 20);

                await this.tokenModel.save({ project_id, token });
            } else {
                token = data.token;
            }

            token = getToken(token, uid);

            return token;
        } catch (err) {
            return "";
        }
    }

    getUid(uid) {
        return parseInt(uid, 10);
    }

    /**
     * 轉換合併模式的值為中文.
     * @param {*} syncMode 合併模式
     */
    getSyncModeName(syncMode) {
        if (syncMode == 'good') {
            return '智慧合併';
        } else if (syncMode == 'normal') {
            return '普通模式';
        } else if (syncMode == 'merge') {
            return '完全覆蓋';
        }
        return '';
    }

    async getSwaggerContent(swaggerUrl) {
        const axios = require('axios')
        try {
            let response = await axios.get(swaggerUrl);
            if (response.status > 400) {
                throw new Error(`http status "${response.status}"` + '獲取數據失敗，請確認 swaggerUrl 是否正確')
            }
            return response.data;
        } catch (e) {
            let response = e.response || {status: e.message || 'error'};
            throw new Error(`http status "${response.status}"` + '獲取數據失敗，請確認 swaggerUrl 是否正確')
        }
    }

}

module.exports = syncUtils;