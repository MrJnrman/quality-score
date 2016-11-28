var fs = require('fs');
module.exports = {
  write : function(results, options, done) {
    console.log(results);
    fs.writeFileSync('./frontResults.json', JSON.stringify(results));//console.log(options);
    done();
  }
};