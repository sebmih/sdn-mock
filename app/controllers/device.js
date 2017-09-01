var express = require('express'),
  router = express.Router(),
  _ = require('lodash');

// by default returns a list of routers
// with the type=switch param present, it returns switches
router.get('/fabric/devices', function (req, res) {
  if (_.isEmpty(req.query)) {
    let routers = buildPublicRouters(req);
    return res.json({devices: routers});
  }

  if (req.query.type === 'switch') {
    let switches = buildPublicSwitches(req);
    return res.json({devices: switches});
  }

  return res.status(404).json({message: 'Incorrect param'});
});

router.get('/fabric/devices/:switchId', function (req, res) {
  let switches = buildPublicSwitches(req);
  let searchedSwitch = switches.find(switchObj => switchObj.switch_id === req.params.switchId);
  if (searchedSwitch === undefined) {
    return res.status(404).json('Switch not found!');
  }

  res.json(searchedSwitch);
});

function buildPublicSwitches (req) {
  let switches = [];
  if (req.session.currentCloud !== undefined) {
    req.session.currentCloud.physical.map((rack) => {
      rack.switches.map((switchObj) => {
        let publicSwitch = {
          switch_id: switchObj.switch_id,
          type: switchObj.type,
          switch_name: switchObj.switch_name,
          label: switchObj.label,
          available: switchObj.available,
          sw: switchObj.sw,
          hw: switchObj.hw,
          role: switchObj.role,
          serial: switchObj.serial,
          mfr: switchObj.mfr,
          chass_id: switchObj.chass_id
        };
        switches.push(publicSwitch);
      });
    });
  }

  return switches;
}

function buildPublicRouters (req) {
  let routers = [];
  if (!req.session.currentCloud) {
    return routers;
  } else {
    req.session.currentCloud.physical.forEach((rack) => {
      rack.switches.forEach((switchObj) => {
        switchObj.routers.forEach((router) => {
          let publicRouter = {
            router_id: router.router_id,
            type: router.type,
            router_name: router.router_name,
            label: router.label,
            available: router.available,
            sw: router.sw,
            hw: router.hw,
            role: router.role,
            serial: router.serial,
            mfr: router.mfr,
            chass_id: router.chass_id,
            switch_id: router.switch_id
          };
          routers.push(publicRouter);
        });
      });
    });

    return routers;
  }
}

module.exports = router;
