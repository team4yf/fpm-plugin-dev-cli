#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const program = require('commander');
const version = require('./package.json').version;
const download = require('download-git-repo');
const nunjucks = require('nunjucks');

const dir = process.cwd();
const local = __dirname;
const TEMPLATE_DIR = path.join(local, 'template', 'fpm-plugin-');

const GIT_REP = {
    node: 'team4yf/fpm-plugin-dev-template',
    golang: 'team4yf/fpm-plugin-golang-dev-template',
};

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

program.option('-t, --template <template>', 'project template, support node/golang', 'golang')
program.option('-n, --name <name>', 'project name', 'foo')

program.command('update')
    .description('update the fpm plugin template project')
    .action(function(){
        const templateName = program.template;
        if(fs.existsSync(TEMPLATE_DIR + templateName)){
            // remove
            console.info('Remove The Older Template Project.')
            deletedir(TEMPLATE_DIR)
        }
        console.info('Download The Lasted Template Project.')
        download(GIT_REP[program.template], TEMPLATE_DIR+ templateName, function(err){
            if(err){
                console.error(err);
                return;
            }
            console.info('Download Ok');
        })
    })

const init = (pluginProjectName) => {
    if(program.template == 'golang'){
        //TODO: init the golang project
        try {
            nunjucks.configure(pluginProjectName, { autoescape: true });
            const files = ['README.md', 'go.mod', 'plugin/plugin.go', 'main.go'];
            for(let i in files) {
                let f = files[i];
                fs.writeFileSync(path.join(pluginProjectName, f), nunjucks.render(f, { name: program.name }));
            }
            
        } catch (error) {
            console.error(error);
        }
        
        return;
    }
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
        const templateName = program.template;
        const pluginName = program.name;
        const pluginProjectName = 'fpm-' + (templateName=='golang' ? 'go-': '')+ 'plugin-' + pluginName
        const pluginProjectPath = path.join(dir, pluginProjectName)
        if(fs.existsSync(pluginProjectPath)){
            console.log(`Error: ${pluginProjectName} exists here!`);
            return
        }
        if(fs.existsSync(TEMPLATE_DIR + templateName)){
            // copy from disk
            copydir(TEMPLATE_DIR + templateName, pluginProjectPath);
            init(pluginProjectName, pluginProjectPath)
            return;
        }
        console.info('Download The Lasted Template Project.')
        download(GIT_REP[templateName], TEMPLATE_DIR + templateName, function(err){
            if(err){
                console.error(err);
                return;
            }
            copydir(TEMPLATE_DIR + templateName, pluginProjectPath);
            init(pluginProjectName, pluginProjectPath)
        })
    });


program.parse(process.argv);
