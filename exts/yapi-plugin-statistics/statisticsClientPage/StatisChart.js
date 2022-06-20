/**
 * Created by gxl.gao on 2017/10/25.
 */
import React, { Component } from 'react';
// import PropTypes from 'prop-types'
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Spin } from 'antd';
class StatisChart extends Component {
  static propTypes = {};

  constructor(props) {
    super(props);
    this.state = {
      showLoading: true,
      chartDate: {
        mockCount: 0,
        mockDateList: []
      }
    };
  }

  componentWillMount() {
    this.getMockData();
  }

  // 獲取mock 請求次數資訊
  async getMockData() {
    let result = await axios.get('/api/plugin/statismock/get');
    if (result.data.errcode === 0) {
      let mockStatisData = result.data.data;
      this.setState({
        showLoading: false,
        chartDate: { ...mockStatisData }
      });
    }
  }

  render() {
    const width = 1050;
    const { mockCount, mockDateList } = this.state.chartDate;

    return (
      <div>
        <Spin spinning={this.state.showLoading}>
          <div className="statis-chart-content">
            <h3 className="statis-title">mock 介面訪問總數為：{mockCount.toLocaleString()}</h3>
            <div className="statis-chart">
              <LineChart
                width={width}
                height={300}
                data={mockDateList}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="_id" />
                <YAxis />
                <CartesianGrid strokeDasharray="7 3" />
                <Tooltip />
                <Legend />
                <Line
                  name="mock統計值"
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </div>
            <div className="statis-footer">過去3個月mock介面呼叫情況</div>
          </div>
        </Spin>
      </div>
    );
  }
}

export default StatisChart;
