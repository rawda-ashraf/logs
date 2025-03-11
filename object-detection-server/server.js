const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect("mongodb://localhost:27017/violations_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("connected", () => console.log("✅ متصل بقاعدة البيانات!"));
db.on("error", (err) =>
  console.error("🚨 خطأ في الاتصال بقاعدة البيانات:", err)
);

// إنشاء نموذج (Model) للمخالفات
const violationSchema = new mongoose.Schema({
  imagePath: { type: String, required: true },
  detectedObject: { type: String, required: true }, // الأشياء المكتشفة
  timestamp: { type: Date, default: Date.now }, // وقت التقاط الصورة
  formattedTimestamp: { type: String }, // الوقت المنسق
});

const Violation = mongoose.model("Violation", violationSchema);

// إنشاء مجلد uploads إذا لم يكن موجودًا
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// إعداد multer لحفظ الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Middleware للتعامل مع CORS وتقديم الملفات الثابتة
app.use(cors());
app.use("/uploads", express.static("uploads"));

// دالة لتنسيق الوقت
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// نقطة النهاية لحفظ الصورة والمعلومات في قاعدة البيانات
app.post("/api/save-screenshot", upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "⚠️ لم يتم إرسال أي صورة!" });

  const imagePath = `/uploads/${req.file.filename}`;
  const detectedObject = req.body.detectedObject; // الأشياء المكتشفة

  try {
    console.log("📄 محاولة حفظ الصورة في قاعدة البيانات:", imagePath);
    const formattedTimestamp = formatDate(new Date()); // تنسيق الوقت
    const newViolation = new Violation({
      imagePath,
      detectedObject,
      formattedTimestamp, // إضافة الوقت المنسق
    });
    await newViolation.save();
    console.log("✅ تم حفظ الصورة في قاعدة البيانات بنجاح!");
    res.json({ message: "✅ تم حفظ الصورة بنجاح!", imagePath });
  } catch (error) {
    console.error("🚨 خطأ في حفظ الصورة في قاعدة البيانات:", error);
    res.status(500).json({ error: "🚨 خطأ في حفظ الصورة في قاعدة البيانات" });
  }
});

// نقطة النهاية لاسترجاع جميع المخالفات
app.get("/api/violations", async (req, res) => {
  try {
    const violations = await Violation.find().sort({ timestamp: -1 });
    res.json(violations); // سترجع البيانات مع الوقت المنسق
  } catch (error) {
    console.error("🚨 خطأ في استرجاع البيانات:", error);
    res.status(500).json({ error: "🚨 خطأ في استرجاع البيانات" });
  }
});

// تشغيل الخادم
app.listen(PORT, () =>
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`)
);
