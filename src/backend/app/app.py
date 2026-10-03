from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from diffusers import ControlNetModel, StableDiffusionPipeline
import torch
import io
from PIL import Image
import numpy as np
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/sd-controlnet-canny",
      )

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", 
    controlnet=controlnet, 
    )

pipe.to("cpu")
@app.post("/generate")
async def generate_image(prompt: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    image_array = np.array(image)
    edges = cv2.Canny(image_array, 100, 200)
    edge_image = Image.fromarray(edges)
    edge_image = edge_image.convert("RGB")
    edge_image = edge_image.resize((512, 512))
    result = pipe(
        prompt=prompt, 
        image=edge_image, 
        num_inference_steps=20, 
        guidance_scale=7.5).images[0]

    output = io.BytesIO()
    result.save(output, format="PNG")
    output.seek(0)

    return StreamingResponse(output, media_type="image/png")
    