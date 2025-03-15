addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  const DOMAIN = 'yourdomain.workers.dev'; // این رو بعداً توی Cloudflare تغییر بده

  switch (pathname) {
    case '/':
      return await handleRootRequest();
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
    <title>میزبانی تصاویر</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/vazir-font@27.2.0/dist/font-face.css" rel="stylesheet">
    <style>
      body { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; font-family: 'Vazir', sans-serif; }
      .card { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 2rem; width: 90%; max-width: 500px; }
      .upload-btn { background: #4f46e5; transition: background 0.3s; }
      .upload-btn:hover { background: #4338ca; }
      #imageLink { display: none; margin-top: 1rem; }
      #copyBtn { background: #10b981; }
      #copyBtn:hover { background: #059669; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="text-3xl font-bold text-center mb-6 text-gray-800">آپلود تصاویر</h1>
      <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
        <div class="mb-4">
          <input type="file" name="image" id="imageInput" accept="image/*" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
        </div>
        <button type="submit" class="upload-btn w-full text-white py-2 rounded-lg">آپلود</button>
      </form>
      <div id="imageLink">
        <label class="block text-sm text-gray-600 mb-1">لینک تصویر:</label>
        <input type="text" id="linkOutput" class="w-full p-2 border rounded-lg bg-gray-100" readonly>
        <button id="copyBtn" class="w-full mt-2 text-white py-2 rounded-lg">کپی لینک</button>
      </div>
      <p class="text-center text-sm text-gray-500 mt-4">ساخته شده با ❤️ | <a href="https://github.com/[YourUsername]/image-host" class="text-indigo-500">گیت‌هاب</a></p>
    </div>
    <script>
      const form = document.getElementById('uploadForm');
      const imageLinkDiv = document.getElementById('imageLink');
      const linkOutput = document.getElementById('linkOutput');
      const copyBtn = document.getElementById('copyBtn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.url) {
          imageLinkDiv.style.display = 'block';
          linkOutput.value = data.url;
        } else {
          alert('خطا در آپلود: ' + (data.error || 'مشکل ناشناخته'));
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

async function handleUploadRequest(request, DOMAIN) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image) throw new Error('تصویری انتخاب نشده');
    if (image.size > 10 * 1024 * 1024) throw new Error('حداکثر اندازه 10 مگابایت');

    const timestamp = Date.now();
    const extension = image.name.split('.').pop();
    const key = `${timestamp}.${extension}`;
    const imageUrl = `https://${DOMAIN}/${key}`;

    // ذخیره توی KV (با متغیر محیطی IMAGE_KV که بعداً وصل می‌کنیم)
    await IMAGE_KV.put(key, await image.arrayBuffer(), { metadata: { contentType: image.type } });

    return new Response(JSON.stringify({ url: imageUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleImageRequest(request) {
  const { pathname } = new URL(request.url);
  const key = pathname.slice(1);
  const image = await IMAGE_KV.get(key, { type: 'arrayBuffer' });
  if (!image) return new Response('تصویر یافت نشد', { status: 404 });

  const metadata = (await IMAGE_KV.getWithMetadata(key)).metadata;
  return new Response(image, { headers: { 'Content-Type': metadata.contentType || 'image/jpeg' } });
}
