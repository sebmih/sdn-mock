var _ = require('lodash'),
  Compute = require('./compute'),
  Switch = require('./switch'),
  Chance = require('chance'),
  _computes = new WeakMap(),
  _switches = new WeakMap(),
  config = require('../config'),
  ComputePort = require('../models/computeport'),
  timerLib = require('../lib/timer');

class Rack {
  constructor (id, name, label, version, numberOfComputes) {
    this.rack_id = id;
    this.rack_name = name;
    this.label = label;
    this.version = version;
    _computes.set(this, this.createComputes(numberOfComputes));
    this.getComputes = () => { return _computes.get(this); };
    _switches.set(this, this.createSwitches(_.random(1, 2)));
    this.getSwitches = () => { return _switches.get(this); };
  }

  // generate computes for the given rack
  createComputes (count) {
    let computes = [];
    let rackId = this.rack_id;
    let chance = new Chance();
    let delay = config.resourceUsageDelay; // the number of miliseconds between each resourceUsage element
    _.times(count, function () {
      let ports = [];
      // create between 1 and 10 compute ports
      _.times(_.random(1, 10), function () {
        let computePort = new ComputePort(
          chance.hash(),
          'IP=' + chance.ip() + ',MASK=255.255.255.0',
          chance.pickone(['eth0', 'eth1']), 'fabric_core',
          chance.mac_address(),
          _.random(2000, 2000000), // rx bytes with values between 2kB and 2MB
          _.random(2, 200), // rx dropped packets
          _.random(2, 20), // rx errors
          _.random(2, 2000), // rx packets
          _.random(1000, 1000000), // tx bytes
          _.random(2, 100), // tx drop
          _.random(2, 10), // tx errors
          _.random(2, 1000) // tx pakcets
        );
        ports.push(computePort);
      });
      // create a new resourceUsage array containing the ports created previously
      let resourceUsage = [
        {
          timestamp: _.now() - delay,
          cpu_time: _.random(10, 50),
          memory: _.random(2000000, 256000000), // setting a memory value between 2MB and 256MB
          ports: ports
        }
      ];

      // create the next element in the resourceUsage array using the data from the first one
      let nextResource = timerLib.generateNewUsageData(resourceUsage[0]);
      resourceUsage.push(nextResource);
      let cpuInfo = {
        model: chance.last(),
        vendor: chance.last(),
        topology: {
          cores: _.random(1, 12),
          threads: _.random(1, 96),
          sockets: _.random(1, 8)
        }
      };
      let compute = new Compute(
        chance.hash(),
        chance.word(),
        chance.ip(),
        chance.pickone(['enabled', 'disabled']),
        chance.pickone(['up', 'down']),
        chance.pickone([128, 256, 512, 1024, 2048]),
        cpuInfo,
        rackId,
        resourceUsage
      );
      computes.push(compute);
    });

    return computes;
  };

  // generate switches for the given rack
  createSwitches (count) {
    let switches = [];
    let chance = new Chance();

    _.times(count, function () {
      let switchObj = new Switch(
        chance.hash(),
        config.switchTypeSwitch,
        chance.word(),
        chance.word(),
        chance.bool(),
        chance.ip(),
        chance.word(),
        chance.pickone([config.switchRoleMaster, config.switchRoleSlave]),
        chance.hash(),
        chance.word(),
        chance.hash()
      );
      switches.push(switchObj);
    });

    return switches;
  };
}

// export the class
module.exports = Rack;
