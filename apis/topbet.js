'use strict;'

const router = require('express').Router();
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const CONSTANTS = require('../constants');

const normalizeBetText = function(err, body, scraper){
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

  let bets = betTextList.map(function(betTexts){
    betTexts = betTexts.split("\n");

    betTexts = _.map(betTexts, function(betText){
      return _.trim(betText); 
    });

    return _.pull(betTexts, false, "");
  });

  return scraper(bets);
};

const oddsScraper_in = function(bets){
  bets = _.map(bets, function(betTexts){
    const bet = {};

    bet.parlayable = true;

    bet.title = betTexts[0];
    if (bet.title == "O"){  // "O" signifies that no parley is allowed on the bet
      bet.title = betTexts[1];
      bet.parlayable = false;
      betTexts.shift();  // remove the first element (the "O")
    }

    bet.awayTeam = {};
    bet.awayTeam.spread = {};
    bet.awayTeam.spread.line = betTexts[10];
    bet.awayTeam.spread.vig = betTexts[11];
    bet.awayTeam.moneyLine = betTexts[13];

    bet.homeTeam = {};
    bet.homeTeam.spread = {};
    bet.homeTeam.spread.line = betTexts[21];
    bet.homeTeam.spread.vig = betTexts[22];
    bet.homeTeam.moneyLine = betTexts[24];

    bet.over = {};
    bet.over.line = betTexts[16];
    bet.over.vig = betTexts[17];

    bet.under = {};
    bet.under.line = betTexts[27];
    bet.under.vig = betTexts[28];

    return bet;
  });

  return {
    bets: bets
  };
};

const halfScraper_in = function(bets){
  bets = _.map(bets, function(betTexts){
    const bet = {};

    bet.title = betTexts[0];

    bet.awayTeam = {};
    bet.awayTeam.spread = {};
    bet.awayTeam.spread.line = betTexts[10];
    bet.awayTeam.spread.vig = betTexts[11];

    bet.homeTeam = {};
    bet.homeTeam.spread = {};
    bet.homeTeam.spread.line = betTexts[19];
    bet.homeTeam.spread.vig = betTexts[20];

    bet.over = {};
    bet.over.line = betTexts[14];
    bet.over.vig = betTexts[15];

    bet.under = {};
    bet.under.line = betTexts[23];
    bet.under.vig = betTexts[24];

    return bet;
  });

  return {
    bets: bets
  };
};

const oddsScraper = function(err, body){
  return normalizeBetText(err, body, oddsScraper_in);
};

const halfScraper = function(err, body){
  return normalizeBetText(err, body, halfScraper_in);
};

const scraperResponse = function(res, scraper){
  return function(err, response, body){
    return res.json(scraper(err, body));
  };
};

const requestHandler = function(url, scraper){
  return function(req, res){
    const options = {
      url: url,
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
      }
    };
    request(options, scraperResponse(res, scraper));
  };
};

router.get('/nfl', requestHandler(CONSTANTS.URLS.NFL_LINES, oddsScraper));
router.get('/nfl/firsthalf', requestHandler(CONSTANTS.URLS.NFL_1ST_HALF_LINES, halfScraper));
router.get('/nfl/secondhalf', requestHandler(CONSTANTS.URLS.NFL_2ND_HALF_LINES, halfScraper));
router.get('/nba', requestHandler(CONSTANTS.URLS.NBA_LINES, oddsScraper));
router.get('/nba/firsthalf', requestHandler(CONSTANTS.URLS.NBA_1ST_HALF_LINES, halfScraper));
router.get('/nba/secondhalf', requestHandler(CONSTANTS.URLS.NBA_2ND_HALF_LINES, halfScraper));

module.exports = router;
