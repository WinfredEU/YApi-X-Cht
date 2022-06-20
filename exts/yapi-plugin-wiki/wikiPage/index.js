import React, { Component } from 'react';
import { message } from 'antd';
import { connect } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import './index.scss';
import { timeago } from '../../../common/utils';
import { Link } from 'react-router-dom';
import WikiView from './View.js';
import WikiEditor from './Editor.js';

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {}
)
class WikiPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditor: false,
      isUpload: true,
      desc: '',
      markdown: '',
      notice: props.projectMsg.switch_notice,
      status: 'INIT',
      editUid: '',
      editName: '',
      curdata: null
    };
  }

  static propTypes = {
    match: PropTypes.object,
    projectMsg: PropTypes.object
  };

  async componentDidMount() {
    const currProjectId = this.props.match.params.id;
    await this.handleData({ project_id: currProjectId });
    this.handleConflict();
  }

  componentWillUnmount() {
    // willUnmount
    try {
      if (this.state.status === 'CLOSE') {
        this.WebSocket.send('end');
        this.WebSocket.close();
      }
    } catch (e) {
      return null;
    }
  }
  // 結束編輯websocket
  endWebSocket = () => {
    try {
      if (this.state.status === 'CLOSE') {
        const sendEnd = () => {
          this.WebSocket.send('end');
        };
        this.handleWebsocketAccidentClose(sendEnd);
      }
    } catch (e) {
      return null;
    }
  };

  // 處理多人編輯衝突問題
  handleConflict = () => {
    // console.log(location)
    let domain = location.hostname + (location.port !== '' ? ':' + location.port : '');
    let s;
    //因後端 node 僅支援 ws， 暫不支援 wss
    let wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
    s = new WebSocket(
      wsProtocol +
        '://' +
        domain +
        '/api/ws_plugin/wiki_desc/solve_conflict?id=' +
        this.props.match.params.id
    );
    s.onopen = () => {
      this.WebSocket = s;
      s.send('start');
    };

    s.onmessage = e => {
      let result = JSON.parse(e.data);
      if (result.errno === 0) {
        // 更新
        if (result.data) {
          this.setState({
            // curdata: result.data,
            desc: result.data.desc,
            username: result.data.username,
            uid: result.data.uid,
            editorTime: timeago(result.data.up_time)
          });
        }
        // 新建
        this.setState({
          isEditor: !this.state.isEditor,
          status: 'CLOSE'
        });
      } else {
        this.setState({
          editUid: result.data.uid,
          editName: result.data.username,
          status: 'EDITOR'
        });
      }
    };

    s.onerror = () => {
      this.setState({
        status: 'CLOSE'
      });
      console.warn('websocket 連線失敗，將導致多人編輯同一個介面衝突。');
    };
  };

  // 點選編輯按鈕 發送 websocket 獲取數據
  onEditor = () => {
    // this.WebSocket.send('editor');
    const sendEditor = () => {
      this.WebSocket.send('editor');
    };
    this.handleWebsocketAccidentClose(sendEditor, status => {
      // 如果websocket 啟動不成功使用者依舊可以對wiki 進行編輯
      if (!status) {
        this.setState({
          isEditor: !this.state.isEditor
        });
      }
    });
  };

  // 處理websocket  意外斷開問題
  handleWebsocketAccidentClose = (fn, callback) => {
    // websocket 是否啟動
    if (this.WebSocket) {
      // websocket 斷開
      if (this.WebSocket.readyState !== 1) {
        message.error('websocket 鏈接失敗，請重新重新整理頁面');
      } else {
        fn();
      }
      callback(true);
    } else {
      callback(false);
    }
  };

  //  獲取數據
  handleData = async params => {
    let result = await axios.get('/api/plugin/wiki_desc/get', { params });
    if (result.data.errcode === 0) {
      const data = result.data.data;
      if (data) {
        this.setState({
          desc: data.desc,
          markdown: data.markdown,
          username: data.username,
          uid: data.uid,
          editorTime: timeago(data.up_time)
        });
      }
    } else {
      message.error(`請求數據失敗： ${result.data.errmsg}`);
    }
  };

  // 數據上傳
  onUpload = async (desc, markdown) => {
    const currProjectId = this.props.match.params.id;
    let option = {
      project_id: currProjectId,
      desc,
      markdown,
      email_notice: this.state.notice
    };
    let result = await axios.post('/api/plugin/wiki_desc/up', option);
    if (result.data.errcode === 0) {
      await this.handleData({ project_id: currProjectId });
      this.setState({ isEditor: false });
    } else {
      message.error(`更新失敗： ${result.data.errmsg}`);
    }
    this.endWebSocket();
    // this.WebSocket.send('end');
  };
  // 取消編輯
  onCancel = () => {
    this.setState({ isEditor: false });
    this.endWebSocket();
  };

  // 郵件通知
  onEmailNotice = e => {
    this.setState({
      notice: e.target.checked
    });
  };

  render() {
    const { isEditor, username, editorTime, notice, uid, status, editUid, editName } = this.state;
    const editorEable =
      this.props.projectMsg.role === 'admin' ||
      this.props.projectMsg.role === 'owner' ||
      this.props.projectMsg.role === 'dev';
    const isConflict = status === 'EDITOR';

    return (
      <div className="g-row">
        <div className="m-panel wiki-content">
          <div className="wiki-content">
            {isConflict && (
              <div className="wiki-conflict">
                <Link to={`/user/profile/${editUid || uid}`}>
                  <b>{editName || username}</b>
                </Link>
                <span>正在編輯該wiki，請稍後再試...</span>
              </div>
            )}
          </div>
          {!isEditor ? (
            <WikiView
              editorEable={editorEable}
              onEditor={this.onEditor}
              uid={uid}
              username={username}
              editorTime={editorTime}
              desc={this.state.desc}
            />
          ) : (
            <WikiEditor
              isConflict={isConflict}
              onUpload={this.onUpload}
              onCancel={this.onCancel}
              notice={notice}
              onEmailNotice={this.onEmailNotice}
              desc={this.state.desc}
            />
          )}
        </div>
      </div>
    );
  }
}

export default WikiPage;
