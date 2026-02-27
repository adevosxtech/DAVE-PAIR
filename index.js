const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
code = require('./pair');
const { sessionResults } = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 500;

const timestampFile = path.join(__path, '.creation_time');
let creationTime;
if (fs.existsSync(timestampFile)) {
    creationTime = parseInt(fs.readFileSync(timestampFile, 'utf8').trim(), 10);
} else {
    creationTime = Date.now();
    fs.writeFileSync(timestampFile, String(creationTime));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/code', code);
app.use('/', async (req, res, next) => {
    if (req.path === '/' || req.path === '/pair') {
        return res.sendFile(__path + '/pair.html');
    }
    next();
});

app.get('/uptime', (req, res) => {
    const uptimeMs = Date.now() - creationTime;
    const seconds = Math.floor(uptimeMs / 1000) % 60;
    const minutes = Math.floor(uptimeMs / 60000) % 60;
    const hours = Math.floor(uptimeMs / 3600000) % 24;
    const days = Math.floor(uptimeMs / 86400000);
    res.json({
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        startedAt: new Date(creationTime).toISOString(),
        uptimeMs
    });
});

app.get('/session-status/:id', (req, res) => {
    const result = sessionResults[req.params.id];
    if (!result) {
        return res.json({ status: 'not_found' });
    }
    res.json(result);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`📡 Connected on http://0.0.0.0:` + port)
})

module.exports = app
