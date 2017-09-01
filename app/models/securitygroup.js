class SecurityGroup {
  constructor (id, name, description) {
    this.security_group_id = id;
    this.name = name;
    this.description = description;
  }
}

module.exports = SecurityGroup;
