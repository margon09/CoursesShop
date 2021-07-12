const {
	body
} = require('express-validator')
const User = require('../models/user')

// USER RIGISTRATION
exports.registerValidators = [
	body('email')
	.isEmail().withMessage('Enter the correct email address')
	// async validators
	.custom(async (value, {
		req
	}) => {
		try {
			const user = await User.findOne({
				email: value
			})
			if (user) {
				return Promise.reject('This email is already taken')
			}
		} catch (error) {
			console.log(error);
		}
	})
	.normalizeEmail(), // sanitizer

	body('password', 'Password should contain minimum 6 symbols')
	.isLength({
		min: 6,
		max: 56
	})
	.isAlphanumeric() // containing numbers and latin letters
	.trim(), // sanitizer

	// to see that password is the same
	body('confirm')
	.custom((value, {
		req
	}) => {
		if (value !== req.body.password) {
			throw new Error('Password lines should match each other')
		}
		return true
	})
	.trim(), // sanitizer,

	body('name').isLength({
		min: 3
	}).withMessage('Your name should contain minimum 3 symbols')
	.trim() // sanitizer
]

// ADD COURSE
exports.courseValidators = [
	body('title').isLength({
		min: 3
	}).withMessage('Minimum title length should be 3 symbols')
	.trim(),

	body('price').isNumeric().withMessage('Enter the correct price'),

	body('img', 'Enter the correct URL image').isURL()
]