#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const request = require('request');
const path = require('path');
const fs = require('fs');
const unzip = require("unzip");
const program = require('commander');
const version = require('./package.json').version;

const dir = process.cwd();
const local = __dirname;

const filepath = path.join(local, 'fpm-plugin-dev-template.zip');

const downloadUrl = 'https://github.com/team4yf/fpm-plugin-dev-template/archive/master.zip';

program.version(version);

const rename = (plugin) => {
    fs.rename('fpm-plugin-dev-template-master', 'fpm-plugin-' + (plugin || 'noname'), (err) => {
        if(err) console.log(err)
    })
}

const unzipProject = (pluginName) => {
    fs.createReadStream(filepath)
        .pipe(unzip.Extract({ path: '.' }))
        .on('close', () => {
            rename(pluginName)
        })
}

const download = () =>{
    return new Promise( (rs, rj) => {
      request(downloadUrl)
        .on('response', function(response) {
            if(response.statusCode == 200){
                console.log('Donwload Finished~');
            }else{
                console.log('ERROR! please try again');
                rj(0);
            }
        })
        .on('complete', function(){
          console.log('Now You Should Type :  yarn && yarn run dev ');
          rs(1);
          
        })
        .pipe(fs.createWriteStream(filepath))
    })
}
program.command('init')
    .description('Init the fpm plugin project')
    .action(function(options) {
        const pluginName = options
        if(fs.existsSync(filepath)){
            unzipProject(pluginName);
            return;
        }
      console.log('Downloading : ' + downloadUrl);   
      download()
        .then(data => {
            unzipProject(pluginName);
        })
        .catch(err => {
            console.log(err);
        })
    });


program.parse(process.argv);
