var voiceActive = true;
var bluetoothActive = true;




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

sayString = function(word) {
    // https://forum.ionicframework.com/t/problems-with-text-to-speech/31927
    if (voiceActive) {
        if (window.TTS != undefined) {
            window.TTS
                .speak({
                    text: word,
                    locale: 'en-US',
                    rate: 1.25
                });
        } else {
            console.log("Unable to find Text to speech plugin");
        }
    }
};



angular.module('articulate.controllers', []).controller('SettingsCtrl', function($scope) {
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
          $scope.device = peripheral;
      }
  );
})








.controller('DashCtrl',function($scope, $ionicPopup, Button, Config) {
    Config.loadSettings();
    // Setup
    Button.setup($scope);

    // Handler for collapsing columns
    displayWordsColumn = function(column_to_keep){
        Button.showWordColumn(column_to_keep);
    };

    // Popup handler for updating words.
    $scope.showPopup = function ($event) {
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

        myPopup.then(function (res) {
            // Check if there is an update
            if (res.data.new_word) {
                // Change word to new word and save to local storage for later use.
                BUTTONS.words[res.data.current_button_index] = res.data.new_word;

                // Update button value
                res.data.current_button.setAttribute('value', BUTTONS.words[res.data.current_button_index]);
                BUTTONS.saveWordsToLocalStorage(BUTTONS.words);
                if (!BUTTONS.showingAllColumns) {
                    BUTTONS.updateWordLabels(BUTTONS.current_k);
                }
                sayString(res.data.new_word);
            } else {
                // Log a cancellation.
                console.log("No word supplied.")
            }
        });
    }
})

.controller('BLEDetailCtrl', function($scope, $stateParams, BLE) {
    BLE.connect($stateParams.deviceId).then(
        function(peripheral) {
            $scope.device = peripheral;
        }
    );
});
