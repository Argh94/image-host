# میزبانی تصاویر
یه سرویس ساده برای آپلود و اشتراک تصاویر با Cloudflare Workers و KV.

## نصب
1. توی Cloudflare یه Worker بساز و کد `worker.js` رو از این مخزن کپی کن.
2. یه KV Namespace به اسم `IMAGE_KV` بساز و به Worker وصل کن.
3. توی کد، `DOMAIN` رو به دامنه Worker‌ات تغییر بده.
4. Deploy کن و تست کن!

## استفاده
به آدرس Worker‌ات برو (مثلاً https://yourdomain.workers.dev) و یه تصویر آپلود کن!

## صفحه گیت‌هاب
[اینجا](https://[YourUsername].github.io/image-host)
