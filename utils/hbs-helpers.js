module.exports = {
	// helper name (e.g.ifEquals)
	ifeq(a, b, options) {
		if (a == b) {
			return options.fn(this)
		}
		return options.inverse(this)
	}
}