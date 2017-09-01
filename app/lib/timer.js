var _ = require('lodash'),
  config = require('../config'),
  eventLib = require('./event'),
  flowLogLib = require('./flowLog');

let timer = {
  // always returns a new object (updates) based on the data from the param
  generateNewUsageData: function (dataSet) {
    let updates = {
      timestamp: _.now(),
      cpu_time: _.random(10, 400), // setting a cpu time value between 10% and 400%
      memory: _.random(1000000, 512000000), // setting a memory value between 1MB and 512MB
      ports: dataSet.ports.map((port) => {
        let newPort = {
          rx: port.rx + _.random(1000, 5000000), // incremeting Received bytes with values between 1KB and 5MB
          rx_drop: port.rx_drop + _.random(1, 5000),
          rx_errors: port.rx_errors + _.random(1, 50),
          rx_packets: port.rx_packets + _.random(1, 50000),
          tx: port.tx + _.random(1, 2000000), // incremeting Transmited bytes with values between 1 byte and 2MB
          tx_drop: port.tx_drop + _.random(1, 2000),
          tx_errors: port.tx_errors + _.random(1, 20),
          tx_packets: port.tx_packets + _.random(1, 20000)
        };

        return Object.assign({}, port, newPort);
      }
    )};

    return Object.assign({}, dataSet, updates);
  },
  startCloudTimer: function (session) {
    this.timeout = setTimeout(() => {
      let instances = []; // create an instances array that'll be used to generate a new event
      // update the resourceUsage for projects
      session.currentCloud.virtual.forEach((project) => {
        let newResource = project.generateResourceUsage(1)[0];
        project.resourceUsage.push(newResource);
        let maxResourceUsageLength = config.maxResourceUsageLength;
        // if the resourceUsage array passes the max value, then we remove the first element
        if (project.resourceUsage.length >= maxResourceUsageLength) {
          project.resourceUsage.shift();
        }
        let lastIndex = project.resourceUsage.length - 1;
        project.instances.forEach((instance) => {
          instance.updateUsage();
          let latestResource = instance.resourceUsage[lastIndex];
          project.setNextResourceUsage(latestResource, lastIndex);
          instances.push(instance); // add the current instance to the instances array
        });
      });
      // updating resourceUsage for Computes
      session.currentCloud.physical.forEach((rack) => {
        rack.computes.forEach((compute) => {
          compute.updateUsage();
        });
      });

      // create a new event
      let eventInstance = instances[_.random(0, instances.length - 1)];
      let eventProject = session.currentCloud.virtual.find(project => project.project_id === eventInstance.project_id);
      session.currentCloud.physical.some((rack) => {
        this.eventCompute = rack.computes.find(compute => compute.host_id === eventInstance.host_id);
        if (this.eventCompute !== undefined) {
          return true; // if an eventCompute has been found, then we need to exit the .some() loop
        }
      });
      session.currentCloud.events.shift(); // removing the first element in the list
      let events = eventLib.createEvents(eventInstance, eventProject, this.eventCompute, 1); // create a new event
      session.currentCloud.events.push(events[0]); // add the event to the list

      // create a new flowLog
      session.currentCloud.flowLogs.shift();
      let securityGroups = session.currentCloud.securityGroups;
      let destinationInstance = instances[_.random(0, instances.length - 1)];
      let destinationPort = destinationInstance.resourceUsage[0].ports[_.random(0, destinationInstance.resourceUsage[0].ports - 1)];
      let destinationGroupId = destinationPort.security_groups[_.random(0, destinationPort.security_groups.length - 1)];
      let destinationGroup = securityGroups.find(securityGroup => securityGroup.security_group_id === destinationGroupId);
      let sourceInstance = instances[_.random(0, instances.length - 1)];
      let sourcePort = sourceInstance.resourceUsage[0].ports[_.random(0, sourceInstance.resourceUsage[0].ports - 1)];
      let sourceGroupId = sourcePort.security_groups[_.random(0, sourcePort.security_groups.length - 1)];
      let sourceGroup = securityGroups.find(securityGroup => securityGroup.security_group_id === sourceGroupId);
      let projectId = null;
      session.currentCloud.virtual.some((project) => {
        let searchedInstance = project.instances.find(instance => instance.instance_id === destinationInstance.instance_id);
        if (searchedInstance !== undefined) {
          projectId = project.project_id;
          return true;
        }
      });
      let flowLog = flowLogLib.createFlowLog(destinationPort, destinationGroup, sourcePort, sourceGroup, projectId);
      session.currentCloud.flowLogs.push(flowLog);

      session.save();
      this.startCloudTimer(session);
    }, config.resourceUsageDelay);
  }
};

module.exports = timer;
