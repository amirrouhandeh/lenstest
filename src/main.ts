///////////////////////////////////////////////////////////////
import {
  bootstrapCameraKit,
  CameraKitSession,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

const liveRenderTarget = document.getElementById('canvas') as HTMLCanvasElement;
const flipCamera = document.getElementById('flip') as HTMLImageElement;
//////////////
const videoContainer = document.getElementById(
  'video-container'
) as HTMLElement;
const videoTarget = document.getElementById('video') as HTMLVideoElement;
const startRecordingButton = document.getElementById(
  'start'
) as HTMLButtonElement;
const stopRecordingButton = document.getElementById(
  'stop'
) as HTMLButtonElement;
const downloadButton = document.getElementById('download') as HTMLButtonElement;

let mediaRecorder: MediaRecorder;
let downloadUrl: string;
/////////////

let isBackFacing = true;
let mediaStream: MediaStream;

async function init() {
  const cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzI0NDMwOTEzLCJzdWIiOiI3NDdlNWVmNS1hNzIxLTQzZTUtOTY2Yy1iYThmOWZjYWVkNTJ-U1RBR0lOR341OWVlOTMxOC00MWE1LTRmMjMtYjY1ZC1iMGM2MjI2ZGUyNDEifQ.Kl8rAjOyAfbBZSjpyvCkmN0W_bL9SY99FmwGBOKx7b0' });
  const session = await cameraKit.createSession({ liveRenderTarget });
  /////////////
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
  }); 
  const source = createMediaStreamSource(mediaStream);

  await session.setSource(source);
  await session.play();
  /////////////
  const { lenses } = await cameraKit.lensRepository.loadLensGroups([
    'e6adfa11-5000-450e-8b36-5ca5dc0d0620',
  ]);

session.applyLens(lenses[0]);
bindFlipCamera(session);
///////////
bindRecorder();
///////////

}

function bindFlipCamera(session: CameraKitSession) {
  

  flipCamera.addEventListener('click', () => {
    updateCamera(session);
  });

  updateCamera(session);
}
async function updateCamera(session: CameraKitSession) {
  isBackFacing = !isBackFacing;

  if (mediaStream) {
    session.pause();
    mediaStream.getVideoTracks()[0].stop();
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: isBackFacing ? 'environment' : 'user',
    },
  });

  const source = createMediaStreamSource(mediaStream, {
    // NOTE: This is important for world facing experiences
    cameraType: isBackFacing ? 'environment' : 'user',
  });

  await session.setSource(source);

  if (!isBackFacing) {
    source.setTransform(Transform2D.MirrorX);
  }

  session.play();
}

function bindRecorder() {
  startRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
    downloadButton.disabled = true;
    videoContainer.style.display = 'none';

    const mediaStream = liveRenderTarget.captureStream(30);

    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (!event.data.size) {
        console.warn('No recorded data available');
        return;
      }

      const blob = new Blob([event.data]);

      downloadUrl = window.URL.createObjectURL(blob);
      downloadButton.disabled = false;

      videoTarget.src = downloadUrl;
      videoContainer.style.display = 'block';
    });

    mediaRecorder.start();
  });

  stopRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;

    mediaRecorder?.stop();
  });

  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');

    link.setAttribute('style', 'display: none');
    link.href = downloadUrl;
    link.download = 'camera-kit-web-recording.webm';
    link.click();
    link.remove();
  });
}

init();