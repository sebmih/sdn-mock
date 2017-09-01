var config = require('../config'),
  timerLib = require('../lib/timer');

class Compute {
  constructor (id, hypervisorHostname, ip, status, state, memoryMb, cpuInfo, rackId, resourceUsage) {
    this.host_id = id;
    this.hypervisor_hostname = hypervisorHostname;
    this.host_ip = ip;
    this.status = status;
    this.state = state;
    this.memory_mb = memoryMb;
    this.cpu_info = cpuInfo;
    this.rack = rackId;
    this.resourceUsage = resourceUsage;
  }

  updateUsage () {
    let maxResourceUsageLength = config.maxResourceUsageLength;
    // if the resourceUsage array passes the max value, then we removing the first element
    if (this.resourceUsage.length >= maxResourceUsageLength) {
      this.resourceUsage.shift();
    }
    // generate a new usage data list based on the last item in the resourceUsage array and then push it to the resourceUsage array
    this.resourceUsage.push(timerLib.generateNewUsageData(this.resourceUsage[this.resourceUsage.length - 1]));
  };
}

module.exports = Compute;
