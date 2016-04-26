angular.module('articulate.services', [])

.factory('BLE', function($q) {

  var connected;

  // ASCII only
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
        return deferred.promise;
      }
    };
  });
