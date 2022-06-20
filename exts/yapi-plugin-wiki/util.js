// 時間
const convert2Decimal = num => (num > 9 ? num : `0${num}`);

/**
 * 格式化 年、月、日、時、分、秒
 * @param val {Object or String or Number} 日期對像 或是可new Date的對象或時間戳
 * @return {String} 2017-01-20 20:00:00
 */
exports.formatDate = val => {
  let date = val;
  if (typeof val !== 'object') {
    date = new Date(val);
  }
  return `${[
    date.getFullYear(),
    convert2Decimal(date.getMonth() + 1),
    convert2Decimal(date.getDate())
  ].join('-')}  ${[
    convert2Decimal(date.getHours()),
    convert2Decimal(date.getMinutes()),
    convert2Decimal(date.getSeconds())
  ].join(':')}`;
};

// const json5_parse = require('../client/common.js').json5_parse;
