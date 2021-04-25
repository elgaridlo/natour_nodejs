const crypto = require('crypto');
const mongoose = require('mongoose');
// const slugify = require('slugify');
const validators = require('validator');

const bycrpt = require('bcryptjs');
// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please tell us your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validators.default.isEmail, 'Please provide valid email'],
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'A password must contain at least 8 character'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'A password must contain at least 8 character'],
        validate: {
            validator: function(el) {
                // this only work when create new user save
                return el === this.password;
            },
            message: `The password aren't the same`,
        },
        select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false, // to not showing this param to the client or consumer
    },
}, {
    // here the option value
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// userSchema.pre('save', async function(next) {
//     // only run if the password is modified
//     if (!this.isModified('password')) {
//         return next();
//     }
//     // Hash the password cost of 12
//     this.password = await bycrpt.hash(this.password, 12);
//     this.passwordConfirm = undefined;
//     next();
// });

// userSchema.pre('save', async function(next) {
//     // isNew is checking if the documents is new or not
//     if (!this.isModified('password' || this.isNew)) return next();

//     // substract the passwordChanget - 1000 because sometimes the token created a bit before than an time passwordChangedAt
//     this.passwordChangedAt = Date.now() - 1000;
//     next();
// });

userSchema.pre(/^find/, async function(next) {
    // this points to current querry
    this.find({ active: { $ne: false } });
    next();
});

// instance method that can be available in all document collections in db server
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    console.log('mokel = ', candidatePassword, userPassword)
    return await bycrpt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) {
    console.log('jwt = ', JWTTimestamp);
    console.log(this.passwordChangedAt);
    if (this.passwordChangedAt) {
        const changesTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        console.log(JWTTimestamp, changesTimestamp);
        return JWTTimestamp < changesTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    // this resetToken that we send to the user and only the user that can access, and this cannot save to db
    const resetToken = crypto.randomBytes(32).toString('hex');

    // sha256 is algorithm
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);
    // 10 * 60 second * 1000 millisecond = it's 10 minutes
    const timingToken = 10 * 60 * 1000;
    this.passwordResetExpired = Date.now() + timingToken;
    // send to email
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;