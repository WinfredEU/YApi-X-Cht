/* eslint-disable react/sort-comp */
import axios from 'axios'
import PropTypes from 'prop-types'
import React, {PureComponent as Component} from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  message,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Switch,
  Tabs,
  Tooltip,
  Upload,
} from 'antd'
import {connect} from 'react-redux'
import {
  delProject,
  getProject,
  updateProject,
  upsetProject,
} from '../../../../reducer/modules/project'
import {fetchGroupList} from '../../../../reducer/modules/group.js'
import {fetchGroupMsg} from '../../../../reducer/modules/group'
import {setBreadcrumb} from '../../../../reducer/modules/user'

const {TextArea} = Input
import {withRouter} from 'react-router'

const FormItem = Form.Item
const RadioGroup = Radio.Group
const RadioButton = Radio.Button
import constants from '../../../../constants/variable.js'

const confirm = Modal.confirm
import '../Setting.scss'
import _ from 'underscore'
import ProjectTag from './ProjectTag.js'
import {entries, htmlFilter, nameLengthLimit, trim} from '../../../../common'
// layout
const formItemLayout = {
  labelCol: {
    lg: {offset: 1, span: 3},
    xs: {span: 24},
    sm: {span: 6},
  },
  wrapperCol: {
    lg: {span: 19},
    xs: {span: 24},
    sm: {span: 14},
  },
  className: 'form-item',
}

const Option = Select.Option

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      groupList: state.group.groupList,
      projectMsg: state.project.currProject,
      currGroup: state.group.currGroup,
    }
  },
  {
    updateProject,
    delProject,
    getProject,
    fetchGroupMsg,
    upsetProject,
    fetchGroupList,
    setBreadcrumb,
  },
)
@withRouter
class ProjectMessage extends Component {
 static propTypes = {
   projectId: PropTypes.number,
   form: PropTypes.object,
   updateProject: PropTypes.func,
   delProject: PropTypes.func,
   getProject: PropTypes.func,
   history: PropTypes.object,
   fetchGroupMsg: PropTypes.func,
   upsetProject: PropTypes.func,
   groupList: PropTypes.array,
   projectList: PropTypes.array,
   projectMsg: PropTypes.object,
   fetchGroupList: PropTypes.func,
   currGroup: PropTypes.object,
   setBreadcrumb: PropTypes.func,
 };

 constructor(props) {
   super(props)
   this.state = {
     protocol: 'http://',
     projectMsg: {},
     showDangerOptions: false,
   }
 }

  // 確認修改
  handleOk = e => {
    e.preventDefault()
    const {form, updateProject, projectMsg, groupList} = this.props
    form.validateFields((err, values) => {
      if (!err) {
        let {tag} = this.tag.state
        // let tag = this.refs.tag;
        tag = tag.filter(val => {
          return val.name !== ''
        })
        const assignValue = Object.assign(projectMsg, values, {tag})

        values.protocol = this.state.protocol.split(':')[0]
        const group_id = assignValue.group_id
        const selectGroup = _.find(groupList, item => {
          return item._id == group_id
        })

        updateProject(assignValue)
          .then(res => {
            if (res.payload.data.errcode == 0) {
              this.props.getProject(this.props.projectId)
              message.success('修改成功! ')

              // 如果如果專案所在的分組位置發生改變
              this.props.fetchGroupMsg(group_id)
              // this.props.history.push('/group');
              const projectName = htmlFilter(assignValue.name)
              this.props.setBreadcrumb([
                {
                  name: selectGroup.group_name,
                  href: `/group/${ group_id}`,
                },
                {
                  name: projectName,
                },
              ])
            }
          })
          .catch(() => {})
        form.resetFields()
      }
    })
  };

  tagSubmit = tag => {
    this.tag = tag
  };

