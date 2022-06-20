import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Input, Button, message, Icon, Card, Alert, Modal, Switch, Row, Col, Tooltip } from 'antd';
import { fetchNewsData } from '../../../reducer/modules/news.js';
import {
  changeGroupMsg,
  fetchGroupList,
  setCurrGroup,
  fetchGroupMsg,
  updateGroupList,
  deleteGroup
} from '../../../reducer/modules/group.js';
const { TextArea } = Input;
import { trim } from '../../../common.js';
import _ from 'underscore';
import './GroupSetting.scss';
const confirm = Modal.confirm;

@connect(
  state => {
    return {
      groupList: state.group.groupList,
      currGroup: state.group.currGroup,
      curUserRole: state.user.role
    };
  },
  {
    changeGroupMsg,
    fetchGroupList,
    setCurrGroup,
    fetchGroupMsg,
    fetchNewsData,
    updateGroupList,
    deleteGroup
  }
)
class GroupSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currGroupDesc: '',
      currGroupName: '',
      showDangerOptions: false,
      custom_field1_name: '',
      custom_field1_enable: false,
      custom_field1_rule: false
    };
  }

  static propTypes = {
    currGroup: PropTypes.object,
    curUserRole: PropTypes.string,
    changeGroupMsg: PropTypes.func,
    fetchGroupList: PropTypes.func,
    setCurrGroup: PropTypes.func,
    fetchGroupMsg: PropTypes.func,
    fetchNewsData: PropTypes.func,
    updateGroupList: PropTypes.func,
    deleteGroup: PropTypes.func,
    groupList: PropTypes.array
  };

  initState(props) {
    this.setState({
      currGroupName: props.currGroup.group_name,
      currGroupDesc: props.currGroup.group_desc,
      custom_field1_name: props.currGroup.custom_field1.name,
      custom_field1_enable: props.currGroup.custom_field1.enable
    });
  }

  // 修改分組名稱
  changeName = e => {
    this.setState({
      currGroupName: e.target.value
    });
  };
  // 修改分組描述
  changeDesc = e => {
    this.setState({
      currGroupDesc: e.target.value
    });
  };

  // 修改自定義欄位名稱
  changeCustomName = e => {
    let custom_field1_rule = this.state.custom_field1_enable ? !e.target.value : false;
    this.setState({
      custom_field1_name: e.target.value,
      custom_field1_rule
    });
  };

  // 修改開啟狀態
  changeCustomEnable = e => {
    let custom_field1_rule = e ? !this.state.custom_field1_name : false;
    this.setState({
      custom_field1_enable: e,
      custom_field1_rule
    });
  };

  componentWillMount() {
    // console.log('custom_field1',this.props.currGroup.custom_field1)
    this.initState(this.props);
  }

  // 點選「檢視危險操作」按鈕
  toggleDangerOptions = () => {
    // console.log(this.state.showDangerOptions);
    this.setState({
      showDangerOptions: !this.state.showDangerOptions
    });
  };

  // 編輯分組資訊
  editGroup = async () => {
    const id = this.props.currGroup._id;
    if (this.state.custom_field1_rule) {
      return;
    }
    const res = await this.props.changeGroupMsg({
      group_name: this.state.currGroupName,
      group_desc: this.state.currGroupDesc,
      custom_field1: {
        name: this.state.custom_field1_name,
        enable: this.state.custom_field1_enable
      },
      id: this.props.currGroup._id
    });

    if (!res.payload.data.errcode) {
      message.success('修改成功！');
      await this.props.fetchGroupList(this.props.groupList);
      this.props.updateGroupList(this.props.groupList);
      const currGroup = _.find(this.props.groupList, group => {
        return +group._id === +id;
      });
      this.props.setCurrGroup(currGroup);
      this.props.fetchGroupMsg(this.props.currGroup._id);
      this.props.fetchNewsData(this.props.currGroup._id, 'group', 1, 10);
    }
  };

  // 刪除分組

  deleteGroup = async () => {
    const that = this;
    const { currGroup } = that.props;
    const res = await this.props.deleteGroup({ id: currGroup._id });
    if (!res.payload.data.errcode) {
      message.success('刪除成功');
      await that.props.fetchGroupList();
      const currGroup = that.props.groupList[0] || { group_name: '', group_desc: '' };
      that.setState({ groupList: that.props.groupList });
      that.props.setCurrGroup(currGroup);
    }
  };

  // 刪除分組的二次確認
  showConfirm = () => {
    const that = this;
    confirm({
      title: '確認刪除 ' + that.props.currGroup.group_name + ' 分組嗎？',
      content: (
        <div style={{ marginTop: '10px', fontSize: '13px', lineHeight: '25px' }}>
          <Alert
            message="警告：此操作非常危險,會刪除該分組下面所有專案和介面，並且無法恢復!"
            type="warning"
          />
          <div style={{ marginTop: '16px' }}>
            <p>
              <b>請輸入分組名稱確認此操作:</b>
            </p>
            <Input id="group_name" />
          </div>
        </div>
      ),
      onOk() {
        const groupName = trim(document.getElementById('group_name').value);
        if (that.props.currGroup.group_name !== groupName) {
          message.error('分組名稱有誤');
          return new Promise((resolve, reject) => {
            reject('error');
          });
        } else {
          that.deleteGroup();
        }
      },
      iconType: 'delete',
      onCancel() {}
    });
  };

  componentWillReceiveProps(nextProps) {
    // 切換分組時，更新分組資訊並關閉刪除分組操作
    if (this.props.currGroup._id !== nextProps.currGroup._id) {
      this.initState(nextProps);
      this.setState({
        showDangerOptions: false
      });
    }
  }

  render() {
    return (
      <div className="m-panel card-panel card-panel-s panel-group">
        <Row type="flex" justify="space-around" className="row" align="middle">
          <Col span={4} className="label">
            分組名：
          </Col>
          <Col span={20}>
            <Input
              size="large"
              placeholder="請輸入分組名稱"
              value={this.state.currGroupName}
              onChange={this.changeName}
            />
          </Col>
        </Row>
        <Row type="flex" justify="space-around" className="row" align="middle">
          <Col span={4} className="label">
            簡介：
          </Col>
          <Col span={20}>
            <TextArea
              size="large"
              rows={3}
              placeholder="請輸入分組描述"
              value={this.state.currGroupDesc}
              onChange={this.changeDesc}
            />
          </Col>
        </Row>
        <Row type="flex" justify="space-around" className="row" align="middle">
          <Col span={4} className="label">
            介面自定義欄位&nbsp;
            <Tooltip title={'可以在介面中新增 額外欄位 數據'}>
              <Icon type="question-circle-o" style={{ width: '10px' }} />
            </Tooltip> ：
          </Col>
          <Col span={12} style={{ position: 'relative' }}>
            <Input
              placeholder="請輸入自定義欄位名稱"
              style={{ borderColor: this.state.custom_field1_rule ? '#f5222d' : '' }}
              value={this.state.custom_field1_name}
              onChange={this.changeCustomName}
            />
            <div
              className="custom-field-rule"
              style={{ display: this.state.custom_field1_rule ? 'block' : 'none' }}
            >
              自定義欄位名稱不能為空
            </div>
          </Col>
          <Col span={2} className="label">
            開啟：
          </Col>
          <Col span={6}>
            <Switch
              checked={this.state.custom_field1_enable}
              checkedChildren="開"
              unCheckedChildren="關"
              onChange={this.changeCustomEnable}
            />
          </Col>
        </Row>
        <Row type="flex" justify="center" className="row save">
          <Col span={4} className="save-button">
            <Button className="m-btn btn-save" icon="save" type="primary" onClick={this.editGroup}>
              保 存
            </Button>
          </Col>
        </Row>
        {/* 只有超級管理員能刪除分組 */}
        {this.props.curUserRole === 'admin' ? (
          <Row type="flex" justify="center" className="danger-container">
            <Col span={24} className="title">
              <h2 className="content">
                <Icon type="exclamation-circle-o" /> 危險操作
              </h2>
              <Button onClick={this.toggleDangerOptions}>
                查 看<Icon type={this.state.showDangerOptions ? 'up' : 'down'} />
              </Button>
            </Col>
            {this.state.showDangerOptions ? (
              <Card hoverable={true} className="card-danger" style={{ width: '100%' }}>
                <div className="card-danger-content">
                  <h3>刪除分組</h3>
                  <p>分組一旦刪除，將無法恢復數據，請慎重操作！</p>
                  <p>只有超級管理員有許可權刪除分組。</p>
                </div>
                <Button type="danger" ghost className="card-danger-btn" onClick={this.showConfirm}>
                  刪除
                </Button>
              </Card>
            ) : null}
          </Row>
        ) : null}
      </div>
    );
  }
}

export default GroupSetting;
