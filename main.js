let canvas = document.getElementById("image-paste");
let context = canvas.getContext("2d");
let isDrawing = false;
let startX = 0;
let startY = 0;
let canvasSnapshot = null;

const colorPicker = document.getElementById("colorPicker");
const lineThick = document.getElementById("lineThick");

function startDrawing(event) {
  if (activeTool === "none") return;

  isDrawing = true;
  startX = event.offsetX;
  startY = event.offsetY;

  canvasSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
}
function stopDrawing() {
  isDrawing = false;
  canvasSnapshot = null;
}
function draw(event) {
  if (!isDrawing) return;

  context.putImageData(canvasSnapshot, 0, 0);

  if (activeTool === "rectangle") {
    const width = event.offsetX - startX;
    const height = event.offsetY - startY;
    context.strokeStyle = colorPicker.value;
    context.lineWidth = lineThick.value;
    context.beginPath();
    context.rect(startX, startY, width, height);
    context.stroke();
  } else if (activeTool === "line") {
    context.strokeStyle = colorPicker.value;
    context.lineWidth = lineThick.value;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
  } else if (activeTool === "arrow") {
    context.strokeStyle = colorPicker.value;
    context.lineWidth = lineThick.value;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(event.offsetX, event.offsetY);
    drawArrowhead(context, startX, startY, event.offsetX, event.offsetY);
    context.stroke();
  }
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

let activeTool = "none";

const toolButtons = document.querySelectorAll(".toolButton");

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const toolName = button.id.replace("Btn", "");

    activeTool = toolName;

    console.log("Active tool changed to:", activeTool);

    toolButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
  });
});
addEventListener("paste", (event) => {
  event.preventDefault();

  const items = event.clipboardData.items;

  let imageFile = null;

  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      imageFile = item.getAsFile();

      break;
    }
  }

  if (imageFile) {
    console.log("Successfully captured image file:", imageFile);
    const storedURL = URL.createObjectURL(imageFile);
    const image = new Image();
    image.onload = () => {
      console.log("Image has loaded and is ready to be drawn!");
      canvas = document.getElementById("image-paste");
      context = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
    };
    image.src = storedURL;
  }
});
