'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var taskSchema = Schema( {
    userId: ObjectId,
    task_name: String,
    task_description: String,
    task_due_date: Date,
    task_due_time: Number,
    task_weight: Number,
});

module.exports = mongoose.model('Task', taskSchema);