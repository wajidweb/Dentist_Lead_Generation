FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
RUN pip install --no-cache-dir git+https://github.com/laramies/theHarvester.git

COPY . .
EXPOSE 5000
CMD ["restfulHarvest", "--host", "0.0.0.0", "--port", "5000"]
