/**
 * For creating a player inline you can use the MTVNPlayer.Player constructor.
 * For creating multiple players defined in HTML see MTVNPlayer.createPlayers
 * @static
 */
var MTVNPlayer = window.MTVNPlayer || {};
(function(MTVNPlayer) {
    "use strict";
    /**
     * @ignore
     * Modules are for internal embed api modules.
     * This was used before I was able to use rigger to scope
     * separate files.
     */
    if(!MTVNPlayer.module) {
        MTVNPlayer.module = function() {
            var modules = {};
            return function(name) {
                if(modules[name]) {
                    return modules[name];
                }
                modules[name] = {};
                return modules[name];
            };
        }();
    }
    
    /**
     * @ignore
     * These are for external projects built around the embed api to access the
     * shared resources. e.g. _, $, Backbone, Handlebars.
     */
    if(!MTVNPlayer.require) {
        var packages = {};
        /**
         * @ignore
         * This is a way for other modules to share between each other.
         */
        MTVNPlayer.require = function(name) {
            if(!packages[name]) {
                throw new Error("MTNVPlayer: package " + name + " not found.");
            }
            return packages[name];
        };
        /**
         * @ignore
         * This is a way for other modules to share between each other.
         */
        MTVNPlayer.provide = function(name, module) {
            packages[name] = module;
        };
        /**
         * @ignore
         * This is a way for other modules to share between each other.
         */
        MTVNPlayer.has = function(name) {
            return packages[name];
        };
    }
})(MTVNPlayer);

