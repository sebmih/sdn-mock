class ComputePort {
  constructor (portId, fabricInfo, ifcName, ifcType, macAddr, rx, rxDrop, rxErrors, rxPackets, tx, txDrop, txErrors, txPackets) {
    this.port_id = portId;
    this.fabric_info = fabricInfo;
    this.ifc_name = ifcName;
    this.ifc_type = ifcType;
    this.mac_addr = macAddr;
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

module.exports = ComputePort;
