(function(global) {
	var PREFIX = 'GRACEFUL_STORAGE';

	function GracefulStorage(namespace, whiteKeyList) {
		this.namespace = namespace;
		this.whitelist = whiteKeyList || [];
		this.compaction();
	}

	GracefulStorage.sweep = function(whiteNamespacelist) {
		eachInLocalStorage(function(key) {
			if (!startsWith(key, PREFIX + ':')) return;

			var white = whiteNamespacelist.some(function(namespace) {
				return startsWith(key, PREFIX + ':' + namespace + ':', 0);
			});

			if (!white) remove(key);
		});
	};

	var gs = GracefulStorage.prototype;

	//保存
	gs.set = function set(key, value, exptime) {
		var white = this.isWhite(key);
		key = this.prefix(key);
		remove(key);

		if (white) {
			var container = {
				expdate: !!exptime && (new Date() | 0) + exptime,
				data: value
			};
			localStorage.setItem(key, JSON.stringify(container));
		}

		return white;
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
		key = this.prefix(key);
		var current = this.get(key);
		if (current) {
			this.set(key, current.data, exptime);
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
		if (!key) return false;
		return this.whitelist.some(function(pattern) {
			if (typeof pattern === 'string') {
				return key === pattern;
			} else if (pattern instanceof RegExp) {
				return !!key.match(pattern);
			} else {
				return false;
			}
		});
	};

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
})(window);
