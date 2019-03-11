#! /usr/bin/env node

// devflags

var fs = require('fs');
var path = require('path');
var termkit = require( 'terminal-kit' )
var term = termkit.terminal ;


var EXTS = ['php','md','js','html','css','command']

var FLAGS = [{color:'#ffe244', patterns:['|!|']}]; // .bgColorRgbHex()

function DevFlagScan(jobDirPath){



	//console.log(jobDirPath);

	// Escape all patterns as regex strings
	for (var i = 0; i < FLAGS.length; i++){
		FLAGS[i]._patternsRegexEsc = []
		for (var j = 0; j < FLAGS[i].patterns.length; j++){
			FLAGS[i]._patternsRegexEsc.push(escapeRegExp(FLAGS[i].patterns[j]));
		}
	}
	term.reset();
	term('\n')
	term.windowTitle('devflags')
	term.bgGrey(' ' + 'devflags\n'.split('').join(' '));
	term.grey('scanning ').cyan(jobDirPath+'\n') ;
	term('\n')

	var matches = recursiveFlagSearch(jobDirPath, EXTS)
	//console.log(matches);

	for (var i = 0; i < matches.length; i++){
		var hexCol = FLAGS[matches[i].flagIndex].color;
		term.colorRgbHex(hexCol);

		term(matches[i].patternMatch + ' ' + matches[i].message + '\n');
		term.cyan(' '.repeat(matches[i].patternMatch.length+1) + matches[i].rootRelativePath + ' (line ' + matches[i].line + ')\n\n');
	}

	/*
	{ path:
     '/Users/maker/Dropbox/Projects/devflags/test/bootstrap-4.3.1/site/sw.js',
    rootRelativePath: '/bootstrap-4.3.1/site/sw.js',
    file: 'sw.js',
    flagIndex: 0,
    patternMatch: '|!|',
    message: 'Check this works',
    line: 7 }
	*/

}

function recursiveFlagSearch(base,exts,files,result,rootBasePath) {

		rootBasePath = typeof rootBasePath !== 'undefined' ? rootBasePath : path.join(base);

    files = files || fs.readdirSync(base)
    result = result || []

    files.forEach(
        function (file) {
            var newbase = path.join(base,file)
            if ( fs.statSync(newbase).isDirectory() ){
                result = recursiveFlagSearch(newbase,exts,fs.readdirSync(newbase),result, rootBasePath)
            } else {
                if (isFileOfExtension(file, exts)) {
									var contents = fs.readFileSync(newbase, 'utf8');

									for (var i = 0; i < FLAGS.length; i++){
										for (var j = 0; j < FLAGS[i]._patternsRegexEsc.length; j++){

											const regex = new RegExp(FLAGS[i]._patternsRegexEsc[j] + '(.*)','gm');
											let m;
											while ((m = regex.exec(contents)) !== null) {
											    if (m.index === regex.lastIndex) {
											        regex.lastIndex++;
											    }
													if (m.length > 1){

														// Count lines up to match
														var upToContents = contents.substr(0, m.index);
														var lineCountMatch = upToContents.match(/[\n]/g)

														var rootRelativePath = newbase;
														if (hasPrefix(newbase, rootBasePath)){
															rootRelativePath = rootRelativePath.substr(rootBasePath.length);
														}

														result.push({path:newbase, rootRelativePath:rootRelativePath, file:file, flagIndex:i, patternMatch:FLAGS[i].patterns[i], message:m[1].trim(), line: lineCountMatch.length+1})
														//console.log(m)

													}
											}
										}
									}
                }
            }
        }
    )

    return result
}

function hasPrefix(str, prefix, caseIndifferent){

	caseIndifferent = typeof caseIndifferent !== 'undefined' ? caseIndifferent : true; // optional param

	if (caseIndifferent){
		str = str.toLowerCase();
		prefix = prefix.toLowerCase();
	}

	return str.length >= prefix.length && str.substr(0, prefix.length) == prefix;

}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isFileOfExtension(fsPath, extList){

	return isExtofExtensions(path.extname(fsPath), extList);

}

function isExtofExtensions(ext, extList){

	var ext = ext.toLowerCase();
	ext = ext.charAt(0) == '.' ? ext : '.'+ext;

	extList = Array.isArray(extList) ? extList : [String(extList)];

  for (var i = 0; i < extList.length; i++){
    var listExt = extList[i].toLowerCase();
    if (listExt == '*'){
      return true;
    }
    listExt = listExt.charAt(0) == '.' ? listExt : '.'+listExt;
    if (ext == listExt){
      return true;
    }
  }

	return false;

}

module.exports = DevFlagScan(process.cwd()); // pwd, this script is to be called within job dir
