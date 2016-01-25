"use strict";

import CONST from './enums/CONST';
import EVENTS from './enums/EVENTS';

import Node from './dataobjects/Node';
import Edge from './dataobjects/Edge';

/**
 * Handling events like: click, mousemove, dblclick ...
 */

function D3EventManager(d3Element) {
  if(d3Element === undefined) {
    throw new Error('The EventManager needs a "container" to attach and listen for events.');
  }

  this._container = d3Element;
  this._eventCallbackHandlers = {};

  //need to attach 'this' because the function will be called in different context
  var dispatch = this.dispatch.bind(this);

  // user event handling
  this._container.on("click", _svgClickHandler);
  this._container.on("dblclick", _svgDbClickHandler);
  this._container.on("mousedown", _svgMouseDownHandler);
  this._container.on("mouseup", _svgMouseUpHandler);
  this._container.on("contextmenu", _contextClickHandler);

  /**
   *
   */
  function _svgClickHandler() {
    const target = d3.event.target;

    //click on the root svg element
    if(target.classList.contains(CONST.EDITOR_CLASS)) {
      /* eslint-disable */
      const node = new Node({
        x: d3.mouse(this)[0],
        y: d3.mouse(this)[1]
      });
      /* eslint-enable */

      d3.event.preventDefault();

      dispatch(EVENTS.ADD_NODE, node);
    }

    //click on node
    if(target.parentElement.classList.contains('node')) {
      console.log('select node');
    }
  }

  /**
   *
   */
  function _contextClickHandler() {
    const target = d3.event.target;
    var position = d3.mouse(this);

    console.log('contextClickHandler');
    d3.event.preventDefault();

    dispatch(EVENTS.SHOW_CONTEXT_MENU, {});
  }

  /**
   *
   */
  function _svgMouseDownHandler() {
    const target = d3.event.target;
    //console.log('svgMouseDownHandler');
    //editor.svg.on("mousemove", svgMouseMoveHandler);
    d3.event.preventDefault();
  }

  /**
   *
   */
  function _svgMouseMoveHandler() {
    const target = d3.event.target;
    //console.log('svgMouseMoveHandler');
    d3.event.preventDefault();
  }

  /**
   *
   */
  function _svgMouseUpHandler() {
    const target = d3.event.target;
    //console.log('svgMouseUpHandler');
    //editor.svg.on("mousemove", null);
    d3.event.preventDefault();
  }

  /**
   *
   */
  function _svgDbClickHandler() {
    const target = d3.event.target;
    //console.log('svgDbClickHandler');
    d3.event.preventDefault();

    dispatch(EVENTS.SELECT_NODE, {});
    dispatch(EVENTS.SELECT_EDGE, {});
  }
}

/**
 *
 * @param {string} eventType
 * @param {object} eventData
 */
D3EventManager.prototype.dispatch = function(eventType, eventData) {
  if(!this._eventCallbackHandlers[eventType]) {
    return;
  }

  this._eventCallbackHandlers[eventType].forEach(function(callbackHandler) {
    callbackHandler(eventData);
  });
};

/**
 *
 * @param {string} eventType
 * @param {function} callbackHandler
 */
D3EventManager.prototype.on = function(eventType, callbackHandler) {
  var eventCallbackHandlers = this._eventCallbackHandlers[eventType];

  if(!eventCallbackHandlers) {
    this._eventCallbackHandlers[eventType] = [];
  }

  this._eventCallbackHandlers[eventType].push(callbackHandler);
};

/**
 *
 * @param {string} eventType
 * @param {function} callbackHandler
 */
D3EventManager.prototype.off = function(eventType, callbackHandler) {
  this._eventCallbackHandlers[eventType].forEach(function(callback, i) {
    if(callback === callbackHandler) {
      delete this._eventCallbackHandlers[eventType][i];
    }
  }.bind(this));
};

export default D3EventManager;