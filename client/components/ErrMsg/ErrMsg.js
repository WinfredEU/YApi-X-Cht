import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'antd';
import './ErrMsg.scss';
import { withRouter } from 'react-router';

/**
 * 錯誤資訊提示
 *
 * @component ErrMsg
 * @examplelanguage js
 *
 * * 錯誤資訊提示元件
 * * 錯誤資訊提示元件
 *
 *
 */

/**
 * 標題
 * 一般用於描述錯誤資訊名稱
 * @property title
 * @type string
 * @description 一般用於描述錯誤資訊名稱
 * @returns {object}
 */
@withRouter
class ErrMsg extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    type: PropTypes.string,
    history: PropTypes.object,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    desc: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    opration: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };

  render() {
    let { type, title, desc, opration } = this.props;
    let icon = 'frown-o';
    if (type) {
      switch (type) {
        case 'noFollow':
          title = '你還沒有關注專案呢';
          desc = (
            <span>
              先去 <a onClick={() => this.props.history.push('/group')}>「專案廣場」</a> 逛逛吧,
              那裡可以新增關注。
            </span>
          );
          break;
        case 'noInterface':
          title = '該專案還沒有介面呢';
          desc = '在左側 「介面列表」 中新增介面';
          break;
        case 'noMemberInProject':
          title = '該專案還沒有成員呢';
          break;
        case 'noMemberInGroup':
          title = '該分組還沒有成員呢';
          break;
        case 'noProject':
          title = '該分組還沒有專案呢';
          desc = <span>請點選右上角新增專案按鈕新建專案</span>;
          break;
        case 'noData':
          title = '暫無數據';
          desc = '先去別處逛逛吧';
          break;
        case 'noChange':
          title = '沒有改動';
          desc = '該操作未改動 Api 數據';
          icon = 'meh-o';
          break;
        default:
          console.log('default');
      }
    }
    return (
      <div className="err-msg">
        <Icon type={icon} className="icon" />
        <p className="title">{title}</p>
        <p className="desc">{desc}</p>
        <p className="opration">{opration}</p>
      </div>
    );
  }
}

export default ErrMsg;
