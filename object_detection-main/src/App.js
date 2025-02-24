import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const ObjectDetectionLive = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [violations, setViolations] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const activeViolations = useRef(new Set());
  const alertSound = useRef(new Audio("/alarm.mp3"));
  const captured = useRef(false);

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (model) {
      startVideo();
      const detectionInterval = setInterval(() => {
        detectFrame();
      }, 1000);
      return () => clearInterval(detectionInterval);
    }
  }, [model]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        requestAnimationFrame(renderFrame);
      };
    });
  };

  const renderFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
    requestAnimationFrame(renderFrame);
  };

  const detectFrame = async () => {
    if (model && videoRef.current) {
      const predictions = await model.detect(videoRef.current);
      drawPredictions(predictions);
      checkForAlert(predictions);
    }
  };

  const checkForAlert = (predictions) => {
    const newViolations = new Set();
    const personCount = predictions.filter((p) => p.class === "person").length;
    const phoneDetected = predictions.some((p) => p.class === "cell phone");
    const laptopDetected = predictions.some((p) => p.class === "laptop");
    const bookDetected = predictions.some((p) => p.class === "book");

    if (personCount > 1) newViolations.add("🚨 أكثر من شخص في الإطار!");
    if (phoneDetected || laptopDetected || bookDetected)
      newViolations.add("⚠️ اكتشاف محاولة غش!");

    if (!setsAreEqual(activeViolations.current, newViolations)) {
      activeViolations.current = newViolations;
      setViolations(Array.from(newViolations));

      if (newViolations.size > 0) {
        playAlertSound();
        setShowAlert(true);
        if (!captured.current) {
          captureAndSendImage();
          captured.current = true;
        }
      } else {
        stopAlertSound();
        setShowAlert(false);
        captured.current = false;
      }
    }
  };

  const captureAndSendImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("image", blob, "screenshot.png");

      fetch("http://localhost:3000/api/save-screenshot", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => console.log("📸 الصورة تم إرسالها بنجاح!", data))
        .catch((error) => console.error("🚨 خطأ في إرسال الصورة:", error));
    }, "image/png");
  };

  const playAlertSound = () => {
    alertSound.current.loop = true;
    alertSound.current.currentTime = 0;
    alertSound.current
      .play()
      .catch(() => console.warn("🔇 لم يتم تشغيل الصوت بسبب قيود المتصفح."));
  };

  const stopAlertSound = () => {
    alertSound.current.pause();
    alertSound.current.currentTime = 0;
  };

  const drawPredictions = (predictions) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.fillStyle = "red";

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        x,
        y - 5
      );
    });
  };

  const setsAreEqual = (set1, set2) => {
    if (set1.size !== set2.size) return false;
    for (let item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  };

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      {showAlert && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10%",
            backgroundColor: "rgba(255, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "20px",
            fontWeight: "bold",
            color: "white",
            zIndex: 10,
          }}
        >
          ⚠️ تحذير: تم اكتشاف مخالفة!
        </div>
      )}

      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
    </div>
  );
};

export default ObjectDetectionLive;
