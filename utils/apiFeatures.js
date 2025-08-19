class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const mongoQuery = {};

    for (let key in queryObj) {
      const value = queryObj[key];
      const match = key.match(/^(.+)\[(gte|gt|lte|lt|ne|eq)\]$/);
      if (match) {
        const field = match[1];
        const operator = `$${match[2]}`;
        if (!mongoQuery[field]) mongoQuery[field] = {};
        mongoQuery[field][operator] = isNaN(value) ? value : Number(value);
      } else {
        mongoQuery[key] = isNaN(value) ? value : Number(value);
      }
    }

    this.query = this.query.find(mongoQuery);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      // query=query.select('name duration difficulty price');
    } else {
      this.query = this.query.select('-__v'); // Exclude __v field
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
