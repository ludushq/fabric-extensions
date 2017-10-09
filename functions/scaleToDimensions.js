/*

Why i needed this:

If you change the width or the height of an image, the image doesn't scale to
those properties anymore. Instead, it only sets the viewable portion of the
image.


How i use this:

On "object:modified", if the object is an image, i call this function.


Notes:

I still need to fix the stroke and the shadow, i have some clues:
- https://stackoverflow.com/questions/34265823/unable-to-maintain-thickness-of-strokewidth-while-resizing-in-case-of-groups-in/
- https://github.com/kangax/fabric.js/issues/2012
- https://github.com/kangax/fabric.js/issues/4235

*/

/**
 * Scale an object to it's dimensions.
 * @param {Object} object The object to scale
 * @param {Number} width The width to scale to
 * @param {Number} height The height to scale to
 */
scaleToDimensions = function(object, width, height) {
  switch (object.type) {
    case "image":
      var scaleX = width / object._originalElement.naturalWidth;
      var scaleY = height / object._originalElement.naturalHeight;

      if (scaleX !== 1) {
        object.width = object._originalElement.naturalWidth;
        object.scaleX = scaleX;
      }

      if (scaleY !== 1) {
        object.height = object._originalElement.naturalHeight;
        object.scaleY = scaleY;
      }

      canvas.requestRenderAll();

      break;
  }
};
