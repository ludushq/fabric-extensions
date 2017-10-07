/*

Why i needed this:

Some properties of Fabric objects (stroke, shadow, maybe even more) are
influenced by the scale, but i needed them to be the same for all objects on
the canvas. For example: if a user sets the strokeWidth of a object to 2, it
should be the same as other objects that are also set to 2. The scaling messed
it up.


How i use this:

When i initialise my Angular application, i have a function that starts
listeners for fabric events. The resizeToScale function can be triggered by
2 events:

- "object:scaling". During scaling the strokes and shadows are always the same
  size. Looks good but not so good for performance though. Sometimes in older
  browsers or on older computers it can be a bit slow.
- "object:modified". During scaling the strokes and shadows scale as well, but
  when scaling is done, they are set to the correct size. Doesn't look as good
  as resizing during scaling, but it doen't impact performance.

I use "object:modified" now, because performance is more important for me than
looks, but maybe there is another way where we can have both?

Another way to use this function is after the user sets the width or height of
an object manually, using the input fields in the sidebar next to the canvas.


Usage examples:

This code is from my Angular app, i tried to make it more standalone. Depending
on the way this function is used, this is the way the parameters are used:

- From the listeners i only use the object parameter. So this is basically if
  the user changes the object scale on the canvas by dragging the controls. The
  function uses the properties that are inside the object.

  canvas.on({"object:modified": this.onObjectModified});
  onObjectModified = function(event) {
    resizeToScale(event.target);
  }

- If the user changes the width or height manually, i set updateDimensions to
  false, so the function doesn't change the width and height (because we want
  the values the user set). If the width is changed, use the user inputted width
  and the current height, if the height is changed, use the original width and
  the user inputted height.

  resizeToScale(object, false, value, object.height);
  or
  resizeToScale(object, false, object.width, value);

Notes:

The stateful property of the canvas has to be true for this function to work.

Path and path-group type objects are on my todo-list, they are very complex and
i don't use those myself. But i would like to fix them as well, just for fun.

Image type objects used to work just like rects, but they changed the behaviour
of width and height for images. I made a seperate function to fix that. It is
not fully done but i'll put that one in this repo as well.

When objects are becoming too small, i make them invisible, i do that for 3
reasons:

- When resizing a lot using the controls on the object on the canvas, if the
  object becomes very small and then big again, it's position on the canvas
  changes a little bit (because of Math.round). I need it to stay in it's place.
  Flipping an object by dragging it over the axis still works though, it will
  just flip the object.
- When resizing using the manual inputs, if the user inputs a value that is too
  low, it will make the object unusable for printing.
- When working with very low values (Example: 0.000000001), the values sometimes
  become infinite or NaN, this will make some browsers crash. There is a
  NUM_FRACTION_DIGITS setting for objects, but is seems to be buggy.

Invisible objects are automatically removed from my canvas when i save the
magazinepage.

I think you guys can remove the 'too small' part for your use case.

*/

/**
 * Resize an object to it's scale and set scale to 1.
 * @param {Object} object The object to resize
 * @param {Boolean} updateDimensions Choose whether or not to update dimensions
 * @param {Number} width The width to resize to
 * @param {Number} height The height to resize to
 */
