App = {
    web3Provider: null,
    contracts: {},
    committee: '0x0',
    voters: [],
  
    init: async function() {
      // Load users.
      // Preload voter and commission accounts 
      $.getJSON('../accounts.json', function(data) {
        for (i = 0; i < data.length; i ++) {
          if (data[i].role == "commission") {
            App.committee = data[i].address;
          }
          else if (data[i].role == "voter") {
            App.voters[data[i].idx] = data[i].address;
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
    
        // Preliminary Action?
        // Person should have logged in by now with Metamask

      }).done(function() {
        return App.render();
      });
      // return App.render();
    },

    /* FUNCTIONS FOR RENDERING UI */
    render: function() {
        var electionInstance;

        // Load account data (for now wallet addr)
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
              console.log(error);
            }
      
            var account = accounts[0];
            $("#wallet-addr").html(account);
        });

        // Load contract data (for now end time)
        App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;
            // this call is returning Internal JSON RPC error
            return electionInstance.getEndTime.call();
        }).then(function(et) {
            // Set end time in html
            $("#endtime").html(et.toNumber());
        }).catch(function(err) {
            console.log(err.message);
        });

        // Load candidates into voting UI
        // var candidates = []
        
    }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});