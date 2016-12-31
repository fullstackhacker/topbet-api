'use strict;'

const router = require('express').Router();
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const CONSTANTS = require('../constants');

const scraper = function(err, body){
  if (err){
    console.log('error!');
    console.log(err);
    return {error: err};
  }

  const $ = cheerio.load(JSON.parse(body)[0].content);
  const eventsTable = $(".event")

  if (!eventsTable.text()){
    return {
      error: {
        message: "Unable to load bets"
      }
    };
  }

  const betTextList = [];
  eventsTable.each(function(){
    betTextList.push($(this).text());
  });

  const bets = betTextList.map(function(betTexts){
    betTexts = betTexts.split("\n");

    betTexts = _.map(betTexts, function(betText){
      return _.trim(betText); 
    });

    _.pull(betTexts, false, "");

    const bet = {};

    bet.title = betTexts[0];

    bet.homeTeam = {};
    bet.homeTeam.spread = {};
    bet.homeTeam.spread.line = betTexts[10];
    bet.homeTeam.spread.vig = betTexts[11];
    bet.homeTeam.moneyLine = betTexts[13];

    bet.awayTeam = {};
    bet.awayTeam.spread = {};
    bet.awayTeam.spread.line = betTexts[21];
    bet.awayTeam.spread.vig = betTexts[22];
    bet.awayTeam.moneyLine = betTexts[24];

    bet.overUnder = {};
    bet.overUnder.line = betTexts[16];
    bet.overUnder.vig = betTexts[17];

    return bet;
  });

  return {
    bets: bets
  };
};

const scraperResponse = function(res){
  return function(err, response, body){
    return res.json(scraper(err, body));
  };
};

const requestHandler = function(url){
  return function(req, res){
    request(url, scraperResponse(res));
  };
};

router.get('/nfl', requestHandler(CONSTANTS.URLS.NFL_LINES));
router.get('/nba', requestHandler(CONSTANTS.URLS.NBA_LINES));

module.exports = router;
