var express = require('express');
var cors = require('cors');
const app = express(),
  Stream = require('stream').Transform,
  fs = require("fs");

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse', (req, res) => {
  var data = new Stream();
  let fileName = '';
  let contentType = '';
  let fileSize = 0;
  req.on('data', chunck => {
    let buffer = chunck.toString('latin1');
    fileName = buffer.split('; filename="')[1].split('"')[0];
    contentType = buffer.split('Content-Type: ')[1].split('\r\n')[0];
    buffer = buffer.split(/image\/[png|jpg|jpeg]+\s\n/);
    buffer = buffer[1].replace('\r\n', '').split('-----')[0].split('\r\n');
    buffer.pop();
    buffer = buffer.join('\r\n');
    buffer = Buffer.from(buffer, 'latin1');
    fileSize = buffer.length || buffer.byteLength;
    data.push(buffer)
  })
  req.on('end', () => {
    fs.writeFileSync(fileName, data.read());
    return res.json({name: fileName, type: contentType, size: fileSize});
  })
})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});