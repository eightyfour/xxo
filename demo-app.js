const chat = require('./lib-server/xxo');
const express = require('express'),
    app  = express();

app.use('/',function(req,res,next){
    console.log("/html - call next");
    next();
});

app.use(express.static(__dirname + '/dist'));

app.use('/',function(request, response){
    console.log('demo-app:serve index');
    response.sendFile(__dirname + '/dist/xxo.html');
});

var socketServer = app.listen(3000);
// initialize the socket navigation
// TODO use direct socket.io instead of nojs - change the port for having no conflicts with nowjs
// var nowServer = async({dirname : __dirname + '/async',extension : '.html'},socketServer);

// initialize the xxo server based on now
// TODO problem - better use one nowjs connection for xxo
chat(socketServer);

console.log("start server 3000");