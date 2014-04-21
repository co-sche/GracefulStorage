var localStorage = require('./local_storage');
var expect = require('expect.js');
var sinon = require('sinon');
var GracefulStorage = require('../lib/graceful_storage');
var clock = sinon.useFakeTimers();

describe('GracefulStorage', function() {
	var s1 = new GracefulStorage(localStorage, 's1');
	var s2 = new GracefulStorage(localStorage, 's2', function(key) {
		return ['key1', 'key2'].indexOf(key) !== -1;
	});

	beforeEach(function() {
		localStorage.clear();
	});

	describe('#set()', function() {
		it("should return true if it was successfully set", function() {
			expect(s1.set('key1', 'val1')).to.be(true);
		});

		it("should return true if it was successfully set (with exptime)", function() {
			expect(s1.set('key1', 'val1', 100)).to.be(true);
		});

		it('should return false if value is undefined', function() {
			expect(s1.set('key1')).to.be(false);
		});

		it("should return false if it's invalid", function() {
			expect(s2.set('key3', 'val3')).to.be(false);
		});
	});

	describe('#get()', function() {
		it("should return undefined if it's not set", function() {
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should return saved value", function() {
			s1.set('key1', 'val1');
			expect(s1.get('key1')).to.be('val1');
		});

		it("should return undefined when that is invalid even if it was saved", function() {
			var raw = s2.createRaw('key3', 'val3');
			localStorage.setItem(raw.key, JSON.stringify(raw.value));
			expect(s2.get('key3')).to.be(void(0));
		});

		it("should return undefined if it was expired", function() {
			s1.set('key1', 'val1', 100);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			clock.tick(20);
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should return different value if storages are belong to other namespace", function() {
			s1.set('key1', 'val1');
			s2.set('key1', 'bal1');
			expect(s1.get('key1')).to.be('val1');
			expect(s2.get('key1')).to.be('bal1');
		});
	});

	describe('#touch()', function() {
		it("should be touched successfuly if item is live", function() {
			s1.set('key1', 'val1', 100);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			expect(s1.touch('key1', 100)).to.be(true);
			clock.tick(90);
			expect(s1.get('key1')).to.be('val1');
			clock.tick(100);
			expect(s1.get('key1')).to.be(void(0));
		});

		it("should not be touched if item isn't live", function() {
			expect(s1.get('key1')).to.be(void(0));
			expect(s1.touch('key1')).to.be(false);
		});
	});

	describe('#del()', function() {
		it("should delete key:value", function() {
			s1.set('key2', 'val2');
			expect(s1.del('key2')).to.be(void(0));
			expect(s1.get('key2')).to.be(void(0));
		});
	});

	describe('#flush()', function() {
		it("should delete all key:value in self's namespace", function() {
			s1.set('key1', 'val1');
			s1.set('key2', 'val2');
			s2.set('key1', 'val1');
			s2.set('key2', 'val2');
			expect(s1.flush()).to.be(void(0));
			expect(s1.get('key1')).to.be(void(0));
			expect(s1.get('key2')).to.be(void(0));
			expect(s2.get('key1')).to.be('val1');
			expect(s2.get('key2')).to.be('val2');
		});
	});

	describe('#each()', function() {
		it('should call callback-function each in live keys', function() {
			s1.set('key1', 'val1');
			s1.set('key2', 'val2', 100);
			s1.set('key3', 'val3');
			s2.set('key1', 'val1');
			s2.set('key2', 'val2');

			var result = {};
			clock.tick(90);
			s1.each(function(val, key) {
				result[key] = val;
			});
			expect(result).to.eql({key1: 'val1', key2: 'val2', key3: 'val3'});

			result = {};
			clock.tick(20);
			s1.each(function(val, key) {
				result[key] = val;
			});
			expect(result).to.eql({key1: 'val1', key3: 'val3'});
		});
	});

	describe('#dump()', function() {
		it('should call callback-function each in live keys', function() {
			s1.set('key1', 'val1');
			s1.set('key2', 'val2', 100);
			s1.set('key3', 'val3');
			s2.set('key1', 'val1');
			s2.set('key2', 'val2');
			clock.tick(90);
			expect(s1.dump()).to.eql({key1: 'val1', key2: 'val2', key3: 'val3'});
			clock.tick(20);
			expect(s1.dump()).to.eql({key1: 'val1', key3: 'val3'});
		});
	});

	describe('.sweep()', function() {
		it("should sweep successfully ignore white namespace list and out of GracefulStorage key:value", function() {
			localStorage.setItem('other', 'foo');
			s1.set('key1', 'val1');
			s1.set('key2', 'val2');
			s2.set('key1', 'val1');
			s2.set('key2', 'val2');
			GracefulStorage.sweep(localStorage, ['s2']);
			expect(localStorage.getItem('other')).to.be('foo');
			expect(s1.get('key1')).to.be(void(0));
			expect(s1.get('key2')).to.be(void(0));
			expect(s2.get('key1')).to.be('val1');
			expect(s2.get('key2')).to.be('val2');
		});
	});

	function dump() {
		Object.keys(localStorage).forEach(function(key) {
			console.log(key, localStorage[key]);
		});
	}

});
