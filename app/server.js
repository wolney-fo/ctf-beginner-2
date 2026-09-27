const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 80;
const BASE_DIR = __dirname;
const UPLOAD_DIR = path.join(BASE_DIR, "uploads");

const FLAGS = {
  recon: process.env.FLAG_RECON || "FLAG{not_configured}",
  upload: process.env.FLAG_UPLOAD || "FLAG{not_configured}",
  cookie: process.env.FLAG_COOKIE || "FLAG{not_configured}",
  idor: process.env.FLAG_IDOR || "FLAG{not_configured}",
  api: process.env.FLAG_API || "FLAG{not_configured}",
};

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];

app.set("view engine", "ejs");
app.set("views", path.join(BASE_DIR, "views"));
app.use(cookieParser());
app.use("/static", express.static(path.join(BASE_DIR, "public")));

// ---- in-memory state (photo board) ----
let nextId = 1;
const posts = [];
function seed(title, caption, filename, isPrivate) {
  posts.push({ id: nextId++, title, caption, filename, private: !!isPrivate });
}
seed("Sunset at the beach", "Shot from yesterday by the shore.", "sunset.svg", false);
seed("My new setup", "Finally finished the home office.", "desk.svg", false);
seed("Weekend hike", "View from the top, worth the climb.", "trail.svg", false);
seed(
  "DRAFT - do not publish",
  "Internal team post. Admin panel access token: " + FLAGS.idor,
  "draft.svg",
  true
);

// ---- session (encoded cookie, not signed) ----
function readSession(req) {
  const raw = req.cookies.sn_session;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
}
function ensureSession(req, res) {
  let s = readSession(req);
  if (!s) {
    s = { user: "guest", role: "user" };
    const encoded = Buffer.from(JSON.stringify(s)).toString("base64");
    res.cookie("sn_session", encoded, { httpOnly: false });
  }
  return s;
}

// ---- upload ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/[/\\]/g, "_")),
});
const upload = multer({ storage });

// ---- routes ----
app.get("/", (req, res) => {
  ensureSession(req, res);
  res.render("index", { posts: posts.filter((p) => !p.private) });
});

app.get("/upload", (req, res) => {
  ensureSession(req, res);
  res.render("upload", { result: null });
});

app.post("/upload", upload.single("photo"), (req, res) => {
  ensureSession(req, res);
  if (!req.file) {
    return res.render("upload", { result: { ok: false, msg: "No file uploaded." } });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  const isImage = IMAGE_EXTS.includes(ext);
  const post = {
    id: nextId++,
    title: req.body.title || req.file.originalname,
    caption: req.body.caption || "",
    filename: req.file.filename,
    private: false,
  };
  posts.push(post);
  if (!isImage) {
    return res.render("upload", {
      result: {
        ok: true,
        bypass: true,
        msg: "Hmm, that doesn't look like a real image... but the server accepted it anyway.",
        flag: FLAGS.upload,
        filename: req.file.filename,
      },
    });
  }
  res.render("upload", {
    result: { ok: true, bypass: false, msg: "Photo posted!", filename: req.file.filename },
  });
});

app.get("/post/:id", (req, res) => {
  ensureSession(req, res);
  const post = posts.find((p) => p.id === parseInt(req.params.id, 10));
  if (!post) return res.status(404).render("notfound");
  res.render("post", { post });
});

app.get("/view", (req, res) => {
  const name = req.query.img || "";
  const full = path.join(UPLOAD_DIR, name);
  fs.readFile(full, (err, data) => {
    if (err) return res.status(404).send("File not found.");
    const ext = path.extname(name).toLowerCase();
    const types = {
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    res.type(types[ext] || "application/octet-stream");
    res.send(data);
  });
});

app.get("/admin", (req, res) => {
  const s = ensureSession(req, res);
  if (!s || s.role !== "admin") {
    return res.status(403).render("forbidden");
  }
  res.render("admin", { posts, flag: FLAGS.cookie });
});

app.get("/api/status", (req, res) => {
  res.json({
    app: "SnapNest",
    version: "1.4.0",
    status: "ok",
    uptime: Math.floor(process.uptime()),
    maintainer: "devops@snapnest.local",
    internal_note: FLAGS.api,
  });
});

app.get("/__debug", (req, res) => {
  res.render("debug", {
    node: process.version,
    flag: FLAGS.recon,
    posts: posts.length,
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("sn_session");
  res.redirect("/");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SnapNest running on port " + PORT);
});
