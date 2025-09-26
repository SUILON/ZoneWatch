FROM python:3.13-bullseye

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy requirements first (for better layer caching)
COPY requirements.txt /app/

# Install dependencies globally using uv
RUN uv pip install --system -r requirements.txt

# Copy the rest of the application
COPY . /app/

# Change ownership of the app directory
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Command will be overridden by docker-compose
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]