const fs = require('fs');
const m3u8stream = require('m3u8stream')
const {crpytoToBody,secondToHumanTime} = require('./help')
const {get} = require('./request')

module.exports.molyVideoDownloand = (streamUrl, saveFileName, progress, end ) => {

    return new Promise((resolve) => {
        

        const req = m3u8stream(streamUrl,{
            requestOptions:{
                headers:{
                    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36',
                    'referer' : 'https://dbx.molystream.org'
                }
            }
        });

        let starttime,zaman = '',timeSec;

        req.on("progress",(segment, totalSegments) => {

            if(starttime){
                // 2 segment arası geçen süre
            
                if(!timeSec){
                    timeSec = (Date.now() - starttime) / 1000;
                }
                let diff = (totalSegments - segment.num) * timeSec;
                zaman = secondToHumanTime(diff);
            }

            progress(Math.floor(segment.num / totalSegments * 100),zaman); 
            
            if(!starttime){
                starttime = Date.now();
            }
        });
        
        req.on("end", () => {
            end();
            resolve();
        });
        req.pipe(fs.createWriteStream(`${saveFileName}.mp4`));

    
    })
}

module.exports.molyStreamUrlResource = async (link) => {
    let execute,response, fileSourceUrl;
    response = await get(link,{
        referer:link
    });
    const fileSourceRegex = /<!--baslik:DBX Pro-->.*src="(.+)"/gm;

    execute = fileSourceRegex.exec(response.data);

    if(!execute || !execute[1]){
        return false;
    }

    fileSourceUrl = execute[1];

    response = await get(fileSourceUrl, {
        referer:link
    });

    const fileSource2Regex = /<iframe src="([^\s]+)"/gm;

    execute = fileSource2Regex.exec(response.data);

    if(!execute || !execute[1]){
        return false;
    }

    // crypto text
    fileSourceUrl = execute[1];

    response = await get(fileSourceUrl,{
        referer:link,
        'user-agent':"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36"
    });

    const  fileSource3Regex = /decrypt\("([^"]*)","([^"]*)"/gm;
    
    execute = fileSource3Regex.exec(response.data);

 

    if(!execute || !execute[1] || !execute[2]){
        return false;
    }

    let html = crpytoToBody(execute[1],execute[2]);

    const fileSource4Regex = /setup\({\s*file:\s*'(.*)'/gm;


    execute = fileSource4Regex.exec(html);


    if(!execute || !execute[1]){
        return false;
    }

    return execute[1];
}

module.exports.molyVideoQualityDataToList = (M3UBody) => {
    const regex = /#EXT-X-STREAM-INF:BANDWIDTH=[\d]+,RESOLUTION=([\dx]+)\s(.*molystream.*)/gm;
        let m;
        const quality = [];
        while ((m = regex.exec(M3UBody)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
          
            if(m && m["1"] && m["2"]){
                quality.push({
                    size:m["1"],
                    url:(m["2"]).trim()
                })
            }

        }
        return quality;
}

module.exports.molyStreamUrlQuality = async (molyStreamUrlResourceUrl) => {
    return await get(molyStreamUrlResourceUrl,{
        referer: molyStreamUrlResourceUrl,
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36'
    }).then(response => {
        return this.molyVideoQualityDataToList(response.data);
    }).catch(x => {
        return [];
    });
}

module.exports.molyVideoQuality = async (link) => {
    const url =  await this.molyStreamUrlResource(link);

    if(!url){
        console.log('bir hata oluştu.');
        return [];
    }
    return await this.molyStreamUrlQuality(url);
}
