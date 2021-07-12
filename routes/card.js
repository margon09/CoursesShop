const {
	Router
} = require('express')
const Course = require('../models/course')
const router = Router()
const auth = require('../middleware/auth')


// HELPER FUNCTION
function mapCartItems(cart) {
	return cart.items.map(c => ({
		...c.courseId._doc,
		id: c.courseId.id,
		count: c.count
	}))
}

function computePrice(courses) {
	return courses.reduce((total, course) => {
		return total += course.price * course.count
	}, 0)
}


// adding a new course to the cart (a controller function)
router.post('/add', auth, async (req, res) => {
	const course = await Course.findById(req.body.id)
	await req.user.addToCart(course)
	res.redirect('/card')
})

// removing items from the cart
router.delete('/remove/:id', auth, async (req, res) => {
	await req.user.removeFromCart(req.params.id)
	const user = await req.user.populate('cart.items.courseId').execPopulate()
	const courses = mapCartItems(user.cart)
	//returning cart obj to the frontend
	const cart = {
		courses,
		price: computePrice(courses)
	}
	res.status(200).json(cart)
})

// showing page
router.get('/', auth, async (req, res) => {
	// getting the cart, which is in the user model
	const user = await req.user
		.populate('cart.items.courseId')
		.execPopulate()

	// sending to the frontend
	const courses = mapCartItems(user.cart)
	res.render('card', {
		title: 'Cart',
		isCard: true,
		courses: courses,
		price: computePrice(courses)
	})
})

module.exports = router