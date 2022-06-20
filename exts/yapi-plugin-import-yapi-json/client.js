import { message } from 'antd';

function importData(importDataModule) {
  async function run(res) {
    try {
      let interfaceData = { apis: [], cats: [] };
      res = JSON.parse(res);
      res.forEach(item => {
        interfaceData.cats.push({
          name: item.name,
          desc: item.desc
        });
        item.list.forEach(api => {
          api.catname = item.name;
        });
        interfaceData.apis = interfaceData.apis.concat(item.list);
      });
      return interfaceData;
    } catch (e) {
      console.error(e);
      message.error('數據格式有誤');
    }
  }

  if (!importDataModule || typeof importDataModule !== 'object') {
    console.error('importDataModule 參數Must be Object Type');
    return null;
  }

  importDataModule.json = {
    name: 'json',
    run: run,
    desc: 'YApi介面 json數據匯入'
  };
}

module.exports = function() {
  this.bindHook('import_data', importData);
};
