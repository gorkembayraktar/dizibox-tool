const fs = require('fs');
const {settings} = require('./settings');
const action = require('./actions');
const file = require('./file')

const CryptoJS = require("crypto-js");

module.exports.makeid = function (len) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < len; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.createUsername = function(){
  return settings._.startwith.concat("-").concat(this.makeid(5));
}

module.exports.createPassword = function(){
  return this.makeid(8);
}

module.exports.delay = async function(delay){
   return new Promise((resolve) => {
        setTimeout(function(){
            resolve(1); 
        },delay)
   });
}

module.exports.delaySec = async function(delay){
  return this.delay(delay * 1000);
}

module.exports.getAccounts = function(){
  
  const accountsData = fs.readFileSync('accounts.txt', 'utf-8');


  const accounts = accountsData.split('\n')
  .filter(data => data != "")
  .map(data =>{
      const f = data.split('\t');
      return {
          username:f[1],
          password:f[2],
          mail:f[3]
      }
  });

  return accounts;
}

module.exports.getAccountsCount = () => {
  const accouts = this.getAccounts();

  return accouts.length;
}

module.exports.cookieParse = (set_cookies = []) => {
  if( ! (set_cookies instanceof Array)){
    return '';
  }
  let cookie = set_cookies.map(cookie => {
      const list = cookie.split(';');
      return list[0];
  }).filter((key,index,l)=>{
     return l.indexOf(key) == index
  })
  return cookie.join(';');
}


module.exports.getAccountCookie = async (username, password, login = false) => {
  let path = 'cookies/'+username+'.txt';

  if (await fs.existsSync(path)) {
      let data =  fs.readFileSync(path, 'utf-8');

      if(data){
        const list = data.split(';');
        if(list[1]) 
          return list[1];
      }
  }
  
  if(login){

     const result = await action.login(username,password);

     if(result.confirm){
         await file.saveCookie(username, result.cookies);
         return this.getAccountCookie(username, password, false);
     }
  }
  return '';
}

module.exports.isNumeric = (value) => {
  return /^-?\d+$/.test(value);
}

module.exports.isValidURL = (string)  => {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null)
};

module.exports.shuffle = (array)  => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

module.exports.crpytoToBody = (cryptText, key) => {
    let bytes = CryptoJS.AES.decrypt(cryptText,key);
    return bytes.toString(CryptoJS.enc.Utf8);
}


module.exports.secondToHumanTime = (second) => {
  second = Math.floor(second);
  let saat = 60 * 60;
  let dakika = 60;

  if(second >= saat){
    let saatkaldi = Math.floor(second / saat);
    second = second - (saatkaldi * saat);
    let dakikakaldi = Math.floor(second / dakika);
    second = second - (dakika * dakikakaldi);
    return `${saatkaldi} saat ${dakikakaldi} dakika ${second} saniye`;
  }else if(second >= dakika){
    let dakikakaldi = Math.floor(second / dakika);
    second = second - (dakika * dakikakaldi);
    return `${dakikakaldi} dakika ${second} saniye`;
  }else{
    return `${second} saniye`;
  }
}

module.exports.slugify = (str) => {
  return String(str)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
}