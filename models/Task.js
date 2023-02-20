'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var taskSchema = Schema( {
    userId: ObjectId,
    task_name: String,
    task_description: String,
    task_due_date: String,
    task_due_time: Number,
    task_weight: Number,
    task_status_completed: {type: Boolean, default: false},
    task_points:{type: Number, default: 0},
    task_direct_prize:{type: Boolean, default: false},
    task_prize:{type: String, default: null},
    task_url: {type: String, default: null},
    task_url_b: {type: String, default: null},
    task_submit_url: {type: String, default: null},
    task_upload_url: {type: String, default: null},
    task_delete_url: {type: String, default: null},
});

module.exports = mongoose.model('Task', taskSchema);