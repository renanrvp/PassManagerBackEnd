const express = require('express');
const router = express.Router();
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

router.use(function (req, res, next) {
    console.log('ServiceRequest');

    client.connect(function (err) {
        db = client.db(database);
        serviceRequestDB = db.collection('ServiceRequest');

        next();
    });
});

router
    .param('companyCode', function (req, res, next) {
        if (!isNaN(req.params.companyCode) && Number.parseInt(req.params.companyCode) > 0) {
            req.companyCode = Number.parseInt(req.params.companyCode);
            next();
        } else {
            res.send({
                status: 400,
                message: 'Company code must be a valid number.'
            });
        }
    })
    .param('id', function (req, res, next) {
        var pattern = new RegExp('^[0-9a-fA-F]{24}$');

        if (!pattern.test(req.params.id)) {
            res.send({
                status: 400,
                message: 'Id must be a valid GUID.'
            });
        } else {
            next();
        }
    });

router
    .post('/add/:companyCode', function (req, res) {
        client.connect(function (err) {
            let today = new Date(Moment.tz(new Date(), 'America/Sao_Paulo'));
            today.setHours(0, 0, 0, 0);

            serviceRequestDB.findOne({
                    'companyCode': req.companyCode,
                    'createDate': {
                        '$gt': today.getTime()
                    }
                }, {
                    'sort': {
                        'createDate': -1
                    }
                })
                .then((data) => {
                    const code = (data != null ? data.code : 0) + 1;

                    const sr = {
                        'companyCode': req.companyCode,
                        'createDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo')).getTime(),
                        'status': 0,
                        'code': code
                    };

                    serviceRequestDB.insertOne(sr, (err, result) => {
                        if (err == null) {
                            res.send(sr);
                        } else {
                            console.log(err);
                            res.sendStatus(500);
                        }
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.sendStatus(500);
                });
        });
    })
    .get('/:id', function (req, res) {
        serviceRequestDB.findOne({
                '_id': new ObjectId(req.params.id)
            })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    })
    .put('/startRequest/:id', function (req, res) {
        serviceRequestDB.findOneAndUpdate({
                '_id': new ObjectId(req.params.id)
            }, {
                $set: {
                    'status': 1,
                    'startDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo')).getTime()
                }
            })
            .then((data) => {
                res.send(data.value);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            })

    })
    .put('/endRequest/:id', function (req, res) {
        serviceRequestDB.findOneAndUpdate({
                '_id': new ObjectId(req.params.id)
            }, {
                $set: {
                    'status': 2,
                    'endDate': new Date(Moment.tz(new Date(), 'America/Sao_Paulo')).getTime()
                }
            })
            .then((data) => {
                res.send(data.value);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            })

    })
    .get('/next/:companyCode', function (req, res) {
        let today = new Date(Moment.tz(new Date(), 'America/Sao_Paulo'));
        today.setHours(0, 0, 0, 0);

        serviceRequestDB.findOne({
                'companyCode': req.companyCode,
                'status': 0,
                'createDate': {
                    '$gt': today.getTime()
                }
            }, {
                'sort': {
                    'code': 1
                }
            })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    });

module.exports = router;