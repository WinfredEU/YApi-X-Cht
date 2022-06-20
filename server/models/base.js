const yapi = require('../yapi.js');
const mongoose = require('mongoose');
const autoIncrement = require('../utils/mongoose-auto-increment');

/**
 * 所有的model都需要繼承baseModel, 且需要 getSchema和getName方法，不然會報錯
 */

class baseModel {
  constructor() {
    this.schema = new mongoose.Schema(this.getSchema());
    this.name = this.getName();

    if (this.isNeedAutoIncrement() === true) {
      this.schema.plugin(autoIncrement.plugin, {
        model: this.name,
        field: this.getPrimaryKey(),
        startAt: 11,
        incrementBy: yapi.commons.rand(1, 10)
      });
    }

    this.model = yapi.db(this.name, this.schema);
  }

  isNeedAutoIncrement() {
    return true;
  }

  /**
   * 可通過覆蓋此方法產生其他自增欄位
   */
  getPrimaryKey() {
    return '_id';
  }

  /**
   * 獲取collection的schema結構
   */
  getSchema() {
    yapi.commons.log('Model Class need getSchema function', 'error');
  }

  getName() {
    yapi.commons.log('Model Class need name', 'error');
  }
}

module.exports = baseModel;
