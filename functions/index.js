const functions = require('firebase-functions');
var {google} = require('googleapis');
var MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
var SCOPES = [MESSAGING_SCOPE];
 
var express = require('express');
var app = express(); 
var bodyParser = require('body-parser');
var router = express.Router(); 
var request = require('request');
 
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
 
//let functions = require('firebase-functions');
let admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendPush = functions.database.ref('/messages/{messagesId}').onWrite((change, context) => {
    let projectStateChanged = false;
    let projectCreated = false;
    let projectData = change.after.val();
    if (change.after.exists()) {
        projectCreated = true;
    }
    if (!projectCreated && change) {
        projectStateChanged = true;
    }

    let msg = 'test notification on msg send';
    let sender ='';
    if (projectCreated) {
        msg = `${projectData.messageText}`;
        sender = `${projectData.messageUser}`;
    }

    return loadUsers().then(tokens => {
        let token = [];
        for (let user of tokens) {
            token.push(user);
        }

        let payload = {
            notification: {
                title: sender,
                body: msg,
                sound: 'default',
                badge: '1'
            }
        };
        
        return admin.messaging().sendToDevice(tokens, payload);
    });
});

function loadUsers() {
    let dbRef = admin.database().ref('/tokens');
    let defer = new Promise((resolve, reject) => {
        dbRef.once('value', (snap) => {
            let data = snap.val();
            let users = [];
            for (var property in data) {
                users.push(data[property]);
            }
            resolve(users);
        }, (err) => {
            reject(err);
        });
    });
    return defer;
}