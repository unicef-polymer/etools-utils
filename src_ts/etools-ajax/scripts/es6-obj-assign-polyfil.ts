// EC6 Object.assign polyfil
/* eslint-disable */
if (typeof Object.assign != 'function') {
  Object.assign = function <T extends object, U extends object>(target: T, _varArgs: U) {
    // .length of function is 2
    'use strict';
    if (target == null) {
      // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) {
        // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function (predicate: any) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
}
// EC6 Object.assign polyfil
// if (typeof Object.assign != 'function') {
//   Object.assign = function (target, varArgs) {
//     // .length of function is 2
//     'use strict';
//     if (target == null) {
//       // TypeError if undefined or null
//       throw new TypeError('Cannot convert undefined or null to object');
//     }
//
//     var to = Object(target);
//
//     for (var index = 1; index < arguments.length; index++) {
//       var nextSource = arguments[index];
//
//       if (nextSource != null) {
//         // Skip over if undefined or null
//         for (var nextKey in nextSource) {
//           // Avoid bugs when hasOwnProperty is shadowed
//           if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
//             to[nextKey] = nextSource[nextKey];
//           }
//         }
//       }
//     }
//     return to;
//   };
// }
//
// if (!Array.prototype.find) {
//   Object.defineProperty(Array.prototype, 'find', {
//     value: function (predicate) {
//       // 1. Let O be ? ToObject(this value).
//       if (this == null) {
//         throw TypeError('"this" is null or not defined');
//       }
//
//       var o = Object(this);
//
//       // 2. Let len be ? ToLength(? Get(O, "length")).
//       var len = o.length >>> 0;
//
//       // 3. If IsCallable(predicate) is false, throw a TypeError exception.
//       if (typeof predicate !== 'function') {
//         throw TypeError('predicate must be a function');
//       }
//
//       // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
//       var thisArg = arguments[1];
//
//       // 5. Let k be 0.
//       var k = 0;
//
//       // 6. Repeat, while k < len
//       while (k < len) {
//         // a. Let Pk be ! ToString(k).
//         // b. Let kValue be ? Get(O, Pk).
//         // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
//         // d. If testResult is true, return kValue.
//         var kValue = o[k];
//         if (predicate.call(thisArg, kValue, k, o)) {
//           return kValue;
//         }
//         // e. Increase k by 1.
//         k++;
//       }
//
//       // 7. Return undefined.
//       return undefined;
//     },
//     configurable: true,
//     writable: true
//   });
// }