#!/usr/bin/env node

var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var cal = require('./calculation');
var nightwatch = require('nightwatch');
var exec = require('child_process').exec;
var argv = require('yargs')
	.usage('Usage: $0 <command> [options]')
	.command('back-end', 'Run various tests', function(yargs){
		yargs.options({

			mocha: {
				demand: true,
				alias: 'm',
				description: 'Path to test file',
				type: 'string',
			},

			istanbul: {
				demand: false,
				alias: 'i',
				description: 'Path to Istanbul "coverage-summary.json"',
				type: 'string',
			}
		}).help('help');
	})
	.command('front-end', 'Run front end tests', function(yargs){
		yargs.options({

			nightwatch: {
				demand: true,
				alias: 'n',
				description: 'Path to "nightwatch.json"',
				type: 'string',
			}
		}).help('help');
	})
	// .command('jscs', 'Code style checker', function(yargs){
	// 	yargs.options({
	// 		path: {
	// 			demand: true,
	// 			alias: 'p',
	// 			description: 'Check code style and output to code-style.txt',
	// 			type: 'boolean',
	// 			default: true
	// 		},

	// 	});
	// })
	.command('jscs', 'Code style checker', function(yargs){
		yargs.options({
			path: {
				demand: true,
				alias: 'p',
				description: 'path or directory',
				type: 'string'
			},

			standard: {
				demand: false,
				alias: 's',
				description: 'code standard, default: "google',
				type: 'string',
				default: 'google'
			},

			fix: {
				demand: false,
				alias: 'f',
				description: 'Boolean to indicate if code should be fixed',
				type: 'boolean',
				default: false
			}

		}).help('help');
	})
	.command('score', 'View Quality Score', function(yargs){
		cal.generateScore();
	})
	.argv;

var command = argv._[0];
var mocha = new Mocha({});
var testing = [];
var error = [];
var chain = {};
var RED = '\033[0;31m';
var BLUE = '\033[0;34m';
var NC = '\033[0m';
var frontResults = {
	nightwatch: {

	},
};
var backResults = {
	
	istanbul: {

	},

	mocha: {

	},
};
var frontOutput = './frontResults.json';
var backOutput = './backResults.json';

function manageFile(res, type){
	if(type === 'mocha'){
		backResults.mocha.results = res;
		// backResults.mocha.error = res.error;
		// console.log(backResults);
		// convert mocha array to object
		// console.log(backResults);
		backResults = JSON.stringify(backResults);
		fs.writeFileSync(backOutput, backResults);
		// fs.writeFile(backOutput, 'hello', function(err){
		// 	if (err){
		// 		console.log(err) ;	
		// 	} 
		// 	console.log('In here!');
		// 	console.log('File Updated');
		// });
	} else if (type === 'istanbul'){
		backResults.istanbul.results = res;
		// results.backEnd..error = error;
		// check if file exitst and write only if it does
		fs.writeFile(backOutput, JSON.stringify(backResults), (err) => {
			if (err) throw err;
			console.log(BLUE + 'File Updated' + NC);
		});
	} // else if (type === 'nightwatch'){
	// 	frontResults.nightwatch.results = res;
	// 	// results.frontEnd.nightwatch.error = res.error;
	// 	console.log(frontResults);
	// 	fs.writeFileSync(frontResults, JSON.stringify(frontResults));
	// 	// fs.writeFile(frontOutput, JSON.stringify(frontResults), (err) => {
	// 	// 	if (err) throw err;
	// 	// 	console.log('File Updated');
	// 	// });
	// }
}

function parseObject(arr){
	var newArray = [];
	for( i=0; i < arr.length; i++){;
		var obj = {
			title: arr[i].title,
			type: arr[i].type,
			duration: arr[i].duration,
			state: arr[i].state
		}

		newArray.push(obj);
		
	}

	return newArray;
}

function isDirSync(path){
	try{
		return fs.statSync(path).isDirectory();
	} catch(e){
		return false;
	}
}

function isFileSync(path){
	try{
		return fs.statSync(path).isFile();
	} catch (e){
		return false;
	}
}

function executeMochaTests(testPath){

	mocha.addFile(testPath);

	mocha.run()
    .on('test', function(test) {
        console.log('Test started: '+test.title);
    })
    .on('test end', function(test) {
        console.log('Test done: '+test.title);
    })
    .on('pass', function(test) {
        console.log('Test passed');
        testing.push(test);
    })
    .on('fail', function(test, err) {
        console.log('Test fail');
        testing.push(test);
        // error.push(err);
    })
    .on('end', function() {
        // console.log(error);
        // console.log(testing);
        testing = parseObject(testing);
    	manageFile(testing, 'mocha');
        process.exit();
    });

}

