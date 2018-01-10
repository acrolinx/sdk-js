import * as http from 'http';

http.createServer((_req, res) => {
  res.write('Hello World!');
  res.end();
}).listen(3000, () => {
  console.log('server start at port 3000');
});
