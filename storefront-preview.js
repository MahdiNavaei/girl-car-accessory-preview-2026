(() => {
  const productsUrl = 'data/products.json';
  const categoryNames = {
    'فضای داخلی': 'فضای داخلی',
    'مراقبت خودرو': 'مراقبت خودرو',
    'اکسسوری خودرو': 'اکسسوری و تزئین خودرو',
  };

  const getLocalProducts = async () => {
    const response = await fetch(productsUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`products.json returned ${response.status}`);
    return response.json();
  };

  const updateCards = (products) => {
    const cards = [...document.querySelectorAll('.product-grid .product-card, .catalog-grid .product-card')];
    cards.forEach((card) => {
      const slug = card.dataset.productSlug || new URL(card.getAttribute('href'), location.href).searchParams.get('slug');
      const product = products.find((item) => item.slug === slug);
      if (!product || !product.images?.length) {
        card.remove();
        return;
      }
      card.href = `product.html?slug=${encodeURIComponent(product.slug)}`;
      card.dataset.productSlug = product.slug;
      card.dataset.category = product.category_slug;
      const title = card.querySelector('h3');
      const subtitle = card.querySelector('.product-info p');
      if (title) title.textContent = product.name;
      if (subtitle) subtitle.textContent = `${categoryNames[product.category] || product.category} · خلاصه کپشن منبع`;
      const art = card.querySelector('.product-art');
      if (art) {
        art.replaceChildren();
        const image = document.createElement('img');
        image.src = product.images[0].src;
        image.alt = product.images[0].alt || product.image_alt;
        image.loading = 'lazy';
        image.decoding = 'async';
        art.append(image);
      }
    });

    const productsWithImages = products.filter((product) => product.images?.length);
    const count = document.querySelector('[data-catalog-count]');
    if (count) count.textContent = `${productsWithImages.length} محصول دارای عکس اصلی · بدون قیمت‌گذاری`;

    const filterButtons = [...document.querySelectorAll('[data-category-filter]')];
    const applyFilter = (filter) => {
      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.hidden = !matches;
      });
      filterButtons.forEach((button) => {
        const selected = button.dataset.categoryFilter === filter;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('selected', selected);
      });
    };
    filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.categoryFilter)));

    const query = new URLSearchParams(location.search).get('category');
    const initialFilter = ['interior', 'car-care'].includes(query) ? query : 'all';
    applyFilter(initialFilter);
  };

  const updateProductPage = (products) => {
    const root = document.querySelector('#product-root');
    if (!root) return;
    const slug = new URLSearchParams(location.search).get('slug');
    const product = products.find((item) => item.slug === slug);
    if (!product) {
      root.dataset.state = 'not-found';
      root.querySelector('.product-detail-grid').hidden = true;
      root.querySelector('#route-error').hidden = false;
      return;
    }

    root.dataset.state = 'ready';
    document.title = `${product.name} | Girl Car Accessory`;
    root.querySelectorAll('[data-name]').forEach((node) => { node.textContent = product.name; });
    root.querySelectorAll('[data-category]').forEach((node) => { node.textContent = categoryNames[product.category] || product.category; });
    root.querySelector('[data-short]').textContent = product.short_description;
    root.querySelector('[data-description]').textContent = product.description;
    const source = root.querySelector('[data-source]');
    source.href = product.source_permalink;
    source.textContent = `پست اصلی اینستاگرام · ${product.source_permalink.split('/').filter(Boolean).pop()} ↗`;
    const published = root.querySelector('[data-published]');
    published.dateTime = product.publication_timestamp_utc;
    published.textContent = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long', timeZone: 'Asia/Tehran' }).format(new Date(product.publication_timestamp_utc));

    const attributes = root.querySelector('[data-attributes]');
    attributes.replaceChildren(...product.verified_attributes.map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
    const rawMissing = Array.isArray(product.missing_information)
      ? product.missing_information
      : String(product.missing_information || '').split(/[;؛]/).map((item) => item.trim()).filter(Boolean);
    const missing = rawMissing.filter((item) => !/تصویر.*محلی|تصویر محلی/.test(item));
    if (product.regular_price === null) missing.unshift('قیمت عادی — هنوز وارد نشده');
    if (product.sale_price === null) missing.unshift('قیمت فروش — هنوز وارد نشده');
    if (product.stock_quantity === null) missing.unshift('موجودی — هنوز وارد نشده');
    if (!product.images?.length) missing.unshift('تصویر اصلی محلی — هنوز دریافت یا تأیید نشده');
    root.querySelector('[data-missing]').replaceChildren(...[...new Set(missing)].map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));

    if (product.images?.length) {
      const gallery = root.querySelector('#product-gallery-main');
      gallery.replaceChildren();
      const img = document.createElement('img');
      img.src = product.images[0].src;
      img.alt = product.images[0].alt || product.image_alt;
      gallery.append(img);
      const thumbs = root.querySelector('#product-thumbnails');
      thumbs.replaceChildren(...product.images.map((image, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `نمایش تصویر ${index + 1}`);
        const thumb = document.createElement('img');
        thumb.src = image.src;
        thumb.alt = '';
        button.append(thumb);
        button.addEventListener('click', () => { img.src = image.src; img.alt = image.alt || product.image_alt; });
        return button;
      }));
    }
  };

  getLocalProducts().then((products) => {
    updateCards(products);
    updateProductPage(products);
  }).catch((error) => {
    document.documentElement.dataset.productDataError = 'true';
    const root = document.querySelector('#product-root');
    if (root) {
      root.dataset.state = 'error';
      root.querySelector('#route-error').hidden = false;
    }
    console.error('Local product data could not load:', error.message);
  });
})();
