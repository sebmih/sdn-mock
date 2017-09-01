var _ = require('lodash'),
  Project = require('./project'),
  Rack = require('./rack'),
  Chance = require('chance'),
  _projects = new WeakMap(),
  _racks = new WeakMap();

class Cloud {
  constructor (params) {
    this.numberOfProjects = params.numberOfProjects;
    this.numberOfInstances = params.numberOfInstances;
    this.minNumberOfInstances = params.minNumberOfInstances;
    this.numberOfRacks = params.numberOfRacks;
    this.numberOfComputes = params.numberOfComputes;
    _projects.set(this, this.createProjects(params));
    _racks.set(this, this.createRacks(params));
    this.getProjects = () => { return _projects.get(this); };
    this.getRacks = () => { return _racks.get(this); };
  }

  createProjects (params) {
    let projects = [];
    let chance = new Chance();
    // spliting the total number of instances per project
    let splitNumberOfInstances = this.getSumComponents(params.numberOfProjects, params.numberOfInstances, params.minNumberOfInstances);
    splitNumberOfInstances.forEach(function (i) {
      let project = new Project(chance.hash(), chance.word(), chance.sentence({words: 5}), i);
      projects.push(project);
    });

    return projects;
  };

  createRacks (params) {
    let racks = [];
    let chance = new Chance();
    // spliting the total number of computes per rack
    let splitNumberOfComputes = this.getSumComponents(params.numberOfRacks, params.numberOfComputes, 1);
    splitNumberOfComputes.forEach(function (i) {
      let rack = new Rack(chance.hash(), chance.word(), chance.word(), 'v' + chance.floating({min: 0, max: 100, fixed: 1}), i);
      racks.push(rack);
    });

    return racks;
  };

  // returns the components of a given sum in a given number of sections
  getSumComponents (sections, sum, min) {
    let components = [];
    let i;
    for (i = 0; i < sections - 1; i++) {
      components[i] = min + _.random(0, (sum - min * (sections - i)));
      sum -= components[i];
    }
    components[i] = sum;

    return components;
  }
}

module.exports = Cloud;
