import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tabs, Modal, Button } from 'antd';
import Edit from './Edit.js';
import View from './View.js';
import { Prompt } from 'react-router';
import { fetchInterfaceData } from '../../../../reducer/modules/interface.js';
import { withRouter } from 'react-router-dom';
import Run from './Run/Run.js';
const plugin = require('client/plugin.js');

const TabPane = Tabs.TabPane;
@connect(
  state => {
    return {
      curdata: state.inter.curdata,
      list: state.inter.list,
      editStatus: state.inter.editStatus
    };
  },
  {
    fetchInterfaceData
  }
)
class Content extends Component {
  static propTypes = {
    match: PropTypes.object,
    list: PropTypes.array,
    curdata: PropTypes.object,
    fetchInterfaceData: PropTypes.func,
    history: PropTypes.object,
    editStatus: PropTypes.bool
  };
  constructor(props) {
    super(props);
    this.title = 'YApi-高效、易用、功能強大的視覺化介面管理平臺';
    this.state = {
      curtab: 'view',
      visible: false,
      nextTab: ''
    };
  }

  componentWillMount() {
    const params = this.props.match.params;
    this.actionId = params.actionId;
    this.handleRequest(this.props);
  }

  componentWillUnmount() {
    document.getElementsByTagName('title')[0].innerText = this.title;
  }

  componentWillReceiveProps(nextProps) {
    const params = nextProps.match.params;
    if (params.actionId !== this.actionId) {
      this.actionId = params.actionId;
      this.handleRequest(nextProps);
    }
  }

  handleRequest(nextProps) {
    const params = nextProps.match.params;
    this.props.fetchInterfaceData(params.actionId);
    this.setState({
      curtab: 'view'
    });
  }

  switchToView = () => {
    this.setState({
      curtab: 'view'
    });
  };

  onChange = key => {
    if (this.state.curtab === 'edit' && this.props.editStatus) {
      this.showModal();
    } else {
      this.setState({
        curtab: key
      });
    }
    this.setState({
      nextTab: key
    });
  };
  // 確定離開頁面
  handleOk = () => {
    this.setState({
      visible: false,
      curtab: this.state.nextTab
    });
  };
  // 離開編輯頁面的提示
  showModal = () => {
    this.setState({
      visible: true
    });
  };
  // 取消離開編輯頁面
  handleCancel = () => {
    this.setState({
      visible: false
    });
  };
  render() {
    if (this.props.curdata.title) {
      document.getElementsByTagName('title')[0].innerText =
        this.props.curdata.title + '-' + this.title;
    }

    let InterfaceTabs = {
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
    };

    plugin.emitHook('interface_tab', InterfaceTabs);

    const tabs = (
      <Tabs
        className="tabs-large"
        onChange={this.onChange}
        activeKey={this.state.curtab}
        defaultActiveKey="view"
      >
        {Object.keys(InterfaceTabs).map(key => {
          let item = InterfaceTabs[key];
          return <TabPane tab={item.name} key={key} />;
        })}
      </Tabs>
    );
    let tabContent = null;
    if (this.state.curtab) {
      let C = InterfaceTabs[this.state.curtab].component;
      tabContent = <C switchToView={this.switchToView} />;
    }

    return (
      <div className="interface-content">
        <Prompt
          when={this.state.curtab === 'edit' && this.props.editStatus ? true : false}
          message={() => {
            // this.showModal();
            return '離開頁面會丟失當前編輯的內容，確定要離開嗎？';
          }}
        />
        {tabs}
        {tabContent}
        {this.state.visible && (
          <Modal
            title="你即將離開編輯頁面"
            visible={this.state.visible}
            onCancel={this.handleCancel}
            footer={[
              <Button key="back" onClick={this.handleCancel}>
                取 消
              </Button>,
              <Button key="submit" onClick={this.handleOk}>
                確 定
              </Button>
            ]}
          >
            <p>離開頁面會丟失當前編輯的內容，確定要離開嗎？</p>
          </Modal>
        )}
      </div>
    );
  }
}

export default withRouter(Content);
