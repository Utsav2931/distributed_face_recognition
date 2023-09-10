import pika
import time
import random
import cv2
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
from dotenv import dotenv_values

#Make sure your .env file has username and password for the postgres and also add the path to the shared folder
env_vars = dotenv_values('.env')  
client_connection_parameters = pika.ConnectionParameters('127.0.0.1', heartbeat = 0)
client_connection = pika.BlockingConnection(client_connection_parameters)
client_channel = client_connection.channel()

#Listining to client's queue 
def on_client_message(ch, method, properties, body):
    global env_vars
    print("Received Message: ", body.decode())
    connection_parameters = pika.ConnectionParameters('127.0.0.1', heartbeat = 0)
    connection = pika.BlockingConnection(connection_parameters)
    channel = connection.channel()
    job_queue = channel.queue_declare(queue='job')
    messageId = 1

    conn = psycopg2.connect(
        host="127.0.0.1",
        database="postgres",
        user=env_vars.get('USER'),
        password=env_vars.get('PASSWORD')
    )
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("DELETE FROM image")
    video_path = env_vars.get('VIDEO_FOLDER')
    video_path += "\\Test.mp4"
    video_capture = cv2.VideoCapture(video_path)

    frame_count = 0  

    #Frame extraction and storing them in database
    while True:
        success, frame = video_capture.read()  

        if not success: 
            print("End of video or Video not found") 
            break

        frame_count += 1  
        frame_bytes = cv2.imencode('.jpg', frame)[1].tobytes()

        # Insert the frame into the database
        insert_query = f"INSERT INTO image (id, img) VALUES ({frame_count}, {psycopg2.Binary(frame_bytes)})"
        cursor.execute(insert_query)
        conn.commit()
        job_id = str(frame_count) 

        channel.basic_publish(exchange='', routing_key='job', body=job_id)

        print(f"sent job id: {job_id}")
        
        #time.sleep(random.randint(1, 4))

        
        # cv2.imshow('Frame', frame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break

    # Release the video capture and close any open windows
    video_capture.release()
    cv2.destroyAllWindows()

    #Waiting for the job to get done
    job_done = False
    while not job_done:
        job_queue = channel.queue_declare(queue='job')
        if(job_queue.method.message_count == 0):
            print("Job Done")
            job_done = True
            time.sleep(2)
        else:
            print("Still Working Will Check After 10 Secs")
            print("Message in queue: ", job_queue.method.message_count)
            time.sleep(10)
    
    fetch_query = "SELECT * FROM image"
    cursor.execute(fetch_query)
    data = cursor.fetchall()
    frame_count = 0

    for d in data:
        image_data = d['img']
        i_id = d['id']
        file_path = f".\\mesh\\mesh_{i_id}.jpg"
        
        with open(file_path, "wb") as file:
            file.write(image_data)
        
        frame_count += 1

    #Merging all the frames into one video
    fourcc = cv2.VideoWriter_fourcc(*"H264")
    #Path to store the file
    output_file = ""
    image = cv2.imread('.\\mesh\\mesh_1.jpg')
    height, width = image.shape[:2]
    video_writer = cv2.VideoWriter(output_file, fourcc, 30, (width, height))
    print("Creating Video")
    for i in range (1, frame_count + 1):
        frame_path = f".\\mesh\\mesh_{i}.jpg"  
        frame = cv2.imread(frame_path)
        video_writer.write(frame)
        
    video_writer.release()

    
    print("Video Created")
    fetch_time = "SELECT * FROM worker"
    cursor.execute(fetch_time)
    data = cursor.fetchall()
    message = {
        "worker1" : data[0]['time'],
        "worker2" : data[1]['time']
    }
    message = json.dumps(message)
    cursor.close()
    channel.queue_declare(queue='masterQueue')
    channel.basic_publish(exchange='', routing_key='masterQueue', body = message)
    print("Message sent to backend")
    conn.close()
    channel.close()
    connection.close()


client_channel.basic_consume(queue='clientQueue', auto_ack = True,on_message_callback=on_client_message)
print("Starting Client Consume")

client_channel.start_consuming()
