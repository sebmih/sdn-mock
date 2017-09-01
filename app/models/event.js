class Event {
  constructor (eventClassification, eventType, info, severity, timestamp) {
    this.event_classification = eventClassification;
    this.event_type = eventType;
    this.info = info;
    this.severity = severity;
    this.timestamp = timestamp;
  }
}

// export the class
module.exports = Event;
