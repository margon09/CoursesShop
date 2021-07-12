const {
	Router
} = require('express')
const {
	validationResult
} = require('express-validator')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const {
	courseValidators
} = require('../utils/validators')
const router = Router()

router.get('/', auth, (req, res) => {
	res.render('add', {
		title: 'Add Course',
		isAdd: true
	})
})

// Adding/Creating a new course
router.post('/', auth, courseValidators, async (req, res) => {
	// checking(validating) for errors
	const errors = validationResult(req)

	if (!errors.isEmpty()) {
		return res.status(422).render('add', {
			title: 'Add Course',
			isAdd: true,
			error: errors.array()[0].msg,
			// To avoid filling-in the form once again if errors occur:
			data: {
				title: req.body.title,
				price: req.body.price,
				img: req.body.img,
			}
		})
	}

	// creating a course
	const course = new Course({
		title: req.body.title,
		price: req.body.price,
		img: req.body.img,
		userId: req.user
	})

	try {
		// goes to db and saves this obj in the collection
		await course.save()
		res.redirect('/courses')
	} catch (error) {
		console.log(error)
	}
})

module.exports = router