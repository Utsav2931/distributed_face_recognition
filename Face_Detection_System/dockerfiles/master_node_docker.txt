FROM python:3.10.10-buster
WORKDIR /usr/src/app
COPY requirements.txt ./
COPY .env ./
COPY ./mesh ./mesh
#RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r requirements.txt
RUN apt-get update && apt-get install -y libgl1-mesa-glx ffmpeg
COPY docker_producer.py .
CMD [ "python", "-u", "docker_producer.py" ]