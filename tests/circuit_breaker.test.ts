import { CircuitBreaker } from "../src/circuit_breaker";
import assert from "assert"

describe('Circuit Breaker', function() {
  
  describe('successRequest', function() {
    it('should return response of CB state', function() {

      const request = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (Math.random() > .6) {
                resolve( "Success")
            } else {
                reject( "Failed")
            }
        });
      }

      const breaker = new CircuitBreaker(request, { minFailedRequestThreshold: 2 })

      return breaker.requestInvocation()
        .then(result => assert.equal(result, 'Success'))
    });
  });

});