var data = {};

module.exports = Object.create({
	getItem: function(key) {
		return typeof this[key] !== 'undefined' ? this[key] : null;
	},

	setItem: function(key, value) {
		this[key] = value + "";
	},
	removeItem: function(key) {
		delete this[key];
	}
});
