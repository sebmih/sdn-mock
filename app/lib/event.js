var _ = require('lodash'),
  config = require('../config'),
  Chance = require('chance'),
  Evt = require('../models/event');

let event = {
  createEvents (instance, project, compute, count) {
    let events = [];
    let chance = new Chance();
    _.times(count, function () {
      let eventType = config.eventTypes[_.random(0, config.eventTypes.length - 1)];
      let eventClassification = null;
      let info = null;
      let severity = null;
      let port = instance.resourceUsage[0].ports[_.random(0, instance.resourceUsage[0].ports.length - 1)]; // select a random port from the resourceUsage list
      switch (eventType) {
        case 'PORT.UP':
          eventClassification = [
            { type: 'Instance', uuid: instance.instance_id },
            { type: 'Compute', uuid: instance.host_id },
            { type: 'Project', uuid: instance.project_id }
          ];
          info = {
            action_needed: 'NONE',
            ip: port.addr,
            more_details: chance.sentence(),
            project_name: project.name
          };
          severity = 'info';
          break;
        case 'PORT.DOWN':
          eventClassification = [
            { type: 'Instance', uuid: instance.instance_id },
            { type: 'Compute', uuid: instance.host_id },
            { type: 'Project', uuid: instance.project_id }
          ];
          info = {
            action_needed: 'PROJECT.CHECK_CONFIG',
            ip: port.addr,
            ifc_mac: port.mac_addr,
            more_details: chance.sentence(),
            project_name: project.name
          };
          severity = 'info';
          break;
        case 'PORT.UP_FAIL':
          eventClassification = [
            { type: 'Instance', uuid: instance.instance_id },
            { type: 'Compute', uuid: instance.host_id },
            { type: 'Project', uuid: instance.project_id }
          ];
          info = {
            action_needed: 'PROJECT.CHECK_CONFIG',
            ip: port.addr,
            more_details: chance.sentence(),
            project_name: project.name
          };
          severity = 'alert';
          break;
        case 'COMPUTE.CPU_EXCESSIVE':
          eventClassification = [
            { type: 'Compute', uuid: compute.host_id }
          ];
          info = {
            action_needed: 'COMPUTE.REBOOT',
            cpu_usage: compute.resourceUsage[compute.resourceUsage.length - 1].cpu_time,
            ip: compute.resourceUsage[compute.resourceUsage.length - 1].ports[0].fabric_info
          };
          severity = 'warning';
          break;
        case 'COMPUTE.MEMORY_EXCESSIVE':
          eventClassification = [
            { type: 'Compute', uuid: compute.host_id }
          ];
          info = {
            action_needed: 'COMPUTE.REBOOT',
            memory_usage: compute.resourceUsage[compute.resourceUsage.length - 1].memory,
            ip: compute.resourceUsage[compute.resourceUsage.length - 1].ports[0].fabric_info
          };
          severity = 'warning';
          break;
        case 'COMPUTE.SHUTDOWN':
          eventClassification = [
            { type: 'Compute', uuid: compute.host_id }
          ];
          info = {
            action_needed: 'COMPUTE.REBOOT',
            ip: compute.resourceUsage[compute.resourceUsage.length - 1].ports[0].fabric_info
          };
          severity = 'warning';
          break;
        case 'COMPUTE.BOOTUP':
          eventClassification = [
            { type: 'Compute', uuid: compute.host_id }
          ];
          info = {
            action_needed: 'NONE',
            ip: compute.resourceUsage[compute.resourceUsage.length - 1].ports[0].fabric_info
          };
          severity = 'info';
          break;
        case 'PROJECT.DROPPED_PACKET':
          eventClassification = [
            { type: 'Project', uuid: project.project_id }
          ];
          info = {
            action_needed: 'PROJECT.CHECK_CONFIG',
            more_details: chance.sentence(),
            value: project.resourceUsage[project.resourceUsage.length - 1].tx_drop,
            name: project.name
          };
          severity = 'warning';
          break;
        case 'PROJECT.EXIT':
          eventClassification = [
            { type: 'Project', uuid: project.project_id }
          ];
          info = {
            action_needed: 'NONE',
            name: project.name
          };
          severity = 'warning';
          break;
      };
      let event = new Evt(eventClassification, eventType, info, severity, _.now());
      events.push(event);
    });

    return events;
  }
};

module.exports = event;
