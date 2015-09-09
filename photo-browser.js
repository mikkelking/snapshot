var stream;
var closeAndCallback;

var photos = [];
var photo = new ReactiveVar(null);
var error = new ReactiveVar(null);
var waitingForPermission = new ReactiveVar(null);

var canvasWidth = 0;
var canvasHeight = 0;
var magnification = [4];    // Magnification factor - more effective than image quality - defaults to 1 image at 640/480

var quality = 80;

Template.viewfinder.rendered = function() {
  var template = this;

  waitingForPermission.set(true);

  var video = template.find("video");

  // stream webcam video to the <video> element
  var success = function(newStream) {
    stream = newStream;

    if (navigator.mozGetUserMedia) {
      video.mozSrcObject = stream;
    } else {
      var vendorURL = window.URL || window.webkitURL;
      video.src = vendorURL.createObjectURL(stream);
    }
    video.play();

    waitingForPermission.set(false);
  };

  // user declined or there was some other error
  var failure = function(err) {
    error.set(err);
  };

  // tons of different browser prefixes
  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );

  if (! navigator.getUserMedia) {
    // no browser support, sorry
    failure("BROWSER_NOT_SUPPORTED");
    return;
  }

  // initiate request for webcam
  navigator.getUserMedia({
      video: true,
      audio: false
  }, success, failure);

  // resize viewfinder to a reasonable size, not necessarily photo size
  var viewfinderWidth = 280;
  var viewfinderHeight = 210;
  var resized = false;
  video.addEventListener('canplay', function() {
    if (! resized) {
      viewfinderHeight = video.videoHeight / (video.videoWidth / viewfinderWidth);
      video.setAttribute('width', viewfinderWidth);
      video.setAttribute('height', viewfinderHeight);
      resized = true;
    }
  }, false);
};

// is the current error a permission denied error?
var permissionDeniedError = function () {
  return error.get() && (
    error.get().name === "PermissionDeniedError" || // Chrome and Opera
    error.get() === "PERMISSION_DENIED" // Firefox
  );
};

// is the current error a browser not supported error?
var browserNotSupportedError = function () {
  return error.get() && error.get() === "BROWSER_NOT_SUPPORTED";
};

Template.camera.helpers({
  photo: function () {
    return photo.get();
  },
  error: function () {
    return error.get();
  },
  permissionDeniedError: permissionDeniedError,
  browserNotSupportedError: browserNotSupportedError
});

Template.camera.events({
  "click .use-photo": function () {
    console.log("Using photo");
//    closeAndCallback(null, photos);
    callbackOnly(null, photos);
// Go back for more!
    photos = [];
    photo.set(null);    // Nulling preview shows video again
  },
  "click .new-photo": function () {
    photos = [];
    photo.set(null);     // Nulling preview shows video again
  },
  "click .cancel": function () {
    if (permissionDeniedError()) {
      closeAndCallback(new Meteor.Error("permissionDenied", "Camera permissions were denied."));
    } else if (browserNotSupportedError()) {
      closeAndCallback(new Meteor.Error("browserNotSupported", "This browser isn't supported."));
    } else if (error.get()) {
      closeAndCallback(new Meteor.Error("unknownError", "There was an error while accessing the camera."));
    } else {
      closeAndCallback(new Meteor.Error("cancel", "Photo taking was cancelled."));
    }
    
    if (stream) {
      stream.active = false;
    }
  }
});

Template.viewfinder.events({
  'click .shutter': function (event, template) {
//    if (typeof magnification === 'Array' ){
      _.each(magnification, function(mag, index, list) {
        var video = template.find("video");
        var canvas = template.find("canvas");
        canvasWidth = video.width * mag;    // Pick up the dimensions from the video frame 
        canvasHeight = video.height * mag;  // - then it's not clipped (if in portrait mode)
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvasWidth, canvasHeight);
        var p = canvas.toDataURL('image/jpeg', quality);
        photos.push(p);
        if (index === 0)
          photo.set(canvas.toDataURL('image/jpeg', quality));
        console.log("Took Picture "+index+" at "+canvasWidth+"x"+canvasHeight);
      });
    callbackOnly(null, photos);
// Go back for more!
    photos = [];
    photo.set(null);    // Nulling preview shows video again
//    } else {
//      console.log(magnification);
//      console.log(typeof magnification);
//      alert("Can't take photo, because options.magnification should be an Array");
//    }
//    stream.active = false;
  }
}); 

Template.viewfinder.helpers({
  "waitingForPermission": function () {
    return waitingForPermission.get();
  }
});

/**
 * @summary Get a picture from the device's default camera.
 * @param  {Object}   options  Options
 * @param {Number} options.magnification - Magnification factor x 640px. Use 1 to get a 640x480 image
 * @param {Number} options.height The minimum height of the image
 * @param {Number} options.width The minimum width of the image - NOT REQUIRED, JUST SPECIFY WIDTH, 
 *                               ASPECT RATIO is preserved
 * @param {Number} options.quality [description]
 * @param  {Function} callback A callback that is called with two arguments:
 * 1. error, an object that contains error.message and possibly other properties
 * depending on platform
 * 2. data, a Data URI string with the image encoded in JPEG format, ready to
 * use as the `src` attribute on an `<img />` tag.
 */
MeteorCamera.getPicture = function (options, callback) {
  // if options are not passed
  if (! callback) {
    callback = options;
    options = {};
  }
  myCallback = options.callback;

  magnification = options.magnification || [640/280];   // We are using a 280px wide video control as a starting point
  if (options.width) {
    magnification = [options.width / 280]; 
  }
  desiredHeight = options.height || 480;    // Deprecated

  // Canvas#toDataURL takes the quality as a 0-1 value, not a percentage
  quality = (options.quality || 49) / 100;

  var view;
  
  closeAndCallback = function () {
    var originalArgs = arguments;
    console.log(arguments);
    UI.remove(view);
    photos = [];
    photo.set(null);
    callback.apply(null, originalArgs);
  };
  callbackOnly = function (something,arguments) {
//    var originalArgs = arguments;
    console.log(arguments);
//    callback.apply(null, originalArgs);
    console.log(myCallback);
    myCallback(arguments);
  };
  
  view = UI.renderWithData(Template.camera);
  UI.insert(view, document.body);
};
