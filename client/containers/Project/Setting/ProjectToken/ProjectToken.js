import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ProjectToken.scss';
import { getToken, updateToken } from '../../../../reducer/modules/project';
import { connect } from 'react-redux';
import { Icon, Tooltip, message, Modal } from 'antd';
import copy from 'copy-to-clipboard';
const confirm = Modal.confirm;

@connect(
  state => {
    return {
      token: state.project.token
    };
  },
  {
    getToken,
    updateToken
  }
)
class ProjectToken extends Component {
  static propTypes = {
    projectId: PropTypes.number,
    getToken: PropTypes.func,
    token: PropTypes.string,
    updateToken: PropTypes.func,
    curProjectRole: PropTypes.string
  };

  async componentDidMount() {
    await this.props.getToken(this.props.projectId);
  }

  copyToken = () => {
    copy(this.props.token);
    message.success('已經成功複製到剪下板');
  };

  updateToken = () => {
    let that = this;
    confirm({
      title: '重新產生key',
      content: '重新產生之後，之前的key將無法使用，確認重新產生嗎？',
      okText: '確認',
      cancelText: '取消',
      async onOk() {
        await that.props.updateToken(that.props.projectId);
        message.success('更新成功');
      },
      onCancel() {}
    });
  };

  render() {
    return (
      <div className="project-token">
        <h2 className="token-title">工具標識</h2>
        <div className="message">
          每個專案都有唯一的標識token，使用者可以使用這個token值來請求專案 openapi.
        </div>
        <div className="token">
          <span>
            token: <span className="token-message">{this.props.token}</span>
          </span>
          <Tooltip title="複製">
            <Icon className="token-btn" type="copy" onClick={this.copyToken} />
          </Tooltip>
          {this.props.curProjectRole === 'admin' || this.props.curProjectRole === 'owner' ? (
            <Tooltip title="重新整理">
              <Icon className="token-btn" type="reload" onClick={this.updateToken} />
            </Tooltip>
          ) : null}
        </div>
        <div className="blockquote">
          為確保專案內數據的安全性和私密性，請勿輕易將該token暴露給專案組外使用者。
        </div>
        <br />
        <h2  className="token-title">open介面：</h2>
        <p><a target="_blank" rel="noopener noreferrer"   href="https://hellosean1025.github.io/yapi/openapi.html">詳細介面文件</a></p>
        <div>
          <ul className="open-api">
            <li>/api/open/run_auto_test [執行自動化測試]</li>
            <li>/api/open/import_data [匯入數據]</li>
            <li>/api/interface/add [新增介面]</li>
            <li>/api/interface/save [儲存介面]</li>
            <li>/api/interface/up [更新介面]</li>
            <li>/api/interface/get [獲取介面]</li>
            <li>/api/interface/list [獲取介面列表]</li>
            <li>/api/interface/list_menu [獲取介面菜單]</li>
            <li>/api/interface/add_cat [新增介面分類]</li>
            <li>/api/interface/getCatMenu [獲取所有分類]</li>
          </ul>
        </div>
      </div>
    );
  }
}

export default ProjectToken;
