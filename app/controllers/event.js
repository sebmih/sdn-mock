var express = require('express'),
  router = express.Router();

router.get('/events', function (req, res) {
  if (!req.session.currentCloud) {
    res.json([])
  } else {
    let events = req.session.currentCloud.events;
    if (req.query.timestamp !== undefined) {
      // only return events that have a more recent timestamp
      let timestampEvents = [];
      events.map((event) => {
        if (event.timestamp >= req.query.timestamp) {
          timestampEvents.push(event);
        }
      });

      return res.json(timestampEvents);
    }

    if (req.query.severity !== undefined) {
      // only return events that have that severity
      let severityEvents = [];
      events.map((event) => {
        if (event.severity === req.query.severity) {
          severityEvents.push(event);
        }
      });

      return res.json(severityEvents);
    }
    res.json(events);
  }
});

module.exports = router;
