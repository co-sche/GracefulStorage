# GracefulStorage

WebStorage(localStorage, sessionStorage) wrapper that has namespace, expire, and cleanup functions

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
ベースとなるWebStorageオブジェクト (localStorage or sessionStorage)

#### namespace
ストレージ領域を論理的に分割するために用いられる。
生のローカルストレージでは以下のように保存される。
ex)
```javascript
var s1 = new GracefulStorage(localStorage, 'storage1');
s1.set('key1', 'val1');
localStorage['GRACEFUL_STORAGE:storage1:key1']
// -> {"exptime": xxxxxxx, "data": "val1" }
```
### .sweep(storage: WebStorage, whitelist: Array[String]): Void
指定されたWebStorageオブジェクトから、GracefulStorage管理下の値を全削除する。
この際、GracefulStorage管理外の物やwhitelistに列挙された物に対しては何も行わない。

#### whitelist
削除したくないnamespaceの配列。

### #set(key: String, value: JSONSerializable, exptime: Integer): Boolean
戻り値のBooleanは、セットできたかどうか。
#### value
undefined以外のJSON.stringifyを通るものならなんでも。
#### exptime
寿命をミリ秒で指定する。
### #get(key: String): JSONSerializable | Void
値の取得。
値が入っていない場合はundefinedを返す。
### #del(key: String): Void
値の削除。
### #touch(key: String, exptime: Integer): Boolean
指定されたexptimeで延命する。
戻り値のBooleanは延命できたかどうか。
### #each(callback: (value: JSONSerializable, key: String) => Void): Void
該当GracefulStorageインスタンスの管理下にあるkey, valueを引数に、指定されたcallbackを呼び出す。
この際、callbackのスコープのthisはGracefulStorageインスタンスに設定される。
### #dump(): Map[String, JSONSerializable]
該当GracefulStorageインスタンスの管理下にあるkey, valueをオブジェクトに詰めて返す。
### #flush(): Void
全削除。
## Test
```bash
$ npm install
$ npm test
```
