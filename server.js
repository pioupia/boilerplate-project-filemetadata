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
  // Init the stream for write the file and variables for send the informations of the file to the user.
  var data = new Stream();
  let fileName = '';
  let contentType = '';
  let fileSize = 0;
  
  // Read the request by chunck
  req.on('data', chunck => {
    // Transform buffer to string (more precisly latin1) for parse it.
    let buffer = chunck.toString('latin1');
    
    // Sort the file name to send it after to the client (and to write the file)
    fileName = buffer.split('; filename="')[1].split('"')[0];
    
    // Get the file type to send it after to the client
    contentType = buffer.split('Content-Type: ')[1].split('\r\n')[0];
    
    // Split our buffer to get the image section.
    buffer = buffer.split(/image\/[png|jpg|jpeg]+\s\n/);
    
    // Remove unused space and break lines and split to get only the image.
    buffer = buffer[1].replace('\r\n', '')
      .split('-----')[0]
      .split('\r\n');
    
    /* If unused space and break-lines are not removed, the image may be corrupt */
    
    // Remove the unused space and break-lines to the end of string.
    buffer.pop();
    buffer = buffer.join('\r\n');
    
    // Convert your string to a buffer
    buffer = Buffer.from(buffer, 'latin1');
    
    // Get the buffer size with length / bytelength (it's the same).
    fileSize = buffer.length || buffer.byteLength;
    
    // Push your buffer into the Stream content
    data.push(buffer)
  });
  
  // When the req stream is ended
  req.on('end', () => {
    // Write the file with stream
    fs.writeFileSync(fileName, data.read());
    
    // Return the file informations to the client
    return res.json({name: fileName, type: contentType, size: fileSize});
  })
})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
