const express = require('express');
const app = express();
const http = require('http');
const routes = require('./routes');
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());
app.use('/analytics/', routes.analytics);
app.use('/servicerequest/', routes.servicerequest);

http.createServer(app).listen(3000, function () {
    console.log('Express listening on port 3000...');
});