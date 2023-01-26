var Election = artifacts.require("./Election.sol");

module.exports = function(deployer) {
  deployer.deploy(Election, "Columbia President Election", 1674758591, 300);
};