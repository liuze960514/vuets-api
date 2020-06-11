const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ProfileSchema = new Schema({
  type: {
    type: String
  },
  title: {
    type: String
  },
  level: {
    type: String
  },
  count: {
    type: String
  },
  date: {
    type: String
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
