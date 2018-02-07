// fork of buyatsellat with trailing stop loss
// var _ = require('lodash');
var helper = require('../helper.js');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.saichovsky;

// let's create our own strategy
var strategy = {};

// prepare everything our strategy needs
strategy.init = function() {
  this.name = 'saichovsky';
  this.stopLoss = helper.trailingStopLoss(); // provides some methods
  this.stopPrice = Infinity;
  this.buyPrice = null;

  this.previousAction = 'sell';
  this.previousActionPrice = Infinity;
}

// What happens on every new candle?
strategy.update = function(candle) {
  this.stopPrice = this.stopLoss.update(candle.close);
}

// for debugging purposes log the last
// calculated parameters.
strategy.log = function(candle) {
  //log.debug(this.previousAction)
}

strategy.check = function(candle) { // this is where we decide on what to do - buy or sell
  if(this.stopLoss.active()) { // if LastAction was a buy
    if (this.stopLoss.triggered(candle.close) ) { // and SL has been triggered
      this.advice('short'); // sell
      this.advised = false;
      this.stopLoss.destroy();
      log.info("{\"SellPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"StopLoss\": \"" + settings.stopLossLimit + "\"}");
    }
    else { // SL not triggered. Update stopLoss
      this.stopPrice = this.stopLoss.update(candle.close);
      log.info("{\"SellPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"Action\": \"Trail\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"StopLoss\": \"" + settings.stopLossLimit + "\"}");
    }
  }
  else { // last action was a sell
    const stopLossLimit = settings.stopLossLimit; // stop loss percentage
    const buyAtDrop = settings.buyAtDrop; // % of last sale price to buy at if market goes down
    const buyAtRise = settings.buyAtRise; // % of last sale price to buy at if market goes up

    // calculate the minimum price in order to buy
    const lower_buy_price = this.previousActionPrice * buyAtDrop;

    // calculate the price at which we should buy again if market goes up
    const upper_buy_price = this.previousActionPrice * buyAtRise;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close < lower_buy_price) || (candle.close > upper_buy_price)) {
      this.advice('long');
      this.stopLoss.create(stopLossLimit, candle.close);
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      log.info("{\"SellPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"StopLoss\": \"" + settings.stopLossLimit + "\"}");
    }
  }
}

/*  const profitLimit = settings.profitLimit; // percentage above buying price at which to sell
  const stopLossLimit = settings.stopLossLimit; // stop loss percentage
  const buyAtDrop = settings.buyAtDrop; // % of last sale price to buy at if market goes down
  const buyAtRise = settings.buyAtRise; // % of last sale price to buy at if market goes up

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    var threshold = this.previousActionPrice * profitLimit;

    // calculate the stop loss price in order to sell
    const stop_loss = this.previousActionPrice * stopLossLimit;

    // we sell if the price is less than  or = stop loss threshold
    if(candle.close < stop_loss) {
      this.advice('short');
      this.stopLoss.destroy();
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
      log.info("{\"ProfitMargin\": \"" + profitLimit + "\", \"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"PreviousPrice\": \"" + candle.close + "\", \"StopLoss\": \"" + stopLossLimit + "\"}");
    } else { // item is uptrending
      threshold
    }
  }

  else if(this.previousAction === "sell") {
    // calculate the minimum price in order to buy
    //const threshold = this.stopLoss.triggered(candle.close) ? this.previousActionPrice * buyAtDrop : this.previousActionPrice * buyAtRise;
    const threshold = this.previousActionPrice * buyAtDrop;

    // calculate the price at which we should buy again if market goes up
    const sellat_up_price = this.previousActionPrice * buyAtRise;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close < threshold) || (candle.close > sellat_up_price)) {
      this.advice('long');
      this.stopLoss.create(profitLimit, candle.close);
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      //log.debug(this.previousAction + "ing at " +this.previousActionPrice);
    }
  }
}*/

module.exports = strategy;
