const mongoose = require('mongoose');
var Schema = mongoose.Schema;


var categorySchema = new Schema({
  name: String,
  post: { type: Schema.Types.ObjectId, ref: 'Post' },
}, {collection: 'categories'})


var Category = mongoose.model('Category', categorySchema);

module.exports = Category
