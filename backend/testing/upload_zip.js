const uploadBtn = document.getElementById('uploadBtn');
const zipInput = document.getElementById('zipInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressText = document.getElementById('progressText');

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Imt5bGUiLCJpYXQiOjE3NzUzNjI4MjksImV4cCI6MTc3NTQ0OTIyOX0.W7RFxFDmlBA4wlIlb7jrET3KrA7IxI2ajV7TpY5BZ6w"; 

uploadBtn.addEventListener('click', () => {
    const file = zipInput.files[0];

    if (!file) {
        alert('Please select a ZIP file');
        return;
    }

    const formData = new FormData();
    formData.append('zipfile', file);
    formData.append('gameId', '20');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:3000/games/upload-zip', true);

    // ✅ Add Authorization header
    xhr.setRequestHeader('Authorization', `Bearer ${BEARER_TOKEN}`);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            uploadProgress.value = percent;
            progressText.textContent = percent + '%';
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            uploadProgress.value = 100;
            progressText.textContent = '100%';

            const response = JSON.parse(xhr.responseText);
            console.log(response);

            alert('ZIP uploaded and extracted successfully!');
        } else {
            alert('Upload failed: ' + xhr.responseText);
        }
    };

    xhr.onerror = () => {
        alert('Network error during upload');
    };

    xhr.send(formData);
});