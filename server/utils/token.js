const yapi = require('../yapi')

const crypto = require('crypto');

/*
 下面是使用加密演算法
*/

// 建立加密演算法
const aseEncode = function(data, password) {

  // 如下方法使用指定的演算法與密碼來建立cipher對像
  const cipher = crypto.createCipher('aes192', password);

  // 使用該對象的update方法來指定需要被加密的數據
  let crypted = cipher.update(data, 'utf-8', 'hex');

  crypted += cipher.final('hex');

  return crypted;
};

// 建立解密演算法
const aseDecode = function(data, password) {
  /* 
   該方法使用指定的演算法與密碼來建立 decipher對像, 第一個演算法必須與加密數據時所使用的演算法保持一致;
   第二個參數用於指定解密時所使用的密碼，其參數值為一個二進制格式的字串或一個Buffer對象，該密碼同樣必須與加密該數據時所使用的密碼保持一致
  */
  const decipher = crypto.createDecipher('aes192', password);

  /*
   第一個參數為一個Buffer對像或一個字串，用於指定需要被解密的數據
   第二個參數用於指定被解密數據所使用的編碼格式，可指定的參數值為 'hex', 'binary', 'base64'等，
   第三個參數用於指定輸出解密數據時使用的編碼格式，可選參數值為 'utf-8', 'ascii' 或 'binary';
  */
  let decrypted = decipher.update(data, 'hex', 'utf-8');

  decrypted += decipher.final('utf-8');
  return decrypted;
}; 

const defaultSalt = 'abcde';

exports.getToken = function getToken(token, uid){
  if(!token)throw new Error('token 不能為空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  return aseEncode(uid + '|' + token, yapi.WEBCONFIG.passsalt)
}

exports.parseToken = function parseToken(token){
  if(!token)throw new Error('token 不能為空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  let tokens;
  try{
    tokens = aseDecode(token, yapi.WEBCONFIG.passsalt)
  }catch(e){}  
  if(tokens && typeof tokens === 'string' && tokens.indexOf('|') > 0){
    tokens = tokens.split('|')
    return {
      uid: tokens[0],
      projectToken: tokens[1]
    }
  }
  return false;
  
}

