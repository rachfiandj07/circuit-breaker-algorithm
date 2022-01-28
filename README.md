# Circuit Breaker Algorithm

## Introduction
The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all.

## Author Reason
This solution was created for invoking not-only in Microservices Infrastructure, this Algorithm one of solution to handle Error when Multi-Threaded is feel tired to handle many request and vice versa

## How to Install
```npm i --save```

## How to Run
```npm start```

## How to Run Test
```npm test```
