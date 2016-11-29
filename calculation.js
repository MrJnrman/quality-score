var fs = require('fs');

var frontOutput = './frontResults.json';
var backOutput = './backResults.json';

function isFileSync(path){
	try{
		return fs.statSync(path).isFile();
	} catch (e){
		return false;
	}
}

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

exports.generateScore = function (){

	if(isFileSync(frontOutput)){
		var frontJSON = fs.readFileSync(frontOutput);
		var frontOutputObj = JSON.parse(frontJSON);

		frontOutputObj.score = (frontOutputObj.passed/frontOutputObj.tests) * 80;

		fs.writeFileSync(frontOutput, JSON.stringify(frontOutputObj));

	}

	if(isFileSync(backOutput)){
		var backJSON = fs.readFileSync(backOutput);
		var backOutputObj = JSON.parse(backJSON);

		var mocha = backOutputObj.mocha;
	
		var testCount = mocha.results.length;
		var passCount = 0;
		var mochaScore = 0;
		var istanbulScore = 0;
		var istanbul = {};

		for ( i = 0; i < testCount; i++ ){

			if( mocha.results[i].state === 'passed'){
				passCount += 1;
			}
		}

		mochaScore =  (passCount/testCount) * 100;
		
		
		if(!isEmptyObject(backOutputObj.istanbul)){
	
			istanbul = backOutputObj.istanbul.results;
			istanbulScore = ( istanbul.lines.pct + istanbul.statements.pct + istanbul.branches.pct + istanbul.functions.pct ) /4

		} else {
			istanbulScore = 0;
		}

		if (istanbulScore === 0){
			backOutputObj.score = (mochaScore/100) * 25;
		} else {
			var score = (mochaScore/100) * istanbulScore;
			backOutputObj.score = Math.round((score/100) * 80);
		}

		fs.writeFileSync(backOutput, JSON.stringify(backOutputObj));

		if(isFileSync(frontOutput)){
			var frontJSON = fs.readFileSync(frontOutput);
			var frontOutputObj = JSON.parse(frontJSON);
			console.log(BLUE + "Front End Quality Score:" + frontOutputObj.score + "%");
		}

		if(isFileSync(backOutput)){
			var backJSON = fs.readFileSync(backOutput);
			var backOutputObj = JSON.parse(backJSON);
			console.log(BLUE + "Back End Quality Score:" + backOutputObj.score + "%");
		}

	}
};