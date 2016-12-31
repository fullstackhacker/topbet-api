'use strict;'
const router = require('express').Router();
const topbetRouter = require('./topbet');

router.get('/', function(req, res){
  res.json({
    status: true
  });
});

router.use('/', topbetRouter);

module.exports = router;
