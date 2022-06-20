import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Select, Button, Modal, Row, Col, message, Popconfirm } from 'antd';
import { Link } from 'react-router-dom';
import './MemberList.scss';
import { autobind } from 'core-decorators';
import {
  fetchGroupMemberList,
  fetchGroupMsg,
  addMember,
  delMember,
  changeMemberRole
} from '../../../reducer/modules/group.js';
import ErrMsg from '../../../components/ErrMsg/ErrMsg.js';
import UsernameAutoComplete from '../../../components/UsernameAutoComplete/UsernameAutoComplete.js';
const Option = Select.Option;

function arrayAddKey(arr) {
  return arr.map((item, index) => {
    return {
      ...item,
      key: index
    };
  });
}

@connect(
  state => {
    return {
      currGroup: state.group.currGroup,
      uid: state.user.uid,
      role: state.group.role
    };
  },
  {
    fetchGroupMemberList,
    fetchGroupMsg,
    addMember,
    delMember,
    changeMemberRole
  }
)
class MemberList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: [],
      role: '',
      visible: false,
      dataSource: [],
      inputUids: [],
      inputRole: 'dev'
    };
  }
  static propTypes = {
    currGroup: PropTypes.object,
    uid: PropTypes.number,
    fetchGroupMemberList: PropTypes.func,
    fetchGroupMsg: PropTypes.func,
    addMember: PropTypes.func,
    delMember: PropTypes.func,
    changeMemberRole: PropTypes.func,
    role: PropTypes.string
  };

  showAddMemberModal = () => {
    this.setState({
      visible: true
    });
  };

  // 重新獲取列表
  reFetchList = () => {
    this.props.fetchGroupMemberList(this.props.currGroup._id).then(res => {
      this.setState({
        userInfo: arrayAddKey(res.payload.data.data),
        visible: false
      });
    });
  };

  // 增 - 新增成員

  handleOk = () => {
    this.props
      .addMember({
        id: this.props.currGroup._id,
        member_uids: this.state.inputUids,
        role: this.state.inputRole
      })
      .then(res => {
        if (!res.payload.data.errcode) {
          const { add_members, exist_members } = res.payload.data.data;
          const addLength = add_members.length;
          const existLength = exist_members.length;
          this.setState({
            inputRole: 'dev',
            inputUids: []
          });
          message.success(`新增成功! 已成功新增 ${addLength} 人，其中 ${existLength} 人已存在`);
          this.reFetchList(); // 新增成功後重新獲取分組成員列表
        }
      });
  };
  // 新增成員時 選擇新增成員許可權

  changeNewMemberRole = value => {
    this.setState({
      inputRole: value
    });
  };

  // 刪 - 刪除分組成員

  deleteConfirm = member_uid => {
    return () => {
      const id = this.props.currGroup._id;
      this.props.delMember({ id, member_uid }).then(res => {
        if (!res.payload.data.errcode) {
          message.success(res.payload.data.errmsg);
          this.reFetchList(); // 新增成功後重新獲取分組成員列表
        }
      });
    };
  };

  // 改 - 修改成員許可權
  changeUserRole = e => {
    const id = this.props.currGroup._id;
    const role = e.split('-')[0];
    const member_uid = e.split('-')[1];
    this.props.changeMemberRole({ id, member_uid, role }).then(res => {
      if (!res.payload.data.errcode) {
        message.success(res.payload.data.errmsg);
        this.reFetchList(); // 新增成功後重新獲取分組成員列表
      }
    });
  };

  // 關閉模態框

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  componentWillReceiveProps(nextProps) {
    if (this._groupId !== this._groupId) {
      return null;
    }
    if (this.props.currGroup._id !== nextProps.currGroup._id) {
      this.props.fetchGroupMemberList(nextProps.currGroup._id).then(res => {
        this.setState({
          userInfo: arrayAddKey(res.payload.data.data)
        });
      });
      this.props.fetchGroupMsg(nextProps.currGroup._id).then(res => {
        this.setState({
          role: res.payload.data.data.role
        });
      });
    }
  }

  componentDidMount() {
    const currGroupId = (this._groupId = this.props.currGroup._id);
    this.props.fetchGroupMsg(currGroupId).then(res => {
      this.setState({
        role: res.payload.data.data.role
      });
    });
    this.props.fetchGroupMemberList(currGroupId).then(res => {
      this.setState({
        userInfo: arrayAddKey(res.payload.data.data)
      });
    });
  }

  @autobind
  onUserSelect(uids) {
    this.setState({
      inputUids: uids
    });
  }

  render() {
    const columns = [
      {
        title:
          this.props.currGroup.group_name + ' 分組成員 (' + this.state.userInfo.length + ') 人',
        dataIndex: 'username',
        key: 'username',
        render: (text, record) => {
          return (
            <div className="m-user">
              <Link to={`/user/profile/${record.uid}`}>
                <img
                  src={
                    location.protocol + '//' + location.host + '/api/user/avatar?uid=' + record.uid
                  }
                  className="m-user-img"
                />
              </Link>
              <Link to={`/user/profile/${record.uid}`}>
                <p className="m-user-name">{text}</p>
              </Link>
            </div>
          );
        }
      },
      {
        title:
          this.state.role === 'owner' || this.state.role === 'admin' ? (
            <div className="btn-container">
              <Button className="btn" type="primary" onClick={this.showAddMemberModal}>
                新增成員
              </Button>
            </div>
          ) : (
            ''
          ),
        key: 'action',
        className: 'member-opration',
        render: (text, record) => {
          if (this.state.role === 'owner' || this.state.role === 'admin') {
            return (
              <div>
                <Select
                  value={record.role + '-' + record.uid}
                  className="select"
                  onChange={this.changeUserRole}
                >
                  <Option value={'owner-' + record.uid}>組長</Option>
                  <Option value={'dev-' + record.uid}>開發者</Option>
                  <Option value={'guest-' + record.uid}>訪客</Option>
                </Select>
                <Popconfirm
                  placement="topRight"
                  title="你確定要刪除嗎? "
                  onConfirm={this.deleteConfirm(record.uid)}
                  okText="確定"
                  cancelText=""
                >
                  <Button type="danger" icon="delete" className="btn-danger" />
                  {/* <Icon type="delete" className="btn-danger"/> */}
                </Popconfirm>
              </div>
            );
          } else {
            // 非管理員可以看到許可權 但無法修改
            if (record.role === 'owner') {
              return '組長';
            } else if (record.role === 'dev') {
              return '開發者';
            } else if (record.role === 'guest') {
              return '訪客';
            } else {
              return '';
            }
          }
        }
      }
    ];
    let userinfo = this.state.userInfo;
    let ownerinfo = [];
    let devinfo = [];
    let guestinfo = [];
    for (let i = 0; i < userinfo.length; i++) {
      if (userinfo[i].role === 'owner') {
        ownerinfo.push(userinfo[i]);
      }
      if (userinfo[i].role === 'dev') {
        devinfo.push(userinfo[i]);
      }
      if (userinfo[i].role === 'guest') {
        guestinfo.push(userinfo[i]);
      }
    }
    userinfo = [...ownerinfo, ...devinfo, ...guestinfo];
    return (
      <div className="m-panel">
        {this.state.visible ? (
          <Modal
            title="新增成員"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <Row gutter={6} className="modal-input">
              <Col span="5">
                <div className="label usernamelabel">使用者名稱: </div>
              </Col>
              <Col span="15">
                <UsernameAutoComplete callbackState={this.onUserSelect} />
              </Col>
            </Row>
            <Row gutter={6} className="modal-input">
              <Col span="5">
                <div className="label usernameauth">許可權: </div>
              </Col>
              <Col span="15">
                <Select defaultValue="dev" className="select" onChange={this.changeNewMemberRole}>
                  <Option value="owner">組長</Option>
                  <Option value="dev">開發者</Option>
                  <Option value="guest">訪客</Option>
                </Select>
              </Col>
            </Row>
          </Modal>
        ) : (
          ''
        )}
        <Table
          columns={columns}
          dataSource={userinfo}
          pagination={false}
          locale={{ emptyText: <ErrMsg type="noMemberInGroup" /> }}
        />
      </div>
    );
  }
}

export default MemberList;
