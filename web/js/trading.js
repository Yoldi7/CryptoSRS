// Lógica de trading modular

let coinsData = [];

// Inicialización de UI de trading (listeners y referencias)
window.setupTradingUI = function() {
    // Elementos del DOM
    const coinsGrid = document.getElementById('coins-grid');
    const walletContainer = document.getElementById('wallet-container');
    const orderForm = document.getElementById('order-form');
    const ordersList = document.getElementById('orders-list');
    const orderTypeSelect = document.getElementById('order-type');
    const priceTypeSelect = document.getElementById('price-type');
    const orderPriceInput = document.getElementById('order-price');

    // Por defecto, ocultar el campo Target Price si el tipo es market
    if (priceTypeSelect && orderPriceInput) {
        if (priceTypeSelect.value === 'market') {
            orderPriceInput.required = false;
            orderPriceInput.parentElement.style.display = 'none';
        } else {
            orderPriceInput.parentElement.style.display = 'block';
        }
        priceTypeSelect.addEventListener('change', () => {
            if (priceTypeSelect.value === 'limit') {
                orderPriceInput.required = true;
                orderPriceInput.parentElement.style.display = 'block';
            } else {
                orderPriceInput.required = false;
                orderPriceInput.parentElement.style.display = 'none';
            }
        });
    }

    // Manejar creación de orden (evitar listeners duplicados)
    if (orderForm) {
        // Eliminar listeners previos usando un flag
        if (!orderForm._listenerAdded) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const orderType = document.getElementById('order-type').value;
                const coin = document.getElementById('order-coin').value;
                const amount = document.getElementById('order-amount').value;
                const priceType = document.getElementById('price-type').value;
                const targetPrice = document.getElementById('order-price').value;
                const errorDiv = document.getElementById('order-error');
                const successDiv = document.getElementById('order-success');
                if (!orderType || !coin || !amount) {
                    errorDiv.textContent = 'Please fill in all required fields';
                    errorDiv.style.display = 'block';
                    return;
                }
                if (priceType === 'limit' && !targetPrice) {
                    errorDiv.textContent = 'Target price required for limit orders';
                    errorDiv.style.display = 'block';
                    return;
                }
                try {
                    errorDiv.style.display = 'none';
                    successDiv.style.display = 'none';
                    const response = await api.createOrder(orderType, coin, amount, priceType, targetPrice);
                    const status = response.order.status;
                    const executedPrice = response.order.executed_price;
                    let message = '';
                    if (status === 'completed') {
                        const usd = (executedPrice * parseFloat(amount));
                        if (orderType === 'BUY') {
                            message = `Bought ${amount} ${coin} for $${usd.toFixed(2)} ($${executedPrice?.toFixed(2)} each)`;
                        } else {
                            message = `Sold ${amount} ${coin} for $${usd.toFixed(2)} ($${executedPrice?.toFixed(2)} each)`;
                        }
                    } else {
                        message = `${orderType} order created for ${amount} ${coin}`;
                    }
                    successDiv.textContent = message;
                    successDiv.style.display = 'block';
                    orderForm.reset();
                    // Ocultar el campo Target Price tras reset si el tipo es market
                    if (priceTypeSelect && orderPriceInput && priceTypeSelect.value === 'market') {
                        orderPriceInput.required = false;
                        orderPriceInput.parentElement.style.display = 'none';
                    }
                    await loadWallet();
                    await loadOrders();
                } catch (error) {
                    errorDiv.textContent = error.message || 'Error creating order';
                    errorDiv.style.display = 'block';
                }
            });
            orderForm._listenerAdded = true;
        }
    }
};

// ...existing code...

// Helper: get initials and color for a coin
function getCoinInitials(coin) {
    if (!coin) return 'CC';
    const parts = coin.split(/[-_/ ]+/);
    if (parts.length === 1) return coin.substring(0, 3).toUpperCase();
    return (parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : '')).toUpperCase();
}

