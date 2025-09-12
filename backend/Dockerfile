FROM python:3.13-bullseye

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy requirements first (for better layer caching)
COPY requirements.txt /app/

# Install dependencies as root, then switch to non-root user
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Change ownership of the app directory
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Command will be overridden by docker-compose
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]