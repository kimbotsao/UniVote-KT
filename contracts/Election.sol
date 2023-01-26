// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract Election {

    struct Candidate {
        bytes32 name;
        uint256 voteCount;
    }

    struct Voter { 
        bool reg;
        bool voted;
        // uint256 vote;
    }

    address public committee;
    string public electionName;

    uint256 public beginTime;
    uint256 public endTime;
    uint256 public revealTime;
    uint256 public revealDuration;

    mapping (address => bytes32) secretVotes;
    uint public votesReceived;
    mapping (address => bool) voteRevealed;
    uint public votesRevealed;

    Candidate[] public candidates;
    address[] public pendings;
    mapping(address => Voter) public voters;

    // event Voted(uint256 vote);

    constructor(string memory _electionName, uint256 _endTime, uint256 _revealDuration) {
        committee = msg.sender;
        // hard code address for debugging
        // committee = 0x07Dce7e6B141cEDf8816dF0C22Adf4b7A83f8b8A;
        beginTime = block.timestamp;
        endTime = _endTime;
        revealTime = endTime + _revealDuration;
        electionName = _electionName;

        // hard code candidates
        bytes32[5] memory candidateNames = [bytes32("Roaree Lion"), bytes32("Shih-Fu Chang"), bytes32("Junfeng Yang"), bytes32("Chef Mike"), bytes32("John Jay")];

        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                name: candidateNames[i],
                voteCount: 0
            }));
        }
    }

    function getEndTime() public view returns(uint256 t) {
        return endTime;
    }

    function getRevealTime() public view returns(uint256 t) {
        return revealTime;
    }

    function getElectionName() public view returns(string memory n) {
        return electionName;
    }

    function getCommitteeAddr() public view returns(address c) {
        return committee;
    }

    function getVotesRevealed() public view returns(uint256 v) {
        return votesRevealed;
    }

    function alreadyRegistered(address voter) public view returns(bool ret) {
        for (uint i = 0; i < pendings.length; i++) {
            if (pendings[i] == voter) {
                return true;
            }
        }
        return false;
    }

    // submit registration for an election
    // done by voter
    function registerVoter() external {
        require(!alreadyRegistered(msg.sender), "Already submitted registration");
        pendings.push(msg.sender);
        voters[msg.sender].reg = false;
    }

    // get voter registration status
    function getStatus() public view returns (bool status) {
        return voters[msg.sender].reg;
    }

    // get pending registrations
    // only called by committee
    function getPending() public view returns (address[] memory ps) {
        require(msg.sender == committee, "Only committe can view pending");
        return pendings;
    }

    // approve a voter registration
    function approveRegistration(address voter) external {
        require(msg.sender == committee, "Only committee can approve registrations");
        require(!voters[voter].voted, "Voter has already voted");
        voters[voter].reg = true;
    }

    // confirm choice is a registered candidate
    function isCandidate(bytes32 candidate) public view returns (bool) {
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].name == candidate) {
                return true;
            }
        }
        return false;
    }

    // increase candidate vote count
    function increment(bytes32 candidate) public {
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].name == candidate) {
                candidates[i].voteCount += 1;
            }
        }
    }

    // submit vote during election time period
    function vote(bytes32 _hash) external {
        Voter storage v = voters[msg.sender];
        require(!v.voted, "You already voted in this election");
        require(v.reg, "You have not been approved to vote");
        require(block.timestamp <= endTime && block.timestamp >= beginTime, "Election Over");

        v.voted = true;
        secretVotes[msg.sender] = _hash;
        votesReceived++;
    }

    // reveal vote during reveal period
    function revealVote(bytes32 _candidate, bytes32 _salt) external {
        Voter storage v = voters[msg.sender];
        require(block.timestamp >= endTime && block.timestamp <= revealTime, "This is not the reveal period");
        require(v.voted, "Voter did not vote");
        require(!voteRevealed[msg.sender], "Vote has already been revealed");
        require(isCandidate(_candidate), "Not a valid candidate");

        bytes32 voteHash = keccak256(abi.encode(_candidate, _salt));

        require(voteHash == secretVotes[msg.sender], "vote revealed does not match secret vote");

        // candidates[_candidate].voteCount += 1;
        increment(_candidate);
        voteRevealed[msg.sender] = true;
        votesRevealed++;
    }

    // calculates winner
    function calcWinner() public view
            returns (uint256 winner_)
    {
        require(block.timestamp > revealTime, "Reveal period has not passed");
        uint winningVoteCount = 0;
        for (uint c = 0; c < candidates.length; c++) {
            if (candidates[c].voteCount > winningVoteCount) {
                winningVoteCount = candidates[c].voteCount;
                winner_ = c;
            }
        }
    }

    function getName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = candidates[calcWinner()].name;
    }
}