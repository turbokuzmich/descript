//  ---------------------------------------------------------------------------------------------------------------  //
//  de.Script
//  ---------------------------------------------------------------------------------------------------------------  //

var http_ = require('http');
var fs_ = require('fs');
var path_ = require('path');

var nopt = require('nopt');

//  ---------------------------------------------------------------------------------------------------------------  //

var de = require('./de.js');

require('./de.block.js');
require('./de.context.js');
require('./de.result.js');

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script = function(config, modules) {
    this.config = config || {};
    this.modules = modules || {};

    this._results = {};

    this._initSandbox();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script.prototype.start = function() {

    var config = this.config;
    var that = this;

    var server = this.servier = http_.createServer(function (req, res) {
        //  res.setHeader('Content-Type', 'text/javascript; charset: utf-8');

        var context = new de.Context(req, res, config);

        var path = context.request.path || '';
        if ( path.substr(0, 1) === '/' ) {
            path = path.substr(1);
        }
        if (!path) {
            path = 'index.jsx';
        }

        var block = new de.Block.Root(path, that);
        block.run(context).then(function(result) {
            if (result instanceof de.Result.Error && result.get('id') === 'FILE_OPEN_ERROR') {
                res.statusCode = 404;
                res.end( result.formatted() );
                return;
            }

            context.response.end(result);
        });
    });

    if (config.socket) {
        server.listen(config.socket);
    } else {
        server.listen(config.port, '0.0.0.0', '127.0.0.1');
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script.prototype._initSandbox = function() {
    var config = this.config;

    var sandbox = this.sandbox = {};
    var descript = this;

    sandbox.http = function(url, options) {
        return new de.Block.Http(url, descript, options);
    };

    sandbox.file = function(filename, options) {
        return new de.Block.File(filename, descript, options);
    };

    sandbox.include = function(filename, options) {
        return new de.Block.Include(filename, descript, options);
    };

    sandbox.call = function(call, options) {
        return new de.Block.Call(call, descript, options);
    };

    sandbox.array = function(array, options) {
        return new de.Block.Array(array, descript, options);
    };

    sandbox.object = function(object, options) {
        return new de.Block.Object(object, descript, options);
    };

    sandbox.value = function(value, options) {
        return new de.Block.Value(value, descript, options);
    };

    sandbox.func = function(func, options) {
        return new de.Block.Function(func, descript, options);
    };

};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script.readConfig = function(filename) {
    var content = fs_.readFileSync(filename, 'utf-8');

    return JSON.parse(content);
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script.readModules = function(modConfig, dirname) {
    modConfig = modConfig || {};

    var modules = {};
    for (var id in modConfig) {
        var filename = path_.join( dirname, modConfig[id] );
        modules[id] = require(filename);
    }

    return modules;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Script.create = function() {

    var options = nopt({
        'port': String,
        'socket': String,
        'rootdir': String,
        'config': String,
        'help': Boolean
    });

    if (options.help) {
        usage();
    }

    var config;
    var basedir;
    if (options.config) {
        config = de.Script.readConfig(options.config);
        basedir = path_.dirname( path_.resolve(options.config) );
    } else {
        config = {};
        basedir = path_.resolve('.');
    }

    config.port = options.port || config.port;
    config.socket = options.socket || config.socket;
    config.rootdir = path_.resolve(basedir, options.rootdir || config.rootdir || '.' );

    if ( !(config.port || config.socket) ) {
        usage();
    }

    if (config.modules) {
        var dirname = path_.dirname( path_.resolve(options.config) );
        var modules = de.Script.readModules(config.modules, dirname);
    }

    return new de.Script(config, modules);

    function usage() {
        //  TODO.
        console.log('Usage:');
        console.log('   ./descript --port 2000 --rootdir test/pages');
        console.log('   ./descript --socket descript.sock --rootdir test/pages');
        console.log('   ./descript --config test/config.json');
        console.log();

        process.exit(0);
    }

};

//  ---------------------------------------------------------------------------------------------------------------  //
