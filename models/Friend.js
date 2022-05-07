'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var friendSchema = Schema( {

});

module.exports = mongoose.model('Friend', friendSchema);