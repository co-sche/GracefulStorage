localStorage = require('./local_storage');
var expect = require('expect.js');
var sinon = require('sinon');
var GracefulStorage = require('../lib/graceful_storage');
GracefulStorage.initWhiteList({
	"s1": ["key1", "key2"],
	"s2": ["key1", "key2"]
});

var clock = sinon.useFakeTimers();

describe('GracefulStorage', function() {
	var s1 = GracefulStorage.getInstance('s1');
	var s2 = GracefulStorage.getInstance('s2');

	describe('standard get/set test', function() {
		it("should be undefined if it's not set", function() {
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should be true if it was successfully set ", function() {
			expect(s1.set('key1', 'val1')).to.be(true);
		});

		it("should return saved value", function() {
			expect(s1.get('key1')).to.be('val1');
		});
	});

	describe('namespace test', function() {
		it("should be separated storages if these are belongs to other namespace", function() {
			expect(s1.get('key1')).to.be('val1');
			expect(s2.get('key1')).to.be(void(0));
			expect(s2.set('key1', 'bal1')).to.be(true);
			expect(s1.get('key1')).to.be('val1');
			expect(s2.get('key1')).to.be('bal1');
		});
	});

	describe('whitelist test', function() {
		it("should not set if it's out of whitelist", function() {
			expect(s1.set('key3', 'val3')).to.be(false);
			expect(s1.get('key3')).to.be(void(0));
		});

		it("can't get item that out of whilist even if it is saved", function() {
			var raw = s1.createRaw('key3', 'val3');
			localStorage.setItem(raw.key, raw.value);
			expect(s1.get('key3')).to.be(void(0));
		});
	});

	describe('expiration test', function() {
		it("should be expired successfully", function() {
			expect(s1.set('key1', 'val1', 100)).to.be(true);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			clock.tick(20);
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should be touched successfuly if item is lived", function() {
			expect(s1.set('key1', 'val1', 100)).to.be(true);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			expect(s1.touch('key1', 100)).to.be(true);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			clock.tick(100);
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should not be touched if item isn't saved", function() {
			expect(s1.get('key1')).to.be(void(0));
			expect(s1.touch('key1')).to.be(false);
		});
	});

	describe('deletion test', function() {
		it("should return true if it was successfully deleted", function() {
			expect(s1.set('key2', 'val2')).to.be(true);
			expect(s1.get('key2')).to.be('val2');

			expect(s1.del('key2')).to.be(true);
			expect(s1.get('key2')).to.be(void(0));
		});

		it("should return false if it was not deleted", function() {
			expect(s1.get('key2')).to.be(void(0));
			expect(s1.del('key2')).to.be(false);
		});
	});

});
