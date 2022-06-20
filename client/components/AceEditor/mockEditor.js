var ace = require('brace'),
  Mock = require('mockjs');
require('brace/mode/javascript');
require('brace/mode/json');
require('brace/mode/xml');
require('brace/mode/html');
require('brace/theme/xcode');
require('brace/ext/language_tools.js');
var json5 = require('json5');
const MockExtra = require('common/mock-extra.js');

var langTools = ace.acequire('ace/ext/language_tools'),
  wordList = [
    { name: '字串', mock: '@string' },
    { name: '自然數', mock: '@natural' },
    { name: '浮點數', mock: '@float' },
    { name: '字元', mock: '@character' },
    { name: '布爾', mock: '@boolean' },
    { name: 'url', mock: '@url' },
    { name: '域名', mock: '@domain' },
    { name: 'ip地址', mock: '@ip' },
    { name: 'id', mock: '@id' },
    { name: 'guid', mock: '@guid' },
    { name: '目前時間', mock: '@now' },
    { name: '時間戳', mock: '@timestamp' },
    { name: '日期', mock: '@date' },
    { name: '時間', mock: '@time' },
    { name: '日期時間', mock: '@datetime' },
    { name: '圖片連線', mock: '@image' },
    { name: '圖片data', mock: '@imageData' },
    { name: '顏色', mock: '@color' },
    { name: '顏色hex', mock: '@hex' },
    { name: '顏色rgba', mock: '@rgba' },
    { name: '顏色rgb', mock: '@rgb' },
    { name: '顏色hsl', mock: '@hsl' },
    { name: '整數', mock: '@integer' },
    { name: 'email', mock: '@email' },
    { name: '大段文字', mock: '@paragraph' },
    { name: '句子', mock: '@sentence' },
    { name: '單詞', mock: '@word' },
    { name: '大段中文文字', mock: '@cparagraph' },
    { name: '中文標題', mock: '@ctitle' },
    { name: '標題', mock: '@title' },
    { name: '姓名', mock: '@name' },
    { name: '中文姓名', mock: '@cname' },
    { name: '中文姓', mock: '@cfirst' },
    { name: '中文名', mock: '@clast' },
    { name: '英文姓', mock: '@first' },
    { name: '英文名', mock: '@last' },
    { name: '中文句子', mock: '@csentence' },
    { name: '中文詞組', mock: '@cword' },
    { name: '地址', mock: '@region' },
    { name: '省份', mock: '@province' },
    { name: '城市', mock: '@city' },
    { name: '地區', mock: '@county' },
    { name: '轉換為大寫', mock: '@upper' },
    { name: '轉換為小寫', mock: '@lower' },
    { name: '挑選（列舉）', mock: '@pick' },
    { name: '打亂陣列', mock: '@shuffle' },
    { name: '協議', mock: '@protocol' }
  ];

let dom = ace.acequire('ace/lib/dom');
ace.acequire('ace/commands/default_commands').commands.push({
  name: 'Toggle Fullscreen',
  bindKey: 'F9',
  exec: function(editor) {
    if (editor._fullscreen_yapi) {
      let fullScreen = dom.toggleCssClass(document.body, 'fullScreen');
      dom.setCssClass(editor.container, 'fullScreen', fullScreen);
      editor.setAutoScrollEditorIntoView(!fullScreen);
      editor.resize();
    }
  }
});

function run(options) {
  var editor, mockEditor, rhymeCompleter;
  function handleJson(json) {
    var curData = mockEditor.curData;
    try {
      curData.text = json;
      var obj = json5.parse(json);
      curData.format = true;
      curData.jsonData = obj;
      curData.mockData = () => Mock.mock(MockExtra(obj, {})); //為防止時時 mock 導致頁面卡死的問題，改成函式式需要用到再計算
    } catch (e) {
      curData.format = e.message;
    }
  }
  options = options || {};
  var container, data;
  container = options.container || 'mock-editor';
  if (
    options.wordList &&
    typeof options.wordList === 'object' &&
    options.wordList.name &&
    options.wordList.mock
  ) {
    wordList.push(options.wordList);
  }
  data = options.data || '';
  options.readOnly = options.readOnly || false;
  options.fullScreen = options.fullScreen || false;

  editor = ace.edit(container);
  editor.$blockScrolling = Infinity;
  editor.getSession().setMode('ace/mode/javascript');
  if (options.readOnly === true) {
    editor.setReadOnly(true);
    editor.renderer.$cursorLayer.element.style.display = 'none';
  }
  editor.setTheme('ace/theme/xcode');
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: false,
    enableLiveAutocompletion: true,
    useWorker: true
  });
  editor._fullscreen_yapi = options.fullScreen;
  mockEditor = {
    curData: {},
    getValue: () => mockEditor.curData.text,
    setValue: function(data) {
      editor.setValue(handleData(data));
    },
    editor: editor,
    options: options,
    insertCode: code => {
      let pos = editor.selection.getCursor();
      editor.session.insert(pos, code);
    }
  };

  function formatJson(json) {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch (err) {
      return json;
    }
  }

  function handleData(data) {
    data = data || '';
    if (typeof data === 'string') {
      return formatJson(data);
    } else if (typeof data === 'object') {
      return JSON.stringify(data, null, '  ');
    } else {
      return '' + data;
    }
  }

  rhymeCompleter = {
    identifierRegexps: [/[@]/],
    getCompletions: function(editor, session, pos, prefix, callback) {
      if (prefix.length === 0) {
        callback(null, []);
        return;
      }
      callback(
        null,
        wordList.map(function(ea) {
          return { name: ea.mock, value: ea.mock, score: ea.mock, meta: ea.name };
        })
      );
    }
  };

  langTools.addCompleter(rhymeCompleter);
  mockEditor.setValue(handleData(data));
  handleJson(editor.getValue());

  editor.clearSelection();

  editor.getSession().on('change', () => {
    handleJson(editor.getValue());
    if (typeof options.onChange === 'function') {
      options.onChange.call(mockEditor, mockEditor.curData);
    }
    editor.clearSelection();
  });
  return mockEditor;
}

/**
 * mockEditor({
      container: 'req_body_json', //dom的id
      data: that.state.req_body_json, //初始化數據
      onChange: function (d) {
        that.setState({
          req_body_json: d.text
        })
      }
    })
 */
module.exports = run;
