App = {
    web3Provider: null,
    contracts: {},
    committee: '0x0',
    voters: [],
  
    init: async function() {
      // Preload voter and commission accounts 
      $.getJSON('../accounts.json', function(data) {
        for (i = 0; i < data.length; i ++) {
          if (data[i].role == "commission") {
            App.committee = data[i].address.toLowerCase();
          }
          else if (data[i].role == "voter") {
            App.voters[data[i].idx] = data[i].address.toLowerCase();
          }
        }
      });
  
      return await App.initWeb3();
    },
  
    initWeb3: async function() {
    // Modern dapp browsers...
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        try {
          // Request account access
          await window.ethereum.enable();
        } catch (error) {
          // User denied account access...
          console.error("User denied account access")
        }   
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      web3 = new Web3(App.web3Provider);
  
      return App.initContract();
    },
  
    initContract: function() {
      $.getJSON('Election.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
        var ElectionArtifact = data;
        App.contracts.Election = TruffleContract(ElectionArtifact);
    
        // Set the provider for our contract
        App.contracts.Election.setProvider(App.web3Provider);

      }).done(function() {
        return App.render();
      });
    },

    /* FUNCTIONS FOR RENDERING UI */
    render: function() {
        var electionInstance;

        // Load account data
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
              console.log(error);
            }
      
            var account = accounts[0];
            $("#wallet-addr").html(account);

            var vView = $("#electionUI");
            var cView = $("#regUI");

            // Show components based on account
            if (account == App.committee) {
              cView.show();
              vView.hide();
            }
            else if (App.voters.includes(account)) {
              var statPend;
              var statReg;
              var statHTML; 
              
              vView.show();
              cView.hide();

              // Set Status
              App.contracts.Election.deployed().then(function(instance) {
                electionInstance = instance;
                return electionInstance.alreadyRegistered.call(account);
                // statPend = electionInstance.alreadyRegistered.call(account);
              }).then(function(retPend) {
                statPend = retPend;
                // statReg = electionInstance.getStatus.call();
              }).then(function() {
                return electionInstance.getStatus.call();
              }).then(function(retReg) {
                statReg = retReg;
              }).then(function() {
                if (statPend == false) {
                  return "Not Registered";
                }
                else if (statPend == true) {
                  if (statReg == true) {
                    return "Registration Approved";
                  }
                  return "Pending Approval";
                }
              }).then(function(stat) {
                  $("#vstatus").html(stat);
              }).catch(function(err) {
                  console.log(err.message);
              });
            }
        });

        // Load contract data
        App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;

            return electionInstance.getEndTime.call();
        }).then(function(et) {
            $("#endtime").html(et.toNumber());
        }).catch(function(err) {
            console.log(err.message);
        });
        
    }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});