const express = require('express');
const router = express.Router();
const ServiceRequest = require('../service/servicerequest');

router.use(function (req, res, next) {
    console.log('ServiceRequest');

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
        ServiceRequest.create(req.companyCode)
            .then(data => {
                ServiceRequest.analytics(req.companyCode)
                    .then(item => {
                        const result = {
                            ServiceRequest: data,
                            Analytics: item
                        };

                        res.send(result);
                    })
                    .catch(err => {
                        res.sendStatus(500);
                    })
            })
            .catch(err => {
                res.sendStatus(500);
            });
    })
    .get('/:id', function (req, res) {
        ServiceRequest.getOne(req.params.id)
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.sendStatus(500);
            });
    })
    .put('/startRequest/:id', function (req, res) {
        ServiceRequest.startRequest(req.params.id)
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.sendStatus(500);
            });
    })
    .put('/endRequest/:id', function (req, res) {
        ServiceRequest.endRequest(req.params.id)
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.sendStatus(500);
            });
    })
    .get('/next/:companyCode', function (req, res) {
        ServiceRequest.next(req.companyCode)
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.sendStatus(500);
            });
    });

module.exports = router;