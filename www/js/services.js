angular.module('articulate.services', [])

.factory("Config", function(){
    return {
        wordButtons: "button-stable",
        columnButtons: "button-positive",
        buttonWithOutline: "",

        convertCamelCaseToPlainText: function(input_string) {
            var result = input_string.replace( /([A-Z])/g, " $1" );
            var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
            return finalResult;
        },

        saveSettings: function(){
            console.log("Saving config to local storage");
            settings = this.getAllSettings(false);
            for (var i in settings.length) {
                this.saveSettingToLocalStorage(settings[i], this[settings[i]]);
            }
        },

        getAllSettings: function(camelCase){
            return_list = [];
            for (var propertyName in this){
                if (typeof this[propertyName] != 'function') {
                    result = camelCase ? [this.convertCamelCaseToPlainText(propertyName), propertyName] : propertyName;
                    return_list.push(result);
                }
            }
            return return_list;
        },

        loadSettings: function(){
            console.log("Loading settings from local storage, if set.");
            for (var propertyName in this){
                if (typeof this[propertyName] != 'function') {
                    if (window.localStorage[propertyName] != undefined) {
                        this[propertyName] = window.localStorage[propertyName];
                    }
                }
            }
        },

        saveSettingToLocalStorage: function(settingName, value){
            window.localStorage[settingName] = value.toString();
            this[settingName] = window.localStorage[settingName];
        },

        getSettingFromLocalStorage: function(settingName){
            return window.localStorage[settingName];
        }
    }
})

