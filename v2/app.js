(() => {
  const categoryLabels = {'فضای داخلی':'استایل کابین','مراقبت خودرو':'مراقبت خودرو','اکسسوری خودرو':'اکسسوری خودرو'};
  const productCard = (product) => `<a class="product-card" data-slug="${product.slug}" data-category="${product.category_slug}" href="product.html?slug=${encodeURIComponent(product.slug)}"><div class="product-art"><img src="${product.images[0].src}" alt="${product.images[0].alt || product.name}" loading="lazy" decoding="async"></div><div class="product-info"><div><h3>${product.name}</h3><p>${categoryLabels[product.category] || product.category}</p></div><span class="card-arrow" aria-hidden="true">↙</span></div></a>`;
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    const close = () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','باز کردن منو'); };
    menuButton.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open',open); menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'بستن منو':'باز کردن منو'); });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  fetch('data/products.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('product data unavailable');return r.json();}).then(products=>{
    const real = products.filter(p=>p.images?.length);
    document.querySelectorAll('[data-products-grid]').forEach(grid=>{
      const featured = grid.classList.contains('product-grid') ? real.slice(0,4) : real;
      grid.innerHTML = featured.map(productCard).join('');
    });
    const filters = [...document.querySelectorAll('[data-filter]')];
    const apply = value => { document.querySelectorAll('.catalog-grid .product-card').forEach(card=>{card.hidden=value!=='all'&&card.dataset.category!==value;}); filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===value))); };
    filters.forEach(button=>button.addEventListener('click',()=>apply(button.dataset.filter)));
    const initial = new URLSearchParams(location.search).get('category');
    if(filters.length)apply(['interior','car-care'].includes(initial)?initial:'all');
    const root=document.querySelector('#product-root');
    if(!root)return;
    const slug=new URLSearchParams(location.search).get('slug');
    const product=real.find(item=>item.slug===slug);
    if(!product){root.dataset.state='not-found';root.querySelector('.product-layout').hidden=true;root.querySelector('[data-not-found]').hidden=false;return;}
    root.dataset.state='ready';document.title=`${product.name} | Girl Car Accessory`;
    root.querySelectorAll('[data-name]').forEach(el=>el.textContent=product.name);
    root.querySelectorAll('[data-category]').forEach(el=>el.textContent=categoryLabels[product.category]||product.category);
    root.querySelector('[data-short]').textContent=product.short_description;
    root.querySelector('[data-description]').textContent=product.description;
    root.querySelector('[data-source]').href=product.source_permalink;
    root.querySelector('[data-published]').textContent=new Intl.DateTimeFormat('fa-IR',{dateStyle:'long',timeZone:'Asia/Tehran'}).format(new Date(product.publication_timestamp_utc));
    root.querySelector('[data-published]').dateTime=product.publication_timestamp_utc;
    root.querySelector('[data-attributes]').innerHTML=product.verified_attributes.map(item=>`<li>${item}</li>`).join('');
    const missing=Array.isArray(product.missing_information)?product.missing_information:String(product.missing_information||'').split(/[;؛]/).map(x=>x.trim()).filter(Boolean);
    const relevant=missing.filter(x=>!/(تصویر|عکس).*محلی|قیمت|موجودی/.test(x));
    relevant.unshift('قیمت و موجودی توسط مالک وارد نشده است');
    root.querySelector('[data-missing]').innerHTML=[...new Set(relevant)].map(item=>`<li>${item}</li>`).join('');
    const main=root.querySelector('[data-gallery-main]');
    const show=image=>{main.replaceChildren();const img=document.createElement('img');img.src=image.src;img.alt=image.alt||product.image_alt;main.append(img);};
    show(product.images[0]);
    root.querySelector('[data-gallery-thumbs]').innerHTML=product.images.map((image,index)=>`<button type="button" data-image-index="${index}" aria-label="نمایش تصویر ${index+1}" aria-pressed="${index===0}"><img src="${image.src}" alt=""></button>`).join('');
    root.querySelectorAll('[data-image-index]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.imageIndex);show(product.images[i]);root.querySelectorAll('[data-image-index]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
  }).catch(error=>{document.documentElement.dataset.productDataError='true';console.error(error);});
})();
