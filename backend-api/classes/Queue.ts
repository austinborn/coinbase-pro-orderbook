export class Queue {
  queue: Array<any>
  processing: boolean
  paused: boolean

  constructor() {
    this.queue = []
    this.processing = false
    this.paused = true
  }

  addToQueue(job) {
    this.queue.push(job)

    if (!this.processing && !this.paused) {
      this.processing = true
      this.run()
    }
  }

  start() {
    this.paused = false
    if (this.queue.length) {
      this.processing = true
      this.run()
    }
  }

  stop() {
    this.paused = true
  }

  async run(){
    while(this.queue.length) {
      const job = this.queue.shift()
      try {
        await job()
      } catch (error) {}
    }

    this.processing = false
  }
}
