var _ = require('lodash'),
  PhysicalPort = require('./physicalport'),
  Router = require('./router'),
  Chance = require('chance'),
  _physicalPorts = new WeakMap(),
  _routers = new WeakMap(),
  config = require('../config');

class Switch {
  constructor (id, type, name, label, available, sw, hw, role, serial, mfr, chassId) {
    this.switch_id = id;
    this.type = type;
    this.switch_name = name;
    this.label = label;
    this.available = available;
    this.sw = sw;
    this.hw = hw;
    this.role = role;
    this.serial = serial;
    this.mfr = mfr;
    this.chass_id = chassId;
    _physicalPorts.set(this, this.createPhysicalPorts(_.random(5, 10)));
    this.getPhysicalPorts = () => { return _physicalPorts.get(this); };
    _routers.set(this, this.createRouters(1));
    this.getRouters = () => { return _routers.get(this); };
  }

  createPhysicalPorts (count) {
    let physicalPorts = [];
    let chance = new Chance();
    _.times(count, function () {
      let annotations = {
        linkStatus: chance.pickone(['Down', 'Up']),
        interfaceType: chance.word(),
        portName: chance.word(),
        portMac: chance.mac_address()
      };
      let physicalPort = new PhysicalPort(chance.hash(), chance.hash(), chance.bool(), chance.word(), chance.natural(), annotations);
      physicalPorts.push(physicalPort);
    });

    return physicalPorts;
  };

    // generate routers for the given rack
  createRouters (count) {
    let routers = [];
    let chance = new Chance();
    let switchId = this.switch_id;
    _.times(count, function () {
      let router = new Router(
        chance.hash(),
        config.switchTypeRouter,
        chance.word(),
        chance.word(),
        chance.bool(),
        chance.ip(),
        chance.word(),
        chance.pickone([config.switchRoleMaster, config.switchRoleSlave]),
        chance.hash(),
        chance.word(),
        chance.hash(),
        switchId
      );
      routers.push(router);
    });

    return routers;
  };
}

module.exports = Switch;
