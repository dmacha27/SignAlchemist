from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
async def upload_file(
    file: UploadFile = File(...),  # Para manejar el archivo
    signalType: str = Form(...),   # Para manejar signalType
    timestampColumn: str = Form(...),  # Para manejar timestampColumn
    signalValues: str = Form(...)   # Para manejar signalValues
):
    # Aquí puedes procesar los datos como desees
    return JSONResponse(content={
        "filename": file.filename,
        "signalType": signalType,
        "timestampColumn": timestampColumn,
        "signalValues": signalValues
    })


@app.options("/process")
async def options_process():
    return {"message": "Preflight OPTIONS request handled"}

@app.post("/process")
async def process (file: UploadFile = File(...), 
           signalType: str = Form(...), 
           timestampColumn: str = Form(...), 
           signalValues: str = Form(...)):

    pipelines = [
        {"title": "Pipeline 1", "qualityMetric": 98.5},
        {"title": "Pipeline 2", "qualityMetric": 92.3},
    ]
    
    return JSONResponse(content={"pipelines": pipelines})