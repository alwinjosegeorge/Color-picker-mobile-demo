// script.js

let video = document.getElementById("camera-feed");
let canvas = document.getElementById("color-canvas");
let ctx = canvas.getContext("2d");
let colorInfo = document.getElementById("color-info");
let floatingChip = document.getElementById("floating-chip");
let historyList = document.getElementById("color-history");
let history = [];

// 🎨 Expanded color database (30+ shades)
const COLORS = {
  "#FF0000": "Red",
  "#DC143C": "Crimson",
  "#B22222": "FireBrick",
  "#FF7F50": "Coral",
  "#FF8C00": "Dark Orange",
  "#FFD700": "Gold",
  "#FFFF00": "Yellow",
  "#9ACD32": "Yellow Green",
  "#00FF00": "Lime",
  "#32CD32": "Lime Green",
  "#008000": "Green",
  "#006400": "Dark Green",
  "#00FFFF": "Cyan",
  "#40E0D0": "Turquoise",
  "#0000FF": "Blue",
  "#4169E1": "Royal Blue",
  "#1E90FF": "Dodger Blue",
  "#000080": "Navy",
  "#800080": "Purple",
  "#8A2BE2": "Blue Violet",
  "#FF00FF": "Magenta",
  "#DA70D6": "Orchid",
  "#FFC0CB": "Pink",
  "#FF1493": "Deep Pink",
  "#A52A2A": "Brown",
  "#8B4513": "Saddle Brown",
  "#808080": "Gray",
  "#696969": "Dim Gray",
  "#000000": "Black",
  "#FFFFFF": "White"
};

// 🔍 Find nearest color name from db
function getColorName(hex) {
  let minDiff = Infinity;
  let closestName = hex;
  for (let key in COLORS) {
    let diff = Math.abs(parseInt(hex.slice(1), 16) - parseInt(key.slice(1), 16));
    if (diff < minDiff) {
      minDiff = diff;
      closestName = COLORS[key];
    }
  }
  return closestName;
}

// 🎥 Start Camera
document.getElementById("start-camera").addEventListener("click", async () => {
  try {
    let stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Continuous detection
    setInterval(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let frame = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;

      let r = frame[0], g = frame[1], b = frame[2];
      let hex = rgbToHex(r, g, b);
      let name = getColorName(hex);

      updateUI(r, g, b, hex, name);
    }, 400); // every 0.4 sec
  } catch (err) {
    alert("Camera access denied or not available!");
  }
});

// 🖼 Upload Image
document.getElementById("upload-img").addEventListener("change", (e) => {
  let img = new Image();
  img.src = URL.createObjectURL(e.target.files[0]);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
});

// 📋 Copy Color
document.getElementById("copy-color").addEventListener("click", () => {
  let text = colorInfo.textContent;
  navigator.clipboard.writeText(text);
  alert("Copied: " + text);
});

// 📂 Export CSV
document.getElementById("export-history").addEventListener("click", () => {
  let csv = "HEX,RGB,Name\n";
  history.forEach((h) => {
    csv += `${h.hex},${h.rgb},${h.name}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "color-history.csv";
  a.click();
});

// 🆙 Update UI
function updateUI(r, g, b, hex, name) {
  colorInfo.textContent = `HEX: ${hex} | RGB: (${r}, ${g}, ${b}) | Name: ${name}`;

  floatingChip.style.background = hex;
  floatingChip.textContent = name;

  let item = document.createElement("li");
  item.textContent = `${hex} - ${name}`;
  item.style.color = hex;
  historyList.prepend(item);

  history.push({ hex, rgb: `(${r},${g},${b})`, name });
}

// 🎨 RGB → HEX
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        let hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}
