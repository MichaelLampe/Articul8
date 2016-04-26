angular.module('articulate.services', [])

.factory("Config", function(){
    return {
        buttonColor:"#d9d9d9",
        defaultWords: [
            "want","ipad","help","love","colors","yes","no","bath",
            "school","read","hug","brush teeth", "ball","music","potty","up",
            "snack","sing","alphabet","walk","milk","mama","daddy","go",
            "car","numbers","more","blanket","stop", "", ""
        ],

        saveSettings: function(){
            console.log("Saving config to local storage");
            for (var propertyName in this){
                if (typeof this[propertyName] != 'function') {
                    this.saveSettingToLocalStorage(propertyName, this[propertyName]);
                }
            }
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
            Config.saveSettings();
        },

        saveWordsToLocalStorage: function(words) {
            window.localStorage['words'] = words.toString();
        },

        // Populates the words from either local storage or the default wordlist
        populateWords: function() {
            console.log("Populating words into list.");
            if(window.localStorage['words'] === undefined){
                console.log("Loading default word list");
                this.saveWordsToLocalStorage(Config.defaultWords);
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

            buttonContainers = [c1, c2, c3, c4];

            for (var i = 0; i < 31; i++){
                // Create a given button
                var button = document.createElement('button');
                button.setAttribute('class', 'key');
                button.setAttribute('id', 'button_' + i.toString());
                button.setAttribute('value', this.words[i]);
                button.setAttribute('ng-click', "showPopup($event)");
                button.style.background = Config.buttonColor;

                // Recompile so ng-click update registers.
                $compile(button) ($scope);

                // Append to the correct div
                buttonContainers[Math.floor(i / 8)].appendChild(button);
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
                        buttonContainers[i].classList.add("hidden-button-container");
                    } else
                    {
                        buttonContainers[i].classList.remove("hidden-button-container");
                    }
                }
            }

            // Invert showing
            this.showingAllColumns = !this.showingAllColumns;
        }

    }
})

.factory('BLE', function($q) {
  var connected;
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
    subscribe: function(deviceId) {
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
    }
  };
});
