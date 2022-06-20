const groupModel = require('../models/group.js');
const yapi = require('../yapi.js');
const baseController = require('./base.js');
const projectModel = require('../models/project.js');
const userModel = require('../models/user.js');
const interfaceModel = require('../models/interface.js');
const interfaceColModel = require('../models/interfaceCol.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const _ = require('underscore')

const rolename = {
  owner: '組長',
  dev: '開發者',
  guest: '訪客'
};

class groupController extends baseController {
  constructor(ctx) {
    super(ctx);

    const id = 'number';
    const group_name = {
      type: 'string',
      minLength: 1
    };

    const group_desc = 'string';
    const role = {
      type: 'string',
      enum: ['owner', 'dev', 'guest']
    };

    const member_uids = {
      type: 'array',
      items: 'number',
      minItems: 1
    };

    this.schemaMap = {
      get: {
        '*id': id
      },
      add: {
        '*group_name': group_name,
        group_desc: group_desc,
        owner_uids: ['number']
      },
      addMember: {
        '*id': id,
        role: role,
        '*member_uids': member_uids
      },
      changeMemberRole: {
        '*member_uid': 'number',
        '*id': id,
        role: role
      },
      getMemberList: {
        '*id': id
      },
      delMember: {
        '*id': id,
        '*member_uid': 'number'
      },
      del: {
        '*id': id
      },
      up: {
        '*id': id,
        '*group_name': group_name,
        group_desc: group_desc,
        custom_field1: {
          name: 'string',
          enable: 'boolen'
        },
        custom_field2: {
          name: 'string',
          enable: 'boolen'
        },
        custom_field3: {
          name: 'string',
          enable: 'boolen'
        }
      }
    };
  }

  /**
   * 查詢專案分組
   * @interface /group/get
   * @method GET
   * @category group
   * @foldnumber 10
   * @param {String} id 專案分組ID
   * @returns {Object}
   * @example
   */
  async get(ctx) {
    let params = ctx.params;

    let groupInst = yapi.getInst(groupModel);
    let result = await groupInst.getGroupById(params.id);
    if (result) {
      result = result.toObject();
      let role = await this.getProjectRole(params.id, 'group');
      result.role = role;
      if (result.type === 'private') {
        result.group_name = '個人空間';
      }
      ctx.body = yapi.commons.resReturn(result);
    }
  }

  /**
   * 新增專案分組
   * @interface /group/add
   * @method POST
   * @category group
   * @foldnumber 10
   * @param {String} group_name 專案分組名稱，不能為空
   * @param {String} [group_desc] 專案分組描述
   * @param {String} [owner_uids]  組長[uid]
   * @returns {Object}
   * @example ./api/group/add.json
   */
  async add(ctx) {
    let params = ctx.params;

    // 新版每個人都有許可權新增分組
    
    // if (this.getRole() !== 'admin') {
    //   return (ctx.body = yapi.commons.resReturn(null, 401, '沒有許可權'));
    // }

    let owners = [];

    if(params.owner_uids.length === 0){
      params.owner_uids.push(
        this.getUid()
      )
    }

    if (params.owner_uids) {
      for (let i = 0, len = params.owner_uids.length; i < len; i++) {
        let id = params.owner_uids[i];
        let groupUserdata = await this.getUserdata(id, 'owner');
        if (groupUserdata) {
          owners.push(groupUserdata);
        }
      }
    }

    let groupInst = yapi.getInst(groupModel);

    let checkRepeat = await groupInst.checkRepeat(params.group_name);

    if (checkRepeat > 0) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '專案分組名已存在'));
    }

    let data = {
      group_name: params.group_name,
      group_desc: params.group_desc,
      uid: this.getUid(),
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time(),
      members: owners
    };

    let result = await groupInst.save(data);
    result = yapi.commons.fieldSelect(result, [
      '_id',
      'group_name',
      'group_desc',
      'uid',
      'members',
      'type'
    ]);
    let username = this.getUsername();
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 新增了分組 <a href="/group/${
        result._id
      }">${params.group_name}</a>`,
      type: 'group',
      uid: this.getUid(),
      username: username,
      typeid: result._id
    });
    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 獲取用戶數據
   * @param uid
   * @param role
   * @returns {Promise.<*>}
   */

  async getUserdata(uid, role) {
    role = role || 'dev';
    let userInst = yapi.getInst(userModel);
    let userData = await userInst.findById(uid);
    if (!userData) {
      return null;
    }
    return {
      _role: userData.role,
      role: role,
      uid: userData._id,
      username: userData.username,
      email: userData.email
    };
  }

  async getMyGroup(ctx){
    var groupInst = yapi.getInst(groupModel);
    let privateGroup = await groupInst.getByPrivateUid(this.getUid());
    if (!privateGroup) {
      privateGroup = await groupInst.save({
        uid: this.getUid(),
        group_name: 'User-' + this.getUid(),
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time(),
        type: 'private'
      });
    }
    if(privateGroup){
      ctx.body = yapi.commons.resReturn(privateGroup)
    }else{
      ctx.body = yapi.commons.resReturn(null)
    }
  }

  /**
   * 新增專案分組成員
   * @interface /group/add_member
   * @method POST
   * @category group
   * @foldnumber 10
   * @param {String} id 專案分組id
   * @param {String} member_uids 專案分組成員[uid]
   * @param {String} role 成員角色，owner or dev or guest
   * @returns {Object}
   * @example
   */
  async addMember(ctx) {
    let params = ctx.params;
    let groupInst = yapi.getInst(groupModel);

    params.role = ['owner', 'dev', 'guest'].find(v => v === params.role) || 'dev';
    let add_members = [];
    let exist_members = [];
    let no_members = [];
    for (let i = 0, len = params.member_uids.length; i < len; i++) {
      let id = params.member_uids[i];
      let check = await groupInst.checkMemberRepeat(params.id, id);
      let userdata = await this.getUserdata(id, params.role);
      if (check > 0) {
        exist_members.push(userdata);
      } else if (!userdata) {
        no_members.push(id);
      } else {
        userdata.role !== 'admin' && add_members.push(userdata);
        delete userdata._role;
      }
    }

    let result = await groupInst.addMember(params.id, add_members);
    let username = this.getUsername();
    if (add_members.length) {
      let members = add_members.map(item => {
        return `<a href = "/user/profile/${item.uid}">${item.username}</a>`;
      });
      members = members.join('、');
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 新增了分組成員 ${members} 為 ${
          rolename[params.role]
        }`,
        type: 'group',
        uid: this.getUid(),
        username: username,
        typeid: params.id
      });
    }
    ctx.body = yapi.commons.resReturn({
      result,
      add_members,
      exist_members,
      no_members
    });
  }

  /**
   * 修改專案分組成員角色
   * @interface /group/change_member_role
   * @method POST
   * @category group
   * @foldnumber 10
   * @param {String} id 專案分組id
   * @param {String} member_uid 專案分組成員uid
   * @param {String} role 許可權 ['owner'|'dev']
   * @returns {Object}
   * @example
   */
  async changeMemberRole(ctx) {
    let params = ctx.request.body;
    let groupInst = yapi.getInst(groupModel);

    var check = await groupInst.checkMemberRepeat(params.id, params.member_uid);
    if (check === 0) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '分組成員不存在'));
    }
    if ((await this.checkAuth(params.id, 'group', 'danger')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '沒有許可權'));
    }

    params.role = ['owner', 'dev', 'guest'].find(v => v === params.role) || 'dev';

    let result = await groupInst.changeMemberRole(params.id, params.member_uid, params.role);
    let username = this.getUsername();

    let groupUserdata = await this.getUserdata(params.member_uid, params.role);
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更改了分組成員 <a href="/user/profile/${
        params.member_uid
      }">${groupUserdata ? groupUserdata.username : ''}</a> 的許可權為 "${rolename[params.role]}"`,
      type: 'group',
      uid: this.getUid(),
      username: username,
      typeid: params.id
    });
    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 獲取所有專案成員
   * @interface /group/get_member_list
   * @method GET
   * @category group
   * @foldnumber 10
   * @param {String} id 專案分組id
   * @returns {Object}
   * @example
   */

  async getMemberList(ctx) {
    let params = ctx.params;
    let groupInst = yapi.getInst(groupModel);
    let group = await groupInst.get(params.id);
    ctx.body = yapi.commons.resReturn(group.members);
  }

  /**
   * 刪除專案成員
   * @interface /group/del_member
   * @method POST
   * @category group
   * @foldnumber 10
   * @param {String} id 專案分組id
   * @param {String} member_uid 專案分組成員uid
   * @returns {Object}
   * @example
   */

  async delMember(ctx) {
    let params = ctx.params;
    let groupInst = yapi.getInst(groupModel);
    var check = await groupInst.checkMemberRepeat(params.id, params.member_uid);
    if (check === 0) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '分組成員不存在'));
    }
    if ((await this.checkAuth(params.id, 'group', 'danger')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '沒有許可權'));
    }

    let result = await groupInst.delMember(params.id, params.member_uid);
    let username = this.getUsername();

    let groupUserdata = await this.getUserdata(params.member_uid, params.role);
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 刪除了分組成員 <a href="/user/profile/${
        params.member_uid
      }">${groupUserdata ? groupUserdata.username : ''}</a>`,
      type: 'group',
      uid: this.getUid(),
      username: username,
      typeid: params.id
    });
    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 獲取專案分組列表
   * @interface /group/list
   * @method get
   * @category group
   * @foldnumber 10
   * @returns {Object}
   * @example ./api/group/list.json
   */
  async list(ctx) {
    var groupInst = yapi.getInst(groupModel);
    let projectInst = yapi.getInst(projectModel);

    let privateGroup = await groupInst.getByPrivateUid(this.getUid());
    let newResult = [];

    if (!privateGroup) {
      privateGroup = await groupInst.save({
        uid: this.getUid(),
        group_name: 'User-' + this.getUid(),
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time(),
        type: 'private'
      });
    }

    if(this.getRole() === 'admin'){
      let result = await groupInst.list();
      if(result && result.length > 0 ){
        for (let i = 0; i < result.length; i++){
          result[i] = result[i].toObject();
          newResult.unshift(result[i])
        }
      }
    }else{
      let result = await groupInst.getAuthList(this.getUid());
      if(result && result.length > 0 ){
        for (let i = 0; i < result.length; i++){
          result[i] = result[i].toObject();
          newResult.unshift(result[i])
        }
      }

      const groupIds = newResult.map(item=> item._id);
      const newGroupIds = [];

      let groupByProject = await projectInst.getAuthList(this.getUid());
      if(groupByProject && groupByProject.length > 0){
        groupByProject.forEach( _data=>{
          const _temp = [...groupIds, ...newGroupIds];
          if(!_.find(_temp, id=> id === _data.group_id)){
            newGroupIds.push(_data.group_id)
          }
        })
      }
      let newData = await groupInst.findByGroups(newGroupIds)
      newData.forEach(_data=>{
        _data = _data.toObject();
        newResult.push(_data);
      })
    }
    if (privateGroup) {
      privateGroup = privateGroup.toObject();
      privateGroup.group_name = '個人空間';
      privateGroup.role = 'owner';
      newResult.unshift(privateGroup);
    }

    ctx.body = yapi.commons.resReturn(newResult);
  }

  /**
   * 刪除專案分組
   * @interface /group/del
   * @method post
   * @param {String} id 專案分組id
   * @category group
   * @foldnumber 10
   * @returns {Object}
   * @example ./api/group/del.json
   */
  async del(ctx) {
    if (this.getRole() !== 'admin') {
      return (ctx.body = yapi.commons.resReturn(null, 401, '沒有許可權'));
    }

    let groupInst = yapi.getInst(groupModel);
    let projectInst = yapi.getInst(projectModel);
    let interfaceInst = yapi.getInst(interfaceModel);
    let interfaceColInst = yapi.getInst(interfaceColModel);
    let interfaceCaseInst = yapi.getInst(interfaceCaseModel);
    let id = ctx.params.id;

    let projectList = await projectInst.list(id, true);
    projectList.forEach(async p => {
      await interfaceInst.delByProjectId(p._id);
      await interfaceCaseInst.delByProjectId(p._id);
      await interfaceColInst.delByProjectId(p._id);
    });
    if (projectList.length > 0) {
      await projectInst.delByGroupid(id);
    }

    let result = await groupInst.del(id);
    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 更新專案分組
   * @interface /group/up
   * @method post
   * @param {String} id 專案分組id
   * @param {String} group_name 專案分組名稱
   * @param {String} group_desc 專案分組描述
   * @category group
   * @foldnumber 10
   * @returns {Object}
   * @example ./api/group/up.json
   */
  async up(ctx) {
    let groupInst = yapi.getInst(groupModel);
    let params = ctx.params;

    if ((await this.checkAuth(params.id, 'group', 'danger')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '沒有許可權'));
    }

    let result = await groupInst.up(params.id, params);
    let username = this.getUsername();
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了 <a href="/group/${
        params.id
      }">${params.group_name}</a> 分組`,
      type: 'group',
      uid: this.getUid(),
      username: username,
      typeid: params.id
    });
    ctx.body = yapi.commons.resReturn(result);
  }
}

module.exports = groupController;