function retrieveInstanbulCoverageResults(coveragePath){
	var content = fs.readFileSync(coveragePath);
	var jsonCoverage = JSON.parse(content);
	var testPath = path.resolve(__dirname + '../../..', argv.mocha);
	//var testPath = '/home/jnrman/Documents/Node/todo-api/test/test.js';

	var total =  jsonCoverage.total;
	var testTotal = jsonCoverage[testPath];
	var percent = 0;
	var newTotal = {

	    lines:  {
	      total: total.lines.total - testTotal.lines.total,
	      covered: total.lines.covered - testTotal.lines.covered,
	      skipped: total.lines.skipped - testTotal.lines.skipped,
	      pct: percent
	    },

	    statements: {
	      total: total.statements.total - testTotal.statements.total,
	      covered: total.statements.covered - testTotal.statements.covered,
	      skipped: total.statements.skipped - testTotal.statements.skipped,
	      pct: percent
	    },

	    branches: {
	      total: total.branches.total - testTotal.branches.total,
	      covered: total.branches.covered - testTotal.branches.covered,
	      skipped: total.branches.skipped - testTotal.branches.skipped,
	      pct: percent
	    },

	    functions: {
	      total: total.functions.total - testTotal.functions.total,
	      covered: total.functions.covered - testTotal.functions.covered,
	      skipped: total.functions.skipped - testTotal.functions.skipped,
	      pct: percent
	    }
	}
	newTotal.lines.pct = +(((newTotal.lines.covered / newTotal.lines.total ) * 100).toFixed(2));
	newTotal.branches.pct = +(((newTotal.branches.covered / newTotal.branches.total ) * 100).toFixed(2));
	newTotal.statements.pct = +(((newTotal.statements.covered / newTotal.statements.total ) * 100).toFixed(2));
	newTotal.functions.pct = +(((newTotal.functions.covered / newTotal.functions.total ) * 100).toFixed(2));

	manageFile(newTotal, 'istanbul');

	

}

function executeNightWatchTests(nightwatchPath){
	// // for running nightwatch programmatically
	var done = function() {};
	var settings = {}; 

	// TODO: separate back and front end tests
	nightwatch.runner({
	  config : nightwatchPath,
	  reporter: './node_modules/quality-score/globalModule.js'
	}, done, settings)
	.on('exit', function (test) {
	  console.log(test);
	  //manageFile(test, 'nightwatch');
	});
}

function jscs(path, present, fix){
	// figure out how to make fix work
	if(fix){
		if(isFileSync(path)){
			var cmd = 'jscs ' + path + ' --fix --present=' + present + ' > code-style.txt';	
			exec(cmd, function(error, stdout, stderr){
				console.log(stdout);
				console.log('Results from style check written to code-style.txt');
			});
		} else {
			console.log(RED + 'Must be file!!');
			console.log(BLUE + "JSCS can only fix a single file at a time");
		}
	} else {
		if(isFileSync(path) || isDirSync(path)){
			var cmd = 'jscs ' + path + ' --present=' + present + ' > code-style.txt';
			exec(cmd, function(error, stdout, stderr){
				console.log(stdout);
				console.log('Results from style check written to code-style.txt');
			});
		} else {
			console.log(RED + 'File or Directory does not exist!!');
			console.log(BLUE + "Valid File or Directory must be supplied!");
		}
	}
}


try{
	if (command === 'back-end'){

		if(isFileSync(argv.mocha)){
			executeMochaTests(argv.mocha);
		} else {
			console.log(RED + 'File doe not exist!!');
			console.log(BLUE + "Mocha requires valid test file!" );
		}
		if (typeof argv.istanbul !== 'undefined'){

			if(isFileSync(argv.istanbul)){
				retrieveInstanbulCoverageResults(argv.istanbul);
			} else {
				console.log(RED + 'File doe not exist!!');
				console.log(BLUE + "Istanbul requires valid 'coverage-summary.json' file!");
			}
		}
	} else if (command ==='front-end'){
		if (typeof argv.nightwatch !== 'undefined'){
			executeNightWatchTests(argv.nightwatch);
		}
	} else {
		if (command === 'jscs'){
			jscs(argv.p, argv.s, argv.f)
		}
	}
} catch(e){
	console.log('Unable to execute tests');
	console.log(e);
}

