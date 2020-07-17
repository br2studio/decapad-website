/**
 * Slider - v1.0.1
 * Copyright 2020 Abel Brencsan
 * Released under the MIT License
 */

var Slider = function (options) {

	'use strict';

	// Test required options
	if (typeof options.element !== 'object') throw 'Slider "element" option must be an object';
	if (typeof options.list !== 'object') throw 'Slider "list" option must be an object';
	if (typeof options.viewport !== 'object') throw 'Slider "viewport" option must be an object';
	if (typeof options.items !== 'object') throw 'Slider "items" must be an object';
	if (typeof options.slideToTriggers == 'object') {
		for (var i = 0; i < options.slideToTriggers.length; i++) {
			if (typeof options.slideToTriggers[i].trigger !== 'object') throw 'Slider slide to trigger "trigger" option must be an object';
			if (typeof options.slideToTriggers[i].index !== 'number') throw 'Slider slide to trigger "index" option must be a number';
		}
	}

	// Default slider instance options
	var defaults = {
		element: null,
		viewport: null,
		list: null,
		items: null,
		prevTrigger: null,
		nextTrigger: null,
		slideToTriggers: null,
		initialIndex: 0,
		rewind: true,
		touchDrag: true,
		mouseDrag: true,
		initCallback: null,
		nextCallback: null,
		prevCallback: null,
		slideToCallback: null,
		recalcCallback: null,
		dragStartCallback: null,
		dragMoveCallback: null,
		dragEndCallback: null,
		destroyCallback: null,
		hasMouseDragClass: 'has-mouse-drag',
		hasNoNextItemClass: 'has-no-next-item',
		hasNoPrevItemClass: 'has-no-prev-item',
		hasPointerDragClass: 'has-pointer-drag',
		hasTouchDragClass: 'has-touch-drag',
		isActiveClass: 'is-active',
		isDraggingClass: 'is-dragging',
		isMouseDraggingClass: 'is-mouse-dragging',
		isPointerDraggingClass: 'is-pointer-dragging',
		isRewindingClass: 'is-rewinding',
		isSlidingClass: 'is-sliding',
		isSlidingFinishedClass: 'is-sliding-finished',
		isTouchDraggingClass: 'is-touch-dragging',
		isVisibleClass: 'is-visible'
	};

	// Extend slider instance options with defaults
	for (var key in defaults) {
		this[key] = (options.hasOwnProperty(key)) ? options[key] : defaults[key];
	}

	// Slide instance initial settings
	this.isInitialized = false;
	this.itemsCount = this.items.length;
	this.activeIndex = null;
	this.lastActiveIndex = null;
	this.lastActiveIndexPercent = null;
	this.visibleItemsCount = null;
	this.visibleItemsWidth = null;
	this.itemPercent = null;
	this.currentPercent = null;

	// Slider instance touch initial settings
	this.touchStartPosition = { x: null, y: null };
	this.touchDirection = null;

	// Slider instance drag initial settings
	this.dragStartPosition = null;
	this.dragMovePosition = null;
	this.dragMoveTime = null;
	this.dragMovePercent = null;
	this.isDragging = false;
	this.isLongDrag = false;
	this.longDragInterval = 250;

};

