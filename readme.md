A robust, performance focused package to flush redis keys.

Supports Redis >= 3.0.6 and (Node.js >= 8).

# Features

flush-redis-keys is robust and fully featured pacakge to delete redis keys from small or large redis databases.
It can be used to delete multiple redis keys from a huge redis database by using prefix, middle or suffix of keys from any redis database.

1) It is simple to use by only providing redis key prefix,middle or suffix to delete redis keys. ie abc_, _abc_, _abc
2) It uses ioredis to connect with redis.
3) Supports Redis sentinel.
4) Uses redis scan to get all matching keys without the downside of blocking the server for a long time.
5) Use redis pipeline to delete multiple redis keys.

## Install

```shell
$ npm install flush-redis-keys
```

## Usage

```js

'use strict'

/* 
    This code snippet used to delete all the redis keys having prefix abc_
    from redis database 1.
*/

const  redisFlush  = require('flush-redis-keys');

const deleteRedisKeys = async () => {

    /* 
        host:  can be multipe in case of redis sentinal with diffrent ports
        order: order can be pre, middle or post
        redisKey : It is the redis key prfix, suffix or middle
    */
    let params = {
        "redisKey": "abc_",
        "order": "pre",
        "redisInfo": {
            host: [
                { "host": "127.0.0.1", "port": 26379 },
                { "host": "127.0.0.1", "port": 26381 },
                { "host": "127.0.0.1", "port": 26383 }
            ],
            password : "",
            database: 1
        }
    }

    redisFlush(params, (err,data) => {
        if(err)
            console.log(err)

        console.log(data);
    });

}

```

Another Example to delete redis keys to match middle or suffix

```js

let params = {
        "redisKey": "_abc",
        "order": "post",
        "redisInfo": {
            host: [
                { "host": "127.0.0.1", "port": 26379 },
                { "host": "127.0.0.1", "port": 26381 },
                { "host": "127.0.0.1", "port": 26383 }
            ],
            password : "",
            database: 1
        }
}

let params = {
        "redisKey": "_abc_",
        "order": "middle",
        "redisInfo": {
            host: [
                { "host": "127.0.0.1", "port": 26379 },
                { "host": "127.0.0.1", "port": 26381 },
                { "host": "127.0.0.1", "port": 26383 }
            ],
            password : "",
            database: 1
        }
}

```


