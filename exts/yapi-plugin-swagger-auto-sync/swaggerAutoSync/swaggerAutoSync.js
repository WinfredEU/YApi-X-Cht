import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { formatTime } from 'client/common.js';
import { Form, Switch, Button, Icon, Tooltip, message, Input, Select } from 'antd';
import {handleSwaggerUrlData} from 'client/reducer/modules/project';
const FormItem = Form.Item;
const Option = Select.Option;
import axios from 'axios';

// layout
const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 10 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
  },
  className: 'form-item'
};
const tailFormItemLayout = {
  wrapperCol: {
    sm: {
      span: 16,
      offset: 11
    }
  }
};

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {
    handleSwaggerUrlData
  }
)
@Form.create()
export default class ProjectInterfaceSync extends Component {
  static propTypes = {
    form: PropTypes.object,
    match: PropTypes.object,
    projectId: PropTypes.number,
    projectMsg: PropTypes.object,
    handleSwaggerUrlData: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      sync_data: { is_sync_open: false }
    };
  }

  handleSubmit = async () => {
    const { form, projectId } = this.props;
    let params = {
      project_id: projectId,
      is_sync_open: this.state.sync_data.is_sync_open,
      uid: this.props.projectMsg.uid
    };
    if (this.state.sync_data._id) {
      params.id = this.state.sync_data._id;
    }
    form.validateFields(async (err, values) => {
      if (!err) {
        let assignValue = Object.assign(params, values);
        await axios.post('/api/plugin/autoSync/save', assignValue).then(res => {
          if (res.data.errcode === 0) {
            message.success('儲存成功');
          } else {
            message.error(res.data.errmsg);
          }
        });
      }
    });

  };

  validSwaggerUrl = async (rule, value, callback) => {
    if(!value)return;
    try{
      await this.props.handleSwaggerUrlData(value);
    } catch(e) {
      callback('swagger地址不正確');
    } 
    callback()
  }

  componentWillMount() {
    //查詢同步任務
    this.setState({
      sync_data: {}
    });
    //預設每份鐘同步一次,取一個隨機數
    this.setState({
      random_corn: '*/2 * * * *'
    });
    this.getSyncData();
  }

  async getSyncData() {
    let projectId = this.props.projectMsg._id;
    let result = await axios.get('/api/plugin/autoSync/get?project_id=' + projectId);
    if (result.data.errcode === 0) {
      if (result.data.data) {
        this.setState({
          sync_data: result.data.data
        });
      }
    }
  }

  // 是否開啟
  onChange = v => {
    let sync_data = this.state.sync_data;
    sync_data.is_sync_open = v;
    this.setState({
      sync_data: sync_data
    });
  };

  sync_cronCheck(rule, value, callback){
    if(!value)return;
    value = value.trim();
    if(value.split(/ +/).length > 5){
      callback('不支援秒級別的設定，建議使用 "*/10 * * * *" ,每隔10分鐘更新')
    }
    callback()
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="m-panel">
        <Form>
          <FormItem
            label="是否開啟自動同步"
            {...formItemLayout}
          >
            <Switch
              checked={this.state.sync_data.is_sync_open}
              onChange={this.onChange}
              checkedChildren="開"
              unCheckedChildren="關"
            />
            {this.state.sync_data.last_sync_time != null ? (<div>上次更新時間:<span className="logtime">{formatTime(this.state.sync_data.last_sync_time)}</span></div>) : null}
          </FormItem>

          <div>
            <FormItem {...formItemLayout} label={
              <span className="label">
                數據同步&nbsp;
                <Tooltip
                  title={
                    <div>
                      <h3 style={{ color: 'white' }}>普通模式</h3>
                      <p>不匯入已存在的介面</p>
                      <br />
                      <h3 style={{ color: 'white' }}>智慧合併</h3>
                      <p>
                        已存在的介面，將合併返回數據的 response，適用於匯入了 swagger
                        數據，保留對數據結構的改動
                      </p>
                      <br />
                      <h3 style={{ color: 'white' }}>完全覆蓋</h3>
                      <p>不保留舊數據，完全使用新數據，適用於介面定義完全交給後端定義</p>
                    </div>
                  }
                >
                  <Icon type="question-circle-o" />
                </Tooltip>{' '}
              </span>
            }>
              {getFieldDecorator('sync_mode', {
                initialValue: this.state.sync_data.sync_mode,
                rules: [
                  {
                    required: true,
                    message: '請選擇同步方式!'
                  }
                ]
              })(

                <Select>
                  <Option value="normal">普通模式</Option>
                  <Option value="good">智慧合併</Option>
                  <Option value="merge">完全覆蓋</Option>
                </Select>
              )}
            </FormItem>

            <FormItem {...formItemLayout} label="專案的swagger json地址">
              {getFieldDecorator('sync_json_url', {
                rules: [
                  {
                    required: true,
                    message: '輸入swagger地址'
                  },
                  {
                    validator: this.validSwaggerUrl
                  }
                ],
                validateTrigger: 'onBlur',
                initialValue: this.state.sync_data.sync_json_url
              })(<Input />)}
            </FormItem>

            <FormItem {...formItemLayout} label={<span>類cron風格表達式(預設10分鐘更新一次)&nbsp;<a href="https://blog.csdn.net/shouldnotappearcalm/article/details/89469047">參考</a></span>}>
              {getFieldDecorator('sync_cron', {
                rules: [
                  {
                    required: true,
                    message: '輸入node-schedule的類cron表達式!'
                  },
                  {
                    validator: this.sync_cronCheck
                  }
                ],
                initialValue: this.state.sync_data.sync_cron ? this.state.sync_data.sync_cron : this.state.random_corn
              })(<Input />)}
            </FormItem>
          </div>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit" icon="save" size="large" onClick={this.handleSubmit}>
              儲存
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}
