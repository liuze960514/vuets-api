const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  des: {
    type: String
  },
  pwd: {
    type: String,
    required: true
  },
  role: {
    type: String
  },
  key: {
    type: String,
    default: 'visitor'
  },
  avatar: {
    type: String
  },
  autoLogin: {
    type: Boolean
  },
  email: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('users', UserSchema);