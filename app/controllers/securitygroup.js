var express = require('express'),
  router = express.Router();

router.get('/security-groups', function (req, res) {
  if (!req.session.currentCloud) {
    res.json({security_groups: []});
  } else {
    res.json({security_groups: req.session.currentCloud.securityGroups});
  }
  });

router.get('/security-groups/:securityGroupId/instances', function (req, res) {
  if (req.session.currentCloud === undefined) {
    res.json({ instances: [] });
  }

  let securityGroups = req.session.currentCloud.securityGroups;
  let searchedSecurityGroup = securityGroups.find(securityGroup => securityGroup.security_group_id === req.params.securityGroupId);
  if (searchedSecurityGroup === undefined) {
    res.status(404).json('Security group not found!');
  }

  // search the ports that have the searchedSecurityGroup and return the instances containing that port
  let instances = [];
  let projects = req.session.currentCloud.virtual;
  projects.forEach(function (project) {
    project.instances.forEach(function (instance) {
      instance.resourceUsage[0].ports.some(function (port) {
        if (port.security_groups.includes(searchedSecurityGroup.security_group_id)) {
          instances.push(instance);
          return true; // exit the ports loop and move on to the next instance
        }
      });
    });
  });

  // clone the instances array to that we can safely format the response (with or without ports and resourceUsage)
  let instancesClone = instances.map(function (instance) {
    let instanceClone = {
      instance_id: instance.instance_id,
      name: instance.name,
      type: instance.type,
      host_id: instance.host_id,
      hypervisor_hostname: instance.hypervisor_hostname,
      created: instance.created,
      status: instance.status,
      availability_zone: instance.availability_zone,
      ports: getPortsClone(instance)
    };
    if (req.query.resourceUsage === 'true') {
      instanceClone.resourceUsage = [];
      delete instanceClone.ports;
      if (req.query.rate === 'true') {
        // if the rate param is set to true, then return the last two items in the resourceUsage array
        instanceClone.resourceUsage.push(instance.resourceUsage[instance.resourceUsage.length - 2]);
      }
      // return only the last element in the resourceUsage array
      instanceClone.resourceUsage.push(instance.resourceUsage[instance.resourceUsage.length - 1]);
    }

    return instanceClone;
  });

  res.json({ instances: instancesClone });
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

module.exports = router;