.factory('Button', function($compile, Config) {
    return {
        words: undefined,
        word_labels: [],
        buttonContainers: [],
        current_k: -1,
        showingAllColumns: true,

        setup: function($scope){
            this.populateWords();
            this.populateButtons($scope);
            this.populateWordLabels();
            this.updateColumnButton();
            Config.saveSettings();
        },

        updateColumnButton : function(){
            for (var i = 0; i < 4; i++){
                column_button = document.getElementById("column_button_" + i);
                column_button.setAttribute('class', 'left-margin button icon ion-chevron-left ' + Config.columnButtons);
            }
        },

        saveWordsToLocalStorage: function(words) {
            window.localStorage['words'] = words.toString();
        },

        // Populates the words from either local storage or the default wordlist
        populateWords: function() {
            console.log("Populating words into list.");
            if(window.localStorage['words'] === undefined){
                console.log("Loading default word list");

                var defaultWords = [
                    "want","ipad","help","love","colors","yes","no","bath",
                    "school","read","hug","brush teeth", "ball","music","potty","up",
                    "snack","sing","alphabet","walk","milk","mama","daddy","go",
                    "car","numbers","more","blanket","stop", "", ""
                ];


                this.saveWordsToLocalStorage(defaultWords);
            }
            this.words = window.localStorage['words'].split(",");
        },

        // Populates the UI with buttons
        populateButtons: function($scope) {
            // Containers for buttons, 4 columns
            var c1 = document.getElementById("l_button_container");
            var c2 = document.getElementById("ml_button_container");
            var c3 = document.getElementById("mr_button_container");
            var c4 = document.getElementById("r_button_container");

            this.buttonContainers = [c1, c2, c3, c4];

            for (var i = 0; i < 31; i++){
                // Create a given button
                var button = document.createElement('button');
                button.setAttribute('class', 'key button ' + Config.wordButtons + ' ' + Config.buttonWithOutline);
                button.setAttribute('id', 'button_' + i.toString());
                button.setAttribute('value', this.words[i]);
                button.setAttribute('ng-click', "showPopup($event)");

                // Recompile so ng-click update registers.
                $compile(button) ($scope);

                // Append to the correct div
                this.buttonContainers[Math.floor(i / 8)].appendChild(button);
            }
        },

        updateButtonClass: function() {
            for (var i = 0; i < 31; i++){
                // Update the class of the buttons to reflect user changes
                var button = document.getElementById('button_' + i.toString());
                button.setAttribute('class', 'key button ' + Config.wordButtons + ' ' + Config.buttonWithOutline);
            }
        },

        // Populates the UI with word labels
        populateWordLabels: function(){
            for (i = 0; i < 8; i++){
                word_label = document.getElementById("word_label_" + String(i));
                this.word_labels.push(word_label)
            }
        },

        // Updates the word labels with a given column
        updateWordLabels: function(column){
            start = 8*column;
            var fudge = 0;
            if (column === 3){
                fudge = 1;
                this.word_labels[0].innerHTML = "";
            }

            for (i = start + fudge; i < start+8; i++){
                message = this.words[i-fudge];
                if (this.words[i-fudge] == undefined) {
                    message = "";
                }

                this.word_labels[i - start].innerHTML = message;
            }
        },

        hideWordLabels: function(){
            document.getElementById("word_labels").classList.add("hidden-word-labels");
            document.getElementById("word_labels").classList.remove("show-word-labels");
        },

        displayWordLabels: function(){
            document.getElementById("word_labels").classList.remove("hidden-word-labels");
            document.getElementById("word_labels").classList.add("show-word-labels");
        },

        showWordColumn: function(column_to_keep) {
            k = parseInt(column_to_keep);

            if (this.showingAllColumns){
                this.displayWordLabels();
                this.current_k = k;
            } else {
                this.hideWordLabels();
            }

            // Switch word labels to correct values
            this.updateWordLabels(k);
            for (i = 0; i < 4; i++) {
                // Add or remove all but the column that signaled.
                if (i !== k) {
                    if (this.showingAllColumns) {
                        this.buttonContainers[i].classList.add("hidden-button-container");


                        /*
                         We have to do this because of JS scoping.
                         */
                        setTimeoutContainer = function(c){
                            setTimeout(function(){
                                c.classList.add("hidden-button-container-final");
                            },600);
                        };

                        setTimeoutContainer(this.buttonContainers[i]);

                    } else {
                        /*
                         Fuzz it a bit to make it look better.
                         */
                        setTimeoutContainer = function(c){
                            setTimeout(function(){
                                c.classList.remove("hidden-button-container-final");
                            },150);
                        };

                        this.buttonContainers[i].classList.remove("hidden-button-container");
                        setTimeoutContainer(this.buttonContainers[i]);
                    }
                } else{
                    id = "column_button_" + this.current_k;
                    current_button = document.getElementById(id);
                    this.showingAllColumns ? current_button.classList.add("rotated-button") : current_button.classList.remove("rotated-button");
                }
            }

            // Invert showing
            this.showingAllColumns = !this.showingAllColumns;
        }

    }
})

.factory('BLE', function($q) {
  var connected;

  function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  return {

    devices: [],

    scan: function() {
      var that = this;
      var deferred = $q.defer();

      that.devices.length = 0;

      // disconnect the connected device (hack, device should disconnect when leaving detail page)
      if (connected) {
        var id = connected.id;
        ble.disconnect(connected.id, function() {
          console.log("Disconnected " + id);
        });
        connected = null;
      }

      ble.startScan([],  /* scan for all services */
        function(peripheral){
          that.devices.push(peripheral);
        },
        function(error){
          deferred.reject(error);
        });

        // stop scan after 5 seconds
        setTimeout(ble.stopScan, 5000,
          function() {
            deferred.resolve();
          },
          function() {
            console.log("stopScan failed");
            deferred.reject("Error stopping scan");
          }
        );

        return deferred.promise;
      },
      connect: function(deviceId) {
        var deferred = $q.defer();

        ble.connect(deviceId,
          function(peripheral) {
            connected = peripheral;
            deferred.resolve(peripheral);
          },
          function(reason) {
            deferred.reject(reason);
          }
        );

        return deferred.promise;
      },
      subscribe: function(deviceId, callback) {
        ble.startNotification(deviceId,
          "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
          "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
          function(data) {
            console.log(bytesToString(data));
            callback(bytesToString(data));
          },
          function(reason) {
            console.log("ERROR: " + reason);
          }
        );
      }
    };
  });
