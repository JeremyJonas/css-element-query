# Css ElementQuery

A **css element query** module based on [elementQuery polyfill](https://github.com/tysonmatanich/elementQuery).

Node module wrapper to expose [elementQuery](https://github.com/tysonmatanich/elementQuery) methods and functionality.

Original work by [Tyson Matanich](https://github.com/tysonmatanich)

**Article:** http://coding.smashingmagazine.com/2013/06/25/media-queries-are-not-the-answer-element-query-polyfill/

## Install

### [NPM](http://npmjs.org/)
#### Install: `npm install css-element-query`
#### Use:
With `window.Sizzle` or `window.jQuery` global.
```
var elementQuery = require("css-element-query");
elementQuery.init();
```
With `jQuery` module.
```
var jQuery = require("jquery");
var elementQuery = require("css-element-query");
elementQuery.init(jQuery);
```

## CSS Syntax
This rule queries itself for a **single** condition:
```css
header[min-width~="500px"] {
	background-color: #eee;
}
```

This rule queries itself for **multiple** conditions:
```css
header[min-width~="500px"][max-width~="800px"] {
	background-color: #eee;
}
```

This rule queries a **parent** for a condition:
```css
header[min-width~="31.250em"] nav {
	clear: both;
}
```

This rule queries **itself** and a **parent** for conditions:
```css
header[min-width~="31.250em"] nav[min-height~="1em"] {
	color: #333;
}
```

### Query types
The following query types are supported: `min-width`, `max-width`, `min-height`, `max-height`.


## Exposed Methods
### init: `([sizzleMethod, readyState])`
Initializes auto processing of StyleSheets on window load.

If window is already loaded, it will be initialized immediately to allow for async scripts.

***@sizzleMethod*** {Function} *optional*
>Sets the method used to perform sizzle (`jQuery.find`). If `null` then `window.Sizzle` or `window.JQuery` will be used if available.

***@readyState*** {String} *optional*
>Sets the `document.readyState` to check for immediate processing.

>Defaults to `complete`.

***Usage:***
```javascript
elementQuery.init();

elementQuery.init(jQuery);

elementQuery.init(jQuery, "interactive");
```

### processStyleSheet: `(styleSheet, [force, refresh])`
Process specific CSSStyleSheet instance. Exposes same internal method used to auto process StyleSheets.

***@styleSheet*** {CSSStyleSheet} *required*
>CSSStyleSheet instance to process.

***@force*** {Boolean} *optional*
>Force processing even if StyleSheet has been processed. Force will ignore all filters.

>Default `false`

***@refresh*** {Boolean} *optional*
>Perform `refresh()` after processing.

>Default `false`

### refresh: `()`
Refresh element query attribute mapping. Exposes the internal `refresh()` method.

### query: `(*)`
>See [Selector Rregistration](#selector-registration)

### addStyleSheetFilter: `(callback)`
Adds StyleSheet processing callback to enable filtering.

***@callback*** {Function} *required*
>Function called before processing each StyleSheet.
Callback signature:
```javascript
function(styleSheet){
	if(styleSheet meets whitelist conditions)
		return true // process stylesheet
	if(styleSheet meets blacklist conditions)
		return false // do NOT process stylesheet
	return null // pass to next filter
}
```
>***@styleSheet*** {CSSStyleSheet}

>***@return*** Returns `true` to process styleSheet, `false` to not process styleSheet, and `null` to pass to next filter.

*Filter callbacks are ignored when `force` is true.*

***Usage:*** [coffescript](http://coffeescript.org/)

Whitelist: *Only process a specific stylesheet*
```coffee
elementQuery = require "css-element-query"
elementQuery.addStyleSheetFilter (styleSheet) ->
	return styleSheet.ownerNode?.innerText?.startsWith("/* Ractive.js component styles */")
elementQuery.init(jQuery)
```
Blacklist: *Process all except a specific stylesheet*
```coffee
elementQuery = require "css-element-query"
elementQuery.addStyleSheetFilter (styleSheet) ->
	if styleSheet.href?.indexOf("jquery") isnt -1
		return false
	else
		return null
elementQuery.init(jQuery)
```

## Selector registration

The **master branch** of elementQuery will parse your style sheets, however if you have cross-domain style sheets you will have to manualy register your selectors. The **prod branch** requires the selector information to be declared in JavaScript, which avoids the cross-domain file issue and the time required to parse the style sheets.

Here is an example of how to export elementQuery selector information using the master branch:
```javascript
console.log(JSON.stringify(elementQuery.query.selectors()));
```

And here is an example of how to import elementQuery selector information using the prod branch:
```javascript
elementQuery.query({"header":{"min-width":["500px","31.250em"],"max-width":["800px"]}});
```

## Dependencies
Sizzle (http://sizzlejs.com/) or jQuery (http://jquery.com/)
Either as global or passed in during `init(sizzleMethod)`.
* `window.Sizzle` - enabled `init()`
* `window.jQuery` - enabled `init()`
* `elementQuery.init(jQuery)`
* `elementQuery.init(jQuery.find)`
* `elementQuery.init(sizzle)`


## [Support](https://github.com/tysonmatanich/elementQuery#support)

`[min-width~='10px']` selectors are not supported in IE6.
