var express = require('express'),
  router = express.Router(),
  Cloud = require('../models/cloud'),
  cloudLib = require('../lib/cloud'),
  timerLib = require('../lib/timer'),
  _ = require('lodash');

router.get('/instances', function (req, res) {
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
    let projects = [];
    projects.push(buildResponse(req.session));
    let response = {projects: projects};

    return res.json(response);
  });
});

router.get('/instances/:instanceId', function (req, res) {
  if (!req.params.instanceId) {
    return res.status(404).json('Instance ID is required');
  }

  let projects = req.session.currentCloud.virtual;
  let instancesRes = {
    instances: []
  };
  projects.forEach(function (project) {
    // search using the instanceId in the instances array for each project
    let searchedInstance = project.instances.find(instance => instance.instance_id === req.params.instanceId);

    if (searchedInstance !== undefined) {
      instancesRes.instances.push(searchedInstance);
      if (req.query.resourceUsage === 'true') {
        if (req.query.rate === 'true') {
          // if the rate param is true, then we also need to add the second to last element in the response
          searchedInstance.resourceUsage.splice(0, searchedInstance.resourceUsage.length - 2);
        } else {
          // return only the last element in the resourceUsage array
          searchedInstance.resourceUsage.splice(0, searchedInstance.resourceUsage.length - 1);
        }
      } else {
        searchedInstance.ports = getPortsClone(searchedInstance);
        delete searchedInstance.resourceUsage;
      };
    };
  });

  return res.json(instancesRes);
});

function getPortsClone (instance) {
  let portsClone = instance.resourceUsage[0].ports.map(function (port) {
    return {
      port_id: port.port_id,
      addr: port.addr,
      mac_addr: port.mac_addr,
      security_groups: port.security_groups
    };
  });

  return portsClone;
}

function buildResponse (session) {
  let projects = [];
  if (session.currentCloud instanceof Cloud) {
    // when the cloud has just been regenerated, it's always an instance of Cloud
    // on subsequent requests, it will be a simple json
    projects = session.currentCloud.getProjects();
    // a new cloud has been generated so we need to clear any existing timer
    clearTimeout(timerLib.timeout);
    timerLib.startCloudTimer(session);
  } else {
    projects = session.currentCloud.virtual;
  }

  // creating a projects clone so that we can properly setup the response
  let projectsClone = {};
  projects.forEach((project) => {
    let instancesClone = project.instances.map((instance) => {
      return {
        instance_id: instance.instance_id,
        instance_name: instance.instance_name,
        type: instance.type,
        host_id: instance.host_id,
        created: instance.created,
        status: instance.status,
        availability_zone: instance.availability_zone,
        hypervisor_hostname: instance.hypervisor_hostname,
        project_id: project.project_id,
        ports: getPortsClone(instance)
      };
    });
    projectsClone[project.project_id] = {
      instances: instancesClone
    };
  });

  return projectsClone;
}

module.exports = router;

