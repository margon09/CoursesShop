const keys = require('../keys')

module.exports = function (email, token) {
	return {
		to: email,
		from: keys.EMAIL_FROM,
		subject: 'Password reset.',
		html: `
			<h1>Have you forgotten your password?</h1>
			<p>Ignore this message in case you remember your password correctly</p>
			<p> If you have forgotten your password, press the link below and you will have an option to reset it</p>
			<p><a href="${keys.BASE_URL}/auth/password/${token}">Reset passowrd</a></p>
			<hr />
			<a href="${keys.BASE_URL}">Online courses shop</a>
		`
	}
}