function exportData(exportDataModule, pid) {
    exportDataModule.swaggerjson = {
      name: 'swaggerjson',
      route: `/api/plugin/exportSwagger?type=OpenAPIV2&pid=${pid}`,
      desc: '導出專案介面文件為(Swagger 2.0)Json檔案'
    };
}

module.exports = function() {
    this.bindHook('export_data', exportData);
};