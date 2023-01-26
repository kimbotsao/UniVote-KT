App = {
    web3Provider: null,
    contracts: {},
    committee: '0x0',
    voters: [],
    endtime: null,
    revealtime: null,
    endLeft: null,
    revLeft: null,
  
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
        console.log("new web3 version");
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
        console.log("legacy version");
        App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        console.log("fall back version");
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
        console.log(web3.version);
        // Load account data
        web3.eth.getAccounts(function(error, accounts) {
            console.log("in getaccounts call");
            if (error) {
              console.log(error);
            }
      
            var account = accounts[0].toLowerCase();
            web3.eth.defaultAccount = account;
            $("#wallet-addr").html(account);
            console.log("acc set in render" + account);

            var vView = $("#electionUI");
            var cView = $("#regUI");

            // Show components based on account
            if (account == App.committee) {
              cView.show();
              vView.hide();

              // Get Pending
              App.loadPending();
            }
            else if (App.voters.includes(account)) {          
              vView.show();
              cView.hide();

              // Set Status
              App.updateStatus();
            }
        });

        // Load contract data
        App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;

            return electionInstance.getEndTime.call();
        }).then(function(et) {
            App.endtime = et.toNumber();
            $("#endtime").html(App.endtime);
        }).catch(function(err) {
            console.log(err.message);
        });

        App.contracts.Election.deployed().then(function(instance) {
          electionInstance = instance;

          return electionInstance.getRevealTime.call();
        }).then(function(rt) {
            App.revealtime = rt.toNumber();
            console.log("rev time" + App.revealtime);
        }).catch(function(err) {
            console.log(err.message);
        });

        // Test committee address not hard coded
        App.contracts.Election.deployed().then(function(instance) {
          electionInstance = instance;

          return electionInstance.getCommitteeAddr.call();
        }).then(function(ad) {
            console.log("committee addr " + ad);
        }).catch(function(err) {
            console.log(err.message);
        });
        
        // Button handling
        $("#btn-reg").click(async function() {
          App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;
            // electionInstance.registerVoter({from: $("#wallet-addr").val()});
            electionInstance.registerVoter({from:web3.eth.defaultAccount});
            // return electionInstance.getEndTime.call();
          }).then(function() {
              console.log("register called");
              App.updateStatus();
          }).catch(function(err) {
              console.log(err.message);
          });
        });

        $("#btn-submit-vote").click(async function() {
          // TIME CONTROL : before election EndTime
          await App.getElectionDuration();
          if (App.endLeft == 0){
            alert("The voting period has ended.");
          }
          else {
            // STATUS CONTROL : must be Registration Approved
            var status = $('#vstatus').html();
            if (status != "Registration Approved") {
              alert("You are not approved to vote in this election yet.");
            }
            else if (status == "Registration Approved") {
              // get selected radio
              var vote;
              var ele = document.getElementsByName('voteRadios'); 
              for(i = 0; i < ele.length; i++) {
                  if(ele[i].checked) {
                    vote = ele[i].value;
                  }
              }
              console.log(vote);
              // get salt input value
              var salt = document.getElementById('voteSalt').value;
              console.log(salt);
              console.log(web3.version);
              // hash vote and salt
              var secretHash = web3.utils.soliditySha3(
                web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [
                    web3.utils.asciiToHex(vote), web3.utils.asciiToHex(salt)
                ]));
              console.log(secretHash);
              // App.contracts.Election.deployed().then(function(instance) {
              //   electionInstance = instance;
              //   electionInstance.vote(secretHash, {from:web3.eth.defaultAccount});
              // }).catch(function(err) {
              //   console.log(err.message);
              // });
              
              // CLEAR FORM
              document.getElementById('vote-form').reset();

            }
          }  
        });

        $(document).on("click", ".btn-app", function(){
          // Get corresponding address
          var atts = $(event.target).attr("class").slice(-2);
          var reg_addr = $('[name="voter-addr"][class="'+atts+'"]').html();
          // Call approveRegistration
          console.log("registered addr" + reg_addr);
          App.contracts.Election.deployed().then(function(instance) {
            electionInstance = instance;
            electionInstance.approveRegistration(reg_addr, {from:web3.eth.defaultAccount});
          }).catch(function(err) {
            console.log(err.message);
          });

          // GREY OUT BUTTON OR SHOW APPROVAL
        });
    },

    getElectionDuration: async function() {
      var d = new Date();
      var curr = Math.floor(d.getTime()/ 1000);
      App.endLeft = Math.max(0, App.endtime - curr);
    },

    getRevealDuration: async function() {
      var d = new Date();
      var curr = Math.floor(d.getTime()/ 1000);
      App.revLeft = Math.max(0, App.revealtime - curr);
    },

    updateStatus: function() {
      var electionInstance;
      var statPend;
      var statReg;

      App.contracts.Election.deployed().then(function(instance) {
        electionInstance = instance;
        console.log("before already reg");
        // return electionInstance.alreadyRegistered.call($("#wallet-addr").val());
        return electionInstance.alreadyRegistered.call(web3.eth.defaultAccount);
        // statPend = electionInstance.alreadyRegistered.call(account);
      }).then(function(retPend) {
        console.log("before statPend");
        console.log(retPend);
        statPend = retPend;
        // statReg = electionInstance.getStatus.call();
      }).then(function() {
        console.log("before getStatus");
        return electionInstance.getStatus.call({from:web3.eth.defaultAccount});
      }).then(function(retReg) {
        console.log(retReg);
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
    },

    loadPending: function() {
      App.contracts.Election.deployed().then(function(instance) {
        electionInstance = instance;

        return electionInstance.getPending.call();
      }).then(function(pendings) {
          var table_html = '';
          for (i=0; i<pendings.length; i++) {
            //create html table row
            table_html += '<tr>';         
            table_html += '<td name="voter-addr" class="' + 'v' + String(i) + '">' + pendings[i] + '</td>';
            table_html += '<td><button type="button" class="btn btn-primary btn-sm btn-app ' + 'v' + String(i) + '">' + 'Approve</button></td>';
            table_html += '</tr>';
          }
          console.log(table_html);
          $( "#pendings" ).append(  table_html );
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