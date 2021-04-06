const express = require('express');
const controller = require('../controllers/tourControllers');
const auth = require('../controllers/authController');
const reviewRouter = require('./reviewRouter');

const router = express.Router();

// * NESTED ROUTE
// * POST/tour/12312343123/reviews
// * GET/tour/12312343123/reviews
// * GET/tour/12312343123/reviews/123123wqe

// router
//   .route('/:tourId/reviews')
//   .post(
//     auth.protect,
//     auth.restrictTo('user'),
//     reviewController.createNewReview
//   );

router.use('/:tourId/reviews', reviewRouter);
router.route('/top-5-cheap').get(controller.aliasTours, controller.getAllTours);
// router.param('id', controller.checkId)

// /tours-within?distance=233&center=-40,45&unit=mi    this is how we usually passing the parameter
// /tours-within/233/center/-40,45/unit/mi    this is nicer than the passing parameter above this
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(controller.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(controller.getDistances);

// It's for getAll and create new tours
router
  .route('/')
  .get(controller.getAllTours)
  .post(
    auth.protect,
    auth.restrictTo('admin', 'lead-guide'),
    controller.createNewTours
  );

router.route('/tour-stats').get(controller.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    auth.protect,
    auth.restrictTo('admin', 'lead-guide'),
    controller.monthlyPlan
  );

// It's for get the id things
router
  .route('/:id')
  .get(controller.getId)
  .patch(
    auth.protect,
    auth.restrictTo('admin', 'lead-guide'),
    controller.updateTours
  )
  .delete(
    auth.protect,
    auth.restrictTo('admin', 'lead-guide'),
    controller.deleteTours
  );

module.exports = router;
