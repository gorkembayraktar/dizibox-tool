'use strict';

const p = require('../js/process');
const {getAccountsCount,isNumeric} = require('../js/help')

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


console.log('\x1b[33m DİZİBOX GENERATORE HOŞ GELDİNİZ!!!! \x1b[0m');


rl.question("Yorum id'sini giriniz ", function(comment_id){

    comment_id = comment_id.trim();

    rl.question(`Bu yorumu beğendiniz mi? (y/n) `, function(status = 'y'){
        status = status.trim();

        const liked = status == 'y';

       const max_like_count = getAccountsCount();

   

        rl.question(`Kaç adet göndermek istiyorsunuz? (En fazla: ${max_like_count}) `, function(count){
            
            count = count.trim();

            if(!(isNumeric(count))){
                console.log("Geçerli sayı girilmediğinden iptal edilidi");
                process.exit(0);
            }


            if(count > max_like_count) count = max_like_count;
            else if(count < 0) count = 0;
            
            p.generateEmotion({
                comment_id,
                liked,
                count
            },function(){

                process.exit(0);
                
            });

        });
        
    });
    
});


rl.on('close', function () {
  process.exit(0);
});


//
