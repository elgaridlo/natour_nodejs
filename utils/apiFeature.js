class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // this metode we can use for create less than or more than. Sometimes it quites usefull. This is mongoose methode
    // const tours = await Tour.find()
    //   .where('duration')
    //   .lt(5)
    //   .where('difficulty')
    //   .equals('easy');
    // 1 A) FILTERING
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    // eslint-disable-next-line no-unused-vars
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1 B) ADVANCE FILTERING

    // console.log(req.query, queryObj);
    // Metode to do filtering from API like localhost:2000/api/vi/tours?duration=5&difficulty=easy
    let queryStr = JSON.stringify(queryObj);
    // if we use filtering the data would be {duration: {gte:5}} however we need the object would be {duration:{$gte:5}} using dollar on it
    // so we could use replace and irregular expression on it
    // and b before and after we use it for we replace the exact the same as the paramater we want to replace or we dont want to replace adding string in like gtes
    // and the g we use it for multiple replace in one query, if we dont put g, it would be just the first param that would be replace.
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    // return all the object
    return this;
  }

  sort() {
    // 2 ) SORTING
    // if you want to do descending just give - in api like /api/v1/tours?sort=-price
    if (this.queryString.sort) {
      // if we want to add more sort param like price and ratingsAverage
      // and the format api to be /api/v1/tours?sort=price,ratingsAverage
      const sortBy = this.queryString.sort.split(',').join(' ');
      // inside the function sort() it would be like this sort('price ratingsAverage') so there is a white space
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt price');
    }
    return this;
  }

  limitFields() {
    // 3 ) FIELD LIMITING
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join('');
      this.query = this.query.select(fields);
    } else {
      //  minus / - it use for excluding the field
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    // 4 ) PAGINATION
    // the api /tours?page=2&limit=3
    const page = this.queryString.page * 1 || 1; // || 1 mean the default is 1
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeature;
