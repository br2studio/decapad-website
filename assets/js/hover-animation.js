/**
 * Hover animation - v1.0
 * Copyright 2018 Abel Brencsan
 * Released under the MIT License
 */

var HoverAnimation = function(options) {

	'use strict';

	// Test required options
	if (typeof options.element !== 'object') throw 'Dismiss "element" option must be an object';
	if (typeof options.target !== 'object') throw 'Dismiss "target" option must be an object';

	// Default hover animation instance options
	var defaults = {
		element: null,
		target: null,
		initCallback: null,
		destroyCallback: null,
		isAnimatinClass: 'is-animating'
	};

	// Extend hover animation instance options with defaults
	for (var key in defaults) {
		this[key] = (options.hasOwnProperty(key)) ? options[key] : defaults[key];
	}

	// Hover animation instance variables
	this.isInitialized = false;

};

HoverAnimation.prototype = function () {

	'use strict';

	var hoverAnimation = {

		/**
		* Initialize hover animation (public)
		*/
		init: function() {
			if (this.isInitialized) return;
			this.handleEvent = function(event) {
				hoverAnimation.handleEvents.call(this, event);
			};
			this.element.addEventListener('mouseenter', this);
			this.target.addEventListener('animationend', this);
			this.isInitialized = true;
			if (this.initCallback) this.initCallback.call(this);
		},

		/**
		* Handle events (private)
		* On element mouseenter: add animating class to target element
		* On animation end: Remove animating class from target element
		* @param event object
		*/
		handleEvents: function(event) {
			switch(event.type) {
				case 'mouseenter':
					if (this.element.contains(event.target)) {
						this.target.classList.add(this.isAnimatinClass);
					}
					break;
				case 'animationend':
					if (event.target == this.target) {
						this.target.classList.remove(this.isAnimatinClass);
					}
					break;
			}
		},

		/**
		* Destroy notice (public)
		*/
		destroy: function() {
			if (!this.isInitialized) return;
			this.element.removeEventListener('mouseover', this);
			this.target.removeEventListener('animationend', this);
			this.isInitialized = false;
			if (this.destroyCallback) this.destroyCallback.call(this);
		},

		/**
		 * Get value of "isInitialized" (public)
		 */
		getIsInitialized: function() {
			return this.isInitialized;
		}
	};

	return {
		init: hoverAnimation.init,
		destroy: hoverAnimation.destroy,
		getIsInitialized: hoverAnimation.getIsInitialized
	};

}();
