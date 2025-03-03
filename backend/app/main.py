from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*']
)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.options("/upload")
async def options_upload():
    return {"message": "Preflight OPTIONS request handled"}

@app.post("/upload")
async def create_upload_file(file: UploadFile):
    return {"filename": file.filename}