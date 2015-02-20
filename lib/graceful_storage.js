// GracefulStorage http://co-sche.mit-license.org/

(function(global) {
	var PREFIX = 'GRACEFUL_STORAGE';
	var DELIMITER = ':';

	function GracefulStorage(rawStorage, namespace, validator) {
		this.namespace = namespace;
		this.validator = validator;
		this.storage = rawStorage;
		// compaction
		this.each(function() {});
	}

// static methods
	GracefulStorage.sweep = function(rawStorage, whiteNamespaceList) {
		var prefixedWhitelist = whiteNamespaceList.map(function(namespace) {
			return join(PREFIX, namespace);
		});
		_eachKey(rawStorage, function(key) {
			var isWhite = prefixedWhitelist.some(function(whiteKey) {
				return startsWith(key, whiteKey);
			});

			if (!isWhite) {
				_del(rawStorage, key);
			}
		});
	};

// instance methods
	var gs = GracefulStorage.prototype;

	gs._set = function(key, container) {
		var valid = this.validate(key, container.data);
		if (valid) {
			_set(this.storage, this.prefix(key), container);
		}
		return valid;
	};

	gs._pack = function(value, exptime) {
		return {
			expdate: !!exptime && +new Date() + exptime,
			data: value
		};
	};

	gs._get = function(key) {
		var container = _get(this.storage, this.prefix(key));
		if (!container) return container;

		var expdate = container.expdate;

		if ((!expdate || expdate >= + new Date()) && this.validate(key, container.data)) {
			return container;
		} else {
			this.del(key);
			return;
		}
	};

	/**
	 * GracefulStorage#set
	 * @param key
	 * @param value
	 * @param exptime
	 * @returns {boolean} whether or not it was saved
	 */

	gs.set = function set(key, value, exptime) {
		if (typeof value === 'undefined') return false;
		var container = this._pack(value, exptime);
		return this._set(key, container);
	};

	/**
	 * GracefulStorage#get
	 * @param key
	 * @returns {*|undefined} value
	 */

	gs.get = function get(key) {
		var container = this._get(key);
		return container && container.data;
	};

	/**
	 * GracefulStorage#expire
	 * @param key
	 * @param exptime
	 * @returns {boolean} whether or not it was expired
	 */

	gs.expire = gs.touch = function touch(key, exptime) {
		var current = this.get(key);
		if (current) {
			this.set(key, current, exptime);
		}
		return !!current;
	};

	/**
	 * GracefulStorage#del
	 * @param key
	 * @returns {undefined}
	 */

	gs.del = function del(key) {
		_del(this.storage, this.prefix(key));
	};

	/**
	 * GracefulStorage#copy
	 * @param key
	 * @param newKey
	 * @returns {boolean} whether or not it was copied
	 */
	gs.copy = function copy(key, newKey) {
		var container = this._get(key);
		return !!container && this._set(newKey, container);
	};

	/**
	 * GracefulStorage#rename
	 * @param oldKey
	 * @param newKey
	 * @returns {boolean} whether or not it was renamed
	 */
	gs.rename = function rename(key, newKey) {
		var isCopied = this.copy(key, newKey);
		if (isCopied) {
			this.del(key);
		}
		return isCopied;
	};

	gs.each = function(callback) {
		var self = this;
		self._eachKey(function(key) {
			var value = self.get(key);
			if (typeof value !== 'undefined') {
				callback(value, key);
			}
		});
	};

	gs.dump = function() {
		var dump = {};
		this.each(function(value, key) {
			dump[key] = value;
		});
		return dump;
	};

	gs.flush = function flush() {
		var self = this;
		self._eachKey(function(key, prefixedKey) {
			_del(self.storage, prefixedKey);
		});
	};

	gs.validate = function validate(key, value) {
		var valid = !this.validator || this.validator.call(this, key, value);
		return !!valid;
	};

	gs.prefix = function(key) {
		return join(PREFIX, this.namespace, key);
	};

	gs._eachKey = function(callback) {
		var prefix = this.prefix();
		_eachKey(this.storage, function(prefixedKey) {
			if (startsWith(prefixedKey, prefix)) {
				var key = prefixedKey.split(prefix)[1];
				callback(key, prefixedKey);
			}
		});
	};

// Raw Storage operations (include JSON operation)
	function _set(storage, key, value) {
		var item = JSON.stringify(value);
		try {
			storage.setItem(key, item);
		} catch(e) {
			// Remove before set for WebStorage bug <http://stackoverflow.com/questions/2603682>
			storage.removeItem(key);
			storage.setItem(key, item);
		}
	}

	function _get(storage, key) {
		var json = storage.getItem(key);
		return json ? JSON.parse(storage.getItem(key)) : void(0);
	}

	function _del(storage, key) {
		return storage.removeItem(key);
	}

	function _eachKey(storage, callback) {
		return Object.keys(storage).forEach(function(key) {
			if (startsWith(key, PREFIX)) {
				callback(key);
			}
		});
	}

// utility functions

	function startsWith(str, start) {
		return str.lastIndexOf(start, 0) === 0;
	}

	function join() {
		return Array.prototype.map.call(arguments, function(item) {
			return item && item.replace(DELIMITER,　'\\' + DELIMITER);
		}).join(DELIMITER);
	}

// export
	if ( typeof define === 'function' && define.amd ) {
		define(function() { return GracefulStorage; });
	} else if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = GracefulStorage;
	} else {
		global.GracefulStorage = GracefulStorage;
	}
})(typeof window !== 'undefined' ? window : this);
