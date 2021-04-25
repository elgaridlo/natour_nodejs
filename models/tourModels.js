const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModels');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [
      //   validator.isAlpha(),
      //   'A tour name must only contain character',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a durations'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //enum just work on string
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be above 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.66666 * 10 = 46.6666 = 47 / 10 = 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      // CUSTOME VALIDATOR
      type: Number,
      validate: {
        // it only works in post or curent value but it doesnt work in update
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
        //({VALUE}) this work inside of the mongoose it will get the same value as the val
      },
    },
    summary: {
      type: String,
      // cut the whitelist "     the wew    " to be "the wew"
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // to not showing this param to the client or consumer
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON : must be Type string and enum only Pointer
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // this is collection in Mongoose
      },
    ],
  },
  {
    // here the option value
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * 1 for ascending and -1 for descending
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// * It's geospatial so it has to be different behaviuor. Then we tell the mongoose that we use 2dimentional sphere
tourSchema.index({ startLocation: '2dsphere' });

// * why we use function () ? because if we use arrow function we cannot use this on it
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  // * dimana id kita diletakkan di foreign collection di kasus ini di Review Collection
  foreignField: 'tour',
  // * kemudian param yang sesuai dengan param di tour di review collection adalah id kita
  localField: '_id',
});

// * DOCUMENTS MIDDLEWATE: runs before .save and .create but it will not run if you call .insertMany
tourSchema.pre('save', function (next) {
  // this.locations.forEach(element => {
  //   console.log('elemtn - ', element)
  // })
  console.log('this locations == ', this.locations)
  console.log('this name == ', this.name)
  
  this.slug = slugify(this.name, { lower: true });
  next();
});

// *** We have another trick so we don't need this, so look to the DB Schema
// Inject the guide document in to the tour
// tourSchema.pre('save', async function (next) {
// * guidePromise has alot of promises because we call the user.findById
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));
// * Promise.all deleting the promise insinde the guidePromises
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// tourSchema.pre('save', (next) => {
//   console.log('will save soon!');
//   next();
// });
// It wiil show the param after we save the json to DB
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// * /^find/ it means all the function that start using find it will acivated the middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  //  * This always point to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query tooks ${Date.now() - this.start} milliseconds`);
  next();
});

// tourSchema.pre('aggregate', function (next) {
//   // this pipeline contain query like in aggregate function in controller
//   // unshift for pipeline but work the same as filter and it uses for not to show the secret data
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
