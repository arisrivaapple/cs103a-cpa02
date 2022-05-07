'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var taskBoardSchema = Schema( {
    //tasks:[Task]
});

module.exports = mongoose.model('TaskBoard', taskBoardSchema);