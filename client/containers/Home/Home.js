import './Home.scss';
import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Button, Icon, Card } from 'antd';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import LogoSVG from '../../components/LogoSVG/index.js';
import { changeMenuItem } from '../../reducer/modules/menu';
const plugin = require('client/plugin.js');

const ThirdLogin = plugin.emitHook('third_login');
const HomeGuest = () => (
  <div className="g-body">
    <div className="m-bg">
      <div className="m-bg-mask m-bg-mask0" />
      <div className="m-bg-mask m-bg-mask1" />
      <div className="m-bg-mask m-bg-mask2" />
      <div className="m-bg-mask m-bg-mask3" />
    </div>
    <div className="main-one">
      <div className="container">
        <Row>
          <Col span={24}>
            <div className="home-header">
              <a href="#" className="item">
                YAPI
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://hellosean1025.github.io/yapi"
                className="item"
              >
                使用文件
              </a>
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg={9} xs={24}>
            <div className="home-des">
              <div className="logo">
                <LogoSVG length="72px" />
                <span className="name">YAPI</span>
              </div>
              <div className="detail">
                高效、易用、功能強大的API管理平臺<br />
                <span className="desc">旨在為開發、產品、測試人員提供更優雅的介面管理服務</span>
              </div>
              <div className="btn-group">
                <Link to="/login">
                  <Button type="primary" className="btn-home btn-login">
                    登錄 / 註冊
                  </Button>
                </Link>
                {ThirdLogin != null ? <ThirdLogin /> : null}
              </div>
            </div>
          </Col>
          <Col lg={15} xs={0} className="col-img">
            <div className="img-container">
              
            </div>
          </Col>
        </Row>
      </div>
    </div>
    <div className="feat-part section-feature">
      <div className="container home-section">
        <h3 className="title">為API開發者設計的管理平臺</h3>
        <span className="desc">
          YApi讓介面開發更簡單高效，讓介面的管理更具可讀性、可維護性，讓團隊協作更合理。
        </span>
        <Row key="feat-motion-row">
          <Col span={8} className="section-item" key="feat-wrapper-1">
            <Icon type="appstore-o" className="img" />
            <h4 className="title">專案管理</h4>
            <span className="desc">提供基本的專案分組，專案管理，介面管理功能</span>
          </Col>
          <Col span={8} className="section-item" key="feat-wrapper-2">
            <Icon type="api" className="img" />
            <h4 className="title">介面管理</h4>
            <span className="desc">
              友好的介面文件，基於websocket的多人協作介面編輯功能和類postman測試工具，讓多人協作成倍提升開發效率
            </span>
          </Col>
          <Col span={8} className="section-item" key="feat-wrapper-3">
            <Icon type="database" className="img" />
            <h4 className="title">MockServer</h4>
            <span className="desc">基於Mockjs，使用簡單功能強大</span>
          </Col>
        </Row>
      </div>
    </div>
    <div className="feat-part m-mock m-skew home-section">
      <div className="m-skew-bg">
        <div className="m-bg-mask m-bg-mask0" />
        <div className="m-bg-mask m-bg-mask1" />
        <div className="m-bg-mask m-bg-mask2" />
      </div>
      <div className="container skew-container">
        <h3 className="title">功能強大的 Mock 服務</h3>
        <span className="desc">你想要的 Mock 服務都在這裡</span>
        <Row className="row-card">
          <Col lg={12} xs={24} className="section-card">
            <Card title="Mock 規則">
              <p className="mock-desc">
                通過學習一些簡單的 Mock
                模板規則即可輕鬆編寫介面，這將大大提高定義介面的效率，並且無需為編寫 Mock 數據煩惱:
                所有的數據都可以實時隨機產生。
              </p>
              <div className="code">
                <ol start="1">
                  <li className="item">
                    <span className="orderNum orderNum-first">1</span>
                    <span>
                      <span>&#123;&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">2</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">
                        &quot;errcode|200-500&quot;
                      </span>
                      <span>
                        :&ensp;<span className="number">200</span>,&ensp;&ensp;
                      </span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">3</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">&quot;errmsg|4-8&quot;</span>
                      <span>:&ensp;</span>
                      <span className="string">&quot;@string&quot;</span>
                      <span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">4</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">&quot;data&quot;</span>
                      <span>:&ensp;&#123;&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">5</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;<span className="string">
                        &quot;boolean|1&quot;
                      </span>
                      <span>:&ensp;</span>
                      <span className="keyword">true</span>
                      <span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">6</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;<span className="string">
                        &quot;array|2&quot;
                      </span>
                      <span>
                        :&ensp;&#91;<span className="string">&quot;Bob&quot;</span>,&ensp;<span className="string">
                          &quot;Jim&quot;
                        </span>&#93;,&ensp;&ensp;
                      </span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">7</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;<span className="string">
                        &quot;combine&quot;
                      </span>
                      <span>:&ensp;</span>
                      <span className="string">&quot;@boolean&ensp;&amp;&ensp;@array&quot;</span>
                      <span>&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="item">
                    <span className="orderNum">8</span>
                    <span>&ensp;&ensp;&ensp;&ensp;&#125;&ensp;&ensp;</span>
                  </li>
                  <li className="item">
                    <span className="orderNum orderNum-last">9</span>
                    <span>&#125;&ensp;&ensp;</span>
                  </li>
                </ol>
              </div>
            </Card>
          </Col>
          <Col lg={12} xs={24} className="section-card mock-after">
            <Card title="產生的 Mock 數據">
              <p className="mock-desc">
                產生的 Mock 數據可以直接用 ajax
                請求使用，也可以通過伺服器代理使用（不需要修改專案一行程式碼）
              </p>
              <div className="code">
                <ol start="1">
                  <li className="alt">
                    <span className="orderNum orderNum-first">1</span>
                    <span>
                      <span>&#123;&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="">
                    <span className="orderNum">2</span>
                    <span>
                      &ensp;&ensp;<span className="string">&quot;errcode&quot;</span>
                      <span>:&ensp;</span>
                      <span className="number">304</span>
                      <span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="alt">
                    <span className="orderNum">3</span>
                    <span>
                      &ensp;&ensp;<span className="string">&quot;errmsg&quot;</span>
                      <span>:&ensp;</span>
                      <span className="string">&quot;JtkMIoRu)N#ie^h%Z77[F)&quot;</span>
                      <span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="">
                    <span className="orderNum">4</span>
                    <span>
                      &ensp;&ensp;<span className="string">&quot;data&quot;</span>
                      <span>:&ensp;&#123;&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="alt">
                    <span className="orderNum">5</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">&quot;boolean&quot;</span>
                      <span>:&ensp;</span>
                      <span className="keyword">true</span>
                      <span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="">
                    <span className="orderNum">6</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">&quot;array&quot;</span>
                      <span>
                        :&ensp;
                      </span>&#91;<span className="string">&quot;Bob&quot;</span>,&ensp;<span className="string">
                        &quot;Jim&quot;
                      </span>,&ensp;<span className="string">&quot;Bob&quot;</span>,&ensp;<span className="string">
                        &quot;Jim&quot;
                      </span>&#93;<span>,&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="alt">
                    <span className="orderNum">7</span>
                    <span>
                      &ensp;&ensp;&ensp;&ensp;<span className="string">&quot;combine&quot;</span>
                      <span>:&ensp;</span>
                      <span className="string">
                        &quot;true & Bob,&ensp;Jim,&ensp;Bob,&ensp;Jim&quot;
                      </span>
                      <span>&ensp;&ensp;</span>
                    </span>
                  </li>
                  <li className="">
                    <span className="orderNum">8</span>
                    <span>&ensp;&ensp;&#125;&ensp;&ensp;</span>
                  </li>
                  <li className="alt">
                    <span className="orderNum orderNum-last">9</span>
                    <span>&#125;&ensp;&ensp;</span>
                  </li>
                </ol>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
    <div className="home-section section-manage">
      <div className="container">
        <Row className="row-card" style={{ marginBottom: '.48rem' }}>
          <Col lg={7} xs={10} className="section-card">
            <Card>
              <div className="section-block block-first">
                <h4>超級管理員(* N)</h4>
                <p className="item"> - 建立分組</p>
                <p className="item"> - 分配組長</p>
                <p className="item"> - 管理所有成員資訊</p>
              </div>
              <div className="section-block block-second">
                <h4>組長(* N)</h4>
                <p className="item"> - 建立專案</p>
                <p className="item"> - 管理分組或專案的資訊</p>
                <p className="item"> - 管理開發者與成員</p>
              </div>
              <div className="section-block block-third">
                <h4>開發者(* N) / 成員(* N)</h4>
                <p className="item"> - 不允許建立分組</p>
                <p className="item"> - 不允許修改分組或專案資訊</p>
              </div>
            </Card>
          </Col>
          <Col lg={17} xs={14} className="section-card manage-word">
            <Icon type="team" className="icon" />
            <h3 className="title">扁平化管理模式</h3>
            <p className="desc">
              介面管理的邏輯較為複雜，操作頻率高，層層審批將嚴重拖慢生產效率，因此傳統的金字塔管理模式並不適用。
            </p>
            <p className="desc">
              YAPI
              將扁平化管理模式的思想引入到產品的許可權管理中，超級管理員擁有最高的許可權，並將許可權分配給若干組長，超級管理員只需管理組長即可，實際上管理YAPI各大分組與專案的是「組長」。組長對分組或專案負責，一般由BU負責人/專案負責人擔任。
            </p>
          </Col>
        </Row>
      </div>
    </div>
  </div>
);
HomeGuest.propTypes = {
  introList: PropTypes.array
};

