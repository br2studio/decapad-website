/**
 * App - v1.0
 * Copyright 2018 Abel Brencsan
 * Released under the MIT License
 */

var app = {

	// App settings
	isTouch: false,

	// App level modules
	offsetNav: null,
	autocomplete: null,

	// Page level modules
	modals: [],
	sliders: [],
	hoverAnimations: [],

	// Breakpoints as media queries
	breakpoints: {
		large: '(max-width: 82em)',
		medium: '(max-width: 62em)',
		small: '(max-width: 47em)',
		xsmall: '(max-width: 32em)'
	},

	/**
	 * Initialize app
	 */
	init: function(pages) {

		// Detect JavaScript is enabled
		document.body.classList.remove('no-js');

		// Detect page has loaded
		document.body.classList.add('is-loading');
		window.addEventListener('load', function() {
			document.body.classList.remove('is-loading');
		});

		// Check offline status
		if (!navigator.onLine) {
			document.body.classList.add('is-offline');
		}
		window.addEventListener('offline', function(event) {
			document.body.classList.add('is-offline');
		});
		window.addEventListener('online', function(event) {
			document.body.classList.remove('is-offline');
		});

		window.addEventListener('touchstart', function touchDetect() {
			app.isTouch = true;
			document.body.classList.remove('no-touch');
			window.removeEventListener('touchstart', touchDetect);
		});

		// Detect touch screen
		window.addEventListener('pointerdown', function pointerTouchDetect(event) {
			if (event.pointerType != 'mouse') {
				app.isTouch = true;
				document.body.classList.remove('no-touch');
			}
			window.removeEventListener('touchstart', pointerTouchDetect);
		});

		// Breakpoint has changed
		for (var key in app.breakpoints) {
			window.matchMedia(app.breakpoints[key]).addListener(app.onBreakpointChange);
		}

		// Initialize global modules
		FocusTracker.init();
		Icons.init();
		LazyImages.init({
			sourceAttribute: 'data-lazy-image-src'
		});
		AssistiveAlert.init({
			wrapper: document.querySelector('[data-assistive-alert]')
		});

		// Initialize app level modules
		app.initOffsetNav();
		app.initSmoothScrolls();
		
		// Initialize page level modules
		app.initModals(document);
		app.initSliders(document);
		app.initHoverAnimations(document);
		app.addLazyImages(document);

	},

	/**
	 * Initialize elements with "data-modal-type" attribute as modals
	 */
	initModals: function(rootElement) {
		var customClasses = [];
		var modalElements = document.querySelectorAll('[data-modal-type]');
		for (var i = 0; i < modalElements.length; i++) {
			if (modalElements[i].hasAttribute('data-modal-custom-classes')) {
				customClasses = modalElements[i].getAttribute('data-modal-custom-classes').split(/,\s*/);
			}
			app.modals[i] = new Modal({
				type: modalElements[i].getAttribute('data-modal-type'),
				source: modalElements[i].getAttribute('data-modal-source') || modalElements[i].getAttribute('href'),
				customCloseTriggerSelector: '[data-modal-close-trigger]',
				customAcceptTriggerSelector: '[data-modal-accept-trigger]',
				customClasses: customClasses,
				openAnimationName: 'modal-item-close',
				closeAnimationName: 'modal-wrapper-close',
				trigger: modalElements[i]
			});
			app.modals[i].initTrigger();
		}
	},

	/**
	 * Initialize elements with "data-slider" attribute as sliders
	 */
	initSliders: function(rootElement) {
		var sliderElements = rootElement.querySelectorAll('[data-slider]');
		for (var i = 0; i < sliderElements.length; i++) {
			app.sliders[i] = new Slider({
				element: sliderElements[i],
				viewport: sliderElements[i].querySelector('[data-slider-viewport]'),
				list: sliderElements[i].querySelector('[data-slider-list]'),
				items: sliderElements[i].querySelectorAll('[data-slider-list-item]'),
				prevTrigger: sliderElements[i].querySelector('[data-slider-prev]'),
				nextTrigger: sliderElements[i].querySelector('[data-slider-next]'),
				slideToTriggers: Array.prototype.map.call(sliderElements[i].querySelectorAll('[data-slider-slide-to]'), function(obj) {
					return {
						trigger: obj,
						index: parseInt(obj.getAttribute('data-slider-slide-to'))
					};
				}),
				prevCallback: function() {
					AssistiveAlert.add(this.prevTrigger.getAttribute('aria-label') + ' megjelenítve');
				},
				nextCallback: function() {
					AssistiveAlert.add(this.nextTrigger.getAttribute('aria-label') + ' megjelenítve');
				}
			});
			app.sliders[i].init();
		}
	},

	/**
	 * Initialize elements with "data-hover-animation" attribute as hover animations
	 */
	initHoverAnimations: function(rootElement) {
		var hoverAnimationElements = rootElement.querySelectorAll('[data-hover-animation]');
		for (var i = 0; i < hoverAnimationElements.length; i++) {
			app.hoverAnimations[i] = new HoverAnimation({
				element: hoverAnimationElements[i],
				target: hoverAnimationElements[i].querySelector('[data-hover-animation-target]')
			});
			app.hoverAnimations[i].init();
		}
	},

	/**
	 * Add lazy images to lazy image handler
	 */
	addLazyImages: function(rootElement) {
		var lazyImages = rootElement.querySelectorAll('[data-lazy-image]');
		for (var i = 0; i < lazyImages.length; i++) {
			LazyImages.add(lazyImages[i]);
		}
	},

	/**
	 * Initialize offset navigation bar as a dropdown
	 */
	initOffsetNav: function() {
		var offsetNav = document.querySelector('[data-offset-nav]');
		var navItems = document.querySelectorAll('[data-nav-item]');
		if (offsetNav) {
			app.offsetNav = new Dropdown({
				trigger: document.querySelector('[data-offset-nav-trigger]'),
				element: document.querySelector('[data-offset-nav-element]'),
				closeButton: document.querySelector('[data-offset-nav-close]'),
				isIndependent: true,
				setHeight: false
			});
			app.offsetNav.init();
			for (var i = 0; i < navItems.length; i++) {
				navItems[i].addEventListener('click', function() {
					app.offsetNav.close();
				});
			}
			if (!window.matchMedia(app.breakpoints.medium).matches) {
				app.offsetNav.element.setAttribute('aria-hidden','false');
			}
		}
	},

	/**
	 * Initialize smooth scroll
	 */
	initSmoothScrolls: function() {
		var smoothScrolls = document.querySelectorAll('[data-smooth-scroll]');
		for (var i = 0; i < smoothScrolls.length; i++) {
			smoothScrolls[i].addEventListener('click', function (event) {
				event.preventDefault();
				document.querySelector(this.getAttribute('href')).scrollIntoView({
					behavior: 'smooth'
				});
			});
		}
	},

	/**
	 * Breakpoint has changed
	 */
	onBreakpointChange: function(mediaQuery) {
		if(app.sliders.length) {
			for (var i = 0; i < app.sliders.length; i++) {
				app.sliders[i].recalc();
			}
		}
		if (mediaQuery.media == app.breakpoints.medium) {
			if (mediaQuery.matches) {
				app.offsetNav.element.setAttribute('aria-hidden','true');
			}
			else {
				if (app.offsetNav.getIsOpened()) {
					app.offsetNav.close();
				}
				app.offsetNav.element.setAttribute('aria-hidden','false');
			}
		}
	}
};

app.init();
