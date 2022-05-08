'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var userSchema = Schema( {
    username: String,
    password: String,
    email: {type: String, default: ''},
    teamRequest: {type: String, default: ''},
    team: {type: String, default: ''},
});

module.exports = mongoose.model('User', userSchema);