#!/usr/bin/env node

var args = process.argv.slice(2);
var https = require('https');
var fs = require('fs');
var unzip = require('unzip');
var shelljs = require('shelljs/global');
var colors = require('colors');

if (!args[0]) {
  console.log('why no args?');
  return console.log('see ya.');
}

if (args[0] === 'install') {
  if (!args[1]) {
    return console.log('Need something to install!');
  }

  fs.stat('apps', function(err) {
    if (err) {
      return console.log('no \'apps\' folder found. are you sure you\'re in the right place? anyway, bye.');
    }

    var json_content = '';
    https.get('https://raw.githubusercontent.com/ArielAbreu/desktopjs-apps/master/apps.json', function(res) {
      res.on('data', function(data) {
       json_content += data;
      }).on('end', function() {
        var json_obj = JSON.parse(json_content);
        if (!json_obj[args[1]]) return console.log('no, just, no. there\'s nothing here.');
        var obj = json_obj[args[1]];
        var file = fs.createWriteStream('apps/' + obj.tar);
        https.get('https://raw.githubusercontent.com/ArielAbreu/desktopjs-apps/master/apps/' + obj.tar, function(res) {
          res.on('data', function(data) {
            file.write(data);
          }).on('end', function() {
            file.end();
            fs.createReadStream('apps/' + obj.tar).pipe(unzip.Extract({ path: 'apps' })._parser.on('end', function() {
              fs.unlinkSync('apps/' + obj.tar);
              try {
                fs.statSync('apps/' + args[1] + '/package.json');
                cd('apps/' + args[1]);
                exec('npm install');
                cd('../..');
              } catch(e) {
                // do nothing
              }

              try {
                fs.statSync('apps/' + args[1] + '/bower.json');
                cd('apps/' + args[1]);
                exec('bower update');
                cd('../..');
              } catch(e) {
                // do nothing
              }

              console.log('btw, i\'m done.'.rainbow);
              console.log('install succeded.'.green);
            }));
          });
        });
      });
    });
  });
}