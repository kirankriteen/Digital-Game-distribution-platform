// ---------------- Upload Section ----------------
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressText = document.getElementById('progressText');

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Imt5bGUiLCJpYXQiOjE3NzUxMzQ5MzQsImV4cCI6MTc3NTIyMTMzNH0.eINW2YiKWNjfK4e9ZLkb7_Ho6sapKfq4zTR2ObVvzEw";

uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const title = document.getElementById('title').value.trim();
    const genre = document.getElementById('genre').value.trim();
    const price = document.getElementById('price').value.trim();

    if (!file || !title || !genre || !price) {
        alert('Please fill all fields and select a file.');
        return;
    }

    try {
        // Step 1: Request presigned URL from server
        const res = await fetch('http://127.0.0.1:3000/games/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BEARER_TOKEN}`
            },
            body: JSON.stringify({
                filename: file.name,
                title,
                genre,
                price
            })
        });

        if (!res.ok) {
            let msg;
            try {
                const errJson = await res.json();
                msg = errJson.error || JSON.stringify(errJson);
            } catch {
                msg = await res.text();
            }
            throw new Error(msg || 'Failed to get upload URL');
        }

        const data = await res.json();
        const presignedUrl = data.uploadUrl;
        const gameId = data.gameId;

        console.log('Presigned URL:', presignedUrl, 'Game ID:', gameId);

        // Step 2: Upload file using XMLHttpRequest for full browser support
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                uploadProgress.value = percent;
                progressText.textContent = percent + '%';
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                uploadProgress.value = 100;
                progressText.textContent = '100%';
                alert('Upload finished! Notifying server...');

                // Step 3: Notify server upload is complete
                const notifyRes = await fetch('http://127.0.0.1:3000/games/upload-complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${BEARER_TOKEN}`
                    },
                    body: JSON.stringify({ gameId })
                });

                if (!notifyRes.ok) {
                    let msg;
                    try {
                        const errJson = await notifyRes.json();
                        msg = errJson.error || JSON.stringify(errJson);
                    } catch {
                        msg = await notifyRes.text();
                    }
                    throw new Error(msg || 'Server failed to confirm upload');
                }

                const notifyData = await notifyRes.json();
                if (notifyData.success) {
                    alert('Server confirmed game uploaded successfully!');
                    // Reset UI
                    uploadProgress.value = 0;
                    progressText.textContent = '0%';
                    fileInput.value = '';
                    document.getElementById('title').value = '';
                    document.getElementById('genre').value = '';
                    document.getElementById('price').value = '';
                } else {
                    alert('Upload completed but server verification failed.');
                }

            } else {
                let msg = xhr.responseText || `Upload failed with status ${xhr.status}`;
                alert('Server Error: ' + msg);
            }
        };

        xhr.onerror = () => {
            alert('Error uploading file. Check your network or server.');
        };

        xhr.send(file);

    } catch (err) {
        console.error(err);
        alert('Server Error: ' + err.message);
    }
});

// ---------------- Download Section ----------------
const downloadBtn = document.getElementById('downloadBtn');
const downloadFilenameInput = document.getElementById('downloadFilename');
const saveAsInput = document.getElementById('saveAs');

downloadBtn.addEventListener('click', async () => {
    const downloadFilename = downloadFilenameInput.value.trim();
    const saveAs = saveAsInput.value.trim();

    if (!downloadFilename || !saveAs) {
        alert('Please enter filename in MinIO and local save name');
        return;
    }
    console.log(downloadFilename)

    try {
        const res = await fetch(`http://127.0.0.1:3000/games/download-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: downloadFilename })
        });

        if (!res.ok) {
            let msg;
            try {
                const errJson = await res.json();
                msg = errJson.error || JSON.stringify(errJson);
            } catch {
                msg = await res.text();
            }
            throw new Error(msg || 'Failed to get download URL');
        }

        const data = await res.json();
        const presignedUrl = data.url;

        const link = document.createElement('a');
        link.href = presignedUrl;
        link.download = saveAs;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        console.error(err);
        alert('Server Error: ' + err.message);
    }
});