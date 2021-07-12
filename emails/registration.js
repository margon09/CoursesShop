const keys = require('../keys')

module.exports = function (email) {
	return {
		to: email,
		from: keys.EMAIL_FROM,
		subject: 'Your registration was successful. You managed to create your account.',
		html: `
			<h1>Welcome to our shop</h1>
			<p>You have succesfully created your account with the following mail:  ${email}</p>
			<hr />
			<a href="${keys.BASE_URL}">Online courses shop</a>
		`
	}
}