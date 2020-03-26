/**
 * Object giving the formatting functions of the english locale.
 */
var localization = (function(d3) {
  "use strict";

  var self = {};
  var englishLocale = {
    "decimal": ",",
    "thousands": "",
    "grouping": [3],
    "currency": ["$", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };
  var customTimeFormat = [
    [".%L", function(d) { return d.getMilliseconds(); }],
    [":%S", function(d) { return d.getSeconds(); }],
    ["%I:%M", function(d) { return d.getMinutes(); }],
    ["%I %p", function(d) { return d.getHours(); }],
    ["%d %b", function(d) { return d.getDate() !== 1; }],
    ["%B", function(d) { return d.getMonth(); }],
    ["%Y", function() { return true; }]
  ];
  var locale = d3.timeFormatDefaultLocale(englishLocale);

  /**
   * Gets the locale rules
   *
   * @return object   Object containing all the rules
   */
  self.getLocale = function() {
    return locale;
  };

  self.getMonthStr = function() {
    return englishLocale.shortMonths;
  }

  self.getShortMonthDay = function(datetime){
    return self.getMonthStr()[datetime.getMonth()] + ", " + datetime.getDate();
  }

  /**
   * Formats the date using the locale rules
   *
   * @param date    The date object to format
   * @return {*}    The formatted date object
   */
  self.getFormattedDate = function(date) {

    return locale.format(customTimeFormat.find(function(format) {
      return format[1](date)
    })[0])(date);
  };

  /**
   * Formats a number using the locale rules
   *
   * @param number      The number object to format
   * @return {string}   The formatted number object
   */
  self.getFormattedNumber = function(number) {
    if (number % 1 !== 0) {
      number = number.toFixed(2).replace('.', ',')
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  /**
   * Formats a percentage using the locale rules
   *
   * @param percent     The percentage object to format
   * @return {string}   The formatted percentage object
   */
  self.getFormattedPercent = function(percent) {
    return d3.format(".1%")(percent).replace(".", ",");
  };

  self.capitalize = function(s) {
    if(typeof s !== 'string') {
      return '';
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return self;
})(d3);
