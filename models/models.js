
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
}
}, {
timestamps: true
});
// Hash password before saving
userSchema.pre('save', async function(next) {
if (!this.isModified('password')) return next();
this.password = await bcrypt.hash(this.password, 12);
next();
});
// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword)
{
return await bcrypt.compare(candidatePassword, userPassword);
};
module.exports = mongoose.model('User', userSchema);