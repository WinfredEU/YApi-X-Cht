/**
 * Created by gxl.gao on 2017/10/25.
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import './index.scss';
// import { withRouter } from 'react-router-dom';
import { Row, Col, Tooltip, Icon } from 'antd';
import { setBreadcrumb } from 'client/reducer/modules/user';
import StatisChart from './StatisChart';
import StatisTable from './StatisTable';

const CountOverview = props => (
  <Row type="flex" justify="space-start" className="m-row">
    <Col className="gutter-row" span={6}>
      <span>
        分組總數
        <Tooltip placement="rightTop" title="統計yapi中一共開啟了多少可見的公共分組">
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.date.groupCount}</h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        專案總數
        <Tooltip placement="rightTop" title="統計yapi中建立的所有專案總數">
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.date.projectCount}</h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        介面總數
        <Tooltip placement="rightTop" title="統計yapi所有專案中的所有介面總數">
          {/*<a href="javascript:void(0)" className="m-a-help">?</a>*/}
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.date.interfaceCount}</h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        測試介面總數
        <Tooltip placement="rightTop" title="統計yapi所有專案中的所有測試介面總數">
          {/*<a href="javascript:void(0)" className="m-a-help">?</a>*/}
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.date.interfaceCaseCount}</h2>
    </Col>
  </Row>
);

CountOverview.propTypes = {
  date: PropTypes.object
};

const StatusOverview = props => (
  <Row type="flex" justify="space-start" className="m-row">
    <Col className="gutter-row" span={6}>
      <span>
        操作系統型別
        <Tooltip
          placement="rightTop"
          title="操作系統型別,返回值有'darwin', 'freebsd', 'linux', 'sunos' , 'win32'"
        >
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.data.systemName}</h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        cpu負載
        <Tooltip placement="rightTop" title="cpu的總負載情況">
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.data.load} %</h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        系統空閑記憶體總量 / 記憶體總量
        <Tooltip placement="rightTop" title="系統空閑記憶體總量 / 記憶體總量">
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">
        {props.data.freemem} G / {props.data.totalmem} G{' '}
      </h2>
    </Col>
    <Col className="gutter-row" span={6}>
      <span>
        郵箱狀態
        <Tooltip placement="rightTop" title="檢測配置檔案中配置郵箱的狀態">
          <Icon className="m-help" type="question-circle" />
        </Tooltip>
      </span>
      <h2 className="gutter-box">{props.data.mail}</h2>
    </Col>
  </Row>
);

StatusOverview.propTypes = {
  data: PropTypes.object
};

@connect(
  null,
  {
    setBreadcrumb
  }
)
class statisticsPage extends Component {
  static propTypes = {
    setBreadcrumb: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      count: {
        groupCount: 0,
        projectCount: 0,
        interfaceCount: 0,
        interfactCaseCount: 0
      },
      status: {
        mail: '',
        systemName: '',
        totalmem: '',
        freemem: '',
        uptime: ''
      },
      dataTotal: []
    };
  }

  async componentWillMount() {
    this.props.setBreadcrumb([{ name: '系統資訊' }]);
    this.getStatisData();
    this.getSystemStatusData();
    this.getGroupData();
  }

  // 獲取統計數據
  async getStatisData() {
    let result = await axios.get('/api/plugin/statismock/count');
    if (result.data.errcode === 0) {
      let statisData = result.data.data;
      this.setState({
        count: { ...statisData }
      });
    }
  }

  // 獲取系統資訊

  async getSystemStatusData() {
    let result = await axios.get('/api/plugin/statismock/get_system_status');
    if (result.data.errcode === 0) {
      let statusData = result.data.data;
      this.setState({
        status: { ...statusData }
      });
    }
  }

  // 獲取分組詳細資訊

  async getGroupData() {
    let result = await axios.get('/api/plugin/statismock/group_data_statis');
    if (result.data.errcode === 0) {
      let statusData = result.data.data;
      statusData.map(item => {
        return (item['key'] = item.name);
      });
      this.setState({
        dataTotal: statusData
      });
    }
  }

  render() {
    const { count, status, dataTotal } = this.state;

    return (
      <div className="g-statistic">
        <div className="content">
          <h2 className="title">系統狀況</h2>
          <div className="system-content">
            <StatusOverview data={status} />
          </div>
          <h2 className="title">數據統計</h2>
          <div>
            <CountOverview date={count} />
            <StatisTable dataSource={dataTotal} />
            <StatisChart />
          </div>
        </div>
      </div>
    );
  }
}

export default statisticsPage;
