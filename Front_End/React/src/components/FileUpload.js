import React, { useState, useRef, useEffect } from 'react';
import './fileupload.css'

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [showVideo, setShowVideo] = useState(false)
    const [importedModule, setImportedModule] = useState(null);
    const [time, setTime] = useState({})

    //Communicating with the node backend
    const callApi = async () => {
        fetch('http://localhost:3001/').then(res => res.json()).then(res => {
            console.log("Result: ")
            console.log(res, showVideo)
            if (res.worker1 > -1) {
                console.log("Condition met")
                clearInterval(interval)
                setShowVideo(true)
                setTime(res)
            }
        })
    }

    //Dynamically importing the video
    useEffect(() => {
        const importModule = async () => {
            try {
                console.log("This is show video: ", showVideo)
                if (showVideo === true) {
                    console.log("Inside import")
                    const videoModule = await import('../assets/output_video.mp4');
                    const videoSource = String(videoModule.default);
                    setImportedModule(videoSource);
                } else {
                    setImportedModule(null)
                }
            } catch (error) {
                console.error('Error importing module:', error);
            }
        };

        importModule();
    }, [showVideo]);

    var interval = setInterval(callApi, 10000);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    //Sending file to the node api
    const handleUpload = () => {
        if (!selectedFile) {
            return;
        }

        const formData = new FormData();
        formData.append('video', selectedFile);
        fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.text())
            .then((data) => {
                console.log('File uploaded successfully');
                console.log(data)
                setShowVideo(false)
                interval = setInterval(callApi, 10000);
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
            });
    };

    return (
        <>
            <div className="container">
                <div className='upload_container'>
                    <label htmlFor="file-upload" className="custom-file-button">
                        Choose File
                    </label>
                    <input id="file-upload" type="file" onChange={handleFileChange} />
                    <button onClick={handleUpload} className="upload-button">Upload</button>

                </div>
                {/* <div className='show_video'>Show Video: {showVideo.toString()}</div> */}
                {selectedFile && <div>{selectedFile.name}</div>}

                {importedModule && showVideo && <div><video controls download autoPlay>
                    <source src={importedModule} type="video/mp4" />
                    {/* Add more <source> elements for different video formats if needed */}
                    Your browser does not support the video tag.
                </video>
                    <div>
                        <table>
                            <tr>
                                <th>Worker Machine </th>
                                <th>Time in seconds</th>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>{time.worker1.toFixed(3)} Seconds</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>{time.worker2.toFixed(3)} Seconds</td>
                            </tr>
                        </table>
                        
                    </div>

                </div>}
            </div>

        </>


    );
};

export default FileUpload;
