var express = require('express'),
  router = express.Router(),
  cloudLib = require('../lib/cloud'),
  timerLib = require('../lib/timer'),
  Cloud = require('../models/cloud');

// returnes an array of computes without resourceUsage data
router.get('/compute/computenodes', function (req, res) {
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

// returns an array of computes with resourceUsage
router.get('/statistics/computes', function (req, res) {
  if (!req.session.currentCloud) {
    res.json({ computes: [] });
  } else {
    let racks = req.session.currentCloud.physical; // grab the racks list from the cloud
    let computes = [];
    racks.forEach(function (rack) {
      rack.computes.forEach(function (compute) {
        // clone the resourceUsage and ports arrays so that we only display rx and tx data
        let resourceUsageClone = compute.resourceUsage.map(function (resource) {
          let portsClone = resource.ports.map(function (port) {
            return {
              rx: port.rx,
              rx_drop: port.rx_drop,
              rx_errors: port.rx_errors,
              rx_packets: port.rx_packets,
              tx: port.tx,
              tx_drop: port.tx_drop,
              tx_errors: port.tx_errors,
              tx_packets: port.tx_packets
            };
          });

          return {
            cpu_time: resource.cpu_time,
            memory: resource.memory,
            timestamp: resource.timestamp,
            ports: portsClone
          };
        });
        resourceUsageClone.splice(0, resourceUsageClone.length - 2); // returning only the last two elements
        let computeClone = {
          host_id: compute.host_id,
          hypervisor_hostname: compute.hypervisor_hostname,
          host_ip: compute.host_ip,
          status: compute.status,
          state: compute.state,
          memory_mb: compute.memory_mb,
          cpu_info: compute.cpu_info,
          rack: compute.rackId,
          resourceUsage: resourceUsageClone
        };
        computes.push(computeClone);
      });
    });

    if (req.query.hostId) {
      // the hostId param has been set and we need to search it the computes array
      let searchedCompute = computes.find(compute => compute.host_id === req.query.hostId);
      if (searchedCompute !== undefined) {
        // return a computes array containing only the found compute
        return res.json({computes: [searchedCompute]});
      } else {
        return res.status(404).json('Compute not found');
      }
    }

    res.json({computes: computes});
  }
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

  // create a computes array which will contain the properly formatted response: ports without rx and tx, computes without resourceUsage
  let computes = [];
  racks.forEach(function (rack) {
    rack.computes.forEach(function (compute) {
      // clone the ports array so that we can safely remove rx and tx data
      let portsClone = compute.resourceUsage[0].ports.map(function (port) {
        return {
          port_id: port.port_id,
          fabric_info: port.fabric_info,
          ifc_name: port.ifc_name,
          ifc_type: port.ifc_type,
          mac_addr: port.mac_addr
        };
      });
      // clone a compute so that we can safely remove the resourceUsage array
      let computeClone = {
        host_id: compute.host_id,
        hypervisor_hostname: compute.hypervisor_hostname,
        host_ip: compute.host_ip,
        status: compute.status,
        state: compute.state,
        memory_mb: compute.memory_mb,
        cpu_info: compute.cpu_info,
        rack: compute.rackId,
        ports: portsClone
      };
      computes.push(computeClone);
    });
  });

  return {hypervisors: computes};
}

module.exports = router;
