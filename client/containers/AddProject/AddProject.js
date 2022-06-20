import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Form, Input, Icon, Tooltip, Select, message, Row, Col, Radio } from 'antd';
import { addProject } from '../../reducer/modules/project.js';
import { fetchGroupList } from '../../reducer/modules/group.js';
import { autobind } from 'core-decorators';
import { setBreadcrumb } from '../../reducer/modules/user';
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;
import { pickRandomProperty, handlePath, nameLengthLimit } from '../../common';
import constants from '../../constants/variable.js';
import { withRouter } from 'react-router';
import './Addproject.scss';

const formItemLayout = {
  labelCol: {
    lg: { span: 3 },
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    lg: { span: 21 },
    xs: { span: 24 },
    sm: { span: 14 }
  },
  className: 'form-item'
};

@connect(
  state => {
    return {
      groupList: state.group.groupList,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchGroupList,
    addProject,
    setBreadcrumb
  }
)
@withRouter
class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groupList: [],
      currGroupId: null
    };
  }
  static propTypes = {
    groupList: PropTypes.array,
    form: PropTypes.object,
    currGroup: PropTypes.object,
    addProject: PropTypes.func,
    history: PropTypes.object,
    setBreadcrumb: PropTypes.func,
    fetchGroupList: PropTypes.func
  };

  handlePath = e => {
    let val = e.target.value;
    this.props.form.setFieldsValue({
      basepath: handlePath(val)
    });
  };

  // 確認新增專案
  @autobind
  handleOk(e) {
    const { form, addProject } = this.props;
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        values.group_id = values.group;
        values.icon = constants.PROJECT_ICON[0];
        values.color = pickRandomProperty(constants.PROJECT_COLOR);
        addProject(values).then(res => {
          if (res.payload.data.errcode == 0) {
            form.resetFields();
            message.success('建立成功! ');
            this.props.history.push('/project/' + res.payload.data.data._id + '/interface/api');
          }
        });
      }
    });
  }

  async componentWillMount() {
    this.props.setBreadcrumb([{ name: '新建專案' }]);
    if (!this.props.currGroup._id) {
      await this.props.fetchGroupList();
    }
    if (this.props.groupList.length === 0) {
      return null;
    }
    this.setState({
      currGroupId: this.props.currGroup._id ? this.props.currGroup._id : this.props.groupList[0]._id
    });
    this.setState({ groupList: this.props.groupList });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="g-row">
        <div className="g-row m-container">
          <Form>
            <FormItem {...formItemLayout} label="專案名稱">
              {getFieldDecorator('name', {
                rules: nameLengthLimit('專案')
              })(<Input />)}
            </FormItem>

            <FormItem {...formItemLayout} label="所屬分組">
              {getFieldDecorator('group', {
                initialValue: this.state.currGroupId + '',
                rules: [
                  {
                    required: true,
                    message: '請選擇專案所屬的分組!'
                  }
                ]
              })(
                <Select>
                  {this.state.groupList.map((item, index) => (
                    <Option
                      disabled={
                        !(item.role === 'dev' || item.role === 'owner' || item.role === 'admin')
                      }
                      value={item._id.toString()}
                      key={index}
                    >
                      {item.group_name}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>

            <hr className="breakline" />

            <FormItem
              {...formItemLayout}
              label={
                <span>
                  基本路徑&nbsp;
                  <Tooltip title="介面基本路徑，為空是根路徑">
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }
            >
              {getFieldDecorator('basepath', {
                rules: [
                  {
                    required: false,
                    message: '請輸入專案基本路徑'
                  }
                ]
              })(<Input onBlur={this.handlePath} />)}
            </FormItem>

            <FormItem {...formItemLayout} label="描述">
              {getFieldDecorator('desc', {
                rules: [
                  {
                    required: false,
                    message: '描述不超過144字!',
                    max: 144
                  }
                ]
              })(<TextArea rows={4} />)}
            </FormItem>

            <FormItem {...formItemLayout} label="許可權">
              {getFieldDecorator('project_type', {
                rules: [
                  {
                    required: true
                  }
                ],
                initialValue: 'private'
              })(
                <RadioGroup>
                  <Radio value="private" className="radio">
                    <Icon type="lock" />私有<br />
                    <span className="radio-desc">只有組長和專案開發者可以索引並檢視專案資訊</span>
                  </Radio>
                  <br />
                  {/* <Radio value="public" className="radio">
                    <Icon type="unlock" />公開<br />
                    <span className="radio-desc">任何人都可以索引並檢視專案資訊</span>
                  </Radio> */}
                </RadioGroup>
              )}
            </FormItem>
          </Form>
          <Row>
            <Col sm={{ offset: 6 }} lg={{ offset: 3 }}>
              <Button className="m-btn" icon="plus" type="primary" onClick={this.handleOk}>
                建立專案
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default Form.create()(ProjectList);
