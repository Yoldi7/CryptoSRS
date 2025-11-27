
// Inicialización de UI de bots (listeners y referencias)
window.setupBotUI = function() {
    const botForm = document.getElementById('bot-form');
    const botsList = document.getElementById('bots-list');
    if (botForm) {
        botForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('bot-name').value;
            const configText = document.getElementById('bot-config').value;
            const errorDiv = document.getElementById('bot-error');
            const successDiv = document.getElementById('bot-success');
            if (!name || !configText) {
                errorDiv.textContent = 'Please fill in all fields';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                // Validar que sea JSON válido
                let config;
                try {
                    config = JSON.parse(configText);
                } catch (e) {
                    errorDiv.textContent = 'Invalid JSON format';
                    errorDiv.style.display = 'block';
                    return;
                }
                errorDiv.style.display = 'none';
                successDiv.style.display = 'none';
                // Convertir a pickle/base64
                const configEncoded = btoa(JSON.stringify(config));
                const response = await api.configureBot(name, configEncoded);
                successDiv.textContent = 'Bot created successfully';
                successDiv.style.display = 'block';
                botForm.reset();
                await loadBots();
            } catch (error) {
                errorDiv.textContent = error.message || 'Error creating bot';
                errorDiv.style.display = 'block';
                console.error('Bot error:', error);
            }
        });
    }
};

// Cargar bots
async function loadBots() {
    try {
        const response = await api.listBots();
        displayBots(response.bots);
    } catch (error) {
        // Si no es premium, mostrar mensaje
        if (error.status === 403) {
            botsList.innerHTML = `
                <div class="alert alert-error">
                    <strong>Premium Feature</strong><br>
                    You need to be a premium member to use bots. 
                    Buy flagcoin to unlock this feature!
                </div>
            `;
        } else {
            console.error('Error cargando bots:', error);
            botsList.innerHTML = '<p style="color: var(--text-secondary);">Error loading bots</p>';
        }
    }
}

// Mostrar bots
function displayBots(bots) {
    botsList.innerHTML = '';
    
    if (bots.length === 0) {
        botsList.innerHTML = '<p style="color: var(--text-secondary);">No bots created yet</p>';
        return;
    }
    
    bots.forEach(bot => {
        const item = document.createElement('div');
        item.className = 'bot-item';
        item.innerHTML = `
            <div class="bot-info">
                <div class="bot-name">${bot.name}</div>
                <div class="bot-status">
                    Status: <strong>${bot.is_active ? 'Active' : 'Inactive'}</strong>
                </div>
            </div>
            <div class="bot-actions">
                ${bot.is_active ? `
                    <button class="btn btn-warning" onclick="deactivateBotClick(${bot.id})">
                        Deactivate
                    </button>
                ` : `
                    <button class="btn btn-success" onclick="activateBotClick(${bot.id})">
                        Activate
                    </button>
                `}
                <button class="btn btn-error" onclick="deleteBotClick(${bot.id})">
                    Delete
                </button>
            </div>
        `;
        botsList.appendChild(item);
    });
}

// Activar bot
async function activateBotClick(botId) {
    try {
        await api.activateBot(botId);
        alert('Bot activated');
        await loadBots();
    } catch (error) {
        alert('Error activating bot: ' + error.message);
    }
}

// Desactivar bot
async function deactivateBotClick(botId) {
    try {
        await api.deactivateBot(botId);
        alert('Bot deactivated');
        await loadBots();
    } catch (error) {
        alert('Error deactivating bot: ' + error.message);
    }
}

// Eliminar bot
async function deleteBotClick(botId) {
    if (!confirm('Are you sure you want to delete this bot?')) {
        return;
    }
    
    try {
        await api.deleteBot(botId);
        alert('Bot deleted');
        await loadBots();
    } catch (error) {
        alert('Error deleting bot: ' + error.message);
    }
}