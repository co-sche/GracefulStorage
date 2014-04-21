# GracefulStorage

localStorage wrapper that has namespace, expire, and cleanup functions

## Usage
```javascript
var s1 = new GracefulStorage(localStorage, 'storage1');
s1.set('key1', { foo: 'bar' });
s1.get('key1');
// -> { foo: 'bar' }

s1.set('key2', 'val2', 1000);
s1.get('key2');
// -> val2
setTimeout(function() {
	s1.get('key2');
// -> undefined
}, 1110);
```

## API Document

### new GracefulStorage(storage: WebStorage, namespace: String, validator: (key: String, value: JSONSerializable) => Boolean)
#### storage
Base storage object.
localStorage or sessionStorage
#### namespace
Used for separate storage domain.  
Raw key, value are stored like below:  
	GRACEFUL_STORAGE:${namespace}:${key}  
ex)
```javascript
var s1 = new GracefulStorage(localStorage, 'storage1');
s1.set('key1', 'val1');
localStorage['GLOBAL_STORAGE:storage1:key1']
// -> val1
```
### .sweep(storage: WebStorage, whitelist: Array[String]): Void
### #set(key: String, value: JSONSerializable, exptime: Integer): Boolean
### #get(key: String): JSONSerializable | Void
### #del(key: String): Void
### #touch(key: String, exptime: Integer): Boolean
### #each(callback: (value: JSONSerializable, key: String) => Void): Void
### #dump(): Map[String, JSONSerializable]
### #flush(): Void

## Test
```bash
$ npm install
$ npm test
```
