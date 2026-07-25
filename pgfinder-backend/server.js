require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  process.stdout.write(`StayJi backend listening on port ${PORT}\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other backend process or set PORT to another value.`);
    return;
  }
  throw error;
});
