// const keccak256 = require('keccak256');
var Election = artifacts.require("./Election.sol");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

contract("Election", function(accounts) {
    var electionInstance;
    var committee;
    var voter1;
    var voter2;

    beforeEach(async function () {
        electionInstance = await Election.deployed();
        committee = accounts[0]
        voter1 = accounts[1];
        voter2 = accounts[2];
        voter3 = accounts[3];
        voter4 = accounts[4];
    });

    // passes
    it("Correct Election Initialization", async function () {
        assert.ok(electionInstance.isCandidate(web3.utils.asciiToHex("John Jay")));
        assert.equal(await electionInstance.getElectionName(), "Columbia President Election");
        assert.equal((await electionInstance.getEndTime()).toNumber(), 1674035350);
        assert.equal(await electionInstance.getCommitteeAddr(), committee);
    });

    it("Correct Pending Registrations", async function () {
        await electionInstance.registerVoter({from: voter1});
        try {
            await electionInstance.registerVoter({from: voter1});
        } catch(err) {
            assert.include(err.message, "revert", "Already registered");
        }

        await electionInstance.registerVoter({from: voter2});
        assert.ok(!(await electionInstance.getStatus({ from: voter1 })))
        assert.ok(!(await electionInstance.getStatus({ from: voter2 })))
    });

    it("Only Committee Can Approve Registrations", async function () {
        try {
            await electionInstance.approveRegistration(voter1, {from: voter1});
        } catch(err) {
            assert.include(err.message, "revert", "Wrong permissions");
        }
        await electionInstance.approveRegistration(voter1, {from: committee});
        assert.ok(electionInstance.getStatus({from: voter1}));
    });

    // make sure to check deploy endTime for these
    it("Unapproved Voter Can't Vote", async function () {
        const hash = web3.utils.asciiToHex("keccak256");
        try {
            await electionInstance.vote(hash, {from: voter2});
        } catch(err) {
            assert.include(err.message, "revert", "Not approved");
        }
    });

    it("Approved Voter Can Vote", async function () {
        await electionInstance.approveRegistration(voter2, {from: committee});
        // const hash1 = web3.utils.asciiToHex("Roaree Lion");
        const hash1 = web3.utils.soliditySha3(
            web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [
                web3.utils.asciiToHex("Roaree Lion"), web3.utils.asciiToHex("mySalt")
            ]));
        // const hash2 = web3.utils.asciiToHex("John Jay");
        const hash2 = web3.utils.soliditySha3(
            web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [
                web3.utils.asciiToHex("John Jay"), web3.utils.asciiToHex("mySalt")
            ]));
        await electionInstance.vote(hash1, {from: voter1});
        await electionInstance.vote(hash2, {from: voter2});
    });

    it("Cannot Double Vote", async function () {
        const hash = web3.utils.asciiToHex("keccak256");
        try {
            await electionInstance.vote(hash, {from: voter1});
        } catch(err) {
            assert.include(err.message, "revert", "Cannot double vote");
        }
    });

    it("Cannot Vote or Reveal at Wrong Time", async function () {
        const hash = web3.utils.asciiToHex("keccak256");
        const hash1 = web3.utils.soliditySha3(
            web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [
                web3.utils.asciiToHex("Roaree Lion"), web3.utils.asciiToHex("mySalt")
            ]));
        await electionInstance.registerVoter({from: voter3});
        await electionInstance.approveRegistration(voter3, {from: committee});
        await electionInstance.vote(hash1, {from: voter3});
        try {
            await electionInstance.revealVote(
                web3.utils.asciiToHex("Roaree Lion"), 
                web3.utils.asciiToHex("mySalt"), 
                {from: voter3}
                );
        } catch(err) {
            assert.include(err.message, "revert", "Wrong Time");
        }

        await electionInstance.registerVoter({from: voter4});
        await electionInstance.approveRegistration(voter4, {from: committee});

        console.log("waiting until election over   ");
        await sleep(30000);
        try {
            await electionInstance.vote(hash, {from: voter4});
        } catch(err) {
            assert.include(err.message, "revert", "Wrong Time");
        }
    });

    // it("Hashed and Revealed Vote Equal", async function () {

    // });

    it("Correct Winner Determined", async function () {
        // voter1 reveal
        await electionInstance.revealVote(
            web3.utils.asciiToHex("Roaree Lion"), 
            web3.utils.asciiToHex("mySalt"), 
            {from: voter1}
            );

        // voter2 reveal
        await electionInstance.revealVote(
            web3.utils.asciiToHex("John Jay"), 
            web3.utils.asciiToHex("mySalt"), 
            {from: voter2}
            );

        // voter3 reveal
        await electionInstance.revealVote(
            web3.utils.asciiToHex("Roaree Lion"), 
            web3.utils.asciiToHex("mySalt"), 
            {from: voter3}
            );

        assert.equal(await electionInstance.getVotesRevealed(), 3);

        console.log("waiting until reveal period over   ");
        await sleep(60000);
        assert.equal(await electionInstance.calcWinner(), 0);
    });
});