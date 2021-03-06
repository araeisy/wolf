'use strict'

const _ = require('underscore');
const co = require('co');

const game_process = require('./process');

const timer_durations = [ 6000, 3000, 2000, 1000 ];
const timer_tips = [ '', 'last 1 min, /join', 'last 30 sec, /join', 'last 10 sec, /join' ];

function Wolf(botapi, chat_id, opts) {
  this.ba = botapi;
  this.chat_id = chat_id;
  this.opts = opts;

  // params
  this.players = [];
  this.status = 'open'; // 'playing'
  this.day = 0;
  this.when = 'night'; // 'day'

  this.itimer = -1;
  this.setStartTimer();
}

Wolf.prototype.format_name = function (user) {
  return user.first_name + (user.last_name ? ' ' + user.last_name : '');
};

Wolf.prototype.message = function (text) {
  this.ba.sendMessage({
    chat_id: this.chat_id,
    text: text,
  }, (err, result) => {
    if (err) {
      console.log(err);
    }
  });
};

Wolf.prototype.setStartTimer = function (i) {
  var self = this;
  if (!i) i = 0;
  this.itimer = i;
  if (i >= timer_durations.length) {
    // start the game
    this.start();
    return;
  }
  var tips = timer_tips[i];
  if (tips) self.message(tips);
  this.timer = setTimeout(() => {
    self.setStartTimer(i + 1);
  }, timer_durations[i]);
};

Wolf.prototype.updateStartTimer = function (i) {
  if (this.status !== 'open') {
    return;
  }
  if (this.itimer > 1) {
    clearTimeout(this.timer);
    this.setStartTimer(2);
  } else if (this.itimer > 0) {
    clearTimeout(this.timer);
    this.setStartTimer(1);
  }
};

Wolf.prototype.start = function () {
  // TODO: call co
  this.timer = null;
  this.status = 'playing';
  this.message('game started');

  var fn = co.wrap(game_process);
  fn.call(this).then(() => {
    this.end();
  }).catch((err) => {
    console.error(err.stack);
  });
};

Wolf.prototype.end = function () {
  this.message('game ended');
  if (this.opts.end) {
    this.opts.end.call(this);
  }
};

Wolf.prototype.forcestart = function () {
  if (this.status !== 'open') {
    return false;
  }
  if (this.players.length >= 5) {
    clearTimeout(this.timer);
    this.start();
    return true;
  }
  // TODO: other check
  return false;
};

Wolf.prototype.flee = function (user) {
  // TODO: check

  return false;
};

Wolf.prototype.join = function (user) {
  if (this.players.length >= 35) {
    return false;
  }
  var found = false;
  for (let u of this.players) {
    if (u.id === user.id) {
      found = true;
      break;
    }
  }
  if (found) {
    this.message('You are already in the game.');
    return true;
  }
  this.players.push(user);
  this.updateStartTimer();
  return true;
};

module.exports = Wolf;
