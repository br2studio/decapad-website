/**
 * Assistive alert - v1.0
 * Copyright 2018 Abel Brencsan
 * Released under the MIT License
 */

var AssistiveAlert = (function(){

	'use strict';

	var options = {
		wrapper: null,
		timeout: 7000
	};

	var alertTimeout;

	/**
	* Initialize assistive alerts (public)
	*/
	var init = function(givenOptions) {
		if (typeof givenOptions !== 'object') throw 'Assistive alert options must be an object';
		if (typeof givenOptions.wrapper !== 'object') throw 'Assistive alert "wrapper" option must be an object';
		for (var key in options) {
			if (givenOptions.hasOwnProperty(key)) {
				options[key] = givenOptions[key];
			}
		}
		options.wrapper.setAttribute('role', 'log');
		options.wrapper.setAttribute('aria-live', 'assertive');
		options.wrapper.setAttribute('aria-relevant', 'additions');
		options.wrapper.setAttribute('aria-atomic', 'true');
	};

	/**
	* Add alert (public)
	*/
	var add = function(alert) {
		options.wrapper.innerText = alert;
		clearTimeout(alertTimeout);
		alertTimeout = setTimeout(function() {
			options.wrapper.innerText = '';
		}, options.timeout);
	}

	return {
		init: init,
		add: add
	};

})();
