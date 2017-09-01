var timerLib = require('../lib/timer'),
  config = require('../config');

class Instance {
  constructor (id, name, type, created, status, availabilityZone, resourceUsage, projectId) {
    this.instance_id = id;
    this.instance_name = name;
    this.type = type;
    this.created = created;
    this.status = status;
    this.availability_zone = availabilityZone;
    this.resourceUsage = resourceUsage;
    this.project_id = projectId;
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

module.exports = Instance;
