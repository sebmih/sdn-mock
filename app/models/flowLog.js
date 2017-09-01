let _ = require('lodash');

class FlowLog {
  constructor (destinationGroup, destinationPort, protocol, sourceGroup, sourcePort, status, timestamp, projectId) {
    this.destination_group_alias = destinationGroup.name;
    this.destination_group_uuid = destinationGroup.security_group_id;
    this.destination_ip = destinationPort.addr;
    this.protocol = protocol;
    this.source_group_alias = sourceGroup.name;
    this.source_group_uuid = sourceGroup.security_group_id;
    this.source_ip = sourcePort.addr;
    this.status = status;
    this.timestamp = timestamp;
    this.projectId = projectId;
    this.source_port = _.random(80, 9000);
    this.destination_port = _.random(80, 9000);
  }
}

// export the class
module.exports = FlowLog;
