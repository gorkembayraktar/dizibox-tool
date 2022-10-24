const HELP = require('./js/help')
const action = require('./js/actions')
const file = require('./js/file')



const accounts = HELP.getAccounts();

(async function(){

    for(let account of accounts){

        const result = await action.login(account.username,account.password);

        if(result.confirm){
            await file.saveCookie(account.username, result.cookies);
            console.log((`${account.username} adlı kullanıcının cookie bilgileri kaydedildi.`));
        }else{
            console.log((`${account.username} Kullanıcı adı veye şifre hatalı.`));
        }
        await HELP.delaySec(1);
    }


    await HELP.delaySec(2);


    process.exit(0);

})();