  handleShowConfirm = () => {
    const that = this
    confirm({
      title: `確認刪除 ${ that.props.projectMsg.name } 專案嗎？`,
      content: (
        <div style={{marginTop: '10px', fontSize: '13px', lineHeight: '25px'}}>
          <Alert
            message='警告：此操作非常危險,會刪除該專案下面所有介面，並且無法恢復!'
            type='warning'
            banner={true}
          />
          <div style={{marginTop: '16px'}}>
            <p style={{marginBottom: '8px'}}>
              <b>請輸入專案名稱確認此操作:</b>
            </p>
            <Input id='project_name' size='large' />
          </div>
        </div>
      ),
      onOk() {
        const groupName = trim(document.getElementById('project_name').value)
        if (that.props.projectMsg.name !== groupName) {
          message.error('專案名稱有誤')
          return new Promise((resolve, reject) => {
            reject('error')
          })
        }
        that.props.delProject(that.props.projectId).then(res => {
          if (res.payload.data.errcode == 0) {
            message.success('刪除成功!')
            that.props.history.push(`/group/${ that.props.projectMsg.group_id}`)
          }
        })
      },
      iconType: 'delete',
      onCancel() {},
    })
  };

  // 修改專案頭像的背景顏色
  handleChangeProjectColor = e => {
    const {_id, color, icon, logo} = this.props.projectMsg
    this.props.upsetProject({id: _id, color: e.target.value || color, icon, logo: logo}).then(res => {
      if (res.payload.data.errcode === 0) {
        this.props.getProject(this.props.projectId)
      }
    })
  };

  // 修改專案頭像的圖示
  handleChangeProjectIcon = e => {
    const {_id, color, icon} = this.props.projectMsg
    this.props.upsetProject({id: _id, color, icon: e.target.value || icon, logo: null}).then(res => {
      if (res.payload.data.errcode === 0) {
        this.props.getProject(this.props.projectId)
      }
    })
  };

  // 點選「檢視危險操作」按鈕
  handleToggleDangerOptions = () => {
    // console.log(this.state.showDangerOptions);
    this.setState({
      showDangerOptions: !this.state.showDangerOptions,
    })
  };

  async componentWillMount() {
    await this.props.fetchGroupList()
    await this.props.fetchGroupMsg(this.props.projectMsg.group_id)
  }

