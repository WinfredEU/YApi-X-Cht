import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'antd';
import axios from 'axios';

const Option = Select.Option;

/**
 * 使用者名稱輸入框自動完成元件
 *
 * @component UsernameAutoComplete
 * @examplelanguage js
 *
 * * 使用者名稱輸入框自動完成元件
 * * 使用者名稱輸入框自動完成元件
 *
 *s
 */

/**
 * 獲取自動輸入的使用者資訊
 *
 * 獲取子元件state
 * @property callbackState
 * @type function
 * @description 型別提示：支援陣列傳值；也支援用函式格式化字串：函式有兩個參數(scale, index)；
 * 受控屬性：滑塊滑到某一刻度時所展示的刻度文字資訊。如果不需要標籤，請將該屬性設定為 [] 空列表來覆蓋預設轉換函式。
 * @returns {object} {uid: xxx, username: xxx}
 * @examplelanguage js
 * @example
 * onUserSelect(childState) {
 *   this.setState({
 *     uid: childState.uid,
 *     username: childState.username
 *   })
 * }
 *
 */
class UsernameAutoComplete extends Component {
  constructor(props) {
    super(props);
    // this.lastFetchId = 0;
    // this.fetchUser = debounce(this.fetchUser, 800);
  }

  state = {
    dataSource: [],
    fetching: false
  };

  static propTypes = {
    callbackState: PropTypes.func
  };

  // 搜索回撥
  handleSearch = value => {
    const params = { q: value };
    // this.lastFetchId += 1;
    // const fetchId = this.lastFetchId;
    this.setState({ fetching: true });
    axios.get('/api/user/search', { params }).then(data => {
      // if (fetchId !== this.lastFetchId) { // for fetch callback order
      //   return;
      // }
      const userList = [];
      data = data.data.data;

      if (data) {
        data.forEach(v =>
          userList.push({
            username: v.username,
            id: v.uid
          })
        );
        // 取回搜索值后，設定 dataSource
        this.setState({
          dataSource: userList
        });
      }
    });
  };

  // 選中候選詞時
  handleChange = value => {
    this.setState({
      dataSource: [],
      // value,
      fetching: false
    });
    this.props.callbackState(value);
  };

  render() {
    let { dataSource, fetching } = this.state;

    const children = dataSource.map((item, index) => (
      <Option key={index} value={'' + item.id}>
        {item.username}
      </Option>
    ));

    // if (!children.length) {
    //   fetching = false;
    // }
    return (
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        placeholder="請輸入使用者名稱"
        filterOption={false}
        optionLabelProp="children"
        notFoundContent={fetching ? <span style={{ color: 'red' }}> 目前使用者不存在</span> : null}
        onSearch={this.handleSearch}
        onChange={this.handleChange}
      >
        {children}
      </Select>
    );
  }
}

export default UsernameAutoComplete;
