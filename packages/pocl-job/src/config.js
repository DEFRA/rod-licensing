class Config {
  _db
  _s3

  async initialise () {
    this.db = {
      fileStagingTable: process.env.POCL_FILE_STAGING_TABLE,
      recordStagingTable: process.env.POCL_RECORD_STAGING_TABLE,
      stagingTtlDelta: Number.parseInt(process.env.POCL_STAGING_TTL || 60 * 60 * 168)
    }

    this.s3 = {
      bucket: process.env.POCL_S3_BUCKET
    }
  }

  /**
   * Database configuration settings
   * @type {object}
   */
  get db () {
    return this._db
  }

  set db (cfg) {
    this._db = cfg
  }

  /**
   * S3 configuration settings
   * @type {object}
   */
  get s3 () {
    return this._s3
  }

  set s3 (cfg) {
    this._s3 = cfg
  }
}
export default new Config()