  render() {
    const {getFieldDecorator} = this.props.form
    const {projectMsg, currGroup} = this.props
    const mockUrl
      = `${location.protocol
      }//${
        location.hostname
      }${location.port !== '' ? `:${ location.port}` : ''
      }/mock/${projectMsg._id}${projectMsg.basepath}+$介面請求路徑`
    let initFormValues = {}
    const {
      name,
      basepath,
      desc,
      project_type,
      group_id,
      switch_notice,
      strice,
      is_json5,
      tag,
    } = projectMsg
    initFormValues = {
      name,
      basepath,
      desc,
      project_type,
      group_id,
      switch_notice,
      strice,
      is_json5,
      tag,
    }

    const colorArr = entries(constants.PROJECT_COLOR)
    const colorSelector = (
      <RadioGroup value={projectMsg.color} className='color' onChange={this.handleChangeProjectColor}>
        {colorArr.map((item, index) => {
          return (
            <RadioButton
              key={String(index)}
              value={item[0]}
              style={{backgroundColor: item[1], color: '#fff', fontWeight: 'bold'}}>
              {item[0] === projectMsg.color ? <Icon type='check' /> : null}
            </RadioButton>
          )
        })}
      </RadioGroup>
    )
    const iconSelector = (
      <Tabs className='project-icon-selector' defaultActiveKey={projectMsg.logo ? '2' : '1'}>
        <Tabs.TabPane key='1' tab='內建圖示'>
          <RadioGroup value={projectMsg.icon} className='icon' onChange={this.handleChangeProjectIcon}>
            {constants.PROJECT_ICON.map(item => {
              return (
                <RadioButton key={item} value={item} style={{fontWeight: 'bold'}}>
                  <Icon type={item} />
                </RadioButton>
              )
            })}
          </RadioGroup>
        </Tabs.TabPane>
        <Tabs.TabPane key='2' tab='上傳圖示'>
          <Upload
            accept='.jpg,.jpeg,.png,.svg,.gif'
            name='avatar'
            listType='picture-card'
            style={{margin: 'auto'}}
            showUploadList={false}
            beforeUpload={file => {
              const fr = new FileReader()
              fr.onload = async () => {
                const uploadRes = await axios.post('/api/file/upload', {
                  name: file.name,
                  mimeType: file.type,
                  base64: fr.result.split(';base64,')[1],
                  extra: {
                    logo4project: this.props.projectId,
                  },
                })
                if (uploadRes.data.errcode !== 0) {
                  return message.error(uploadRes.data.errmsg)
                }
                const {_id, color} = this.props.projectMsg
                const res = await this.props.upsetProject({id: _id, color, icon: null, logo: uploadRes.data.data.id})
                if (res.payload.data.errcode === 0) {
                  this.props.getProject(this.props.projectId)
                } else {
                  message.error(res.payload.data.errmsg)
                }
              }
              fr.readAsDataURL(file)
              return false
            }}>
            {
              projectMsg.logo
                ? (
                  <img
                    src={`/api/file/download?id=${projectMsg.logo}`}
                    style={{maxWidth: '100%'}}
                  />
                )
                : (
                  <div>
                    <Icon type='plus' />
                    <div className='ant-upload-text'>上傳</div>
                  </div>
                )}
          </Upload>
        </Tabs.TabPane>
      </Tabs>
    )
    const selectDisbaled = projectMsg.role === 'owner' || projectMsg.role === 'admin'
    return (
      <div>
        <div className='m-panel'>
          <Row className='project-setting'>
            <Col xs={6} lg={{offset: 1, span: 3}} className='setting-logo'>
              <Popover
                placement='bottom'
                title={colorSelector}
                content={iconSelector}
                trigger='click'
                overlayClassName='change-project-container'>
                {
                  projectMsg.logo
                    ? (
                      <img
                        src={`/api/file/download?id=${projectMsg.logo}`}
                        className='ui-logo'
                        style={{
                          backgroundColor:
                          constants.PROJECT_COLOR[projectMsg.color] || constants.PROJECT_COLOR.blue,
                        }}
                      />
                    )
                    : (
                      <Icon
                        type={projectMsg.icon || 'star-o'}
                        className='ui-logo'
                        style={{
                          backgroundColor:
                          constants.PROJECT_COLOR[projectMsg.color] || constants.PROJECT_COLOR.blue,
                        }}
                      />
                    )
                }
              </Popover>
            </Col>
            <Col xs={18} sm={15} lg={19} className='setting-intro'>
              <h2 className='ui-title'>
                {`${currGroup.group_name || '' } / ${ projectMsg.name || ''}`}
              </h2>
              {/* <p className="ui-desc">{projectMsg.desc}</p> */}
            </Col>
          </Row>
          <hr className='breakline' />
          <Form>
            <FormItem {...formItemLayout} label='專案ID'>
              <span>{this.props.projectMsg._id}</span>
            </FormItem>
            <FormItem {...formItemLayout} label='專案名稱'>
              {getFieldDecorator('name', {
                initialValue: initFormValues.name,
                rules: nameLengthLimit('專案'),
              })(<Input />)}
            </FormItem>
            <FormItem {...formItemLayout} label='所屬分組'>
              {getFieldDecorator('group_id', {
                initialValue: `${initFormValues.group_id }`,
                rules: [
                  {
                    required: true,
                    message: '請選擇專案所屬的分組!',
                  },
                ],
              })(
                <Select disabled={!selectDisbaled}>
                  {this.props.groupList.map((item, index) => (
                    <Option key={String(index)} value={item._id.toString()}>
                      {item.group_name}
                    </Option>
                  ))}
                </Select>,
              )}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label={(
                <span>
                  介面基本路徑&nbsp;
                  <Tooltip title='基本路徑為空表示根路徑'>
                    <Icon type='question-circle-o' />
                  </Tooltip>
                </span>
              )}>
              {getFieldDecorator('basepath', {
                initialValue: initFormValues.basepath,
                rules: [
                  {
                    required: false,
                    message: '請輸入基本路徑! ',
                  },
                ],
              })(<Input />)}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label={(
                <span>
                  MOCK地址&nbsp;
                  <Tooltip title='具體使用方法請檢視文件'>
                    <Icon type='question-circle-o' />
                  </Tooltip>
                </span>
              )}>
              <Input disabled={true} value={mockUrl} onChange={() => {}} />
            </FormItem>

            <FormItem {...formItemLayout} label='描述'>
              {getFieldDecorator('desc', {
                initialValue: initFormValues.desc,
                rules: [
                  {
                    required: false,
                  },
                ],
              })(<TextArea rows={8} />)}
            </FormItem>

            <FormItem
              {...formItemLayout}
              label={(
                <span>
                  tag 資訊&nbsp;
                  <Tooltip title='定義 tag 資訊，過濾介面'>
                    <Icon type='question-circle-o' />
                  </Tooltip>
                </span>
              )}>
              <ProjectTag ref={this.tagSubmit} tagMsg={tag} />
              {/* <Tag tagMsg={tag} ref={this.tagSubmit} /> */}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={(
                <span>
                  mock嚴格模式&nbsp;
                  <Tooltip title='開啟后 mock 請求會對 query，body form 的必須欄位和 json schema 進行校驗'>
                    <Icon type='question-circle-o' />
                  </Tooltip>
                </span>
              )}>
              {getFieldDecorator('strice', {
                valuePropName: 'checked',
                initialValue: initFormValues.strice,
              })(<Switch checkedChildren='開' unCheckedChildren='關' />)}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={(
                <span>
                  開啟json5&nbsp;
                  <Tooltip title='開啟后可在介面 body 和返回值中寫 json 欄位'>
                    <Icon type='question-circle-o' />
                  </Tooltip>
                </span>
              )}>
              {getFieldDecorator('is_json5', {
                valuePropName: 'checked',
                initialValue: initFormValues.is_json5,
              })(<Switch checkedChildren='開' unCheckedChildren='關' />)}
            </FormItem>
            <FormItem {...formItemLayout} label='預設開啟訊息通知'>
              {getFieldDecorator('switch_notice', {
                valuePropName: 'checked',
                initialValue: initFormValues.switch_notice,
              })(<Switch checkedChildren='開' unCheckedChildren='關' />)}
            </FormItem>

            <FormItem {...formItemLayout} label='許可權'>
              {getFieldDecorator('project_type', {
                rules: [
                  {
                    required: true,
                  },
                ],
                initialValue: initFormValues.project_type,
              })(
                <RadioGroup>
                  <Radio value='private' className='radio'>
                    <Icon type='lock' />私有<br />
                    <span className='radio-desc'>只有組長和專案開發者可以索引並檢視專案資訊</span>
                  </Radio>
                  <br />
                  {projectMsg.role === 'admin' && (
                    <Radio value='public' className='radio'>
                      <Icon type='unlock' />公開<br />
                      <span className='radio-desc'>任何人都可以索引並檢視專案資訊</span>
                    </Radio>
                  )}

                </RadioGroup>,
              )}
            </FormItem>
          </Form>

          <div className='btnwrap-changeproject'>
            <Button
              className='m-btn btn-save'
              icon='save'
              type='primary'
              size='large'
              onClick={this.handleOk}>
              保 存
            </Button>
          </div>

          {/* 只有組長和管理員有許可權刪除專案 */}
          {projectMsg.role === 'owner' || projectMsg.role === 'admin' ? (
            <div className='danger-container'>
              <div className='title'>
                <h2 className='content'>
                  <Icon type='exclamation-circle-o' /> 危險操作
                </h2>
                <Button onClick={this.handleToggleDangerOptions}>
                  查 看<Icon type={this.state.showDangerOptions ? 'up' : 'down'} />
                </Button>
              </div>
              {this.state.showDangerOptions ? (
                <Card hoverable={true} className='card-danger'>
                  <div className='card-danger-content'>
                    <h3>刪除專案</h3>
                    <p>專案一旦刪除，將無法恢復數據，請慎重操作！</p>
                    <p>只有組長和管理員有許可權刪除專案。</p>
                  </div>
                  <Button
                    type='danger'
                    ghost={true}
                    className='card-danger-btn'
                    onClick={this.handleShowConfirm}>
                    刪除
                  </Button>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

export default Form.create()(ProjectMessage)
