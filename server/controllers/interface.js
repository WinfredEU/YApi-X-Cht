const interfaceModel = require('../models/interface.js');
const interfaceCatModel = require('../models/interfaceCat.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const followModel = require('../models/follow.js');
const groupModel = require('../models/group.js');
const _ = require('underscore');
const url = require('url');
const baseController = require('./base.js');
const yapi = require('../yapi.js');
const userModel = require('../models/user.js');
const projectModel = require('../models/project.js');
const jsondiffpatch = require('jsondiffpatch');
const formattersHtml = jsondiffpatch.formatters.html;
const showDiffMsg = require('../../common/diff-view.js');
const mergeJsonSchema = require('../../common/mergeJsonSchema');
const fs = require('fs-extra');
const path = require('path');

// const annotatedCss = require("jsondiffpatch/public/formatters-styles/annotated.css");
// const htmlCss = require("jsondiffpatch/public/formatters-styles/html.css");


function handleHeaders(values){
  let isfile = false,
  isHaveContentType = false;
  if (values.req_body_type === 'form') {
    values.req_body_form.forEach(item => {
      if (item.type === 'file') {
        isfile = true;
      }
    });

    values.req_headers.map(item => {
      if (item.name === 'Content-Type') {
        item.value = isfile ? 'multipart/form-data' : 'application/x-www-form-urlencoded';
        isHaveContentType = true;
      }
    });
    if (isHaveContentType === false) {
      values.req_headers.unshift({
        name: 'Content-Type',
        value: isfile ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
      });
    }
  } else if (values.req_body_type === 'json') {
    values.req_headers
      ? values.req_headers.map(item => {
          if (item.name === 'Content-Type') {
            item.value = 'application/json';
            isHaveContentType = true;
          }
        })
      : [];
    if (isHaveContentType === false) {
      values.req_headers = values.req_headers || [];
      values.req_headers.unshift({
        name: 'Content-Type',
        value: 'application/json'
      });
    }
  }
}


class interfaceController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(interfaceModel);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.projectModel = yapi.getInst(projectModel);
    this.caseModel = yapi.getInst(interfaceCaseModel);
    this.followModel = yapi.getInst(followModel);
    this.userModel = yapi.getInst(userModel);
    this.groupModel = yapi.getInst(groupModel);

    const minLengthStringField = {
      type: 'string',
      minLength: 1
    };

    const addAndUpCommonField = {
      desc: 'string',
      status: 'string',
      req_query: [
        {
          name: 'string',
          value: 'string',
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_headers: [
        {
          name: 'string',
          value: 'string',
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_body_type: 'string',
      req_params: [
        {
          name: 'string',
          example: 'string',
          desc: 'string'
        }
      ],
      req_body_form: [
        {
          name: 'string',
          type: {
            type: 'string'
          },
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_body_other: 'string',
      res_body_type: 'string',
      res_body: 'string',
      custom_field_value: 'string',
      api_opened: 'boolean',
      req_body_is_json_schema: 'string',
      res_body_is_json_schema: 'string',
      markdown: 'string',
      tag: 'array'
    };

    this.schemaMap = {
      add: Object.assign(
        {
          '*project_id': 'number',
          '*path': minLengthStringField,
          '*title': minLengthStringField,
          '*method': minLengthStringField,
          '*catid': 'number'
        },
        addAndUpCommonField
      ),
      up: Object.assign(
        {
          '*id': 'number',
          project_id: 'number',
          path: minLengthStringField,
          title: minLengthStringField,
          method: minLengthStringField,
          catid: 'number',
          switch_notice: 'boolean',
          message: minLengthStringField
        },
        addAndUpCommonField
      ),
      save: Object.assign(
        {
          project_id: 'number',
          catid: 'number',
          title: minLengthStringField,
          path: minLengthStringField,
          method: minLengthStringField,
          message: minLengthStringField,
          dataSync: 'string'
        },
        addAndUpCommonField
      )
    };
  }

  /**
   * 新增專案分組
   * @interface /interface/add
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 專案id，不能為空
   * @param {String}   title 介面標題，不能為空
   * @param {String}   path 介面請求路徑，不能為空
   * @param {String}   method 請求方式
   * @param {Array}  [req_headers] 請求的header資訊
   * @param {String}  [req_headers[].name] 請求的header資訊名
   * @param {String}  [req_headers[].value] 請求的header資訊值
   * @param {Boolean}  [req_headers[].required] 是否是必須，預設為否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 請求參數方式，有["form", "json", "text", "xml"]四種
   * @param {Array} [req_params] name, desc兩個參數
   * @param {Mixed}  [req_body_form] 請求參數,如果請求方式是form，參數是Array陣列，其他格式請求參數是字串
   * @param {String} [req_body_form[].name] 請求參數名
   * @param {String} [req_body_form[].value] 請求參數值，可填寫產生規則（mock）。如@email，隨機產生一條email
   * @param {String} [req_body_form[].type] 請求參數型別，有["text", "file"]兩種
   * @param {String} [req_body_other]  非form型別的請求參數可儲存到此欄位
   * @param {String}  [res_body_type] 相應資訊的數據格式，有["json", "text", "xml"]三種
   * @param {String} [res_body] 響應資訊，可填寫任意字串，如果res_body_type是json,則會呼叫mock功能
   * @param  {String} [desc] 介面描述
   * @returns {Object}
   * @example ./api/interface/add.json
   */
  async add(ctx) {
    let params = ctx.params;

    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.project_id, 'project', 'edit');

      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 40033, '沒有許可權'));
      }
    }
    params.method = params.method || 'GET';
    params.res_body_is_json_schema = _.isUndefined(params.res_body_is_json_schema)
      ? false
      : params.res_body_is_json_schema;
    params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema)
      ? false
      : params.req_body_is_json_schema;
    params.method = params.method.toUpperCase();
    params.req_params = params.req_params || [];
    params.res_body_type = params.res_body_type ? params.res_body_type.toLowerCase() : 'json';
    let http_path = url.parse(params.path, true);

    if (!yapi.commons.verifyPath(http_path.pathname)) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        400,
        'path第一位必需為 /, 只允許由 字母數字-/_:.! 組成'
      ));
    }

    handleHeaders(params)

    params.query_path = {};
    params.query_path.path = http_path.pathname;
    params.query_path.params = [];
    Object.keys(http_path.query).forEach(item => {
      params.query_path.params.push({
        name: item,
        value: http_path.query[item]
      });
    });

    let checkRepeat = await this.Model.checkRepeat(params.project_id, params.path, params.method);

    if (checkRepeat > 0) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        40022,
        '已存在的介面:' + params.path + '[' + params.method + ']'
      ));
    }

    let data = Object.assign(params, {
      uid: this.getUid(),
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time()
    });

    yapi.commons.handleVarPath(params.path, params.req_params);

    if (params.req_params.length > 0) {
      data.type = 'var';
      data.req_params = params.req_params;
    } else {
      data.type = 'static';
    }

    // 新建介面的人成為專案dev  如果不存在的話
    // 命令列匯入時無法獲知匯入介面人的資訊，其uid 為 999999
    let uid = this.getUid();

    if (this.getRole() !== 'admin' && uid !== 999999) {
      let userdata = await yapi.commons.getUserdata(uid, 'dev');
      // 檢查一下是否有這個人
      let check = await this.projectModel.checkMemberRepeat(params.project_id, uid);
      if (check === 0 && userdata) {
        await this.projectModel.addMember(params.project_id, [userdata]);
      }
    }

    let result = await this.Model.save(data);
    yapi.emitHook('interface_add', result).then();
    this.catModel.get(params.catid).then(cate => {
      let username = this.getUsername();
      let title = `<a href="/user/profile/${this.getUid()}">${username}</a> 為分類 <a href="/project/${
        params.project_id
      }/interface/api/cat_${params.catid}">${cate.name}</a> 新增了介面 <a href="/project/${
        params.project_id
      }/interface/api/${result._id}">${data.title}</a> `;

      yapi.commons.saveLog({
        content: title,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: params.project_id
      });
      this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
    });

    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 儲存介面數據，如果介面存在則更新數據，如果介面不存在則新增數據
   * @interface /interface/save
   * @method  post
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 專案id，不能為空
   * @param {String}   title 介面標題，不能為空
   * @param {String}   path 介面請求路徑，不能為空
   * @param {String}   method 請求方式
   * @param {Array}  [req_headers] 請求的header資訊
   * @param {String}  [req_headers[].name] 請求的header資訊名
   * @param {String}  [req_headers[].value] 請求的header資訊值
   * @param {Boolean}  [req_headers[].required] 是否是必須，預設為否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 請求參數方式，有["form", "json", "text", "xml"]四種
   * @param {Array} [req_params] name, desc兩個參數
   * @param {Mixed}  [req_body_form] 請求參數,如果請求方式是form，參數是Array陣列，其他格式請求參數是字串
   * @param {String} [req_body_form[].name] 請求參數名
   * @param {String} [req_body_form[].value] 請求參數值，可填寫產生規則（mock）。如@email，隨機產生一條email
   * @param {String} [req_body_form[].type] 請求參數型別，有["text", "file"]兩種
   * @param {String} [req_body_other]  非form型別的請求參數可儲存到此欄位
   * @param {String}  [res_body_type] 相應資訊的數據格式，有["json", "text", "xml"]三種
   * @param {String} [res_body] 響應資訊，可填寫任意字串，如果res_body_type是json,則會呼叫mock功能
   * @param  {String} [desc] 介面描述
   * @returns {Object}
   */

  async save(ctx) {
    let params = ctx.params;

    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 40033, '沒有許可權'));
      }
    }
    params.method = params.method || 'GET';
    params.method = params.method.toUpperCase();

    let http_path = url.parse(params.path, true);

    if (!yapi.commons.verifyPath(http_path.pathname)) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        400,
        'path第一位必需為 /, 只允許由 字母數字-/_:.! 組成'
      ));
    }

    let result = await this.Model.getByPath(params.project_id, params.path, params.method, '_id res_body');

    if (result.length > 0) {
      result.forEach(async item => {
        params.id = item._id;
        // console.log(this.schemaMap['up'])
        let validParams = Object.assign({}, params)
        let validResult = yapi.commons.validateParams(this.schemaMap['up'], validParams);
        if (validResult.valid) {
          let data = {};
          data.params = validParams;

          if(params.res_body_is_json_schema && params.dataSync === 'good'){
            try{
              let new_res_body = yapi.commons.json_parse(params.res_body)
              let old_res_body = yapi.commons.json_parse(item.res_body)
              data.params.res_body = JSON.stringify(mergeJsonSchema(old_res_body, new_res_body),null,2);
            }catch(err){}
          }
          await this.up(data);
        } else {
          return (ctx.body = yapi.commons.resReturn(null, 400, validResult.message));
        }
      });
    } else {
      let validResult = yapi.commons.validateParams(this.schemaMap['add'], params);
      if (validResult.valid) {
        let data = {};
        data.params = params;
        await this.add(data);
      } else {
        return (ctx.body = yapi.commons.resReturn(null, 400, validResult.message));
      }
    }
    ctx.body = yapi.commons.resReturn(result);
    // return ctx.body = yapi.commons.resReturn(null, 400, 'path第一位必需為 /, 只允許由 字母數字-/_:.! 組成');
  }

  /**
   * 獲取專案分組
   * @interface /interface/get
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 介面id，不能為空
   * @returns {Object}
   * @example ./api/interface/get.json
   */
  async get(ctx) {
    let params = ctx.params;
    if (!params.id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '介面id不能為空'));
    }

    try {
      let result = await this.Model.get(params.id);
      if(this.$tokenAuth){
        if(params.project_id !== result.project_id){
          ctx.body = yapi.commons.resReturn(null, 400, 'token有誤')
          return;
        }
      }
      // console.log('result', result);
      if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 490, '不存在的'));
      }
      let userinfo = await this.userModel.findById(result.uid);
      let project = await this.projectModel.getBaseInfo(result.project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
        }
      }
      yapi.emitHook('interface_get', result).then();
      result = result.toObject();
      if (userinfo) {
        result.username = userinfo.username;
      }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 介面列表
   * @interface /interface/list
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 專案id，不能為空
   * @param {Number}   page 目前頁
   * @param {Number}   limit 每一頁限制條數
   * @returns {Object}
   * @example ./api/interface/list.json
   */
  async list(ctx) {
    let project_id = ctx.params.project_id;
    let page = ctx.request.query.page || 1,
      limit = ctx.request.query.limit || 10;
    let status = ctx.request.query.status,
      tag = ctx.request.query.tag;
    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 407, '不存在的專案'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
      }
    }
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'));
    }

    try {
      let result, count;
      if (limit === 'all') {
        result = await this.Model.list(project_id);
        count = await this.Model.listCount({project_id});
      } else {
        let option = {project_id};
        if (status) {
          if (Array.isArray(status)) {
            option.status = {"$in": status};
          } else {
            option.status = status;
          }
        }
        if (tag) {
          if (Array.isArray(tag)) {
            option.tag = {"$in": tag};
          } else {
            option.tag = tag;
          }
        }

        result = await this.Model.listByOptionWithPage(option, page, limit);
        count = await this.Model.listCount(option);
      }


      ctx.body = yapi.commons.resReturn({
        count: count,
        total: Math.ceil(count / limit),
        list: result
      });
      yapi.emitHook('interface_list', result).then();
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

  async downloadCrx(ctx) {
    let filename = 'crossRequest.zip';
    let dataBuffer = yapi.fs.readFileSync(
      yapi.path.join(yapi.WEBROOT, 'static/attachment/cross-request.zip')
    );
    ctx.set('Content-disposition', 'attachment; filename=' + filename);
    ctx.set('Content-Type', 'application/zip');
    ctx.body = dataBuffer;
  }

  async listByCat(ctx) {
    let catid = ctx.request.query.catid;
    let page = ctx.request.query.page || 1,
      limit = ctx.request.query.limit || 10;
    let status = ctx.request.query.status,
      tag = ctx.request.query.tag;

    if (!catid) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'catid不能為空'));
    }
    try {
      let catdata = await this.catModel.get(catid);

      let project = await this.projectModel.getBaseInfo(catdata.project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
        }
      }


      let option = {catid}
      if (status) {
        if (Array.isArray(status)) {
          option.status = {"$in": status};
        } else {
          option.status = status;
        }
      }
      if (tag) {
        if (Array.isArray(tag)) {
          option.tag = {"$in": tag};
        } else {
          option.tag = tag;
        }
      }

      let result = await this.Model.listByOptionWithPage(option, page, limit);

      let count = await this.Model.listCount(option);

      ctx.body = yapi.commons.resReturn({
        count: count,
        total: Math.ceil(count / limit),
        list: result
      });
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message + '1');
    }
  }

  async listByMenu(ctx) {
    let project_id = ctx.params.project_id;
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'));
    }

    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 406, '不存在的專案'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
      }
    }

    try {
      let result = await this.catModel.list(project_id),
        newResult = [];
      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        list = await this.Model.listByCatid(item._id);
        for (let j = 0; j < list.length; j++) {
          list[j] = list[j].toObject();
        }

        item.list = list;
        newResult[i] = item;
      }
      ctx.body = yapi.commons.resReturn(newResult);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }

  /**
   * 編輯介面
   * @interface /interface/up
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 介面id，不能為空
   * @param {String}   [path] 介面請求路徑
   * @param {String}   [method] 請求方式
   * @param {Array}  [req_headers] 請求的header資訊
   * @param {String}  [req_headers[].name] 請求的header資訊名
   * @param {String}  [req_headers[].value] 請求的header資訊值
   * @param {Boolean}  [req_headers[].required] 是否是必須，預設為否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 請求參數方式，有["form", "json", "text", "xml"]四種
   * @param {Mixed}  [req_body_form] 請求參數,如果請求方式是form，參數是Array陣列，其他格式請求參數是字串
   * @param {String} [req_body_form[].name] 請求參數名
   * @param {String} [req_body_form[].value] 請求參數值，可填寫產生規則（mock）。如@email，隨機產生一條email
   * @param {String} [req_body_form[].type] 請求參數型別，有["text", "file"]兩種
   * @param {String} [req_body_other]  非form型別的請求參數可儲存到此欄位
   * @param {String}  [res_body_type] 相應資訊的數據格式，有["json", "text", "xml"]三種
   * @param {String} [res_body] 響應資訊，可填寫任意字串，如果res_body_type是json,則會呼叫mock功能
   * @param  {String} [desc] 介面描述
   * @returns {Object}
   * @example ./api/interface/up.json
   */

  async up(ctx) {
    let params = ctx.params;

    if (!_.isUndefined(params.method)) {
      params.method = params.method || 'GET';
      params.method = params.method.toUpperCase();
    }

    let id = params.id;
    params.message = params.message || '';
    params.message = params.message.replace(/\n/g, '<br>');
    // params.res_body_is_json_schema = _.isUndefined (params.res_body_is_json_schema) ? true : params.res_body_is_json_schema;
    // params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema) ?  true : params.req_body_is_json_schema;

    handleHeaders(params)

    let interfaceData = await this.Model.get(id);
    if (!interfaceData) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '不存在的介面'));
    }
    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(interfaceData.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '沒有許可權'));
      }
    }

    let data = Object.assign(
      {
        up_time: yapi.commons.time()
      },
      params
    );

    if (params.path) {
      let http_path;
      http_path = url.parse(params.path, true);

      if (!yapi.commons.verifyPath(http_path.pathname)) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          400,
          'path第一位必需為 /, 只允許由 字母數字-/_:.! 組成'
        ));
      }
      params.query_path = {};
      params.query_path.path = http_path.pathname;
      params.query_path.params = [];
      Object.keys(http_path.query).forEach(item => {
        params.query_path.params.push({
          name: item,
          value: http_path.query[item]
        });
      });
      data.query_path = params.query_path;
    }

    if (
      params.path &&
      (params.path !== interfaceData.path || params.method !== interfaceData.method)
    ) {
      let checkRepeat = await this.Model.checkRepeat(
        interfaceData.project_id,
        params.path,
        params.method
      );
      if (checkRepeat > 0) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          401,
          '已存在的介面:' + params.path + '[' + params.method + ']'
        ));
      }
    }

    if (!_.isUndefined(data.req_params)) {
      if (Array.isArray(data.req_params) && data.req_params.length > 0) {
        data.type = 'var';
      } else {
        data.type = 'static';
        data.req_params = [];
      }
    }
    let result = await this.Model.up(id, data);
    let username = this.getUsername();
    let CurrentInterfaceData = await this.Model.get(id);
    let logData = {
      interface_id: id,
      cat_id: data.catid,
      current: CurrentInterfaceData.toObject(),
      old: interfaceData.toObject()
    };

    this.catModel.get(interfaceData.catid).then(cate => {
      let diffView2 = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      if (diffView2.length <= 0) {
          return; // 沒有變化時，不寫日誌
      }
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 
                    更新了分類 <a href="/project/${cate.project_id}/interface/api/cat_${
          data.catid
        }">${cate.name}</a> 
                    下的介面 <a href="/project/${cate.project_id}/interface/api/${id}">${
          interfaceData.title
        }</a><p>${params.message}</p>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: cate.project_id,
        data: logData
      });
    });

    this.projectModel.up(interfaceData.project_id, { up_time: new Date().getTime() }).then();
    if (params.switch_notice === true) {
      let diffView = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      let annotatedCss = fs.readFileSync(
        path.resolve(
          yapi.WEBROOT,
          'node_modules/jsondiffpatch/dist/formatters-styles/annotated.css'
        ),
        'utf8'
      );
      let htmlCss = fs.readFileSync(
        path.resolve(yapi.WEBROOT, 'node_modules/jsondiffpatch/dist/formatters-styles/html.css'),
        'utf8'
      );

      let project = await this.projectModel.getBaseInfo(interfaceData.project_id);

      let interfaceUrl = `${ctx.request.origin}/project/${
        interfaceData.project_id
      }/interface/api/${id}`;

      yapi.commons.sendNotice(interfaceData.project_id, {
        title: `${username} 更新了介面`,
        content: `<html>
        <head>
        <style>
        ${annotatedCss}
        ${htmlCss}
        </style>
        </head>
        <body>
        <div><h3>${username}更新了介面(${data.title})</h3>
        <p>專案名：${project.name} </p>
        <p>修改使用者: ${username}</p>
        <p>介面名: <a href="${interfaceUrl}">${data.title}</a></p>
        <p>介面路徑: [${data.method}]${data.path}</p>
        <p>詳細改動日誌: ${this.diffHTML(diffView)}</p></div>
        </body>
        </html>`
      });
    }

    yapi.emitHook('interface_update', id).then();
    ctx.body = yapi.commons.resReturn(result);
    return 1;
  }

  diffHTML(html) {
    if (html.length === 0) {
      return `<span style="color: #555">沒有改動，該操作未改動Api數據</span>`;
    }

    return html.map(item => {
      return `<div>
      <h4 class="title">${item.title}</h4>
      <div>${item.content}</div>
    </div>`;
    });
  }

  /**
   * 刪除介面
   * @interface /interface/del
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 介面id，不能為空
   * @returns {Object}
   * @example ./api/interface/del.json
   */

  async del(ctx) {
    try {
      let id = ctx.request.body.id;

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '介面id不能為空'));
      }

      let data = await this.Model.get(id);

      if (data.uid != this.getUid()) {
        let auth = await this.checkAuth(data.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '沒有許可權'));
        }
      }

      // let inter = await this.Model.get(id);
      let result = await this.Model.del(id);
      yapi.emitHook('interface_del', id).then();
      await this.caseModel.delByInterfaceId(id);
      let username = this.getUsername();
      this.catModel.get(data.catid).then(cate => {
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 刪除了分類 <a href="/project/${
            cate.project_id
          }/interface/api/cat_${data.catid}">${cate.name}</a> 下的介面 "${data.title}"`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: cate.project_id
        });
      });
      this.projectModel.up(data.project_id, { up_time: new Date().getTime() }).then();
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
  // 處理編輯衝突
  async solveConflict(ctx) {
    try {
      let id = parseInt(ctx.query.id, 10),
        result,
        userInst,
        userinfo,
        data;
      if (!id) {
        return ctx.websocket.send('id 參數有誤');
      }
      result = await this.Model.get(id);

      if (result.edit_uid !== 0 && result.edit_uid !== this.getUid()) {
        userInst = yapi.getInst(userModel);
        userinfo = await userInst.findById(result.edit_uid);
        data = {
          errno: result.edit_uid,
          data: { uid: result.edit_uid, username: userinfo.username }
        };
      } else {
        this.Model.upEditUid(id, this.getUid()).then();
        data = {
          errno: 0,
          data: result
        };
      }
      ctx.websocket.send(JSON.stringify(data));
      ctx.websocket.on('close', () => {
        this.Model.upEditUid(id, 0).then();
      });
    } catch (err) {
      yapi.commons.log(err, 'error');
    }
  }

  async addCat(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        name: 'string',
        project_id: 'number',
        desc: 'string'
      });

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'));
      }
      if (!this.$tokenAuth) {
        let auth = await this.checkAuth(params.project_id, 'project', 'edit');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '沒有許可權'));
        }
      }

      if (!params.name) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '名稱不能為空'));
      }

      let result = await this.catModel.save({
        name: params.name,
        project_id: params.project_id,
        desc: params.desc,
        uid: this.getUid(),
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time()
      });

      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 新增了分類  <a href="/project/${
          params.project_id
        }/interface/api/cat_${result._id}">${params.name}</a>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: params.project_id
      });

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async upCat(ctx) {
    try {
      let params = ctx.request.body;

      let username = this.getUsername();
      let cate = await this.catModel.get(params.catid);

      let auth = await this.checkAuth(cate.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '沒有許可權'));
      }

      let result = await this.catModel.up(params.catid, {
        name: params.name,
        desc: params.desc,
        up_time: yapi.commons.time()
      });

      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了分類 <a href="/project/${
          cate.project_id
        }/interface/api/cat_${params.catid}">${cate.name}</a>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: cate.project_id
      });

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }

  async delCat(ctx) {
    try {
      let id = ctx.request.body.catid;
      let catData = await this.catModel.get(id);
      if (!catData) {
        ctx.body = yapi.commons.resReturn(null, 400, '不存在的分類');
      }

      if (catData.uid !== this.getUid()) {
        let auth = await this.checkAuth(catData.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '沒有許可權'));
        }
      }

      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 刪除了分類 "${
          catData.name
        }" 及該分類下的介面`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: catData.project_id
      });

      let interfaceData = await this.Model.listByCatid(id);

      interfaceData.forEach(async item => {
        try {
          yapi.emitHook('interface_del', item._id).then();
          await this.caseModel.delByInterfaceId(item._id);
        } catch (e) {
          yapi.commons.log(e.message, 'error');
        }
      });
      await this.catModel.del(id);
      let r = await this.Model.delByCatid(id);
      return (ctx.body = yapi.commons.resReturn(r));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   * 獲取分類列表
   * @interface /interface/getCatMenu
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 專案id，不能為空
   * @returns {Object}
   * @example ./api/interface/getCatMenu
   */

  async getCatMenu(ctx) {
    let project_id = ctx.params.project_id;

    if (!project_id || isNaN(project_id)) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'));
    }

    try {
      let project = await this.projectModel.getBaseInfo(project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'edit')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
        }
      }
      let res = await this.catModel.list(project_id);
      return (ctx.body = yapi.commons.resReturn(res));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   * 獲取自定義介面欄位數據
   * @interface /interface/get_custom_field
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {String}   app_code = '111'
   * @returns {Object}
   *
   */
  async getCustomField(ctx) {
    let params = ctx.request.query;

    if (Object.keys(params).length !== 1) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '參數數量錯誤'));
    }
    let customFieldName = Object.keys(params)[0];
    let customFieldValue = params[customFieldName];

    try {
      //  查詢有customFieldName的分組（group）
      let groups = await this.groupModel.getcustomFieldName(customFieldName);
      if (groups.length === 0) {
        return (ctx.body = yapi.commons.resReturn(null, 404, '沒有找到對應自定義介面'));
      }

      // 在每個分組（group）下查詢對應project的id值
      let interfaces = [];
      for (let i = 0; i < groups.length; i++) {
        let projects = await this.projectModel.list(groups[i]._id);

        // 在每個專案（project）中查詢interface下的custom_field_value
        for (let j = 0; j < projects.length; j++) {
          let data = {};
          let inter = await this.Model.getcustomFieldValue(projects[j]._id, customFieldValue);
          if (inter.length > 0) {
            data.project_name = projects[j].name;
            data.project_id = projects[j]._id;
            inter = inter.map((item, i) => {
              item = inter[i] = inter[i].toObject();
              item.res_body = yapi.commons.json_parse(item.res_body);
              item.req_body_other = yapi.commons.json_parse(item.req_body_other);

              return item;
            });

            data.list = inter;
            interfaces.push(data);
          }
        }
      }
      return (ctx.body = yapi.commons.resReturn(interfaces));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  requiredSort(params) {
    return params.sort((item1, item2) => {
      return item2.required - item1.required;
    });
  }

  /**
   * 更新多個介面case index
   * @interface /interface/up_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '請求參數必須是陣列');
      }
      params.forEach(item => {
        if (item.id) {
          this.Model.upIndex(item.id, item.index).then(
            res => {},
            err => {
              yapi.commons.log(err.message, 'error');
            }
          );
        }
      });

      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   * 更新多個介面cat index
   * @interface /interface/up_cat_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upCatIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '請求參數必須是陣列');
      }
      params.forEach(item => {
        if (item.id) {
          this.catModel.upCatIndex(item.id, item.index).then(
            res => {},
            err => {
              yapi.commons.log(err.message, 'error');
            }
          );
        }
      });

      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }

  async schema2json(ctx) {
    let schema = ctx.request.body.schema;
    let required = ctx.request.body.required;

    let res = yapi.commons.schemaToJson(schema, {
      alwaysFakeOptionals: _.isUndefined(required) ? true : require
    });
    // console.log('res',res)
    return (ctx.body = res);
  }

  // 獲取開放介面數據
  async listByOpen(ctx) {
    let project_id = ctx.request.query.project_id;

    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '專案id不能為空'));
    }

    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 406, '不存在的專案'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '沒有許可權'));
      }
    }

    let basepath = project.basepath;
    try {
      let result = await this.catModel.list(project_id),
        newResult = [];

      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        list = await this.Model.listByInterStatus(item._id, 'open');
        for (let j = 0; j < list.length; j++) {
          list[j] = list[j].toObject();
          list[j].basepath = basepath;
        }

        newResult = [].concat(newResult, list);
      }

      ctx.body = yapi.commons.resReturn(newResult);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
}

module.exports = interfaceController;
