'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var teamSchema = Schema( {
    name: String,
    members: [String],
});

module.exports = mongoose.model('Team', teamSchema);