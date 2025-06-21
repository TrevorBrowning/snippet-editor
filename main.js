let canvas = document.getElementById("image-paste");
let context = canvas.getContext("2d");
let isDrawing = false;
let startX = 0;
let startY = 0;
let canvasSnapshot = null;
let history = [];
let activeTool = "none";

const colorPicker = document.getElementById("colorPicker");
const lineThick = document.getElementById("lineThick");
const downloadBtn = document.getElementById("downloadBtn");
const undoBtn = document.getElementById("undoBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const pasteBtn = document.getElementById("pasteBtn");
const toolButtons = document.querySelectorAll(".toolButton");

/**
 * Handles the core logic of processing a pasted image blob/file
 * and drawing it onto the canvas, scaled to fit the screen.
 * @param {Blob | File} imageBlob The image data to process.
 */
function handlePastedImage(imageBlob) {
  if (!imageBlob) return;

  console.log("Processing pasted image...", imageBlob);
  const imageUrl = URL.createObjectURL(imageBlob);
  const image = new Image();

  image.onload = () => {
    console.log("Image has loaded. Calculating optimal canvas size.");

    const padding = 60;
    const headerHeight = document.querySelector("header").offsetHeight;
    const toolbarHeight = document.querySelector(".toolbar").offsetHeight;
    const maxCanvasWidth = window.innerWidth - padding;
    const maxCanvasHeight =
      window.innerHeight - headerHeight - toolbarHeight - padding;

    const imgWidth = image.width;
    const imgHeight = image.height;

    const scaleRatio = Math.min(
      maxCanvasWidth / imgWidth,
      maxCanvasHeight / imgHeight,
      1
    );

    canvas.width = imgWidth * scaleRatio;
    canvas.height = imgHeight * scaleRatio;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    history = [];
    history.push(context.getImageData(0, 0, canvas.width, canvas.height));
  };

  image.src = imageUrl;
}

function startDrawing(event) {
  if (activeTool === "none") return;
  isDrawing = true;
  startX = event.offsetX;
  startY = event.offsetY;
  canvasSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
}

function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  history.push(context.getImageData(0, 0, canvas.width, canvas.height));
}

function draw(event) {
  if (!isDrawing) return;

  context.putImageData(canvasSnapshot, 0, 0);

  context.strokeStyle = colorPicker.value;
  context.lineWidth = lineThick.value;
  context.lineCap = "round";

  context.beginPath();

  if (activeTool === "rectangle") {
    const width = event.offsetX - startX;
    const height = event.offsetY - startY;
    context.rect(startX, startY, width, height);
  } else if (activeTool === "line") {
    context.moveTo(startX, startY);
    context.lineTo(event.offsetX, event.offsetY);
  } else if (activeTool === "arrow") {
    context.moveTo(startX, startY);
    context.lineTo(event.offsetX, event.offsetY);
    drawArrowhead(context, startX, startY, event.offsetX, event.offsetY);
  }

  context.stroke();
}

function drawArrowhead(context, fromX, fromY, toX, toY) {
  const headLength = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  context.moveTo(toX, toY);
  context.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  context.moveTo(toX, toY);
  context.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseout", stopDrawing);

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("toolButton")) {
      const toolName = button.id.replace("Btn", "");
      activeTool = toolName;
      console.log("Active tool changed to:", activeTool);

      toolButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    }
  });
});

undoBtn.addEventListener("click", () => {
  if (history.length > 1) {
    history.pop();
    const lastState = history[history.length - 1];
    context.putImageData(lastState, 0, 0);
  } else {
    console.log("No more states to undo.");
  }
});

downloadBtn.addEventListener("click", () => {
  const imageURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageURL;
  const filename = `snippet-${Date.now()}.png`;
  link.download = filename;
  link.click();
});

copyBtn.addEventListener("click", () => {
  canvas.toBlob((blob) => {
    const item = new ClipboardItem({ "image/png": blob });
    navigator.clipboard
      .write([item])
      .then(() => {
        console.log("Image copied to clipboard successfully!");
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy image: ", err);
        alert("Sorry, failed to copy the image.");
      });
  }, "image/png");
});

clearBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the canvas?")) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    console.log("Canvas cleared and history reset.");
  } else {
    console.log("Clear action was cancelled.");
  }
});

pasteBtn.addEventListener("click", async () => {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (imageType) {
        const blob = await item.getType(imageType);
        handlePastedImage(blob);
        return;
      }
    }
    alert("No image found on the clipboard.");
  } catch (err) {
    console.error("Failed to read from clipboard: ", err);
    alert(
      "Failed to paste. Please ensure you have granted clipboard permissions."
    );
  }
});

addEventListener("paste", (event) => {
  event.preventDefault();
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const imageFile = item.getAsFile();
      handlePastedImage(imageFile);
      break;
    }
  }
});
