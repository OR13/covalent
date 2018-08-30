const bs58 = require("bs58");

module.exports = class TransmuteAdapterFirestore {
  constructor(db, collection) {
    this.db = db;
    this.collection = collection;
  }

  /**
   * Reads object from IPFS
   * @function
   * @memberof TransmuteAdapterIPFS
   * @name bytes32ToMultihash
   * @param {String} hash bytes32 hash of IPFS multihash
   * @returns {String} IPFS multihash of bytes32 hash
   */
  bytes32ToMultihash(hash) {
    return bs58.encode(new Buffer("1220" + hash.slice(2), "hex"));
  }

  /**
   * Reads object from IPFS
   * @function
   * @memberof TransmuteAdapterIPFS
   * @name multihashToBytes32
   * @param {String} ipfshash IPFS multihash of bytes32 hash
   * @returns {String} bytes32 hash of IPFS multihash
   */
  multihashToBytes32(ipfshash) {
    return "0x" + new Buffer(bs58.decode(ipfshash).slice(2)).toString("hex");
  }

  bufferToContentID(content) {
    const IPFS = require("ipfs");
    const ipfsNode = new IPFS();
    return new Promise((resolve, reject) => {
      ipfsNode.on("ready", async err => {
        let dagNodes = await ipfsNode.files.add(Buffer.from(content), {
          onlyHash: true
        });
        resolve(this.multihashToBytes32(dagNodes[0].hash));
        ipfsNode.stop();
      });
    });
  }

  async readJson(key) {
    return this.db
      .collection(this.collection)
      .doc(key)
      .get()
      .then(doc => {
        return doc.data();
      });
  }

  async writeJson(value) {
    const key = await this.bufferToContentID(Buffer.from(JSON.stringify(value)));
    return this.db
      .collection(this.collection)
      .doc(key)
      .set(value)
      .then(() => {
        return key;
      });
  }
};