function getCoinColor(coin) {
    // Generate a deterministic color based on coin name
    let hash = 0;
    for (let i = 0; i < coin.length; i++) {
        hash = coin.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${hue} 80% 50% / 0.95), hsl(${(hue + 60) % 360} 60% 44% / 0.9))`;
}

// Agregar validaciones para evitar errores si los datos son indefinidos o nulos

// Cargar datos de monedas
async function loadCoins() {
    try {
        const response = await api.getCoins();
        console.log('Respuesta de /api/trading/coins:', response);
        if (response && response.length > 0) {
            coinsData = response; // Asignar directamente los datos
            displayCoins(); // Mostrar las monedas en el frontend
        } else {
            console.warn('No se recibieron datos de monedas');
            const coinsGrid = document.getElementById('coins-grid');
            if (coinsGrid) {
                coinsGrid.innerHTML = '<p>No coins available</p>';
            }
        }
    } catch (error) {
        console.error('Error cargando monedas:', error);
    }
}

// Mostrar monedas en grid
function displayCoins() {
    const coinsGrid = document.getElementById('coins-grid');
    if (!coinsGrid) {
        console.warn('displayCoins: #coins-grid not found. DOM not ready or wrong page.');
        return;
    }
    if (!coinsData || coinsData.length === 0) {
        coinsGrid.innerHTML = '<p>No coins available</p>';
        return;
    }
    coinsGrid.innerHTML = ''; // Limpiar el grid antes de agregar nuevas monedas
    coinsData.forEach(coin => {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.innerHTML = `
            <div class="coin-left">
                <div class="coin-icon" style="background:${getCoinColor(coin.coin)}">${getCoinInitials(coin.coin)}</div>
                <div class="coin-name">${coin.coin}</div>
            </div>
            <div class="coin-right">
                <div class="coin-prices">
                    <div>
                        <div class="price-label">Buy</div>
                        <div class="price-value price-buy">$${coin.buy_price.toFixed(2)}</div>
                    </div>
                    <div>
                        <div class="price-label">Sell</div>
                        <div class="price-value price-sell">$${coin.sell_price.toFixed(2)}</div>
                    </div>
                </div>
                <div class="sparkline" aria-hidden="true"></div>
            </div>
            <div class="quick-actions" aria-hidden="true">
                <button class="btn btn-sm btn-success quick-buy">Buy</button>
                <button class="btn btn-sm btn-warning quick-sell">Sell</button>
            </div>
        `;
        // Agregar evento de clic para seleccionar la moneda
        card.addEventListener('click', () => {
            const orderCoinSelect = document.getElementById('order-coin');
            if (orderCoinSelect) {
                orderCoinSelect.value = coin.coin; // Seleccionar la moneda en el formulario
                // Mark selected card
                document.querySelectorAll('.coin-card.selected').forEach(el => el.classList.remove('selected'));
                card.classList.add('selected');
                // Update header selected coin
                const selectedName = document.getElementById('selected-coin-name');
                if (selectedName) selectedName.textContent = coin.coin;
                console.log(`Moneda seleccionada para comprar: ${coin.coin}`);
                // Focus and scroll to the order form
                const amountInput = document.getElementById('order-amount');
                if (amountInput) amountInput.focus();
                const rightCol = document.querySelector('.right-column');
                if (rightCol) rightCol.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Quick buy/sell buttons
        const quickBuy = card.querySelector('.quick-buy');
        const quickSell = card.querySelector('.quick-sell');
        if (quickBuy) quickBuy.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('order-type').value = 'BUY';
            document.getElementById('order-coin').value = coin.coin;
            document.getElementById('selected-coin-name').textContent = coin.coin;
            document.getElementById('order-amount').focus();
        });
        if (quickSell) quickSell.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('order-type').value = 'SELL';
            document.getElementById('order-coin').value = coin.coin;
            document.getElementById('selected-coin-name').textContent = coin.coin;
            document.getElementById('order-amount').focus();
        });
        coinsGrid.appendChild(card);
    });

    // Actualizar el menú desplegable
    populateCoinDropdown();

    // If no card selected, select the first coin by default
    if (!document.querySelector('.coin-card.selected') && coinsGrid.firstChild) {
        const firstCard = coinsGrid.firstChild;
        firstCard.classList.add('selected');
        const firstCoin = coinsData && coinsData.length > 0 ? coinsData[0].coin : '';
        const selectedName = document.getElementById('selected-coin-name');
        const orderCoinSelect = document.getElementById('order-coin');
        if (selectedName) selectedName.textContent = firstCoin || '—';
        if (orderCoinSelect && firstCoin) orderCoinSelect.value = firstCoin;
    }
}

// Mostrar monedas en el menú desplegable
function populateCoinDropdown() {
    const orderCoinSelect = document.getElementById('order-coin');
    if (!orderCoinSelect || !coinsData || coinsData.length === 0) {
        console.error('No se pudo llenar el menú desplegable de monedas.');
        return;
    }

    // Limpiar el menú antes de agregar nuevas opciones
    orderCoinSelect.innerHTML = '';

    // Agregar una opción predeterminada
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccione una moneda';
    orderCoinSelect.appendChild(defaultOption);

    // Agregar las monedas al menú desplegable
    coinsData.forEach(coin => {
        const option = document.createElement('option');
        option.value = coin.coin;
        option.textContent = coin.coin;
        orderCoinSelect.appendChild(option);
    });

    console.log('Menú desplegable de monedas actualizado.');

    // Añadir listener al select para sincronizar la tarjeta seleccionada
    if (!orderCoinSelect._listenerAdded) {
        orderCoinSelect.addEventListener('change', () => {
        const selected = orderCoinSelect.value;
        document.querySelectorAll('.coin-card').forEach(card => {
            const nameEl = card.querySelector('.coin-name');
            if (nameEl && nameEl.textContent === selected) {
                card.classList.add('selected');
                const selectedName = document.getElementById('selected-coin-name');
                if (selectedName) selectedName.textContent = selected;
            } else {
                card.classList.remove('selected');
            }
        });
        });
        orderCoinSelect._listenerAdded = true;
    }
}

// Poblar selectores de monedas
function populateCoinSelects() {
    const orderCoinSelect = document.getElementById('order-coin');
    
    // Limpiar opciones actuales
    orderCoinSelect.innerHTML = '<option value="">Select coin</option>';
    
    coinsData.forEach(coin => {
        const option = document.createElement('option');
        option.value = coin.coin;
        option.textContent = coin.coin;
        orderCoinSelect.appendChild(option);
    });
}

// Cargar cartera
async function loadWallet() {
    try {
        // If user is not authenticated, skip protected calls
        if (!api.isAuthenticated && !api.isAuthenticated()) {
            console.warn('Skipping loadWallet: not authenticated');
            const walletContainer = document.getElementById('wallet-container');
            if (walletContainer) walletContainer.innerHTML = '<p>Please login to see your wallet</p>';
            return;
        }
        const response = await api.getWallet();
        console.log('Respuesta de /api/trading/wallet:', response);
        if (response && Array.isArray(response) && response.length > 0) {
            displayWallet(response); // Pasar directamente el array de la respuesta
            
            // Actualizar valores totales en interfaz
            let total = 0;
            response.forEach(w => {
                if (w.balance && w.price_usd) {
                    total += w.balance * w.price_usd;
                }
            });
            const portfolioEl = document.getElementById('portfolio-balance');
            const totalEl = document.getElementById('total-balance');
            if (portfolioEl) portfolioEl.textContent = `$${total.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        } else {
            console.warn('No se recibieron datos de la cartera');
            const walletContainer = document.getElementById('wallet-container');
            if (walletContainer) {
                walletContainer.innerHTML = '<p>No wallet data available</p>';
            }
        }
    } catch (error) {
        console.error('Error cargando cartera:', error);
    }
}

