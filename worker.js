addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  const DOMAIN = 'https://image-host.tahmasebimoein140.workers.dev';

  switch (pathname) {
    case '/':
      return await handleRootRequest();
    case '/login':
      return request.method === 'POST' ? await handleLoginRequest(request) : new Response('روش مجاز نیست', { status: 405 });
    case '/upload':
      return request.method === 'POST' ? await handleUploadRequest(request, DOMAIN) : new Response('روش مجاز نیست', { status: 405 });
    default:
      return await handleImageRequest(request);
  }
}

async function handleRootRequest() {
  const html = `
  <!DOCTYPE html>
  <html lang="fa">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به آپلودر تصاویر</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/vazir-font@27.2.0/dist/font-face.css" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Vazir', sans-serif;
        transition: background-image 1s ease-in-out;
      }
      .login-card, .upload-card {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
      }
      .preview-image {
        max-width: 100%;
        max-height: 200px;
        margin-bottom: 10px;
        border-radius: 5px;
        display: none;
      }
      .login-btn, .upload-btn {
        background: #0088cc;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
      }
      .login-btn:hover, .upload-btn:hover {
        background: #006bb3;
      }
      #imageLink {
        display: none;
        margin-top: 15px;
      }
      #copyBtn {
        background: #28a745;
        color: white;
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
      }
      #copyBtn:hover {
        background: #218838;
      }
      input[type="file"] {
        display: none;
      }
      .file-label {
        background: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 10px;
        display: inline-block;
      }
      .file-label:hover {
        background: #e0e0e0;
      }
      .footer {
        position: fixed;
        bottom: 10px;
        text-align: center;
        width: 100%;
      }
      .footer a {
        color: #007bff;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
      .error-message {
        color: red;
        margin-top: 10px;
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="loginCard" class="login-card">
      <h1 class="text-2xl font-bold mb-4">ورود به آپلودر</h1>
      <input type="password" id="passwordInput" class="w-full p-2 border rounded-lg mb-4" placeholder="رمز عبور را وارد کنید">
      <button id="loginBtn" class="login-btn">ورود</button>
      <p id="errorMessage" class="error-message">رمز عبور اشتباه است!</p>
    </div>
    <div id="uploadCard" class="upload-card" style="display: none;">
      <img id="previewImage" class="preview-image" alt="پیش‌نمایش تصویر">
      <label for="imageInput" class="file-label">فایل را انتخاب کنید</label>
      <input type="file" name="image" id="imageInput" accept="image/*" required>
      <button id="uploadBtn" class="upload-btn">آپلود</button>
      <div id="imageLink">
        <p class="text-sm text-gray-600 mb-2">لینک تصویر:</p>
        <input type="text" id="linkOutput" class="w-full p-2 border rounded-lg bg-gray-100" readonly>
        <button id="copyBtn">کپی لینک</button>
      </div>
    </div>
    <div class="footer">
      <p>ساخته شده با گیت‌هاب <a href="https://github.com/Argh94/image-host" target="_blank">Argh94</a></p>
    </div>
    <script>
      const loginCard = document.getElementById('loginCard');
      const uploadCard = document.getElementById('uploadCard');
      const loginBtn = document.getElementById('loginBtn');
      const passwordInput = document.getElementById('passwordInput');
      const errorMessage = document.getElementById('errorMessage');

      const uploadBtn = document.getElementById('uploadBtn');
      const imageInput = document.getElementById('imageInput');
      const previewImage = document.getElementById('previewImage');
      const imageLinkDiv = document.getElementById('imageLink');
      const linkOutput = document.getElementById('linkOutput');
      const copyBtn = document.getElementById('copyBtn');

      // اسلایدر پس‌زمینه با تصاویر جدید
      const backgrounds = [
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // منظره کوه
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // دریاچه و قایق
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // غروب خورشید
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // کوهستان
        'https://images.unsplash.com/photo-1542224560-1c4b2b6a4f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // جنگل مه‌آلود
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // ساحل آرام
        'https://images.unsplash.com/photo-1531306728370-e7352ffd2d46?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // آسمان پرستاره
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'  // کوهستان برفی
      ];
      let currentBgIndex = 0;

      function changeBackground() {
        document.body.style.backgroundImage = "url('" + backgrounds[currentBgIndex] + "')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
        currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
      }
      changeBackground();
      setInterval(changeBackground, 5000);

      // مدیریت ورود
      loginBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        const formData = new FormData();
        formData.append('password', password);
        try {
          const response = await fetch('/login', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.success) {
            loginCard.style.display = 'none';
            uploadCard.style.display = 'block';
          } else {
            errorMessage.style.display = 'block';
            setTimeout(() => errorMessage.style.display = 'none', 3000);
          }
        } catch (error) {
          alert('خطا در ارتباط با سرور: ' + error.message);
        }
      });

      // پیش‌نمایش تصویر
      imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });

      uploadBtn.addEventListener('click', async () => {
        if (!imageInput.files[0]) {
          alert('لطفاً یک تصویر انتخاب کنید!');
          return;
        }
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        try {
          const response = await fetch('/upload', { method: 'POST', body: formData });
          const data = await response.json();
          if (data && data.imageUrl) {
            imageLinkDiv.style.display = 'block';
            linkOutput.value = data.imageUrl;
            previewImage.style.display = 'none';
          } else {
            alert('خطا در آپلود: ' + (data.error || 'پاسخ سرور نامعتبر است'));
          }
        } catch (error) {
          alert('خطا در ارتباط با سرور: ' + error.message);
        }
      });

      copyBtn.addEventListener('click', () => {
        linkOutput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'کپی شد!';
        setTimeout(() => copyBtn.textContent = 'کپی لینک', 2000);
      });
    </script>
  </body>
  </html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleLoginRequest(request) {
  const PASSWORD = 'your-secret-password'; // اینجا رمز عبور دلخواهت رو وارد کن
  const formData = await request.formData();
  const password = formData.get('password');
  if (password === PASSWORD) {
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ success: false }), { headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleUploadRequest(request, DOMAIN) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image) {
      throw new Error('تصویری انتخاب نشده');
    }
    if (image.size > 10 * 1024 * 1024) {
      throw new Error('حداکثر اندازه 10 مگابایت');
    }

    const timestamp = Date.now();
    const extension = image.name.split('.').pop();
    const key = timestamp + '.' + extension;
    const imageUrl = DOMAIN + '/' + key;

    await IMAGE_KV.put(key, await image.arrayBuffer(), { metadata: { contentType: image.type } });

    return new Response(JSON.stringify({ imageUrl: imageUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleImageRequest(request) {
  const { pathname } = new URL(request.url);
  const key = pathname.slice(1);
  const image = await IMAGE_KV.get(key, { type: 'arrayBuffer' });
  if (!image) {
    return new Response('تصویر یافت نشد', { status: 404 });
  }

  const metadata = (await IMAGE_KV.getWithMetadata(key)).metadata;
  return new Response(image, { headers: { 'Content-Type': metadata.contentType || 'image/jpeg' } });
}
