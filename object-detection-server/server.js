const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

mongoose.connect("mongodb://localhost:27017/violations_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("connected", () => console.log("✅ متصل بقاعدة البيانات!"));
db.on("error", (err) =>
  console.error("🚨 خطأ في الاتصال بقاعدة البيانات:", err)
);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

app.use(cors());
app.use("/uploads", express.static("uploads"));

app.post("/api/save-screenshot", upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "⚠️ لم يتم إرسال أي صورة!" });

  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ message: "✅ تم حفظ الصورة بنجاح!", imagePath });
});

app.listen(PORT, () =>
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`)
);
