'use strict';

const {generateAccount} = require('../js/process')



const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


console.log('\x1b[33m DİZİBOX GENERATORE HOŞ GELDİNİZ!!!! \x1b[0m');
rl.question('kaç adet hesap oluşturmak istiyorsunuz? ', function (totalCount) {

    rl.question("Hesapları kaç saniye aralıklarla oluşturmak istiyorsunuz? ", function(delay){

        console.log(`\x1b[33m HESAPLAR OLUŞTURULUYOR \x1b[0m`);

        generateAccount({
          total:totalCount,
          delay:delay
        },function(){
          
            process.exit(0);
        });

    });
});

rl.on('close', function () {
  process.exit(0);
});


//
