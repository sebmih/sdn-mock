var express = require('express'),
  router = express.Router(),
  Cloud = require('../models/cloud'),
  cloudLib = require('../lib/cloud'),
  timerLib = require('../lib/timer');

router.get('/projects', function (req, res) {
  cloudLib.getParams(req.query.p, req.query.i, req.query.m, req.query.r, req.query.m)
  .then((params) => {
    if (cloudLib.isCloudUndefined(req.session.currentCloud)) {
      return cloudLib.createCloud(params);
    } else if (cloudLib.haveParamsChanged(params, req.session.currentCloud)) {
      return cloudLib.createCloud(params);
    } else {
      return req.session.currentCloud;
    }
  }).then((cloud) => {
    req.session.currentCloud = cloud;
    let response = buildResponse(req);

    return res.json({projects: response});
  });
});

function buildResponse (req) {
  let projects = [];
  if (req.session.currentCloud instanceof Cloud) {
    // when the cloud has just been regenerated, it's always an instance of Cloud
    // on subsequent requests, it will be a simple json
    projects = req.session.currentCloud.getProjects();
    clearTimeout(timerLib.timeout);
    timerLib.startCloudTimer(req.session);
  } else {
    projects = req.session.currentCloud.virtual;
  }

  if (req.query.projectId) {
    // the projectId param has been set so we'll try to return a single project
    let searchedProject = projects.find(project => project.project_id === req.query.projectId);
    let filteredProjects = [];
    if (searchedProject !== undefined) {
      filteredProjects.push(searchedProject);
      delete searchedProject.instances;
      if (req.query.resourceUsage === 'true') {
        if (req.query.rate === 'true') {
          // if the rate param is true, then we also need to add the second to last element in the response
          searchedProject.resourceUsage.splice(0, searchedProject.resourceUsage.length - 2);
        } else {
          // return only the last element in the resourceUsage array
          searchedProject.resourceUsage.splice(0, searchedProject.resourceUsage.length - 1);
        }
      } else {
        delete searchedProject.resourceUsage;
      };

      return filteredProjects;
    };
  };

  // creating a projects clone so that we can properly setup the response
  let projectsClone = projects.map(function (project) {
    let clone = {
      project_id: project.project_id,
      project_name: project.project_name,
      description: project.description
    };
    if (req.query.resourceUsage === 'true') {
      clone.resourceUsage = [];
      if (req.query.rate === 'true') {
        // if the rate param is true, then we also need to add the second to last element in the response
        clone.resourceUsage.push(project.resourceUsage[project.resourceUsage.length - 2]);
      }
      // return only the last element in the resourceUsage array
      clone.resourceUsage.push(project.resourceUsage[project.resourceUsage.length - 1]);
    }

    return clone;
  });

  return projectsClone;
}

module.exports = router;
