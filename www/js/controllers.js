var voiceActive = true;
var bluetoothActive = true;

/*
Helper Functions
*/
sayString = function(word, WordStats) {
  if (true) {
    if (window.TTS != undefined) {
      console.log("trying to say " + word);
      window.TTS
      .speak({
        text: word,
        locale: 'en-US',
        rate: 1.25
      }, function () {
        console.log('TTS success.');
      }, function (reason) {
        console.log('TTS fail.');
      });
    } else {
      console.log("Unable to find Text to speech plugin");
    }
  }
  if(WordStats != undefined){
    //WordStats.incrementWord(word);
  }
};



angular.module('articulate.controllers', []).controller('SettingsCtrl', function($scope, Config, Button) {
  button_types = ["button-light",
  "button-stable",
  "button-positive",
  "button-calm",
  "button-balanced",
  "button-energized",
  "button-assertive",
  "button-royal",
  "button-dark"];

  toggle_buttons = [["Toggle Voice", "toggleVoice"]];

  settings_list = [["Non-Selected Key Style", "wordButtons"], ["Selected Key Style", "columnButtons"]];

  $scope.settings = [];
  for (var i = 0; i < settings_list.length; i++){
    setting_object = {
      "human_name" : settings_list[i][0],
      "machine_name": settings_list[i][1],
      "button_types": button_types
    };
    $scope.settings.push(setting_object);
  }


  $scope.toggles = [];
  for(var i = 0; i < toggle_buttons.length; i++){
    defaultvalue = Config.getSettingFromLocalStorage(toggle_buttons[i][1]);
    if(defaultvalue === undefined){
      Config.saveSettingToLocalStorage(toggle_buttons[i][1], true);
      defaultvalue = true;
    }
    toggle_object = {
      "name" : toggle_buttons[i][0],
      "machine_name" : toggle_buttons[i][1],
      "button_class" : defaultvalue == "true" ? "button-balanced" : "button-assertive"
    }
    $scope.toggles.push(toggle_object);
  }

  $scope.changeButtonStyle = function(config_name, button_style) {
    // Save to local storage
    console.log(config_name)
    console.log(button_style)
    Config.saveSettingToLocalStorage(config_name, button_style);
    Config.loadSettings();
  };

  $scope.toggleValue = function(button_name) {

    //retrieve the previous default value
    defaultvalue = Config.getSettingFromLocalStorage(button_name);

    //connect with the button on the UI
    button = document.getElementById(button_name);

    //if it was true, set it to false and change the button color
    if(defaultvalue === "true"){
      Config.saveSettingToLocalStorage(button_name, false);
      button.setAttribute("class", "button button-assertive toggle_button");
    }

    //otherwise set it to true and change the button color
    else{
      Config.saveSettingToLocalStorage(button_name, true);
      button.setAttribute("class", "button button-balanced toggle_button");
    }
  };
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


.controller('DashCtrl',function($scope, $ionicPopup, Button, Config, WordStats, Utility) {

  var populateList = function(str) {
    console.log("called")
    console.log(str)
    $scope.words = [];

    Button.setWords();
    theWords = Button.words;
    for(var i = 0; i < theWords.length; i++){
      var keyMaps = Utility.setPianoKeys(i);
      if(theWords[i].substring(0, str.length) === str){
        var jsonWord = {
          "word" : theWords[i],
          "id": 'button_' + i.toString(),
          "ng-click": "",
          "first_key_class": keyMaps[0] ? Config.wordButtons : Config.columnButtons,
          "second_key_class": keyMaps[1] ? Config.wordButtons : Config.columnButtons,
          "third_key_class": keyMaps[2] ? Config.wordButtons : Config.columnButtons,
          "fourth_key_class": keyMaps[3] ? Config.wordButtons : Config.columnButtons,
          "fifth_key_class": keyMaps[4] ? Config.wordButtons : Config.columnButtons
        };
        $scope.words.push(jsonWord);
      }
    }

  };

$scope.$on('$ionicView.enter', function() {
  $scope.words = [];
  Button.setWords();
  theWords = Button.words;
  for(var i = 0; i < theWords.length; i++){
    var keyMaps = Utility.setPianoKeys(i);
      var jsonWord = {
        "word" : theWords[i],
        "id": 'button_' + i.toString(),
        "ng-click": "",
        "first_key_class": keyMaps[0] ? Config.wordButtons : Config.columnButtons,
        "second_key_class": keyMaps[1] ? Config.wordButtons : Config.columnButtons,
        "third_key_class": keyMaps[2] ? Config.wordButtons : Config.columnButtons,
        "fourth_key_class": keyMaps[3] ? Config.wordButtons : Config.columnButtons,
        "fifth_key_class": keyMaps[4] ? Config.wordButtons : Config.columnButtons
      };
      $scope.words.push(jsonWord);
  }

});

$scope.filterList = function(event){
  var str = event.target.value;
  console.log(str)
  populateList(str);
};




// Popup handler for updating words.
$scope.showPopup = function (event) {

  console.log(event.target)
  console.log(event.target.getAttribute("value"))
  console.log(event.target.id)

  // Keep scope
  $scope.data = {};

  // Log these for later use when we reassign word in word array
  $scope.data.current_button_index = event.target.id.replace("button_", "");
  $scope.data.current_button = event.target;

  var myPopup = $ionicPopup.show({
    template: '<input ng-model="data.new_word" type="text" placeholder="New Word">',
    title: 'Change Button Words',
    subTitle: 'Current word: ' + event.target.getAttribute("value"),
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

  myPopup.then(function (res) {
    // Check if there is an update
    if (res.data.new_word) {
      // Change word to new word and save to local storage for later use.
      Button.words[res.data.current_button_index] = res.data.new_word;

      // Update button value
      res.data.current_button.setAttribute('value', Button.words[res.data.current_button_index]);
      document.getElementById("head_" + res.data.current_button.id).innerHTML = Button.words[res.data.current_button_index];
      Button.saveWordsToLocalStorage(Button.words);
      if (!Button.showingAllColumns) {
        Button.updateWordLabels(Button.current_k);
      }
      sayString(res.data.new_word, WordStats);
    }
    else {
      // Log a cancellation.
      console.log("No word supplied.")
    }
  });
}
})

.controller('WordStatsCtrl', function($scope, BLE, WordStats) {

  $scope.$on('$ionicView.enter', function() {
    $scope.words = [];

    wordsDict = WordStats.getWords();

    // Create items array
    var items = Object.keys(wordsDict).map(function(key) {
      return [key, wordsDict[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });

    // Create a new array with only the first 5 items
    console.log(items.slice(0, 5));

    var thetop = items.slice(0, 5);
    var max = 10;
    for(var i = 0; i < thetop.length; i++){
      if(i === 0){
        max = thetop[i][1];
      }
      var entry = {
        "word" : thetop[i][0],
        "count" : thetop[i][1],
        "max" : max
      }
      $scope.words.push(entry);
    }
  });
})

.controller('BLEDetailCtrl', function($scope, $stateParams, Button, BLE, WordStats) {

  BLE.connect($stateParams.deviceId).then(
    function(peripheral) {
      BLE.subscribe($stateParams.deviceId, function(data){
        sayString(Button.words[data], WordStats);
      });
      //$scope.device = peripheral;
    }
  );
});
