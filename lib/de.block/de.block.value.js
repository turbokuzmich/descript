var de = require('../de.js');

require('./de.block.js');
require('../de.result');

var no = require('nommon');

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Value = function(value, descript, options) {
    this._init(descript, options);

    this.value = value;
};

no.inherit(de.Block.Value, de.Block);

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Value.prototype._run = function(params, context) {
    var worker = new de.Worker();

    return worker.promise.resolve( new de.Result.Value(this.value) );
};

//  ---------------------------------------------------------------------------------------------------------------  //
