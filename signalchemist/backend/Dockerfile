FROM python:3.12.9-slim

WORKDIR /app

COPY ./app /app/app
COPY requirements.txt /app/

RUN pip install -r requirements.txt

EXPOSE ${VITE_BACKEND_PORT:-8000}

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${VITE_BACKEND_PORT:-8000}"]
