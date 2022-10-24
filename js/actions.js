const axios = require('axios');
const {settings} = require('./settings');
const endpoints = require('./endpoints');

const FormData = require('form-data');

const {cookieParse} = require('./help')


module.exports.createAccount = async function(account, callback,error){
  const data = new FormData();


  data.append('action', endpoints.ajaxFields.register);
  data.append('username', account.username);
  data.append('firstname', settings.firstname);
  data.append('lastname', settings.lastname);
  data.append('email', account.mail);
  data.append('password', account.password);
  data.append('password2', account.password);
  data.append('security', settings.security);
  data.append('captchaResponse', settings.captchaResponse);
  
  const config = {
    method: 'post',
    url: endpoints.ajax,
    headers: { 
      ...data.getHeaders()
    },
    data : data
  };
  
  await axios(config)
  .then(async function (response) {
    return await callback({
      status:response.status,
      data:response.data
    });
  })
  .catch(error);


}


module.exports.login = async function(username, password){

  const data = new FormData();


  data.append('action', endpoints.ajaxFields.login);
  data.append('username', username);
  data.append('password', password);
  data.append('security', settings.security);
  
  const config = {
    method: 'post',
    url: endpoints.ajax,
    headers: { 
      ...data.getHeaders(),
      'Cookie':settings.defaultCookie
    },
    data : data
  };
  
  return await axios(config)
  .then(function (response) {
    return ({
      status:response.status,
      cookies:cookieParse(response.headers['set-cookie']),
      confirm:loginResolver(response.data)
    });
  })

}


function loginResolver(response){
    return response.loggedin;
}


module.exports.like = async (vote, comment_id,cookie) => {

  const vote_nonce = await this.getVoteUniqId(cookie);

  const data = new FormData();

  data.append('action', endpoints.ajaxFields.comment_vote_callback);
  data.append('vote', vote);
  data.append('comment_id', comment_id);
  data.append('hmn_vote_nonce',vote_nonce);
  
  const config = {
    method: 'post',
    url: endpoints.ajax,
    headers: { 
      ...data.getHeaders(),
      'Cookie':(cookie)
    },
    data : data
  };
  
  return await axios(config)
  .then(function (response) {
    return ({
      status:response.status,
      data:(response.data)
    });
  }).catch(function(err){

    return {
      status:err.response.status,
      data:err.response.data
    }
  });
}


module.exports.getVoteUniqId = async function(cookie){
  
  const config = {
    method: 'get',
    url: endpoints.base,
    headers: { 
      'Cookie':(cookie)
    }
  };
  
  const html = await axios(config)
  .then(function (response) {
      return response.data;
  }).catch(function(err){

      return '';
  });

  const regex = /hmn_vote_nonce\":"([\w]+)"/gm;
  return regex.exec(html)["1"];
}
