(function(global) {
	var PREFIX = 'GRACEFUL_STORAGE';

	var initialized = false;
	var whitelist = {};
	var instances = {};

	function GracefulStorage(namespace) {
		this.namespace = namespace;
		this.compaction();
	}

	GracefulStorage.initWhiteList = function initWhiteList(whitelistConfig) {
		if (!initialized) {
			var isValidConfig = false;
			if (getType(whitelistConfig) === 'object') {
				isValidConfig = Object.keys(whitelistConfig).every(function(namespace) {
					var whiteKeyList = whitelistConfig[namespace];
					var type = getType(whiteKeyList);
					if (type === 'array') {
						return whiteKeyList.every(function(whiteKey) {
							var type = getType(whiteKey);
							if (type === 'string' || type === 'regexp') {
								return true;
							} else {
								return false;
							}
						});
					}
				});
			}

			if (isValidConfig) {
				whitelist = whitelistConfig;
				initialized = true;
			}

			return initialized;
		} else {
			return false;
		}
	};

	GracefulStorage.getInstance = function(namespace) {
		if (namespace in whitelist) {
			return instances[namespace] || (instances[namespace] = new GracefulStorage(namespace));
		} else {
			return null;
		}
	};

	GracefulStorage.sweep = function() {
		eachInLocalStorage(function(key) {
			if (!startsWith(key, PREFIX + ':')) return;

			var white = whitelist.some(function(dummy, namespace) {
				return startsWith(key, PREFIX + ':' + namespace + ':', 0);
			});

			if (!white) remove(key);
		});
	};

	var gs = GracefulStorage.prototype;

	//保存
	gs.set = function set(key, value, exptime) {
		var white = this.isWhite(key);
		var raw = this.createRaw(key, value, exptime);
		remove(raw.key);

		if (white) {
			localStorage.setItem(raw.key, raw.value);
		}

		return white;
	};

	gs.createRaw = function(key, value, exptime) {
		return {
			key: this.prefix(key),
			value: JSON.stringify({
				expdate: !!exptime && (new Date() | 0) + exptime,
				data: value
			})
		};
	};

	// 取得
	gs.get = function get(key) {
		var prefixedKey = this.prefix(key);
		var json = localStorage.getItem(prefixedKey);
		if (!json) return;

		var container = JSON.parse(json);
		var expdate = container.expdate;

		if (this.isWhite(key) && (!expdate || expdate >= (new Date() | 0))) {
			return container.data;
		} else {
			remove(prefixedKey);
			return;
		}
	};

	// 延命
	gs.touch = function touch(key, exptime) {
		var current = this.get(key);
		if (current) {
			this.set(key, current, exptime);
		}
		return !!current;
	};

	// 削除 (deleteにしたかったけど予約語だから我慢)
	gs.del = function del(key) {
		var exists = !!this.get(key);
		if (exists) {
			remove(this.prefix(key));
		}
		return exists;
	};

	// 全削除
	gs.flush = function flush() {
		var prefix = this.prefix();
		eachInLocalStorage(function(key) {
			if (startsWith(key, prefix)) remove(key);
		});
	};

	// 掃除
	gs.compaction = function compaction() {
		var self = this;
		eachInLocalStorage(function(key) {
			key = key.split(self.prefix())[1];
			if (key) self.get(key);
		});
	};

	gs.prefix = function(key) {
		return [PREFIX, this.namespace, key].join(':');
	};

	gs.isWhite = function(key) {
		if (!key || !initialized && !whitelist[this.namespace]) return false;

		return whitelist[this.namespace].some(function(pattern) {
			if (typeof pattern === 'string') {
				return key === pattern;
			} else if (pattern instanceof RegExp) {
				return !!key.match(pattern);
			} else {
				return false;
			}
		});
	};

	function getType(obj) {
		return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
	}

	function startsWith(str, start) {
		return str.lastIndexOf(start, 0) === 0;
	}

	function remove(key) {
		return localStorage.removeItem(key);
	}

	function eachInLocalStorage(callback) {
		Object.keys(localStorage).forEach(callback);
	}

	if ( typeof define === "function" && define.amd ) {
		define(function() { return GracefulStorage; });
	} else if ( typeof module !== "undefined" && module.exports ) {
		module.exports = GracefulStorage;
	} else {
		global.GracefulStorage = GracefulStorage;
	}
})(typeof window !== 'undefined' ? window : this);
