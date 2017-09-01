class Port {
  constructor (id, addr, macAddr, securityGroups, rx, rxDrop, rxErrors, rxPackets, tx, txDrop, txErrors, txPackets) {
    this.port_id = id;
    this.addr = addr;
    this.mac_addr = macAddr;
    this.security_groups = securityGroups;
    this.rx = rx;
    this.rx_drop = rxDrop;
    this.rx_errors = rxErrors;
    this.rx_packets = rxPackets;
    this.tx = tx;
    this.tx_drop = txDrop;
    this.tx_errors = txErrors;
    this.tx_packets = txPackets;
  }
}

module.exports = Port;