// Mostrar cartera
function displayWallet(wallets) {
    const walletContainer = document.getElementById('wallet-container');
    if (!walletContainer || !wallets || wallets.length === 0) {
        walletContainer.innerHTML = '<p>No wallet data available</p>';
        return;
    }
    walletContainer.innerHTML = '';
    wallets.forEach(wallet => {
        const item = document.createElement('div');
        item.className = 'wallet-item';
        item.innerHTML = `
            <div class="wallet-left">
                <div class="coin-icon" style="background:${getCoinColor(wallet.coin)}">${getCoinInitials(wallet.coin)}</div>
                <div>
                    <div class="wallet-coin">${wallet.coin}</div>
                    <div class="wallet-available">Available: ${wallet.available.toFixed(4)}</div>
                </div>
            </div>
            <div class="wallet-right">
                <div class="wallet-balance">${wallet.balance.toFixed(4)}</div>
            </div>
            ${wallet.locked_balance > 0 ? `<div class="wallet-locked">Locked: ${wallet.locked_balance.toFixed(4)}</div>` : ''}
        `;
        walletContainer.appendChild(item);
    });
}

// Cargar órdenes
async function loadOrders() {
    try {
        if (!api.isAuthenticated && !api.isAuthenticated()) {
            console.warn('Skipping loadOrders: not authenticated');
            const ordersList = document.getElementById('orders-list');
            if (ordersList) ordersList.innerHTML = '<p>Please login to see your orders</p>';
            return;
        }
        const response = await api.getOrders();
        console.log('Respuesta de /api/trading/orders:', response);
        if (response && Array.isArray(response) && response.length > 0) {
            displayOrders(response); // Pasar directamente el array de la respuesta
        } else {
            console.warn('No se recibieron datos de órdenes');
            const ordersList = document.getElementById('orders-list');
            if (ordersList) {
                ordersList.innerHTML = '<p>No orders available</p>';
            }
        }
    } catch (error) {
        console.error('Error cargando órdenes:', error);
    }
}

