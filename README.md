# purescript-runner

This is a small library that compiles and executes [Purescript](http://www.purescript.org/) applications
directly from [Node.js](http://nodejs.org/).

## Dependencies
 * NodeJS
 * Purescript compiler (avaliable in the path)

## Installation
```
npm install purescript-runner
```

## Examples

### Simple case (no external dependencies)
Assuming the following ``Main.purs`` file
```purescript
module Main where
  import Debug.Trace

  main = do
    print "Hello world"
```

The following code will run the application above
```javascript
var runner = require("purescript-runner");

runner.run("Main.purs", function (err, PS) {
  if(err) {
    console.error("Purescript compilation failed:", err);
    return;
  }

  PS.Main.main();
});
```

The `PS` object returned by runner will contain whole Purescript environment from given files.  In addition,
the main-module option and dead-code removal module of Purescript compiler are avaliable through additional
`options` object.

To fire and forget the `Main.main` module of Purescript application, the code above can be shortened
```javascript
var runner = require("purescript-runner");

runner.run("Main.purs", {
    modules: ["Main"],
    main: "Main"
});
```

### Loading scripts with dependencies
Runner accepts a single-glob or list of globs as its parameter, allowing to load multiple files
```javascript
var runner = require("purescript-runner");

runner.run(["src/**/*.purs", "Main.purs"], ...);
```
In addition, by default `bower_components/**/src/**/*.purs` is evaluated and matching files are passed to the
Purescript compiler. Use `noDefaultPaths` options to surpress this.

## Usage
### runner.run
```javascript
runner.run(files, [options, callback])
```
Compiles all the `files` and returns the resulting `PS` object as a second parameter of callback.
  * `files` : `string|[string]`- paths to the Purescript files to be copiled, globs are accepted,
  * `options` : `object` - options, see options section for details,
  * `callback` : `function (error, PS)` - evalated after compilation, where:
    * `error` - `null` or error description, if an error occured
    * `PS` - top-level Purescript object conating all the compiled modules. See 
      [here](https://leanpub.com/purescript/read#leanpub-auto-calling-purescript-from-javascript) for
      details

### options
Object, with following properties:
  * `main` : `string` - optional main module name passed to the Purescript compiler. This module is expected to export `main`
      function that will be executed as the program entry point. See `psc --help` for details,
  * `modules` : `[string]` - names of the modules which code must be included in the output. The option
      enables Purescript compiler dead-code detection. Modules not included here will only export
      symbols that are necessary for ones included to execute. Passing this options drastically
      decreses size of compiler output. See `psc --help` for details,
  * `externs` : `[string]` - externs passed to the Purescript compiler. See `psc --help` for details,
  * `verbose` : `boolean` - enables Purescript compiler verbose error reporting. See `psc --help` for details,
  * `noDefaultPaths` : `boolean` - supresses runner from automatically adding all the files matching
  `./bower_components/**/src/**/*.purs` glob,
  * `pscCmd` : `string` - path to the `psc` executable. By default the exacutable is assumed to be reachable from the `PATH`
  * `logger` : `object` - with the following methods
    * `log` : `function(string)` - logs Purescript compiler standard output
    * `error` : `function(string)` - logs Purescript compiler error output

# Motivation

## What's the purpouse?
This is designed and intended as a tool for experimenting with and debugging code. Keep in mind that every
`run` call compiles and evaluates the whole Purescript codebase and creates a new environment from scratch. It is
in principle, only a shortened way of compiling Purescript files with [grunt](http://gruntjs.com/) or 
[gulp](http://gulpjs.com/) and then running them through Node.

The project started when, in attempt to learn and evaluate Purescript FFI I have started to write some simple
FFI interfaces to standard NodeJS libraries and found the recompiling for testing (especially from node interactive console)
pretty tedious.

## Why exporting whole environment instead of preparing CommonJS modules for Node to load?
I have actually considered the `psc-make` approach of importing the Purescript code as separate modules. However, Purescript module system is pretty much standalone and separate from NodeJS one (or CommonJS one
for that matter) and it seemed to be an uphill battle to make these two work togather. In addition, the build modules 
would have to be either placed in `node_modules` folder polutting it pretty badly, or some mangling with private parts 
of NodeJS module system need to be done to make them load from arbitrary folders. Neither of those solutions seemed to
be worth the effort.

This, togather with the fact that my main usage for this runner is to compile the code for experimenting from NodeJS
interactive console, so I do not want to restart the interpreter or do some magic to clear a module cache after 
changes in a Purescript files, made me settle on the current approach.

To be honest, it seems that output of `psc-make` is only consumable for `browserify`.

## Why not the custom `require` extension to load Purescript
I have also evaluated this path, but considering the fact that `require` calls need to be synchronous and the
issues mentioned above it seems not to worth the effort. No to mention, that Purescript module system does not
force the module <-> file path convention making it quite tricky to find the appropriate `purs` files.
