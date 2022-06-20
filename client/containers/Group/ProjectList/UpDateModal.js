import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Form, Input, Icon, Tooltip, Select, message, Button, Row, Col } from 'antd';
import {
  updateProject,
  fetchProjectList,
  delProject,
  changeUpdateModal,
  changeTableLoading
} from '../../../reducer/modules/project';
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;

import './ProjectList.scss';

// layout
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 }
  }
};
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 6 }
  }
};
let uuid = 0;

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      isUpdateModalShow: state.project.isUpdateModalShow,
      handleUpdateIndex: state.project.handleUpdateIndex,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchProjectList,
    updateProject,
    delProject,
    changeUpdateModal,
    changeTableLoading
  }
)
class UpDateModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      protocol: 'http://',
      envProtocolChange: 'http://'
    };
  }
  static propTypes = {
    form: PropTypes.object,
    fetchProjectList: PropTypes.func,
    updateProject: PropTypes.func,
    delProject: PropTypes.func,
    changeUpdateModal: PropTypes.func,
    changeTableLoading: PropTypes.func,
    projectList: PropTypes.array,
    currGroup: PropTypes.object,
    isUpdateModalShow: PropTypes.bool,
    handleUpdateIndex: PropTypes.number
  };

  // 修改線上域名的協議型別 (http/https)
  protocolChange = value => {
    this.setState({
      protocol: value
    });
  };

  handleCancel = () => {
    this.props.form.resetFields();
    this.props.changeUpdateModal(false, -1);
  };

  // 確認修改
  handleOk = e => {
    e.preventDefault();
    const {
      form,
      updateProject,
      changeUpdateModal,
      currGroup,
      projectList,
      handleUpdateIndex,
      fetchProjectList,
      changeTableLoading
    } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        // console.log(projectList[handleUpdateIndex]);
        let assignValue = Object.assign(projectList[handleUpdateIndex], values);
        values.protocol = this.state.protocol.split(':')[0];
        assignValue.env = assignValue.envs.map((item, index) => {
          return {
            name: values['envs-name-' + index],
            domain: values['envs-protocol-' + index] + values['envs-domain-' + index]
          };
        });
        // console.log(assignValue);

        changeTableLoading(true);
        updateProject(assignValue)
          .then(res => {
            if (res.payload.data.errcode == 0) {
              changeUpdateModal(false, -1);
              message.success('修改成功! ');
              fetchProjectList(currGroup._id).then(() => {
                changeTableLoading(false);
              });
            } else {
              changeTableLoading(false);
              message.error(res.payload.data.errmsg);
            }
          })
          .catch(() => {
            changeTableLoading(false);
          });
        form.resetFields();
      }
    });
  };

  // 專案的修改操作 - 刪除一項環境配置
  remove = id => {
    const { form } = this.props;
    // can use data-binding to get
    const envs = form.getFieldValue('envs');
    // We need at least one passenger
    if (envs.length === 0) {
      return;
    }

    // can use data-binding to set
    form.setFieldsValue({
      envs: envs.filter(key => {
        const realKey = key._id ? key._id : key;
        return realKey !== id;
      })
    });
  };

  // 專案的修改操作 - 新增一項環境配置
  add = () => {
    uuid++;
    const { form } = this.props;
    // can use data-binding to get
    const envs = form.getFieldValue('envs');
    const nextKeys = envs.concat(uuid);
    // can use data-binding to set
    // important! notify form to detect changes
    form.setFieldsValue({
      envs: nextKeys
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    // const that = this;
    const { isUpdateModalShow, projectList, handleUpdateIndex } = this.props;
    let initFormValues = {};
    let envMessage = [];
    // 如果列表存在且使用者點選修改按鈕時，設定表單預設值
    if (projectList.length !== 0 && handleUpdateIndex !== -1) {
      // console.log(projectList[handleUpdateIndex]);
      const { name, basepath, desc, env } = projectList[handleUpdateIndex];
      initFormValues = { name, basepath, desc, env };
      if (env.length !== 0) {
        envMessage = env;
      }
      initFormValues.prd_host = projectList[handleUpdateIndex].prd_host;
      initFormValues.prd_protocol = projectList[handleUpdateIndex].protocol + '://';
    }

    getFieldDecorator('envs', { initialValue: envMessage });
    const envs = getFieldValue('envs');
    const formItems = envs.map((k, index) => {
      const secondIndex = 'next' + index; // 為保證key的唯一性
      return (
        <Row key={index} type="flex" justify="space-between" align={index === 0 ? 'middle' : 'top'}>
          <Col span={10} offset={2}>
            <FormItem label={index === 0 ? <span>環境名稱</span> : ''} required={false} key={index}>
              {getFieldDecorator(`envs-name-${index}`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: envMessage.length !== 0 ? k.name : '',
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    validator(rule, value, callback) {
                      if (value) {
                        if (value.length === 0) {
                          callback('請輸入環境域名');
                        } else if (!/\S/.test(value)) {
                          callback('請輸入環境域名');
                        } else if (/prd/.test(value)) {
                          callback('環境域名不能是"prd"');
                        } else {
                          return callback();
                        }
                      } else {
                        callback('請輸入環境域名');
                      }
                    }
                  }
                ]
              })(<Input placeholder="請輸入環境名稱" style={{ width: '90%', marginRight: 8 }} />)}
            </FormItem>
          </Col>
          <Col span={10}>
            <FormItem
              label={index === 0 ? <span>環境域名</span> : ''}
              required={false}
              key={secondIndex}
            >
              {getFieldDecorator(`envs-domain-${index}`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: envMessage.length !== 0 && k.domain ? k.domain.split('//')[1] : '',
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: '請輸入環境域名',
                    validator(rule, value, callback) {
                      if (value) {
                        if (value.length === 0) {
                          callback('請輸入環境域名');
                        } else if (!/\S/.test(value)) {
                          callback('請輸入環境域名');
                        } else {
                          return callback();
                        }
                      } else {
                        callback('請輸入環境域名');
                      }
                    }
                  }
                ]
              })(
                <Input
                  placeholder="請輸入環境域名"
                  style={{ width: '90%', marginRight: 8 }}
                  addonBefore={getFieldDecorator(`envs-protocol-${index}`, {
                    initialValue:
                      envMessage.length !== 0 && k.domain
                        ? k.domain.split('//')[0] + '//'
                        : 'http://',
                    rules: [
                      {
                        required: true
                      }
                    ]
                  })(
                    <Select>
                      <Option value="http://">{'http://'}</Option>
                      <Option value="https://">{'https://'}</Option>
                    </Select>
                  )}
                />
              )}
            </FormItem>
          </Col>
          <Col span={2}>
            {/* 新增的項中，只有最後一項有刪除按鈕 */}
            {(envs.length > 0 && k._id) || envs.length == index + 1 ? (
              <Icon
                className="dynamic-delete-button"
                type="minus-circle-o"
                onClick={() => {
                  return this.remove(k._id ? k._id : k);
                }}
              />
            ) : null}
          </Col>
        </Row>
      );
    });
    return (
      <Modal
        title="修改專案"
        visible={isUpdateModalShow}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Form>
          <FormItem {...formItemLayout} label="專案名稱">
            {getFieldDecorator('name', {
              initialValue: initFormValues.name,
              rules: [
                {
                  required: true,
                  message: '請輸入專案名稱!'
                }
              ]
            })(<Input />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                線上域名&nbsp;
                <Tooltip title="將根據配置的線上域名訪問mock數據">
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('prd_host', {
              initialValue: initFormValues.prd_host,
              rules: [
                {
                  required: true,
                  message: '請輸入專案線上域名!'
                }
              ]
            })(
              <Input
                addonBefore={
                  <Select defaultValue={initFormValues.prd_protocol} onChange={this.protocolChange}>
                    <Option value="http://">{'http://'}</Option>
                    <Option value="https://">{'https://'}</Option>
                  </Select>
                }
              />
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                基本路徑&nbsp;
                <Tooltip title="基本路徑為空表示根路徑">
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('basepath', {
              initialValue: initFormValues.basepath,
              rules: [
                {
                  required: false,
                  message: '請輸入專案基本路徑! '
                }
              ]
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="描述">
            {getFieldDecorator('desc', {
              initialValue: initFormValues.desc,
              rules: [
                {
                  required: false,
                  message: '請輸入描述!'
                }
              ]
            })(<TextArea rows={4} />)}
          </FormItem>

          {formItems}
          <FormItem {...formItemLayoutWithOutLabel}>
            <Button type="dashed" onClick={this.add} style={{ width: '60%' }}>
              <Icon type="plus" /> 新增環境配置
            </Button>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(UpDateModal);
