export type CircuitBreakerOptions = {
    openBreakerTimeoutInMs?: number,
    closedBreakerTimeoutInMs?: number,
    minFailedRequestThreshold?: number,
    percentageFailedRequestThreshold?: number
};

enum CircuitBreakerState {
    OPENED = "OPENED",
    CLOSED = "CLOSED",
    HALF = "HALF"
}

export class CircuitBreaker<Payload> {
    options: Required<CircuitBreakerOptions>
    state = CircuitBreakerState.OPENED
    tryTriggerFromCloseAt: number | undefined = undefined;
    finishHalfStateAt: number | undefined = undefined;
    failCount = 0;
    successCount = 0;

    constructor(
        private request: (...args: any[]) => Promise<Payload>,
        opts?: CircuitBreakerOptions
    ) {
        this.options = {
            openBreakerTimeoutInMs: opts?.openBreakerTimeoutInMs || 10000,
            closedBreakerTimeoutInMs: opts?.closedBreakerTimeoutInMs || 5000,
            minFailedRequestThreshold: opts?.minFailedRequestThreshold || 15,
            percentageFailedRequestThreshold: opts?.percentageFailedRequestThreshold || 50
        }
    }

    private resetStatisticCounting() {
        this.successCount = 0;
        this.failCount = 0;
        this.finishHalfStateAt = undefined;
    }

    public async requestInvocation(...args: any[]) {
        if(this.state === CircuitBreakerState.CLOSED && (Date.now() < this.tryTriggerFromCloseAt!)) {
            throw new Error('Breaker is closed')
        }
        try {
            const response = await this.request(args);
            return this.successRequest(response)
        } catch (e) {
            return this.failedRequest(e, args);
        }
    }
    
    private async successRequest(response: Payload) {
        if(this.state === CircuitBreakerState.HALF) {
            this.successCount += 1;

            if(Date.now() >= this.finishHalfStateAt!) {
                this.state = CircuitBreakerState.OPENED;
                this.resetStatisticCounting;
            }
        }

        if(this.state === CircuitBreakerState.CLOSED) {
            this.state = CircuitBreakerState.OPENED;
            this.resetStatisticCounting;
        }

        return response
    }
    
    private async failedRequest(e: any, args: any[]) {
        if(this.state === CircuitBreakerState.CLOSED) {
            this.tryTriggerFromCloseAt = Date.now() + this.options.closedBreakerTimeoutInMs;
            return e;
        }

        if(this.state === CircuitBreakerState.OPENED) {
            this.failCount = 1;
            this.state = CircuitBreakerState.HALF
            this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
            return e
        }

        if(this.state === CircuitBreakerState.HALF) {
            this.failCount += 1;

            if(Date.now() > this.finishHalfStateAt!) {
                this.resetStatisticCounting;
                this.failCount = 1;
                this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
                return e
            }

            if(this.failCount >= this.options.minFailedRequestThreshold) {
                const failRate = this.failCount * 100 / (this.failCount + this.successCount);

                if(failRate >= this.options.percentageFailedRequestThreshold) {
                    this.state = CircuitBreakerState.CLOSED;
                    this.resetStatisticCounting;
                    this.tryTriggerFromCloseAt = Date.now() + this.options.closedBreakerTimeoutInMs;
                    return e
                }

                this.resetStatisticCounting;
                this.failCount = 1;
                this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
                return e;
            }
        }
    }
}
