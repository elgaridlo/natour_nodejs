// Review, Rating, createdAt, ref to Tour, ref to User
const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review canot be empty'],
      maxlength: [200, 'It is more than 200 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please fill the rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // to not showing this param to the client or consumer
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour', // this is collection in Mongoose
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // this is collection in Mongoose
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // * Ini digunakan untuk membuat virtual param ketika ada param yang tidak ada diDB terus kita mau melempar ke client
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// QUERY MIDDLEWARE
// reviewSchema.pre(/^find/, function (next) {
//   //  * This always point to the current query
//   this.populate({
//     path: 'tours',
//     select: 'name',
//   });
//   this.populate({
//     path: 'users',
//     select: 'name photo',
//   });
//   next();
// });

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //  * This always point to the current query
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log('stats = ', stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Update avgRating when we create new review
reviewSchema.post('save', function () {
  // this points current review
  // this.constructor itu merujuk ke model yang sekarang lagi membuat document, kalau disini ya berarti Review
  // Kenapa dibikin begini ? karena butuh Review.calcAverageRatings not defined, kalau dipindah ke bawah reviewSchema not defined juga
  // jadi pakainya constructor
  this.constructor.calcAverageRatings(this.tour);
});

// Update avgRating and quantity while update and delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(' R = ', this.r);
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // where the metode place it ? yeah in this.r
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
