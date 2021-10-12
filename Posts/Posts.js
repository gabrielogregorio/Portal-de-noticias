const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const Category = require('../Categories/Categories');


var postSchema = new Schema({
  title: String,
  img: String,
  body: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  slug: String,
  views: Number,
  description: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
}, {collection: 'noticias'})


var Post = mongoose.model('Post', postSchema);

module.exports = Post
