const express = require('express');
const router = express.Router();
const ServiceRequest = require('../service/servicerequest');

router.use(function (req, res, next) {
    console.log('Analytics');

    ServiceRequest.start(next);
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
    }).param('dayOfWeek', function (req, res, next) {
        if (!isNaN(req.params.dayOfWeek) && Number.parseInt(req.params.dayOfWeek) > 0) {
            req.dayOfWeek = Number.parseInt(req.params.dayOfWeek);
            next();
        } else {
            res.send({
                status: 400,
                message: 'Day Of Week must be a valid number.'
            });
        }
    });

router
    .get('/:companyCode', function (req, res) {
        ServiceRequest.getCurrentCode(req.companyCode)
            .then(data => {
                const result = {
                    currentNumber: data
                };
                ServiceRequest.getAverageWaitTime(req.companyCode)
                    .then(data2 => {
                        result.averageWaitTime = data2;

                        res.send(result);
                    })
                    .catch(err => {
                        res.sendStatus(500);
                    });
            })
            .catch(err => {
                res.sendStatus(500);
            });
    })
    .get('/day/:companyCode/:dayOfWeek', function (req, res) {
        ServiceRequest.getAverageWaitTime(req.companyCode)
            .then(data => {
                const result = {
                    averageWaitTime: data
                };

                ServiceRequest.getAvgRequestByHourByDay(req.companyCode, req.dayOfWeek)
                    .then(data2 => {
                        result.averageRequests = data2;

                        res.send(result);
                    })
                    .catch(err => {
                        res.sendStatus(500);
                    });
            })
            .catch(err => {
                res.sendStatus(500);
            });
    });

module.exports = router;