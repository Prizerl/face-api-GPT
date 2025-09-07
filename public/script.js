const video = document.getElementById('video');
const emotionChartCtx = document.getElementById('emotionChart').getContext('2d');
let lastDetectedEmotion = ""; // 마지막으로 감지된 감정 저장

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  const constraints = {
    video: {
      facingMode: 'user',
    }
  };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        video.srcObject = stream;

        // 비디오가 완전히 로드되었을 때만 감정 인식 시작
        video.onloadedmetadata = () => {
          runRealTimeEmotionDetection();
        };
      })
      .catch(err => {
        console.error("Error accessing webcam: ", err);
        alert("카메라 접근이 거부되었습니다. 설정에서 카메라 권한을 확인해주세요.");
      });
  } else {
    alert("Your browser does not support webcam access.");
  }
}

async function runRealTimeEmotionDetection() {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById("v").append(canvas);

  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  let emotionData = {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0
  };

  const chart = new Chart(emotionChartCtx, {
    type: 'pie',
    data: {
      labels: ['중립', '행복', '슬픔', '화남', '두려움', '역겨움', '놀람'],
      datasets: [{
        data: Object.values(emotionData),
        backgroundColor: ['Black', 'Green', 'Blue', 'Red', 'Purple', 'Cyan', 'Yellow']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          position: 'right', // legend의 위치
          labels: {
            font: {
              size: 20,
            },
            padding: 0, // legend와 chart 간격 조절
            margin : 0,
          },
        },
      },
      layout: {
        padding: {
          top: 0,
          bottom: 0,
          left: 10,
          right: 120
        }
      }
    }
  });

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      emotionData = {
        neutral: expressions.neutral || 0,
        happy: expressions.happy || 0,
        sad: expressions.sad || 0,
        angry: expressions.angry || 0,
        fearful: expressions.fearful || 0,
        disgusted: expressions.disgusted || 0,
        surprised: expressions.surprised || 0,
      };

      // 감정을 계산하고, neutral이 아닐 경우에만 감정을 갱신합니다.
      if (expressions.neutral < 0.5) {
        lastDetectedEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
      }

      // 차트 업데이트
      chart.data.datasets[0].data = Object.values(emotionData);
      chart.update();
    }
  }, 10); // 0.01초마다 감정 감지
}
window.getLastDetectedEmotion = () => lastDetectedEmotion; // 마지막 감정을 얻는 함수