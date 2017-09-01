let config = {
  numberOfProjects: 8,
  numberOfInstances: 100,
  minNumberOfInstances: 5,
  numberOfSecurityGroups: 3,
  numberOfRacks: 5,
  numberOfComputes: 15,
  resourceUsageDelay: 15000, // value in microseconds
  maxResourceUsageLength: 2,
  switchTypeSwitch: 'SWITCH',
  switchTypeRouter: 'ROUTER',
  switchRoleMaster: 'MASTER',
  switchRoleSlave: 'SLAVE',
  numberOfEvents: 25,
  eventTypes: [
    'PORT.UP',
    'PORT.DOWN',
    'PORT.UP_FAIL',
    'COMPUTE.CPU_EXCESSIVE',
    'COMPUTE.MEMORY_EXCESSIVE',
    'COMPUTE.SHUTDOWN',
    'COMPUTE.BOOTUP',
    'PROJECT.EXIT',
    'PROJECT.DROPPED_PACKET'
  ],
  flowLogProtocols: [
    'RESERVED',
    'TCP',
    'ICMP',
    'UDP'
  ],
  flowLogStatuses: [
    'Accepted',
    'Closed',
    'Rejected',
    'Timed out'
  ],
  numberOfFlowLogs: 50
};

module.exports = config;
