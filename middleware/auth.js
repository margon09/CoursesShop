module.exports = function (req, res, next) {
	// checking authorization
	if (!req.session.isAuthenticated) {
		return res.redirect('/auth/login')
	}
	next()
}