(function(context) {
    // we're leaking yepnope into global. 
    // noConflict will be called after we store references
    // to the modules that we're using.
    var oldYepNope = context.yepnope;
    MTVNPlayer.noConflict = function() {
        context.yepnope = oldYepNope;
        _.noConflict();
    };
})(window);
//     Underscore.js 1.4.3
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // with specific `key:value` pairs.
  _.where = function(obj, attrs) {
    if (_.isEmpty(attrs)) return [];
    return _.filter(obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, context) {
    var args, bound;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + (0 | Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = '' + ++idCounter;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

/*global MTVNPlayer _ */
(function() {
	"use strict";
	MTVNPlayer.provide("_", _);
})();
/*globals MTVNPlayer */
(function(core, $) {
    "use strict";
    if (core.initialized) {
        return;
    }
    core.initialized = true;
    // private vars
    var instances = [],
        baseURL = "http://media.mtvnservices.com/",
        onPlayerCallbacks = [],
        // this is needed for the jQuery plugin only.
        getLegacyEventName = function(eventName) {
            if (eventName === "uiStateChange") {
                return "onUIStateChange";
            }
            return "on" + eventName.charAt(0).toUpperCase() + eventName.substr(1);
        };
    // exports
    /**
     * @property instances
     * @ignore
     * An array of all the player instances.
     */
    core.instances = instances;
    /**
     * @property baseURL
     * @ignore
     * The base URL for the player request and for swf object. 
     */
    core.baseURL = baseURL;
    /**
     * @property onPlayerCallbacks
     * @ignore
     * These are fired when a player laods. 
     */
    core.onPlayerCallbacks = onPlayerCallbacks;
    core.$ = $;

    /**
     * Initialization that is common across player modules (meaning flash/html5).
     * This is here mostly to keep it out of the constructor.
     * @ignore
     */
    core.playerInit = function(player, playerModule) {
        // A list of event messages called before the player was ready
        var eventQueue = [];
        player.module = function() {
            var modules = {};
            return function(name) {
                if (modules[name]) {
                    return modules[name];
                }
                modules[name] = {};
                return modules[name];
            };
        }();
        player.message = function() {
            if (!this.ready) {
                eventQueue.push(arguments);
            } else {
                return playerModule.message.apply(this, arguments);
            }
        };
        player.one("ready", function(event) {
            var player = event.target,
                message = player.message;
            for (var i = 0, len = eventQueue.length; i < len; i++) {
                message.apply(player, eventQueue[i]);
            }
        });
    };

    /**
     * @property isHTML5Player
     * @ignore
     * The logic that determines whether we're using flash or html
     */
    core.isHTML5Player = function(userAgent) {
        var n = userAgent ? userAgent.toLowerCase() : "",
            checkSilk = function(n) {
                if (n.indexOf("silk") !== -1) {
                    var reg = /silk\/(\d)/ig,
                        result = parseInt(reg.exec(n)[1], 10);
                    return !isNaN(result) && result >= 2;
                }
                return false;
            },
            checkAndroid = function(n) {
                if (n.indexOf("android") !== -1) {
                    var reg = /android (\d)/ig,
                        result = parseInt(reg.exec(n)[1], 10);
                    return !isNaN(result) && result >= 4;
                }
                return false;
            };
        return n.indexOf("iphone") !== -1 || n.indexOf("ipad") !== -1 || checkSilk(n) || checkAndroid(n);
    };

    /**
     * Utility function. Append css to the head.
     * @ignore
     */
    core.appendStyle = function(cssText) {
        var styles = document.createElement("style");
        styles.setAttribute("type", "text/css");
        document.getElementsByTagName("head")[0].appendChild(styles);
        if (styles.styleSheet) {
            styles.styleSheet.cssText = cssText;
        } else {
            styles.appendChild(document.createTextNode(cssText));
        }
    };

    /**
     * @method getPath
     * @ignore
     * @param {Object} config
     * Check if there's a template URL (usually used for testing),
     * otherwise join the baseURL with the config.uri
     */
    core.getPath = function(config) {
        if (config.templateURL) {
            return config.templateURL.replace("{uri}", config.uri);
        }
        return baseURL + config.uri;
    };
    /**
     * @method processPerformance
     * @ignore
     * @param {MTVNPlayer.Player} player
     * @param {Object} performance data
     */
    core.processPerformance = function(player, data) {
        var startTime = player.config.performance.startTime,
            eventType = MTVNPlayer.Events.PERFORMANCE;
        for (var prop in data) {
            // adjust to the start time recorded by the embed api.
            data[prop] = data[prop] - startTime;
        }
        core.processEvent(player.events[eventType], {
            data: data,
            target: player,
            type: eventType
        });
    };
    /**
     * @method processEvent
     * @ignore
     * @param {Object} {Array} event
     * @param {Object} data
     * Check if event is an Array, if so loop through, else just execute.
     */
    core.processEvent = function(event, data) {
        // trigger a jQuery event if there's an $el.
        if (data && data.target && data.target.$el) {
            data.target.$el.trigger("MTVNPlayer:" + data.type, data);
            // legacy event names
            data.target.$el.trigger("MTVNPlayer:" + getLegacyEventName(data.type), data);
        }
        if (!event) {
            return;
        }
        if (event instanceof Array) { // this will always be same-frame. (instanceof fails cross-frame.)
            // clone array
            event = event.slice();
            // fire in order
            for (var i = 0, len = event.length; i < len; i++) {
                event[i](data);
            }
        } else {
            event(data);
        }
    };
    /**
     * @method getPlayerInstance
     * @ignore
     * @param {ContentWindow} source
     * @returns {MTVNPlayer.Player} A player instance
     */
    core.getPlayerInstance = function(source) {
        var i, player = null,
            numberOfInstances = instances.length,
            currentInstance;
        for (i = numberOfInstances; i--;) {
            currentInstance = instances[i];
            if (currentInstance.source === source) {
                // compare source (contentWindow) to get events object from the right player. (if flash, source is the embed id)
                player = currentInstance.player;
                break;
            }
        }
        return player;
    };
    /**
     * @method executeCallbacks
     * @ignore
     * @param {MTVNPlayer.Player} player
     * Fires callbacks registered with MTVNPlayer.onPlayer
     */
    core.executeCallbacks = function(player) {
        var cbs = onPlayerCallbacks.slice(),
            i = 0,
            len = cbs.length;
        for (i; i < len; i++) {
            cbs[i](player);
        }
    };
})(window.MTVNPlayer.module("core"), window.jQuery || window.Zepto);
/**
 * @ignore
 * The config module has helper functions for dealing with the config object.
 **/
(function(MTVNPlayer) {
    "use strict";
    var config = MTVNPlayer.module("config"),
        _ = MTVNPlayer.require("_");
    if (config.initialized) {
        return;
    }
    config.initialized = true;
    /**
     * @ignore
     * Copy one event object to another, building an array when necessary.
     */
    config.copyEvents = function(toObj, fromObj) {
        var newEvent, currentEvent;
        if (fromObj) {
            for (var prop in fromObj) {
                if (fromObj.hasOwnProperty(prop)) {
                    newEvent = fromObj[prop];
                    if (_.isFunction(newEvent) || _.isArray(newEvent)) {
                        currentEvent = toObj[prop];
                        if (currentEvent) {
                            // the event object already exists, we need to augment it
                            if (_.isArray(currentEvent)) {
                                if (_.isArray(newEvent)) {
                                    // combine the arrays
                                    toObj[prop] = currentEvent.concat(newEvent);
                                } else {
                                    // tack on the event to an existing array
                                    currentEvent.push(newEvent);
                                }
                            } else {
                                // make a new array and concat the new array, or just make an array with two items.
                                toObj[prop] = _.isArray(newEvent) ? [currentEvent].concat(newEvent) : [currentEvent, newEvent];
                            }
                        } else {
                            // just set it...
                            toObj[prop] = newEvent;
                        }
                    }
                }
            }
        }
        return toObj;
    };
    /**
     * @ignore
     */
    var exists = function(value) {
        return value !== undefined && value !== null;
    },
    /**
     * @ignore
     * Copy one config object to another, this includes a deep copy for flashvars, attributes, and params.
     * The properties will not be overriden on the toObj, unless override is specified.
     */
    copyProperties = config.copyProperties = function(toObj, fromObj, override) {
        if (fromObj) {
            for (var prop in fromObj) {
                if (fromObj.hasOwnProperty(prop)) {
                    if (exists(fromObj[prop])) {
                        var propName = prop.toLowerCase();
                        if (propName === "flashvars" || propName === "attributes" || propName === "params") {
                            toObj[prop] = toObj[prop] || {};
                            copyProperties(toObj[prop], fromObj[prop], override);
                        } else {
                            // make sure width and height are defined and not zero
                            if ((prop === "width" || prop === "height") && !fromObj[prop]) {
                                continue;
                            }
                            // don't override if the prop exists
                            if (!override && exists(toObj[prop])) {
                                continue;
                            }
                            toObj[prop] = fromObj[prop];
                        }
                    }
                }
            }
        }
        return toObj;
    };
    config.versionIsMinimum = function(required, version) {
        function chopBuild(version){
            if(version.indexOf("-") !== -1){
                return version.slice(0,required.indexOf("-"));
            }
            return version;
        }
        if (required && version) {
            required = chopBuild(required);
            version = chopBuild(version);
            if (required === version) {
                return true;
            }
            // convert to arrays
            required = required.split(".");
            version = version.split(".");
            for (var i = 0, l = version.length; i < l; i++) {
                
                var u = parseInt(required[i], 10),
                    r = parseInt(version[i], 10);
                u = isNaN(u) ? 0 : u;
                r = isNaN(r) ? 0 : r;
                // continue to the next digit
                if (u == r) {
                    continue;
                }

                // else return result
                return u < r;
            }
        }
    };
    config.buildConfig = function(el, config) {
        config = copyProperties(config, window.MTVNPlayer.defaultConfig);
        // make sure the height and width are defined.
        // 640x360 is now the default.
        config = copyProperties(config, {
            width: 640,
            height: 360
        });
        var getDataAttr = function(attr) {
            return el.getAttribute("data-" + attr);
        },
        getStyleAttr = function(attr) {
            return parseInt(el.style[attr], 10);
        },
        getObjectFromNameValue = function(attr) {
            attr = getDataAttr(attr);
            if (attr) {
                var i, result = {},
                pairs = attr.split("&"),
                    pair;
                for (i = pairs.length; i--;) {
                    pair = pairs[i].split("=");
                    if (pair && pair.length == 2) {
                        result[pair[0]] = pair[1];
                    }
                }
                return result;
            }
        },
        /**
         * @ignore
         * Allow the element to define some custom flashvars instead of
         * using querystring format on the data-flashVars object.
         */
        copyCustomPropertiesToFlashVars = function(obj) {
            var customProperties = ["autoPlay", "sid", "ssid"],
                i, propValue, propName;
            for (i = customProperties.length; i--;) {
                propName = customProperties[i];
                propValue = getDataAttr(propName);
                if (propValue) {
                    if (!obj) {
                        obj = {};
                    }
                    obj[propName] = propValue;
                }
            }
            return obj;
        },
        configFromEl = {
            uri: getDataAttr("contenturi"),
            width: getStyleAttr("width") || null,
            height: getStyleAttr("height") || null,
            flashVars: copyCustomPropertiesToFlashVars(getObjectFromNameValue("flashVars")),
            attributes: getObjectFromNameValue("attributes")
        };
        return copyProperties(config, configFromEl, true);
    };
})(window.MTVNPlayer);
(function(mod, document) {
    "use strict";
    var selector = null;
    mod.find = function(query) {
        mod.initialize();
        return selector(query);
    };
    /**
     * micro-selector
     * @method selector
     * @ignore
     * author:  Fabio Miranda Costa
     * github:  fabiomcosta
     * twitter: @fabiomiranda
     * license: MIT-style license
     */
    mod.initialize = function() {
        mod.initialize = function() {};
        var elements, parsed, parsedClasses, parsedPseudos, pseudos = {},
            context, currentDocument, reTrim = /^\s+|\s+$/g;
        var supports_querySelectorAll = !! document.querySelectorAll;
        var $u = function(selector, _context, append) {
                elements = append || [];
                context = _context || $u.context;
                if (supports_querySelectorAll) {
                    try {
                        arrayFrom(context.querySelectorAll(selector));
                        return elements;
                    } catch (e) {}
                }
                currentDocument = context.ownerDocument || context;
                parse(selector.replace(reTrim, ''));
                find();
                return elements;
            };
        var matchSelector = function(node) {
                if (parsed.tag) {
                    var nodeName = node.nodeName.toUpperCase();
                    if (parsed.tag == '*') {
                        if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
                    } else {
                        if (nodeName != parsed.tag) return false;
                    }
                }
                if (parsed.id && node.getAttribute('id') != parsed.id) {
                    return false;
                }
                if ((parsedClasses = parsed.classes)) {
                    var className = (' ' + node.className + ' ');
                    for (var i = parsedClasses.length; i--;) {
                        if (className.indexOf(' ' + parsedClasses[i] + ' ') < 0) return false;
                    }
                }
                if ((parsedPseudos = parsed.pseudos)) {
                    for (var j = parsedPseudos.length; j--;) {
                        var pseudoClass = pseudos[parsedPseudos[j]];
                        if (!(pseudoClass && pseudoClass.call($u, node))) return false;
                    }
                }
                return true;
            };
        var find = function() {
                var parsedId = parsed.id,
                    merge = ((parsedId && parsed.tag || parsed.classes || parsed.pseudos) || (!parsedId && (parsed.classes || parsed.pseudos))) ? arrayFilterAndMerge : arrayMerge;
                if (parsedId) {
                    var el = currentDocument.getElementById(parsedId);
                    if (el && (currentDocument === context || contains(el))) {
                        merge([el]);
                    }
                } else {
                    merge(context.getElementsByTagName(parsed.tag || '*'));
                }
            };
        var parse = function(selector) {
                parsed = {};
                while ((selector = selector.replace(/([#.:])?([^#.:]*)/, parser))) {}
            };
        var parser = function(all, simbol, name) {
                if (!simbol) {
                    parsed.tag = name.toUpperCase();
                } else if (simbol == '#') {
                    parsed.id = name;
                } else if (simbol == '.') {
                    if (parsed.classes) {
                        parsed.classes.push(name);
                    } else {
                        parsed.classes = [name];
                    }
                } else if (simbol == ':') {
                    if (parsed.pseudos) {
                        parsed.pseudos.push(name);
                    } else {
                        parsed.pseudos = [name];
                    }
                }
                return '';
            };
        var slice = Array.prototype.slice;
        var arrayFrom = function(collection) {
                elements = slice.call(collection, 0);
            };
        var arrayMerge = function(collection) {
                for (var i = 0, len = collection.length; i < len; i++) {
                    elements.push(collection[i]);
                }
            };
        try {
            slice.call(document.documentElement.childNodes, 0);
        } catch (e) {
            arrayFrom = arrayMerge;
        }
        var arrayFilterAndMerge = function(found) {
                for (var i = 0, len = found.length; i < len; i++) {
                    var node = found[i];
                    if (matchSelector(node)) elements.push(node);
                }
            };
        var contains = function(node) {
                do {
                    if (node === context) return true;
                } while ((node = node.parentNode));
                return false;
            };
        $u.pseudos = pseudos;
        $u.context = document;
        selector = $u;
    };
})(window.MTVNPlayer.module("selector"), window.document);
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
(function(FlashModule) {
    // creates the swfobject class.
    FlashModule.getSWFObject = function() {
        if (!window.MTVNPlayer.swfobject) {
            var swfobject = function() {
                    var D = "undefined",
                        r = "object",
                        S = "Shockwave Flash",
                        W = "ShockwaveFlash.ShockwaveFlash",
                        q = "application/x-shockwave-flash",
                        R = "SWFObjectExprInst",
                        x = "onreadystatechange",
                        O = window,
                        j = document,
                        t = navigator,
                        T = false,
                        U = [h],
                        o = [],
                        N = [],
                        I = [],
                        l, Q, E, B, J = false,
                        a = false,
                        n, G, m = true,
                        M = function() {
                            var aa = typeof j.getElementById != D && typeof j.getElementsByTagName != D && typeof j.createElement != D,
                                ah = t.userAgent.toLowerCase(),
                                Y = t.platform.toLowerCase(),
                                ae = Y ? /win/.test(Y) : /win/.test(ah),
                                ac = Y ? /mac/.test(Y) : /mac/.test(ah),
                                af = /webkit/.test(ah) ? parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false,
                                X = !+"\v1",
                                ag = [0, 0, 0],
                                ab = null;
                            if (typeof t.plugins != D && typeof t.plugins[S] == r) {
                                ab = t.plugins[S].description;
                                if (ab && !(typeof t.mimeTypes != D && t.mimeTypes[q] && !t.mimeTypes[q].enabledPlugin)) {
                                    T = true;
                                    X = false;
                                    ab = ab.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                                    ag[0] = parseInt(ab.replace(/^(.*)\..*$/, "$1"), 10);
                                    ag[1] = parseInt(ab.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                                    ag[2] = /[a-zA-Z]/.test(ab) ? parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0
                                }
                            } else {
                                if (typeof O.ActiveXObject != D) {
                                    try {
                                        var ad = new ActiveXObject(W);
                                        if (ad) {
                                            ab = ad.GetVariable("$version");
                                            if (ab) {
                                                X = true;
                                                ab = ab.split(" ")[1].split(",");
                                                ag = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
                                            }
                                        }
                                    } catch (Z) {}
                                }
                            }
                            return {
                                w3: aa,
                                pv: ag,
                                wk: af,
                                ie: X,
                                win: ae,
                                mac: ac
                            }
                        }(),
                        k = function() {
                            if (!M.w3) {
                                return
                            }
                            if ((typeof j.readyState != D && j.readyState == "complete") || (typeof j.readyState == D && (j.getElementsByTagName("body")[0] || j.body))) {
                                f()
                            }
                            if (!J) {
                                if (typeof j.addEventListener != D) {
                                    j.addEventListener("DOMContentLoaded", f, false)
                                }
                                if (M.ie && M.win) {
                                    j.attachEvent(x, function() {
                                        if (j.readyState == "complete") {
                                            j.detachEvent(x, arguments.callee);
                                            f()
                                        }
                                    });
                                    if (O == top) {
                                        (function() {
                                            if (J) {
                                                return
                                            }
                                            try {
                                                j.documentElement.doScroll("left")
                                            } catch (X) {
                                                setTimeout(arguments.callee, 0);
                                                return
                                            }
                                            f()
                                        })()
                                    }
                                }
                                if (M.wk) {
                                    (function() {
                                        if (J) {
                                            return
                                        }
                                        if (!/loaded|complete/.test(j.readyState)) {
                                            setTimeout(arguments.callee, 0);
                                            return
                                        }
                                        f()
                                    })()
                                }
                                s(f)
                            }
                        }();

                    function f() {
                        if (J) {
                            return
                        }
                        try {
                            var Z = j.getElementsByTagName("body")[0].appendChild(C("span"));
                            Z.parentNode.removeChild(Z)
                        } catch (aa) {
                            return
                        }
                        J = true;
                        var X = U.length;
                        for (var Y = 0; Y < X; Y++) {
                            U[Y]()
                        }
                    }

                    function K(X) {
                        if (J) {
                            X()
                        } else {
                            U[U.length] = X
                        }
                    }

                    function s(Y) {
                        if (typeof O.addEventListener != D) {
                            O.addEventListener("load", Y, false)
                        } else {
                            if (typeof j.addEventListener != D) {
                                j.addEventListener("load", Y, false)
                            } else {
                                if (typeof O.attachEvent != D) {
                                    i(O, "onload", Y)
                                } else {
                                    if (typeof O.onload == "function") {
                                        var X = O.onload;
                                        O.onload = function() {
                                            X();
                                            Y()
                                        }
                                    } else {
                                        O.onload = Y
                                    }
                                }
                            }
                        }
                    }

                    function h() {
                        if (T) {
                            V()
                        } else {
                            H()
                        }
                    }

                    function V() {
                        var X = j.getElementsByTagName("body")[0];
                        var aa = C(r);
                        aa.setAttribute("type", q);
                        var Z = X.appendChild(aa);
                        if (Z) {
                            var Y = 0;
                            (function() {
                                if (typeof Z.GetVariable != D) {
                                    var ab = Z.GetVariable("$version");
                                    if (ab) {
                                        ab = ab.split(" ")[1].split(",");
                                        M.pv = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
                                    }
                                } else {
                                    if (Y < 10) {
                                        Y++;
                                        setTimeout(arguments.callee, 10);
                                        return
                                    }
                                }
                                X.removeChild(aa);
                                Z = null;
                                H()
                            })()
                        } else {
                            H()
                        }
                    }

                    function H() {
                        var ag = o.length;
                        if (ag > 0) {
                            for (var af = 0; af < ag; af++) {
                                var Y = o[af].id;
                                var ab = o[af].callbackFn;
                                var aa = {
                                    success: false,
                                    id: Y
                                };
                                if (M.pv[0] > 0) {
                                    var ae = c(Y);
                                    if (ae) {
                                        if (F(o[af].swfVersion) && !(M.wk && M.wk < 312)) {
                                            w(Y, true);
                                            if (ab) {
                                                aa.success = true;
                                                aa.ref = z(Y);
                                                ab(aa)
                                            }
                                        } else {
                                            if (o[af].expressInstall && A()) {
                                                var ai = {};
                                                ai.data = o[af].expressInstall;
                                                ai.width = ae.getAttribute("width") || "0";
                                                ai.height = ae.getAttribute("height") || "0";
                                                if (ae.getAttribute("class")) {
                                                    ai.styleclass = ae.getAttribute("class")
                                                }
                                                if (ae.getAttribute("align")) {
                                                    ai.align = ae.getAttribute("align")
                                                }
                                                var ah = {};
                                                var X = ae.getElementsByTagName("param");
                                                var ac = X.length;
                                                for (var ad = 0; ad < ac; ad++) {
                                                    if (X[ad].getAttribute("name").toLowerCase() != "movie") {
                                                        ah[X[ad].getAttribute("name")] = X[ad].getAttribute("value")
                                                    }
                                                }
                                                P(ai, ah, Y, ab)
                                            } else {
                                                p(ae);
                                                if (ab) {
                                                    ab(aa)
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    w(Y, true);
                                    if (ab) {
                                        var Z = z(Y);
                                        if (Z && typeof Z.SetVariable != D) {
                                            aa.success = true;
                                            aa.ref = Z
                                        }
                                        ab(aa)
                                    }
                                }
                            }
                        }
                    }

                    function z(aa) {
                        var X = null;
                        var Y = c(aa);
                        if (Y && Y.nodeName == "OBJECT") {
                            if (typeof Y.SetVariable != D) {
                                X = Y
                            } else {
                                var Z = Y.getElementsByTagName(r)[0];
                                if (Z) {
                                    X = Z
                                }
                            }
                        }
                        return X
                    }

                    function A() {
                        return !a && F("6.0.65") && (M.win || M.mac) && !(M.wk && M.wk < 312)
                    }

                    function P(aa, ab, X, Z) {
                        a = true;
                        E = Z || null;
                        B = {
                            success: false,
                            id: X
                        };
                        var ae = c(X);
                        if (ae) {
                            if (ae.nodeName == "OBJECT") {
                                l = g(ae);
                                Q = null
                            } else {
                                l = ae;
                                Q = X
                            }
                            aa.id = R;
                            if (typeof aa.width == D || (!/%$/.test(aa.width) && parseInt(aa.width, 10) < 310)) {
                                aa.width = "310"
                            }
                            if (typeof aa.height == D || (!/%$/.test(aa.height) && parseInt(aa.height, 10) < 137)) {
                                aa.height = "137"
                            }
                            j.title = j.title.slice(0, 47) + " - Flash Player Installation";
                            var ad = M.ie && M.win ? "ActiveX" : "PlugIn",
                                ac = "MMredirectURL=" + O.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + ad + "&MMdoctitle=" + j.title;
                            if (typeof ab.flashvars != D) {
                                ab.flashvars += "&" + ac
                            } else {
                                ab.flashvars = ac
                            }
                            if (M.ie && M.win && ae.readyState != 4) {
                                var Y = C("div");
                                X += "SWFObjectNew";
                                Y.setAttribute("id", X);
                                ae.parentNode.insertBefore(Y, ae);
                                ae.style.display = "none";
                                (function() {
                                    if (ae.readyState == 4) {
                                        ae.parentNode.removeChild(ae)
                                    } else {
                                        setTimeout(arguments.callee, 10)
                                    }
                                })()
                            }
                            u(aa, ab, X)
                        }
                    }

                    function p(Y) {
                        if (M.ie && M.win && Y.readyState != 4) {
                            var X = C("div");
                            Y.parentNode.insertBefore(X, Y);
                            X.parentNode.replaceChild(g(Y), X);
                            Y.style.display = "none";
                            (function() {
                                if (Y.readyState == 4) {
                                    Y.parentNode.removeChild(Y)
                                } else {
                                    setTimeout(arguments.callee, 10)
                                }
                            })()
                        } else {
                            Y.parentNode.replaceChild(g(Y), Y)
                        }
                    }

                    function g(ab) {
                        var aa = C("div");
                        if (M.win && M.ie) {
                            aa.innerHTML = ab.innerHTML
                        } else {
                            var Y = ab.getElementsByTagName(r)[0];
                            if (Y) {
                                var ad = Y.childNodes;
                                if (ad) {
                                    var X = ad.length;
                                    for (var Z = 0; Z < X; Z++) {
                                        if (!(ad[Z].nodeType == 1 && ad[Z].nodeName == "PARAM") && !(ad[Z].nodeType == 8)) {
                                            aa.appendChild(ad[Z].cloneNode(true))
                                        }
                                    }
                                }
                            }
                        }
                        return aa
                    }

                    function u(ai, ag, Y) {
                        var X, aa = c(Y);
                        if (M.wk && M.wk < 312) {
                            return X
                        }
                        if (aa) {
                            if (typeof ai.id == D) {
                                ai.id = Y
                            }
                            if (M.ie && M.win) {
                                var ah = "";
                                for (var ae in ai) {
                                    if (ai[ae] != Object.prototype[ae]) {
                                        if (ae.toLowerCase() == "data") {
                                            ag.movie = ai[ae]
                                        } else {
                                            if (ae.toLowerCase() == "styleclass") {
                                                ah += ' class="' + ai[ae] + '"'
                                            } else {
                                                if (ae.toLowerCase() != "classid") {
                                                    ah += " " + ae + '="' + ai[ae] + '"'
                                                }
                                            }
                                        }
                                    }
                                }
                                var af = "";
                                for (var ad in ag) {
                                    if (ag[ad] != Object.prototype[ad]) {
                                        af += '<param name="' + ad + '" value="' + ag[ad] + '" />'
                                    }
                                }
                                aa.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + ah + ">" + af + "</object>";
                                N[N.length] = ai.id;
                                X = c(ai.id)
                            } else {
                                var Z = C(r);
                                Z.setAttribute("type", q);
                                for (var ac in ai) {
                                    if (ai[ac] != Object.prototype[ac]) {
                                        if (ac.toLowerCase() == "styleclass") {
                                            Z.setAttribute("class", ai[ac])
                                        } else {
                                            if (ac.toLowerCase() != "classid") {
                                                Z.setAttribute(ac, ai[ac])
                                            }
                                        }
                                    }
                                }
                                for (var ab in ag) {
                                    if (ag[ab] != Object.prototype[ab] && ab.toLowerCase() != "movie") {
                                        e(Z, ab, ag[ab])
                                    }
                                }
                                aa.parentNode.replaceChild(Z, aa);
                                X = Z
                            }
                        }
                        return X
                    }

                    function e(Z, X, Y) {
                        var aa = C("param");
                        aa.setAttribute("name", X);
                        aa.setAttribute("value", Y);
                        Z.appendChild(aa)
                    }

                    function y(Y) {
                        var X = c(Y);
                        if (X && X.nodeName == "OBJECT") {
                            if (M.ie && M.win) {
                                X.style.display = "none";
                                (function() {
                                    if (X.readyState == 4) {
                                        b(Y)
                                    } else {
                                        setTimeout(arguments.callee, 10)
                                    }
                                })()
                            } else {
                                X.parentNode.removeChild(X)
                            }
                        }
                    }

                    function b(Z) {
                        var Y = c(Z);
                        if (Y) {
                            for (var X in Y) {
                                if (typeof Y[X] == "function") {
                                    Y[X] = null
                                }
                            }
                            Y.parentNode.removeChild(Y)
                        }
                    }

                    function c(Z) {
                        var X = null;
                        try {
                            X = j.getElementById(Z)
                        } catch (Y) {}
                        return X
                    }

                    function C(X) {
                        return j.createElement(X)
                    }

                    function i(Z, X, Y) {
                        Z.attachEvent(X, Y);
                        I[I.length] = [Z, X, Y]
                    }

                    function F(Z) {
                        var Y = M.pv,
                            X = Z.split(".");
                        X[0] = parseInt(X[0], 10);
                        X[1] = parseInt(X[1], 10) || 0;
                        X[2] = parseInt(X[2], 10) || 0;
                        return (Y[0] > X[0] || (Y[0] == X[0] && Y[1] > X[1]) || (Y[0] == X[0] && Y[1] == X[1] && Y[2] >= X[2])) ? true : false
                    }

                    function v(ac, Y, ad, ab) {
                        if (M.ie && M.mac) {
                            return
                        }
                        var aa = j.getElementsByTagName("head")[0];
                        if (!aa) {
                            return
                        }
                        var X = (ad && typeof ad == "string") ? ad : "screen";
                        if (ab) {
                            n = null;
                            G = null
                        }
                        if (!n || G != X) {
                            var Z = C("style");
                            Z.setAttribute("type", "text/css");
                            Z.setAttribute("media", X);
                            n = aa.appendChild(Z);
                            if (M.ie && M.win && typeof j.styleSheets != D && j.styleSheets.length > 0) {
                                n = j.styleSheets[j.styleSheets.length - 1]
                            }
                            G = X
                        }
                        if (M.ie && M.win) {
                            if (n && typeof n.addRule == r) {
                                n.addRule(ac, Y)
                            }
                        } else {
                            if (n && typeof j.createTextNode != D) {
                                n.appendChild(j.createTextNode(ac + " {" + Y + "}"))
                            }
                        }
                    }

                    function w(Z, X) {
                        if (!m) {
                            return
                        }
                        var Y = X ? "visible" : "hidden";
                        if (J && c(Z)) {
                            c(Z).style.visibility = Y
                        } else {
                            v("#" + Z, "visibility:" + Y)
                        }
                    }

                    function L(Y) {
                        var Z = /[\\\"<>\.;]/;
                        var X = Z.exec(Y) != null;
                        return X && typeof encodeURIComponent != D ? encodeURIComponent(Y) : Y
                    }
                    var d = function() {
                            if (M.ie && M.win) {
                                window.attachEvent("onunload", function() {
                                    var ac = I.length;
                                    for (var ab = 0; ab < ac; ab++) {
                                        I[ab][0].detachEvent(I[ab][1], I[ab][2])
                                    }
                                    var Z = N.length;
                                    for (var aa = 0; aa < Z; aa++) {
                                        y(N[aa])
                                    }
                                    for (var Y in M) {
                                        M[Y] = null
                                    }
                                    M = null;
                                    for (var X in swfobject) {
                                        swfobject[X] = null
                                    }
                                    swfobject = null
                                })
                            }
                        }();
                    return {
                        registerObject: function(ab, X, aa, Z) {
                            if (M.w3 && ab && X) {
                                var Y = {};
                                Y.id = ab;
                                Y.swfVersion = X;
                                Y.expressInstall = aa;
                                Y.callbackFn = Z;
                                o[o.length] = Y;
                                w(ab, false)
                            } else {
                                if (Z) {
                                    Z({
                                        success: false,
                                        id: ab
                                    })
                                }
                            }
                        },
                        getObjectById: function(X) {
                            if (M.w3) {
                                return z(X)
                            }
                        },
                        embedSWF: function(ab, ah, ae, ag, Y, aa, Z, ad, af, ac) {
                            var X = {
                                success: false,
                                id: ah
                            };
                            if (M.w3 && !(M.wk && M.wk < 312) && ab && ah && ae && ag && Y) {
                                w(ah, false);
                                K(function() {
                                    ae += "";
                                    ag += "";
                                    var aj = {};
                                    if (af && typeof af === r) {
                                        for (var al in af) {
                                            aj[al] = af[al]
                                        }
                                    }
                                    aj.data = ab;
                                    aj.width = ae;
                                    aj.height = ag;
                                    var am = {};
                                    if (ad && typeof ad === r) {
                                        for (var ak in ad) {
                                            am[ak] = ad[ak]
                                        }
                                    }
                                    if (Z && typeof Z === r) {
                                        for (var ai in Z) {
                                            if (typeof am.flashvars != D) {
                                                am.flashvars += "&" + ai + "=" + Z[ai]
                                            } else {
                                                am.flashvars = ai + "=" + Z[ai]
                                            }
                                        }
                                    }
                                    if (F(Y)) {
                                        var an = u(aj, am, ah);
                                        if (aj.id == ah) {
                                            w(ah, true)
                                        }
                                        X.success = true;
                                        X.ref = an
                                    } else {
                                        if (aa && A()) {
                                            aj.data = aa;
                                            P(aj, am, ah, ac);
                                            return
                                        } else {
                                            w(ah, true)
                                        }
                                    }
                                    if (ac) {
                                        ac(X)
                                    }
                                })
                            } else {
                                if (ac) {
                                    ac(X)
                                }
                            }
                        },
                        switchOffAutoHideShow: function() {
                            m = false
                        },
                        ua: M,
                        getFlashPlayerVersion: function() {
                            return {
                                major: M.pv[0],
                                minor: M.pv[1],
                                release: M.pv[2]
                            }
                        },
                        hasFlashPlayerVersion: F,
                        createSWF: function(Z, Y, X) {
                            if (M.w3) {
                                return u(Z, Y, X)
                            } else {
                                return undefined
                            }
                        },
                        showExpressInstall: function(Z, aa, X, Y) {
                            if (M.w3 && A()) {
                                P(Z, aa, X, Y)
                            }
                        },
                        removeSWF: function(X) {
                            if (M.w3) {
                                y(X)
                            }
                        },
                        createCSS: function(aa, Z, Y, X) {
                            if (M.w3) {
                                v(aa, Z, Y, X)
                            }
                        },
                        addDomLoadEvent: K,
                        addLoadEvent: s,
                        getQueryParamValue: function(aa) {
                            var Z = j.location.search || j.location.hash;
                            if (Z) {
                                if (/\?/.test(Z)) {
                                    Z = Z.split("?")[1]
                                }
                                if (aa == null) {
                                    return L(Z)
                                }
                                var Y = Z.split("&");
                                for (var X = 0; X < Y.length; X++) {
                                    if (Y[X].substring(0, Y[X].indexOf("=")) == aa) {
                                        return L(Y[X].substring((Y[X].indexOf("=") + 1)))
                                    }
                                }
                            }
                            return ""
                        },
                        expressInstallCallback: function() {
                            if (a) {
                                var X = c(R);
                                if (X && l) {
                                    X.parentNode.replaceChild(l, X);
                                    if (Q) {
                                        w(Q, true);
                                        if (M.ie && M.win) {
                                            l.style.display = "block"
                                        }
                                    }
                                    if (E) {
                                        E(B)
                                    }
                                }
                                a = false
                            }
                        }
                    }
                }();
            // override the initialization of swfobject
            FlashModule.getSWFObject = function() {
                return swfobject;
            }
            return swfobject;
        };
    };
}(window.MTVNPlayer.module("flash")));
(function(MTVNPlayer) {
    "use strict";
    var flash = MTVNPlayer.module("flash"),
        core = MTVNPlayer.module("core");
    if(flash.initialized) {
        return;
    }
    flash.initialized = true;
    /**
     * set up handling of flash external interface calls
     * create functions to map metadata to new format,
     * and handle media player events
     * @method initializeFlash
     * @ignore
     */
    flash.initialize = function() {
        flash.initialize = function() {}; // only call once
        var messageNameMap = {
            play: "unpause",
            seek: "setPlayheadTime"
        },
            swfobject = flash.getSWFObject(),
            makeWSwfObject = function(targetID, config) {
                var attributes = config.attributes || {},
                    params = config.params || {
                        allowFullScreen: true
                    },
                    flashVars = config.flashVars || {};
                attributes.data = core.getPath(config);
                // the parent element has the width and height in pixels.
                attributes.width = attributes.height = "100%";
                // we always want script access.
                params.allowScriptAccess = "always";
                flashVars.objectID = targetID; // TODO objectID is used by the player.
                params.flashVars = (function(fv) {
                    var s = "";
                    for(var p in fv) {
                        s += p + "=" + fv[p] + "&";
                    }
                    return s ? s.slice(0, -1) : "";
                })(flashVars);
                core.getPlayerInstance(targetID).element = swfobject.createSWF(attributes, params, targetID);
            },
            exitFullScreen = function() {
                try {
                    this.element.exitFullScreen();
                } catch(e) {
                    // fail silently. exit full screen introduced in Prime 1.12
                }
            },
            processMetadata = function(metadata, playlistItems, index, playlistMetadataItems) {
                var m = {},
                    rss;
                m.duration = metadata.duration;
                // TODO no live.
                m.live = false;
                m.isAd = metadata.isAd;
                m.isBumper = metadata.isBumper;
                if(index !== undefined && index !== null) {
                    m.index = index;
                } else if(playlistMetadataItems) {
                    m.index = function(guid) {
                        for(var i = playlistMetadataItems.length; i--;) {
                            if(playlistMetadataItems[i].rss.guid === guid) {
                                return i;
                            }
                        }
                        return -1;
                    }(metadata.guid);
                } else {
                    m.index = function(guid) {
                        for(var i = playlistItems.length; i--;) {
                            if(playlistItems[i].metaData.guid === guid) {
                                return i;
                            }
                        }
                        return -1;
                    }(metadata.guid);
                }
                rss = m.rss = {};
                rss.title = metadata.title;
                rss.description = metadata.description;
                rss.guid = metadata.guid;
                rss.link = metadata.link;
                rss.image = metadata.thumbnail;
                rss.group = {};
                rss.group.categories = (function() {
                    var displayData = metadata.displayData;
                    return {
                        isReportable: metadata.reportable,
                        source: displayData.source,
                        sourceLink: displayData.sourceLink,
                        seoHTMLText: displayData.seoHTMLText
                    };
                })();
                return m;
            },
            processPlaylistMetadata = function(metadata) {
                var m = {},
                    items = metadata.items,
                    numberOfItems = items.length,
                    i;
                m.description = metadata.description;
                m.title = metadata.title;
                m.link = metadata.link;
                m.items = [];
                for(i = numberOfItems; i--;) {
                    m.items[i] = processMetadata(items[i], null, i);
                }
                return m;
            },
            getPlaylistItemsLegacy = function(playlistItems) {
                var m = {
                    items: []
                },
                    numberOfItems = playlistItems.length,
                    i;
                for(i = numberOfItems; i--;) {
                    m.items[i] = processMetadata(playlistItems[i].metaData, null, i);
                }
                return m;
            },
            addFlashEvents = function(player) {
                var map = MTVNPlayer.Player.flashEventMap,
                    id = "player" + Math.round(Math.random() * 1000000),
                    element = player.element,
                    mapString = "MTVNPlayer.Player.flashEventMap." + id,
                    // this list of events is just for legibility. google closure compiler
                    // will in-line the strings
                    metadataEvent = MTVNPlayer.Events.METADATA,
                    stateEvent = MTVNPlayer.Events.STATE_CHANGE,
                    playlistCompleteEvent = MTVNPlayer.Events.PLAYLIST_COMPLETE,
                    readyEvent = MTVNPlayer.Events.READY,
                    mediaEnd = MTVNPlayer.Events.MEDIA_END,
                    mediaStart = MTVNPlayer.Events.MEDIA_START,
                    performanceEvent = MTVNPlayer.Events.PERFORMANCE,
                    onIndexChange = MTVNPlayer.Events.INDEX_CHANGE,
                    playheadUpdate = MTVNPlayer.Events.PLAYHEAD_UPDATE,
                    configurationAppliedEvent = MTVNPlayer.Events.CONFIGURATION_APPLIED,
                    videoLoadedEvent = MTVNPlayer.Events.VIDEO_LOADED;

                // the first metadata event will trigger the readyEvent
                map[id + metadataEvent] = function(metadata) {
                    var playlistItems = element.getPlaylist().items,
                        playlistMetadata = player.playlistMetadata,
                        processedMetadata = processMetadata(metadata, playlistItems, null, playlistMetadata ? playlistMetadata.items : null),
                        fireReadyEvent = false,
                        newIndex = processedMetadata.index,
                        lastIndex = playlistMetadata ? playlistMetadata.index : -1;
                    player.currentMetadata = processedMetadata;
                    if(!playlistMetadata) {
                        // this is our first metadata event
                        fireReadyEvent = true;
                        try {
                            playlistMetadata = processPlaylistMetadata(element.getPlaylistMetadata());
                        } catch(e) {
                            playlistMetadata = getPlaylistItemsLegacy(playlistItems);
                        }
                    }
                    if(newIndex !== -1) { // index is -1 for ads.
                        playlistMetadata.items[newIndex] = processedMetadata;
                        playlistMetadata.index = newIndex;
                        if(lastIndex !== newIndex) {
                            player.trigger(onIndexChange, newIndex);
                        }
                    }
                    player.playlistMetadata = playlistMetadata;
                    if(fireReadyEvent) {
                        player.ready = true;
                        try{
                            var playerConfig = element.getJSConfig();
                            MTVNPlayer.module("config").copyProperties(player.config, playerConfig);
                        }catch(e){
                            // method getJSConfig not implemented.
                        }
                        player.trigger(readyEvent, processedMetadata);
                    }
                    player.trigger(metadataEvent, processedMetadata);
                };
                element.addEventListener('METADATA', mapString + metadataEvent);
                //element.addEventListener('CONFIGURATION_APPLIED', mapString + configurationApplied);
                map[id + configurationAppliedEvent] = function() {
                    trace('CONFIGURATION_APPLIED');
                    player.trigger(configurationAppliedEvent);
                };
                element.addEventListener('CONFIGURATION_APPLIED', mapString + configurationAppliedEvent);
                
                map[id + videoLoadedEvent] = function() {
                    trace('VIDEO_LOADED');
                    player.trigger(videoLoadedEvent);
                };
                element.addEventListener('VIDEO_LOADED', mapString + videoLoadedEvent);
                
                //map[id + configurationAppliedEvent] = function() {
                //    player.trigger(configurationAppliedEvent);
                //};
                //
                map[id + stateEvent] = function(state) {
                    state = state.replace("playstates.", "");
                    player.state = state;
                    player.trigger(stateEvent, state);
                    player.trigger( + ":" + state, state);
                };
                element.addEventListener('STATE_CHANGE', mapString + stateEvent);
                map[id + playheadUpdate] = function(playhead) {
                    var lastPlayhead = Math.floor(player.playhead);
                    player.playhead = playhead;
                    player.trigger(playheadUpdate, playhead);
                    // support for cue points.
                    if(lastPlayhead != Math.floor(playhead)) {
                        player.trigger(playheadUpdate + ":" + Math.floor(playhead), playhead);
                    }
                };
                element.addEventListener('PLAYHEAD_UPDATE', mapString + playheadUpdate);
                map[id + playlistCompleteEvent] = function() {
                    player.trigger(playlistCompleteEvent);
                };
                element.addEventListener('PLAYLIST_COMPLETE', mapString + playlistCompleteEvent);
                
                map[id + performanceEvent] = function(performanceData) {
                  player.trigger(performanceEvent, performanceData);
                };
                element.addEventListener("PERFORMANCE", mapString + performanceEvent);
                map[id + mediaStart] = function() {
                    player.trigger(mediaStart);
                };
                // TODO does this fire for ads?
                element.addEventListener("READY", mapString + mediaStart);
                map[id + mediaEnd] = function() {
                    player.trigger(mediaEnd);
                };
                // yes, flash event is media ended unfort.
                element.addEventListener("MEDIA_ENDED", mapString + mediaEnd);
                // fired when the end slate is shown, if the player's configuration is set to do so.
                map[id + "onEndSlate"] = function(data) {
                    var endslateEvent = MTVNPlayer.module("ModuleLoader").Events.ENDSLATE;
                    player.trigger(endslateEvent, data);
                };
                element.addEventListener("ENDSLATE", mapString + "onEndSlate");
            };
        MTVNPlayer.Player.flashEventMap = {};
        /**
         * create an embed element
         * Run in the context of {@link MTVNPlayer.Player}
         * @method message
         * @ignore
         */
        this.create = function(player, exists) {
            var targetID = player.id,
                config = player.config;
            core.instances.push({
                source: targetID,
                player: player
            });
            if(!exists) {
                makeWSwfObject(targetID, config);
            }
        };
        /**
         * Send messages to the swf via flash external interface
         * Run in the context of {@link MTVNPlayer.Player}
         * @method message
         * @ignore
         */
        this.message = function(message) {
            if(!this.ready) {
                throw new Error("MTVNPlayer.Player." + message + "() called before player loaded.");
            }
            // translate api method to flash player method
            message = messageNameMap[message] || message;
            switch(message) {
            case "exitFullScreen":
                // needs to be screened
                exitFullScreen.call(this);
                return;
            case "goFullScreen":
                // do nothing, unsupported in flash
                return;
            default:
                break;
            }
            // pass up to two arguments
            if(arguments[1] !== undefined && arguments[2] !== undefined) {
                return this.element[message](arguments[1], arguments[2]);
            } else if(arguments[1] !== undefined) {
                return this.element[message](arguments[1]);
            } else {
                return this.element[message]();
            }
        };
        window.mtvnPlayerLoaded = function(e) {
            return function(id) {
                if(e) {
                    e(id);
                }
                var player = core.getPlayerInstance(id);
                core.executeCallbacks(player);
                addFlashEvents(player);
            };
        }(window.mtvnPlayerLoaded);
    };
})(window.MTVNPlayer);
(function(MTVNPlayer) {
    "use strict";
    // HTML5 Player Module
    var html5 = MTVNPlayer.module("html5");
    if(html5.initialized) {
        return;
    }
    html5.initialized = true;
    html5.initialize = function() {
        html5.initialize = function() {}; //only call this once;
        // private vars
        var core = MTVNPlayer.module("core"),
            addCSS = function(e, prop,value) {
                e.style.cssText+=prop+":"+value;
            },
            /**
             * return the iframe to it's original width and height.
             * @method exitFullScreen
             * @ignore
             * @param {MTVNPlayer.Player} player
             */
            exitFullScreen = function(player) {
                player.isFullScreen = false;
                var c = player.config,
                    e = player.containerElement;
                addCSS(e,"position","static");
                addCSS(e,"z-index","auto");
                addCSS(e,"width",c.width+"px");
                addCSS(e,"height",c.height+"px");
                player.trigger(MTVNPlayer.Events.FULL_SCREEN_CHANGE);
            },
            /**
             * @method goFullScreen
             * @ignore
             * @param {IFrameElement} iframeElement
             */
            goFullScreen = function(player) {
                var e = player.containerElement,
                    highestZIndex = player.config.highestZIndex,
                    cssText = player.config.fullScreenCssText;
                player.isFullScreen = true;
                e.style.cssText = cssText ? cssText : "position:fixed;left:0px;top:0px;z-index:" + (highestZIndex || 2147483645) + ";";
                addCSS(e,"width",window.innerWidth+"px");
                addCSS(e,"height",window.innerHeight+"px");
                window.scrollTo(0, 0);
                player.trigger(MTVNPlayer.Events.FULL_SCREEN_CHANGE);
            },
            jsonParse = function(str) {
                // choose method.
                jsonParse = function() {
                    var $ = core.$;
                    if(window.JSON) {
                        return function(str) {
                            if(str) {
                                return JSON.parse(str);
                            } else {
                                return null;
                            }
                        };
                    } else if($ && $.parseJSON) {
                        return function(str) {
                            return $.parseJSON(str);
                        };
                    } else {
                        return function() {
                            // no json parsing, fail silently.
                        };
                    }
                }();
                return jsonParse(str);
            },
            /**
             * @method getMessageData
             * @ignore
             */
            getMessageData = function(data) {
                return data.slice(data.indexOf(":") + 1);
            },
            /**
             * @method onMetadata
             * @ignore
             * @param {Object} data Event data
             * @param {MTVNPlayer.Player} player A player instance
             */
            onMetadata = function(data, player) {
                var obj = jsonParse(getMessageData(data)),
                    newIndex = obj.index,
                    oldIndex = player.playlistMetadata.index;
                player.currentMetadata = obj;
                if(newIndex !== -1) { // index is -1 for ads.
                    player.playlistMetadata.items[obj.index] = obj;
                    player.playlistMetadata.index = obj.index;
                    if(newIndex !== oldIndex) {
                        player.trigger(MTVNPlayer.Events.INDEX_CHANGE, newIndex);
                    }
                }
                player.trigger(MTVNPlayer.Events.METADATA, obj);
            },
            /**
             * @method handleMessage
             * @ignore
             */
            handleMessage = function(event) {
                var data = event.data,
                    player, playhead, events, eventTypes = MTVNPlayer.Events;
                if(data && data.indexOf && data.indexOf("logMessage:") === -1) {
                    player = core.getPlayerInstance(event.source);
                    if(player) {
                        events = player.events;
                        if(data.indexOf("playState:") === 0) {
                            player.state = getMessageData(data);
                            player.trigger(eventTypes.STATE_CHANGE, player.state);
                            player.trigger(eventTypes.STATE_CHANGE + ":" + player.state, player.state);
                        } else if(data.indexOf("config:") === 0) {
                            MTVNPlayer.module("config").copyProperties(player.config, jsonParse(getMessageData(data)));
                        } else if(data.indexOf("performance:") === 0) {
                            if(player.config.performance) {
                                core.processPerformance(player, jsonParse(getMessageData(data)));
                            }
                        } else if(data.indexOf("playlistComplete") === 0) {
                            player.trigger(eventTypes.PLAYLIST_COMPLETE);
                        } else if(data.indexOf("metadata:") === 0) {
                            onMetadata(data, player);
                        } else if(data.indexOf("mediaStart") === 0) {
                            player.trigger(eventTypes.MEDIA_START);
                        } else if(data.indexOf("mediaEnd") === 0) {
                            player.trigger(eventTypes.MEDIA_END);
                        } else if(data.indexOf("playheadUpdate") === 0) {
                            var lastPlayhead = Math.floor(player.playhead);
                            playhead = parseInt(getMessageData(data), 10);
                            player.playhead = playhead;
                            player.trigger(eventTypes.PLAYHEAD_UPDATE, playhead);
                            // support for cue points.
                            if(lastPlayhead != Math.floor(playhead)) {
                                player.trigger(eventTypes.PLAYHEAD_UPDATE + ":" + Math.floor(playhead), playhead);
                            }
                        } else if(data.indexOf("playlistMetadata:") === 0) {
                            player.playlistMetadata = jsonParse(getMessageData(data));
                        } else if(data === "onReady") {
                            player.ready = true;
                            var fv = player.config.flashVars;
                            if(fv && fv.sid) {
                                player.message.call(player, "setSSID:" + fv.sid);
                            }
                            core.executeCallbacks(player);
                            player.trigger(eventTypes.READY);
                        } else if(data === "fullscreen") {
                            if(player.isFullScreen) {
                                exitFullScreen(player);
                            } else {
                                goFullScreen(player);
                            }
                        } else if(data.indexOf("overlayRectChange:") === 0) {
                            player.trigger(eventTypes.OVERLAY_RECT_CHANGE, jsonParse(getMessageData(data)));
                        } else if(data.indexOf("onUIStateChange:") === 0) {
                            player.trigger(eventTypes.UI_STATE_CHANGE, jsonParse(getMessageData(data)));
                        } else if(data.indexOf("airplay") === 0) {
                            player.trigger(eventTypes.AIRPLAY);
                        } else if(data.indexOf("onEndSlate:") === 0) {
                            var endslateEvent = MTVNPlayer.module("ModuleLoader").Events.ENDSLATE;
                            player.trigger(endslateEvent, jsonParse(getMessageData(data)));
                        }
                    }
                }
            },
            createElement = function(player) {
                var config = player.config,
                    element = document.createElement("iframe"),
                    targetDiv = document.getElementById(player.id);
                element.setAttribute("id", player.id);
                element.setAttribute("src", core.getPath(config));
                element.setAttribute("frameborder", "0");
                element.setAttribute("scrolling", "no");
                element.setAttribute("type", "text/html");
                element.width = element.height = "100%";
                targetDiv.parentNode.replaceChild(element, targetDiv);
                player.element = element;
            };
        /**
         * create the player iframe
         * @method create
         * @ignore
         */
        this.create = function(player, exists) {
            if(!exists) {
                createElement(player);
            }
            core.instances.push({
                source: player.element.contentWindow,
                player: player
            });
            if(typeof window.addEventListener !== 'undefined') {
                window.addEventListener('message', handleMessage, false);
            } else if(typeof window.attachEvent !== 'undefined') {
                window.attachEvent('onmessage', handleMessage);
            }
        };
        /**
         * Send messages to the iframe via post message.
         * Run in the context of {@link MTVNPlayer.Player}
         * @method message
         * @ignore
         */
        this.message = function(message) {
            if(!this.ready) {
                throw new Error("MTVNPlayer.Player." + message + "() called before player loaded.");
            }
            switch(message) {
            case "goFullScreen":
                goFullScreen.apply(this, [this]);
                break;
            case "exitFullScreen":
                exitFullScreen.apply(this, [this]);
                break;
            default:
                if(arguments[1] !== undefined) {
                    message += ":" + arguments[1] + (arguments[2] !== undefined ? "," + arguments[2] : "");
                }
                return this.element.contentWindow.postMessage(message, "*");
            }
        };
        // set up orientationchange handler for iPad
        var n = window.navigator.userAgent.toLowerCase();
        if(n.indexOf("ipad") !== -1) {
            document.addEventListener("orientationchange", function() {
                var i, player = null,
                    instances = core.instances,
                    numberOfInstances = instances.length;
                for(i = numberOfInstances; i--;) {
                    player = instances[i].player;
                    if(player.isFullScreen) {
                        goFullScreen(player);
                    }
                }
            }, false);
        }
    };
})(window.MTVNPlayer);
(function(MTVNPlayer, $) {
    "use strict";
    if(!MTVNPlayer.Player) {
        /**
         * Events dispatched by {@link MTVNPlayer.Player}.
         *
         * All events have a target property (event.target) which is the player that dispatched the event.
         * Some events have a data property (event.data) which contains data specific to the event.
         *
         * # How to listen to events
         * Attached to player instance via {@link MTVNPlayer.Player#on}:
         *      player.on("metadata",function(event) {
         *             var metadata = event.data;
         *          }
         *      });
         * Passed in as an Object to the constructor {@link MTVNPlayer.Player}:
         *      var player = new MTVNPlayer.Player("video-player",config,{
         *              metadata:function(event) {
         *                  var metadata = event.data;
         *              }
         *      });
         * Passed as an Object into {@link MTVNPlayer#createPlayers}
         *      MTVNPlayer.createPlayers("div.MTVNPlayer",config,{
         *              metadata:function(event) {
         *                  var metadata = event.data;
         *                  // player that dispatched the event
         *                  var player = event.target;
         *                  var uri = event.target.config.uri;
         *              }
         *      });
         * Attached to player from {@link MTVNPlayer#onPlayer}
         *      MTVNPlayer.onPlayer(function(player){
         *              player.on("metadata",function(event) {
         *                  var metadata = event.data;
         *              }
         *      });
         *
         */
        MTVNPlayer.Events = {
            /**
             * @event metadata
             * Fired when the metadata changes. event.data is the metadata. Also see {@link MTVNPlayer.Player#currentMetadata}.
             *      player.on("metadata",function(event) {
             *          // inspect the metadata object to learn more (documentation on metadata is in progress)
             *          console.log("metadata",event.data);
             *
             *          // at anytime after the MTVNPlayer.Events#READY,
             *          // you can access the metadata on the player directly at MTVNPlayer.Player#currentMetadata
             *          console.log(event.data === player.currentMetadata); // true
             *      });
             */
            METADATA: "metadata",
            /**
             * @event stateChange
             * Fired when the play state changes. event.data is the state.
             *
             * You can also listen for a specific state only (v2.5.0).
             * ```
             * player.on("stateChange:paused",function(event){
             *  // callback fires when state equals paused.
             * });
             * ```
             */
            STATE_CHANGE: "stateChange",
            /**
             * @event mediaStart
             * Fired once per playlist item (content + ads/bumpers).
             */
            MEDIA_START: "mediaStart",
            /**
             * @event mediaEnd
             * Fired when a playlist item ends, this includes its prerolls and postrolls
             */
            MEDIA_END: "mediaEnd",
            /**
             * @event playheadUpdate
             * Fired as the playhead moves. event.data is the playhead time.
             *
             * Support for cue points (v2.5.0).
             * The below snippet fires once when the playhead crosses the 15 second mark.
             * The playhead time itself may be 15 plus a fraction.
             * ```
             * player.one("playheadUpdate:15",function(event){
             *  // callback
             * });
             * ```
             */
            PLAYHEAD_UPDATE: "playheadUpdate",
            /**
             * @event playlistComplete
             * Fired at the end of a playlist
             */
            PLAYLIST_COMPLETE: "playlistComplete",
            /**
             * @deprecated 1.5.0 Use {@link MTVNPlayer.Events#uiStateChange} instead
             * @event onOverlayRectChange
             * Fired when the GUI appears, event.data contains an {Object} {x:0,y:0,width:640,height:320}
             */
            OVERLAY_RECT_CHANGE: "overlayRectChange",
            /**
             * @event ready
             * Fired when the player has loaded and the metadata is available.
             * You can bind/unbind to events before this fires.
             * You can also invoke most methods before the event, the only exception is
             * {@link MTVNPlayer.Player#getEmbedCode}, since it returns a value which
             * won't be ready until the metadata is ready. Other methods will be queued and
             * then executed when the player is ready to invoke them.
             */
            READY: "ready",
            /**
             * @event uiStateChange
             * Fired when the UI changes its state, ususally due to user interaction, or lack of.
             *
             * event.data will contain information about the state.
             * - data.active <code>Boolean</code>: If true, user has activated the UI by clicking or touching.
             * If false, the user has remained idle with out interaction for a predetermined amount of time.
             * - data.overlayRect <code>Object</code>: the area that is not obscured by the GUI, a rectangle such as <code>{x:0,y:0,width:640,height:320}</code>
             */
            UI_STATE_CHANGE: "uiStateChange",
            /**
             * @event indexChange
             * Fired when the index of the current playlist item changes, ignoring ads.
             *
             * event.data contains the index
             */
            INDEX_CHANGE: "indexChange",
            /**
             * @event fullScreenChange
             * HTML5 only. Fired when the player.isFullScreen property has been changed.
             * The player may or may not visually be in full screen, it depends on its context.
             * Check {@link MTVNPlayer.Player#isFullScreen} to see if the player is in full screen or not.
             */
            FULL_SCREEN_CHANGE: "fullScreenChange",
            /**
             * @event airplay
             * @private
             * Fired when the airplay button is clicked
             */
            AIRPLAY: "airplay",
            /**
             * @event performance
             * @private
             * Fired when performance data has been collected.
             */
            PERFORMANCE: "performance",
            /**
             * @event configurationApplied
             * @private
             * Fired when a configuration is applied without loading a feed.
             * This is used by the Controller/Scheduler tool
             */
            CONFIGURATION_APPLIED: "configurationApplied",

            /**
             * @event videoLoaded
             * @private
             * Fired when a configuration is applied without loading a feed.
             * This is used by the Controller/Scheduler tool
             */
            VIDEO_LOADED: "videoLoaded"

        };
        /**
         * When a {@link MTVNPlayer.Events#stateChange} event is fired, the event's data property will be equal to one of these play states.
         * At the moment, there may be incongruities between html5 and flash state sequences.
         * Flash also has "initializing" and "connecting" states, which aren't available in the html5 player.
         */
        MTVNPlayer.PlayState = {
            /**
             * The video is playing.
             * @property
             */
            PLAYING: "playing",
            /**
             * The video is paused.
             * @property
             */
            PAUSED: "paused",
            /**
             * The video is seeking.
             * @property
             */
            SEEKING: "seeking",
            /**
             * The video is stopped.
             * @property
             */
            STOPPED: "stopped",
            /**
             * The video is buffering.
             * @property
             */
            BUFFERING: "buffering"
        };
        /**
         * @member MTVNPlayer
         * When using MTVNPlayer.createPlayers this config (see MTVNPlayer.Player.config) object will be used for every player created.
         * If MTVNPlayer.createPlayers is passed a config object, it will override anything defined in MTVNPlayer.defaultConfig.
         */
        MTVNPlayer.defaultConfig = MTVNPlayer.defaultConfig;
        /**
         * @member MTVNPlayer
         * When using MTVNPlayer.createPlayers this events object will be used for every player created.
         * If MTVNPlayer.createPlayers is passed a events object, it will override anything defined in MTVNPlayer.defaultEvents.
         */
        MTVNPlayer.defaultEvents = MTVNPlayer.defaultEvents;
        /**
         * @class MTVNPlayer.Player
         * The player object: use it to hook into events ({@link MTVNPlayer.Events}), call methods, and read properties.
         *      var player = new MTVNPlayer.Player(element/id,config,events);
         *      player.on("metadata",function(event){console.log("metadata",event.data);});
         *      player.pause();
         * @constructor
         * Create a new MTVNPlayer.Player
         * @param {String/HTMLElement} id-or-element Pass in a string id, or an actual HTMLElement
         * @param {Object} config config object, see: {@link MTVNPlayer.Player#config}
         * @param {Object} events Event callbacks, see: {@link MTVNPlayer.Events}
         * @returns MTVNPlayer.Player
         */
        MTVNPlayer.Player = (function(window) {
            // static methods variables
            var core = MTVNPlayer.module("core"),
                _ = MTVNPlayer.require("_"),
                throwError = function(message) {
                    throw new Error("Embed API:" + message);
                },
                document = window.document,
                Player, fixEventName = function(eventName) {
                    if(eventName && eventName.indexOf("on") === 0) {
                        if(eventName === "onUIStateChange") {
                            return "uiStateChange";
                        }
                        return eventName.charAt(2).toLowerCase() + eventName.substr(3);
                    }
                    return eventName;
                },
                /**
                 * @method checkEventName
                 * @private
                 * @param {String} eventName
                 * Check if the event exists in our list of events.
                 */
                checkEventName = function(eventName) {
                    if(eventName.indexOf(":") !== -1) {
                        eventName = eventName.split(":")[0];
                    }
                    var check = function(events) {
                            for(var event in events) {
                                if(events.hasOwnProperty(event) && events[event] === eventName) {
                                    return true; // has event
                                }
                            }
                            return false;
                        };
                    if(check(MTVNPlayer.Events) || check(MTVNPlayer.module("ModuleLoader").Events)) {
                        return;
                    }
                    throwError("event:" + eventName + " doesn't exist.");
                },
                /**
                 * @method checkEvents
                 * @private
                 * @param {Object} events
                 * Loop through the events, and check the event names
                 */
                checkEvents = function(events) {
                    for(var event in events) {
                        if(events.hasOwnProperty(event) && event.indexOf("on") === 0) {
                            events[fixEventName(event)] = events[event];
                            delete events[event];
                        }
                    }
                    for(event in events) {
                        if(events.hasOwnProperty(event)) {
                            checkEventName(event);
                        }
                    }
                },
                getEmbedCodeDimensions = function(config, el) {
                    // we don't need to know the exaxt dimensions, just enough to get the ratio
                    var width = config.width === "100%" ? el.clientWidth : config.width,
                        height = config.height === "100%" ? el.clientHeight : config.height,
                        Dimensions16x9 = {
                            width: 512,
                            height: 288
                        },
                        Dimensions4x3 = {
                            width: 360,
                            height: 293
                        },
                        aspect = width / height,
                        Diff4x3 = Math.abs(aspect - 4 / 3),
                        Diff16x9 = Math.abs(aspect - 16 / 9);
                    return Diff16x9 < Diff4x3 ? Dimensions16x9 : Dimensions4x3;
                },
                getEmbedCode = function() {
                    var config = this.config,
                        metadata = this.currentMetadata,
                        displayDataPrefix = "<p style=\"text-align:left;background-color:#FFFFFF;padding:4px;margin-top:4px;margin-bottom:0px;font-family:Arial, Helvetica, sans-serif;font-size:12px;\">",
                        displayMetadata = (function() {
                            if(!metadata) {
                                return "";
                            }
                            var copy = "",
                                categories = metadata.rss.group.categories,
                                source = categories.source,
                                sourceLink = categories.sourceLink,
                                seoHTMLText = categories.seoHTMLText;
                            if(source) {
                                if(sourceLink) {
                                    copy += "<b><a href=\"" + sourceLink + "\">" + source + "</a></b>";
                                } else {
                                    copy += "<b>" + source + "</b> ";
                                }
                            }
                            if(seoHTMLText) {
                                if(copy) {
                                    copy += "<br/>";
                                }
                                copy += "Get More: " + seoHTMLText;
                            }
                            if(copy) {
                                copy = displayDataPrefix + copy + "</p>";
                            }
                            return copy;
                        })(),
                        embedDimensions = getEmbedCodeDimensions(config, this.element),
                        embedCode = "<div style=\"background-color:#000000;width:{divWidth}px;\"><div style=\"padding:4px;\">" + "<iframe src=\"http://media.mtvnservices.com/embed/{uri}\" width=\"{width}\" height=\"{height}\" frameborder=\"0\"></iframe>" + "{displayMetadata}</div></div>";
                    embedCode = embedCode.replace(/\{uri\}/, config.uri);
                    embedCode = embedCode.replace(/\{width\}/, embedDimensions.width);
                    embedCode = embedCode.replace(/\{divWidth\}/, embedDimensions.width + 8);
                    embedCode = embedCode.replace(/\{height\}/, embedDimensions.height);
                    embedCode = embedCode.replace(/\{displayMetadata\}/, displayMetadata);
                    return embedCode;
                },
                getDim = function(dim) {
                    return isNaN(dim) ? dim : dim + "px";
                },
                createTarget = function() {
                    var target = document.createElement("div");
                    target.setAttribute("id", "mtvnPlayer" + Math.round(Math.random() * 10000000));
                    return target;
                };
            // end private vars
            /**
             * @member MTVNPlayer
             * @property {Boolean}
             * (Available in 2.2.4) Whether the player(s) that will be created will be html5 players,
             * otherwise they'll be flash players. This is determined by checking the user agent.
             */
            MTVNPlayer.isHTML5Player = core.isHTML5Player(window.navigator.userAgent);
            /**
             * @member MTVNPlayer
             * Whenever a player is created, the callback passed will fire with the player as the first
             * argument, providing an easy way to hook into player events in a decoupled way.
             * @param {Function} callback A callback fired when every player is created.
             *
             *     MTVNPlayer.onPlayer(function(player){
             *          // player is the player that was just created.
             *          // we can now hook into events.
             *          player.on("playheadUpdate",function(event) {
             *              // do something when "playheadUpdate" fires.
             *          }
             *
             *          // or look for information about the player.
             *          var uri = player.config.uri;
             *     });
             */
            MTVNPlayer.onPlayer = function(callback) {
                core.onPlayerCallbacks.push(callback);
            };
            /**
             * @member MTVNPlayer
             * (Available in 1.6.0) Remove a callback registered width {@link MTVNPlayer#onPlayer}
             * @param {Function} callback A callback fired when every player is created.
             */
            MTVNPlayer.removeOnPlayer = function(callback) {
                var index = core.onPlayerCallbacks.indexOf(callback);
                if(index !== -1) {
                    core.onPlayerCallbacks.splice(index, 1);
                }
            };
            /**
             * @member MTVNPlayer
             * Returns an array containing each {@link MTVNPlayer.Player} created.
             * @returns {Array} An array containing each {@link MTVNPlayer.Player} created.
             *      var players = MTVNPlayer.getPlayers();
             *      for(var i = 0, len = players.length; i < len; i++){
             *          var player = players[i];
             *          if(player.config.uri === "mgid:cms:video:thedailyshow.com:12345"){
             *              // do something
             *          }
             *      }
             */
            MTVNPlayer.getPlayers = function() {
                var result = [],
                    instances = core.instances,
                    i = instances.length;
                for(i; i--;) {
                    result.push(instances[i].player);
                }
                return result;
            };
            /**
             * @member MTVNPlayer
             * Returns a player that matches a specific uri
             * @returns MTVNPlayer.Player
             */
            MTVNPlayer.getPlayer = function(uri) {
                var instances = core.instances,
                    i = instances.length;
                for(i; i--;) {
                    if(instances[i].player.config.uri === uri) {
                        return instances[i].player;
                    }
                }
                return null;
            };
            /**
             * @member MTVNPlayer
             * Garbage collection, looks for all {@link MTVNPlayer.Player} that are no longer in the document,
             * and removes them from the hash map.
             */
            MTVNPlayer.gc = function() {
                var elementInDocument = function(element) {
                        while(element.parentNode) {
                            element = element.parentNode;
                            if(element == document) {
                                return true;
                            }
                        }
                        return false;
                    };
                var instances = core.instances,
                    i = instances.length;
                for(i; i--;) {
                    if(!elementInDocument(instances[i].player.element)) {
                        instances.splice(i, 1);
                    }
                }
            };
            /**
             * @member MTVNPlayer
             * Create players from elements in the page.
             * This should be used if you need to create multiple players that are the same.
             * @param {String} selector default is "div.MTVNPlayer"
             * @param {Object} config {@link MTVNPlayer.Player#config}
             * @param {Object} events {@link MTVNPlayer.Events}
             *
             * Example:
             *      <div class="MTVNPlayer" data-contenturi="mgid:cms:video:nick.com:920786"/>
             *      <script type="text/javascript">
             *              MTVNPlayer.createPlayers("div.MTVNPlayer",{width:640,height:320})
             *      </script>
             *  With events:
             *      <div class="MTVNPlayer" data-contenturi="mgid:cms:video:nick.com:920786"/>
             *      <script type="text/javascript">
             *              MTVNPlayer.createPlayers("div.MTVNPlayer",{width:640,height:320},{
             *                  onPlayheadUpdate:function(event) {
             *                      // do something custom
             *                      var player = event.target; // the player that dispatched the event
             *                      var playheadTime = event.data // some events have a data property with event-specific data
             *                      if(player.config.uri === "mgid:cms:video:thedailyshow.com:12345"){
             *                              // here we're checking if the player that dispatched the event has a specific URI.
             *                              // however, we also could have called MTVNPlayer#createPlayers with a different selector to distingush.
             *                      }
             *                  }
             *              });
             *      </script>
             */
            MTVNPlayer.createPlayers = function(selectorQuery, config, events) {
                if(!selectorQuery) {
                    selectorQuery = "div.MTVNPlayer";
                }
                var elements = MTVNPlayer.module("selector").find(selectorQuery);
                for(var i = 0, len = elements.length; i < len; i++) {
                    new MTVNPlayer.Player(elements[i], config, events);
                }
                return elements.length;
            };

            Player = function(elementOrId, config, events) {
                // in case constructor is called without new.
                if(!(this instanceof Player)) {
                    return new Player(elementOrId, config, events);
                }
                /** 
                 * @property {Boolean} ready
                 * The current ready state of the player
                 */
                this.ready = false;
                /**
                 * @property {String} state
                 * The current play state of the player.
                 */
                this.state = null;
                /**
                 * The current metadata is the metadata that is playing back at this moment.
                 * This could be ad metadata, or it could be content metadata.
                 * To access the metadata for the content items in the playlist see {@link MTVNPlayer.Player#playlistMetadata}
                 *
                 * *The best way to inspect the metadata is by using a modern browser and calling console.log("metadata",metadata);*
                 * @property {Object} currentMetadata
                 *
                 * @property {Number} currentMetadata.index
                 * The index of this metadata in relation to the playlist items. If isAd is true, the index will be -1.
                 *
                 * @property {Number} currentMetadata.duration
                 * The duration of the content. This will update as the duration becomes more accurate.
                 *
                 * @property {Boolean} currentMetadata.live
                 * Whether or not the video that's playing is a live stream.
                 *
                 * @property {Boolean} currentMetadata.isAd
                 * Whether or not the video that's playing is an advertisment.
                 *
                 * @property {Boolean} currentMetadata.isBumper
                 * Whether or not the video that's playing is a bumper.
                 *
                 * @property {Object} currentMetadata.rss
                 * The data in the rss feed maps to this object, mirroring the rss's hierarchy
                 * @property {String} currentMetadata.rss.title
                 * Corresponds to the rss title.
                 * @property {String} currentMetadata.rss.description
                 * Corresponds to the rss description.
                 * @property {String} currentMetadata.rss.link
                 * Corresponds to the rss link.
                 * @property {String} currentMetadata.rss.guid
                 * Corresponds to the rss guid.
                 * @property {Object} currentMetadata.rss.group
                 * Corresponds to the rss group.
                 * @property {Object} currentMetadata.rss.group.categories
                 * Corresponds to the rss group categories
                 *
                 */
                this.currentMetadata = null;
                /**
                 * @property {Object} playlistMetadata
                 * The playlistMetadata is the metadata about all the playlist items.
                 *
                 * @property {Array} playlistMetadata.items
                 * An array of metadata corresponding to each playlist item, see:{@link MTVNPlayer.Player#currentMetadata}
                 */
                this.playlistMetadata = null;
                /** @property {Number} playhead
                 * The current playhead time in seconds.
                 */
                this.playhead = 0;
                /**
                 * @property {HTMLElement} element
                 * The swf embed or the iframe element.
                 */
                this.element = null;
                /**
                 * @cfg {Object} config The main configuration object.
                 * @cfg {String} [config.uri] (required) The URI of the media.
                 * @cfg {Number} [config.width] (required) The width of the player
                 * @cfg {Number} [config.height] (required) The height of the player
                 * @cfg {Object} [config.flashVars] Flashvars are passed to the flash player
                 * @cfg {Object} [config.params] wmode, allowFullScreen, etc. (allowScriptAccess is always forced to true). See [Adobe Help][1]
                 * [1]: http://kb2.adobe.com/cps/127/tn_12701.html
                 * @cfg {Object} [config.attributes] see [Adobe Help][1]
                 * [1]: http://kb2.adobe.com/cps/127/tn_12701.html
                 * @cfg {String} [config.fullScreenCssText] When the HTML5 player goes full screen, this is the css that is set on the iframe.
                 * @cfg {String} [config.templateURL] (For TESTING) A URL to use for the embed of iframe src. The template var for uri is {uri}, such as http://site.com/uri={uri}.
                 *
                 */
                this.config = config || {};

                // record the start time for performance analysis.
                if(this.config.performance) {
                    this.config.performance = {
                        startTime: (new Date()).getTime()
                    };
                }

                /**
                 * @property {HTMLElement} isFullScreen
                 * HTML5 only. See {@link MTVNPlayer.Events#fullScreenChange}
                 */
                this.isFullScreen = false;
                // the module will create an iframe or a swf.
                var playerModule,
                // the player target will be replaced by an iframe or swf.
                playerTarget = createTarget();

                // the player target is going to go inside the containerElement.
                this.containerElement = _.isElement(elementOrId) ? elementOrId : document.getElementById(elementOrId);

                // TODO remove this and just use the playerTarget.id through out.
                this.id = playerTarget.id;

                // process the element and the config.
                this.config = MTVNPlayer.module("config").buildConfig(this.containerElement, this.config);

                // set the width and height.
                // if these were set already on the element, then
                this.containerElement.style.width = getDim(this.config.width);
                this.containerElement.style.height = getDim(this.config.height);

                // the player (a swf or an iframe), is a child of the element retrieved.
                this.containerElement.appendChild(playerTarget);

                this.events = MTVNPlayer.module("config").copyEvents(events || {}, MTVNPlayer.defaultEvents);
                this.isFlash = this.config.isFlash === undefined ? !MTVNPlayer.isHTML5Player : this.config.isFlash;
                // make sure the events are valid
                checkEvents(events);
                // The module contains platform specific code
                playerModule = MTVNPlayer.module(this.isFlash ? "flash" : "html5");
                playerModule.initialize();
                // do more initializing that's across player modules.
                core.playerInit(this, playerModule);

                // check for element before creating
                if(!this.containerElement) {
                    if(document.readyState === "complete") {
                        throwError("target div " + this.id + " not found");
                    } else {
                        if($) {
                            // wait for document ready, then try again.
                            (function(ref) {
                                $(document).ready(function() {
                                    if(document.getElementById(ref.id)) {
                                        playerModule.create(ref);
                                    } else {
                                        throwError("target div " + ref.id + " not found");
                                    }
                                });
                            })(this);
                        } else {
                            throwError("Only call new MTVNPlayer.Player(targetID,..) after the targetID element is in the DOM.");
                        }
                    }
                    return;
                } else {
                    playerModule.create(this);
                }
            };
            // public api
            Player.prototype = {
                /**
                 * 2.1.0 Use {@link MTVNPlayer.Player#element}
                 * @deprecated
                 * @returns HTMLElement the object/embed element for flash or the iframe element for the HTML5 Player.
                 */
                getPlayerElement: function() {
                    return this.element;
                },
                /**
                 * Begins playing or unpauses.
                 */
                play: function() {
                    this.message("play");
                },
                /**
                 * Pauses the media.
                 */
                pause: function() {
                    this.message("pause");
                },
                /**
                 * Mutes the volume
                 */
                mute: function() {
                    this.message("mute");
                },
                /**
                 * Returns the volume to the level before it was muted.
                 */
                unmute: function() {
                    this.message("unmute");
                },
                /**
                 * Play an item from the playlist specified by the index and optionally at a certain time in the clip.
                 * @param {Number} index
                 * @param {Number} startTime value between 0 and the duration of the current clip.
                 */
                playIndex: function(index, startTime) {
                    this.message("playIndex", index, startTime);
                },
                /**
                 * Play a new URI
                 * @param {String} uri
                 */
                playURI: function(uri) {
                    this.message("playUri", uri);
                },
                /**
                 * Change the volume
                 * @param {Number} value between 0 and 1.
                 */
                setVolume: function(volume) {
                    this.message("setVolume", volume);
                },
                /**
                 * Configure the player without playing a video
                 * @param {String} uri for the desired configuration.
                 */
                configure: function(uri) {
                    this.message("configure", uri);
                },
                /**
                 * Disable Ads
                 * @param {Boolean} disables ads when true.
                 */
                disableAds: function(value) {
                    this.message("disableAds", value);
                },
                /**
                 * SpoofAdURI
                 * @param {uri} When ads are requested use the given uri.
                 */
                spoofAdURI: function(uri) {
                    this.message("spoofAdURI", uri);
                },
                /**
                 * Load a video from a uri
                 * @param {String} uri for video to be loaded.
                 */
                loadVideo: function(uri) {
                    this.message("loadVideo",uri);
                },
                /**
                 * Load a playlist from a uri
                 * @param {String} uri for playlist to load
                 * @param {Number} index of desired playlist item.
                 */
                loadPlaylist: function(uri, index) {
                    this.message("loadPlaylist", uri, index);
                },
                /**
                 * Seeks to the time specified in seconds relative to the first clip.
                 * @param {Number} value between 0 and the duration of the playlist.
                 * The value is relative to the first clip. It's recommended that when
                 * seeking to another clip besides the first, use {@link MTVNPlayer.Player#playIndex}.
                 */
                seek: function(time) {
                    this.message("seek", time);
                },
                /**
                 * Returns the embed code used to share this instance of the player
                 * @return {String} the embed code as a string.
                 */
                getEmbedCode: function() {
                    return getEmbedCode.call(this);
                },
                /**
                 * Puts the player in full screen mode, does not work for the flash player do the flash restrictions.
                 */
                goFullScreen: function() {
                    this.message("goFullScreen");
                },
                /**
                 * Exits full screen and returns the player to its initial embed size.
                 * Does not work with Prime builds older than 1.12.
                 */
                exitFullScreen: function() {
                    this.message("exitFullScreen");
                },
                /**
                 * Show user clip screen.
                 * For flash only (api v2.4.0)
                 */
                createUserClip: function() {
                    return this.message("createUserClip");
                },
                /**
                 * Adds an event listener for an event.
                 * @deprecated use {@link MTVNPlayer.Player#on} instead.
                 * @param {String} eventName an {@link MTVNPlayer.Events}.
                 * @param {Function} callback The function to invoke when the event is fired.
                 */
                bind: function(eventName, callback) {
                    eventName = fixEventName(eventName);
                    checkEventName(eventName);
                    var currentEvent = this.events[eventName];
                    if(!currentEvent) {
                        currentEvent = callback;
                    } else if(currentEvent instanceof Array) {
                        currentEvent.push(callback);
                    } else {
                        currentEvent = [callback, currentEvent];
                    }
                    this.events[eventName] = currentEvent;
                },
                /**
                 * Removes an event listener
                 * @deprecated use {@link MTVNPlayer.Player#off} instead.
                 * @param {String} eventName an MTVNPlayer.Event.
                 * @param {Function} callback The function to that was bound to the event.
                 */
                unbind: function(eventName, callback) {
                    eventName = fixEventName(eventName);
                    checkEventName(eventName);
                    var i, currentEvent = this.events[eventName];
                    if(!currentEvent) {
                        return;
                    } else if(currentEvent instanceof Array) {
                        for(i = currentEvent.length; i--;) {
                            if(currentEvent[i] === callback) {
                                currentEvent.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        this.events[eventName] = null;
                    }
                },
                /**
                 * Adds an event listener for an event that will only fire once and then be removed.
                 * @deprecated use {@link MTVNPlayer.Player#one} instead.
                 * @param {String} eventName an {@link MTVNPlayer.Events}.
                 * @param {Function} callback The function to invoke when the event is fired.
                 */
                once: function(eventName, callback) {
                    var ref = this,
                        newCB = function(event) {
                            ref.unbind(eventName, newCB);
                            callback(event);
                        };
                    this.on(eventName, newCB);
                },
                /**
                 * Triggers an event off the player instance.
                 * @param {String} eventName an {@link MTVNPlayer.Events}.
                 * @param {Object} data Data will be available as event.data on the event object.
                 */
                trigger: function(type, data) {
                    core.processEvent(this.events[type], {
                        target: this,
                        data: data,
                        type: type
                    });
                }
            };
            /**
             * (v2.5.0) Adds an event listener for an event.
             * @param {String} eventName an {@link MTVNPlayer.Events}.
             * @param {Function} callback The function to invoke when the event is fired.
             */
            Player.prototype.on = Player.prototype.bind;
            /**
             * (v2.5.0) Removes an event listener
             * @param {String} eventName an MTVNPlayer.Event.
             * @param {Function} callback The function to that was bound to the event.
             */
            Player.prototype.off = Player.prototype.unbind;
            /**
             * (v2.5.0) Adds an event listener for an event that will only fire once and then be removed.
             * @param {String} eventName an {@link MTVNPlayer.Events}.
             * @param {Function} callback The function to invoke when the event is fired.
             */
            Player.prototype.one = Player.prototype.once;
            return Player;
        }(window));
        /**
         * @member MTVNPlayer
         * @property {Boolean}
         * Set to true after the API is loaded.
         */
        MTVNPlayer.isReady = true;
    }
})(window.MTVNPlayer, window.jQuery || window.Zepto);
// yepnope.js
// Version - 1.5.4pre
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//
( function ( window, doc, undef ) {

var docElement            = doc.documentElement,
    sTimeout              = window.setTimeout,
    firstScript           = doc.getElementsByTagName( "script" )[ 0 ],
    toString              = {}.toString,
    execStack             = [],
    started               = 0,
    noop                  = function () {},
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko               = ( "MozAppearance" in docElement.style ),
    isGeckoLTE18          = isGecko && !! doc.createRange().compareNode,
    insBeforeObj          = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera               = window.opera && toString.call( window.opera ) == "[object Opera]",
    isIE                  = !! doc.attachEvent && !isOpera,
    strJsElem             = isGecko ? "object" : isIE  ? "script" : "img",
    strCssElem            = isIE ? "script" : strJsElem,
    isArray               = Array.isArray || function ( obj ) {
      return toString.call( obj ) == "[object Array]";
    },
    isObject              = function ( obj ) {
      return Object(obj) === obj;
    },
    isString              = function ( s ) {
      return typeof s == "string";
    },
    isFunction            = function ( fn ) {
      return toString.call( fn ) == "[object Function]";
    },
    readFirstScript       = function() {
        if (!firstScript || !firstScript.parentNode) {
            firstScript = doc.getElementsByTagName( "script" )[ 0 ];
        }
    },
    globalFilters         = [],
    scriptCache           = {},
    prefixes              = {
      // key value pair timeout options
      timeout : function( resourceObj, prefix_parts ) {
        if ( prefix_parts.length ) {
          resourceObj['timeout'] = prefix_parts[ 0 ];
        }
        return resourceObj;
      }
    },
    handler,
    yepnope;

  /* Loader helper functions */
  function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == "loaded" || readyState == "complete" || readyState == "uninitialized" );
  }


  // Takes a preloaded js obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  function injectJs ( src, cb, attrs, timeout, /* internal use */ err, internal ) {
    
    var script = doc.createElement( "script" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    script.src = src;

    // Add our extra attributes to the script element
    for ( i in attrs ) {
        script.setAttribute( i, attrs[ i ] );
    }

    cb = internal ? executeStack : ( cb || noop );

    // Bind to load events
    script.onreadystatechange = script.onload = function () {

      if ( ! done && isFileReady( script.readyState ) ) {

        // Set done to prevent this function from being called twice.
        done = 1;
        cb();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };

    // 404 Fallback
    sTimeout(function () {
      if ( ! done ) {
        done = 1;
        // Might as well pass in an error-state if we fire the 404 fallback
        cb(1);
      }
    }, timeout );

    // Inject script into to document
    // or immediately callback if we know there
    // was previously a timeout error
    readFirstScript();
    err ? script.onload() : firstScript.parentNode.insertBefore( script, firstScript );
  }

  // Takes a preloaded css obj (changes in different browsers) and injects it into the head
  function injectCss ( href, cb, attrs, timeout, /* Internal use */ err, internal ) {

    // Create stylesheet link
    var link = doc.createElement( "link" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    cb = internal ? executeStack : ( cb || noop );

    // Add attributes
    link.href = href;
    link.rel  = "stylesheet";
    link.type = "text/css";

    // Add our extra attributes to the link element
    for ( i in attrs ) {
      link.setAttribute( i, attrs[ i ] );
    }

    if ( ! err ) {
      readFirstScript();
      firstScript.parentNode.insertBefore( link, firstScript );
      sTimeout(cb, 0);
    }
  }

  function executeStack ( ) {
    // shift an element off of the stack
    var i   = execStack.shift();
    started = 1;

    // if a is truthy and the first item in the stack has an src
    if ( i ) {
      // if it's a script, inject it into the head with no type attribute
      if ( i['t'] ) {
        // Inject after a timeout so FF has time to be a jerk about it and
        // not double load (ignore the cache)
        sTimeout( function () {
          (i['t'] == "c" ?  yepnope['injectCss'] : yepnope['injectJs'])( i['s'], 0, i['a'], i['x'], i['e'], 1 );
        }, 0 );
      }
      // Otherwise, just call the function and potentially run the stack
      else {
        i();
        executeStack();
      }
    }
    else {
      // just reset out of recursive mode
      started = 0;
    }
  }

  function preloadFile ( elem, url, type, splicePoint, dontExec, attrObj, timeout ) {

    timeout = timeout || yepnope['errorTimeout'];

    // Create appropriate element for browser and type
    var preloadElem = doc.createElement( elem ),
        done        = 0,
        firstFlag   = 0,
        stackObject = {
          "t": type,     // type
          "s": url,      // src
        //r: 0,        // ready
          "e": dontExec,// set to true if we don't want to reinject
          "a": attrObj,
          "x": timeout
        };

    // The first time (common-case)
    if ( scriptCache[ url ] === 1 ) {
      firstFlag = 1;
      scriptCache[ url ] = [];
    }

    function onload ( first ) {
      // If the script/css file is loaded
      if ( ! done && isFileReady( preloadElem.readyState ) ) {

        // Set done to prevent this function from being called twice.
        stackObject['r'] = done = 1;

        ! started && executeStack();

        if ( first ) {
          if ( elem != "img" ) {
            sTimeout(function(){ insBeforeObj.removeChild( preloadElem ) }, 50);
          }

          for ( var i in scriptCache[ url ] ) {
            if ( scriptCache[ url ].hasOwnProperty( i ) ) {
              scriptCache[ url ][ i ].onload();
            }
          }
          
          // Handle memory leak in IE
           preloadElem.onload = preloadElem.onreadystatechange = null;
        }
      }
    }


    // Setting url to data for objects or src for img/scripts
    if ( elem == "object" ) {
      preloadElem.data = url;
    
      // Setting the type attribute to stop Firefox complaining about the mimetype when running locally.
      // The type doesn't matter as long as it's real, thus text/css instead of text/javascript.
      preloadElem.setAttribute("type", "text/css");
    } else {
      preloadElem.src = url;

      // Setting bogus script type to allow the script to be cached
      preloadElem.type = elem;
    }

    // Don't let it show up visually
    preloadElem.width = preloadElem.height = "0";

    // Attach handlers for all browsers
    preloadElem.onerror = preloadElem.onload = preloadElem.onreadystatechange = function(){
      onload.call(this, firstFlag);
    };
    // inject the element into the stack depending on if it's
    // in the middle of other scripts or not
    execStack.splice( splicePoint, 0, stackObject );

    // The only place these can't go is in the <head> element, since objects won't load in there
    // so we have two options - insert before the head element (which is hard to assume) - or
    // insertBefore technically takes null/undefined as a second param and it will insert the element into
    // the parent last. We try the head, and it automatically falls back to undefined.
    if ( elem != "img" ) {
      // If it's the first time, or we've already loaded it all the way through
      if ( firstFlag || scriptCache[ url ] === 2 ) {
        readFirstScript();
        insBeforeObj.insertBefore( preloadElem, isGeckoLTE18 ? null : firstScript );

        // If something fails, and onerror doesn't fire,
        // continue after a timeout.
        sTimeout( onload, timeout );
      }
      else {
        // instead of injecting, just hold on to it
        scriptCache[ url ].push( preloadElem );
      }
    }
  }

  function load ( resource, type, dontExec, attrObj, timeout ) {
    // If this method gets hit multiple times, we should flag
    // that the execution of other threads should halt.
    started = 0;

    // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
    type = type || "j";
    if ( isString( resource ) ) {
      // if the resource passed in here is a string, preload the file
      preloadFile( type == "c" ? strCssElem : strJsElem, resource, type, this['i']++, dontExec, attrObj, timeout );
    } else {
      // Otherwise it's a callback function and we can splice it into the stack to run
      execStack.splice( this['i']++, 0, resource );
      execStack.length == 1 && executeStack();
    }

    // OMG is this jQueries? For chaining...
    return this;
  }

  // return the yepnope object with a fresh loader attached
  function getYepnope () {
    var y = yepnope;
    y['loader'] = {
      "load": load,
      "i" : 0
    };
    return y;
  }

  /* End loader helper functions */
  // Yepnope Function
  yepnope = function ( needs ) {

    var i,
        need,
        // start the chain as a plain instance
        chain = this['yepnope']['loader'];

    function satisfyPrefixes ( url ) {
      // split all prefixes out
      var parts   = url.split( "!" ),
      gLen    = globalFilters.length,
      origUrl = parts.pop(),
      pLen    = parts.length,
      res     = {
        "url"      : origUrl,
        // keep this one static for callback variable consistency
        "origUrl"  : origUrl,
        "prefixes" : parts
      },
      mFunc,
      j,
      prefix_parts;

      // loop through prefixes
      // if there are none, this automatically gets skipped
      for ( j = 0; j < pLen; j++ ) {
        prefix_parts = parts[ j ].split( '=' );
        mFunc = prefixes[ prefix_parts.shift() ];
        if ( mFunc ) {
          res = mFunc( res, prefix_parts );
        }
      }

      // Go through our global filters
      for ( j = 0; j < gLen; j++ ) {
        res = globalFilters[ j ]( res );
      }

      // return the final url
      return res;
    }

     function getExtension ( url ) {
      //The extension is always the last characters before the ? and after a period.
      //The previous method was not accounting for the possibility of a period in the query string.
      var b = url.split('?')[0];
      return b.substr(b.lastIndexOf('.')+1);
    }

    function loadScriptOrStyle ( input, callback, chain, index, testResult ) {
      // run through our set of prefixes
      var resource     = satisfyPrefixes( input ),
          autoCallback = resource['autoCallback'],
          extension    = getExtension( resource['url'] );

      // if no object is returned or the url is empty/0 just exit the load
      if ( resource['bypass'] ) {
        return;
      }

      // Determine callback, if any
      if ( callback ) {
        callback = isFunction( callback ) ?
          callback :
          callback[ input ] ||
          callback[ index ] ||
          callback[ ( input.split( "/" ).pop().split( "?" )[ 0 ] ) ];
      }

      // if someone is overriding all normal functionality
      if ( resource['instead'] ) {
        return resource['instead']( input, callback, chain, index, testResult );
      }
      else {
        // Handle if we've already had this url and it's completed loaded already
        if ( scriptCache[ resource['url'] ] && resource['reexecute'] !== true) {
          // don't let this execute again
          resource['noexec'] = true;
        }
        else {
          scriptCache[ resource['url'] ] = 1;
        }

        // Throw this into the queue
        input && chain.load( resource['url'], ( ( resource['forceCSS'] || ( ! resource['forceJS'] && "css" == getExtension( resource['url'] ) ) ) ) ? "c" : undef, resource['noexec'], resource['attrs'], resource['timeout'] );

        // If we have a callback, we'll start the chain over
        if ( isFunction( callback ) || isFunction( autoCallback ) ) {
          // Call getJS with our current stack of things
          chain['load']( function () {
            // Hijack yepnope and restart index counter
            getYepnope();
            // Call our callbacks with this set of data
            callback && callback( resource['origUrl'], testResult, index );
            autoCallback && autoCallback( resource['origUrl'], testResult, index );

            // Override this to just a boolean positive
            scriptCache[ resource['url'] ] = 2;
          } );
        }
      }
    }

    function loadFromTestObject ( testObject, chain ) {
        var testResult = !! testObject['test'],
            group      = testResult ? testObject['yep'] : testObject['nope'],
            always     = testObject['load'] || testObject['both'],
            callback   = testObject['callback'] || noop,
            cbRef      = callback,
            complete   = testObject['complete'] || noop,
            needGroupSize,
            callbackKey;
            
        // Reusable function for dealing with the different input types
        // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
        // much smaller than the functional equivalent in this case.
        function handleGroup ( needGroup, moreToCome ) {
          if ( '' !== needGroup && ! needGroup ) {
            // Call the complete callback when there's nothing to load.
            ! moreToCome && complete();
          }
          // If it's a string
          else if ( isString( needGroup ) ) {
            // if it's a string, it's the last
            if ( !moreToCome ) {
              // Add in the complete callback to go at the end
              callback = function () {
                var args = [].slice.call( arguments );
                cbRef.apply( this, args );
                complete();
              };
            }
            // Just load the script of style
            loadScriptOrStyle( needGroup, callback, chain, 0, testResult );
          }
          // See if we have an object. Doesn't matter if it's an array or a key/val hash
          // Note:: order cannot be guaranteed on an key value object with multiple elements
          // since the for-in does not preserve order. Arrays _should_ go in order though.
          else if ( isObject( needGroup ) ) {
            // I hate this, but idk another way for objects.
            needGroupSize = (function(){
              var count = 0, i
              for (i in needGroup ) {
                if ( needGroup.hasOwnProperty( i ) ) {
                  count++;
                }
              }
              return count;
            })();

            for ( callbackKey in needGroup ) {
              // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
              // patch if needed. Kangax has a nice shim for it. Or just remove the check
              // and promise not to extend the object prototype.
              if ( needGroup.hasOwnProperty( callbackKey ) ) {
                // Find the last added resource, and append to it's callback.
                if ( ! moreToCome && ! ( --needGroupSize ) ) {
                  // If this is an object full of callbacks
                  if ( ! isFunction( callback ) ) {
                    // Add in the complete callback to go at the end
                    callback[ callbackKey ] = (function( innerCb ) {
                      return function () {
                        var args = [].slice.call( arguments );
                        innerCb && innerCb.apply( this, args );
                        complete();
                      };
                    })( cbRef[ callbackKey ] );
                  }
                  // If this is just a single callback
                  else {
                    callback = function () {
                      var args = [].slice.call( arguments );
                      cbRef.apply( this, args );
                      complete();
                    };
                  }
                }
                loadScriptOrStyle( needGroup[ callbackKey ], callback, chain, callbackKey, testResult );
              }
            }
          }
        }

        // figure out what this group should do
        handleGroup( group, !!always || !!testObject['complete']);

        // Run our loader on the load/both group too
        // the always stuff always loads second.
        always && handleGroup( always );

  // If complete callback is used without loading anything
        !always && !!testObject['complete'] && handleGroup('');

    }

    // Someone just decides to load a single script or css file as a string
    if ( isString( needs ) ) {
      loadScriptOrStyle( needs, 0, chain, 0 );
    }
    // Normal case is likely an array of different types of loading options
    else if ( isArray( needs ) ) {
      // go through the list of needs
      for( i = 0; i < needs.length; i++ ) {
        need = needs[ i ];

        // if it's a string, just load it
        if ( isString( need ) ) {
          loadScriptOrStyle( need, 0, chain, 0 );
        }
        // if it's an array, call our function recursively
        else if ( isArray( need ) ) {
          yepnope( need );
        }
        // if it's an object, use our modernizr logic to win
        else if ( isObject( need ) ) {
          loadFromTestObject( need, chain );
        }
      }
    }
    // Allow a single object to be passed in
    else if ( isObject( needs ) ) {
      loadFromTestObject( needs, chain );
    }
  };

  // This publicly exposed function is for allowing
  // you to add functionality based on prefixes on the
  // string files you add. 'css!' is a builtin prefix
  //
  // The arguments are the prefix (not including the !) as a string
  // and
  // A callback function. This function is passed a resource object
  // that can be manipulated and then returned. (like middleware. har.)
  //
  // Examples of this can be seen in the officially supported ie prefix
  yepnope['addPrefix'] = function ( prefix, callback ) {
    prefixes[ prefix ] = callback;
  };

  // A filter is a global function that every resource
  // object that passes through yepnope will see. You can
  // of course conditionally choose to modify the resource objects
  // or just pass them along. The filter function takes the resource
  // object and is expected to return one.
  //
  // The best example of a filter is the 'autoprotocol' officially
  // supported filter
  yepnope['addFilter'] = function ( filter ) {
    globalFilters.push( filter );
  };

  // Default error timeout to 10sec - modify to alter
  yepnope['errorTimeout'] = 1e4;

  // Webreflection readystate hack
  // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
  // if the readyState is null and we have a listener
  if ( doc.readyState == null && doc.addEventListener ) {
    // set the ready state to loading
    doc.readyState = "loading";
    // call the listener
    doc.addEventListener( "DOMContentLoaded", handler = function () {
      // Remove the listener
      doc.removeEventListener( "DOMContentLoaded", handler, 0 );
      // Set it to ready
      doc.readyState = "complete";
    }, 0 );
  }

  // Attach loader &
  // Leak it
  window['yepnope'] = getYepnope();

  // Exposing executeStack to better facilitate plugins
  window['yepnope']['executeStack'] = executeStack;
  window['yepnope']['injectJs'] = injectJs;
  window['yepnope']['injectCss'] = injectCss;

})( this, document );
/**
 * @private
 * @ignore
 * Trying something new here. A way to keep the API clean for utility methods specific to things like reporting.
 * These modules are on a player, as opposed to the modules on MTVNPlayer.
 */
(function(MTVNPlayer) {
    "use strict";
    MTVNPlayer.onPlayer(function(player) {
        player.module("reporting").logGUIEvent = function(eventName, eventData) {
            player.message("logGUIEvent", eventName, eventData);
        };
    });
})(window.MTVNPlayer);
 (function(MTVNPlayer, $) {
     "use strict";
     if($) {
         var eventPrefix = "MTVNPlayer:",
             // support for MTVN.config.player
             legacyConfig = function(MTVN) {
                 if(MTVN && MTVN.config && MTVN.config.player) {
                     return MTVN.config.player;
                 }
             }(window.MTVN),
             // default config creates players at 100% width and height,
             // also copy the properties from MTVN.player.config or MTVNPlayer.defaultConfig.
             defaultConfig = MTVNPlayer.module("config").copyProperties({
                 "width": "100%",
                 "height": "100%"
             }, legacyConfig || MTVNPlayer.defaultConfig),
             // inject styles once.
             setStyles = function() {
                 setStyles = function() {};
                 var rules = "\n.MTVNPlayer_placeholder {cursor:pointer; position: relative;}\n" + ".MTVNPlayer_placeholder_button {\n" + "position:absolute;\n" + "height: 100%;\n" + "width: 100%;\n" + "top:0;\n" + "left:0;\n" + "background: no-repeat url(http://media.mtvnservices.com/player/images/Button_playBig_upSkin.png) center;\n" + "}\n" + "\n" + ".MTVNPlayer_placeholder_button:hover {\n" + "background-image: url(http://media.mtvnservices.com/player/images/Button_playBig_overSkin.png)\n" + "}\n";
                 MTVNPlayer.module("core").appendStyle(rules);
             },
             // allow $("MTVNPlayer").trigger("MTVNPlayer:playIndex",[0,20]);.
             mapMethods = function(el) {
                 var player = el.data("player"),
                     invoke = function(event, arg1, arg2) {
                         var method = event.type.replace(eventPrefix, "");
                         player[method].apply(player, [arg1, arg2]);
                     };
                 for(var prop in MTVNPlayer.Player.prototype) {
                     el.bind(eventPrefix + prop, invoke);
                 }
             },
             // creates a player and hooks up
             createPlayer = function($el) {
                 var config = MTVNPlayer.module("config").buildConfig($el[0], defaultConfig),
                     player;
                 player = new MTVNPlayer.Player($el[0], config);
                 $el.data("player", player);
                 player.$el = $el;
                 mapMethods($el);
             };
         // main plugin function
         $.fn.player = function(options) {
             // callback is fired after an MTVNPlayer is created.
             var callback = $.isFunction(options) ? options : function() {},
                 // first we look for .MTVNPlayer, then we refine to .MTVNPlayers with contenturis.
                 self = this.not(function() {
                     return $(this).data("contenturi") ? false : true;
                 });
             if(self.length > 0) {
                 // prepare placeholders.
                 self.each(function() {
                     var $el = $(this);
                     if(!MTVNPlayer.isHTML5Player && $el.children().length > 0) { // if element has children, assume placeholders.
                         // inject placeholder styles.
                         setStyles();
                         // wrap the placeholder and add the button.
                         $el.html(function(idx, old) {
                             return '<div class="MTVNPlayer_placeholder">' + old + '<div class=\"MTVNPlayer_placeholder_button\"></div></div>';
                         });
                         // when clicked, create a player.
                         $el.delegate("div.MTVNPlayer_placeholder", "click", function(e) {
                             e.preventDefault();
                             // store markup for later use
                             $el.find("div.MTVNPlayer_placeholder").hide();
                             $el.bind("MTVNPlayer:showPlaceholder", function() {
                                 $el.children().not("div.MTVNPlayer_placeholder").remove();
                                 $el.find("div.MTVNPlayer_placeholder").show();
                                 delete $el.data().player;
                             });
                             $el.data("autoplay", true);
                             createPlayer($el);
                             callback();
                         });
                     } else { // else add the div for the player to grow into.
                         $el.empty();
                         createPlayer($el);
                         callback();
                     }
                 });
             } else {
                 // nothing happened.
                 callback();
             }
         };
     }
 })(window.MTVNPlayer, window.jQuery || window.Zepto);
(function(MTVNPlayer, yepnope) {
    var _ = MTVNPlayer.require("_"),
        ModuleLoader = MTVNPlayer.module("ModuleLoader"),
        versionIsMinimum = MTVNPlayer.module("config").versionIsMinimum,
        provideJQuery = function() {
            // provide $ if it's on the window
            if(!MTVNPlayer.has("$")) {
                var $ = window.jQuery;
                // TODO we can lower this version if we want to test first.
                if($ && versionIsMinimum("1.9.0", $.fn.jquery)) {
                    MTVNPlayer.provide("$", $);
                }
            }
        },
        executeCallbacks = function(callbacks) {
            while(callbacks.length > 0) {
                callbacks.shift()();
            }
        },
        EndslateModule = {
            callbacks: [],
            eventName: "endslate",
            loadModule: _.once(function(module) {
                // store the current $.
                var $ = window.$;
                // build the paths
                // we want to be able to override this for testing w/o updating the confi
                var js = this.js || module.url,
                    css = this.css || module.css;
                provideJQuery();
                // we removed yepnope from the window,
                // and yepnope tries to reference window.yepnope in its own function (unfortunately)
                // so we make a dummy object providing that reference.
                yepnope.call({
                    yepnope: yepnope
                }, {
                    load: ModuleLoader.getDependencyList(module.dependencies).concat([js, css]),
                    callback: function() {
                        provideJQuery();
                    },
                    complete: function() {
                        // reset the window $ to what it was before loading.
                        window.$ = $;
                        executeCallbacks(EndslateModule.callbacks);
                    }
                });
            }),
            onModuleRequested: function(event) {
                var player = event.target;
                // add callback
                this.callbacks.push(function() {
                    new(MTVNPlayer.require("endslate"))({
                        config: event.data,
                        player: player
                    });
                });
                if(MTVNPlayer.has("endslate")) {
                    executeCallbacks(this.callbacks);
                } else {
                    this.loadModule(player.config.module.endslate);
                }
            }
        };
    // bind
    _.bindAll(EndslateModule);
    /**
     * @ignore
     * builds an array of urls for dependencies that aren't loaded.
     */
    ModuleLoader.getDependencyList = function(dependencies) {
        var load = [];
        _(dependencies).each(function(value, id) {
            // check if the dependency is loaded.
            if(!MTVNPlayer.has(id)) {
                load.push(value.url);
            }
        });
        return load;
    };
    // Exports
    ModuleLoader.Events = {
        ENDSLATE: EndslateModule.eventName
    };
    // Export module configs so they can be adjusted for testing.
    ModuleLoader.EndslateModule = EndslateModule;
    /**
     * @ignore
     * When any player is created, listen for an end slate event
     */
    MTVNPlayer.onPlayer(function(player) {
        player.bind(EndslateModule.eventName, EndslateModule.onModuleRequested);
    });
})(window.MTVNPlayer, window.yepnope);
(function(MTVNPlayer) {
    "use strict";
    // return any dependencies the Embed API may have leaked into global.
    MTVNPlayer.noConflict();
    // remove the noConflict function from the api 
    delete MTVNPlayer.noConflict;
    // execute any on API callbacks.
    if (typeof MTVNPlayer.onAPIReady === "function") {
        MTVNPlayer.onAPIReady();
    }
})(window.MTVNPlayer);
MTVNPlayer.version="2.6.3";MTVNPlayer.build="02/20/2013 09:02:27";