var VIACOM = VIACOM || {};

/**
 * Utility class to make cross-origin AJAX requests (CORS) that works in both IE and
 * other browsers. One public function is exposed to perform a GET request.
 * 
 * Sample usage:
 * Cors.get('http://www.whatever.com/foo.json', {
 *   success: function(response) { alert('Got it: ' + response); },
 *   failure: function() { alert('Oops'); },
 *   timeout: function() { alert('Took too long'); }
 *   parseJson: true
 * });
 * 
 * Use the parseJson option if you want to parse the response as JSON and return the
 * result as an object. If parsing fails, the failure callback will be invoked. If parseJson
 * is false (or not set), the response passed to the success callback will be the raw
 * response text (string).
 * 
 * Known limitations:
 * - Errors can't be fully surfaced due to limitations of IE's XDomainRequest object,
 *   which gives you access to neither the status code nor the response body.
 * - POSTs are not supported (not needed at the time of implementation).
 * - withCredentials is not supported, so cookies and auth headers will not be included
 *   in the request.
 */
VIACOM.Cors = (function() {
  
  // Check if XDomainRequest exists (for IE)
  var useXdr = (window.XDomainRequest != null);
  
  // Gets a URL via AJAX using the provided options. See above for a description of
  // available options.
  var get = function(url, options) {
    if (useXdr) {
      getWithXdr(url, options);
    }
    else {
      getWithXhr(url, options  );
    }
  };
  
  // Uses the XDomainRequest object (IE's cross-domain XHR implementation)
  var getWithXdr = function(url, options) {
    var xdr = new XDomainRequest();
    xdr.timeout = (options['timeoutSeconds'] ? options.timeoutSeconds * 1000 : 0);
    xdr.onerror = (options['failure'] ? options.failure : null);
    xdr.ontimeout = (options['timeout'] ? options.timeout : null);
    xdr.onload = function() {
      handleSuccess(xdr.responseText, options);
    };
    xdr.open("get", url);
    xdr.send();
  };
  
  // Uses the standard XMLHttpRequest Level 2 object to make a cross-domain AJAX
  // request.
  var getWithXhr = function(url, options) {
    var xhr = new XMLHttpRequest();
    // Not all browsers support the timeout property on XHR natively, so
    // we need to do this instead
    var timeoutId = 0;
    if (options['timeoutSeconds']) {
      timeoutId = window.setTimeout(function() {
        xhr.abort();
        if (options['timeout']) {
          options.timeout();
        }
      }, options.timeoutSeconds * 1000);
    }
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) { // DONE
        if (timeoutId > 0) {
          window.clearTimeout(timeoutId);
        }
        if (xhr.status == 200) {
          handleSuccess(xhr.responseText, options);
        }
        else if ((xhr.status == 0) || (xhr.status >= 400)) {
          if (options['failure']) {
            options.failure();
          }          
        }
      }
    };
    xhr.open("get", url);
    xhr.send();
  };
  
  // Helper function to handle a successful response. It will automatically
  // evaluate a JSON document in the body of the response, if the parseJson
  // option is true.
  var handleSuccess = function(response, options) {
    if (options['parseJson'] && options.parseJson == true) {
      try {
        response = eval('(' + response + ')');
      }
      catch (e) {
        if (options['failure']) {
          options.failure();
          return;
        }
      }
    }
    if (options['success']) {
      options.success(response);
    }
  };

  // Return object with "public" functions
  return {
    "get": get
  };
}());

