import { useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(5);
  const [generatedImage, setGeneratedImage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function startDrawing(event) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    setDrawing(true);
  }

  function draw(event) {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";

    ctx.lineTo(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    ctx.stroke();
  }

  function stopDrawing() {
    setDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleGenerate() {
    const canvas = canvasRef.current;

    if (!canvas || isGenerating) return;

    setIsGenerating(true);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsGenerating(false);
        return;
      }

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("file", blob, "sketch.png");

      try {
        const response = await fetch("http://127.0.0.1:8000/generate", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to generate image");
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        setGeneratedImage((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return imageUrl;
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsGenerating(false);
      }
    }, "image/png");
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Sketch to Image</h1>

      <h3>Draw your sketch</h3>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        style={{
          border: "2px solid black",
          backgroundColor: "white",
          cursor: "crosshair",
          touchAction: "none",
        }}
      />

      <div style={{ marginTop: "15px" }}>
        <label>
          Brush size: {brushSize}
        </label>

        <br />

        <input
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
      </div>

      <div style={{ marginTop: "15px" }}>
        <button onClick={clearCanvas}>
          Clear Sketch
        </button>
      </div>

      <div style={{ marginTop: "25px" }}>
        <h3>Prompt</h3>

        <textarea
          placeholder="Example: Turn this sketch into a realistic futuristic city at sunset"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          cols={60}
          style={{
            padding: "10px",
            fontSize: "16px",
          }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            opacity: isGenerating ? 0.7 : 1,
            cursor: isGenerating ? "wait" : "pointer",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Image"}
        </button>
      </div>

      {generatedImage && (
        <div style={{ marginTop: "30px" }}>
          <h3>Generated Image</h3>
          <img
            src={generatedImage}
            alt="Generated sketch result"
            style={{
              maxWidth: "100%",
              maxHeight: "500px",
              border: "2px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f5f5f5",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;