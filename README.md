# Distributed Face Recognition
**In the *Front_End* folder make sure you install required node packages with ``` npm install ```**

Then go to the *Front_End/React* and start the react app with ``` npm start ```

Go to the nodeJs and start the server by ``` node server.js ```

Make sure you have a *.env* file which has the path to the shared folder.

**For *Face_Detection_System* make sure you install required libraries with ```pip install -r requirements.txt```**

Then go to *Face_Detection_System* and start the producer (master node) by ``` python3 producer.py ```

Now start both consumer (worker node) by ``` python3 consumer1.py ``` & ``` python3 consumer2.py ```

Make sure to have a *.env* file that has username and password for the postgres database and path to the shared folder.

If you want to create docker containers then refer to the *dockerfiles* folder that is inside *Face_Detection_System*