// Mostrar órdenes
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList || !orders || orders.length === 0) {
        ordersList.innerHTML = '<p>No orders available</p>';
        return;
    }
    ordersList.innerHTML = '';
    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'order-item';
        item.innerHTML = `
            <div class="order-left">
                <div class="coin-icon" style="background:${getCoinColor(order.coin)}">${getCoinInitials(order.coin)}</div>
                <div class="order-info">
                    <div class="order-type">
                        <strong>${order.order_type}</strong> ${order.amount} ${order.coin}
                        ${order.price_type === 'limit' ? ` @ $${order.target_price.toFixed(2)}` : ' @ Market Price'}
                    </div>
                    <div class="order-details">Created: ${new Date(order.created_at).toLocaleString()}</div>
                </div>
            </div>
            <div class="order-actions">
                <div class="order-status ${order.status}">${order.status}</div>
                <button class="btn btn-sm btn-error" onclick="cancelOrderClick('${order.id}')">Cancel</button>
            </div>
        `;
        ordersList.appendChild(item);
    });
}


// Cancelar orden (esta función será llamada desde onclick)
async function cancelOrderClick(orderId) {
    try {
        await api.cancelOrder(orderId);
        alert('Order cancelled');
        await loadWallet();
        await loadOrders();
    } catch (error) {
        alert('Error cancelling order: ' + error.message);
    }
}

// Ejecutar orden manualmente (vulnerable a race condition)
async function executeOrderClick(orderId) {
    try {
        const response = await api.executeOrder(orderId);
        if (response && response.order && response.order.status === 'completed') {
            const order = response.order;
            const usd = order.executed_price && order.amount ? (order.executed_price * order.amount) : null;
            let msg = '';
            if (usd !== null) {
                if (order.order_type === 'BUY') {
                    msg = `Order executed: Bought ${order.amount} ${order.coin} for $${usd.toFixed(2)} ($${order.executed_price?.toFixed(2)} each)`;
                } else {
                    msg = `Order executed: Sold ${order.amount} ${order.coin} for $${usd.toFixed(2)} ($${order.executed_price?.toFixed(2)} each)`;
                }
            } else {
                msg = `Order executed at $${order.executed_price?.toFixed(2)}`;
            }
            alert(msg);
        } else {
            alert('Order execution failed or already executed/cancelled.');
        }
        await loadWallet();
        await loadOrders();
    } catch (error) {
        alert('Error executing order: ' + (error.message || error));
    }
}

// Funciones de carga del dashboard
async function loadTradingData() {
    await Promise.all([
        loadCoins(),
        loadWallet(),
        loadOrders(),
        loadProfile()
    ]);
    if (typeof setupTradingUI === 'function') setupTradingUI();
}