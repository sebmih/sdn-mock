class PhysicalPort {
  constructor (id, port, isEnabled, type, portSpeed, annotations) {
    this.element = id;
    this.port = port;
    this.isEnabled = isEnabled;
    this.type = type;
    this.portSpeed = portSpeed;
    this.annotations = annotations;
  }
}

module.exports = PhysicalPort;
