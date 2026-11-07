document.addEventListener("DOMContentLoaded", () => {
        
    // ================= БАЗА ДАННЫХ (ФРОНТЕНД) =================
    const productsDB = {
        '1': { title: 'Платье мини со съемной меховой оторочкой', price: 9999, color: 'Молочный', image: '/img/платье.png', rating: 5 },
        '2': { title: 'Костюм брюки и кардиган с шерстью', price: 10999, color: 'Коричневый', image: '/img/костюм.png', rating: 4 },
        '3': { title: 'Блузка из вискозы', price: 4999, color: 'Молочный', image: '/img/блузка.png', rating: 4 },
        '4': { title: 'Платье-жакет со съемным меховым воротником', price: 13999, color: 'Коричневый', image: '/img/жакет.png', rating: 5 },
        '5': { title: 'Широкие брюки с вискозой', price: 5999, color: 'Молочный', image: '/img/брюки.png', rating: 4 },
        '6': { title: 'Трикотажная юбка мини из хлопка', price: 3999, color: 'Серый', image: '/img/юбка.png', rating: 3 },
        '7': { title: 'Комбинезон с ремнем женский', price: 12999, color: 'Черный', image: '/img/комбенизон.png', rating: 5 },
        '8': { title: 'Боди с длинными рукавами', price: 3599, color: 'Молочный', image: '/img/боди.png', rating: 4 },
        '9': { title: 'Топ-корсет с вискозой', price: 7599, color: 'Серый', image: '/img/топ.png', rating: 5 }
    };

    // Корзина остается в localStorage, а вот Избранное - в БД
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    const saveCart = (cart) => localStorage.setItem('cart', JSON.stringify(cart));

    // ================= ИЗБРАННОЕ (БД) =================
    const initHearts = async () => {
        const hearts = document.querySelectorAll('.heart, .fav-btn');
        if (hearts.length === 0) return;

        let serverFavs = [];
        try {
            const res = await fetch('/api/favorites');
            if (res.ok) serverFavs = await res.json();
        } catch (e) { console.error(e); }
        
        const favIds = serverFavs.map(f => f.id.toString());

        hearts.forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (id && favIds.includes(id)) btn.classList.add('active');

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (!id) return;

                try {
                    const response = await fetch('/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: parseInt(id) })
                    });

                    if (response.status === 401) {
                        alert('Войдите в аккаунт, чтобы добавлять в избранное!');
                        window.location.href = 'auth.html';
                        return;
                    }

                    const data = await response.json();
                    if (data.status === 'added') {
                        this.classList.add('active');
                    } else {
                        this.classList.remove('active');
                    }
                    if (document.getElementById('favorites-grid')) renderFavoritesPage();
                } catch (err) {
                    console.error(err);
                }
            });
        });
    };

    // ================= КАТАЛОГ =================
    const initCatalog = () => {
        const grid = document.querySelector('.products-grid');
        if (!grid || document.getElementById('favorites-grid')) return;

        let products = Array.from(document.querySelectorAll('.product-card'));
        
        const filterCategory = document.getElementById('filter-category');
        const filterColor = document.getElementById('filter-color');
        const priceFrom = document.querySelector('.price-from');
        const priceTo = document.querySelector('.price-to');
        const resetBtn = document.querySelector('.reset-btn');

        const applyFilters = () => {
            const catValue = filterCategory ? filterCategory.value : '';
            const colorValue = filterColor ? filterColor.value : '';
            const minPrice = parseInt(priceFrom?.value.replace(/\D/g, '')) || 0;
            const maxPrice = parseInt(priceTo?.value.replace(/\D/g, '')) || Infinity;

            const categoryKeywords = {
                'Верхняя одежда': ['жакет', 'пальто', 'куртка'],
                'Платья': ['платье'],
                'Костюмы': ['костюм'],
                'Блузки': ['блузка', 'рубашка'],
                'Брюки': ['брюки'],
                'Юбки': ['юбка'],
                'Комбинезоны': ['комбинезон'],
                'Корсеты': ['корсет'],
                'Боди': ['боди']
            };

            products.forEach(product => {
                const title = product.querySelector('.product-title').textContent.toLowerCase();
                const color = product.querySelector('.product-color').textContent.trim();
                const price = parseInt(product.dataset.price);

                let show = true;
                if (catValue) {
                    const keywords = categoryKeywords[catValue] || [catValue.toLowerCase()];
                    if (!keywords.some(kw => title.includes(kw))) show = false;
                }
                if (colorValue && color !== colorValue) show = false;
                if (price < minPrice || price > maxPrice) show = false;

                product.style.display = show ? 'flex' : 'none';
            });
        };

        if (filterCategory) filterCategory.addEventListener('change', applyFilters);
        if (filterColor) filterColor.addEventListener('change', applyFilters);
        if (priceFrom) priceFrom.addEventListener('input', applyFilters);
        if (priceTo) priceTo.addEventListener('input', applyFilters);

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (filterCategory) filterCategory.value = '';
                if (filterColor) filterColor.value = '';
                if (priceFrom) priceFrom.value = '';
                if (priceTo) priceTo.value = '';
                applyFilters();
            });
        }

        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('cat');
        if (categoryParam && filterCategory) {
            filterCategory.value = categoryParam;
        }
        applyFilters();

        document.querySelectorAll('.sorting-box label').forEach(label => {
            label.addEventListener('click', function() {
                document.querySelectorAll('.sorting-box label').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                const sortType = this.textContent.trim();

                if (sortType.includes('Цена по возрастанию')) products.sort((a, b) => a.dataset.price - b.dataset.price);
                else if (sortType.includes('Цена по убыванию')) products.sort((a, b) => b.dataset.price - a.dataset.price);
                else if (sortType.includes('По рейтингу')) products.sort((a, b) => b.dataset.rating - a.dataset.rating);
                else products.sort((a, b) => a.dataset.id - b.dataset.id);

                grid.innerHTML = '';
                products.forEach(p => grid.appendChild(p));
                applyFilters();
            });
        });
    };

    // ================= СТРАНИЦА ИЗБРАННОГО (БД) =================
    const renderFavoritesPage = async () => {
        const grid = document.getElementById('favorites-grid');
        if (!grid) return;
        
        let serverFavs = [];
        try {
            const res = await fetch('/api/favorites');
            if (res.ok) serverFavs = await res.json();
        } catch (e) { console.error(e); }

        grid.innerHTML = '';

        if (serverFavs.length === 0) {
            grid.innerHTML = `<p style="font-family: 'Cormorant Garamond'; font-size: 20px; color: #888; grid-column: 1 / -1;">В вашем избранном пока пусто.</p>`;
            return;
        }

        serverFavs.forEach(p => {
            grid.innerHTML += `
                <div class="product-card">
                    <div class="image-wrapper">
                        <a href="product.html?id=${p.id}"><img src="${p.image_url}" alt="${p.title}"></a>
                        <button class="fav-btn active" data-id="${p.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
                    </div>
                    <div class="product-info">
                        <a href="product.html?id=${p.id}" style="text-decoration: none; color: inherit;">
                            <div class="product-title">${p.title}</div>
                            <div class="product-price">${p.price.toLocaleString('ru-RU')} ₽</div>
                            <div class="product-color">${p.color}</div>
                        </a>
                    </div>
                </div>
            `;
        });
        initHearts();
    };

    // ================= СТРАНИЦА ТОВАРА =================
    const initProductPage = () => {
        const addBtn = document.getElementById('add-to-cart-btn');
        if (!addBtn) return;

        const id = new URLSearchParams(window.location.search).get('id') || '1';
        const p = productsDB[id];

        if (p) {
            document.getElementById('product-breadcrumb').textContent = p.title;
            document.getElementById('product-img').src = p.image;
            document.getElementById('product-title').textContent = p.title;
            document.getElementById('product-price').textContent = p.price.toLocaleString('ru-RU') + ' ₽';
            document.getElementById('product-color').textContent = 'Цвет: ' + p.color.toLowerCase();

            let selectedSize = 'S';
            document.querySelectorAll('.size-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    selectedSize = this.textContent;
                    document.getElementById('selected-size-text').textContent = selectedSize;
                });
            });

            addBtn.addEventListener('click', () => {
                let cart = getCart();
                const existingItem = cart.find(item => item.id === id && item.size === selectedSize);
                if (existingItem) existingItem.quantity += 1;
                else cart.push({ id, title: p.title, price: p.price, color: p.color, image: p.image, size: selectedSize, quantity: 1 });
                
                saveCart(cart);
                addBtn.textContent = "ДОБАВЛЕНО ✓";
                setTimeout(() => addBtn.textContent = "В КОРЗИНУ", 1500);
            });
        }
    };

    // ================= КОРЗИНА =================
    const initCartPage = () => {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        const cartCount = document.getElementById('cart-count');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotal = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (checkoutBtn) {
             checkoutBtn.addEventListener('click', () => {
                 window.location.href = "checkout.html";
             });
        }

        const renderCart = () => {
            const cart = getCart();
            container.innerHTML = '';

            if (cart.length === 0) {
                container.innerHTML = `<p style="font-family: 'Cormorant Garamond'; font-size: 20px; color: #888;">Ваша корзина пока пуста.</p>`;
                if (cartCount) cartCount.textContent = '0'; 
                if (cartSubtotal) cartSubtotal.textContent = '0 ₽'; 
                if (cartTotal) cartTotal.textContent = '0 ₽';
                return;
            }

            let totalItems = 0, totalPrice = 0;
            cart.forEach((item, index) => {
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.title}</div>
                            <div class="cart-item-params">${item.color} · Размер ${item.size}</div>
                            <div class="cart-item-bottom">
                                <div class="quantity-control">
                                    <button class="minus" data-index="${index}">−</button>
                                    <span>${item.quantity}</span>
                                    <button class="plus" data-index="${index}">+</button>
                                </div>
                                <button class="remove-btn" data-index="${index}">Удалить</button>
                            </div>
                        </div>
                        <div class="cart-item-price">${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
                    </div>
                `;
            });
            if (cartCount) cartCount.textContent = totalItems;
            if (cartSubtotal) cartSubtotal.textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';
            if (cartTotal) cartTotal.textContent = (totalPrice + 500).toLocaleString('ru-RU') + ' ₽';
        };

        container.addEventListener('click', (e) => {
            let cart = getCart();
            const index = e.target.dataset.index;
            if (e.target.classList.contains('plus')) { cart[index].quantity += 1; saveCart(cart); renderCart(); }
            else if (e.target.classList.contains('minus') && cart[index].quantity > 1) { cart[index].quantity -= 1; saveCart(cart); renderCart(); }
            else if (e.target.classList.contains('remove-btn')) { cart.splice(index, 1); saveCart(cart); renderCart(); }
        });

        renderCart();
    };

    // ================= ОФОРМЛЕНИЕ ЗАКАЗА (БД) =================
    const initCheckoutPage = () => {
        const itemsContainer = document.getElementById('checkout-items');
        if (!itemsContainer) return;

        const cart = getCart();
        let totalItems = 0;
        let totalPrice = 0;

        if (cart.length === 0) {
            itemsContainer.innerHTML = "<p>Корзина пуста</p>";
        } else {
            cart.forEach(item => {
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
                itemsContainer.innerHTML += `
                    <div class="summary-item">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="item-info">
                            <div class="item-name">${item.title}</div>
                            <div class="item-params">${item.color} · Размер ${item.size} · ${item.quantity} шт.</div>
                            <div class="item-price">${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
                        </div>
                    </div>
                `;
            });
        }

        const countEl = document.getElementById('chk-count');
        const priceEl = document.getElementById('chk-price');
        const totalEl = document.getElementById('chk-total');

        if (countEl) countEl.textContent = totalItems;
        if (priceEl) priceEl.textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';
        if (totalEl) totalEl.textContent = (totalPrice + 500).toLocaleString('ru-RU') + ' ₽';

        const submitBtn = document.getElementById('submit-order-btn');
        const form = document.getElementById('checkout-form');
        const cardModal = document.getElementById('cardModal');
        const closeCardModal = document.getElementById('closeCardModal');
        const payCardBtn = document.getElementById('pay-card-btn');

        if (submitBtn && form) {
            submitBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    const response = await fetch('/api/me');
                    if (!response.ok) {
                        alert("Для оформления заказа необходимо войти в аккаунт!");
                        window.location.href = "auth.html"; 
                        return;
                    }
                } catch (err) {
                    console.error(err);
                }

                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                if (cart.length === 0) {
                    alert("Ваша корзина пуста.");
                    return;
                }

                const selectedPayment = document.querySelector('input[name="payment"]:checked').nextElementSibling.nextElementSibling.textContent; 
                
                if (selectedPayment.includes('Банковская карта')) {
                    cardModal.classList.add('active');
                } else {
                    completeOrder();
                }
            });
        }

        if (closeCardModal) {
            closeCardModal.addEventListener('click', () => cardModal.classList.remove('active'));
        }

        if (payCardBtn) {
            payCardBtn.addEventListener('click', () => {
                const cardForm = document.getElementById('card-form');
                if (!cardForm.checkValidity()) {
                    cardForm.reportValidity();
                    return;
                }
                cardModal.classList.remove('active');
                completeOrder();
            });
        }

        async function completeOrder() {
            const address = document.getElementById('chk-address').value;
            const phone = document.getElementById('chk-phone').value;
            const finalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 500;

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart,
                        totalPrice: finalPrice,
                        address: address,
                        phone: phone
                    })
                });

                if (response.ok) {
                    localStorage.removeItem('cart');
                    alert("Спасибо! Заказ сохранен в базе данных.");
                    window.location.href = "index.html";
                } else {
                    alert("Ошибка при оформлении. Войдите в аккаунт.");
                }
            } catch (err) {
                alert("Ошибка сервера.");
            }
        }
    };

    // ================= АВТОРИЗАЦИЯ И ПРОФИЛЬ =================
    const initProfileAndAuth = () => {
        const authForm = document.getElementById('auth-form');
        
        if (authForm) {
            let isLogin = true; 
            const title = document.getElementById('auth-title');
            const subtitle = document.getElementById('auth-subtitle');
            const nameGroup = document.getElementById('name-group');
            const btnAuth = document.getElementById('btn-auth');
            const toggleText = document.getElementById('toggle-text');
            const toggleBtn = document.getElementById('toggle-btn');
            const breadcrumbPage = document.getElementById('breadcrumb-page');
            const nameInput = document.getElementById('auth-name');

            if (nameInput) nameInput.required = false;

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    isLogin = !isLogin;
                    if (isLogin) {
                        title.textContent = "ВХОД";
                        subtitle.innerHTML = "Рады видеть вас снова.<br>Войдите в свой аккаунт ÉLAN.";
                        btnAuth.textContent = "ВОЙТИ";
                        nameGroup.style.display = "none";
                        if (nameInput) nameInput.required = false;
                        toggleText.textContent = "Ещё нет аккаунта?";
                        toggleBtn.textContent = "Зарегистрироваться";
                        breadcrumbPage.textContent = "Вход";
                        authForm.action = "/api/login"; 
                    } else {
                        title.textContent = "РЕГИСТРАЦИЯ";
                        subtitle.innerHTML = "Создайте аккаунт ÉLAN,<br>чтобы сохранять покупки и управлять профилем.";
                        btnAuth.textContent = "ЗАРЕГИСТРИРОВАТЬСЯ";
                        nameGroup.style.display = "block";
                        if (nameInput) nameInput.required = true;
                        toggleText.textContent = "Уже есть аккаунт?";
                        toggleBtn.textContent = "Войти";
                        breadcrumbPage.textContent = "Регистрация";
                        authForm.action = "/api/register"; 
                    }
                });
            }
        }

        const profileTitle = document.getElementById('profile-title');
        if (profileTitle) {
            fetch('/api/me')
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Гость');
                })
                .then(user => {
                    profileTitle.textContent = "ЛИЧНЫЙ КАБИНЕТ";
                    const sub = document.getElementById('profile-subtitle');
                    if (sub) sub.textContent = user.login;
                    const txt = document.getElementById('profile-text');
                    if (txt) txt.textContent = `Вы вошли как ${user.email}.`;
                    
                    const link = document.getElementById('profile-link');
                    if (link) {
                        link.textContent = "Выйти из аккаунта →";
                        link.href = "/api/logout"; 
                    }

                    const loginText = document.querySelector('.profile-login-text');
                    const loginBtn = document.getElementById('btn-login');
                    if (loginBtn && loginText) {
                        loginText.textContent = "Сессия активна. Все данные сохранены.";
                        loginBtn.textContent = "ВЫЙТИ ИЗ АККАУНТА";
                        loginBtn.href = "/api/logout";
                    }
                })
                .catch(() => {});
        }

        // Счетчики для профиля
        const cartCountEl = document.getElementById('profile-cart-count');
        const favCountEl = document.getElementById('profile-fav-count');
        if (cartCountEl) {
            let count = 0; getCart().forEach(i => count += i.quantity);
            cartCountEl.textContent = count;
        }
        if (favCountEl) {
            fetch('/api/favorites')
                .then(res => res.ok ? res.json() : [])
                .then(favs => favCountEl.textContent = favs.length)
                .catch(() => favCountEl.textContent = '0');
        }
    };
    
    // ================= МОДАЛЬНОЕ ОКНО =================
    const initModal = () => {
        const openBtn = document.getElementById("openAboutBtn");
        const modal = document.getElementById("aboutModal");
        if (openBtn && modal) {
            openBtn.addEventListener('click', (e) => { e.preventDefault(); modal.classList.add("active"); });
            document.getElementById("closeModalBtn").addEventListener('click', () => modal.classList.remove("active"));
            document.getElementById("closeModalFooterBtn").addEventListener('click', () => modal.classList.remove("active"));
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove("active"); });
        }
    };

    // ================= БУРГЕР-ФИЛЬТРЫ =================
    const initFiltersToggle = () => {
        const filtersToggle = document.getElementById('filtersToggle');
        const sidebar = document.querySelector('.sidebar');

        if (filtersToggle && sidebar) {
            filtersToggle.addEventListener('click', function () {
                const isOpen = sidebar.classList.toggle('open');
                filtersToggle.classList.toggle('active', isOpen);

                const label = filtersToggle.querySelector('span:last-child');
                if (label) {
                    label.textContent = isOpen ? 'СКРЫТЬ ФИЛЬТРЫ' : 'ФИЛЬТРЫ';
                }
            });
        }
    };

    // ================= ОБРАТНАЯ СВЯЗЬ =================
    const initContactsForm = () => {
        const sendBtn = document.getElementById('send-contact-btn');
        if (!sendBtn) return;

        sendBtn.addEventListener('click', async () => {
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            if (!name || !email || !message) {
                alert("Пожалуйста, заполните все поля.");
                return;
            }

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });

                if (response.status === 401) {
                    alert("Войдите в аккаунт, чтобы отправить сообщение!");
                    window.location.href = "auth.html";
                } else if (response.ok) {
                    alert("Спасибо! Сообщение сохранено в базе.");
                    document.getElementById('contact-name').value = '';
                    document.getElementById('contact-email').value = '';
                    document.getElementById('contact-message').value = '';
                }
            } catch (err) {
                alert("Ошибка сервера при отправке сообщения.");
            }
        });
    };

    // ================= ЗАПУСК =================
    initHearts();
    initCatalog();
    renderFavoritesPage();
    initProductPage();
    initCartPage();
    initCheckoutPage();
    initProfileAndAuth();
    initContactsForm();
    initModal();
    initFiltersToggle();
});