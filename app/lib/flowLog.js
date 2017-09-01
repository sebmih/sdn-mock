var _ = require('lodash'),
  config = require('../config'),
  FlowLog = require('../models/flowLog');

let flowLog = {
  createFlowLog (destinationPort, destinationGroup, sourcePort, sourceGroup, projectId) {
    let protocol = config.flowLogProtocols[_.random(0, config.flowLogProtocols.length - 1)];
    let status = config.flowLogStatuses[_.random(0, config.flowLogStatuses.length - 1)];
    let flowLog = new FlowLog(destinationGroup, destinationPort, protocol, sourceGroup, sourcePort, status, _.now(), projectId);

    return flowLog;
  }
};

module.exports = flowLog;
