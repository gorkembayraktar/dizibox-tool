const inquirer = require('inquirer');
const figlet = require('figlet');

const HELP = require('./js/help');
const {login,like,createAccount} = require('./js/actions');
const file = require('./js/file');
const {settings} = require('./js/settings');

console.clear();

(async function(){



figlet.text('DIZIBOX TOOL',function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data);

    next2();
});



function next2(){

    inquirer
    .prompt([
            {
                type:'list',
                message:'İşlem Seçimi :',
                name:'islem',
                choices:[
                    "Hesap Oluştur",
                    "Yoruma Oy Gönder",
                    "Mevcut Hesap Sayısı",
                    "Hesap Seç",
                    "Hesapları Listele"
                ]
            }
    ])
    .then(async (answers) => {

            switch(answers.islem){
                case 'Hesap Seç':
                    await HesapSec();
                break;

                case "Yoruma Oy Gönder":
                    await emoji();
                break;

                case 'Mevcut Hesap Sayısı':
                    const count = HELP.getAccountsCount();
                    console.log(`Toplam ${count} hesap bulundu.`);
                    question();
                break;
                case 'Hesapları Listele':
                    const accounts = HELP.getAccounts();
                    console.table(accounts);
                    question()
                break;
                
                case 'Hesap Oluştur':
                    HesapOlustur();
                break;


            }
        })
        .catch((error) => {
        if (error.isTtyError) {
           
        } else {
           
        }
    });

}


function HesapSec(){

    const accounts = HELP.getAccounts();

    inquirer
    .prompt([
            {
                type:'list',
                message:`Hesap Seçimi (${accounts.length}) :`,
                name:'hesap',
                choices: accounts.map(a => a.username)
            },
            {
                type:'list',
                message:'Yapacağınız işlem :',
                name:'islem',
                choices:[
                    "Cookie Bilgisini Güncelle (Re-login) :",
                    "Yoruma Emoji Gönder",
                    "Hesap Bilgilerini Görüntüle",
                    new inquirer.Separator(),
                    "Geri Git",
                    "Anasayfa"
                ]
            }
    ])
    .then(async (answers) => {
            const account = accounts.find(a => a.username == answers.hesap);

            switch(answers.islem){
                case 'Cookie Bilgisini Güncelle (Re-login) :':
                    relogin(account);
                break;
                case 'Yoruma Emoji Gönder':
                    emojiOnly(account);
                break;

                case "Hesap Bilgilerini Görüntüle":
                    console.table(account);
                    console.log(`Toplam ${accounts.length} hesap listelendi.`);
                    question();
                break;

                case "Geri Git":
                    console.clear();
                    HesapSec();
                break;

                case "Anasayfa":
                    next2();
                break;
            }


           
        })
        .catch((error) => {
        if (error.isTtyError) {
           
        } else {
           
        }
    });


    async function relogin(account){
        const response = await login(account.username,account.password);
      
        if(response.confirm){
            await file.saveCookie(account.username,response.cookies);
            console.log("Cookie bilgileri kaydedildi.");
        }else{
            console.log("Bağlantı başarısız oldu, durum kodu:"+response.status);
        }

        question();
    }

}

function HesapOlustur(){
    inquirer
    .prompt([
            {
                type:'prompt',
                message:`Kaç hesap oluşturmak istiyorsunuz? (rakamsal) :`,
                name:'count',
                validate: function(id){
                    return HELP.isNumeric(id)
                }
            },
            {
                type:'prompt',
                message:`İki hesap arası bekleme süresi? (milisaniye) :`,
                name:'ms',
                validate: function(id){
                    return HELP.isNumeric(id)
                }
            }
    ])
    .then(async (answers)=>{

        async function successAccount(response){

            console.log(response.status == 200 ? `${this.current}. Hesap oluşturuldu! [${this.account.username}]` : 'Bir sorun oluştu');
        
            if(response.status == 200){
              await file.saveAccountTxt(this.account);
              return;
            }else{
              await file.errrTxt("Bir sorun oluştu!");
            }
        }
        async function errorAccount(err){
           err && await file.errrTxt("Bir sorun oluştu!");
        }

        for(let i = 0; i < answers.count; i++){

            const account = {
                username:HELP.createUsername(),
                password:HELP.createPassword(),
                mail:settings.getMail(HELP.makeid(5))
            };

            await createAccount(account,successAccount.bind({current:i + 1,account}),errorAccount);

            await HELP.delay(answers.ms);

        }

        await HELP.delay(1000);

        question();
        
       
    });


}



