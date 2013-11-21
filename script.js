// SVGClock prototype:  Lines 5 - 855
// Sample Usage Code:   After Line 860


/**
 *
 * SVGClock a configurable analog clock in SVG.
 * By default, it presents an assigned, static time.
 * It can be configured to support dragging of clock hands,
 * and by assigning event handlers, it can serve the purpose of a time picker.
 *
 * @author      Terry Young <terryyounghk [at] gmail.com>
 * @access      public
 * @since       2011
 * @blog        http://terryyoung.blogspot.com/2013/02/svg-clock-with-raphael-21-part-2-drag.html
 */

function Clock
	(IN_szContainerID, IN_objOptions) {
	this.init();

	// First extend the new instance with the defaults
	$.extend(true, this, this.defaults);

	// Then extend the new instance with IN_objOptions, if specified, which overrides the defaults
	$.extend(true, this, IN_objOptions || {});

	// reference of the container
	this.holder = $('#' + IN_szContainerID);

	this.containerID = IN_szContainerID;
	this.create();
	this.draw();
}


/**
 *
 * SVGClock prototype
 *
 * @author      Terry Young <terryyounghk [at] gmail.com>
 * @access      public
 *
 */

Clock.prototype =
{
	/**
	 * initializes the SVG Clock properties with default values
	 */
	init: function () {
		this.defaults =
		{
			//////////////////////////////////////////////////////////////////////////
			// Clock properties
			size:                120,

			//////////////////////////////////////////////////////////////////////////
			// Clock hand properties (vector)
			centerColor:         '#000',
			centerRadius:        3,
			centerStrokeWidth:   8,
			centerStrokeOpacity: 0.4,

			hourLength:        50,
			hourColor:         '#ffff00',
			hourStrokeWidth:   10,
			hourStrokeOpacity: 0.7,

			minuteColor:         '#ff0000',
			minuteLength:        75,
			minuteStrokeWidth:   5,
			minuteStrokeOpacity: 0.8,

			secondLength:        88,
			secondColor:         '#000000',
			secondStrokeWidth:   2,
			secondStrokeOpacity: 1,


			//////////////////////////////////////////////////////////////////////////
			// Clock hand properties (bitmap, optional)
			//
			// If "url" is null, the vector graphics would be used
			centerImage:         {
				url:    null,
				width:  null,
				height: null,
				cx:     null,
				cy:     null
			},

			hourImage: {
				url:    null,
				width:  null,
				height: null,
				cx:     null,
				cy:     null
			},

			minuteImage: {
				url:    null,
				width:  null,
				height: null,
				cx:     null,
				cy:     null
			},

			secondImage:             {
				url:    null,
				width:  null,
				height: null,
				cx:     null,
				cy:     null
			},

			//////////////////////////////////////////////////////////////////////////
			// Clock hand animation properties (triggered by setTime())
			speed:                   500,
			allowMinuteFullRotation: false,

			//////////////////////////////////////////////////////////////////////////
			// Clock hand drag-n-drop event handlers

			showSeconds: true, // Defaults to False if hourDraggable or minuteDraggable is set to true

			hourDraggable:   false,
			minuteDraggable: false,

			hourDragSnap:   1, // Snap to hours. Possible values are 1, 2, 3 and 6. Anything else would be forced to default to 1.
			minuteDragSnap: 5, // Snap to minutes. Possible values are 1, 5 and 15. Anything else would be forced to default to 5.

			onHourDragStart:   null,
			onHourDragMove:    null,
			onHourDragEnd:     null,
			onMinuteDragStart: null,
			onMinuteDragMove:  null,
			onMinuteDragEnd:   null
		};


		//////////////////////////////////////////////////////////////////////////
		// Internals
		this.isAM = true;
	},


	/**
	 *
	 * Creates the Raphael paper
	 * SVG container is a perfect square where half its width equals the radius of the analog clock
	 *
	 * @author      Terry Young <terryyounghk [at] gmail.com>
	 * @access      public
	 *
	 */

	create: function () {
		this.paper = Raphael(this.containerID, this.size, this.size);
	},


	/**
	 *
	 * Draws the SVG clock
	 *
	 * @author      Terry Young <terryyounghk [at] gmail.com>
	 * @access      public
	 *
	 */

	draw: function () {
		var objHourFullPath;     // Invisible, full-path of the Hour hand (i.e. Full radius of analog clock)
		var objHourPath;         // Subpath of objHourFullPath, the visible portion
		var iHourLength;         // Full length of objHourFullPath
		var objMinuteFullPath;   // Invisible, full-path of the Minute hand (i.e. Full radius of analog clock)
		var objMinutePath;       // Subpath of objMinuteFullPath, the visible portion
		var iMinuteLength;       // Full length of objMinuteFullPath
		var objSecondFullPath;   // Invisible, full-path of the Second hand (i.e. Full radius of analog clock)
		var objSecondPath;       // Subpath of objSecondFullPath, the visible portion
		var objSecondImage;
		var objHourImage;
		var objMinuteImage;
		var objCenterImage;
		var iSecondLength;       // Full length of objSecondFullPath


		//////////////////////////////////////////////////////////////////////////
		// Prepare the Raphaels sets we need.
		// The drag() method will be applied to each these sets for drag-n-drop.
		this.minute = this.paper.set();
		this.hour = this.paper.set();
		this.second = this.paper.set();


		//////////////////////////////////////////////////////////////////////////
		// Draw the Second Hand (Vector)
		objSecondFullPath = this.paper
			.path("M" + this.size / 2 + "," + this.size / 2 + "L" + this.size / 2 + ",0")
			.attr
			({
				'stroke-width': 0     // invisible, as this is for length calculations only
			});

		iSecondLength = objSecondFullPath.getTotalLength();

		objSecondPath = this.paper
			.path(objSecondFullPath.getSubpath(0, iSecondLength * this.secondLength / 100))
			.attr({
				stroke:           this.secondColor,
				'stroke-width':   this.secondStrokeWidth,
				'stroke-opacity': this.secondStrokeOpacity
			});

		this.second.push(objSecondPath);


		//////////////////////////////////////////////////////////////////////////
		// Draw the Second Hand (Bitmap, optional)
		if (this.secondImage.url) {
			objSecondImage = this.paper
				.image
				(
					this.secondImage.url,
					this.size / 2 - this.secondImage.cx,
					this.size / 2 - this.secondImage.cy,
					this.secondImage.width,
					this.secondImage.height
				);

			// Hide the vector path
			objSecondPath.hide();
			this.second.push(objSecondImage);
		}

		if (this.hourDraggable || this.minuteDraggable || !this.showSeconds) {
			this.second.attr({ opacity: 0, 'stroke-opacity': 0});
		}

		//////////////////////////////////////////////////////////////////////////
		// Draw the Minute Hand (Vector)
		objMinuteFullPath = this.paper
			.path("M" + this.size / 2 + "," + this.size / 2 + "L" + this.size / 2 + ",0")
			.attr
			({
				'stroke-width': 0     // invisible, as this is for length calculations only
			});

		iMinuteLength = objMinuteFullPath.getTotalLength();

		objMinutePath = this.paper
			.path(objMinuteFullPath.getSubpath(0, iMinuteLength * this.minuteLength / 100))
			.attr({
				stroke:           this.minuteColor,
				'stroke-width':   this.minuteStrokeWidth,
				'stroke-opacity': this.minuteStrokeOpacity
			});

		this.minute.push(objMinutePath);

		//////////////////////////////////////////////////////////////////////////
		// Draw the Minute Hand (Bitmap, optional)
		if (this.minuteImage.url) {
			objMinuteImage = this.paper
				.image
				(
					this.minuteImage.url,
					this.size / 2 - this.minuteImage.cx,
					this.size / 2 - this.minuteImage.cy,
					this.minuteImage.width,
					this.minuteImage.height
				);

			// Hide the vector path
			objMinutePath.hide();
			this.minute.push(objMinuteImage);
		}

		//////////////////////////////////////////////////////////////////////////
		// Draw the Hour Hand (Vector)
		objHourFullPath = this.paper
			.path("M" + this.size / 2 + "," + this.size / 2 + "L" + this.size / 2 + ",0")
			.attr
			({
				'stroke-width': 0     // invisible, as this is for length calculations only
			});

		iHourLength = objHourFullPath.getTotalLength();

		objHourPath = this.paper
			.path(objHourFullPath.getSubpath(0, iHourLength * this.hourLength / 100))
			.attr({
				stroke:           this.hourColor,
				'stroke-width':   this.hourStrokeWidth,
				'stroke-opacity': this.hourStrokeOpacity
			});

		this.hour.push(objHourPath);

		//////////////////////////////////////////////////////////////////////////
		// Draw the Hour Hand (Bitmap, optional)
		if (this.hourImage.url) {
			objHourImage = this.paper
				.image
				(
					this.hourImage.url,
					this.size / 2 - this.hourImage.cx,
					this.size / 2 - this.hourImage.cy,
					this.hourImage.width,
					this.hourImage.height
				);

			// Hide the vector path
			objHourPath.hide();
			this.hour.push(objHourImage);
		}

		//////////////////////////////////////////////////////////////////////////
		// Draw the center circle of analog clock (Vector)
		this.paper
			.circle(this.size / 2, this.size / 2, this.centerRadius)
			.attr({
				fill:             this.centerColor,
				"stroke-width":   this.centerStrokeWidth,
				'stroke-opacity': this.centerStrokeOpacity
			});

		//////////////////////////////////////////////////////////////////////////
		// Draw the center circle of analog clock (Bitmap, optional)
		if (this.centerImage.url) {
			objCenterImage = this.paper
				.image
				(
					this.centerImage.url,
					this.size / 2 - this.centerImage.cx,
					this.size / 2 - this.centerImage.cy,
					this.centerImage.width,
					this.centerImage.height
				);
		}

		if (objCenterImage) {
			objCenterImage.toFront();
		}

		if (objSecondImage) {
			objSecondImage.toFront();
		}

		//////////////////////////////////////////////////////////////////////////
		// Assign initial values
		this.hour.angle = 0;
		this.hour.additionalAngle = 0;
		this.hour.value = 0;
		this.minute.angle = 0;
		this.minute.value = 0;
		this.second.angle = 0;
		this.second.value = 0;

		this.hour.previousValue = 0;
		this.minute.previousValue = 0;

		//////////////////////////////////////////////////////////////////////////
		/*
		 When calling setTime(), if time changes from 1:30 to 2:30

		 then if alllowFullRotation is true, the minute hand also does a full 360 rotation.

		 Else if false, then the minute doesn't move, only the hour hand does.

		 This is specifically designed for the Clock in UMS/Calculus Playback facility
		 */
		this.minute.allowFullRotation = this.allowMinuteFullRotation;


		//////////////////////////////////////////////////////////////////////////
		// Assign the drag-n-drop event handlers to the Hour/Minute hands
		this.assignEventHandlers();
	},


	/**
	 *
	 * (to be written)
	 *
	 * @author      Terry Young <terryyounghk [at] gmail.com>
	 * @access      private
	 *
	 */

	setMinute: function (IN_iMinute) {
		var iAngle;
		var iMinute;

		iMinute = IN_iMinute;

		while (iMinute >= 60) {
			iMinute = iMinute - 60;
		}

		if (this.minute.value !== iMinute || (this.minute.value === iMinute && this.minute.allowFullRotation === true)) {
			iAngle = 360 / 60 * iMinute;

			// this ensures clockwise rotation
			while (this.minute.angle >= iAngle) {
				iAngle = iAngle + 360;
			}

			// store the latest angle
			this.minute.angle = iAngle;

			// Raphael 1.5.x
			//this.minute.animate({rotation: iAngle + ' ' + this.size/2 + ' ' + this.size/2}, this.speed, '<>');

			// Raphael 2.x
			this.minute.animate({transform: ['r', iAngle, this.size / 2, this.size / 2]}, this.speed, '<>');
		}

		// store the latest value
		this.minute.value = iMinute;
	},


	/**
	 *
	 * This private function... (to be written)
	 *
	 * @author      Terry Young <terryyounghk [at] gmail.com>
	 * @access      public
	 *
	 */

	assignEventHandlers: function () {
		// The "THIS" gets passed into inner functions assigned to Raphael's drag() handlers
		// as the scope of the drag handlers becomes the SVG elements themselves rather than this class instance
		var THIS;
		var fnMinute_OnDragStart;
		var fnMinute_OnDragMove;
		var fnMinute_OnDragEnd;
		var fnHour_OnDragStart;
		var fnHour_OnDragMove;
		var fnHour_OnDragEnd;

		THIS = this;


		/*
		 "Minute hand" event handler for Raphael's drag() method, triggered when start-dragging the "Minute hand" SVG element.
		 Keyword "this" is at the function scope of the "this.minute" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.
		 */

		fnMinute_OnDragStart = function () {
			if (THIS.minuteDraggable && THIS.onMinuteDragStart) {
				THIS.onMinuteDragStart.apply(THIS, arguments);  // Run it at scope of the Clock class instance
			}
		};


		/*
		 "Minute hand" event handler for Raphael's drag() method, triggered when drag-moving the "Minute hand" SVG element.
		 Keyword "this" is at the function scope of the "this.minute" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.

		 NOTE: The less complex approach is to have rotation of the Minute hand in full circles NOT affecting the VALUE of the Hour
		 i.e. When time is 2:55, rotating minutes clockwise or anti-clockwise to point to 12 should both result in 2:00, NOT 3:00 nor 1:00.
		 Rational is for time-picker implementations where users might set the Hour first before setting the minutes.

		 INPUT:

		 dx                          horitontal distance from the point where the mouse was clicked
		 dy                          vertical distance from the point where the mouse was clicked
		 x                           horizontal distance of current mouse position relative to 0,0 origin
		 y                           vertical distance of current mouse position relative to 0,0 origin
		 */

		fnMinute_OnDragMove = function (dx, dy, x, y) {
			var x1, y1, x2, y2, iAngle, iAdditionalAngle, objOffset;

			objOffset = $('#' + THIS.containerID).offset();

			if (THIS.minuteDraggable) {
				// The two points used in Raphael.angle() to derive the angle
				// x1,y1 is always the center of the analog clock
				// x2,y2 is the current mouse position relative to 0,0
				x1 = THIS.size / 2;
				y1 = THIS.size / 2;
				x2 = x - objOffset.left;
				y2 = y - objOffset.top;
				iAngle = Raphael.angle(x1, y1, x2, y2);

				// Floor the angle to the nearest multiple of 30 degrees,
				// to snap the hand to the 12 angles of the clock
				if (!(THIS.minuteDragSnap % 5 === 0 || THIS.minuteDragSnap % 15 === 0 || THIS.minuteDragSnap === 1)) {
					THIS.minuteDragSnap = THIS.defaults.minuteDragSnap;
				}

				iAngle = iAngle - (iAngle % (THIS.minuteDragSnap * 6)) - 90;

				// translate the angle to a positive number
				// i.e. so that 0 degrees starts from 12 o'clock
				if (iAngle < 0) {
					iAngle = iAngle + 360;
				}

				// Store and expose the angle and the time value to the Clock instance's property
				THIS.minute.angle = iAngle;
				THIS.minute.value = THIS.minute.angle / 360 * 60;

				// Deprecated in Raphael 2.x
				//this.rotate(iAngle, x1, y1); // Do the rotation
				this.transform(['r', iAngle, x1, y1]);


				// Adjust the Hour Hand's angle

				// Derive, store and expose the additional angle of Hour Hand relative to the Minutes
				iAdditionalAngle = iAngle / 12;
				THIS.hour.additionalAngle = iAdditionalAngle;

				// Floor the Hour's base angle to the nearest multiple of 30 degrees
				THIS.hour.angle = THIS.hour.angle - (THIS.hour.angle % (THIS.hourDragSnap * 30));

				// Set the actual Hour Hand's angle and rotate it
				iAngle = THIS.hour.angle + iAdditionalAngle;

				// Deprecated in Raphael 2.x
				//THIS.hour.rotate(iAngle, x1, y1);
				THIS.hour.transform(['r', iAngle, x1, y1]);
				THIS.hour.value = THIS.hour.angle / 360 * 12; // Store and expose the Hour's value


				// Trigger the custom event handler for the Clock instance, if specified
				if (THIS.onMinuteDragMove) {
					THIS.onMinuteDragMove.apply(THIS, arguments);
				}
			}
		};


		/*
		 "Minute hand" event handler for Raphael's drag() method, triggered when end-dragging the "Minute hand" SVG element.
		 Keyword "this" is at the function scope of the "this.Minute" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.
		 */
		fnMinute_OnDragEnd = function () {
			if (THIS.minuteDraggable && THIS.onMinuteDragEnd) {
				THIS.onMinuteDragEnd.apply(THIS, arguments);
			}
		};

		// Assign drag-n-drop event handlers with Raphael's drag()
		this.minute.drag(fnMinute_OnDragMove, fnMinute_OnDragStart, fnMinute_OnDragEnd);


		/*
		 "Hour hand" event handler for Raphael's drag() method, triggered when start-dragging the "Hour hand" SVG element.
		 Keyword "this" is at the function scope of the "this.Hour" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.
		 */
		fnHour_OnDragStart = function () {
			if (THIS.hourDraggable && THIS.onHourDragStart) {
				THIS.onHourDragStart.apply(THIS, arguments);
			}
		};

		/*
		 "Hour hand" event handler for Raphael's drag() method, triggered when drag-moving the "Hour hand" SVG element.
		 Keyword "this" is at the function scope of the "this.Hour" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.

		 INPUT:
		 dx                            horitontal distance from the point where the mouse was clicked
		 dy                            vertical distance from the point where the mouse was clicked
		 x                             horizontal distance of current mouse position relative to 0,0 origin
		 y                             vertical distance of current mouse position relative to 0,0 origin
		 */
		fnHour_OnDragMove = function (dx, dy, x, y) {
			var x1, y1, x2, y2, iAngle, iAdditionalAngle, objOffset, iValue;

			objOffset = $('#' + THIS.containerID).offset();

			if (THIS.hourDraggable) {
				// The two points used in Raphael.angle() to derive the angle
				// x1,y1 is always the center of the analog clock
				// x2,y2 is the current mouse position relative to 0,0
				x1 = THIS.size / 2;
				y1 = THIS.size / 2;
				x2 = x - objOffset.left;
				y2 = y - objOffset.top;
				iAngle = Raphael.angle(x1, y1, x2, y2);

				if (!(THIS.hourDragSnap === 1 || THIS.hourDragSnap === 3 || THIS.hourDragSnap === 2 || THIS.hourDragSnap === 6)) {
					THIS.hourDragSnap = 1;
				}

				// Floor the angle to the nearest multiple of X degrees,
				// to snap the hand to the 12 angles of the clock
				if (THIS.hourDragSnap === 2) {
					THIS.hour.angle = iAngle - (iAngle % (THIS.hourDragSnap * 30)) - 60;
				} else if (THIS.hourDragSnap === 6) {
					THIS.hour.angle = iAngle - (iAngle % (THIS.hourDragSnap * 30));
				} else {
					THIS.hour.angle = iAngle - (iAngle % (THIS.hourDragSnap * 30)) - 90;
				}

				// translate the angle to a positive number
				// i.e. so that 0 degrees starts from 12 o'clock
				// Then store and expose the angle and the time value to the Clock instance's property.
				if (THIS.hour.angle < 0) {
					THIS.hour.angle = THIS.hour.angle + 360;
				}

				iValue = THIS.hour.angle / 360 * 12; // 12-hour format


				// This logic here handles AM/PM switching when dragging of Hour Hand hits 12.


				// The moment the dragging hits 12 IN A CLOCKWISE DIRECTION, switch AM/PM.
				if (
					iValue % 12 === 0 &&
						THIS.hour.value !== 0 &&
						THIS.hour.value !== 12 &&
						THIS.hour.previousValue !== 13 &&
						THIS.hour.previousValue !== 1
					) {
					THIS.isAM = !THIS.isAM;
				}
				// Else, in an ANTI-CLOCKWISE DIRECTION
				// we switch to AM/PM depending on the previous time (either 12AM or 12PM)
				else if (THIS.hour.previousValue === 0 && iValue > 6) {
					THIS.isAM = false;
				} else if (THIS.hour.previousValue === 12 && iValue > 6) {
					THIS.isAM = true;
				}

				// If it's PM, convert 12-hour values and angles to 24-hours
				if (!THIS.isAM) {
					iValue += 12;
					THIS.hour.angle = THIS.hour.angle + 360;
				}

				THIS.hour.value = iValue; // Store and expose the value


				// Keep track of the previous value for the AM/PM switching logic above
				if (THIS.hour.previousValue !== THIS.hour.value) {
					THIS.hour.previousValue = THIS.hour.value;
				}

				// "additionalAngle" accounts for the angle affected by "Minutes"
				iAngle = THIS.hour.angle + THIS.hour.additionalAngle;

				// Deprecated in Raphael 2.x
				//this.rotate(iAngle, x1, y1); // Do the rotation
				this.transform(['r', iAngle, x1, y1]);

				// Trigger the custom event handler for the Clock instance, if specified
				if (THIS.onHourDragMove) {
					THIS.onHourDragMove.apply(THIS, arguments);
				}
			}
		};

		/*
		 "Hour hand" event handler for Raphael's drag() method, triggered when end-dragging the "Hour hand" SVG element.
		 Keyword "this" is at the function scope of the "this.Hour" Raphael Set of SVG elements.
		 Keyword "THIS" is at the function scope of the Clock class instance.
		 */

		fnHour_OnDragEnd = function () {
			if (THIS.hourDraggable && THIS.onHourDragEnd) {
				THIS.onHourDragEnd.apply(THIS, arguments);
			}
		};

		// Assign drag-n-drop event handlers with Raphael's drag()
		this.hour.drag(fnHour_OnDragMove, fnHour_OnDragStart, fnHour_OnDragEnd);
	},


	/**
	 *
	 * (to be written)
	 *
	 * @author      Terry Young <terryyounghk [at] gmail.com>
	 * @access      private
	 *
	 */

	setSecond: function (IN_iSecond) {
		var iAngle;
		var iSecond;

		iSecond = IN_iSecond;

		while (iSecond >= 60) {
			iSecond = iSecond - 60;
		}


		if (this.second.value !== iSecond) {
			iAngle = 360 / 60 * iSecond;

			// this ensures clockwise rotation
			while (this.second.angle >= iAngle) {
				iAngle = iAngle + 360;
			}

			// store the latest angle
			this.second.angle = iAngle;

			// Raphael 1.5.x
			//this.second.animate({rotation: iAngle + ' ' + this.size/2 + ' ' + this.size/2}, this.speed / 2, 'bounce');

			// Raphael 2.x
			this.second.animate({transform: ['r', iAngle, this.size / 2, this.size / 2]}, this.speed / 2, 'bounce');
		}

		// store the latest value
		this.second.value = iSecond;
		//console.info(this.second);
	},

	getMinute: function () {
		return this.minute.value;
	},
	getSecond: function () {
		return this.second.value;
	},

	/**
	 *
	 * @param IN_iHour
	 * @param IN_iMinute
	 * @param IN_iSecond
	 */
	setTime: function
		(IN_iHour, IN_iMinute, IN_iSecond) {
		var iAngle;
		var iHour;
		var iMinute;
		var iSecond;
		var iAdditionalAngle; // the additional angle of Hour in relation to Minutes

		iHour = IN_iHour;

		if (iHour % 24 === 0) {
			iHour = 0;
		}

		while (iHour > 12) {
			iHour = iHour - 12; // cater for 24-hour format
		}

		iMinute = IN_iMinute;
		if (typeof(iMinute) == 'undefined') {
			iMinute = this.minute.value;
		}
		while (iMinute >= 60) {
			iMinute = iMinute - 60;
		}

		iSecond = IN_iSecond;
		if (typeof(iSecond) == 'undefined') {
			iSecond = this.second.value;
		}
		while (iSecond >= 60) {
			iSecond = iSecond - 60;
		}

		iAdditionalAngle = 0;

		// each hour is 30 degrees
		if (iMinute > 0) {
			iAdditionalAngle = 360 / 60 / 12 * iMinute;
		}


		if (!(this.minute.value === iMinute && this.hour.value === iHour && this.second.value === iSecond)) {
			this.setSecond(iSecond);
			this.setMinute(iMinute);
			iAngle = 360 / 12 * iHour + iAdditionalAngle;

			// this ensures clockwise rotation
			while (this.hour.angle > iAngle) {
				iAngle = iAngle + 360;
			}

			// store the latest angles
			this.hour.angle = iAngle;
			this.hour.additionalAngle = iAdditionalAngle;
			// Raphael 1.5.x
			//this.hour.animate({ rotation: iAngle + ' ' + this.size/2 + ' ' + this.size/2}, this.speed, '<>');

			// Raphael 2.x
			this.hour.animate({transform: ['r', iAngle, this.size / 2, this.size / 2]}, this.speed, '<>');
		}

		// store the latest value
		this.hour.value = iHour;
		this.minute.value = iMinute;
		this.second.value = iSecond;
	},

	getTime: function () {
		var OUT_objTime;

		OUT_objTime =
		{
			'hour':   this.hour.value,
			'minute': this.minute.value,
			'second': this.second.value
		};

		return OUT_objTime;
	},

	/**
	 *
	 * @param IN_bIncludeSeconds (Optional)    Default is false
	 * @return {String}
	 */
	getTimeAsString: function (IN_bIncludeSeconds) {
		var szHour;
		var szMinute;
		var szSecond;
		var bIncludeSeconds;
		var OUT_szString;

		bIncludeSeconds = !!IN_bIncludeSeconds; // cast to boolean

		szHour = this.hour.value;
		szMinute = this.minute.value;
		szSecond = this.second.value;

		if (szMinute < 10) {
			szMinute = '0' + szMinute.toString();
		}

		if (szSecond < 10) {
			szSecond = '0' + szSecond.toString();
		}

		OUT_szString = szHour.toString() + ':' + szMinute;

		if (bIncludeSeconds) {
			OUT_szString += ':' + szSecond;
		}

		return OUT_szString;
	}

}; // End Clock.prototype




/*******************************************************
 * SAMPLE USAGE
 */

function onHourDragStart_3() {
    var $eventLog = $('#' + this.holder.attr('data-event-log'));
    $eventLog.html('Hour Hand: Drag starts');
}

function onHourDragMove_3(dx, dy, x, y) {
    var szString,
            objOffset,
            $holder = this.holder,
            $eventLog = $('#' + $holder.attr('data-event-log')),
            $hour = $('#' + $holder.attr('data-hour-field')),
            $minute = $('#' + $holder.attr('data-minute-field'));

    objOffset = $holder.offset();

    szString = 'Hour Hand: Drag Moving.<br>';
    szString += 'Distance X: ' + dx + '<br>';
    szString += 'Distance Y: ' + dy + '<br>';
    szString += 'Document X: ' + x + '<br>';
    szString += 'Document Y: ' + y + '<br>';
    szString += 'Element X: ' + (x - objOffset.left) + '<br>';
    szString += 'Element Y: ' + (y - objOffset.top) + '<br>';

    $eventLog.html(szString);
    $hour.val(this.hour.value);
    $minute.val(this.minute.value);
}

function onHourDragEnd_3() {
    var $eventLog = $('#' + this.holder.attr('data-event-log'));
    $eventLog.html('Hour Hand: Drag End');
}

function onMinuteDragStart_3() {
    var $eventLog = $('#' + this.holder.attr('data-event-log'));
    $eventLog.html('Minute Hand: Drag starts');
}

function onMinuteDragMove_3(dx, dy, x, y) {
    var szString,
            objOffset,
            $holder = this.holder,
            $eventLog = $('#' + $holder.attr('data-event-log')),
            $hour = $('#' + $holder.attr('data-hour-field')),
            $minute = $('#' + $holder.attr('data-minute-field'));

    objOffset = $holder.offset();

    szString = 'Minute Hand: Drag Moving.<br>';
    szString += 'Distance X: ' + dx + '<br>';
    szString += 'Distance Y: ' + dy + '<br>';
    szString += 'Document X: ' + x + '<br>';
    szString += 'Document Y: ' + y + '<br>';
    szString += 'Element X: ' + (x - objOffset.left) + '<br>';
    szString += 'Element Y: ' + (y - objOffset.top) + '<br>';

    $eventLog.html(szString);
    $hour.val(this.hour.value);
    $minute.val(this.minute.value);
}

function onMinuteDragEnd_3() {
    var $eventLog = $('#' + this.holder.attr('data-event-log'));
    $eventLog.html('Minute Hand: Drag End');
}


/**
 * Example 3: Drag-n-drop Event Handlers and Time Picker Implementation
 */
function setupClock_3() {
    var objClockOptions;

    objClockOptions =
    {
        size: 200,

        centerColor:         '#21344b',
        centerRadius:        5,
        centerStrokeWidth:   3,
        centerStrokeOpacity: 0.8,

        hourLength:        40, // the length of the image
        hourColor:         '#FF0000',
        hourStrokeWidth:   8,
        hourStrokeOpacity: 0.8,

        minuteColor:         '#ffff00',
        minuteLength:        60, // the length of the image
        minuteStrokeWidth:   5,
        minuteStrokeOpacity: 0.8,

        secondLength:        75, // the length of the image
        secondColor:         '#d0d7e1',
        secondStrokeWidth:   2,
        secondStrokeOpacity: 0.9,

        speed:                   400,
        allowMinuteFullRotation: false,
        hourDraggable:           true,
        minuteDraggable:         true,

        onHourDragStart:   onHourDragStart_3,
        onHourDragMove:    onHourDragMove_3,
        onHourDragEnd:     onHourDragEnd_3,
        onMinuteDragStart: onMinuteDragStart_3,
        onMinuteDragMove:  onMinuteDragMove_3,
        onMinuteDragEnd:   onMinuteDragEnd_3
    };


    objClock_4 = new Clock('CLOCK_HOLDER_4', objClockOptions);
    objClockOptions.minuteDragSnap = 1; // additional option for Clock 5

    objClock_5 = new Clock('CLOCK_HOLDER_5', objClockOptions);
    objClockOptions.minuteDragSnap = 15; // additional option for Clock 6

    objClock_6 = new Clock('CLOCK_HOLDER_6', objClockOptions);

    $('#CLOCK_HOUR_4, #CLOCK_MINUTE_4').bind('change', function () {
        objClock_4.setTime($("#CLOCK_HOUR_4").val(), $("#CLOCK_MINUTE_4").val());
        $('#CLOCK_EVENT_4').html('Clock time changed using pulldown menu');
    });

    $('#CLOCK_HOUR_5, #CLOCK_MINUTE_5').bind('change', function () {
        objClock_5.setTime($("#CLOCK_HOUR_5").val(), $("#CLOCK_MINUTE_5").val());
        $('#CLOCK_EVENT_5').html('Clock time changed using pulldown menu');
    });

    $('#CLOCK_HOUR_6, #CLOCK_MINUTE_6').bind('change', function () {
        objClock_6.setTime($("#CLOCK_HOUR_6").val(), $("#CLOCK_MINUTE_6").val());
        $('#CLOCK_EVENT_6').html('Clock time changed using pulldown menu');
    });


    // reset the pulldown menus, in case of a browser refresh
    $('#CLOCK_HOUR_4').val(objClock_4.hour.value);
    $('#CLOCK_MINUTE_4').val(objClock_4.minute.value);

    $('#CLOCK_HOUR_5').val(objClock_5.hour.value);
    $('#CLOCK_MINUTE_5').val(objClock_5.minute.value);

    $('#CLOCK_HOUR_6').val(objClock_6.hour.value);
    $('#CLOCK_MINUTE_6').val(objClock_6.minute.value);
}


/**
 * Initialize all examples on the page
 */
$(document).ready(function () {
    setupClock_3();
});












