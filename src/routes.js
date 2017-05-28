/* eslint-disable no-param-reassign*/
import express from 'express';
import passport from 'passport';

import Poll from './config/model';

// const passport = require('passport');
// require('./config/passport')(passport);

const router = express.Router();

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/');
}

// set router param
router.param('pID', (req, res, next, id) => {
  Poll.findById(id, (err, doc) => {
    if (err) return next(err);
    if (!doc) {
      err = new Error('Document cannot be found in DB');
      err.status = 404;
      return next(err);
    }
    req.poll = doc;
    return next();
  });
});

router.param('aID', (req, res, next, id) => {
  req.answer = req.poll.answers.id(id);
  if (!req.answer) {
    const err = new Error('Document cannot be found in DB');
    err.status = 404;
    return next(err);
  }
  return next();
});

// GET,POST, DELETE Routes
router.get('/', (req, res) => {
  res.json({
    response: 'GET for home route',
    body: req.body,
  });
});

router.get('/polls', (req, res) => {
  Poll.find({}, (err, polls, next) => {
    if (err) return next(err);
    return res.status(200).json(polls);
  });
});

router.get('/:pID', (req, res) => {
  res.json(req.poll);
});

router.post('/new', (req, res, next) => {
  const poll = new Poll(req.body);
  poll.save((err, doc) => {
    if (err) return next(err);
    return res.status(201).json(doc);
  });
});

router.post('/:pID/new', (req, res, next) => {
  req.poll.answers.push(req.body);
  req.poll.save((err, doc) => {
    if (err) return next(err);
    return res.status(201).json(doc);
  });
});

router.post('/:pID/:aID/vote', (req, res, next) => {
  req.answer.vote(req.vote, (err, doc) => {
    if (err) return next(err);
    return res.json(doc);
  });
});

router.delete('/:pID', (req, res, next) => {
  req.poll.remove(() => {
    req.poll.save((err, doc) => {
      if (err) return next(err);
      return res.json(doc);
    });
  });
});

// authentication routes

router.get('/auth/twitter', passport.authenticate('twitter'));

router.get(
	'/auth/twitter/callback',
	passport.authenticate('twitter', {
  successRedirect: '/polls',
  failureRedirect: '/',
}),
);

router.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

router.get(
	'/connect/twitter/callback',
	passport.authorize('twitter', {
  successRedirect: '/polls',
  failureRedirect: '/',
}),
);

router.get('/unlink/twitter', isLoggedIn, (req, res) => {
  const user = req.user;
  user.twitter.token = undefined;
  user.save((err) => {
    res.redirect('/');
  });
});

export default router;