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
      const canvas = document.getElementById("image-paste");
      const context = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
    };
    image.src = storedURL;
  }
});
