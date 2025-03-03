FROM python:3.12.9-slim

WORKDIR /code

COPY ./app /code/app

COPY requirements.txt /code/

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]