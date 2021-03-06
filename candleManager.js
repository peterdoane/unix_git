var assert = require('assert');
var Test = require('./lib/test');
var Util = require('./lib/util');

var Candlestick = require('./candlestick');
var PriceFormatter = require('./priceFormatter');
var Top = require('./top');

// We consider spreads greater than twice the previous one interesting
var INTERESTING_MULTIPLE = 2;

var CandleManager = function(args) {

  var newCandleCallback;

  if (typeof(args.maxCandles) !== 'number') {
    throw new Error("maxCandles should be a number, but instead was " + JSON.stringify(max_candles));
  }

  // This is the time period both for SMA
  var max_candles = args.maxCandles || 50;
  var minMaxPeriod = args.minMaxPeriod || 50;
  var emaPeriod = args.emaPeriod || 50;
  var currentMinute;
  var currentCandlestick;
  this.lastPrice = 0;
  var oldAcceleration;
  this.velocity = 0;
  this.acceleration = 0;

  var risingMovAvgCrossCallback = function(crossoverPrice) {
    console.log("EMA rising across SMA @ " + crossoverPrice);
  };

  var fallingMovAvgCrossCallback = function(crossoverPrice) {
    console.log("EMA falling across SMA @ " + crossoverPrice);
  };

  var onRisingMovAvgCrossCallback = function(callback) {
    risingMovAvgCrossCallback = callback;
  };

  var onFallingMovAvgCrossCallback = function(callback) {
    fallingMovAvgCrossCallback = callback;
  };

  // Only create one price formatter for all candles to use
  priceFormatter = new PriceFormatter("bits", 3, 3);
  velocityFormatter = new PriceFormatter("bits/s", 3, 3);
  accelFormatter = new PriceFormatter("bits/s^2", 3, 3);
  ratioFormatter = new PriceFormatter(" ", 0, 1); // space, not an empty string

  // A map of minute numbers to a candlestick for that minute
  var candleList = [];
  var smaList = [];
  var EMA_MULTIPLIER = 2/(emaPeriod + 1);
  var emaList = [];
  var minKeyList = [];
  var maxKeyList = [];
  this.minBottom = new Top("min");
  this.maxTop = new Top("max");

  var movingVolume = 0; // the volume of all trades
  var movingAvgNum = 0; // the sum of all weighted averages

  // This is a hidden class member
  newCandleCallback = function(newCandle, candleManager) {
    console.log("DEFAULT newCandle callback");
    newCandle.print();
    assert(candleManager.currentSMA);
    console.log("Current MA= " + candleManager.currentSMA);
  };

  this.getPriceFormatter = function() {
    return priceFormatter;
  };

  this.onNewCandle = function(callback) {
    newCandleCallback = callback;
  };

  // Return single moving average
  this.getSMA = function() {
    return this.currentSMA;
  };

  this.getEMA = function() {
    return this.currentEMA;
  };

  this.printMovingAvg = function() {
    console.log("SMA= " + priceFormatter.format(this.currentSMA));
    console.log("EMA= " + priceFormatter.format(this.currentEMA));
  };

  this.printLastPrice = function() {
    console.log("lastPrice= " + priceFormatter.format(this.lastPrice));
  };

  this.getMin = function() {
    return this.minBottom.nodes[0].key;
  };

  this.getMax = function() {
    return this.maxTop.nodes[0].key;
  };

  alertInteresting = function(previousSpread, currentCandleStick) {
    var currentSpread = currentCandlestick.getSpread();
    if (previousSpread === undefined) {
      console.log("No previous spread");
      return;
    }
    absPreviousSpread = Math.abs(previousSpread);
    console.log("Previous Spread= " + previousSpread);
    // Prevent a divide by zero
    if (Test.isNothing(absPreviousSpread)) {
      console.log("Previous spread close to zero.");
      return;
    }

    ratio = currentSpread / previousSpread;
    console.log("Ratio to Prev Spread: " + ratioFormatter.format(ratio));
    if (Math.abs(currentSpread) > absPreviousSpread*INTERESTING_MULTIPLE) {
      console.log("INTERESTING".rainbow);
      currentCandlestick.setInteresting();
      //console.log("Something interesting happened! " + this.getSpread());
      //var timeString = getTimeString();
      //var spreadInBits = this.getSpread() / 1000;
      var direction = (currentCandlestick.getSpread() > 0) ? "INCREASE".green : "DECREASE".red;
      console.log(direction);
      //sendMessage(timeString + " price " + direction + " by " + spreadInBits + " bits");
    }
  };

  this.orderHandler = function(order) {
    this.minuteHandler(order.price, order.amount, order.date);
  };

  // Add a new candle and update the moving average
  this.addNewCandle = function(newCandle) {
    candleList.push(newCandle);
    movingVolume += newCandle.vol;
    movingAvgNum += newCandle.getCenter();

    assert(minKeyList.length == maxKeyList.length);
    minKey = Util.priceToKey(newCandle.low);
    maxKey = Util.priceToKey(newCandle.high);
    minKeyList.push(minKey);
    maxKeyList.push(maxKey);
    this.minBottom.add({key: minKey});
    this.maxTop.add({key: maxKey});

    console.log("MIN BOTTOM");
    this.minBottom.print();

    console.log("MAX TOP");
    this.maxTop.print();

    if (minKeyList.length > minMaxPeriod) {
      var ejectedMinKey = minKeyList.splice(0, 1)[0]; // this is an integer key
      console.log("Ejected Min Key= " + ejectedMinKey);
      this.minBottom.remove(ejectedMinKey);
    }

    if (maxKeyList.length > minMaxPeriod) {
      var ejectedMaxKey = maxKeyList.splice(0, 1)[0]; // this is an integer key
      console.log("Ejected Max Key= " + ejectedMaxKey);
      this.maxTop.remove(ejectedMaxKey);
    }

    if (candleList.length > max_candles) {
      var ejectedCandle = candleList.splice(0, 1)[0];
      smaList.splice(0, 1);
      emaList.splice(0, 1);
      assert(ejectedCandle);
      movingVolume -= ejectedCandle.vol;
      movingAvgNum -= ejectedCandle.getCenter();
    }

    // Calculate the moving average after updating the numbers
    //this.currentMA = priceFormatter.round(movingAvgNum / candleList.length);
    // Don't round for now, we want the MA to be in BTC
    this.currentSMA = movingAvgNum / candleList.length;
    if (!this.currentEMA) {
      this.currentEMA = this.currentSMA; // seed first EMA with SMA
    } else {
      this.currentEMA = (newCandle.getCenter() - this.currentEMA) * EMA_MULTIPLIER + this.currentEMA;

      if (Util.approxEquals(this.currentEMA, this.currentSMA)) {
        console.log("CROSSOVER at " + this.lastPrice);
        // distinguish between rising and falling
        if (this.velocity > 0) {
          risingMovAvgCrossCallback(this.lastPrice);
        } else if (this.velocity < 0) {
          fallingMovAvgCrossCallback(this.lastPrice);
        } else {
          console.log("Crossing at zero velocity!");
        }
      }
    }
    smaList.push(this.currentSMA);
    emaList.push(this.currentEMA);

    assert(candleList.length <= max_candles);
    assert(smaList.length == candleList.length);

    console.log("movingAvgNum= " + movingAvgNum);
    console.log("candleLength= " + candleList.length);
    console.log(max_candles + "SMA= " + this.currentSMA);
    console.log(max_candles + "EMA= " + this.currentEMA);

    var prevCandle = candleList[candleList.length - 2];

    // The first candlestick will not have a previous
    //console.log("interesting");

    // Get the previous candlestick
    /*
    var oldOldMinute = oldMinute - 1;
    oldOldMinute = oldOldMinute < 0 ? oldOldMinute + 60 : oldOldMinute;
    var oldOldCandle = candlesticks[oldOldMinute];
    */
    console.log("Current weighted avg= " + priceFormatter.format(newCandle.getWeightedAvg()));
    if (prevCandle) {
      alertInteresting(prevCandle.getSpread(), newCandle);
      console.log("Old weighted avg= " + priceFormatter.format(prevCandle.getWeightedAvg()));
      oldVelocity = this.velocity;
      this.velocity = currentCandlestick.getWeightedAvg() - prevCandle.getWeightedAvg();
      this.acceleration = this.velocity - oldVelocity;
      console.log("Updating velocity: " + velocityFormatter.format(this.velocity));
      console.log("Updating acceleration: " + accelFormatter.format(this.acceleration));
    }
  };

  // price - a floating point number giving the price of a new trade
  // vol - floating point number giving the volume of a new trade
  // datetime - Date object of the trade, or undefined to use now
  this.minuteHandler = function(price, vol, datetime) {

    if (price <= 0 || vol <= 0) { return; }

    this.lastPrice = price;

    if (datetime) {
      now = datetime;
    } else {
      now = new Date();
    }
    //console.log(now);
    if (currentCandlestick === undefined) {
      currentMinute = now.getMinutes();
      currentCandlestick = new Candlestick(price, vol, priceFormatter, now.getHours()+":"+now.getMinutes());

      console.log(currentMinute);
    } else if (now.getMinutes() != currentMinute) {
      // Don't check if now.getMinutes > currentMinute because of 0

      console.log("Starting new minute " + now.getMinutes());
      // Each candlestick's open is the same as the previous close
      var oldMinute = currentMinute; // we can't just subtract one because of wraparound
      currentMinute = now.getMinutes();
      currentCandlestick.end(price);

      /*
      if (!candlesticks[currentMinute]) {
        // only increment the count if we are filling up new slots
        this.count += 1;
      }
      candlesticks[currentMinute] = currentCandlestick;
      */
      this.addNewCandle(currentCandlestick);

      if (newCandleCallback) {
        newCandleCallback(currentCandlestick, this);
      }

      currentCandlestick = new Candlestick(price, vol, priceFormatter, now.getHours()+":"+now.getMinutes());
    } else {
      currentCandlestick.update(price, vol);
    }

  };

  return this;
};

module.exports = CandleManager
