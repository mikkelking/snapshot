# Meteor Camera Snapshot Package

Add it to your [Meteor](http://meteor.com) app with `meteor add mikkelking:snapshot`. The api is super simple - there is only one function to call. This is based on mdg:camera, with improvements to keep the image inside the dialog box, and to allow portrait mode without stretching or clipping the image. It also allows multiple sizes to be captured in one go. For example if you want a smaller thumbnail as well as the main image. In my app that uses this, I capture 3 sizes, small medium and large.

### MeteorCamera.getPicture([options], callback)

Prompt the user to take a photo with their device and get the picture as a Data URI in JPEG format.

#### options

`options` is an optional argument that is an Object with the following possible keys:

- `width` An integer that specifies the minimum width of the returned photo. Height is automatic, depending on orientation (landscape/portrait)
- `magnification` An array of multipliers which controls the size of the image - 2.286 (the default) gives you a picture size of 640x480, set to 1 gives you 280x210
- `quality` A number from 0 to 100 specifying the desired quality of JPEG encoding.

#### callback(error, data)

`callback` is a required argument that is a function that takes two arguments:

- `error` A [Meteor.Error](http://docs.meteor.com/#meteor_error) with a platform-specific error message.
- `data` A base64-encoded data URI for the image taken by the camera. This parameter can be used directly in the 'src' attribute of an image tag.


> Warning: In the iOS simulator, the device camera is not accessible so you will get an error that says "source type 1 not available."
> I'm working on a fallback for iOS that will use the photo library when the camera is not available, but for now just test in your web browser, a physical device, or the Android simulator.
