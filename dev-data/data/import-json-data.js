const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModels');
const User = require('../../models/userModels');
const Review = require('../../models/reviewModels');

dotenv.config({ path: './config.env' });
// kenapa const app dibawah dotenv ? karena kita membutuhkan data environment variable dari doteenv kalau tidak ada library morgan tidak akan terpanggil

const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection Successfull'));

//   Read Json File
const tour = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA TO DATABASE

const importData = async () => {
  try {
    await Tour.create(tour);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('data successfuly loaded!');
  } catch (err) {
    console.log('error import db = ', err);
  }
  // it use for aggresively to stop the app
  process.exit();
};

// DELETE ALL DATA FROM DB COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfuly delete!');
  } catch (err) {
    console.log('error import db = ', err);
  }
  process.exit();
};

// HOW TO CALL THIS ? SO YOU CAN CALL IT USING COMMAND LINE IN TERMINAL
// node dev-data/data/import-json-data.js --import or --delete
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