Slider.prototype = function () {

	'use strict';

	// Selector for focusable elements
	var focusSelector = 'input, select, textarea, a[href], button, [tabindex], audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])';

	var slider = {

		touchDragItems: 0,
		pointerDragItems: 0,
		mouseDragItems: 0,
		activeItem: null,
		activeEventType: null,

		/**
		 * Initialize slider. It creates events, adds classes relevant to slider. (public)
		 */
		init: function() {
			if (this.isInitialized) return;
			this.activeIndex = this.initialIndex;
			if (this.activeIndex > this.itemsCount - 1) this.activeIndex = 0;
			this.handleEvent = function(event) {
				slider.handleEvents.call(this, event);
			};
			this.list.addEventListener('transitionend', this);
			if (this.nextTrigger) this.nextTrigger.addEventListener('click', this);
			if (this.prevTrigger) this.prevTrigger.addEventListener('click', this);
			if (this.touchDrag) {
				if ('ontouchstart' in window) {
					this.element.classList.add(this.hasTouchDragClass);
					this.viewport.addEventListener('touchstart', this);
					if (slider.touchDragItems == 0) {
						document.addEventListener('touchmove', this, { passive: false });
						document.addEventListener('touchend', this);
					}
					slider.touchDragItems++;
				}
				else if('onpointerdown' in window) {
					this.element.classList.add(this.hasPointerDragClass);
					this.viewport.addEventListener('pointerdown', this);
					this.viewport.style.touchAction = 'pan-y pinch-zoom';
					if (slider.pointerDragItems == 0) {
						document.addEventListener('pointermove', this);
						document.addEventListener('pointerup', this);
					}
					slider.pointerDragItems++;
				}
			}
			if (this.mouseDrag) {
				this.element.classList.add(this.hasMouseDragClass);
				this.viewport.addEventListener('mousedown', this);
				if (slider.mouseDragItems == 0) {
					document.addEventListener('mousemove', this);
					document.addEventListener('mouseup', this);
				}
				slider.mouseDragItems++;
			}
			if (this.slideToTriggers) {
				for (var i = 0; i < this.slideToTriggers.length; i++) {
					this.slideToTriggers[i].trigger.addEventListener('click', this);
				}
			}
			slider.update.call(this);
			this.isInitialized = true;
			if (this.initCallback) this.initCallback.call(this);
		},

		/**
		 * Increment active index by one, update slider. (public)
		 */
		next: function() {
			if (this.activeIndex >= this.itemsCount - this.visibleItemsCount)  {
				if (!this.rewind) return;
				this.activeIndex = 0;
				this.element.classList.add(this.isRewindingClass);
			}
			else {
				this.activeIndex++;
			}
			slider.slide.call(this);
			if (this.nextCallback) this.nextCallback.call(this);
		},

		/**
		 * Decrement active index by one, update slider. (public)
		 */
		prev: function() {
			if (this.activeIndex <= 0)  {
				if (!this.rewind) return;
				this.activeIndex = this.itemsCount - this.visibleItemsCount;
				this.element.classList.add(this.isRewindingClass);
			}
			else {
				this.activeIndex--;
			}
			slider.slide.call(this);
			if (this.prevCallback) this.prevCallback.call(this);
		},

		/**
		 * Set active index to given number, and update slider. (public)
		 * @param index integer
		 */
		slideTo: function(index) {
			if (index > this.itemsCount - this.visibleItemsCount) return;
			this.activeIndex = index;
			slider.slide.call(this);
			if (this.slideToCallback) this.slideToCallback.call(this);
		},

		/**
		 * Set sliding classes, and update slider. (private)
		 */
		slide: function() {
			this.element.classList.add(this.isSlidingClass);
			this.element.classList.remove(this.isSlidingFinishedClass);
			slider.update.call(this);
		},

		/**
		 * Update active and visible items based on active index. (public)
		 */
		update: function() {
			var focusableElements, isVisible;
			this.visibleItemsCount = null;
			this.visibleItemsWidth = null;
			for (var i = 0; i < this.itemsCount; i++) {
				this.items[i].classList.remove(this.isActiveClass);
				this.items[i].classList.remove(this.isVisibleClass);
				isVisible = false;
				if (this.activeIndex <= i && this.visibleItemsWidth < this.list.offsetWidth) {
					this.visibleItemsWidth += Math.ceil(this.items[i].getBoundingClientRect()['width']);
					this.visibleItemsCount++;
					this.items[i].classList.add(this.isVisibleClass);
					isVisible = true;
				}
				if (this.activeIndex == i) {
					this.items[i].classList.add(this.isActiveClass);
				}
				focusableElements = this.items[i].querySelectorAll(focusSelector);
				for (var j = 0; j < focusableElements.length; j++) {
					if (isVisible) {
						focusableElements[j].removeAttribute('tabindex');
					}
					else {
						focusableElements[j].setAttribute('tabindex', '-1');
					}
				}
			}
			if (this.slideToTriggers) {
				for (var i = 0; i < this.slideToTriggers.length; i++) {
					this.slideToTriggers[i].trigger.classList.remove(this.isActiveClass);
					if (this.activeIndex == this.slideToTriggers[i].index) {
						this.slideToTriggers[i].trigger.classList.add(this.isActiveClass);
					}
				}
			}
			this.itemPercent = 100 / this.visibleItemsCount;
			this.currentPercent = this.itemPercent * -this.activeIndex;
			this.lastActiveIndex = this.itemsCount - this.visibleItemsCount;
			this.lastActiveIndexPercent = this.itemPercent * -this.lastActiveIndex;
			this.element.classList.remove(this.hasNoNextItemClass);
			this.element.classList.remove(this.hasNoPrevItemClass);
			if (this.activeIndex == this.itemsCount - this.visibleItemsCount && !this.rewind) this.element.classList.add(this.hasNoNextItemClass);
			if (this.activeIndex == 0 && !this.rewind) this.element.classList.add(this.hasNoPrevItemClass);
			this.list.style.transform = 'translateX(' + this.currentPercent + '%)';
		},

		/**
		 * Reset active index when visible items are wider than slider list's width, update slider. (public)
		 */
		recalc: function() {
			if (this.visibleItemsWidth < this.list.offsetWidth) this.activeIndex = 0;
			slider.update.call(this);
			if (this.recalcCallback) this.recalcCallback.call(this);
		},

		/**
		 * Remove sliding classes after sliding is finished. (private)
		 */
		slideEnd: function() {
			this.element.classList.remove(this.isSlidingClass);
			this.element.classList.add(this.isSlidingFinishedClass);
			this.element.classList.remove(this.isRewindingClass);
		},

		/**
		 * Set given start (and first move) drag position, detect long touch when dragging has started. (private)
		 * @param dragPosition integer
		 */
		dragStart: function(dragPosition) {
			var self = this;
			setTimeout(function() {
				self.isLongDrag = true;
			}, this.longDragInterval);
			this.dragStartPosition = dragPosition;
			this.dragMovePosition = dragPosition;
			this.dragMovePercent = this.currentPercent;
			this.isDragging = true;
			this.isLongDrag = false;
			this.element.classList.add(this.isDraggingClass);
			this.list.style.transitionDuration = '';
			if (this.dragStartCallback) this.dragStartCallback.call(this);
		},

		/**
		 * Set given move drag position, calculates movement in percent, and translate slider to the calculated position. (private)
		 * @param dragPosition integer
		 */
		dragMove: function(dragPosition) {
			this.dragMovePosition = dragPosition;
			this.dragMovePercent = this.currentPercent + (100 / this.visibleItemsWidth) * (this.dragMovePosition - this.dragStartPosition);
			if (this.dragMovePosition < this.dragStartPosition && this.dragMovePercent < this.lastActiveIndexPercent) {
				this.dragMovePercent = this.lastActiveIndexPercent - Math.pow(this.lastActiveIndexPercent - this.dragMovePercent, 0.5);
			}
			if (this.dragMovePosition > this.dragStartPosition && this.dragMovePercent > 0) {
				this.dragMovePercent = Math.pow(this.dragMovePercent, 0.5);
			}
			this.list.style.transform = 'translateX(' + this.dragMovePercent + '%)';
			if (this.dragMoveCallback) this.dragMoveCallback.call(this);
		},

		/**
		 * Calculates new active index from start and last move position, and emit sliding. (private)
		 */
		dragEnd: function() {
			if (this.dragMovePosition != this.dragStartPosition) {
				if (this.isLongDrag) {
					this.activeIndex = Math.round((this.dragMovePercent * -1) / this.itemPercent);
				}
				else {
					if (this.dragMovePosition < this.dragStartPosition) {
						this.activeIndex = Math.ceil((this.dragMovePercent * -1) / this.itemPercent);
					}
					else {
						this.activeIndex = Math.floor((this.dragMovePercent * -1) / this.itemPercent);
					}
				}
				if (this.activeIndex < 0) {
					this.activeIndex = 0;
				}
				if (this.activeIndex > this.lastActiveIndex) {
					this.activeIndex = this.lastActiveIndex;
				}
				slider.slide.call(this);
			}
			this.isDragging = false;
			this.touchDirection = null;
			this.element.classList.remove(this.isDraggingClass);
			if (this.dragEndCallback) this.dragEndCallback.call(this);
		},

		/**
		 * Set given touch start position. (private)
		 * @param touchX integer
		 * @param touchY integer
		 */
		setTouchStartPosition: function(touchX, touchY) {
			this.touchStartPosition.x = touchX;
			this.touchStartPosition.y = touchY;
		},

		/**
		 * Calculate touch direction (vertical or horizontal) from touch start and given positions. (private)
		 * @param touchX integer
		 * @param touchY integer
		 */
		setTouchDirection: function(touchX, touchY) {
			if (Math.abs(this.touchStartPosition.x - touchX) * 2 > Math.abs(this.touchStartPosition.y - touchY)) {
				this.touchDirection = 'horizontal';
			}
			else {
				this.touchDirection = 'vertical';
			}
		},

		/**
		 * Check element is draggable. (private)
		 * @param element object
		 */
		isElementDraggable: function(element) {
			var matches;
			var parentElement = element;
			while (parentElement != this.viewport) {
				matches = parentElement.matches ? parentElement.matches(focusSelector) : parentElement.msMatchesSelector(focusSelector);
				if (matches) {
					return false;
				}
				parentElement = parentElement.parentNode;
			}
			return true;
		},

		/**
		 * Handle events. (private)
		 * On next, previous or custom trigger click: Emit sliding to next, previous item, or to the item given by custom trigger.
		 * On list transition end: Handle sliding finish.
		 * On viewport touch start: Handle dragging start.
		 * On viewport touch move: Handle dragging move.
		 * On viewport touch end: Handle dragging end.
		 * @param event object
		 */
		handleEvents: function(event) {
			switch(event.type) {
				case 'click':
					event.preventDefault();
					if (event.target == this.nextTrigger) {
						slider.next.call(this);
						break;
					}
					if (event.target == this.prevTrigger) {
						slider.prev.call(this);
						break;
					}
					if (this.slideToTriggers) {
						for (var i = 0; i < this.slideToTriggers.length; i++) {
							if (event.target == this.slideToTriggers[i].trigger) {
								slider.slideTo.call(this, this.slideToTriggers[i].index);
							}
						}
					}
					break;
				case 'transitionend':
					if (event.target == this.list) {
						slider.slideEnd.call(this);
					}
					break;
				case 'touchstart':
					if (!slider.activeEventType && slider.isElementDraggable.call(this, event.target)) {
						slider.activeEventType = 'touch';
						slider.activeItem = this;
						slider.setTouchStartPosition.call(this, event.touches[0].pageX, event.touches[0].pageY);
						slider.dragStart.call(this, event.touches[0].pageX);
						this.element.classList.add(this.isTouchDraggingClass);
					}
					break;
				case 'touchmove':
					if (slider.activeItem && slider.activeEventType == 'touch') {
						if (!slider.activeItem.touchDirection) slider.setTouchDirection.call(slider.activeItem, event.touches[0].pageX, event.touches[0].pageY);
						if (slider.activeItem.touchDirection === 'horizontal') {
							event.preventDefault();
							slider.dragMove.call(slider.activeItem, event.touches[0].pageX);
						}
					}
					break;
				case 'touchend':
					if (slider.activeItem) {
						slider.activeItem.element.classList.remove(this.isTouchDraggingClass);
						slider.dragEnd.call(slider.activeItem);
						slider.activeItem = null;
						slider.activeEventType = null;
					}
					break;
				case 'pointerdown':
					if (event.pointerType == 'touch' || event.pointerType == 'pen') {
						if (!slider.activeEventType && slider.isElementDraggable.call(this, event.target)) {
							slider.activeEventType = 'pointer';
							slider.activeItem = this;
							slider.setTouchStartPosition.call(this, event.pageX, event.pageY);
							slider.dragStart.call(this, event.pageX);
							this.element.classList.add(this.isPointerDraggingClass);
						}
					}
					break;
				case 'pointermove':
					if (event.pointerType == 'touch' || event.pointerType == 'pen') {
						if (slider.activeItem && slider.activeEventType == 'pointer') {
							if (!slider.activeItem.touchDirection) slider.setTouchDirection.call(slider.activeItem, event.pageX, event.pageY);
							if (slider.activeItem.touchDirection === 'horizontal') {
								slider.dragMove.call(slider.activeItem, event.pageX);
							}
						}
					}
					break;
				case 'pointerup':
					if (event.pointerType == 'touch' || event.pointerType == 'pen') {
						if (slider.activeItem) {
							slider.activeItem.element.classList.remove(this.isPointerDraggingClass);
							slider.dragEnd.call(slider.activeItem);
							slider.activeItem = null;
							slider.activeEventType = null;
						}
					}
					break;
				case 'mousedown':
					if (!slider.activeEventType && slider.isElementDraggable.call(this, event.target)) {
						slider.activeEventType = 'mouse';
						slider.activeItem = this;
						slider.setTouchStartPosition.call(this, event.pageX, event.pageY);
						slider.dragStart.call(this, event.pageX);
						this.element.classList.add(this.isMouseDraggingClass);
					}
					break;
				case 'mousemove':
					if (slider.activeItem && slider.activeEventType == 'mouse') {
						if (!slider.activeItem.touchDirection) slider.setTouchDirection.call(slider.activeItem, event.pageX, event.pageY);
						if (slider.activeItem.touchDirection === 'horizontal') {
							slider.dragMove.call(slider.activeItem, event.pageX);
						}
					}
					break;
				case 'mouseup':
					if (slider.activeItem) {
						slider.dragEnd.call(slider.activeItem);
						slider.activeItem.element.classList.remove(this.isMouseDraggingClass);
						slider.activeItem = null;
						slider.activeEventType = null;
					}
					break;
			}
		},

		/**
		 * Destroy slider. It removes events and classes relevant to slider. (public)
		 */
		destroy: function() {
			if (!this.isInitialized) return;
			if (this.nextTrigger) this.nextTrigger.removeEventListener('click', this);
			if (this.nextTrigger) this.prevTrigger.removeEventListener('click', this);
			this.list.removeEventListener('transitionend', this);
			if (this.touchDrag) {
				if ('ontouchstart' in window) {
					this.element.classList.remove(this.hasTouchDragClass);
					this.viewport.removeEventListener('touchstart', this);
					slider.touchDragItems--;
					if (slider.touchDragItems == 0) {
						document.removeEventListener('touchmove', this);
						document.removeEventListener('touchend', this);
					}
				}
				else if('onpointerdown' in window) {
					this.element.classList.remove(this.hasPointerDragClass);
					this.viewport.removeEventListener('pointerdown', this);
					this.viewport.style.touchAction = '';
					slider.pointerDragItems--;
					if (slider.pointerDragItems == 0) {
						this.element.classList.remove(this.hasMouseDragClass);
						document.removeEventListener('pointermove', this);
						document.removeEventListener('pointerup', this);
					}
				}
			}
			if (this.mouseDrag) {
				slider.mouseDragItems--;
				if (slider.mouseDragItems == 0) {
					document.removeEventListener('mousemove', this);
					document.removeEventListener('mouseup', this);
				}
				this.viewport.removeEventListener('mousedown', this);
			}
			if (this.slideToTriggers) {
				for (var i = 0; i < this.slideToTriggers.length; i++) {
					this.slideToTriggers[i].trigger.removeEventListener('click', this);
				}
			}
			this.isInitialized = false;
			this.activeIndex = null;
			this.lastActiveIndex = null;
			this.lastActiveIndexPercent = null;
			this.visibleItemsCount = null;
			this.visibleItemsWidth = null;
			this.itemPercent = null;
			this.currentPercent = null;
			this.touchStartPosition = { x: null, y: null };
			this.touchDirection = null;
			this.dragStartPosition = null;
			this.dragMovePosition = null;
			this.dragMovePercent = null;
			this.isDragging = false;
			this.isLongDrag = false;
			this.list.style.transform = 'none';
			this.element.classList.remove(this.hasNoNextItemClass);
			this.element.classList.remove(this.hasNoPrevItemClass);
			this.element.classList.remove(this.isSlidingClass);
			this.element.classList.remove(this.isSlidingFinishedClass);
			this.element.classList.remove(this.isRewindingClass);
			this.element.classList.remove(this.isDraggingClass);
			for (var i = 0; i < this.itemsCount; i++) {
				this.items[i].classList.remove(this.isActiveClass);
				this.items[i].classList.remove(this.isVisibleClass);
			}
			if (this.destroyCallback) this.destroyCallback.call(this);
		},

		/**
		 * Get value of "isTriggerInitialized" to be able to check slider is initialized or not. (public)
		 */
		getIsInitialized: function() {
			return this.isInitialized;
		},

		/**
		 * Get value of "activeIndex" to be able to get current active index. (public)
		 */
		getActiveIndex: function() {
			return this.activeIndex;
		}
	};

	return {
		init: slider.init,
		prev: slider.prev,
		next: slider.next,
		slideTo: slider.slideTo,
		update: slider.update,
		recalc: slider.recalc,
		destroy: slider.destroy,
		getIsInitialized: slider.getIsInitialized,
		getActiveIndex: slider.getActiveIndex
	};

}();
