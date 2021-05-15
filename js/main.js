
var constraints;
var imageCapture;
var mediaStream;
var videoSelect = document.querySelector('select#videoSource');
var video = document.querySelector('video');

var nVideos = 60*60;
var canvases = []; 

var rows = 1;
var cols = 1;

var vW;
var vH;

var cvs = document.getElementById('maincvs');
var ctx = cvs.getContext('2d');

var updateCall  = setInterval(update, 1000);
var drawCall    = setInterval(draw, 100);
var cnt = 1;

var captureRate = 15;
var imgs = [];
var imgsTimes = [];

cvs.style.width = screen.height;

function update() {
  if (cnt > (cols*cols)) {
    cols++;
    rows = cols;
  }
  cnt++;
}

function draw() {
  var w = screen.height;
  var h = screen.height;

  vW = w / cols;
  vH = h / rows;

  cvs.width = w;
  cvs.height = h;

  var index = 0;
  for (var i=0; i <rows; i++) {
    for (var j=0; j<cols; j++) {  
      var x = vW*j;    
      var y = vH*i;

      // ctx.beginPath();
      // ctx.lineWidth = "1";
      // ctx.strokeStyle = "red";
      // ctx.fillStyle = "#FF0000";
      // ctx.rect(x, y, vW, vH);
      
      // ctx.stroke();
      // if (index >= cnt) ctx.fill();
      // else              ctx.stroke();

      var img = getDelayedFrame(index);
      console.log(img);

      if(img != undefined) ctx.drawImage(getDelayedFrame(index), x, y, vW, vH);
      
      index++;
    }
  }
}

function getDelayedFrame(delay) {
  if (delay == 0) delay = .2;

  var img;
  for (var i = 0; i < imgsTimes.length; i++) {
    if (imgsTimes[i] >= (now() - (delay*1000))) {
      img = imgs[i];
      return img;
    }
  }  
}

// recording loop
var recClock = setInterval(grabFrame, 1000/captureRate);

function now() {  
  var d = new Date();
  var t = d.getTime();

  return t;
}



// Get a list of available media input (and output) devices
// then get a MediaStream for the currently selected input device
navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .catch(error => {
    console.log('enumerateDevices() error: ', error);
  })
  .then(getStream);

// From the list of media devices available, set up the camera source <select>,
// then get a video stream from the default camera source.
function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    console.log('Found media input or output device: ', deviceInfo);
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'Camera ' + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    }
  }
}

// Get a video stream from the currently selected camera source.
function getStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
  }

  var videoSource = videoSelect.value;
  constraints = {
    video: {width: 400, height: 400, deviceId: videoSource ? {exact: videoSource} : undefined},
  };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(error => {
      console.log('getUserMedia error: ', error);
    });
}

// Display the stream from the currently selected camera source, and then
// create an ImageCapture object, using the video from the stream.
function gotStream(stream) {
  console.log('getUserMedia() got stream: ', stream);
  mediaStream = stream;
  video.srcObject = stream;
  // video.classList.remove('hidden');
  imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
  getCapabilities();
}

// Get the PhotoCapabilities for the currently selected camera source.
function getCapabilities() {
  imageCapture.getPhotoCapabilities().then(function(capabilities) {
    console.log('Camera capabilities:', capabilities);
    if (capabilities.zoom.max > 0) {
      zoomInput.min = capabilities.zoom.min;
      zoomInput.max = capabilities.zoom.max;
      zoomInput.value = capabilities.zoom.current;
      zoomInput.classList.remove('hidden');
    }
  }).catch(function(error) {
    console.log('getCapabilities() error: ', error);
  });
}

// Get an ImageBitmap from the currently selected camera source and
// display this with a canvas element.
function grabFrame() {
  imageCapture.grabFrame().then(function(imageBitmap) {
    // console.log('Grabbed frame:', imageBitmap);
    imgs.push(imageBitmap);

    imgsTimes.push(now());
    // console.log(now());

    // console.log(imgs.length + " frames.");
  }).catch(function(error) {
    console.log('grabFrame() error: ', error);

    // duplicate last frame grabbed to avoid missing frames
    imgs.push(imgs[imgs.length-1]);
    imgsTimes.push(now());
  });
}

function setZoom() {
  imageCapture.setOptions({
    zoom: zoomInput.value
  });
}