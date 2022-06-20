import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { Modal, Collapse, Row, Col, Input, message, Button, Icon } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { withRouter } from 'react-router';
import { fetchInterfaceColList } from '../../../../../reducer/modules/interfaceCol';

const { TextArea } = Input;
const Panel = Collapse.Panel;

@connect(
  state => ({
    interfaceColList: state.interfaceCol.interfaceColList
  }),
  {
    fetchInterfaceColList
  }
)
@withRouter
export default class AddColModal extends Component {
  static propTypes = {
    visible: PropTypes.bool,
    interfaceColList: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    match: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    caseName: PropTypes.string
  };

  state = {
    visible: false,
    addColName: '',
    addColDesc: '',
    id: 0,
    caseName: ''
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.props.fetchInterfaceColList(this.props.match.params.id);
    this.setState({ caseName: this.props.caseName });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ id: nextProps.interfaceColList[0]._id });
    this.setState({ caseName: nextProps.caseName });
  }

  addCol = async () => {
    const { addColName: name, addColDesc: desc } = this.state;
    const project_id = this.props.match.params.id;
    const res = await axios.post('/api/col/add_col', { name, desc, project_id });
    if (!res.data.errcode) {
      message.success('新增集合成功');
      await this.props.fetchInterfaceColList(project_id);

      this.setState({ id: res.data.data._id });
    } else {
      message.error(res.data.errmsg);
    }
  };

  select = id => {
    this.setState({ id });
  };

  render() {
    const { interfaceColList = [] } = this.props;
    const { id } = this.state;
    return (
      <Modal
        className="add-col-modal"
        title="新增到集合"
        visible={this.props.visible}
        onOk={() => this.props.onOk(id, this.state.caseName)}
        onCancel={this.props.onCancel}
      >
        <Row gutter={6} className="modal-input">
          <Col span="5">
            <div className="label">介面用例名：</div>
          </Col>
          <Col span="15">
            <Input
              placeholder="請輸入介面用例名稱"
              value={this.state.caseName}
              onChange={e => this.setState({ caseName: e.target.value })}
            />
          </Col>
        </Row>
        <p>請選擇新增到的集合：</p>
        <ul className="col-list">
          {interfaceColList.length ? (
            interfaceColList.map(col => (
              <li
                key={col._id}
                className={`col-item ${col._id === id ? 'selected' : ''}`}
                onClick={() => this.select(col._id)}
              >
                <Icon type="folder-open" style={{ marginRight: 6 }} />
                {col.name}
              </li>
            ))
          ) : (
            <span>暫無集合，請新增！</span>
          )}
        </ul>
        <Collapse>
          <Panel header="新增新集合">
            <Row gutter={6} className="modal-input">
              <Col span="5">
                <div className="label">集合名：</div>
              </Col>
              <Col span="15">
                <Input
                  placeholder="請輸入集合名稱"
                  value={this.state.addColName}
                  onChange={e => this.setState({ addColName: e.target.value })}
                />
              </Col>
            </Row>
            <Row gutter={6} className="modal-input">
              <Col span="5">
                <div className="label">簡介：</div>
              </Col>
              <Col span="15">
                <TextArea
                  rows={3}
                  placeholder="請輸入集合描述"
                  value={this.state.addColDesc}
                  onChange={e => this.setState({ addColDesc: e.target.value })}
                />
              </Col>
            </Row>
            <Row type="flex" justify="end">
              <Button style={{ float: 'right' }} type="primary" onClick={this.addCol}>
                添 加
              </Button>
            </Row>
          </Panel>
        </Collapse>
      </Modal>
    );
  }
}
