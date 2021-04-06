const express = require('express');
const controller = require('../controllers/reviewController');
const auth = require('../controllers/authController');

// Merge params to true digunakan untuk me redirect dari manapun yang menggunakan module ini
const router = express.Router({ mergeParams: true });

router.use(auth.protect);

router
  .route('/')
  .get(controller.getAllReview)
  .post(
    auth.restrictTo('user'),
    controller.setTourUserId,
    controller.createNewReview
  );

router
  .route('/:id')
  .get(controller.getReview)
  .patch(auth.restrictTo('user', 'admin'), controller.updateReview)
  .delete(auth.restrictTo('user', 'admin'), controller.deleteReview);

module.exports = router;
