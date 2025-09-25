FROM python:3.13-bullseye

# PostgreSQL client libraries and build dependencies
RUN apt-get update && \
    apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install mlflow psycopg2-binary

RUN mkdir ./mlflow