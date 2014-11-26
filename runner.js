var async = require("async");
var child = require("child_process");
var glob = require("glob");

function noop () {
}

function Runner (files, options, done) {
    options = options || {};
    done = done || noop;

    var main = options.main || "";
    var modules = options.modules || [];
    var externs = options.externs || [];
    var verbose = options.verbose || false;
    var pscCmd = options.psc || "psc";

    var logInfo = options.logger && options.logger.log || noop;
    var logError = options.logger && options.logger.error || noop;

    files = options.noDefaultPaths ? files : [
        "bower_components/**/src/**/*.purs"
    ].concat(files);

    function globFiles (callback) {
        async.map(files, glob, function (err, files) {
          if(err) return callback(err);

          var flattened = files.reduce(function (arr, f) {
            return arr.concat(f);
          }, []);
          callback(null, flattened);
        });
    }

    function compile (argsFiles, callback) {
        var argsModule = modules.map(function (m) {
            return "--module="+m;
        });

        var argsExterns = externs.map(function (e) {
            return "--extern="+e;
        });

        var argsVerbose = verbose ? ["-v"] : [];

        var argsMain = main ? ["--main="+main] : [];

        var args = [].concat(argsModule)
                .concat(argsExterns)
                .concat(argsVerbose)
                .concat(argsMain)
                .concat(argsFiles);

        var psc = child.spawn(pscCmd, args);
        var output = "";
        var errOutput = "";

        psc.stdout.on("data", function (d) {
            logInfo(d);
            output += d;
        });
        psc.stderr.on("data", function (d) {
            logError(d);
            errOutput += d;
        });
        psc.on("exit", function (code) {
            if(code !== 0) {
                var error = "Purescript compiler returned with code: " + code + "\n" + errOutput;
                logError(error);
                return callback(error);
            }
            callback(null, output);
        });
    }

    function runModule(script, callback) {
        /*jslint evil: true */
        var executor = new Function (script + "\nreturn PS;");
        try {
            var PS = executor();
            return callback(null, PS);
        } catch (e) {
            return callback(e);
        }
    }

    globFiles(function (err, files) {
        if(err) return done(err);

        compile(files, function (err, script) {
            if(err) return done(err);

            runModule(script, done);
        });
    });

    return {};
}

module.exports = {
    run: function (files, options, callback) {
        if(!files) {
            files = [];
        } else if(typeof files === "string") {
            files = [files];
        }

        if(typeof options === "function") {
            callback = options;
            options = null;
        }

        return new Runner(files, options, callback);
    }
};
