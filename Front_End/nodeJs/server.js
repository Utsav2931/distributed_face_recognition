const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const cors = require('cors');
const amqp = require('amqplib');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

app.use(cors());
const videoPath = process.env.VIDEO_FOLDER; //change this to your shared folder path

let reply = {
    "worker1": -1,
    "worker2": -1
}
//waiting for the master node to finish the job
async function getMasterMessage() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queueName = 'masterQueue';
        await channel.assertQueue(queueName, { durable: false });
        channel.consume(queueName, (message) => {
            if (message !== null) {
                const content = JSON.parse(message.content.toString());
                reply = content
                console.log('Received message:', content, 'Type: ', typeof (content));
                channel.ack(message);
                console.log('Closing channel and connection in 5 seconds');
                setTimeout(function () {
                    channel.close()
                    connection.close()
                    console.log("connection closed")
                }, 5000);
            }
        });
        console.log('Waiting for messages...');
    } catch (error) {
        console.error('Error:', error);
    }
}

//Telling master node to start working on the video
const send_message = async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queueName = 'clientQueue';
    const message = 'Start Working!';
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from(message));
    console.log('Message sent:', message, " Waiting for response");
    await channel.close();
    await connection.close();
    getMasterMessage()
}

app.use(fileUpload());

//Storing the video in the shared storage
app.post('/api/upload', (req, res) => {
    reply = {
        "worker1": -1,
        "worker2": -1
    }
    if (!req.files || !req.files.video) {
        res.status(400).json({ error: 'No video file provided' });
        return;
    }

    const videoFile = req.files.video;
    
    videoFile.mv(videoPath, (error) => {
        if (error) {
            console.error('Error saving file:', error);
            res.status(500).json({ error: 'File upload failed' });
        } else {
            res.status(200).json({ message: 'File uploaded successfully' });
            send_message()
        }
    });
});

//Get call to talk to the react app
app.get('', (req, res) => {
    res.json(reply)
})



app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
