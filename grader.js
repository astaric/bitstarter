#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrl = function(url) {
  return url.toString();
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, callback) {
  fs.readFile(htmlfile, function (err, data) {
      if (err) throw err;
      checkHtml(data, checksfile, callback);
  });
};

var checkUrl = function(url, checksfile, callback) {
  rest.get(program.url).on('complete', function(result, response) {
    if (result instanceof Error) {
      console.error('Error: ' + util.format(response.message));
    } else {
      checkHtml(result, program.checks, callback);
    }
  });
}

var checkHtml = function(html, checksfile, callback) {
    var $ = cheerio.load(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    if (callback)
      callback(out);
    return out;
}

var showresults = function(results) {
  var outJson = JSON.stringify(results, null, 4);
  console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks ', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file ', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to check', assertUrl, URL_DEFAULT)
        .parse(process.argv);
    if (program.url !== URL_DEFAULT)
      checkUrl(program.url, program.checks, showresults);
    else
      checkHtmlFile(program.file, program.checks, showresults);
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkUrl = checkUrl;
}

