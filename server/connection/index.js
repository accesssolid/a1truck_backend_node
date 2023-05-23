const mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URI;
mongoose.Promise = global.Promise;
mongoose.connect(mongoDB, {
    user: 'a1new', pass: 'a1new_1077',
    useNewUrlParser : true,
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.once('open', () => {
    console.log("connection established");
});

module.exports = db;