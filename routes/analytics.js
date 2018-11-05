const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';

const database = 'PassManager';

const client = new MongoClient(url, { useNewUrlParser: true });
let db;
let serviceRequestDB;

router.use(function(req, res, next){
    console.log('Analytics');

    client.connect(function(err) {
        db = client.db(database);
        serviceRequestDB = db.collection('ServiceRequest');

        next();
    });
});

router.get('/current/:companyCode', function(req, res){
    const companyCode = Number.parseInt(req.params.companyCode);

    serviceRequestDB.findOne( 
                { 
                    'companyCode': companyCode, 
                    'startDate': { 
                        '$ne': null
                    } 
                }, 
                { 
                    'sort': {
                        'startDate' : -1 
                    } 
                } )
                .then((data) => {
                    const result = {};

                    if (data == null){
                        data = {
                            code: 0,
                            companyCode: companyCode
                        };
                    }

                    result.currentNumber = data.code;

                    const startDate = new Date();
                    const endDate = new Date();

                    startDate.setHours(0,0,0,0);
                    endDate.setHours(23,59,59,999);

                    serviceRequestDB.find( { 
                            'companyCode': companyCode, 
                            'createDate': { 
                                '$gt': startDate.getTime(), 
                                '$lt': endDate.getTime() 
                            }, 
                            'startDate': { 
                                '$ne': null 
                            } 
                        } )
                        .toArray((err, data) => {
                            if (err == null) {
                                let queue = 0;

                                data.forEach(item => {
                                    queue += item.startDate - item.createDate;
                                    console.log(item);
                                });

                                console.log('Queue: ', queue, ' Length:', data.length);
                                
                                result.averageWaitTime = (queue / data.length);

                                res.send(result);
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

module.exports = router;