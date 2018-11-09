const MongoClient = require('mongodb').MongoClient;
const Moment = require('moment-timezone');
const ObjectId = require('mongodb').ObjectID;

const url = 'mongodb://localhost:27017';

const database = 'PassManager';

const client = new MongoClient(url, {
    useNewUrlParser: true
});
let db;
let serviceRequestDB;

const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const service = {
    start: function (callback) {
        client.connect(function (err) {
            db = client.db(database);
            serviceRequestDB = db.collection('ServiceRequest');

            callback();
        });
    },
    create: function (companyCode) {
        return new Promise((resolve, reject) => {
            client.connect(function (err) {
                let today = new Date(Moment.tz(new Date(), 'America/Sao_Paulo'));
                today.setHours(0, 0, 0, 0);

                serviceRequestDB.findOne({
                        'companyCode': companyCode,
                        'createDate': {
                            '$gt': today
                        }
                    }, {
                        'sort': {
                            'code': -1
                        }
                    })
                    .then((data) => {
                        const code = (data != null ? data.code : 0) + 1;

                        const sr = {
                            'companyCode': companyCode,
                            'createDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo')),
                            'status': 0,
                            'code': code
                        };

                        serviceRequestDB.insertOne(sr, (err, result) => {
                            if (err == null) {
                                resolve(sr);
                            } else {
                                console.log(err);
                                reject(err);
                            }
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                        reject(err);
                    });
            });
        });
    },
    getOne: function (id) {
        return new Promise((resolve, reject) => {
            serviceRequestDB.findOne({
                    '_id': new ObjectId(id)
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    startRequest: function (id) {
        return new Promise((resolve, reject) => {
            serviceRequestDB.findOneAndUpdate({
                    '_id': new ObjectId(id)
                }, {
                    $set: {
                        'status': 1,
                        'startDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo'))
                    }
                })
                .then((data) => {
                    resolve(data.value);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    endRequest: function (id) {
        return new Promise((resolve, reject) => {
            serviceRequestDB.findOneAndUpdate({
                    '_id': new ObjectId(id)
                }, {
                    $set: {
                        'status': 2,
                        'endDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo'))
                    }
                })
                .then((data) => {
                    resolve(data.value);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    close: function (id) {
        return new Promise((resolve, reject) => {
            serviceRequestDB.findOneAndUpdate({
                    '_id': new ObjectId(id)
                }, {
                    $set: {
                        'status': 3,
                        'endDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo'))
                    }
                })
                .then((data) => {
                    resolve(data.value);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    next: function (companyCode) {
        return new Promise((resolve, reject) => {
            let today = new Date(Moment.tz(new Date(), 'America/Sao_Paulo'));
            today.setHours(0, 0, 0, 0);

            serviceRequestDB.findOne({
                    'companyCode': companyCode,
                    'status': 0,
                    'createDate': {
                        '$gt': today
                    }
                }, {
                    'sort': {
                        'code': 1
                    }
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    getCurrentCode: function (companyCode) {
        return new Promise((resolve, reject) => {
            const startDate = new Date();
            const endDate = new Date();

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            serviceRequestDB.findOne({
                    'companyCode': companyCode,
                    'createDate': {
                        '$gt': startDate,
                        '$lt': endDate
                    },
                    'startDate': {
                        '$ne': null
                    }
                }, {
                    'sort': {
                        'startDate': -1
                    }
                })
                .then((data) => {
                    if (data == null) {
                        data = {
                            code: 0,
                            companyCode: companyCode
                        };
                    }

                    resolve(data.code);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    getAverageWaitTime: function (companyCode) {
        return new Promise((resolve, reject) => {
            const startDate = new Date();
            const endDate = new Date();

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            serviceRequestDB.find({
                    'companyCode': companyCode,
                    'createDate': {
                        '$gt': startDate,
                        '$lt': endDate
                    },
                    'startDate': {
                        '$ne': null
                    }
                })
                .toArray((err, data) => {
                    if (err == null) {
                        let queue = 0;

                        data.forEach(item => {
                            queue += new Date(item.startDate) - new Date(item.createDate);
                        });

                        resolve(queue / data.length);
                    } else {
                        console.log(err);
                        reject(err);
                    }
                });
        });
    },
    getAvgRequestByHourByDay: function (companyCode, dayOfWeek) {
        return new Promise((resolve, reject) => {
            serviceRequestDB.aggregate([{
                        '$project': {
                            'dayOfWeek': {
                                '$dayOfWeek': '$createDate'
                            },
                            'hour': {
                                '$hour': {
                                    'date': '$createDate',
                                    'timezone': 'America/Sao_Paulo'
                                }
                            },
                            'companyCode': '$companyCode'
                        }
                    },
                    {
                        '$match': {
                            'dayOfWeek': dayOfWeek,
                            'companyCode': companyCode
                        }
                    },
                    {
                        '$group': {
                            '_id': {
                                'hour': '$hour'
                            },
                            'count': {
                                '$sum': 1
                            }
                        }
                    }
                ])
                .toArray((err, data) => {
                    if (err == null) {
                        let result = [];
                        let total = data.reduce((cnt, item) => {
                            return cnt + item.count;
                        }, 0);

                        hours.forEach((hour) => {
                            const item = data.find((val) => {
                                return val._id.hour === hour
                            });
                            result.push({
                                'hour': hour,
                                'porcentage': item != undefined ? (item.count / total) : 0
                            });
                        });

                        resolve(result);
                    } else {
                        console.log(err);
                        reject(err);
                    }
                });
        });
    }
};

module.exports = service;