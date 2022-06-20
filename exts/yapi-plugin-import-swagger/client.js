import { message } from 'antd';
import run from './run';

module.exports = function() {
  this.bindHook('import_data', function(importDataModule) {
    if (!importDataModule || typeof importDataModule !== 'object') {
      console.error('importDataModule 參數Must be Object Type');
      return null;
    }
    importDataModule.swagger = {
      name: 'Swagger',
      run: async function(res) {
        try {
          return await run(res);
        } catch (err) {
          console.error(err);
          message.error('解析失敗');
        }
      },
      desc: `<p>Swagger數據匯入（ 支援 v2.0+ ）</p>
      <p>
        <a target="_blank" href="https://hellosean1025.github.io/yapi/documents/data.html#通過命令列匯入介面數據">通過命令列匯入介面數據</a>
      </p>
      `
    };
  });
};
