
// // const mongoose = require('mongoose');
// // const bcrypt = require('bcryptjs');
// // const userSchema = new mongoose.Schema({
// // name: {
// // type: String,
// // required: true
// // },
// // email: {
// // type: String,
// // required: true,
// // unique: true
// // },
// // password: {

// // type: String,
// // required: true
// // },
// // phone: {
// // type: String,
// // required: true
// // },
// // address: {
// // street: String,
// // city: String,
// // country: String
// // }
// // }, {
// // timestamps: true
// // });
// // // Hash password before saving
// // userSchema.pre('save', async function(next) {
// // if (!this.isModified('password')) return next();
// // this.password = await bcrypt.hash(this.password, 12);
// // next();
// // });
// // // Compare password method
// // userSchema.methods.correctPassword = async function(candidatePassword, userPassword)
// // {
// // return await bcrypt.compare(candidatePassword, userPassword);
// // };
// // module.exports = mongoose.model('User', userSchema);
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   phone: {
//     type: String,
//     required: true
//   },
//   address: {
//     street: String,
//     city: String,
//     country: String
//   },
//   // Add admin field
//   isAdmin: {
//     type: Boolean,
//     default: false
//   },
//   // Add password reset fields
//   resetPasswordToken: String,
//   resetPasswordExpires: Date
// }, {
//   timestamps: true
// });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   // Only run this function if password was actually modified
//   if (!this.isModified('password')) return next();
  
//   // Hash the password with cost of 12
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Compare password method - FIXED VERSION
// userSchema.methods.correctPassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    country: String
  },
  
  // Admin user flag
  isAdmin: {
    type: Boolean,
    default: false
  },

  // OTP fields for password reset
  resetPasswordOTP: String,        // Stores 6-digit code
  resetPasswordExpires: Date       // OTP expiry time

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // If password is NOT changed, skip hashing
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison for login
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
