const {
	Router
} = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto') // to generate a random key
const {
	validationResult
} = require('express-validator')
const nodemailer = require('nodemailer')
const sendgrid = require('nodemailer-sendgrid-transport')
const keys = require('../keys')
const regEmail = require('../emails/registration')
const resetEmail = require('../emails/reset')
const {
	registerValidators
} = require('../utils/validators')
const router = Router()

// creating a transporter (config obj that will send emails)
const transporter = nodemailer.createTransport(sendgrid({
	auth: {
		api_key: keys.SENDGRID_API_KEY
	}
}))

// rendering Login page (we need to send error here)
router.get('/login', (req, res) => {
	res.render('auth/login', {
		title: 'Authorization',
		isLogin: true,
		loginError: req.flash('loginError'),
		registerError: req.flash('registerError')
	})
})

// rendering Logout page
router.get('/logout', (req, res) => {
	// clearing the session (and data from db)
	req.session.destroy(() => {
		res.redirect('/auth/login#login')
	})
})

// ENTER with login
router.post('/login', async (req, res) => {
	try {
		const {
			email,
			password
		} = req.body
		// if user exists
		const candidate = await User.findOne({
			email
		})

		if (candidate) {
			// check password (if from db(candidate.password) === user when login)
			const areSame = await bcrypt.compare(password, candidate.password)

			if (areSame) {
				req.session.user = candidate
				req.session.isAuthenticated = true
				// to avoid redirecting before time
				req.session.save(err => {
					if (err) throw err
					res.redirect('/')
				})
			} else {
				req.flash('loginError', 'Wrong password')
				res.redirect('/auth/login#login')
			}
		} else {
			// if there´s no such user --> error
			req.flash('loginError', 'This user does not exist')
			res.redirect('/auth/login#login')
		}

	} catch (error) {
		console.log(error);
	}
})

// ENTER with registration
router.post('/register', registerValidators, async (req, res) => {
	try {
		const {
			email,
			password,
			name
		} = req.body

		// VALIDATION
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			req.flash('registerError', errors.array()[0].msg)
			return res.status(422).redirect('/auth/login#register')
		}

		// encypring password 
		const hashPassword = await bcrypt.hash(password, 10)
		const user = new User({
			email,
			name,
			password: hashPassword,
			cart: {
				items: []
			}
		})
		// CREATING NEW USER
		await user.save()
		res.redirect('/auth/login#login')
		await transporter.sendMail(regEmail(email))
	} catch (error) {
		console.log(error);
	}
})

// RESET PASSWORD VIEW LINK 
router.get('/reset', (req, res) => {
	res.render('auth/reset', {
		title: 'Forgot password?',
		error: req.flash('error')
	})
})

// NEW Password with token
router.get('/password/:token', async (req, res) => {
	// sending some data for more protection of the page
	if (!req.params.token) {
		return res.redirect('/auth/login')
	}
	try {
		// finding user that has this token in DB
		const user = await User.findOne({
			resetToken: req.params.token,
			resetTokenExp: {
				$gt: Date.now()
			}
		})
		if (!user) {
			return res.redirect('/auth/login')
		} else {
			res.render('auth/password', {
				title: 'Reset password',
				error: req.flash('error'),
				userId: user._id.toString(),
				token: req.params.token
			})
		}
	} catch (error) {
		console.log(error);
	}
})

// RESET PASSWORD PAGE
router.post('/reset', (req, res) => {
	try {
		//  generating random key
		crypto.randomBytes(32, async (err, buffer) => {
			if (err) {
				req.flash('error', 'Something went wrong, try again later')
				return res.redirect('/auth/reset')
			}

			const token = buffer.toString('hex')
			// if email sent to client === mail in DB
			const candidate = await User.findOne({
				email: req.body.email
			})
			// if the person is found 
			if (candidate) {
				candidate.resetToken = token
				// tokel life = 1 hour
				candidate.resetTokenExp = Date.now() + 60 * 60 * 1000
				await candidate.save()
				transporter.sendMail(resetEmail(candidate.email, token))
				res.redirect('/auth/login')
			} else {
				req.flash('error', 'This mail does not exist')
				res.redirect('/auth/reset')
			}
		})



	} catch (error) {
		console.log(error);
	}
})

// NEW PASSWORD RESET PAGE if user with  userID, token exists (password sent through body)
router.post('/password', async (req, res) => {
	try {
		const user = await User.findOne({
			_id: req.body.userId,
			resetToken: req.body.token,
			resetTokenExp: {
				$gt: Date.now()
			}
		})
		// if user --> new password
		if (user) {
			user.password = await bcrypt.hash(req.body.password, 10)
			// deleting all data concerning token reset
			user.resetToken = undefined
			user.resetTokenExp = undefined
			await user.save()
			res.redirect('/auth/login')
		} else {
			req.flash('loginError', 'Token timeout')
			res.redirect('/auth/login')
		}
	} catch (error) {
		console.log(error)
	}
})

module.exports = router