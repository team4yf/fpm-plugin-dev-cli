#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const unzip = require("unzip");
const program = require('commander');
const version = require('./package.json').version;
const download = require('download-git-repo');

const dir = process.cwd();
const local = __dirname;
const TEMPLATE_DIR = path.join(local, 'template', 'fpm-plugin');
const TEMPLATE_PKG_PATH = path.join(TEMPLATE_DIR, 'package.json');

const GIT_REP = 'team4yf/fpm-plugin-dev-template';

program.version(version);

const deletedir = (dir) => {
    if(!fs.existsSync(dir)) {
        return
    }
    let files = []
    files = fs.readdirSync(dir)
    files.forEach((file, index) => {
        let curPath = path.join(dir, file)
        if(fs.statSync(curPath).isDirectory()) { // recurse
            deletedir(curPath)
        } else { // delete file
            fs.unlinkSync(curPath)
        }
    })
    fs.rmdirSync(dir)
}

const copydir = (src, dest) => {
    fs.mkdirSync(dest)
    let files = fs.readdirSync(src)
    let readable, writable, curPath, destPath
    files.forEach(file => {
        curPath = path.join(src, file)
        destPath = path.join( dest, file)
        if(fs.statSync(curPath).isDirectory()) { // recurse
            copydir(curPath, destPath)
        } else {
            fs.copyFileSync(curPath, destPath)
        }
    })

}


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

program.command('update')
    .description('update the fpm plugin template project')
    .action(function(){
        if(fs.existsSync(TEMPLATE_DIR)){
            // remove
            console.info('Remove The Older Template Project.')
            deletedir(TEMPLATE_DIR)
        }
        console.info('Download The Lasted Template Project.')
        download(GIT_REP, TEMPLATE_DIR, function(err){
            if(err){
                console.error(err);
                return;
            }
            console.info('Download Ok');
        })
    })

const init = (pluginProjectName) => {
    const pluginPkgPath = path.join(dir, pluginProjectName, 'package.json')
    const pkginfo = require(pluginPkgPath)
    pkginfo.name = pluginProjectName
    pkginfo.description = `A Plugin Named [${ pluginProjectName }] For YF-FPM-SERVER~`
    
    fs.writeFile(pluginPkgPath, JSON.stringify(pkginfo, null, 2), function(err){
        if(err){
            console.error(err);
            return;
        }
        console.info('Init Ok , Enjoy It');
    })
}

program.command('init')
    .description('Init the fpm plugin project')
    .action(function(options) {
        const pluginName = options
        const pluginProjectName = 'fpm-plugin-' + pluginName
        const pluginProjectPath = path.join(dir, pluginProjectName)
        if(fs.existsSync(TEMPLATE_DIR)){
            // copy from disk
            copydir(TEMPLATE_DIR, pluginProjectPath);
            init(pluginProjectName, pluginProjectPath)
            return;
        }
        console.info('Download The Lasted Template Project.')
        download(GIT_REP, TEMPLATE_DIR, function(err){
            if(err){
                console.error(err);
                return;
            }
            copydir(TEMPLATE_DIR, pluginProjectPath);
            init(pluginProjectName, pluginProjectPath)
        })
    });


program.parse(process.argv);
