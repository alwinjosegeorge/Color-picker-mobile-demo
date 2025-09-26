// script.js

let video = document.getElementById("camera-feed");
let canvas = document.getElementById("color-canvas");
let ctx = canvas.getContext("2d");
let colorInfo = document.getElementById("color-info");
let floatingChip = document.getElementById("floating-chip");
let historyList = document.getElementById("color-history");
let history = [];

// --- Full CSS color library (140+ colors) ---
const cssColors = {
  "AliceBlue": "#F0F8FF", "AntiqueWhite": "#FAEBD7", "Aqua": "#00FFFF",
  "Aquamarine": "#7FFFD4", "Azure": "#F0FFFF", "Beige": "#F5F5DC",
  "Bisque": "#FFE4C4", "Black": "#000000", "BlanchedAlmond": "#FFEBCD",
  "Blue": "#0000FF", "BlueViolet": "#8A2BE2", "Brown": "#A52A2A",
  "BurlyWood": "#DEB887", "CadetBlue": "#5F9EA0", "Chartreuse": "#7FFF00",
  "Chocolate": "#D2691E", "Coral": "#FF7F50", "CornflowerBlue": "#6495ED",
  "Crimson": "#DC143C", "Cyan": "#00FFFF", "DarkBlue": "#00008B",
  "DarkCyan": "#008B8B", "DarkGoldenRod": "#B8860B", "DarkGray": "#A9A9A9",
  "DarkGreen": "#006400", "DarkMagenta": "#8B008B", "DarkOrange": "#FF8C00",
  "DarkRed": "#8B0000", "DeepPink": "#FF1493", "DeepSkyBlue": "#00BFFF",
  "DimGray": "#696969", "DodgerBlue": "#1E90FF", "FireBrick": "#B22222",
  "ForestGreen": "#228B22", "Fuchsia": "#FF00FF", "Gold": "#FFD700",
  "Gray": "#808080", "Green": "#008000", "HotPink": "#FF69B4",
  "IndianRed": "#CD5C5C", "Indigo": "#4B0082", "Ivory": "#FFFFF0",
  "Khaki": "#F0E68C", "Lavender": "#E6E6FA", "LightBlue": "#ADD8E6",
  "LightCoral": "#F08080", "LightCyan": "#E0FFFF", "LightGreen": "#90EE90",
  "LightPink": "#FFB6C1", "LightSalmon": "#FFA07A", "LightSeaGreen": "#20B2AA",
  "LightSkyBlue": "#87CEFA", "LightSlateGray": "#778899", "LightYellow": "#FFFFE0",
  "Lime": "#00FF00", "LimeGreen": "#32CD32", "Magenta": "#FF00FF",
  "Maroon": "#800000", "MediumAquaMarine": "#66CDAA", "MediumBlue": "#0000CD",
  "MediumOrchid": "#BA55D3", "MediumPurple": "#9370DB", "MediumSeaGreen": "#3CB371",
  "MediumSlateBlue": "#7B68EE", "MediumSpringGreen": "#00FA9A", "MediumTurquoise": "#48D1CC",
  "MidnightBlue": "#191970", "MistyRose": "#FFE4E1", "Moccasin": "#FFE4B5",
  "Navy": "#000080", "Olive": "#808000", "OliveDrab": "#6B8E23",
  "Orange": "#FFA500", "OrangeRed": "#FF4500", "Orchid": "#DA70D6",
  "PaleGreen": "#98FB98", "PaleTurquoise": "#AFEEEE", "PaleVioletRed": "#DB7093",
  "PapayaWhip": "#FFEFD5", "PeachPuff": "#FFDAB9", "Peru": "#CD853F",
  "Pink": "#FFC0CB", "Plum": "#DDA0DD", "PowderBlue": "#B0E0E6",
  "Purple": "#800080", "RebeccaPurple": "#663399", "Red": "#FF0000",
  "RosyBrown": "#BC8F8F", "RoyalBlue": "#4169E1", "SaddleBrown": "#8B4513",
  "Salmon": "#FA8072", "SandyBrown": "#F4A460", "SeaGreen": "#2E8B57",
  "Sienna": "#A0522D", "Silver": "#C0C0C0", "SkyBlue": "#87CEEB",
  "SlateBlue": "#6A5ACD", "SlateGray": "#708090", "SpringGreen": "#00FF7F",
  "SteelBlue": "#4682B4", "Tan": "#D2B48C", "Teal": "#008080",
  "Thistle": "#D8BFD8", "Tomato": "#FF6347", "Turquoise": "#40E0D0",
  "Violet": "#EE82EE", "Wheat": "#F5DEB3", "White": "#FFFFFF",
  "Yellow": "#FFFF00", "YellowGreen": "#9ACD32"
};

// --- Helpers ---

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b].map(x => {
      let hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("")
  ).toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(r, g, b) {
  return Math.round(((0.299*r + 0.587*g + 0.114*b)/255) * 100);
}

function getNearestColor(hex) {
  let minDiff = Infinity, closestName = "Unknown";
  let target = parseInt(hex.slice(1), 16);
  for (let name in cssColors) {
    let diff = Math.abs(target - parseInt(cssColors[name].slice(1), 16));
    if (diff < minDiff) {
      minDiff = diff;
      closestName = name;
    }
  }
  return closestName;
}

// --- Main Events ---

document.getElementById("start-camera").addEventListener("click", async () => {
  try {
    let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.play();

    setInterval(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let frame = ctx.getImageData(canvas.width/2, canvas.height/2, 1, 1).data;

      let r = frame[0], g = frame[1], b = frame[2];
      let hex = rgbToHex(r, g, b);
      let hsl = rgbToHsl(r, g, b);
      let bright = luminance(r, g, b);
      let name = getNearestColor(hex);

      updateUI(r, g, b, hex, hsl, bright, name);
    }, 500);
  } catch (err) {
    alert("Camera access denied or not available!");
  }
});

document.getElementById("upload-img").addEventListener("change", (e) => {
  let img = new Image();
  img.src = URL.createObjectURL(e.target.files[0]);
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
});

document.getElementById("copy-color").addEventListener("click", () => {
  let text = colorInfo.textContent;
  navigator.clipboard.writeText(text);
  alert("Copied: " + text);
});

document.getElementById("export-history").addEventListener("click", () => {
  let csv = "HEX,RGB,HSL,Luminance,Name\n";
  history.forEach(h => {
    csv += `${h.hex},${h.rgb},${h.hsl},${h.lum}%,${h.name}\n`;
  });
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "color-history.csv";
  a.click();
});

// --- Update UI ---

function updateUI(r, g, b, hex, hsl, lum, name) {
  colorInfo.textContent = `HEX: ${hex} | RGB: (${r}, ${g}, ${b}) | HSL: (${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%) | Brightness: ${lum}% | Name: ${name}`;

  floatingChip.style.background = hex;
  floatingChip.textContent = hex;

  let item = document.createElement("li");
  item.textContent = `${hex} - ${name} (${lum}% bright)`;
  item.style.color = hex;
  historyList.prepend(item);

  history.push({
    hex,
    rgb: `(${r},${g},${b})`,
    hsl: `(${hsl[0]},${hsl[1]}%,${hsl[2]}%)`,
    lum,
    name
  });
}
