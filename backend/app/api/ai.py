from fastapi import APIRouter, File, UploadFile
from PIL import Image
import io
from app.services.ai_engine import analyze_crop_image

router = APIRouter()

@router.post("/diagnose")
async def diagnose_crop(file: UploadFile = File(...)):
    """
    Receives an uploaded image file, processes it, and sends it to Gemini for diagnosis.
    Validates file type to reject non-image files.
    """
    if not file.content_type.startswith("image/"):
        return {"error": "Invalid file type. Please upload an image (JPEG, PNG)."}

    try:
        # Read image to memory
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Call Gemini Vision (expects PIL Image)
        diagnosis = analyze_crop_image(image)
        
        return {"diagnosis": diagnosis}
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}
