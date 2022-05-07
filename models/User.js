'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var userSchema = Schema( {
    username: String,
    password: String,
    email: String,
    team: String,
});

module.exports = mongoose.model('User', userSchema);