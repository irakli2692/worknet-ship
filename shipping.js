const rp = require('request-promise');
const http = require('http');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const circleci_working_dir='circleci/repo/';

let pool = new http.Agent();
pool.maxSockets = 100;



function requestOptions(buildNumber, token) {
    const url = `https://circleci.com/api/v1.1/project/github/liz4rdcom/worknet/${buildNumber}/artifacts?circle-token=${token}`
    
    var options = {
        uri: url,
        json: true,
        strictSSL: false
    };

    return options
}

async function downloadAndSaveArtifactItem(url,buildNumber){

    let options = {
        uri: url,
        json: false,
        strictSSL: false,
        pool: pool
    };

    try {
        let data  = await  rp(options);
        const buffer = Buffer.from(data, 'utf8');

        

        let wdirindex = options.uri.indexOf(circleci_working_dir);
        if(wdirindex===-1) throw new Error('cant find working dir');

        let pathToSave = options.uri.substring(wdirindex+circleci_working_dir.length);
        const pathToCreate = path.dirname(pathToSave);
        let fullDir = `${buildNumber}/${pathToCreate}`;
        mkdirp.sync(fullDir);
        let fullPath=`${buildNumber}/${pathToSave}`;
        console.log('saving-',fullPath);
        fs.writeFileSync(fullPath, buffer);
        return `OK-${options.uri}`;   
    } catch (error) {
        console.error(error);
        return `Error-${options.uri}`;   
    }
}

async function fetchArtifacts(buildNumber, token) {
    try {
        outDir=buildNumber;
        let response  = await  rp(requestOptions(buildNumber, token));
        
        let downloadStatus = await Promise.all(response.map(async t=>{
            return await downloadAndSaveArtifactItem(t.url,buildNumber);
        }));

        console.log('fetch artifacts done');
        return downloadStatus;
    } catch (error) {
        console.error(error);
    }
    

}

module.exports = fetchArtifacts


    