// import React, { useRef, useEffect, useState } from "react";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs";

// const ObjectDetectionLive = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [model, setModel] = useState(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const activeViolations = useRef(new Set());
//   const alertSound = useRef(new Audio("/alarm.mp3"));
//   const captured = useRef(false);

//   useEffect(() => {
//     const loadModel = async () => {
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     if (model) {
//       startVideo();
//       const detectionInterval = setInterval(() => {
//         detectFrame();
//       }, 1000);
//       return () => clearInterval(detectionInterval);
//     }
//   }, [model]);

//   const startVideo = () => {
//     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//       videoRef.current.srcObject = stream;
//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         requestAnimationFrame(renderFrame);
//       };
//     });
//   };

//   const renderFrame = () => {
//     if (videoRef.current && canvasRef.current) {
//       const ctx = canvasRef.current.getContext("2d");
//       ctx.drawImage(
//         videoRef.current,
//         0,
//         0,
//         canvasRef.current.width,
//         canvasRef.current.height
//       );
//     }
//     requestAnimationFrame(renderFrame);
//   };

//   const detectFrame = async () => {
//     if (model && videoRef.current) {
//       const predictions = await model.detect(videoRef.current);
//       drawPredictions(predictions);
//       checkForAlert(predictions);
//     }
//   };

//   const checkForAlert = (predictions) => {
//     const newViolations = new Set();
//     const detectedObjects = new Set();

//     const personCount = predictions.filter((p) => p.class === "person").length;
//     const phoneDetected = predictions.some((p) => p.class === "cell phone");
//     const laptopDetected = predictions.some((p) => p.class === "laptop");
//     const bookDetected = predictions.some((p) => p.class === "book");
//     const paperDetected = predictions.some((p) => p.class === "paper");

//     if (personCount > 1) newViolations.add("🚨 أكثر من شخص في الإطار!");
//     if (phoneDetected) detectedObjects.add("هاتف محمول");
//     if (laptopDetected) detectedObjects.add("كمبيوتر محمول");
//     if (bookDetected) detectedObjects.add("كتاب");
//     if (paperDetected) detectedObjects.add("ورقة");

//     if (detectedObjects.size > 0) {
//       newViolations.add("⚠️ اكتشاف محاولة غش!");
//     }

//     if (!setsAreEqual(activeViolations.current, newViolations)) {
//       activeViolations.current = newViolations;

//       if (newViolations.size > 0) {
//         playAlertSound();
//         setShowAlert(true);
//         if (!captured.current) {
//           const detectedObject = Array.from(detectedObjects).join(", ");
//           captureAndSendImage(detectedObject);
//           captured.current = true;
//         }
//       } else {
//         stopAlertSound();
//         setShowAlert(false);
//         captured.current = false;
//       }
//     }
//   };

//   const captureAndSendImage = (detectedObject) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.toBlob((blob) => {
//       const formData = new FormData();
//       formData.append("image", blob, "screenshot.png");
//       formData.append("detectedObject", detectedObject);

//       fetch("http://localhost:3000/api/save-screenshot", {
//         method: "POST",
//         body: formData,
//       })
//         .then((response) => response.json())
//         .then((data) => console.log("📸 الصورة تم إرسالها بنجاح!", data))
//         .catch((error) => console.error("🚨 خطأ في إرسال الصورة:", error));
//     }, "image/png");
//   };

//   const playAlertSound = () => {
//     alertSound.current.loop = true;
//     alertSound.current.currentTime = 0;
//     alertSound.current
//       .play()
//       .catch(() => console.warn("🔇 لم يتم تشغيل الصوت بسبب قيود المتصفح."));
//   };

//   const stopAlertSound = () => {
//     alertSound.current.pause();
//     alertSound.current.currentTime = 0;
//   };

//   const drawPredictions = (predictions) => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     ctx.font = "16px Arial";
//     ctx.fillStyle = "red";

//     predictions.forEach((prediction) => {
//       const [x, y, width, height] = prediction.bbox;
//       ctx.beginPath();
//       ctx.rect(x, y, width, height);
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 2;
//       ctx.stroke();
//       ctx.fillText(
//         `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//         x,
//         y - 5
//       );
//     });
//   };

//   const setsAreEqual = (set1, set2) => {
//     if (set1.size !== set2.size) return false;
//     for (let item of set1) {
//       if (!set2.has(item)) return false;
//     }
//     return true;
//   };

//   return (
//     <div style={{ position: "relative", textAlign: "center" }}>
//       {showAlert && (
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "10%",
//             backgroundColor: "rgba(255, 0, 0, 0.7)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             fontSize: "20px",
//             fontWeight: "bold",
//             color: "white",
//             zIndex: 10,
//           }}
//         >
//           ⚠️ تحذير: تم اكتشاف مخالفة!
//         </div>
//       )}

//       <video ref={videoRef} style={{ display: "none" }} />
//       <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
//     </div>
//   );
// };

// export default ObjectDetectionLive;


// //////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useRef, useEffect, useState } from "react";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs";

// const ObjectDetectionLive = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [model, setModel] = useState(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const [detectedObjects, setDetectedObjects] = useState([]);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [settings, setSettings] = useState({
//     monitoredObjects: ["cell phone", "laptop", "book", "paper"],
//     alertSeverity: "high", // يمكن أن تكون 'low', 'medium', 'high'
//   });
//   const activeViolations = useRef(new Set());
//   const alertSound = useRef(new Audio("/alarm.mp3"));
//   const captured = useRef(false);

//   useEffect(() => {
//     const loadModel = async () => {
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     if (model) {
//       startVideo();
//       const detectionInterval = setInterval(() => {
//         detectFrame();
//       }, 1000);
//       return () => clearInterval(detectionInterval);
//     }
//   }, [model]);

//   const startVideo = () => {
//     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//       videoRef.current.srcObject = stream;
//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         requestAnimationFrame(renderFrame);
//       };
//     });
//   };

//   const renderFrame = () => {
//     if (videoRef.current && canvasRef.current) {
//       const ctx = canvasRef.current.getContext("2d");
//       ctx.drawImage(
//         videoRef.current,
//         0,
//         0,
//         canvasRef.current.width,
//         canvasRef.current.height
//       );
//     }
//     requestAnimationFrame(renderFrame);
//   };

//   const detectFrame = async () => {
//     if (model && videoRef.current) {
//       const predictions = await model.detect(videoRef.current);
//       drawPredictions(predictions);
//       checkForAlert(predictions);
//       updateDetectedObjects(predictions);
//     }
//   };

//   const updateDetectedObjects = (predictions) => {
//     const objects = predictions.map((p) => p.class);
//     setDetectedObjects(objects);
//   };

//   const checkForAlert = (predictions) => {
//     const newViolations = new Set();
//     const detectedObjects = new Set();

//     const personCount = predictions.filter((p) => p.class === "person").length;
//     const phoneDetected = predictions.some((p) => p.class === "cell phone");
//     const laptopDetected = predictions.some((p) => p.class === "laptop");
//     const bookDetected = predictions.some((p) => p.class === "book");
//     const paperDetected = predictions.some((p) => p.class === "paper");

//     if (personCount > 1) newViolations.add("🚨 أكثر من شخص في الإطار!");
//     if (phoneDetected) detectedObjects.add("هاتف محمول");
//     if (laptopDetected) detectedObjects.add("كمبيوتر محمول");
//     if (bookDetected) detectedObjects.add("كتاب");
//     if (paperDetected) detectedObjects.add("ورقة");

//     if (detectedObjects.size > 0) {
//       newViolations.add("⚠️ اكتشاف محاولة غش!");
//     }

//     if (!setsAreEqual(activeViolations.current, newViolations)) {
//       activeViolations.current = newViolations;

//       if (newViolations.size > 0) {
//         playAlertSound();
//         setShowAlert(true);
//         setAlertMessage(Array.from(newViolations).join(" "));
//         if (!captured.current) {
//           const detectedObject = Array.from(detectedObjects).join(", ");
//           captureAndSendImage(detectedObject);
//           captured.current = true;
//         }
//       } else {
//         stopAlertSound();
//         setShowAlert(false);
//         setAlertMessage("");
//         captured.current = false;
//       }
//     }
//   };

//   const captureAndSendImage = (detectedObject) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.toBlob((blob) => {
//       const formData = new FormData();
//       formData.append("image", blob, "screenshot.png");
//       formData.append("detectedObject", detectedObject);

//       fetch("http://localhost:3000/api/save-screenshot", {
//         method: "POST",
//         body: formData,
//       })
//         .then((response) => response.json())
//         .then((data) => console.log("📸 الصورة تم إرسالها بنجاح!", data))
//         .catch((error) => console.error("🚨 خطأ في إرسال الصورة:", error));
//     }, "image/png");
//   };

//   const playAlertSound = () => {
//     alertSound.current.loop = true;
//     alertSound.current.currentTime = 0;
//     alertSound.current
//       .play()
//       .catch(() => console.warn("🔇 لم يتم تشغيل الصوت بسبب قيود المتصفح."));
//   };

//   const stopAlertSound = () => {
//     alertSound.current.pause();
//     alertSound.current.currentTime = 0;
//   };

//   const drawPredictions = (predictions) => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     ctx.font = "16px Arial";
//     ctx.fillStyle = "red";

//     predictions.forEach((prediction) => {
//       const [x, y, width, height] = prediction.bbox;
//       ctx.beginPath();
//       ctx.rect(x, y, width, height);
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 2;
//       ctx.stroke();
//       ctx.fillText(
//         `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//         x,
//         y - 5
//       );
//     });
//   };

//   const setsAreEqual = (set1, set2) => {
//     if (set1.size !== set2.size) return false;
//     for (let item of set1) {
//       if (!set2.has(item)) return false;
//     }
//     return true;
//   };

//   return (
//     <div style={{ position: "relative", textAlign: "center" }}>
//       {showAlert && (
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "10%",
//             backgroundColor: "rgba(255, 0, 0, 0.7)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             fontSize: "20px",
//             fontWeight: "bold",
//             color: "white",
//             zIndex: 10,
//           }}
//         >
//           ⚠️ {alertMessage}
//         </div>
//       )}

//       <div
//         style={{
//           position: "absolute",
//           top: "10%",
//           right: 0,
//           backgroundColor: "rgba(0, 0, 0, 0.7)",
//           color: "white",
//           padding: "10px",
//           zIndex: 10,
//         }}
//       >
//         <h3>الأشياء المكتشفة:</h3>
//         <ul>
//           {detectedObjects.map((obj, index) => (
//             <li key={index}>{obj}</li>
//           ))}
//         </ul>
//       </div>

//       <video ref={videoRef} style={{ display: "none" }} />
//       <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
//     </div>
//   );
// };

// export default ObjectDetectionLive;




// import React, { useRef, useEffect, useState } from "react";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs";

// const ObjectDetectionLive = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [model, setModel] = useState(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const [detectedObjects, setDetectedObjects] = useState([]);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [settings, setSettings] = useState({
//     monitoredObjects: ["cell phone", "laptop", "book", "paper"],
//     alertSeverity: "high", // يمكن أن تكون 'low', 'medium', 'high'
//   });
//   const activeViolations = useRef(new Set());
//   const alertSound = useRef(new Audio("/alarm.mp3"));
//   const captured = useRef(false);
//   const noPersonTimeout = useRef(null); // Timeout reference for no person detection

//   useEffect(() => {
//     const loadModel = async () => {
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     if (model) {
//       startVideo();
//       const detectionInterval = setInterval(() => {
//         detectFrame();
//       }, 1000);
//       return () => clearInterval(detectionInterval);
//     }
//   }, [model]);

//   const startVideo = () => {
//     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//       videoRef.current.srcObject = stream;
//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         requestAnimationFrame(renderFrame);
//       };
//     });
//   };

//   const renderFrame = () => {
//     if (videoRef.current && canvasRef.current) {
//       const ctx = canvasRef.current.getContext("2d");
//       ctx.drawImage(
//         videoRef.current,
//         0,
//         0,
//         canvasRef.current.width,
//         canvasRef.current.height
//       );
//     }
//     requestAnimationFrame(renderFrame);
//   };

//   const detectFrame = async () => {
//     if (model && videoRef.current) {
//       const predictions = await model.detect(videoRef.current);
//       drawPredictions(predictions);
//       checkForAlert(predictions);
//       updateDetectedObjects(predictions);
//       checkForNoPerson(predictions); // Check if no person is detected
//     }
//   };

//   const updateDetectedObjects = (predictions) => {
//     const objects = predictions.map((p) => p.class);
//     setDetectedObjects(objects);
//   };

//   const checkForAlert = (predictions) => {
//     const newViolations = new Set();
//     const detectedObjects = new Set();

//     const personCount = predictions.filter((p) => p.class === "person").length;
//     const phoneDetected = predictions.some((p) => p.class === "cell phone");
//     const laptopDetected = predictions.some((p) => p.class === "laptop");
//     const bookDetected = predictions.some((p) => p.class === "book");
//     const paperDetected = predictions.some((p) => p.class === "paper");

//     if (personCount > 1) newViolations.add("🚨 أكثر من شخص في الإطار!");
//     if (phoneDetected) detectedObjects.add("هاتف محمول");
//     if (laptopDetected) detectedObjects.add("كمبيوتر محمول");
//     if (bookDetected) detectedObjects.add("كتاب");
//     if (paperDetected) detectedObjects.add("ورقة");

//     if (detectedObjects.size > 0) {
//       newViolations.add("⚠️ اكتشاف محاولة غش!");
//     }

//     if (!setsAreEqual(activeViolations.current, newViolations)) {
//       activeViolations.current = newViolations;

//       if (newViolations.size > 0) {
//         playAlertSound();
//         setShowAlert(true);
//         setAlertMessage(Array.from(newViolations).join(" "));
//         if (!captured.current) {
//           const detectedObject = Array.from(detectedObjects).join(", ");
//           captureAndSendImage(detectedObject);
//           captured.current = true;
//         }
//       } else {
//         stopAlertSound();
//         setShowAlert(false);
//         setAlertMessage("");
//         captured.current = false;
//       }
//     }
//   };

//   const checkForNoPerson = (predictions) => {
//     const personCount = predictions.filter((p) => p.class === "person").length;

//     if (personCount === 0) {
//       // إذا لم يتم اكتشاف أي شخص، ابدأ العد التنازلي
//       if (!noPersonTimeout.current) {
//         noPersonTimeout.current = setTimeout(() => {
//           playAlertSound();
//           setShowAlert(true);
//           setAlertMessage("🚨 لم يتم اكتشاف أي شخص في الإطار لمدة دقيقة!");
//           captureAndSendImage("لا يوجد شخص في الإطار");
//         }, 60000); // 60,000 مللي ثانية = 1 دقيقة
//       }
//     } else {
//       // إذا تم اكتشاف شخص، قم بإلغاء العد التنازلي
//       if (noPersonTimeout.current) {
//         clearTimeout(noPersonTimeout.current);
//         noPersonTimeout.current = null;
//         stopAlertSound();
//         setShowAlert(false);
//         setAlertMessage("");
//       }
//     }
//   };

//   const captureAndSendImage = (detectedObject) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.toBlob((blob) => {
//       const formData = new FormData();
//       formData.append("image", blob, "screenshot.png");
//       formData.append("detectedObject", detectedObject);

//       fetch("http://localhost:3000/api/save-screenshot", {
//         method: "POST",
//         body: formData,
//       })
//         .then((response) => response.json())
//         .then((data) => console.log("📸 الصورة تم إرسالها بنجاح!", data))
//         .catch((error) => console.error("🚨 خطأ في إرسال الصورة:", error));
//     }, "image/png");
//   };

//   const playAlertSound = () => {
//     alertSound.current.loop = true;
//     alertSound.current.currentTime = 0;
//     alertSound.current
//       .play()
//       .catch(() => console.warn("🔇 لم يتم تشغيل الصوت بسبب قيود المتصفح."));
//   };

//   const stopAlertSound = () => {
//     alertSound.current.pause();
//     alertSound.current.currentTime = 0;
//   };

//   const drawPredictions = (predictions) => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     ctx.font = "16px Arial";
//     ctx.fillStyle = "red";

//     predictions.forEach((prediction) => {
//       const [x, y, width, height] = prediction.bbox;
//       ctx.beginPath();
//       ctx.rect(x, y, width, height);
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 2;
//       ctx.stroke();
//       ctx.fillText(
//         `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//         x,
//         y - 5
//       );
//     });
//   };

//   const setsAreEqual = (set1, set2) => {
//     if (set1.size !== set2.size) return false;
//     for (let item of set1) {
//       if (!set2.has(item)) return false;
//     }
//     return true;
//   };

//   return (
//     <div style={{ position: "relative", textAlign: "center" }}>
//       {showAlert && (
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "10%",
//             backgroundColor: "rgba(255, 0, 0, 0.7)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             fontSize: "20px",
//             fontWeight: "bold",
//             color: "white",
//             zIndex: 10,
//           }}
//         >
//           ⚠️ {alertMessage}
//         </div>
//       )}

//       <div
//         style={{
//           position: "absolute",
//           top: "10%",
//           right: 0,
//           backgroundColor: "rgba(0, 0, 0, 0.7)",
//           color: "white",
//           padding: "10px",
//           zIndex: 10,
//         }}
//       >
//         <h3>الأشياء المكتشفة:</h3>
//         <ul>
//           {detectedObjects.map((obj, index) => (
//             <li key={index}>{obj}</li>
//           ))}
//         </ul>
//       </div>

//       <video ref={videoRef} style={{ display: "none" }} />
//       <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
//     </div>
//   );
// };

// export default ObjectDetectionLive;




// import React, { useRef, useEffect, useState } from "react";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs";

// const ObjectDetectionLive = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [model, setModel] = useState(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const [detectedObjects, setDetectedObjects] = useState([]);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [settings, setSettings] = useState({
//     monitoredObjects: ["cell phone", "laptop", "book", "paper"],
//     alertSeverity: "high", // يمكن أن تكون 'low', 'medium', 'high'
//   });
//   const activeViolations = useRef(new Set());
//   const alertSound = useRef(new Audio("/alarm.mp3"));
//   const captured = useRef(false);
//   const noPersonTimeout = useRef(null); // Timeout reference for no person detection
//   const [countdown, setCountdown] = useState(null); // حالة العد التنازلي

//   useEffect(() => {
//     const loadModel = async () => {
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     if (model) {
//       startVideo();
//       const detectionInterval = setInterval(() => {
//         detectFrame();
//       }, 1000);
//       return () => clearInterval(detectionInterval);
//     }
//   }, [model]);

//   const startVideo = () => {
//     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//       videoRef.current.srcObject = stream;
//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         requestAnimationFrame(renderFrame);
//       };
//     });
//   };

//   const renderFrame = () => {
//     if (videoRef.current && canvasRef.current) {
//       const ctx = canvasRef.current.getContext("2d");
//       ctx.drawImage(
//         videoRef.current,
//         0,
//         0,
//         canvasRef.current.width,
//         canvasRef.current.height
//       );
//     }
//     requestAnimationFrame(renderFrame);
//   };

//   const detectFrame = async () => {
//     if (model && videoRef.current) {
//       const predictions = await model.detect(videoRef.current);
//       drawPredictions(predictions);
//       checkForAlert(predictions);
//       updateDetectedObjects(predictions);
//       checkForNoPerson(predictions); // التحقق من وجود شخص
//     }
//   };

//   const updateDetectedObjects = (predictions) => {
//     const objects = predictions.map((p) => p.class);
//     setDetectedObjects(objects);
//   };

//   const checkForAlert = (predictions) => {
//     const newViolations = new Set();
//     const detectedObjects = new Set();

//     const personCount = predictions.filter((p) => p.class === "person").length;
//     const phoneDetected = predictions.some((p) => p.class === "cell phone");
//     const laptopDetected = predictions.some((p) => p.class === "laptop");
//     const bookDetected = predictions.some((p) => p.class === "book");
//     const paperDetected = predictions.some((p) => p.class === "paper");

//     if (personCount > 1) newViolations.add("🚨 أكثر من شخص في الإطار!");
//     if (phoneDetected) detectedObjects.add("هاتف محمول");
//     if (laptopDetected) detectedObjects.add("كمبيوتر محمول");
//     if (bookDetected) detectedObjects.add("كتاب");
//     if (paperDetected) detectedObjects.add("ورقة");

//     if (detectedObjects.size > 0) {
//       newViolations.add("⚠️ اكتشاف محاولة غش!");
//     }

//     if (!setsAreEqual(activeViolations.current, newViolations)) {
//       activeViolations.current = newViolations;

//       if (newViolations.size > 0) {
//         playAlertSound();
//         setShowAlert(true);
//         setAlertMessage(Array.from(newViolations).join(" "));
//         if (!captured.current) {
//           const detectedObject = Array.from(detectedObjects).join(", ");
//           captureAndSendImage(detectedObject);
//           captured.current = true;
//         }
//       } else {
//         stopAlertSound();
//         setShowAlert(false);
//         setAlertMessage("");
//         captured.current = false;
//       }
//     }
//   };

//   const checkForNoPerson = (predictions) => {
//     const personCount = predictions.filter((p) => p.class === "person").length;

//     if (personCount === 0) {
//       // إذا لم يتم اكتشاف أي شخص، ابدأ العد التنازلي
//       if (!noPersonTimeout.current) {
//         const startTime = Date.now();
//         noPersonTimeout.current = setInterval(() => {
//           const remainingTime = 60 - Math.floor((Date.now() - startTime) / 1000);
//           if (remainingTime > 0) {
//             setCountdown(remainingTime); // تحديث العد التنازلي
//           } else {
//             clearInterval(noPersonTimeout.current);
//             noPersonTimeout.current = null;
//             setCountdown(null);
//             playAlertSound();
//             setShowAlert(true);
//             setAlertMessage("🚨 لم يتم اكتشاف أي شخص في الإطار لمدة دقيقة!");
//             captureAndSendImage("لا يوجد شخص في الإطار");
//           }
//         }, 1000); // تحديث كل ثانية
//       }
//     } else {
//       // إذا تم اكتشاف شخص، قم بإلغاء العد التنازلي
//       if (noPersonTimeout.current) {
//         clearInterval(noPersonTimeout.current);
//         noPersonTimeout.current = null;
//         setCountdown(null);
//         stopAlertSound();
//         setShowAlert(false);
//         setAlertMessage("");
//       }
//     }
//   };

//   const captureAndSendImage = (detectedObject) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.toBlob((blob) => {
//       const formData = new FormData();
//       formData.append("image", blob, "screenshot.png");
//       formData.append("detectedObject", detectedObject);

//       fetch("http://localhost:3000/api/save-screenshot", {
//         method: "POST",
//         body: formData,
//       })
//         .then((response) => response.json())
//         .then((data) => console.log("📸 الصورة تم إرسالها بنجاح!", data))
//         .catch((error) => console.error("🚨 خطأ في إرسال الصورة:", error));
//     }, "image/png");
//   };

//   const playAlertSound = () => {
//     alertSound.current.loop = true;
//     alertSound.current.currentTime = 0;
//     alertSound.current
//       .play()
//       .catch(() => console.warn("🔇 لم يتم تشغيل الصوت بسبب قيود المتصفح."));
//   };

//   const stopAlertSound = () => {
//     alertSound.current.pause();
//     alertSound.current.currentTime = 0;
//   };

//   const drawPredictions = (predictions) => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     ctx.font = "16px Arial";
//     ctx.fillStyle = "red";

//     predictions.forEach((prediction) => {
//       const [x, y, width, height] = prediction.bbox;
//       ctx.beginPath();
//       ctx.rect(x, y, width, height);
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 2;
//       ctx.stroke();
//       ctx.fillText(
//         `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//         x,
//         y - 5
//       );
//     });
//   };

//   const setsAreEqual = (set1, set2) => {
//     if (set1.size !== set2.size) return false;
//     for (let item of set1) {
//       if (!set2.has(item)) return false;
//     }
//     return true;
//   };

//   return (
//     <div style={{ position: "relative", textAlign: "center" }}>
//       {showAlert && (
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "10%",
//             backgroundColor: "rgba(255, 0, 0, 0.7)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             fontSize: "20px",
//             fontWeight: "bold",
//             color: "white",
//             zIndex: 10,
//           }}
//         >
//           ⚠️ {alertMessage}
//         </div>
//       )}

//       <div
//         style={{
//           position: "absolute",
//           top: "10%",
//           right: 0,
//           backgroundColor: "rgba(0, 0, 0, 0.7)",
//           color: "white",
//           padding: "10px",
//           zIndex: 10,
//         }}
//       >
//         <h3>الأشياء المكتشفة:</h3>
//         <ul>
//           {detectedObjects.map((obj, index) => (
//             <li key={index}>{obj}</li>
//           ))}
//         </ul>
//         {countdown !== null && (
//           <div style={{ marginTop: "10px" }}>
//             <p>العد التنازلي: {countdown} ثانية</p>
//           </div>
//         )}
//       </div>

//       <video ref={videoRef} style={{ display: "none" }} />
//       <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
//     </div>
//   );
// };

// export default ObjectDetectionLive;



import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const ObjectDetectionLive = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [settings, setSettings] = useState({
    monitoredObjects: ["cell phone", "laptop", "book", "paper"],
    alertSeverity: "high", // Can be 'low', 'medium', 'high'
  });
  const activeViolations = useRef(new Set());
  const alertSound = useRef(new Audio("/alarm.mp3"));
  const captured = useRef(false);
  const noPersonTimeout = useRef(null); // Timeout reference for no person detection
  const [countdown, setCountdown] = useState(null); // Countdown state

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
      updateDetectedObjects(predictions);
      checkForNoPerson(predictions); // Check for person
    }
  };

  const updateDetectedObjects = (predictions) => {
    const objects = predictions.map((p) => p.class);
    setDetectedObjects(objects);
  };

  const checkForAlert = (predictions) => {
    const newViolations = new Set();
    const detectedObjects = new Set();

    const personCount = predictions.filter((p) => p.class === "person").length;
    const phoneDetected = predictions.some((p) => p.class === "cell phone");
    const laptopDetected = predictions.some((p) => p.class === "laptop");
    const bookDetected = predictions.some((p) => p.class === "book");
    const paperDetected = predictions.some((p) => p.class === "paper");

    if (personCount > 1) newViolations.add("🚨 More than one person in the frame!");
    if (phoneDetected) detectedObjects.add("Mobile Phone");
    if (laptopDetected) detectedObjects.add("Laptop");
    if (bookDetected) detectedObjects.add("Book");
    if (paperDetected) detectedObjects.add("Paper");

    if (detectedObjects.size > 0) {
      newViolations.add("⚠️ Cheating attempt detected!");
    }

    if (!setsAreEqual(activeViolations.current, newViolations)) {
      activeViolations.current = newViolations;

      if (newViolations.size > 0) {
        playAlertSound();
        setShowAlert(true);
        setAlertMessage(Array.from(newViolations).join(" "));
        if (!captured.current) {
          const detectedObject = Array.from(detectedObjects).join(", ");
          captureAndSendImage(detectedObject);
          captured.current = true;
        }
      } else {
        stopAlertSound();
        setShowAlert(false);
        setAlertMessage("");
        captured.current = false;
      }
    }
  };

  const checkForNoPerson = (predictions) => {
    const personCount = predictions.filter((p) => p.class === "person").length;

    if (personCount === 0) {
      // If no person is detected, start the countdown
      if (!noPersonTimeout.current) {
        const startTime = Date.now();
        noPersonTimeout.current = setInterval(() => {
          const remainingTime = 60 - Math.floor((Date.now() - startTime) / 1000);
          if (remainingTime > 0) {
            setCountdown(remainingTime); // Update countdown
          } else {
            clearInterval(noPersonTimeout.current);
            noPersonTimeout.current = null;
            setCountdown(null);
            playAlertSound();
            setShowAlert(true);
            setAlertMessage("🚨 No person detected in the frame for 1 minute!");
            captureAndSendImage("No person in the frame");
          }
        }, 1000); // Update every second
      }
    } else {
      // If a person is detected, cancel the countdown
      if (noPersonTimeout.current) {
        clearInterval(noPersonTimeout.current);
        noPersonTimeout.current = null;
        setCountdown(null);
        stopAlertSound();
        setShowAlert(false);
        setAlertMessage("");
      }
    }
  };

  const captureAndSendImage = (detectedObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("image", blob, "screenshot.png");
      formData.append("detectedObject", detectedObject);

      fetch("http://localhost:3000/api/save-screenshot", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => console.log("📸 Image sent successfully!", data))
        .catch((error) => console.error("🚨 Error sending image:", error));
    }, "image/png");
  };

  const playAlertSound = () => {
    alertSound.current.loop = true;
    alertSound.current.currentTime = 0;
    alertSound.current
      .play()
      .catch(() => console.warn("🔇 Sound not played due to browser restrictions."));
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
          ⚠️ {alertMessage}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "10%",
          right: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "10px",
          zIndex: 10,
        }}
      >
        <h3>Detected Objects:</h3>
        <ul>
          {detectedObjects.map((obj, index) => (
            <li key={index}>{obj}</li>
          ))}
        </ul>
        {countdown !== null && (
          <div style={{ marginTop: "10px" }}>
            <p>Countdown: {countdown} seconds</p>
          </div>
        )}
      </div>

      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
    </div>
  );
};

export default ObjectDetectionLive;