@connect(
  state => ({
    login: state.user.isLogin
  }),
  {
    changeMenuItem
  }
)
@withRouter
class Home extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    if (this.props.login) {
      this.props.history.push('/group/261');
    }
  }

  componentDidMount() {}
  static propTypes = {
    introList: PropTypes.array,
    login: PropTypes.bool,
    history: PropTypes.object,
    changeMenuItem: PropTypes.func
  };
  toStart = () => {
    this.props.changeMenuItem('/group');
  };
  render() {
    return (
      <div className="home-main">
        <HomeGuest introList={this.props.introList} />
        <div className="row-tip">
          <div className="container">
            <div className="tip-title">
              <h3 className="title">準備好使用了嗎？</h3>
              <p className="desc">註冊賬號盡請使用吧，檢視使用文件瞭解更多資訊</p>
            </div>
            <div className="tip-btns">
              <div className="btn-group">
                <Link to="/login">
                  <Button type="primary" className="btn-home btn-login">
                    登錄 / 註冊
                  </Button>
                </Link>
                <Button className="btn-home btn-home-normal">
                  <a target="_blank" rel="noopener noreferrer" href="https://hellosean1025.github.io/yapi">
                    使用文件
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Home.defaultProps={
//   introList:[{
//     title:"介面管理",
//     des:"滿足你的所有介面管理需求。不再需要為每個專案搭建獨立的介面管理平臺和編寫離線的介面文件，其許可權管理和專案日誌讓協作開發不再痛苦。",
//     detail:[
//       {title:"團隊協作",des:"多成員協作，掌握專案進度",iconType:"team"},
//       {title:"許可權管理",des:"設定每個成員的操作許可權",iconType:"usergroup-add"},
//       {title:"專案日誌",des:"推送專案情況，掌握更新動態",iconType:"schedule"}
//     ],
//     img:"./image/demo-img.jpg"
//   },{
//     title:"介面測試",
//     des:"一鍵即可得到返回結果。根據使用者的輸入介面資訊如協議、URL、介面名、請求頭、請求參數、mock規則產生Mock介面，這些介面會自動產生模擬數據。",
//     detail:[
//       {title:"編輯介面",des:"團隊開發時任何人都可以在許可權許可下建立、修改介面",iconType:"tags-o"},
//       {title:"mock請求",des:"建立者可以自由構造需要的數據，支援複雜的產生邏輯",iconType:"fork"}
//     ],
//     img:"./image/demo-img.jpg"
//   }
//   ]
// };

export default Home;
