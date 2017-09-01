var _ = require('lodash'),
  Instance = require('./instance'),
  Chance = require('chance'),
  _instances = new WeakMap(),
  config = require('../config'),
  Port = require('../models/port'),
  timerLib = require('../lib/timer');

class Project {
  constructor (id, name, description, numberOfInstances) {
    this.project_id = id;
    this.project_name = name;
    this.description = description;
    _instances.set(this, this.createInstances(numberOfInstances));
    this.getInstances = () => { return _instances.get(this); };
    this.resourceUsage = [];
  }

  createInstances (numberOfInstances) {
    let instances = [];
    let chance = new Chance();
    let delay = config.resourceUsageDelay;
    let projectId = this.project_id;
    _.times(numberOfInstances, function () {
      let ports = [];
      _.times(_.random(1, 4), function () {
        let port = new Port(
          chance.hash(),
          chance.ip(),
          chance.mac_address(),
          [],
          _.random(1000, 1000000), // rx bytes with values between 1KB and 1MB
          _.random(1, 100), // rx dropped packets
          _.random(1, 10), // rx errors
          _.random(1, 1000), // rx packets
          _.random(500, 500000), // tx bytes
          _.random(1, 50), // tx drop
          _.random(1, 5), // tx errors
          _.random(1, 500) // tx pakcets
        );
        ports.push(port);
      });
      let resourceUsage = [
        {
          timestamp: _.now() - delay,
          cpu_time: _.random(1, 10),
          memory: _.random(1000000, 128000000), // setting a memory value between 1MB and 128MB
          ports: ports
        }
      ];
      let nextResource = timerLib.generateNewUsageData(resourceUsage[0]);
      resourceUsage.push(nextResource);
      let instance = new Instance(
        chance.hash(),
        chance.word(),
        chance.pickone(['vm', 'container']),
        new Date(),
        chance.pickone(['ACTIVE', 'INACTIVE']),
        chance.word(),
        resourceUsage,
        projectId
      );
      instances.push(instance);
    });

    return instances;
  };

  // generate a new resourceUsage array with empty data
  generateResourceUsage (n) {
    let resourceUsage = [];
    _.times(n, function () {
      let usage = {
        timestamp: 0,
        cpu_time: 0,
        memory: 0,
        rx: 0,
        rx_drop: 0,
        rx_errors: 0,
        rx_packets: 0,
        tx: 0,
        tx_drop: 0,
        tx_errors: 0,
        tx_packets: 0
      };
      resourceUsage.push(usage);
    });

    return resourceUsage;
  }

  // create a new resourceUsage element using the previous one
  setNextResourceUsage (resource, index) {
    this.resourceUsage[index].timestamp = resource.timestamp;
    this.resourceUsage[index].cpu_time += resource.cpu_time;
    this.resourceUsage[index].memory += resource.memory;
    resource.ports.forEach((port) => {
      this.resourceUsage[index].rx += port.rx;
      this.resourceUsage[index].rx_drop += port.rx_drop;
      this.resourceUsage[index].rx_errors += port.rx_errors;
      this.resourceUsage[index].rx_packets += port.rx_packets;
      this.resourceUsage[index].tx += port.tx;
      this.resourceUsage[index].tx_drop += port.tx_drop;
      this.resourceUsage[index].tx_errors += port.tx_errors;
      this.resourceUsage[index].tx_packets += port.tx_packets;
    });
  }
}

// export the class
module.exports = Project;
