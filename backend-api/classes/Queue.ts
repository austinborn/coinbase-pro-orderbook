export class Queue {
  _firstSeqNum: number
  _processing: boolean
  _paused: boolean
  _queue: Array<any>

  constructor() {
    this._queue = []
    this._firstSeqNum = null
    this._processing = false
    this._paused = true
  }

  addToQueue(job, seq) {
    this._queue.push(job)

    if (!this._firstSeqNum && seq) this._firstSeqNum = seq

    if (!this._processing && !this._paused) {
      this._processing = true
      this.run()
    }
  }

  getFirstSeqNum() {
    return this._firstSeqNum
  }

  start() {
    this._paused = false
    if (this._queue.length) {
      this._processing = true
      this.run()
    }
  }

  stop() {
    this._paused = true
  }

  async run(){
    while(this._queue.length) {
      const job = this._queue.shift()
      try {
        await job()
      } catch (error) {}
    }

    this._processing = false
  }
}
