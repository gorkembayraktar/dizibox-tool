const axios = require('axios');
const {settings} = require('./settings');
const endpoints = require('./endpoints');

const FormData = require('form-data');

const help = require('./help')

const {get,post} = require('./request');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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


module.exports.login = async (username, password) => {

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
  .then(
    (function (response) {

      return {
        status:response.status,
        cookies:help.cookieParse(response.headers['set-cookie']),
        confirm:this.loginResolver(response.data)
      };
    }).bind(this)
  ).catch(function(err){
    console.log(err)
     return {
      confirm: false,
      status: err.response.status
     }
  });

}


module.exports.loginResolver = (response) => {
    return response.loggedin;
}


module.exports.like = async (vote, comment_id,cookie) => {

  if(vote == 1){
    vote = 'upvote';
  }else if(vote == -1 || vote == 0){
    vote = 'downvote';
  }
  

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



module.exports.getComments = async function(link){

    if(!help.isValidURL(link)){
      return {
        status:false,
        message:'Geçerli bir url girilmedi'
      }
    }

    const response = await get(link);



    if(response.status == 200){

      const dom = new JSDOM(response.data);

      const document = dom.window.document;

      
      const ol = document.querySelector(".comment-list.list-unstyled");
      const list = ol.getElementsByTagName("li");

      const comments = [];

      for(let item of list){
        const comment_id = item.querySelector("a").getAttribute("name").replace("comment-","");
        const username =  item.querySelector("span").textContent.toString().replace(new RegExp("\t|\n", "g"),"");
        const comment =   item.querySelector(".comment-entry").textContent.toString().replace(new RegExp("\t|\n", "g"),"");
        const time = item.querySelector("time").getAttribute("datetime");

        comments.push({
          comment_id,
          username,
          comment,
          time
        });
      }


      const pagination = document.querySelector("#comment-nav-below");
      let next = null, prev= null;
      if(pagination){
        const nextPage = pagination.querySelector(".next.page-numbers");
        if(nextPage){
          next = nextPage.getAttribute('href');
        }
        const prevPage = pagination.querySelector('.prev.page-numbers');
        if(prevPage){
          prev =prevPage.getAttribute('href');
        }
      }

      return {
        status: true,
        comments,
        next: next,
        prev: prev
      }
    }

    return {
      status: false,
      error: response.data,
      message: 'Bağlantı başarısız oldu, durum kodu : '+ response.status
    }


}



module.exports.movieVote = async (link, post_id, vote, cookie = '') => {

  const response = await get(link,{Cookie: cookie});

  const regexOnce = /var wv_data = {"ajaxurl":"https:\\\/\\\/.+\\\/wp-admin\\\/admin-ajax\.php","nonce":"([\w]+)"};/gm;

  const n1 =  regexOnce.exec(response.data);

  const nonce = n1["1"];

  if(!nonce){
    return {
        status : false,
        message: 'Lütfen geçerli bir adres giriniz. [nonce]'
    };
  }

  const vote_type = vote == 1 ? 'vote-positive' : 'vote-negative';

  return await post(endpoints.ajax,[
    {key:'action', value: 'add-vote'},
    {key:'nonce', value: nonce},
    {key:'post_id', value:post_id},
    {key:'vote_type', value: vote_type}
  ],
  {
    'Cookie': cookie
  });
  
}

module.exports.isMoviePage = async (link) => {
    const response = await get(link);

    const regex = /\/wp-json\/wp\/v2\/posts\/([\d]+)/gm;

    const result = regex.exec(response.data);

    if(!result || !result["1"]){
      return {
          status : false,
          message: 'Lütfen geçerli bir adres giriniz. [postid]'
      };
    }

    const post_id = result["1"];

    return {
      status : true,
      post_id
    }

}


module.exports.movieSearch = async (search) => {
  
  const data = await get(endpoints.searchUrl(search),{
    referer: endpoints.base,
    cookie:'_gid=GA1.2.424664200.1666614770; isTrustedUser=true; dbxu=1666856999136;'
  });

  if(data.status == 200){
    return data.data.results;
  }
  return [];
}

module.exports.movieSeasons = async (url) => {

  const response = await get(url,{
    referer: url
  });

  if(response.status != 200)
    return false;



  try{
  
    const dom = new JSDOM(response.data);

    const document = dom.window.document;

    const item = document.querySelector('#seasons-list');
    
    const list = item.getElementsByTagName("a");

 
    return [...list].map( item => ({
      url:item.getAttribute('href'),
      text:item.textContent
    }));

  
  }catch(Exception){

  }
  
  return false;
}

module.exports.movieSeasonParts = async (url) => {
  const response = await get(url,{
    referer: url
  });

  if(response.status != 200)
    return false;


  try{
  
    const dom = new JSDOM(response.data);

    const document = dom.window.document;


    const posts = document.querySelector("#category-posts");
  
    const articles = posts.getElementsByTagName("article");

    return [...articles].map(item =>{

      const title = item.querySelector(".post-title").querySelector('a');

      return {
        url:title.getAttribute('href'),
        text: title.textContent
      }
    });

  }catch(Exception){

  }
  
  return false;
}