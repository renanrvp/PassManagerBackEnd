const express = require('express');
const app = express();
const http = require('http');
const routes = require('./routes');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use('/analytics/', routes.analytics);
app.use('/servicerequest/', routes.servicerequest);

http.createServer(app).listen(3000,function(){
    console.log('Express listening on port 3000...');
});