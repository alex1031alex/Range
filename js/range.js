// Selectors
const SCALE_SELECTOR = `.range__scale`;
const BAR_SELECTOR = `.range__bar`;
const MIN_THUMB_SELECTOR = `.range__thumb--min`;
const MAX_THUMB_SELECTOR = `.range__thumb--max`;
const MIN_INPUT_SELECTOR = `.filter__number-field--min`;
const MAX_INPUT_SELECTOR = `.filter__number-field--max`;

// Adjust the overlap of the thumbs by changing this ratio
const THUMBS_OVERLAP_RATIO = 0.9; // from 0 to 2

document.addEventListener(`DOMContentLoaded`, () => {
  const $range = document.querySelector(`.filter--price`);
  new Range($range, 0, 35000).init();
});

const getCoords = (elem) => {
  const box = elem.getBoundingClientRect();
  return {
    x: box.x + window.pageXOffset,
    y: box.y + window.pageYOffset
  }
};

export default class Range {
  constructor($root, min, max) {
    this._$root = $root;
    this._min = min;
    this._max = max;
    this._valueInterval = this._max - this._min;

    this._$scale = null;
    this._$bar = null;
    this._$minThumb = null;
    this._$maxThumb = null;
    this._$inputFrom = null;
    this._$inputTo = null;

    this._minThumbLeft = 0;
    this._maxThumbLeft = 0;
    this._scaleWidth = 0;
    this._thumbWidth = 0;
    this._cursorShift = 0;
    this._activeThumb = this._$maxThumb;
  }

  init() {
    if (!this._$root) {
      return;
    }

    this._$scale = this._$root.querySelector(SCALE_SELECTOR);
    this._$bar = this._$root.querySelector(BAR_SELECTOR);
    this._$minThumb = this._$root.querySelector(MIN_THUMB_SELECTOR);
    this._$maxThumb = this._$root.querySelector(MAX_THUMB_SELECTOR);
    this._$inputFrom = this._$root.querySelector(MIN_INPUT_SELECTOR);
    this._$inputTo = this._$root.querySelector(MAX_INPUT_SELECTOR);

    this._minThumbLeft = getCoords(this._$minThumb).x - this._getScaleStart();
    this._maxThumbLeft = getCoords(this._$maxThumb).x - this._getScaleStart();

    this._thumbWidth = this._$minThumb.offsetWidth;
    this._thumbsOverlap = this._thumbWidth * (1 - THUMBS_OVERLAP_RATIO);

    this._scaleWidth = this._$scale.offsetWidth;
  
    this._mousemoveHandler = this._mousemoveHandler.bind(this);
    this._mouseupHandler = this._mouseupHandler.bind(this);
    this._fromChangeHandler = this._fromChangeHandler.bind(this);
    this._toChangeHandler = this._toChangeHandler.bind(this);

    // Cansel the default drag event listeners
    this._$minThumb.ondragstart = () => false;
    this._$maxThumb.ondragstart = () => false;

    this._$inputFrom.setAttribute(`min`, this._min);
    this._$inputTo.setAttribute(`max`, this._max);

    this._addListeners();
  }

  _getScaleStart() {
    return getCoords(this._$scale).x;
  }

  _addListeners() {
    this._$minThumb.addEventListener(`mousedown`, (evt) => {
      this._activeThumb = this._$minThumb;
      const minThumbX = getCoords(this._$minThumb).x;
      this._cursorShift = evt.pageX - minThumbX;

      document.addEventListener(`mousemove`, this._mousemoveHandler);
      document.addEventListener(`mouseup`, this._mouseupHandler, true);

      return false;
    });
    
    this._$maxThumb.addEventListener(`mousedown`, (evt) => {
      this._activeThumb = this._$maxThumb;
      const maxThumbX = getCoords(this._$maxThumb).x;
      this._cursorShift = evt.pageX - maxThumbX;

      document.addEventListener(`mousemove`, this._mousemoveHandler);
      document.addEventListener(`mouseup`, this._mouseupHandler);

      return false;
    });

    this._$inputFrom.addEventListener(`change`, this._fromChangeHandler);
    this._$inputTo.addEventListener(`change`, this._toChangeHandler);
  }

