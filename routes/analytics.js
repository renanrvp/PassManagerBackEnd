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
    });

router
    .get('/current/:companyCode', function (req, res) {
        ServiceRequest.analytics(req.companyCode)
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.sendStatus(500);
            });
    });

module.exports = router;