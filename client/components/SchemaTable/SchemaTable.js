import React, { Component } from 'react';
import { Table } from 'antd';
import json5 from 'json5';
import PropTypes from 'prop-types';
import { schemaTransformToTable } from '../../../common/shema-transformTo-table.js';
import _ from 'underscore';
import './index.scss';

const messageMap = {
  desc: '備註',
  default: '實例',
  maximum: '最大值',
  minimum: '最小值',
  maxItems: '最大數量',
  minItems: '最小數量',
  maxLength: '最大長度',
  minLength: '最小長度',
  enum: '列舉',
  enumDesc: '列舉備註',
  uniqueItems: '元素是否都不同',
  itemType: 'item 型別',
  format: 'format',
  itemFormat: 'format',
  mock: 'mock'
};

const columns = [
  {
    title: '名稱',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '型別',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    render: (text, item) => {
      // console.log('text',item.sub);
      return text === 'array' ? (
        <span>{item.sub ? item.sub.itemType || '' : 'array'} []</span>
      ) : (
        <span>{text}</span>
      );
    }
  },
  {
    title: '是否必須',
    dataIndex: 'required',
    key: 'required',
    width: 80,
    render: text => {
      return <div>{text ? '必須' : '非必須'}</div>;
    }
  },
  {
    title: '預設值',
    dataIndex: 'default',
    key: 'default',
    width: 80,
    render: text => {
      return <div>{_.isBoolean(text) ? text + '' : text}</div>;
    }
  },
  {
    title: '備註',
    dataIndex: 'desc',
    key: 'desc',
    render: (text, item) => {
      return _.isUndefined(item.childrenDesc) ? (
        <span className="table-desc">{text}</span>
      ) : (
        <span className="table-desc">{item.childrenDesc}</span>
      );
    }
  },
  {
    title: '其他資訊',
    dataIndex: 'sub',
    key: 'sub',
    width: 180,
    render: (text, record) => {
      let result = text || record;

      return Object.keys(result).map((item, index) => {
        let name = messageMap[item];
        let value = result[item];
        let isShow = !_.isUndefined(result[item]) && !_.isUndefined(name);

        return (
          isShow && (
            <p key={index}>
              <span style={{ fontWeight: '700' }}>{name}: </span>
              <span>{value.toString()}</span>
            </p>
          )
        );
      });
    }
  }
];

class SchemaTable extends Component {
  static propTypes = {
    dataSource: PropTypes.string
  };

  constructor(props) {
    super(props);
  }

  render() {
    let product;
    try {
      product = json5.parse(this.props.dataSource);
    } catch (e) {
      product = null;
    }
    if (!product) {
      return null;
    }
    let data = schemaTransformToTable(product);
    data = _.isArray(data) ? data : [];
    return <Table bordered size="small" pagination={false} dataSource={data} columns={columns} />;
  }
}
export default SchemaTable;
