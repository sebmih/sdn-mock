var express = require('express'),
  router = express.Router(),
  _ = require('lodash'),
  config = require('../config');

router.get('/flows/logs/:projectId', (req, res) => {
  if (req.session.currentCloud === undefined) {
    res.json([]);
  }

  let cloudFlowLogs = req.session.currentCloud.flowLogs;
  let flowLogs = cloudFlowLogs.filter(cloudFlowLog => cloudFlowLog.projectId === req.params.projectId);
  if (_.isEmpty(flowLogs)) {
    res.status(404).json({ message: 'No flow logs have been found!' });
  }
  if (!_.isEmpty(req.query)) {
    let numberOfParams = Object.keys(req.query).length;
    let filteredFlowLogs = flowLogs.filter(flowLog => {
      let numberOfMatches = 0; // representing the number of times a param value is equal to a flowLog property value
      for (let param in req.query) {
        if (param !== 'timestamp' && flowLog[param] === req.query[param]) {
          numberOfMatches++; // if the param has a value equal to the value of a flowLog property then we increment the numberOfMatches
        }
      }
      // if the timestamp is present, then we subtract 1 from the number of params
      if ('timestamp' in req.query) {
        return numberOfMatches === numberOfParams - 1;
      }

      // only return the flowLogs that respect the condition above for all given query params
      return numberOfMatches === numberOfParams;
    });

    if ('timestamp' in req.query) {
      let timestampFlowLogs = filteredFlowLogs.filter(flowLog => {
        return flowLog.timestamp >= req.query.timestamp;
      });
      return res.json(timestampFlowLogs);
    }

    return res.json(filteredFlowLogs);
  }

  res.json(flowLogs);
});

router.get('/flows/count/:projectId', (req, res) => {
  if (req.session.currentCloud === undefined) {
    res.json([]);
  }
  let cloudFlowLogs = req.session.currentCloud.flowLogs;
  let projectFlowLogs = cloudFlowLogs.filter(cloudFlowLog => cloudFlowLog.projectId === req.params.projectId);
  if (_.isEmpty(projectFlowLogs)) {
    res.status(404).json({ message: 'No flow logs have been found for the given project!' });
  }

  // create an array of uuid pairs
  let groupsUuidPairs = projectFlowLogs.map((flowLog) => {
    return {
      destination_group_uuid: flowLog.destination_group_uuid,
      source_group_uuid: flowLog.source_group_uuid
    };
  });

  // remove any duplicate pairs
  groupsUuidPairs.forEach((pair, index) => {
    removeDuplicates(groupsUuidPairs, pair, index);
  });

  // count the flow logs for each unique pair
  let flowLogsCount = [];
  groupsUuidPairs.forEach((pair) => {
    // create a list of flowLogs based on the unique pairs
    let pairFlowLogs = projectFlowLogs.filter((flowLog) => {
      return flowLog.destination_group_uuid === pair.destination_group_uuid && flowLog.source_group_uuid === pair.source_group_uuid;
    });
    let flowLogStatuses = config.flowLogStatuses; // grab the status list from the config file
    flowLogStatuses.forEach((status) => {
      // filter the paired flow logs for each status
      let sameStatusFlowLogs = pairFlowLogs.filter(pairFlowLog => pairFlowLog.status === status);
      // if at least one flowLog has been found, then create the count object, which contains the number of flows
      // between two security groups
      if (sameStatusFlowLogs.length > 0) {
        flowLogsCount.push({
          destination_group_uuid: pair.destination_group_uuid,
          flow_count: sameStatusFlowLogs.length,
          source_group_uuid: pair.source_group_uuid,
          status: status,
          timestamp: new Date()
        });
      }
    });
  });

  res.json(flowLogsCount);
});

let removeDuplicates = (arr, elem, index) => {
  // compare the given element properties with all the other elements of the array
  for (let i = 0; i < arr.length; i++) {
    if (index !== i && // avoid comparing the element with itself
      elem.destination_group_uuid === arr[i].destination_group_uuid &&
      elem.source_group_uuid === arr[i].source_group_uuid) {
      // if a duplicate has been found, then remove that duplicate from arr and call the function again on the 'new' arr
      arr.splice(i, 1);
      removeDuplicates(arr, elem, index);
    }
  }

  return arr;
};

module.exports = router;
