/*
  NVG Chat
  mongoUtil.js
*/

const mongo = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
var _db;
const url = 'mongodb://127.0.0.1:27017/'
const dbName = 'testdb'

module.exports = {
    connectToServer: function (callback) {
        mongo.connect(url, (err, client) => {
            _db = client.db(dbName);
            return callback(err);
        });
    },
    getDb: function () {
        return _db;
    }
}