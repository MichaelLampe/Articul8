var showingAllColumns = true;
var voiceActive = true;
var bluetoothActive = true;

// Basic constants
// TODO: Define these colors and properties in css classes that we add and remove.
var dropdownSelectedButtonColor = "#32CD32";
var buttonColor = "#d9d9d9";
var lastindex = -1;
var default_words = [
  "want","ipad","help","love","colors","yes","no","bath",
  "school","read","hug","brush teeth", "ball","music","potty","up",
  "snack","sing","alphabet","walk","milk","mama","daddy","go",
  "car","numbers","more","blanket","stop", "", ""
];
// Word labels
// Global variables
var words;
var current_k;

/*
Highlight designate words
*/
highlightWord = function(){
  var menu = document.getElementById('select_menu');
  var button = document.getElementById('button_' + menu.selectedIndex.toString());
  button.setAttribute('class','highlight_key');
};



displayWordLabels = function() {
  document.getElementById("word_labels").classList.remove("hidden-word-labels");
  document.getElementById("word_labels").classList.add("show-word-labels");
};

hideWordLabels = function() {
  document.getElementById("word_labels").classList.add("hidden-word-labels");
  document.getElementById("word_labels").classList.remove("show-word-labels");
};

/*
TODO REIMPLEMENT
toggleVoiceActive = function(){
voiceActive = !voiceActive;
voice_active = document.getElementById("voice-active");
if (voiceActive){
voice_active.style.background = "green";
} else {
voice_active.style.background = "red";
}
};
*/



/*
Helper Functions
*/
saveWordsToLocalStorage = function(words){
  window.localStorage['words'] = words.toString();
};

sayString = function(word) {
  if (true) {
    if (window.TTS != undefined) {
      console.log("trying to say " + word);
      console.log(window.TTS);
      window.TTS
      .speak({
        text: word,
        locale: 'en-US',
        rate: 1.25
      }, function () {
          alert('success');
      }, function (reason) {
          alert(reason);
      });
    } else {
      console.log("Unable to find Text to speech plugin");
    }
  }
};



angular.module('articulate.controllers', []).controller('SettingsCtrl', function($scope) {
  console.log("Loaded settings controller");
})

.controller('BLECtrl', function($scope, BLE) {
  // keep a reference since devices will be added
  $scope.devices = BLE.devices;

  var success = function () {
    if ($scope.devices.length < 1) {
      // a better solution would be to update a status message rather than an alert
      alert("Didn't find any Bluetooth Low Energy devices.");
    }
  };

  var failure = function (error) {
    alert(error);
  };

  // pull to refresh
  $scope.onRefresh = function() {
    BLE.scan().then(
      success, failure
    ).finally(
      function() {
        $scope.$broadcast('scroll.refreshComplete');
      }
    )
  };

  // initial scan
  BLE.scan().then(success, failure);
})

.controller('BLEDetailCtrl', function($scope, $stateParams, BLE) {
  BLE.connect($stateParams.deviceId).then(
    function(peripheral) {
      console.log("first function");
      $scope.device = peripheral;
    }
  );
})


.controller('DashCtrl',function($scope, $ionicPopup, $timeout, $compile) {
  // Containers for buttons, 4 columns
  var c1 = document.getElementById("l_button_container");
  var c2 = document.getElementById("ml_button_container");
  var c3 = document.getElementById("mr_button_container");
  var c4 = document.getElementById("r_button_container");
  var buttonContainers = [c1, c2, c3, c4];

  // Check for words in local storage, otherwise use defaults.
  if(window.localStorage['words'] === undefined){
    console.log("Loading default word list");
    saveWordsToLocalStorage(default_words);
  }
  words = window.localStorage['words'].split(",");
  var word_labels = [];
  for (i = 0; i < 8; i++){
    word_label = document.getElementById("word_label_" + String(i));
    word_labels.push(word_label)
  }

  /*
  Word labels
  */
  modifyWordLabels = function(column) {
    start = 8*column;
    var fudge = 0;
    if (column === 3){
      fudge = 1;
      word_labels[0].innerHTML = "";
    }

    for (i = start + fudge; i < start+8; i++){
      message = words[i-fudge];
      if (words[i-fudge] == undefined) {
        message = "";
      }

      word_labels[i - start].innerHTML = message;
    }
  };

  /*
  Buttons
  */

  for (var i = 0; i < 31; i++){
    // Create a given button
    var button = document.createElement('button');
    button.setAttribute('class', 'key');
    button.setAttribute('id', 'button_' + i.toString());
    button.setAttribute('value', words[i]);
    button.setAttribute('ng-click', "showPopup($event)");
    button.style.background = buttonColor;

    // Recompile so ng-click update registers.
    $compile(button) ($scope);

    // Append to the correct div
    buttonContainers[Math.floor(i / 8)].appendChild(button);
  }

  /*
  Display word drawers
  */
  displayWordsColumn = function(keep) {
    k = parseInt(keep);

    if (showingAllColumns){
      displayWordLabels();
      current_k = k;
    } else {
      hideWordLabels();
    }

    // Switch word labels to correct values
    modifyWordLabels(k);
    for (i = 0; i < 4; i++) {

      // Add or remove all but the column that signaled.
      if (i !== k) {
        if (showingAllColumns) {
          buttonContainers[i].classList.add("hidden-button-container");
        } else
        {
          buttonContainers[i].classList.remove("hidden-button-container");
        }
      }
    }

    // Invert showing
    showingAllColumns = !showingAllColumns;
  };

  // Button action on click
  $scope.showPopup = function($event) {
    // Keep scope
    $scope.data = {};

    // Log these for later use when we reassign word in word array
    $scope.data.current_button_index = $event.currentTarget.id.replace("button_", "");
    $scope.data.current_button = $event.currentTarget;

    var myPopup = $ionicPopup.show({
      template: '<input ng-model="data.new_word" type="text" placeholder="New Word">',
      title: 'Change Button Words',
      subTitle: 'Current word: ' + $event.currentTarget.value,
      scope: $scope,
      buttons: [
        {
          text: '<b>Finished</b>',
          onTap: function (e) {
            return $scope;
          }
        }
      ]
    });

    myPopup.then(function(res) {
      // Check if there is an update
      if (res.data.new_word) {
        // Change word to new word and save to local storage for later use.
        words[res.data.current_button_index] = res.data.new_word;

        // Update button value
        res.data.current_button.setAttribute('value', words[res.data.current_button_index]);
        saveWordsToLocalStorage(words);
        if (!showingAllColumns) {
          modifyWordLabels(current_k);
        }
        sayString(res.data.new_word);
      } else{
        // Log a cancellation.
        console.log("No word supplied.")
      }
    });
  };
})

.controller('BLEDetailCtrl', function($scope, $stateParams, BLE) {
  BLE.connect($stateParams.deviceId).then(
    function(peripheral) {
      BLE.subscribe($stateParams.deviceId, function(data){
        console.log("it returned " + data);
        sayString(words[data]);
      });
      //$scope.device = peripheral;
    }
  );
})
