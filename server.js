const mongoose = require('mongoose');
const dotenv = require('dotenv');

// if there is an error in code that was not in side the code pokoknya ya uncaughtException
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION: server shutdown...');
  // Server.close give a time to the server to finished the request to the server
  process.exit(1); // Zero for success, 1 is for error
});

dotenv.config({ path: './config.env' });
// kenapa const app dibawah dotenv ? karena kita membutuhkan data environment variable dari doteenv kalau tidak ada library morgan tidak akan terpanggil
const app = require('./app');

const DB = process.env.DATABASE_LOCAL;
// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>', process.env.DATABASE_PASSWORD
// );

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection Successfull'));

// 4) START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`The server running on port ${port}...`);
});

// error that can't handle by the express like server down or cant access the db
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHADLE REJECTION: server shutdown...');
  // Server.close give a time to the server to finished the request to the server
  server.close(() => {
    process.exit(1); // Zero for success, 1 is for error
  });
});
