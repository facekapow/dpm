#!/usr/bin/env node

var https = require('https');
var fs = require('fs');
var shelljs = require('shelljs/global');
var colors = require('colors');

var args = require('yargs')
  .option('r', {
    alias: 'repo',
    default: 'https://raw.githubusercontent.com/facekapow/desktopjs-apps/master',
    describe: 'the repo to search in when looking for apps',
    type: 'string',
  })
  .command(
    'install <package>',
    'install a package',
    function(yargs) {
      yargs.positional('package', {
        describe: 'Package to install',
        type: 'string',
      });
    },
    function(argv) {
      var repo = argv.repo;
      var pkg = argv.package;
      fs.stat('apps', function(err) {
        if (err) {
          return console.log('no \'apps\' folder found. are you sure you\'re in the right place? anyway, bye.'.zebra);
        }
    
        var json_content = '';
        https.get(repo + '/apps.json', function(res) {
          console.log('looking up app in remote application index...'.underline.dim);
          res.on('data', function(data) {
           json_content += data;
          }).on('end', function() {
            var json_obj = JSON.parse(json_content);
            if (!json_obj[pkg]) return console.log('no, just, no. there\'s nothing here.'.red);
            var obj = json_obj[pkg];
    
            var json_file = null;
    
            try {
              fs.statSync('apps/apps.json');
              json_file = JSON.parse(fs.readFileSync('apps/apps.json'));
            } catch(e) {
              json_file = {
                "apps": {}
              };
            }
    
            if (json_file.apps[pkg]) {
              if (json_file.apps[pkg].version === obj.version) {
                console.log('you already have the newest version. anyway...'.yellow);
              }
            }
    
            https.get(repo + '/apps/' + obj.tar, function(res) {
              console.log('downloading application...'.underline.dim);
              var len = parseInt(res.headers['content-length'], 10);
              var cur = 0;
    
              var is_first = false;
    
              res.setEncoding('binary');
    
              var total_data = '';
    
              res.on('data', function(data) {
                cur += String(data).length;
                if (is_first) process.stdout.write('\n');
                if (!is_first) {
                  process.stdout.clearLine();
                  process.stdout.cursorTo(0);
                }
                process.stdout.write(String((100.0 * cur / len).toFixed(2)) + '% downloaded...');
                total_data += data;
                if (is_first) is_first = true;
              }).on('end', function() {
                process.stdout.write('\n');
                console.log('done downloading application.'.cyan);
                fs.writeFileSync('apps/' + obj.tar, total_data, 'binary');
                exec('unzip apps/' + obj.tar + ' -d apps');
                fs.unlinkSync('apps/' + obj.tar);
                try {
                  fs.statSync('apps/' + pkg + '/package.json');
                  cd('apps/' + pkg);
                  console.log('\nbegin installing npm deps...\n'.yellow);
                  exec('npm install');
                  console.log('\ndone installing npm deps.\n'.green);
                  cd('../..');
                } catch(e) {
                  // do nothing
                }
    
                try {
                  fs.statSync('apps/' + pkg + '/bower.json');
                  cd('apps/' + pkg);
                  console.log('\nbegin installing bower deps...\n'.yellow);
                  exec('bower update');
                  console.log('\ndone installing bower deps.\n'.green);
                  cd('../..');
                } catch(e) {
                  // do nothing
                }
    
                if (!json_file.apps[pkg]) {
                  json_file.apps[pkg] = {};
                }
    
                json_file.apps[pkg].version = obj.version;
    
                fs.writeFileSync('apps/apps.json', JSON.stringify(json_file, null, 2));
    
                console.log('btw, i\'m done.'.green);
              });
            });
          });
        });
      });
    }
  )
  .help()
  .demandCommand()
  .parse()
  ;
