'use strict'

const redis = require('ioredis');
const Promise = require('bluebird');

const SCAN_COUNT = 500;

const redisFlush = async (params, callback) => {
    try {
        if(Object.keys(params).length == 0)
            callback(`Please provide required parameters.`);

        const {
            redisKey = '',
            redisInfo = {},
            order = 'pre'
        } = params;

        if(redisKey == '')
            callback(`Please provide redis key prefix, middle or suffix.`);
        
        if(Object.keys(redisInfo).length == 0)
            callback(`Please provide required redis information.`);

        const redisInstance = await getredisInstance(redisInfo);
        if (!redisInstance)
            callback(`Not able to connect to redis.`);

        let stream = {};
        if (order === 'pre') {
            stream = await redisInstance.scanStream({ match: `${redisKey}*`, count: SCAN_COUNT });
        } else if (order === 'middle') {
            stream = await redisInstance.scanStream({ match: `*${redisKey}*`, count: SCAN_COUNT });
        } else if (order === 'post') {
            stream = await redisInstance.scanStream({ match: `*${redisKey}`, count: SCAN_COUNT });
        }
        let pipeline = redisInstance.pipeline();
        let localKeys = [];
        stream.on('data', async (resultKeys) => {
            await stream.pause();
            const { length } = resultKeys;
            for (let i = 0; i < length; i++) {
                const key = resultKeys[i];
                localKeys.push(key);
                pipeline.del(key);
            }
            if (localKeys.length > SCAN_COUNT) {
                pipeline.exec(() => { });
                localKeys = [];
                pipeline = redisInstance.pipeline();
                await stream.resume();
            } else {
                await stream.resume();
            }
        }).on('end', (data) => {
            pipeline.exec((err, results) => {
                if (err)
                    callback(err);

                callback(null, { success: true, keysDeleted : results.length });
            });
        }).on('error', (e) => {
            callback(e.stack, false);
        });
    } catch (e) {
        callback(e.stack, false);
    }
}

const getredisInstance = async (redisInfo) => {
    try {
        const client = Promise.promisifyAll(redis.createClient({
            sentinels: redisInfo.host,
            pass: redisInfo.password,
            name: "mymaster",
            role: 'master',
            retry_strategy: function (options) {
                if (options.error.code === 'ECONNREFUSED') {
                    // End reconnecting on a specific error and flush all commands with a individual error
                    return new Error('The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    // End reconnecting after a specific timeout and flush all commands with a individual error
                    return new Error('Retry time exhausted');
                }
                if (options.times_connected > 10) {
                    // End reconnecting with built in error
                    return undefined;
                }
                // reconnect after
                return Math.max(options.attempt * 100, 500);
            }
        })),
        sessionAge = 60000;
        client.auth(redisInfo.password);
        client.select(redisInfo.database);
        return client;
    } catch (e) {
        throw e;
    }
}

process.on('unhandledRejection', (err) => {});

module.exports = redisFlush