resizeToScale = function(
  object,
  updateDimensions = true,
  width = 0,
  height = 0
) {
  switch (object.type) {
    case "circle":
      var resizedRadius = 0;

      // Check if the resize is by dimensions or by scale
      if (updateDimensions) {
        // Resize by scale. Check if the circle was resized on the x-axis or y-axis
        var scaleXChanged =
          typeof object._stateProperties == "undefined" ||
          object._stateProperties.scaleX == object.scaleX
            ? false
            : true;
        var scaleYChanged =
          typeof object._stateProperties == "undefined" ||
          object._stateProperties.scaleY == object.scaleY
            ? false
            : true;

        // Multiply the radius by the proper scale
        if (scaleXChanged) {
          resizedRadius = object.radius * object.scaleX;
        } else {
          resizedRadius = object.radius * object.scaleY;
        }
      } else {
        // Resize by dimensions. Check if the circle was resized on the x-axis or y-axis
        var widthChanged =
          object._stateProperties.scaleX == object.scaleX ? false : true;
        var heightChanged =
          object._stateProperties.scaleY == object.scaleY ? false : true;

        // Set the radius the half the proper dimension
        if (widthChanged) {
          resizedRadius = object.width / 2 * object.scaleX;
        } else if (heightChanged) {
          resizedRadius = object.height / 2 * object.scaleY;
        }

        // Set the radius
        object.radius = resizedRadius;

        // Set the scale to 1
        object.scaleX = 1;
        object.scaleY = 1;
      }

      // Check for valid proposed radius
      if (resizedRadius >= 4 && isFinite(resizedRadius)) {
        // Reset the object visibility
        object.visible = true;

        if (updateDimensions) {
          // Set the radius
          object.radius = resizedRadius;

          // Set the scale to 1
          object.scaleX = 1;
          object.scaleY = 1;
        }
      } else {
        // If the proposed dimensions are NaN, Infinite or too small, make the object invisible
        object.visible = false;
        return false;
      }

      break;
    case "ellipse":
      var resizedRadiusX = 0;
      var resizedRadiusY = 0;
      var resizedWidth = width;
      var resizedHeight = height;

      // Check if the resize is by dimensions or by scales
      if (updateDimensions) {
        // Resize by scale. Multiply the radii by the scales
        resizedRadiusX = object.rx * object.scaleX;
        resizedRadiusY = object.ry * object.scaleY;

        // Double the radii
        resizedWidth = resizedRadiusX * 2;
        resizedHeight = resizedRadiusY * 2;
      } else {
        // Set the dimensions
        object.width = width;
        object.height = height;

        // Resize by dimensions. Set the radii to the half the dimensions
        resizedRadiusX = object.width / 2;
        resizedRadiusY = object.height / 2;

        // Set the radii
        object.rx = resizedRadiusX;
        object.ry = resizedRadiusY;

        // Set the scale to 1
        object.scaleX = 1;
        object.scaleY = 1;
      }

      // Check for valid proposed dimensions
      if (
        resizedWidth >= 1 &&
        isFinite(resizedWidth) &&
        resizedHeight >= 1 &&
        isFinite(resizedHeight)
      ) {
        // Reset the object visibility
        object.visible = true;

        if (updateDimensions) {
          // Set the radii
          object.rx = resizedRadiusX;
          object.ry = resizedRadiusY;

          // Set the dimensions
          object.width = resizedWidth;
          object.height = resizedHeight;

          // Set the scale to 1
          object.scaleX = 1;
          object.scaleY = 1;
        }
      } else {
        // If the proposed dimensions are NaN, Infinite or too small, make the object invisible
        object.visible = false;
        return false;
      }

      break;
    case "polygon":
    case "polyline":
      // Multiply the dimensions by the scale
      if (updateDimensions) {
        var resizedWidth = object.width * object.scaleX;
        var resizedHeight = object.height * object.scaleY;
      } else {
        var resizedWidth = width;
        var resizedHeight = height;
      }

      // Check for valid proposed dimensions
      if (
        resizedWidth >= 1 &&
        isFinite(resizedWidth) &&
        resizedHeight >= 1 &&
        isFinite(resizedHeight)
      ) {
        // Reset the object visibility
        object.visible = true;

        // Recalculate all points based on the scale
        var points = object.get("points");
        for (var i = 0; i < points.length; i++) {
          points[i].x *= object.scaleX;
          points[i].y *= object.scaleY;
        }

        // Set the dimensions
        object.width = resizedWidth;
        object.height = resizedHeight;

        // Correct the offset within the bounding box
        object.pathOffset.x = object.width / 2;
        object.pathOffset.y = object.height / 2;

        // Set the scale to 1
        object.scaleX = 1;
        object.scaleY = 1;
      } else {
        // If the proposed dimensions are NaN, Infinite or too small, make the object invisible
        object.visible = false;
        return false;
      }

      break;
    case "path":
    case "path-group":
      //
      break;
    case "rect":
      // Multiply the dimensions by the scale
      if (updateDimensions) {
        var resizedWidth = object.width * object.scaleX;
        var resizedHeight = object.height * object.scaleY;
      } else {
        var resizedWidth = width;
        var resizedHeight = height;
      }

      // Check for valid proposed dimensions
      if (
        resizedWidth >= 1 &&
        isFinite(resizedWidth) &&
        resizedHeight >= 1 &&
        isFinite(resizedHeight)
      ) {
        // Reset the object visibility
        object.visible = true;

        // Set the dimensions
        object.width = resizedWidth;
        object.height = resizedHeight;

        // Set the scale to 1
        object.scaleX = 1;
        object.scaleY = 1;
      } else {
        // If the proposed dimensions are NaN, Infinite or too small, make the object invisible
        object.visible = false;
        return false;
      }

      break;
    case "line":
      // Multiply the width by the scale
      if (updateDimensions) {
        var resizedWidth = object.width * object.scaleX;
      } else {
        var resizedWidth = width;
      }

      // Check for valid proposed width
      if (resizedWidth >= 1 && isFinite(resizedWidth)) {
        // Reset the object visibility
        object.visible = true;

        // Set the width
        object.width = resizedWidth;

        // Set the scale to 1
        object.scaleX = 1;
      } else {
        // If the proposed dimensions are NaN, Infinite or too small, make the object invisible
        object.visible = false;
        return false;
      }

      break;
    default:
      //
      break;
  }
};