function question(){
    inquirer
    .prompt([
            {
                type:'list',
                message:`Durum`,
                name:'cevap',
                choices:[
                    "Anasayfa'ya git",
                    "Çıkış yap"
                ]
            }
    ])
    .then(async (answers) => {
           
        if(answers.cevap == "Anasayfa'ya git"){
            next2();
        }
           
    })
    .catch((error) => {
        if (error.isTtyError) {
           
        } else {
           
        }
    });
}


function emojiOnly(account){

    inquirer
    .prompt([
            {
                type:'prompt',
                message:`Yorumu id'sini giriniz (rakamsal) :`,
                name:'comment_id',
                validate: function(id){
                    return HELP.isNumeric(id)
                }
            },
            {
                type:'list',
                message:'Emoji tipi',
                name:'vote',
                choices:[
                    "Like",
                    "Dislike"
                ],
            }
    ])
    .then(async (answers) => {
        const vote = answers.vote == 'Like' ? 1 : -1;
        const result = await like(vote, answers.comment_id,await HELP.getAccountCookie(account.username,account.password, true) );
        
        if(result.status == 200){
            if(result.data.success){
                console.log(`${account.username} isimli kullanıcı ${answers.vote} olarak oy kullandı.`);
                console.log(`UPVOTE ${result.data.data.upvote} , DOWNVOTE: ${result.data.data.downvote}`);
            }else{
                console.log(`${account.username}: ${result.data.data.error_message}`);
            }
        }else{
            console.log(`HATA! Bağlantı kodu: ${result.status}, mesajı: ${result.data}`);
        }

        question();

    })
 
}


async function emoji(){
    const accounts = HELP.getAccounts();
    const count = accounts.length;


    const answers = await (inquirer
    .prompt([
            {
                type: 'prompt',
                name:'total',
                message:`Kaç adet oy göndermek istiyorsunuz ? (En fazla : ${count}) :`,
                validate: function(id){
                    return HELP.isNumeric(id) && id >= 0 && id <= count
                }
            }
    ]).then(function(answers){
        return answers;
    }));

    inquirer
    .prompt([{
                type:'prompt',
                message:`Yorumu id'sini giriniz (rakamsal) :`,
                name:'comment_id',
                validate: function(id){
                    return HELP.isNumeric(id)
                }
            },
            {
                type:'list',
                message:'Emoji tipi',
                name:'vote',
                choices:[
                    "Yorumu Beğendim!",
                    "Yorumu Beğenmedim!"
                ],
            },
            {
                type:'list',
                message:'Liste Seçimi',
                name:'type',
                choices:[
                    `ilk ${answers.total} hesabı kullan`,
                    `son ${answers.total} hesabı kullan`,
                    `rastgele ${answers.total} hesabı kullan`
                ]
            },
            {
                type:'prompt',
                message:`Zaman aşımı 2 işlem arası bekleme süresi (ms) :`,
                name:'delay',
                validate: function(id){
                    return HELP.isNumeric(id)
                }
            },
            
    ])
    .then(async (anw2) => {
        
        const acc = {
            [`son ${answers.total} hesabı kullan`] : function(){
                    return accounts.slice(answers.total * -1);
            },
            [`ilk ${answers.total} hesabı kullan`]  : function(){
                return accounts.slice(0,answers.total);
            },
            [`rastgele ${answers.total} hesabı kullan`] : function(){
                if(answers.total == 0) return [];
                return HELP.shuffle(accounts).slice(0,answers.total);
            }
        }

        const list = acc[anw2.type]();
        const vote = anw2.vote == 'Yorumu Beğendim!' ? 1 : -1;

        for(let account of list){
            const cookie = await HELP.getAccountCookie(account.username,account.password, true);
            const result = await like(vote,anw2.comment_id,  cookie);

            if(result.status == 200){
                if(result.data.success){
                    console.log(`${account.username} isimli kullanıcı ${anw2.vote} olarak oy kullandı.`);
                    console.log(`UPVOTE ${result.data.data.upvote} , DOWNVOTE: ${result.data.data.downvote}`);
                }else{
                    console.log(`${account.username}: ${result.data.data.error_message}`);
                }
            }else{
                console.log(`HATA! Bağlantı kodu: ${result.status}, mesajı: ${result.data}`);
                console.log(`${account.username}: Cookie bağlantısı, `, cookie);
            }

            await HELP.delay(anw2.delay);


        }

        await HELP.delaySec(1);

        question();


    })
 
}


})();