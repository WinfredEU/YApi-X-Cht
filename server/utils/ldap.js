const ldap = require('ldapjs');
const yapi = require('../yapi.js');
const util = require('util');

exports.ldapQuery = (username, password) => {
  // const deferred = Q.defer();

  return new Promise((resolve, reject) => {
    const { ldapLogin } = yapi.WEBCONFIG;

    //  使用ldapjs庫建立一個LDAP客戶端
    const client = ldap.createClient({
      url: ldapLogin.server
    });

    client.once('error', err => {
      if (err) {
        let msg = {
          type: false,
          message: `once: ${err}`
        };
        reject(msg);
      }
    });
    // 註冊事件處理函式
    const ldapSearch = (err, search) => {
      const users = [];
      if (err) {
        let msg = {
          type: false,
          message: `ldapSearch: ${err}`
        };
        reject(msg);
      }
      // 查詢結果事件響應
      search.on('searchEntry', entry => {
        if (entry) {
          // 獲取查詢對像
          users.push(entry.object);
        }
      });
      // 查詢錯誤事件
      search.on('error', e => {
        if (e) {
          let msg = {
            type: false,
            message: `searchErr: ${e}`
          };
          reject(msg);
        }
      });

      search.on('searchReference', referral => {
        // if (referral) {
        //   let msg = {
        //     type: false,
        //     message: `searchReference: ${referral}`
        //   };
        //   reject(msg);
        // }
        console.log('referral: ' + referral.uris.join());
      });
      // 查詢結束
      search.on('end', () => {
        if (users.length > 0) {
          client.bind(users[0].dn, password, e => {
            if (e) {
              let msg = {
                type: false,
                message: `使用者名稱或密碼不正確: ${e}`
              };
              reject(msg);
            } else {
              let msg = {
                type: true,
                message: `驗證成功`,
                info: users[0]
              };
              resolve(msg);
            }
            client.unbind();
          });
        } else {
          let msg = {
            type: false,
            message: `使用者名稱不存在`
          };
          reject(msg);
          client.unbind();
        }
      });
    };
    // 將client繫結LDAP Server
    // 第一個參數： 是使用者，必須是從根結點到使用者節點的全路徑
    // 第二個參數： 使用者密碼
    return new Promise((resolve, reject) => {
      if (ldapLogin.bindPassword) {
        client.bind(ldapLogin.baseDn, ldapLogin.bindPassword, err => {
          if (err) {
            let msg = {
              type: false,
              message: `LDAP server繫結失敗: ${err}`
            };
            reject(msg);
          }

          resolve();
        });
      } else {
        resolve();
      }
    }).then(() => {
      const searchDn = ldapLogin.searchDn;
      const searchStandard = ldapLogin.searchStandard;
      // 處理可以自定義filter
      let customFilter;
      if (/^&/gi.test(searchStandard)) {
        customFilter = util.format(searchStandard, username);
      } else {
        customFilter = `${searchStandard}=${username}`;
      }
      const opts = {
        // filter: `(${searchStandard}=${username})`,
        filter: `(${customFilter})`,
        scope: 'sub'
      };

      // 開始查詢
      // 第一個參數： 查詢基礎路徑，代表在查詢使用者資訊將在這個路徑下進行，該路徑由根結點開始
      // 第二個參數： 查詢選項
      client.search(searchDn, opts, ldapSearch);
    });
  });
};
