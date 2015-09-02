#!//usr/local/bin/node
// include modules & set up default settings
var fs = require('fs'),
		parse = require('csv-parse'),
		transform = require('stream-transform'),
		colors = require('colors'),
		path = require('path'),
		expandHomeDir = require('expand-home-dir'),
		settings = {
			dryrun: false,
			inputFile: path.resolve('mapping.csv'),
			imageFolder: path.resolve('images'),
			outputFolder: path.resolve('images-renamed'),
			verbose: false,
			parseOptions: {
				delimiter: ',',
				columns: true
			}
		},
		outputFolderStatus = false,
		matchedFileStream;


/************ UTILITY FUNCTIONS ************/
/**
 * Prints help documentation.
 */
function _printHelpAndQuit(){
	;[
		'Usage: ./node-rename.js [options] input-file',
		'       ./node-rename.js -i=~/foo foo-mapping.csv',
		'',
		'Options:',
		'-v, --verbose        Output extra information to the command line.',
		'-d, --dryrun         Execute a dry run. Don\'t actually rename and output',
		'                     log information to command line.',
		'-c, --copy           Copy files rather than renaming.',
		'-i=val               image folder to search; defaults to \'images\'',
		'-o=val               image folder to rename files into; defaults to ',
		'                     \'renamed-images\'.',
		'',
		'Thanks for using this software. See: http://jmp.t3hco.de/node-rename'
	].forEach(function(line, index, array) {
		console.log.call(console, line)
	});
	process.exit(0);
}

/**
 * Prints settings as JSON
 */
function _logSettings() {
	console.log('Proceeding with settings: \n%s', _dumpObject(settings))
}

function _dumpObject(obj) {
	return JSON.stringify(obj, null, '  ');
}

/**
 * A subroutine to set variables based on arguments passed to the program.
 */
function _processArguments () {
	process.argv.forEach(function(val, index, array) {
		if (val==='node'||val==='node-rename.js'||val==='./node-rename.js'){return}
		if (val==='help'||val==='--help'||val==='-h'){_printHelpAndQuit()}
		// handle the -d | --dryrun option
		if (val==='-d'||val==='--dryrun'){
			settings.dryrun = true
			return
		}
		// set the image folder
		if (val.indexOf('-i') > -1) {
			settings.imageFolder = path.resolve(expandHomeDir(val.slice(3)))
			return
		}
		// set the renamed images folder
		if (val.indexOf('-o') > -1) {
			settings.outputFolder = path.resolve(expandHomeDir(val.slice(3)))
			return
		}
		// set the verbose flag
		if (val.indexOf('-v') > -1 || val==='--verbose'){
			settings.verbose=true
			return
		}
		// set the mode to copy rather than rename
		if (val.indexOf('-c') > -1 || val==='--copy'){
			settings.copy=true
			return
		}
		// last argument should always be the mapping input file
		if (index===array.length-1) {
			settings.inputFile = path.resolve(expandHomeDir(val))
			return
		}
	});
	// dump settings if verbose mode is enabled.
	if(settings.verbose){_logSettings()}
}

/************ CORE APPLICATION LOGIC ************/

/**
 * File copy mechanism.
 * @see http://stackoverflow.com/a/14387791/89789
 */
function copy(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled && cb) {
      cb(err);
      cbCalled = true;
    }
  }
}

/**
 * Returns an object with the following keys:
 * {
 *   oldFileName,
 *   newFileName,
 *   matchKey,
 *   destinationKey
 * }
 *
 * @param matchingFile : String - absolute file path of matching file
 * @param matchRule : Object - the match rule from the mapping file
 */
function makeMatch(matchingFile, matchRule) {
	return {
		'oldFileName': matchingFile,
		'newFileName': matchingFile.replace(matchRule.old_name, matchRule.new_name),
		'matchKey': matchRule.old_name,
		'destinationKey': matchRule.new_name
	}
}

function matchFiles(matchRule) {
	// skip useless operations
	if (matchRule.old_name == matchRule.new_name)
		return

	// be loud if wanted
	if (settings.verbose)
		console.log('Attempting to match for rule: %s', _dumpObject(matchRule))

	// loop through all files
	fs.readdir(settings.imageFolder, function(err, files){
		if (!err) {
			processFileList(files, matchRule);
		} else {
			throw err;
		}
	})
}

function processFileList(files, matchRule) {
	var rx = new RegExp(matchRule.old_name, 'i'),
			fileName;

	files.forEach(function(file, index, arr){
		var match, oldFile, newFile;

		if (rx.test(file)){
			match = makeMatch(file, matchRule)
			oldFile = path.resolve(settings.imageFolder, match.oldFileName)
			newFile = path.resolve(settings.outputFolder, match.newFileName)

			if(settings.dryrun) {

				console.log('%s %s %s', oldFile, '→'.bold, newFile)

			} else {

				if (settings.copy) {
					copy(oldFile,newFile)
				} else {
					rename(oldFile,newFile)
				}

			}

		}
	})
}

function parseError (err, data) {
	if (err){
		console.log('Parse error: %s; Data used:\n%s', err.toString().red, _dumpObject(data))
		throw err
	} else {
		console.log('Parse error, Data used:\n%s', _dumpObject(data));
	}
}

function rename(oldFile, newFile){
	fs.rename(oldFile, newFile, renameCallback)
}

function renameCallback(err) {
	if (err) {
		throw err
	}
}

/************ MAIN PROGRAM LOGIC ************/

/**
 * The main program entry point.
 */
function main() {
	var matches = [], parser, inputStream, transformer;

	_processArguments()

	if(!fs.existsSync(settings.inputFile)){
		console.error('Specified input-file does not exist.'.red)
		process.exit(1)
	}
	if(!fs.existsSync(settings.imageFolder)){
		console.error('Specified image folder does not exist.'.red)
		process.exit(1)
	}

	if (settings.dryrun)
		console.log('Starting dry run...')

	// make sure the output dir exists
	if (!settings.dryrun && !fs.existsSync(settings.outputFolder)) {
		if (settings.verbose)
			console.log('Creating output folder...')

		fs.mkdirSync(settings.outputFolder)
	}

	parser = parse(settings.parseOptions)

	transformer = transform(function(record, callback){
		matchFiles(record);
		if (callback) {callback()}
	}, {parallel: 10})

	parser.on('error', parseError)

	parser.on('finish', function(){
		console.info('Completed processing input file.'.green)
		inputStream.close()
	})

	inputStream = fs.createReadStream(settings.inputFile)

	inputStream.pipe(parser).pipe(transformer)
}

main();
