'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var preferencesSchema = Schema( {

});

module.exports = mongoose.model('Preferences', preferencesSchema);