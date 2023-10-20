const inquirer = require('inquirer');
const figlet = require('figlet');

const fs = require('fs');

const HELP = require('./js/help');
const {login,
    like,
    createAccount, 
    getComments,
    movieVote,
    isMoviePage,
    movieSearch,
    movieSeasons,
    movieSeasonParts
} = require('./js/actions');
const file = require('./js/file');
const {settings} = require('./js/settings');

const stream = require('./js/stream');

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
                    {name:"Dizi İndir", value:'dizi_indir'},
                    {name:'Hesap Oluştur', value:"hesap_olustur"},
                    {name:'Yoruma Oy Ver', value:"yoruma_oy_ver"},
                    {name:'Diziye Oy Ver', value:"diziye_oy_ver"},
                    {name:'Hesap Seç', value:"hesap_sec"},
                    {name:'Hesapları Listele', value:"hesap_listele"},
                    {name:'Hesap Sayısı', value:"hesap_sayisi"}
                ]
            }
    ])
    .then(async (answers) => {

            switch(answers.islem){

                case 'dizi_indir':
                    await dizi_indir();
                break;

                case 'hesap_sec':
                    await HesapSec();
                break;

                case 'diziye_oy_ver':
                    await DiziyeOyVer();
                break;

                case "yoruma_oy_ver":
                    await emojiv2();
                break;

                case 'hesap_sayisi':
                    const count = HELP.getAccountsCount();
                    console.log(`\n ${count} hesap var. \n`);
                    question();
                break;
                case 'hesap_listele':
                    const accounts = HELP.getAccounts();
                    console.table(accounts);
                    question()
                break;
                
                case 'hesap_olustur':
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

async function DiziyeOyVer(){
    const {url} =  await inquirer
        .prompt([{
                    type:'prompt',
                    message:`Dizibox link giriniz :`,
                    name:'url',
                    validate: function(url){
                        const done = this.async();
                        if(HELP.isValidURL(url) && url.toLowerCase().includes('dizibox')){
                            done(null, true);
                        }else{
                            done('Geçerli bir url giriniz');
                        }
                    }
                },
                
    ]);

    const check = await isMoviePage(url);

    if(!check.status){
        console.log("Link geçersiz!");
        question();
        return;
    }

    const accounts = HELP.getAccounts();
    const count = accounts.length;

    const {total} = await (inquirer
        .prompt([
                {
                    type: 'prompt',
                    name:'total',
                    message:`Kaç adet oy göndermek istiyorsunuz ? (En fazla : ${count}) :`,
                    validate: function(id){
                        const done = this.async();
                        if(!HELP.isNumeric(id)){
                            done('Geçerli bir süre giriniz');
                        }else if(id < 0 || id > count){
                            done(`Lütfen 0 ile ${count} aralığında bir değer giriniz!`);
                        }
                        else{
                            done(null, true);
                        }
                    }
                }
    ]));


    const {vote,type,delay} = await (
            inquirer
            .prompt([
                {
                    type:'list',
                    message:'Emoji tipi',
                    name:'vote',
                    choices:[
                        {name:"Diziyi Beğendim!",value:1},
                        {name:"Diziyi Beğenmedim!",value:-1}
                    ],
                },
                {
                    type:'list',
                    message:'Liste Seçimi',
                    name:'type',
                    choices:[
                        {name:`ilk ${total} hesabı kullan`,value:'first'},
                        {name:`son ${total} hesabı kullan`,value:'last'},
                        {name:`rastgele ${total} hesabı kullan`,value:'random'}
                    ]
                },
                {
                    type:'prompt',
                    message:`Zaman aşımı 2 işlem arası bekleme süresi (ms) :`,
                    name:'delay',
                    validate: function(id){

                        const done = this.async();

                        if(HELP.isNumeric(id)){
                            done(null, true);
                        }else{
                            done('Geçerli bir süre giriniz');
                        }
                    }
                }
            ])
    );



    const acc = {
        first : function(){
                return accounts.slice(total * -1);
        },
        last: function(){
            return accounts.slice(0,total);
        },
        random : function(){
            if(total == 0) return [];
            return HELP.shuffle(accounts).slice(0,total);
        }
    }

    const list = acc[type]();



    for(let account of list){
        const cookie = await HELP.getAccountCookie(account.username,account.password, true);
        const eko = await movieVote(url,check.post_id,vote,cookie);

        if(eko.status){
            console.log(`${account.username} adlı kullanıcı diziye ${vote} oy kullandı. Dizi ortalaması ${eko.data.percentage} oldu.`);
        }else{
            console.log(eko.data);
        }

        await HELP.delay(delay);
    }

    await HELP.delaySec(1);

    question();
    
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

async function emojiv2(){

       const {url} =  await inquirer
        .prompt([{
                    type:'prompt',
                    message:`Dizibox link giriniz :`,
                    name:'url',
                    validate: function(url){
                        const done = this.async();

                        if(HELP.isValidURL(url) && url.toLowerCase().includes('dizibox')){
                            done(null, true);
                        }else{
                            done('Geçerli bir url giriniz');
                        }
                    }
                },
                
        ]);

    
       await comments(url);
        
        
}


async function comments(url){
    const result = await getComments(url);

    if(!result.status){
        console.log(result.message);
        return;
    }

    const choices = result.comments.map(user => ({name :`${user.username} : ${user.comment.substring(0,70).concat("...")} \t ( ${user.time} )` , 'value': user.comment_id}));

    if(result.prev || result.next){
        choices.push( new inquirer.Separator() );
        choices.push( new inquirer.Separator() );
    }

    if(result.prev){
        choices.push({
            name:'Bir önceki sayfa',
            value:'prev'
        });
    }

    if(result.next){
        choices.push({
            name:'Bir sonraki sayfa',
            value:'next'
        });
    }

    if(result.prev || result.next){
        choices.push( new inquirer.Separator() );
        choices.push( new inquirer.Separator() );
    }
    const {comment} = await inquirer
    .prompt([{
                type:'list',
                message:`Yorum Seçiniz`,
                name:'comment',
                choices: choices
            }
    ]);

    if(comment == 'next'){
        return comments(result.next);
    }

    if(comment == 'prev'){
        return comments(result.prev);
    }

    const accounts = HELP.getAccounts();
    const count = accounts.length;

    const {total} = await (inquirer
        .prompt([
                {
                    type: 'prompt',
                    name:'total',
                    message:`Kaç adet oy göndermek istiyorsunuz ? (En fazla : ${count}) :`,
                    validate: function(id){
                        const done = this.async();
                        if(!HELP.isNumeric(id)){
                            done('Geçerli bir süre giriniz');
                        }else if(id < 0 || id > count){
                            done(`Lütfen 0 ile ${count} aralığında bir değer giriniz!`);
                        }
                        else{
                            done(null, true);
                        }
                    }
                }
        ]));
    
    const {vote,type,delay} = await (
            inquirer
            .prompt([
                {
                    type:'list',
                    message:'Emoji tipi',
                    name:'vote',
                    choices:[
                        {name:"Yorumu Beğendim!",value:1},
                        {name:"Yorumu Beğenmedim!",value:-1}
                    ],
                },
                {
                    type:'list',
                    message:'Liste Seçimi',
                    name:'type',
                    choices:[
                        {name:`ilk ${total} hesabı kullan`,value:'first'},
                        {name:`son ${total} hesabı kullan`,value:'last'},
                        {name:`rastgele ${total} hesabı kullan`,value:'random'}
                    ]
                },
                {
                    type:'prompt',
                    message:`Zaman aşımı 2 işlem arası bekleme süresi (ms) :`,
                    name:'delay',
                    validate: function(id){

                        const done = this.async();

                        if(HELP.isNumeric(id)){
                            done(null, true);
                        }else{
                            done('Geçerli bir süre giriniz');
                        }
                    }
                }
            ])
    );

   
    
    const acc = {
        first : function(){
                return accounts.slice(total * -1);
        },
        last: function(){
            return accounts.slice(0,total);
        },
        random : function(){
            if(total == 0) return [];
            return HELP.shuffle(accounts).slice(0,total);
        }
    }

    const list = acc[type]();

 

    for(let account of list){
        const cookie = await HELP.getAccountCookie(account.username,account.password, true);
        const eko = await like(vote, comment,  cookie);


        if(eko.status == 200){
            if(eko.data.success){
                console.log(`${account.username} isimli kullanıcı ${vote} olarak oy kullandı.`);
                console.log(`UPVOTE ${eko.data.data.upvote} , DOWNVOTE: ${eko.data.data.downvote}`);
            }else{
                console.log(`${account.username}: ${eko.data.data.error_message}`);
            }
        }else{
            console.log(`HATA! Bağlantı kodu: ${eko.status}, mesajı: ${eko.data}`);
            console.log(`${account.username}: Cookie bağlantısı, `, cookie);
        }

        await HELP.delay(delay);
    }

    await HELP.delaySec(1);

    question();
}

let enjected = false;



async function dizi_indir(){
    
    if(!enjected){
        inquirer.registerPrompt(
            'autocomplete',
            require('inquirer-autocomplete-prompt')
        );
        enjected = true;
    }

    const {dizi} = await inquirer
    .prompt([
      {
        type: 'autocomplete',
        name: 'dizi',
        message: 'Dizi adını arayınız : ',
        source: async function(answersSoFar, input) {
         if(input && input.length > 0){
            const data = await movieSearch(input);
            
            if(data.length > 0)
                return data.map(item => ({value:item,name:item.post_title}));

            return [];
         }
          return []
        },
      },
    ]);

    const secim = await dizi_indir_secim();
    if(secim == 'CHAPTER'){
        await SezonSecimi(dizi.permalink);
    }else if(secim == 'ALL_SEASON'){
        await TumSezonlar(dizi.permalink, dizi.post_title);
    }
        

}

async function dizi_indir_secim(){
    const { choice } = await (
        inquirer
        .prompt([
            {
                type:'list',
                message:'İndirme seçeneği:',
                name:'choice',
                choices:[
                    {name:"Tüm Sezonlar",value:"ALL_SEASON"},
                    {name:"Bölüm Seçimi",value:"CHAPTER" }
                ]
            }
        ]));
    return choice;
 
}

async function TumSezonlar(url, movie_name){
    const seasons = await movieSeasons(url);

    if(!seasons){
        console.log("Bilgilere ulaşılamadı");
        question();
        return;
     }

    let totalChapter = 0;
    for(let i = 0; i < seasons.length;i++){
        seasons[i].parts =  await movieSeasonParts(seasons[i].url);
        totalChapter +=  seasons[i].parts.length;
    }

    const {confirm} = await inquirer.prompt([
        {
            type:'confirm',
            name:'confirm',
            message:`Toplam: ${seasons.length} Sezon, ${totalChapter} bölümden oluşuyor. Tümünü indirmek istiyor musunuz?`
        }
     ]);
    
    if(!confirm){
        question();
        return;
    }
   
 
    const source = await getSource(seasons[0].parts[0].url);

    const qualities = await getQualities(source);
    seasons[0].parts[0].qualities = qualities;
   
    const {quality} = await inquirer.prompt([
       {
           type:'list',
           name:'quality',
           message:'Hangi kalitede indirmek istiyorsunuz? ',
           choices: qualities.map(i => ({name:i.size,value:{url: i.url, size:i.size}}))
       }
    ]);


    // tüm kaynakları kontrol et
    const ui = new inquirer.ui.BottomBar();
    const anim = ['/',"|","\\","-"];
    let counter = 0;
    let tickInterval = setInterval(() => {
        ui.updateBottomBar(`${anim[counter++ % anim.length]} Tüm kaynaklar kontrol ediliyor..`);
    },250);
    //await HELP.delaySec(1);

    for(let i = 0; i < seasons.length;i++){
        for( let k=0; k < seasons[i].parts.length; k++){
            if( i == 0 && k == 0 ){
                continue;
            }
            const s = await getSource(seasons[i].parts[k].url);
            seasons[i].parts[k].qualities = await getQualities(s);
            if(!seasons[i].parts[k].qualities.find(n => n.size == quality.size)){
                // bölüm çözünürlüğüne erişilemedi

                clearInterval(tickInterval);
                ui.updateBottomBar('');
                ui.close();

                console.log("cozunurluk bulunamadı.");
                question();

                return;
            }
        }
    }

    ui.log.write("Kontrol sağlandı, indirilme başlatılıyor..");
    // güncelleme textini durdur
    clearInterval(tickInterval);

    if(!fs.existsSync("./videos")){
        fs.mkdirSync("./videos");
    }
    // slug
    const slugMovie = HELP.slugify(movie_name);
  
    // klasör oluştur
    if(!fs.existsSync(`./videos/${slugMovie}`)){
        fs.mkdirSync(`./videos/${slugMovie}`);
    }
    let chapterCounter = 0;
    for(let i = 0; i < seasons.length;i++){
        // klasör oluştur
        if(!fs.existsSync(`./videos/${slugMovie}/Sezon-${i + 1}`)){
            fs.mkdirSync(`./videos/${slugMovie}/Sezon-${i + 1}`);
        }
        for( let k=0; k < seasons[i].parts.length; k++){
            chapterCounter++;

            let filename = `./videos/${slugMovie}/Sezon-${i + 1}/Bolum-${k + 1}`;

            let selectedSize =  seasons[i].parts[k].qualities.find(m => m.size == quality.size)
           
            await stream.molyVideoDownloand(
                selectedSize.url,
                filename,
                function(percantage, humanTime){
                    ui.updateBottomBar(`(${chapterCounter}/${totalChapter}) ${movie_name}, Sezon ${i + 1}, Bölüm ${k + 1} indiriliyor.(${percantage}%)(${humanTime})`);
                   
                },function(){
                    ui.log.write(`${movie_name}, Sezon ${i + 1}, Bölüm ${k + 1}. İndirme işlemi tamamlandı, dosya yolu : ${filename}.mp4`);
                    ui.updateBottomBar('');
                }   
            );
          
            
        }
    }

    ui.updateBottomBar('');
    ui.log.write(`${movie_name} tüm sezonlar indirildi.`);
    ui.close();

    question();
}

async function SezonSecimi(url){
    const seasons = await movieSeasons(url);

     if(!seasons){
        console.log("Bilgilere ulaşılamadı");
        question();
        return;
     }

    const {season} = await inquirer.prompt([
        {
            type:'list',
            name:'season',
            message:'Sezonu seçiniz',
            choices:seasons.map(season => ({value:season.url,name:season.text}))
        }
     ]);

     await SezonPartSecimi(url,season)
}

async function SezonPartSecimi(url,season){
    const parts = await movieSeasonParts(season);

     if(!parts){
        console.log("Part Bilgilerine ulaşılamadı");
        question();
        return;
     }
     const {part} = await inquirer.prompt([
        {
            type:'list',
            name:'part',
            message:'Bölümü Seçiniz',
            choices:parts.map(season => ({value:season.url,name:season.text})).concat([
                new inquirer.Separator(),
                {name:'Geri git',value:'prev'}
            ])
        }
     ]);

     if(part == 'prev'){
        SezonSecimi(url)
        return;
     }

     const {confirm} = await inquirer.prompt([
        {
            type:'confirm',
            name:'confirm',
            message:'Bölümü indirmek istiyor musunuz? '
        }
     ]);

     if(!confirm){
        question();
        return;
     }

     const source = await getSource(part);


     const qualities = await getQualities(source);
    
     const {quality} = await inquirer.prompt([
        {
            type:'list',
            name:'quality',
            message:'Hangi kalitede indirmek istiyorsunuz? ',
            choices: qualities.map(i => ({name:i.size,value:i.url}))
        }
     ]);
     
     let replay;
     let filename;
     do{
        replay = false;

        const f = await inquirer.prompt([
            {
                type:'prompt',
                name:'filename',
                message:'Dosya adını giriniz (mp4 olarak kaydedilecektir.)',
                validate:function(name){
                    const done = this.async();
                    if(name){
                        name = name.replace(".mp4","");
                    }
                    if(name && name.length >= 3){
                        done(null, true);
                    }else{
                        done('Lütfen 3 karakter ve üzeri bir dosya adı giriniz');
                    }
                }
            }
        ]);
        
        filename = 'videos/'+f.filename.replace(".mp4","");

        if(fs.existsSync(filename)){

            const {confirm} = await inquirer.prompt([
                {
                    type:'confirm',
                    name:'confirm',
                    message:'Böyle bir dosya var üzerine yazmak istiyor musunuz? '
                }
            ]);
        
            replay = !confirm;
        }

    }while(replay);


    if(!fs.existsSync("./videos")){
        fs.mkdirSync("./videos");
    }

    await DiziKaydet(quality,filename);
  
}

async function getSource(link){
  //dizi kaynağını getir
  const ui = new inquirer.ui.BottomBar();
  const anim = ['/',"|","\\","-"];
  let counter = 0;
  let tickInterval = setInterval(() => {
      ui.updateBottomBar(`${anim[counter++ % anim.length]} Video kaynağına ulaşılıyor.`);
  },250);
  //await HELP.delaySec(1);
  const result = await stream.molyStreamUrlResource(link);
  clearInterval(tickInterval);
  ui.updateBottomBar('');
  ui.close();
  return result;
}
async function getQualities(link){
  //dizi kaynağını getir
  const ui = new inquirer.ui.BottomBar();
  const anim = ['/',"|","\\","-"];
  let counter = 0;
  let tickInterval = setInterval(() => {
      ui.updateBottomBar(`${anim[counter++ % anim.length]} Video kaliteleri getiriliyor`);
  },250);

  const result = await stream.molyStreamUrlQuality(link);

  clearInterval(tickInterval);
  ui.updateBottomBar('');
  ui.close();

  return result;
}

async function DiziKaydet(url,filename){

    const ui = new inquirer.ui.BottomBar();
  
    ui.updateBottomBar("İndirme işlemi başlatılıyor..");


    await stream.molyVideoDownloand(
        url,
        filename,
        function(percantage, humanTime){
            ui.updateBottomBar(`( ${percantage}% ) indiriliyor, yaklaşık ${humanTime} kaldı.`);
        },function(){
            ui.log.write(`İndirme işlemi tamamlandı, dosya yolu : ${filename}.mp4`);
            ui.updateBottomBar('');
            ui.close();
            question();
        }   
    );

}


})();