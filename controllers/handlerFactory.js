const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeature = require('../utils/apiFeature');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'Success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log('Model = ', Model.modelName.toLowerCase());
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // its for activate validator in tourModel if it sets to false the validation it wont work
    });

    if (!doc) {
      return next(new AppError('No documents found with that ID', 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'Success',
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // * populate digunakan untuk populate atau memunculkan data guide yang hanya berbentuk id
    // * menjadi the actual data. Note: populate did query to populate the data so it must be efect on th performace
    // * If it uses in small application so it's not a big deal
    // const doc = await Model.findById(req.params.id).populate('reviews');
    // We created it like this because not all the getBy Id are the same, it's different for tour get by Id
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const feature = new APIFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    // * digunakan untuk menjelaskan kegunaan data
    // const doc = await feature.query.explain();
    const doc = await feature.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'Success',
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });
