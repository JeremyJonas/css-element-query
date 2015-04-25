/* Based on work by Tyson Matanich:
https://github.com/tysonmatanich/elementQuery
http://www.smashingmagazine.com/2013/06/25/media-queries-are-not-the-answer-element-query-polyfill/
*/
/*! original: elementQuery | Author: Tyson Matanich (http://matanich.com), 2013 | License: MIT */
module.exports = (function(window, document, undefined){
	var getEmPixels = require("./getEmPixels");

	// Enable strict mode
	"use strict";

	// Use Sizzle standalone or from jQuery
	var sizzle = window.Sizzle || window.jQuery ? window.jQuery.find : undefined;

	// Set the number of sizzle selectors to cache (default is 50)
	//sizzle.selectors.cacheLength = 50;

	var queryData = {};

	var cssRules = null;

	var setCssRules = function () {
			if (document.styleSheets[0]) {
					cssRules = (document.styleSheets[0].cssRules !== undefined) ? "cssRules" : "rules";
			}
	}

	var addQueryDataValue = function (selector, type, pair, number, value) {

			selector = trim(selector);

			if (selector != "") {
					var parts;
					if (!number && !value) {
							parts = /^([0-9]*.?[0-9]+)(px|em)$/.exec(pair)
							if (parts != null) {
									number = Number(parts[1]);
									if (number + "" != "NaN") {
											value = parts[2];
									}
							}
					}

					if (value) {
							// Compile the sizzle selector
							if (sizzle.compile) {
									sizzle.compile(selector);
							}

							// Update the queryData object
							if (queryData[selector] === undefined) {
									queryData[selector] = {};
							}
							if (queryData[selector][type] === undefined) {
									queryData[selector][type] = {};
							}
							queryData[selector][type][pair] = [number, value];
					}
			}
	};

	var updateQueryData = function (data, doUpdate) {

			var i, j, k;
			for (i in data) {
					for (j in data[i]) {
							if (typeof data[i][j] == "string") {
									addQueryDataValue(i, j, data[i][j]);
							}
							else if (typeof data[i][j] == "object") {
									for (k = 0; k < data[i][j].length; k++) {
											addQueryDataValue(i, j, data[i][j][k]);
									}
							}
					}
			}

			if (doUpdate == true) {
					refresh();
			}
	};

	var processSelector = function (selectorText) {

			if (selectorText) {

					var regex = /(\[(min\-width|max\-width|min\-height|max\-height)\~\=(\'|\")([0-9]*.?[0-9]+)(px|em)(\'|\")\])(\[(min\-width|max\-width|min\-height|max\-height)\~\=(\'|\")([0-9]*.?[0-9]+)(px|em)(\'|\")\])?/gi;

					// Split out the full selectors separated by a comma ','
					var selectors = selectorText.split(",");
					var i, selector, result, number, prevIndex, k, tail, t;
					for (i = 0; i < selectors.length; i++) {

							selector = null;
							prevIndex = 0;
							k = 0;
							while (k == 0 || result != null) {
									result = regex.exec(selectors[i]);
									if (result != null) {

											// result[2] = min-width|max-width|min-height|max-height
											// result[4] = number
											// result[5] = px|em
											// result[7] = has another

											// Ensure that it contains a valid numeric value to compare against
											number = Number(result[4]);
											if (number + "" != "NaN") {

													if (selector == null) {
															// New set: update the current selector
															selector = selectors[i].substring(prevIndex, result.index);

															// Append second half of the selector
															tail = selectors[i].substring(result.index + result[1].length);
															if (tail.length > 0) {

																	t = tail.indexOf(" ");
																	if (t != 0) {
																			if (t > 0) {
																					// Take only the current part
																					tail = tail.substring(0, t);
																			}

																			// Remove any sibling element queries
																			tail = tail.replace(/(\[(min\-width|max\-width|min\-height|max\-height)\~\=(\'|\")([0-9]*.?[0-9]+)(px|em)(\'|\")\])/gi, "");
																			selector += tail;
																	}
															}
													}

													// Update the queryData object
													addQueryDataValue(selector, result[2], result[4] + result[5], number, result[5]);
											}

											if (result[7] === undefined || result[7] == "") {
													// Reached the end of the set
													prevIndex = result.index + result[1].length;
													selector = null;
											}
											else {
													// Update result index to process next item in the set
													regex.lastIndex = result.index + result[1].length;
											}
									}
									k++;
							}
					}
			}
	};

	// array of callbacks used to filter which stylesheets are processed
	// callback should return null, true, or false
	// true: process immediately
	// false: halt process immediately
	// null: proceed - allow other callbacks to process
	var processStyleSheetCallbacks = [];

	var addStyleSheetFilter = function(callback){
		processStyleSheetCallbacks.push(callback);
	};

	var processStyleSheet = function (styleSheet, force, refresh) {
			if(!force && processStyleSheetCallbacks.length > 0){
				// filter stylesheets based on callbacks
				for(var psci = 0; psci<processStyleSheetCallbacks.length; psci++){
					var result = processStyleSheetCallbacks[psci](styleSheet);
					if(result === true){
						break; // process immediately
					}else if(result === false){
						return; // halt process, exit
					} // else continue checking other callbacks
				}
			}

			if (cssRules == null) {
					setCssRules();
			}
			if (styleSheet[cssRules] && styleSheet[cssRules].length > 0) {

					var ownerNode = styleSheet.ownerNode || styleSheet.owningElement;
					if (force || (ownerNode.getAttribute("data-elementquery-bypass") === null && ownerNode.getAttribute("data-elementquery-processed") === null)) {

							var i, j, rule;

							for (i = 0; i < styleSheet[cssRules].length; i++) {
									rule = styleSheet[cssRules][i];

									// Check nested rules in media queries etc
									if (rule[cssRules] && rule[cssRules].length > 0) {
											for (j = 0; j < rule[cssRules].length; j++) {
													processSelector(rule[cssRules][j].selectorText);
											}
									}
									else {
											processSelector(rule.selectorText);
									}
							}

							// Flag the style sheet as processed
							ownerNode.setAttribute("data-elementquery-processed", "");
					}
			}

			if(refresh) refresh();
	};

	// Refactor from jQuery.trim()
	var trim = function (text) {
			if (text == null) {
					return "";
			}
			else {
					var core_trim = "".trim;
					if (core_trim && !core_trim.call("\uFEFF\xA0")) {
							return core_trim.call(text);
					}
					else {
							return (text + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
					}
			}
	};

	// Refactor from jquery().addClass() and jquery().removeClass()
	var clean = function (element, attr) {
			// This expression is here for better compressibility
			var val = element.getAttribute(attr);
			return val ? (" " + val + " ").replace(/[\t\r\n]/g, " ") : " ";
	};

	// Refactor from jquery().addClass()
	var addTo = function (element, attr, value) {

			if (element.nodeType === 1) {
					var val = trim(value);
					if (val != "") {
							var cur = clean(element, attr);

							if (cur.indexOf(" " + val + " ") < 0) {
									// Add the value if its not already there
									element.setAttribute(attr, trim(cur + val));
							}
					}
			}
	};

	// Refactor from jquery().removeClass()
	var removeFrom = function (element, attr, value) {

			if (element.nodeType === 1) {
					var val = trim(value);
					if (val != "") {
							var cur = clean(element, attr);
							var updated = false;
							while (cur.indexOf(" " + val + " ") >= 0) {
									// Remove the value
									cur = cur.replace(" " + val + " ", " ");
									updated = true;
							}
							if (updated) {
									// Update the attribute
									element.setAttribute(attr, trim(cur));
							}
					}
			}
	};

	var init = function () {
			// Process the style sheets
			var i;
			for (i = 0; i < document.styleSheets.length; i++) {
					processStyleSheet(document.styleSheets[i]);
			}

			refresh();
	}

	var refresh = function () {

			var i, ei, j, k, elements, element, val;

			// For each selector
			for (i in queryData) {

					// Get the items matching the selector
					elements = sizzle(i);

					if (elements.length > 0) {

							// For each matching element
							for (ei = 0; ei < elements.length; ei++) {
									element = elements[ei];

									// For each min|max-width|height string
									for (j in queryData[i]) {

											// For each number px|em value pair
											for (k in queryData[i][j]) {

													val = queryData[i][j][k][0];

													if (queryData[i][j][k][1] == "em") {
															// Convert EMs to pixels
															val = val * (getEmPixels ? getEmPixels(element) : 16); // NOTE: Using getEmPixels() has a small performance impact
													}

													/* NOTE: Using offsetWidth/Height so an element can be adjusted when it reaches a specific size.
													/* For Nested queries scrollWidth/Height or clientWidth/Height may sometime be desired but are not supported. */

													if ((j == "min-width" && element.offsetWidth >= val) ||
															(j == "max-width" && element.offsetWidth <= val) ||
															(j == "min-height" && element.offsetHeight >= val) ||
															(j == "max-height" && element.offsetHeight <= val)) {
															// Add matching attr value
															addTo(element, j, k);
													}
													else {
															// Remove non-matching attr value
															removeFrom(element, j, k);
													}
											}
									}
							}
					}
			}

			if (!window.addEventListener && window.attachEvent) {
					// Force a repaint in IE7 and IE8
					var className = document.documentElement.className;
					document.documentElement.className = " " + className;
					document.documentElement.className = className;
			}
	}

	// Expose some public functions
	var elementQuery = function (arg1, arg2) {

			if (arg1 && typeof arg1 == "object") {
					if (arg1.cssRules || arg1.rules) {
							// Process a new style sheet
							processStyleSheet(arg1, true);

							if (arg2 == true) {
									refresh();
							}
					} else {
							// Add new selector queries
							updateQueryData(arg1, arg2);
					}
			}
			else if (!arg1 && !arg2) {
					refresh();
			}
	};

	var hookWindowEvent = function(){
		if (window.addEventListener) {
				window.addEventListener("resize", refresh, false);
				window.addEventListener("DOMContentLoaded", init, false);
				window.addEventListener("load", init, false);
		}
		else if (window.attachEvent) {
				window.attachEvent("onresize", refresh);
				window.attachEvent("onload", init);
		}
	};

	var controlledInit = function(sizzleMethod, readyState){
		if(sizzleMethod){
			sizzle = sizzleMethod.find || sizzleMethod;
		}
		if(readyState == null) readyState = "complete"

		hookWindowEvent();
		// if already loaded, force init
		if(document.readyState === readyState){
			init();
		}
	};

	return {
		init: controlledInit,
		query: elementQuery,
		processStyleSheet: processStyleSheet,
		addStyleSheetFilter: addStyleSheetFilter,
		refresh: refresh
	};

})(global, document, undefined);
