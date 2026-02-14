let currentUser = null;
let basket = [];

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
    }
});

function updateUserUI() {
    const loginButton = document.getElementById('test');
    if (currentUser) {
        loginButton.innerHTML = `<i class="fas fa-user"></i> ${currentUser.login}`;
        loginButton.onclick = function() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserUI();
        };
    } else {
        loginButton.innerHTML = `<i class="fas fa-user"></i> Войти`;
        loginButton.onclick = Openn;
    }
}

function Openn() {
    const modal = document.getElementById('loginDropdown');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
        document.querySelector(".header").style.filter = 'none';
        document.querySelector(".main-container").style.filter = 'none';
    } else {
        modal.style.display = 'block';
        document.querySelector(".header").style.filter = 'blur(10px)';
        document.querySelector(".main-container").style.filter = 'blur(10px)';
        document.body.style.overflow = 'hidden';
    }
}

function closeform() {
    document.getElementById('loginDropdown').style.display = 'none';
    document.querySelector(".header").style.filter = 'none';
    document.querySelector(".main-container").style.filter = 'none';
    document.body.style.overflow = 'auto';
}

function Basket() {
    const modal = document.getElementById('basketModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
        renderBasketItems();
    }
}

function closebasket() {
    document.getElementById('basketModal').style.display = 'none';
}

function Category(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function proverka(event) {
    event.preventDefault();
    
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!login || !password) {
        alert('Заполните логин и пароль');
        return;
    }
    
    console.log('Отправка запроса на вход:', {login: login});
    
    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({login: login, password: password})
    })
    .then(response => {
        console.log('Статус ответа входа:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Ответ сервера при входе:', data);
        if (data.user_id) {
            alert('Вход выполнен! ID: ' + data.user_id);
            currentUser = {
                id: data.user_id,
                login: data.login
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            closeform();
        } else {
            alert(data.message || 'Ошибка входа');
        }
    })
    .catch(error => {
        console.error('Ошибка при входе:', error);
        alert('Ошибка соединения с сервером');
    });
}

function reg() {
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!login || !password) {
        alert('Заполните все поля');
        return;
    }
    
    console.log('Отправка запроса на регистрацию:', {login: login});
    
    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({login: login, password: password})
    })
    .then(response => {
        console.log('Статус ответа регистрации:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Ответ сервера при регистрации:', data);
        if (data.user_id) {
            alert('Регистрация успешна! ID: ' + data.user_id);
            currentUser = {
                id: data.user_id,
                login: login
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            closeform();
        } else {
            alert(data.message || 'Ошибка регистрации');
        }
    })
    .catch(error => {
        console.error('Ошибка при регистрации:', error);
        alert('Ошибка соединения с сервером');
    });
}

function addToBasket(name, price, image) {
    const existingItemIndex = basket.findIndex(item => item.name === name);
    
    if (existingItemIndex !== -1) {
        basket[existingItemIndex].quantity++;
    } else {
        const newItem = {
            name: name,
            price: price,
            image: image,
            quantity: 1
        };
        basket.push(newItem);
    }
    
    updateBasketCount();
    if (document.getElementById('basketModal').style.display === 'block') {
        renderBasketItems();
    }
}

function updateBasketCount() {
    const totalItems = basket.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('BasketCount').textContent = totalItems;
}

function increaseQuantity(index) {
    if (index >= 0 && index < basket.length) {
        basket[index].quantity += 1;
        updateBasketCount();
        renderBasketItems();
    }
}

function decreaseQuantity(index) {
    if (index >= 0 && index < basket.length) {
        if (basket[index].quantity > 1) {
            basket[index].quantity -= 1;
        } else {
            removeFromBasket(index);
            return;
        }
        updateBasketCount();
        renderBasketItems();
    }
}

function removeFromBasket(index) {
    if (confirm('Удалить товар из корзины?')) {
        basket.splice(index, 1);
        updateBasketCount();
        renderBasketItems();
    }
}

function renderBasketItems() {
    const basketItemsContainer = document.getElementById('basketItems');
    const basketTotalPriceElement = document.getElementById('basketTotalPrice');
    
    basketItemsContainer.innerHTML = '';
    
    if (basket.length === 0) {
        basketItemsContainer.innerHTML = `
            <div class="empty-basket">
                <i class="fas fa-shopping-basket"></i>
                <p>Корзина пуста</p>
            </div>
        `;
        basketTotalPriceElement.textContent = '0 ₽';
        return;
    }
    
    let total = 0;
    
    basket.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'basket-item';
        itemElement.innerHTML = `
            <div class="basket-item-left">
                <img src="${item.image}" alt="${item.name}" class="basket-item-img">
                <div class="basket-item-info">
                    <h4>${item.name}</h4>
                    <p class="basket-item-price">${item.price} ₽</p>
                </div>
            </div>
            <div class="basket-item-right">
                <div class="quantity-controls">
                    <button class="quantity-btn minus" onclick="decreaseQuantity(${index})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn plus" onclick="increaseQuantity(${index})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="remove-btn" onclick="removeFromBasket(${index})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        basketItemsContainer.appendChild(itemElement);
    });
    basketTotalPriceElement.textContent = `${total} ₽`;
}

function zakaz() {
    if (basket.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    let total = 0;
    let totalItems = 0;
    basket.forEach(item => {
        total += item.price * item.quantity;
        totalItems += item.quantity;
    });

    const orderData = {
        user_id: currentUser ? currentUser.id : null,
        total_price: total,
        items: basket
    };

    console.log('Отправка заказа:', orderData);
    
    fetch('http://localhost:3000/api/create_order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(orderData)
    })
    .then(response => {
        console.log('Статус ответа заказа:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Ответ сервера при заказе:', data);
        if (data.order_id) {
            alert(`Заказ оформлен! №${data.order_id}\nСумма: ${total} ₽\nТоваров: ${totalItems} шт.`);
            basket = [];
            updateBasketCount();
            renderBasketItems();
            closebasket();
        } else {
            alert(data.message || 'Ошибка при оформлении заказа');
        }
    })
    .catch(error => {
        console.error('Ошибка при оформлении заказа:', error);
        alert('Ошибка соединения с сервером');
    });
}