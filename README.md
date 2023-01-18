# UniVote

Kimberly Tsao (kt2803), Thomas Lim (tl2977)

UniVote is a secure, on-chain voting dApp that works to make voting on small and large scales more accessible and secure. 

## Testing
To test, clone the git repository and ensure that Truffle Suite is installed. Note that for tests to execute properly, the ```endTime``` parameter in ```2_deploy_contracts.js``` and ```election_test.js``` must be reconfigured according to current UTC time. Also adjust the millisecond parameter to the ```sleep(ms)``` function in the test file according to execution time on your device.

First compile the contract using ```truffle compile```then run tests with ```truffle test```

Here are the results for our testing:
![Test Results](TestResults.png)