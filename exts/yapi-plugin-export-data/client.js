// import {message} from 'antd'

function exportData(exportDataModule, pid) {
  exportDataModule.html = {
    name: 'html',
    route: `/api/plugin/export?type=html&pid=${pid}`,
    desc: '導出專案介面文件為 html 檔案'
  };
  (exportDataModule.markdown = {
    name: 'markdown',
    route: `/api/plugin/export?type=markdown&pid=${pid}`,
    desc: '導出專案介面文件為 markdown 檔案'
  }),
    (exportDataModule.json = {
      name: 'json',
      route: `/api/plugin/export?type=json&pid=${pid}`,
      desc: '導出專案介面文件為 json 檔案,可使用該檔案匯入介面數據'
    });
  // exportDataModule.pdf = {
  //     name: 'pdf',
  //     route: `/api/plugin/export?type=pdf&pid=${pid}`,
  //     desc: '導出專案介面文件為 pdf 檔案'
  // }
}

module.exports = function() {
  this.bindHook('export_data', exportData);
};
