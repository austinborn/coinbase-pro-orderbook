type QueueItem = {
  seq: number
  job: () => void
}

export class Queue {
  _processing: boolean
  _paused: boolean
  _queue: Array<QueueItem>

  constructor() {
    this._queue = []
    this._processing = false
    this._paused = true
  }

  addToQueue(job, seq) {
    if (!(
      Number.isInteger(seq) &&
      (seq > this.getLastSequenceNumber())
    )) return

    this._queue.push({seq, job})

    if (!this._processing && !this._paused) {
      this._processing = true
      this.run()
    }
  }

  clear() {
    this._queue = []
  }

  getFirstSequenceNumber() {
    return this._queue.length
      ? this._queue[0].seq
      : -1
  }

  getLastSequenceNumber() {
    return this._queue.length
      ? this._queue[this._queue.length - 1].seq
      : -1
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

  async run() {
    while(this._queue.length && !this._paused) {
      const { job } = this._queue.shift()
      try {
        await job()
      } catch (error) {}
    }

    this._processing = false
  }
}
