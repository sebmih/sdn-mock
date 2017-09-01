var Cloud = require('../models/cloud'),
  config = require('../config'),
  Chance = require('chance'),
  SecurityGroup = require('../models/securitygroup'),
  _ = require('lodash'),
  eventLib = require('./event'),
  flowLogLib = require('./flowLog');

let cloud = {
  isCloudUndefined: (sessionCloud) => {
    if (sessionCloud === undefined) {
      return true;
    }

    return false;
  },
  // check if the params (that came from the request or from the config) contains different data than the current cloud
  haveParamsChanged: (params, sessionCloud) => {
    if (params.numberOfProjects !== sessionCloud.numberOfProjects ||
    params.numberOfInstances !== sessionCloud.numberOfInstances ||
    params.minNumberOfInstances !== sessionCloud.minNumberOfInstances ||
    params.numberOfRacks !== sessionCloud.numberOfRacks ||
    params.numberOfComputes !== sessionCloud.numberOfComputes) {
      return true;
    }

    return false;
  },
  // create a new cloud
  createCloud: (params) => {
    return new Promise((resolve) => {
      let cloud = new Cloud(params);

      let racks = [];
      let switches = [];
      cloud.getRacks().forEach((rack) => {
        rack.computes = rack.getComputes();
        rack.switches = rack.getSwitches();
        rack.switches.forEach((switchObj) => {
          switchObj.ports = switchObj.getPhysicalPorts();
          switchObj.routers = switchObj.getRouters();
          switchObj.routers.forEach((router) => {
            router.ports = router.getPhysicalPorts();
          });
          switches.push(switchObj);
        });
        racks.push(rack);
      });

      // build computesData array that we'll use to set the hostId and hypervisorHostname to each instance
      let computeData = [];
      racks.map((rack) => {
        rack.computes.forEach((compute) => {
          computeData.push({
            hostId: compute.host_id,
            hypervisorHostname: compute.hypervisor_hostname
          });
        });
      });

      // create securityGroups
      let numberOfSecurityGroups = config.numberOfSecurityGroups;
      let securityGroups = [];
      let chance = new Chance();
      let securityGroup1 = new SecurityGroup('bytex1', 'word1', chance.sentence({words: 5}));
      let securityGroup2 = new SecurityGroup('bytex2', 'word2', chance.sentence({words: 5}));
      let securityGroup3 = new SecurityGroup('bytex3', 'word3', chance.sentence({words: 5}));
      securityGroups.push(securityGroup1);
      securityGroups.push(securityGroup2);
      securityGroups.push(securityGroup3);

      // create a list of securityGroup IDs that'll be used on each port for each instance
      let securityGroupIDs = securityGroups.map(function (securityGroup) {
        return securityGroup.security_group_id;
      });

      let instances = [];
      let projects = cloud.getProjects().map((project) => {
        project.instances = project.getInstances();
        project.resourceUsage = project.generateResourceUsage(2);
        project.instances.map((instance) => {
          let randomIndex = _.random(0, computeData.length - 1);
          instance.host_id = computeData[randomIndex].hostId;
          instance.hypervisor_hostname = computeData[randomIndex].hypervisorHostname;
          instance.resourceUsage.forEach((resource, index) => {
            project.setNextResourceUsage(resource, index);
            // set securityGroups for each port in each instance
            resource.ports.forEach(function (port) {
              let begin = _.random(0, numberOfSecurityGroups - 1);
              let end = begin + _.random(1, numberOfSecurityGroups);
              port.security_groups = securityGroupIDs.slice(begin, end);
            });
          });
          instances.push(instance); // push every instance in every project into the instances array
        });

        return project;
      });

      // generating the initial events
      let eventInstance = instances[_.random(0, instances.length - 1)];
      let eventProject = projects.find(project => project.project_id === eventInstance.project_id);
      racks.some((rack) => {
        this.eventCompute = rack.computes.find(compute => compute.host_id === eventInstance.host_id);
        if (this.eventCompute !== undefined) {
          return true; // if an eventCompute has been found, then we need to exit the loop
        }
      });
      let events = eventLib.createEvents(eventInstance, eventProject, this.eventCompute, config.numberOfEvents);

      // generate flowLogs
      let flowLogs = [];
      _.times(config.numberOfFlowLogs, () => {
        let destinationInstance = instances[_.random(0, instances.length - 1)];
        let destinationPort = destinationInstance.resourceUsage[0].ports[_.random(0, destinationInstance.resourceUsage[0].ports - 1)];
        let destinationGroupId = destinationPort.security_groups[_.random(0, destinationPort.security_groups.length - 1)];
        let destinationGroup = securityGroups.find(securityGroup => securityGroup.security_group_id === destinationGroupId);
        let sourceInstance = instances[_.random(0, instances.length - 1)];
        let sourcePort = sourceInstance.resourceUsage[0].ports[_.random(0, sourceInstance.resourceUsage[0].ports - 1)];
        let sourceGroupId = sourcePort.security_groups[_.random(0, sourcePort.security_groups.length - 1)];
        let sourceGroup = securityGroups.find(securityGroup => securityGroup.security_group_id === sourceGroupId);
        let projectId = null;
        projects.some((project) => {
          let searchedInstance = project.instances.find(instance => instance.instance_id === destinationInstance.instance_id);
          if (searchedInstance !== undefined) {
            projectId = project.project_id;
            return true;
          }
        });
        let flowLog = flowLogLib.createFlowLog(destinationPort, destinationGroup, sourcePort, sourceGroup, projectId);
        flowLogs.push(flowLog);
      });

      // adding data to the cloud
      cloud.virtual = projects;
      cloud.physical = racks;
      cloud.securityGroups = securityGroups;
      cloud.events = events;
      cloud.flowLogs = flowLogs;

      resolve(cloud);
    });
  },
  // compare request params with config params
  getParams: (p, i, m, r, c) => {
    return new Promise((resolve) => {
      let params = {
        // virtual params
        numberOfProjects: p ? +p : config.numberOfProjects,
        numberOfInstances: i ? +i : config.numberOfInstances,
        minNumberOfInstances: m ? +m : config.minNumberOfInstances,
        // physical params
        numberOfRacks: r ? +r : config.numberOfRacks,
        numberOfComputes: c ? +c : config.numberOfComputes,
        // the delay after witch the a new resourceUsage set is generated for each Instance
        delay: config.resourceUsageDelay
      };

      resolve(params);
    });
  }
};

module.exports = cloud;

