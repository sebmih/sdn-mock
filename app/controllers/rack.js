var express = require('express'),
  router = express.Router(),
  Cloud = require('../models/cloud'),
  cloudLib = require('../lib/cloud'),
  timerLib = require('../lib/timer');

router.get('/fabric/racks', function (req, res) {
  cloudLib.getParams(req.query.p, req.query.i, req.query.m, req.query.r, req.query.m)
  .then((params) => {
    if (cloudLib.isCloudUndefined(req.session.currentCloud)) {
      return cloudLib.createCloud(params);
    } else if (cloudLib.haveParamsChanged(params, req.session.currentCloud)) {
      return cloudLib.createCloud(params);
    } else {
      return req.session.currentCloud;
    }
  }).then((cloud) => {
    req.session.currentCloud = cloud;
    let response = buildResponse(req);

    return res.json(response);
  });
});

function buildResponse (req) {
  let racks = [];
  if (req.session.currentCloud instanceof Cloud) {
    // when the cloud has just been regenerated, it's always an instance of Cloud
    // on subsequent requests, it will be a simple json
    racks = req.session.currentCloud.getRacks();
    clearTimeout(timerLib.timeout);
    timerLib.startCloudTimer(req.session);
  } else {
    racks = req.session.currentCloud.physical;
  }

  let racksClone = racks.map(function (rack) {
    let computesClone = rack.computes.map(function (compute) {
      let portsClone = compute.resourceUsage[0].ports.map(function (port) {
        return {
          port_id: port.port_id,
          fabric_info: port.fabric_info,
          ifc_name: port.ifc_name,
          ifc_type: port.ifc_type,
          mac_addr: port.mac_addr
        };
      });
      return {
        host_id: compute.host_id,
        name: compute.name,
        label: compute.label,
        linux_version: compute.linuxVersion,
        version: compute.version,
        rack: compute.rackId,
        ports: portsClone
      };
    });

    return {
      rack_id: rack.rack_id,
      rack_name: rack.rack_name,
      label: rack.label,
      version: rack.version,
      computes: computesClone,
      switches: rack.switches
    };
  });

  return {racks: racksClone};
}

module.exports = router;
