module.exports.settings = {
    _:{
        startwith:'hesap'
    },
    firstname:'hesap',
    lastname:'hesap',
    mailFormat:"hesap-{value}@gmail.com",
    getMail:(function(value){
      return this.settings.mailFormat.replace("{value}",value);
    }).bind(this),
    security:'e8f12a5193',
    captchaResponse: '03AIIukzjHKSVwOnZ-A7aPIwjemsgl7ioiwMC0TjhV9WYM6iNk-BfyIGJZvEZ-WIYxWqIKzU1n22kYPHIEoDevBHoBQmf2WTEmteGbeeyRd0n3nkDJjvSALSrNPa9_LrWz7HsCCG3VDUu8WVgFXnLWwS7HTe-7SmenlrFnh8Uvvvyn9atm7GNWRHQeKHm_HPUUH1UMTj5Sjs-2jbvPAGh5zRr8-zUDDUxJbQF8D1FwdtNU7miQU-N6dpcpjTE2Mu8tkKLFcYM3oIxb3ZirDRmQkYM4Nc5BOUhaKjlTKzX-P3SJssnLKSXeP7pfJtsGAijExZk8jBv_2T7buTPETraNawvY1tNJ2rwf951PKXKIaRwFV60EP0s81xloQ7f1whXboVRhrcUj-JJPriOd0aAzg2h_ivM9bvwcyEr2dnY5Jv1H797nHEHdPCzdLvdaDX1i0uiNU2Rs9GNlMlK7NT2nQo335sdzXTQWctCj30glhLBroSbm2kclRTRKnVpdjZTX4a_4khFjb_J6',
    defaultCookie:'_ga=GA1.2.2001243541.1666614957; _gid=GA1.2.1716179836.1666614957; wordpress_test_cookie=WP+Cookie+check; dbxu=1666622627298; __cf_bm=ZFKcqhPJMDelJk2ykYSRBEHqGbD1TtfRfZiZ7yWWpFg-1666622629-0-AV+chUbQKzAnfcCDIGZ6JObgI+QBcDL/xh8rJdM0UxOAEM6Xf5ifllnj9zxydavxCqDIMjZ1qSwOk63JExx50LJb7nzFYdiSrge2d7/YvihrgCmB8YqamtBtSIa971b/9w==',
    getCookie:(user_cookie = "") => {
      if(!user_cookie) return this.settings.defaultCookie;
      return user_cookie +';_ga=GA1.2.2001243541.1666614957; _gid=GA1.2.1716179836.1666614957; wordpress_test_cookie=WP+Cookie+check; wordpress_logged_in_a1ed0303463972fd6ff9fdafd7b70bb3=hesap-Ub0Y6%7C1667833927%7C3zJZ9HpU6Srm4dkKhJajuE7A5JTiIThYlm5NgVGCrU2%7Cc9bd89e10c41553d0ac742f31f6498d7499175612dc441d66715ccd9f677be86; dbxu=1666624343639';
    },
    hmn_vote_nonce:'c1459398fe'
};
