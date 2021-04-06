const Tour = require('../models/tourModels');
const catchAssync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

exports.aliasTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// ROUTEHANDLER

// catchAssync(async (req, res, next) => {
//   // * populate digunakan untuk populate atau memunculkan data guide yang hanya berbentuk id
//   // * menjadi the actual data. Note: populate did query to populate the data so it must be efect on th performace
//   // * If it uses in small application so it's not a big deal
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'Success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getAllTours = factory.getAll(Tour);
exports.getId = factory.getOne(Tour, { path: 'reviews' });
exports.createNewTours = factory.createOne(Tour);
exports.updateTours = factory.updateOne(Tour);
exports.deleteTours = factory.deleteOne(Tour);

exports.getTourStats = catchAssync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, //it will counter the number 1 to numtours
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, //show all the data but not the EASY and it shows that match can use multiple times
    // },
  ]);
  res.status(200).json({
    status: 'Success',
    data: { stats },
  });
});

exports.monthlyPlan = catchAssync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' }, // to create an array
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 }, //to show or not the property
    },
    {
      $limit: 6,
    },
    {
      $sort: { month: 1 },
    },
  ]);
  res.status(200).json({
    status: 'Success',
    data: { plan },
  });
});

// -7.407157, 110.829762
exports.getToursWithin = catchAssync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // it should be convert in to earth radius, i dont understand but i should learn about it later
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    status: 'Success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAssync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // divide 1000 to get kilometer

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distance = await Tour.aggregate([
    {
      // geoNear property has to be on the first stage on the pipeline
      // if we only have one field that has geospatial index we dont need key, but if we have multiple geospatial index we need the key
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      data: distance,
    },
  });
});
