const ACTIONS = require('./actions');
const HELP = require('./help');
const FILE = require('./file');
const {settings} = require('./settings');



module.exports.generateAccount = async function(setting, done){

    for(let i = 0; i < setting.total; i++){
        const account = {
            username:HELP.createUsername(),
            password:HELP.createPassword(),
            mail:settings.getMail(HELP.makeid(5))
        };

        await ACTIONS.createAccount(account,successAccount.bind({current:i + 1,account:account}),errorAccount);
        
       
        await HELP.delay(setting.second * 1000);
    }

      
    setTimeout(function(){
        done();      
    },2000);
    
}


async function successAccount(response){

    console.log(response.status == 200 ? `${this.current}. Hesap oluşturuldu!` : 'Bir sorun oluştu');

    if(response.status == 200){
      await FILE.saveAccountTxt(this.account);
      return;
    }else{
      await FILE.errrTxt("Bir sorun oluştu!");
    }
}
async function errorAccount(err){
   err && await FILE.errrTxt("Bir sorun oluştu!");
}


module.exports.generateEmotion = async function( setting, done){

    const accounts = HELP.getAccounts().slice(0,setting.count);

    for(let account of accounts){
        
        let vote = setting.liked ? 'upvote' : 'downvote';

        const cookie = await HELP.getAccountCookie(account.username, account.password, true);

        if(cookie == ''){
            console.log(`${account.username} isimli kullanıcının cookie bilgisi bulunmuyor.`);      
        }else{

            const result = await ACTIONS.like(vote, setting.comment_id, cookie);

            if(result.status == 200){
                if(result.data.success){
                    console.log(`${account.username} isimli kullanıcı ${vote} olarak oy kullandı.`);
                    console.log(`UPVOTE ${result.data.data.upvote} , DOWNVOTE: ${result.data.data.downvote}`);
                }else{
                    console.log(`${account.username}: ${result.data.data.error_message}`);
                }
            }else{
                console.log(`Bağlantı kodu: ${result.status}, mesajı: ${result.data}`);
            }

           

            await HELP.delaySec(1);
        }
    }

    await HELP.delaySec(2);

    done();
}