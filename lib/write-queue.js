'use strict';

/**
 * Serializes write operations. Luxtronik accepts only one interactive write
 * session at a time; each queued job therefore starts only after its
 * predecessor has settled.
 */
class WriteQueue {

    constructor(adapter, writer) {

        this.adapter = adapter;
        this.writer = writer;
        this.jobs = [];
        this.running = false;
        this.stopped = false;

    }

    enqueue(stateId, value) {

        if (this.stopped) {
            return Promise.reject(
                new Error('WriteQueue wurde gestoppt.')
            );
        }

        return new Promise((resolve, reject) => {

            this.jobs.push({
                stateId,
                value,
                resolve,
                reject
            });

            this.adapter.log.debug(
                `WRITE QUEUE: Auftrag eingereiht (${this.jobs.length} wartend)`
            );

            this.process();

        });

    }

    async process() {

        if (this.running || this.stopped) {
            return;
        }

        this.running = true;

        try {

            while (!this.stopped && this.jobs.length > 0) {

                const job = this.jobs.shift();

                try {

                    const result = await this.writer.write(
                        job.stateId,
                        job.value
                    );

                    job.resolve(result);

                } catch (error) {

                    job.reject(error);

                }

            }

        } finally {

            this.running = false;

            // A job may have been added while the processor was winding down.
            if (!this.stopped && this.jobs.length > 0) {
                this.process();
            }

        }

    }

    stop() {

        this.stopped = true;

        const error = new Error('WriteQueue wurde gestoppt.');

        while (this.jobs.length > 0) {
            this.jobs.shift().reject(error);
        }

    }

}

module.exports = WriteQueue;
