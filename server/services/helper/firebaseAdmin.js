let firebaseAdmin = require('firebase-admin');

var serviceAccount = require('../../certs/fireBaseAdmin.json');

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});

module.exports = firebaseAdmin;