const fs = require('fs');

module.exports.saveAccountTxt = function(account){

    const str = [
      (new Date).toString(),
      account.username,
      account.password,
      account.mail
    ].join('\t') + "\n";
  
    fs.appendFile('accounts.txt', str, function (err) {
      if (err) throw err;
    });

}
module.exports.errrTxt = function(message){
    const str = (new Date).toString() + "\t" + message;
    fs.appendFile('errors.txt', str, function (err) {
      if (err) throw err;
    });
  }


module.exports.saveCookie = async function(filename,cookie){
  await fs.writeFileSync(`cookies/${filename}.txt`, cookie);
}