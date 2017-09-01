var express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser'),
  instance = require('./controllers/instance'),
  project = require('./controllers/project'),
  rack = require('./controllers/rack'),
  compute = require('./controllers/compute'),
  securitygroup = require('./controllers/securitygroup'),
  deviceController = require('./controllers/device'),
  eventController = require('./controllers/event'),
  flowLogController = require('./controllers/flowLog'),
  app = express(),
  expressSession = require('express-session');

// bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// setup the session
app.use(expressSession({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 360000000,
    secure: false
  }
}));

// setup middleware
app.use(ensureAuthenticated);

// setup the routes
app.use('/mw/v1.0', instance);
app.use('/mw/v1.0', project);
app.use('/mw/v1.0', compute);
app.use('/mw/v1.0', rack);
app.use('/mw/v1.0', securitygroup);
app.use('/mw/v1.0', deviceController);
app.use('/mw/v1.0', eventController);
app.use('/mw/v1.0', flowLogController);

// set port
app.set('port', (process.env.PORT || 3001));

app.listen(app.get('port'), function () {
  console.log('Mock server started on port ' + app.get('port'));
});

function ensureAuthenticated (req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  } else {
    res.status(401).json('Unauthorized');
  }
}

function isAuthenticated (req) {
  console.log('Returns that you are authenticated');
  return true;
}
