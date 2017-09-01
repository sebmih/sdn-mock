var _ = require('lodash'),
  PhysicalPort = require('./physicalport'),
  Chance = require('chance'),
  _physicalPorts = new WeakMap();

class Router {
  constructor (id, type, name, label, available, sw, hw, role, serial, mfr, chassId, switchId) {
    this.router_id = id;
    this.type = type;
    this.router_name = name;
    this.label = label;
    this.available = available;
    this.sw = sw;
    this.hw = hw;
    this.role = role;
    this.serial = serial;
    this.mfr = mfr;
    this.chass_id = chassId;
    this.switch_id = switchId;
    _physicalPorts.set(this, this.createPhysicalPorts(_.random(5, 10)));
    this.getPhysicalPorts = () => { return _physicalPorts.get(this); };
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
}

module.exports = Router;
