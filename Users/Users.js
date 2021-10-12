const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const Post = require('../Posts/Posts');


var userSchema = new Schema({
  name: String,
  email: String,
  img: String,
  password: String,
  postsAuthor: { type: Schema.Types.ObjectId, ref: 'Post' },
}, {collection: 'users'})


var User = mongoose.model('User', userSchema);

module.exports = User