  _mousemoveHandler(evt) {
    const scaleStart = this._getScaleStart();
    let newLeft = evt.pageX - this._cursorShift - scaleStart;

    if (this._activeThumb && this._activeThumb === this._$minThumb) {
      this._setMinThumb(newLeft);
      this._setBar();
      this._setFrom();
    } 

    if (this._activeThumb && this._activeThumb === this._$maxThumb) {
      this._setMaxThumb(newLeft);
      this._setBar();
      this._setTo();
    }
  }

  _mouseupHandler() {
    document.removeEventListener(`mousemove`, this._mousemoveHandler);
    document.removeEventListener(`mouseup`, this._mouseupHandler);
  }

  _setMinThumb(newLeft) {
    const maxThumbStart = getCoords(this._$maxThumb).x;
    const scaleStart = this._getScaleStart();

    const maxThumbLeft = maxThumbStart - scaleStart;

    const leftEdge = 0;
    const rightEdge = maxThumbLeft - this._thumbsOverlap;

    if (newLeft < leftEdge) {
      newLeft = leftEdge;
    }

    if (newLeft > rightEdge) {
      newLeft = rightEdge;
    }

    this._minThumbLeft = newLeft;
    this._$minThumb.style.left = `${newLeft}px`;
  }

  _setMaxThumb(newLeft) {
    const minThumbStart = getCoords(this._$minThumb).x;
    const scaleStart = this._getScaleStart();

    const minThumbLeft = minThumbStart - scaleStart;

    const leftEdge = minThumbLeft + this._thumbsOverlap;
    const rightEdge = this._scaleWidth - this._thumbWidth;

    if (newLeft < leftEdge) {
      newLeft = leftEdge;
    }

    if (newLeft > rightEdge) {
      newLeft = rightEdge;
    }

    this._maxThumbLeft = newLeft;
    this._$maxThumb.style.left = `${newLeft}px`;
  }

  _setBar() {
    const scaleStart = this._getScaleStart();
    const minThumbStart = getCoords(this._$minThumb).x;
    const maxThumbEnd = getCoords(this._$maxThumb).x + this._thumbWidth;

    const barStart = minThumbStart - scaleStart;
    const barWidth = maxThumbEnd - minThumbStart;

    this._$bar.style.left = `${barStart}px`;
    this._$bar.style.width = `${barWidth}px`;
  }

  _setFrom() {
    const valueFrom = (this._minThumbLeft / this._scaleWidth) * 
    this._valueInterval + this._min;

    this._$inputFrom.value = Math.round(valueFrom);
  }

  _setTo() {
    const valueTo = ((this._maxThumbLeft + this._$maxThumb.offsetWidth) / 
    this._scaleWidth) * this._valueInterval;

    this._$inputTo.value = Math.round(valueTo);
  }

  _fromChangeHandler(evt) {
    const value = evt.target.valueAsNumber;
    const maxValue = this._$inputTo.valueAsNumber;

    if (value < this._min) {
      this._setMinThumb(0);
      this._setBar();
      return;
    }

    if (value > maxValue) {
      const newLeft = this._maxThumbLeft - this._thumbsOverlap;
      evt.target.value = maxValue;
      this._setMinThumb(newLeft);
      this._setBar();
      return;
    }

    const newLeft = value / this._valueInterval * this._scaleWidth;
    this._setMinThumb(newLeft);
    this._setBar();
  }

  _toChangeHandler(evt) {
    const value = evt.target.valueAsNumber;
    const minValue = this._$inputFrom.valueAsNumber;

    if (value < minValue) {
      const newLeft = this._minThumbLeft + this._thumbsOverlap;
      evt.target.value = minValue;
      this._setMaxThumb(newLeft);
      this._setBar();
      return;
    }

    if (value > this._max) {
      this._setMaxThumb(this._scaleWidth);
      this._setBar();
      return;
    }

    const newLeft = value / this._valueInterval * this._scaleWidth;
    this._setMaxThumb(newLeft);
    this._setBar();
  }
}
