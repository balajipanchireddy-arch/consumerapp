// ================================================================
// DATA
// ================================================================
let pantryItems = [];
let shoppingItems = [];
let alertHistory = [];
let userName = 'John';

// ================================================================
// ICON MAP
// ================================================================
const iconMap = {
    'Milk': '🥛',
    'Bread': '🍞',
    'Eggs': '🥚',
    'Cheese': '🧀',
    'Chicken': '🍗',
    'Yogurt': '🍦',
    'Orange Juice': '🧃',
    'Butter': '🧈',
    'Apple': '🍎',
    'Banana': '🍌',
    'Tomato': '🍅',
    'Potato': '🥔',
    'Onion': '🧅',
    'Garlic': '🧄',
    'Rice': '🍚',
    'Pasta': '🍝',
    'Cereal': '🥣'
};

function getEmoji(name) {
    for (let [key, emoji] of Object.entries(iconMap)) {
        if (name.includes(key)) return emoji;
    }
    return '📦';
}

// ================================================================
// LOAD DATA FROM LOCAL STORAGE (Simulating Cloud Sync)
// ================================================================
function loadData() {
    const saved = localStorage.getItem('consumerProducts');
    if (saved) {
        pantryItems = JSON.parse(saved);
        pantryItems.forEach(p => {
            p.expiry = new Date(p.expiry);
            p.purchaseDate = new Date(p.purchaseDate);
            p.alertSent = p.alertSent || {
                '7d': false,
                '3d': false,
                '1d': false,
                'expired': false
            };
        });
    }
    
    const savedList = localStorage.getItem('consumerShoppingList');
    if (savedList) {
        shoppingItems = JSON.parse(savedList);
    }
}

// ================================================================
// SAVE DATA
// ================================================================
function saveData() {
    localStorage.setItem('consumerProducts', JSON.stringify(pantryItems));
    localStorage.setItem('consumerShoppingList', JSON.stringify(shoppingItems));
}

// ================================================================
// CHECK FOR NEW ITEMS FROM SHOP
// ================================================================
function checkForNewItems() {
    const saved = localStorage.getItem('consumerProducts');
    if (saved) {
        const newItems = JSON.parse(saved);
        if (newItems.length > pantryItems.length) {
            const newCount = newItems.length - pantryItems.length;
            showToast('📦', 'New Items Added!', `${newCount} new item(s) synced from shop.`, 'success');
            newItems.forEach(newItem => {
                if (!pantryItems.find(p => p.id === newItem.id)) {
                    pantryItems.push({
                        ...newItem,
                        expiry: new Date(newItem.expiry),
                        purchaseDate: new Date(newItem.purchaseDate)
                    });
                }
            });
            saveData();
            updateUI();
        }
    }
}

// ================================================================
// ADD ITEM TO PANTRY (Simulating purchase from POS)
// ================================================================
function addToPantry(name, price, expiryDays) {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + expiryDays);
    
    const randomMins = Math.floor(Math.random() * 5) + 1;
    expiry.setMinutes(expiry.getMinutes() + randomMins);

    const item = {
        id: Date.now(),
        name: name,
        price: price,
        expiry: expiry,
        purchaseDate: now,
        isConsumed: false,
        discount: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : 0,
        alertSent: {
            '7d': false,
            '3d': false,
            '1d': false,
            'expired': false
        }
    };

    pantryItems.unshift(item);
    saveData();
    
    const discountText = item.discount > 0 ? ` (${item.discount}% off!)` : '';
    showToast('🛒', 'Added to Pantry!', `${name} added${discountText} - Expires ${formatDate(expiry)}`, 'success');
    
    updateUI();
}

// ================================================================
// SIMULATE PURCHASE
// ================================================================
function simulatePurchase(name, price, expiryDays) {
    const days = expiryDays || Math.floor(Math.random() * 9) + 1;
    addToPantry(name, price, days);
    
    if (!shoppingItems.find(item => item.name === name)) {
        shoppingItems.push({
            id: Date.now() + 1,
            name: name,
            checked: false
        });
        saveData();
    }
}

// ================================================================
// GET ITEM STATUS
// ================================================================
function getItemStatus(item) {
    const now = new Date();
    const timeLeft = (item.expiry - now) / 1000 / 60 / 60 / 24;
    
    if (timeLeft < 0) {
        return { status: 'expired', label: 'Expired', daysLeft: 0 };
    } else if (timeLeft <= 1) {
        return { status: 'expiring', label: '⚠️ Expires TODAY!', daysLeft: timeLeft };
    } else if (timeLeft <= 3) {
        return { status: 'expiring', label: `⚠️ ${Math.ceil(timeLeft)} days left`, daysLeft: timeLeft };
    } else if (timeLeft <= 7) {
        return { status: 'expiring', label: `${Math.ceil(timeLeft)} days left`, daysLeft: timeLeft };
    } else {
        return { status: 'fresh', label: `${Math.ceil(timeLeft)} days left`, daysLeft: timeLeft };
    }
}

// ================================================================
// CHECK AND TRIGGER ALERTS
// ================================================================
function checkAlerts() {
    const now = new Date();
    let newAlerts = [];
    
    pantryItems.forEach(item => {
        if (item.isConsumed) return;
        
        const timeLeft = (item.expiry - now) / 1000 / 60 / 60 / 24;
        
        if (timeLeft <= 7 && timeLeft > 6.5 && !item.alertSent['7d']) {
            item.alertSent['7d'] = true;
            newAlerts.push({ item: item, type: 'warning', msg: `📦 ${item.name} expires in 7 days!` });
            showToast('⏰', '7 Day Warning', `${item.name} expires in 7 days. Plan to use it!`, 'warning');
        } else if (timeLeft <= 3 && timeLeft > 2.5 && !item.alertSent['3d']) {
            item.alertSent['3d'] = true;
            newAlerts.push({ item: item, type: 'warning', msg: `⚠️ ${item.name} expires in 3 days!` });
            showToast('⚠️', '3 Day Warning', `${item.name} expires in 3 days! Time to use it.`, 'warning');
        } else if (timeLeft <= 1 && timeLeft > 0.5 && !item.alertSent['1d']) {
            item.alertSent['1d'] = true;
            newAlerts.push({ item: item, type: 'danger', msg: `🚨 ${item.name} expires TOMORROW!` });
            showToast('🚨', '1 Day Warning', `${item.name} expires TOMORROW! Use it today!`, 'danger');
            showRecipeSuggestion(item.name);
        } else if (timeLeft < 0 && !item.alertSent['expired']) {
            item.alertSent['expired'] = true;
            newAlerts.push({ item: item, type: 'danger', msg: `💀 ${item.name} has EXPIRED!` });
            showToast('💀', 'EXPIRED!', `${item.name} has expired! Please discard it.`, 'danger');
        }
    });
    
    if (newAlerts.length > 0) {
        alertHistory = [...newAlerts, ...alertHistory];
        saveData();
        if (newAlerts.some(a => a.type === 'danger')) {
            playAlertSound('danger');
        } else {
            playAlertSound('warning');
        }
    }
    
    return newAlerts;
}

// ================================================================
// RECIPE SUGGESTIONS
// ================================================================
function showRecipeSuggestion(itemName) {
    const recipes = {
        'Milk': '🥣 Make pancakes, smoothies, or mac and cheese!',
        'Bread': '🍞 Make french toast, croutons, or bread pudding!',
        'Eggs': '🍳 Make omelette, frittata, or hard-boiled eggs!',
        'Cheese': '🧀 Make grilled cheese, macaroni, or cheese sauce!',
        'Chicken': '🍗 Make chicken stir-fry, soup, or sandwich!',
        'Yogurt': '🍦 Make smoothie, parfait, or use in baking!',
        'Orange Juice': '🧃 Make smoothie, marinade, or popsicles!'
    };
    
    let suggestion = '🍳 Try using it in a recipe today!';
    for (let [key, value] of Object.entries(recipes)) {
        if (itemName.includes(key)) {
            suggestion = value;
            break;
        }
    }
    
    showToast('🍳', 'Recipe Idea!', suggestion, 'info');
}

// ================================================================
// AUDIO
// ================================================================
function playAlertSound(type = 'danger') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'danger') {
            osc.frequency.value = 800;
            osc.type = 'square';
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => osc.stop(), 300);
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 600;
                osc2.type = 'square';
                gain2.gain.value = 0.1;
                osc2.start();
                setTimeout(() => osc2.stop(), 300);
            }, 200);
        } else {
            osc.frequency.value = 600;
            osc.type = 'sine';
            gain.gain.value = 0.08;
            osc.start();
            setTimeout(() => osc.stop(), 300);
        }
    } catch(e) {}
}

// ================================================================
// FORMAT HELPERS
// ================================================================
function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeLeft(days) {
    if (days < 0) return 'EXPIRED';
    if (days < 1) return `${Math.floor(days * 24)} hours`;
    if (days < 7) return `${Math.ceil(days)} days`;
    return `${Math.floor(days)} days`;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ================================================================
// TOAST
// ================================================================
function showToast(icon, title, msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${icon} ${title}</div>
        <div class="toast-msg">${msg}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// ================================================================
// CONSUME ITEM
// ================================================================
function consumeItem(id) {
    const item = pantryItems.find(p => p.id === id);
    if (item) {
        item.isConsumed = true;
        saveData();
        showToast('✅', 'Used!', `${item.name} marked as consumed.`, 'success');
        updateUI();
    }
}

// ================================================================
// DELETE ITEM
// ================================================================
function deleteItem(id) {
    const item = pantryItems.find(p => p.id === id);
    if (item) {
        pantryItems = pantryItems.filter(p => p.id !== id);
        saveData();
        showToast('🗑️', 'Removed', `${item.name} removed from pantry.`, 'info');
        updateUI();
    }
}

// ================================================================
// CLEAR ALL ITEMS
// ================================================================
function clearAllItems() {
    if (pantryItems.length === 0) return;
    if (confirm('Remove all items from pantry?')) {
        pantryItems = [];
        saveData();
        showToast('🗑️', 'Cleared', 'All items removed from pantry.', 'info');
        updateUI();
    }
}

// ================================================================
// SHOPPING LIST
// ================================================================
function addShoppingItem() {
    const name = prompt('Enter item name:');
    if (name && name.trim()) {
        shoppingItems.push({
            id: Date.now(),
            name: name.trim(),
            checked: false
        });
        saveData();
        updateUI();
    }
}

function toggleShoppingItem(id) {
    const item = shoppingItems.find(s => s.id === id);
    if (item) {
        item.checked = !item.checked;
        saveData();
        updateUI();
    }
}

function removeShoppingItem(id) {
    shoppingItems = shoppingItems.filter(s => s.id !== id);
    saveData();
    updateUI();
}

// ================================================================
// TAB SWITCHING
// ================================================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-nav button, .bottom-nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`panel-${tabName}`).classList.add('active');
}

document.querySelectorAll('.tab-nav button, .bottom-nav button').forEach(btn => {
    btn.addEventListener('click', function() {
        switchTab(this.dataset.tab);
    });
});

// ================================================================
// UPDATE UI
// ================================================================
function updateUI() {
    checkAlerts();
    
    const now = new Date();
    let totalItems = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    
    const activeItems = pantryItems.filter(p => !p.isConsumed);
    const consumedItems = pantryItems.filter(p => p.isConsumed);
    
    const sortedItems = [...activeItems].sort((a, b) => {
        const statusA = getItemStatus(a);
        const statusB = getItemStatus(b);
        if (statusA.status === 'expired' && statusB.status !== 'expired') return -1;
        if (statusA.status !== 'expired' && statusB.status === 'expired') return 1;
        return a.expiry - b.expiry;
    });
    
    sortedItems.forEach(item => {
        const status = getItemStatus(item);
        if (status.status === 'expired') expiredCount++;
        else if (status.status === 'expiring') expiringCount++;
        totalItems++;
    });
    
    // --- Pantry ---
    const pantryContainer = document.getElementById('pantryList');
    let html = '';
    
    if (sortedItems.length === 0 && consumedItems.length === 0) {
        html = `
            <div class="empty-state">
                <i class="fas fa-warehouse"></i>
                <h3>Your Pantry is Empty</h3>
                <p>Shop at SmartShelf and your purchases will appear here!</p>
            </div>
        `;
    } else {
        sortedItems.forEach(item => {
            const status = getItemStatus(item);
            const emoji = getEmoji(item.name);
            const iconClass = status.status === 'fresh' ? 'fresh' : 
                             status.status === 'expiring' ? 'expiring' : 'expired';
            const badgeClass = status.status === 'fresh' ? 'fresh' : 
                              status.status === 'expiring' ? 'expiring' : 'expired';
            const expiryClass = status.status === 'expired' ? 'danger' : 
                               status.status === 'expiring' ? 'urgent' : '';
            
            const discountText = item.discount > 0 ? ` (${item.discount}% off)` : '';
            
            html += `
                <div class="pantry-item">
                    <div class="icon-box ${iconClass}">${emoji}</div>
                    <div class="info">
                        <div class="name">${item.name}${discountText}</div>
                        <div class="details">
                            <span>📅 <span class="expiry ${expiryClass}">${formatDate(item.expiry)}</span></span>
                            <span>⏰ ${formatTimeLeft(status.daysLeft)}</span>
                            <span>💰 $${item.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <span class="badge-status ${badgeClass}">${status.label}</span>
                    <div class="actions">
                        ${status.status !== 'expired' ? `
                            <button class="use-btn" onclick="consumeItem(${item.id})" title="Mark as used">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="delete-btn" onclick="deleteItem(${item.id})" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (consumedItems.length > 0) {
            html += `<div style="margin-top:10px;font-size:12px;color:#888;padding:4px 0;border-top:1px solid #e0e0e0;">✅ Used Items</div>`;
            consumedItems.forEach(item => {
                html += `
                    <div class="pantry-item" style="opacity:0.6;">
                        <div class="icon-box fresh">${getEmoji(item.name)}</div>
                        <div class="info">
                            <div class="name" style="text-decoration:line-through;">${item.name}</div>
                            <div class="details">✅ Used on ${formatDate(item.purchaseDate)}</div>
                        </div>
                        <button class="delete-btn" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });
        }
    }
    pantryContainer.innerHTML = html;
    
    // --- Alert Banner ---
    const banner = document.getElementById('alertBanner');
    const urgentItems = sortedItems.filter(item => {
        const status = getItemStatus(item);
        return status.status === 'expiring' && status.daysLeft <= 3;
    });
    
    const expiredItemsList = sortedItems.filter(item => {
        const status = getItemStatus(item);
        return status.status === 'expired';
    });
    
    if (expiredItemsList.length > 0) {
        banner.style.display = 'flex';
        banner.className = 'alert-banner danger';
        banner.innerHTML = `
            <span class="icon">💀</span>
            <div class="msg">
                <strong>${expiredItemsList.length} Item(s) Expired!</strong>
                <span>Please remove them from your pantry.</span>
            </div>
        `;
    } else if (urgentItems.length > 0) {
        banner.style.display = 'flex';
        banner.className = 'alert-banner';
        banner.innerHTML = `
            <span class="icon">⚠️</span>
            <div class="msg">
                <strong>${urgentItems.length} Item(s) Expiring Soon!</strong>
                <span>Use them before ${formatDate(urgentItems[0].expiry)}</span>
            </div>
        `;
    } else {
        banner.style.display = 'none';
    }
    
    // --- Alerts Tab ---
    const alertsContainer = document.getElementById('alertsList');
    const activeAlerts = alertHistory.filter(a => {
        const item = pantryItems.find(p => p.id === a.item.id);
        return item && !item.isConsumed;
    });
    
    if (activeAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Clear!</h3>
                <p>No alerts right now. Keep it up! 🎉</p>
            </div>
        `;
    } else {
        let alertHtml = '';
        activeAlerts.slice(0, 20).forEach(alert => {
            const isDanger = alert.type === 'danger';
            alertHtml += `
                <div class="alert-item ${isDanger ? 'danger' : ''}">
                    <div class="alert-msg">
                        <strong>${alert.msg}</strong>
                        <div class="alert-time">📅 ${formatDate(alert.item.expiry)}</div>
                    </div>
                    <button class="alert-action" onclick="deleteItem(${alert.item.id})">
                        Remove
                    </button>
                </div>
            `;
        });
        alertsContainer.innerHTML = alertHtml;
    }
    
    // --- Recipes ---
    const recipesContainer = document.getElementById('recipesList');
    const expiringItems = sortedItems.filter(item => {
        const status = getItemStatus(item);
        return status.status === 'expiring' && status.daysLeft <= 5;
    });
    
    if (expiringItems.length === 0) {
        recipesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>No Recipes Yet</h3>
                <p>Add items that are expiring soon and we'll suggest recipes!</p>
            </div>
        `;
    } else {
        let recipeHtml = '';
        const recipeIdeas = [
            { name: '🍳 Quick Omelette', ingredients: 'Eggs, Cheese, Vegetables', match: 'Eggs, Cheese' },
            { name: '🥛 Smoothie Bowl', ingredients: 'Milk, Yogurt, Fruit', match: 'Milk, Yogurt' },
            { name: '🍞 French Toast', ingredients: 'Bread, Eggs, Milk', match: 'Bread, Eggs, Milk' },
            { name: '🧀 Grilled Cheese', ingredients: 'Bread, Cheese', match: 'Bread, Cheese' },
            { name: '🍗 Chicken Stir-fry', ingredients: 'Chicken, Vegetables', match: 'Chicken' },
            { name: '🥗 Chicken Salad', ingredients: 'Chicken, Eggs', match: 'Chicken, Eggs' }
        ];
        
        const expiringNames = expiringItems.map(i => i.name);
        let matchedRecipes = [];
        
        recipeIdeas.forEach(recipe => {
            const recipeItems = recipe.match.split(', ');
            const matchCount = recipeItems.filter(r => 
                expiringNames.some(n => n.includes(r) || r.includes(n))
            ).length;
            if (matchCount > 0) {
                matchedRecipes.push({ ...recipe, matchCount });
            }
        });
        
        matchedRecipes.sort((a, b) => b.matchCount - a.matchCount);
        
        if (matchedRecipes.length === 0) {
            recipesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>No Recipe Matches</h3>
                    <p>Try adding more variety to your pantry!</p>
                </div>
            `;
        } else {
            matchedRecipes.slice(0, 5).forEach(recipe => {
                recipeHtml += `
                    <div class="recipe-card">
                        <div class="emoji">${recipe.name.split(' ')[0]}</div>
                        <div class="info">
                            <div class="name">${recipe.name}</div>
                            <div class="ingredients">🧑‍🍳 ${recipe.ingredients}</div>
                            <div class="match">✅ Uses ${recipe.match}</div>
                        </div>
                        <button class="btn" onclick="showToast('🍳', 'Recipe', 'Check your kitchen!', 'info')">View</button>
                    </div>
                `;
            });
            recipesContainer.innerHTML = recipeHtml;
        }
    }
    
    // --- Shopping List ---
    const shoppingContainer = document.getElementById('shoppingList');
    if (shoppingItems.length === 0) {
        shoppingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Your Shopping List</h3>
                <p>Add items you need to buy.</p>
            </div>
        `;
    } else {
        let shopHtml = '';
        shoppingItems.forEach(item => {
            shopHtml += `
                <div class="shopping-item">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleShoppingItem(${item.id})" />
                    <span class="name ${item.checked ? 'done' : ''}">${item.name}</span>
                    <button onclick="removeShoppingItem(${item.id})" style="background:none;border:none;color:#c62828;cursor:pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        shoppingContainer.innerHTML = shopHtml;
    }
    
    // --- Stats ---
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('expiringItems').textContent = expiringCount;
    document.getElementById('expiredItems').textContent = expiredCount;
    
    document.getElementById('pantryBadge').textContent = totalItems;
    document.getElementById('alertBadge').textContent = activeAlerts.length;
    document.getElementById('bottomPantryBadge').textContent = totalItems;
    document.getElementById('bottomAlertBadge').textContent = activeAlerts.length;
    
    // --- Sync Status ---
    document.getElementById('lastSyncTime').textContent = `Last sync: ${formatTime(new Date())}`;
    
    // --- Live Time in Status Bar ---
    document.getElementById('liveTime').textContent = `⏰ ${formatTime(new Date())}`;
}

// ================================================================
// DEMO DATA
// ================================================================
function loadDemoData() {
    const now = new Date();
    
    const demoItems = [
        { name: 'Fresh Milk', price: 4.99, days: 2 },
        { name: 'Whole Bread', price: 3.49, days: 3 },
        { name: 'Cheddar Cheese', price: 5.99, days: 5 },
        { name: 'Free-Range Eggs', price: 6.99, days: 7 },
        { name: 'Organic Yogurt', price: 3.99, days: 4 },
        { name: 'Orange Juice', price: 4.49, days: 6 }
    ];
    
    demoItems.forEach(item => {
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + item.days);
        expiry.setHours(expiry.getHours() + Math.floor(Math.random() * 12));
        
        pantryItems.push({
            id: Date.now() + Math.random() * 1000,
            name: item.name,
            price: item.price,
            expiry: expiry,
            purchaseDate: now,
            isConsumed: false,
            discount: item.days < 3 ? 30 : (item.days < 5 ? 15 : 0),
            alertSent: {
                '7d': false,
                '3d': false,
                '1d': false,
                'expired': false
            }
        });
    });
    
    shoppingItems = [
        { id: 1, name: 'Butter', checked: false },
        { id: 2, name: 'Chicken', checked: false },
        { id: 3, name: 'Tomatoes', checked: true }
    ];
    
    saveData();
    showToast('🎯', 'Demo Loaded!', '6 demo items added to your pantry.', 'success');
    updateUI();
}

// ================================================================
// INIT
// ================================================================
function init() {
    loadData();
    
    if (pantryItems.length === 0) {
        loadDemoData();
    } else {
        updateUI();
    }
    
    // Check for new items every 5 seconds (simulating real-time sync)
    setInterval(() => {
        checkForNewItems();
    }, 5000);
    
    // Update UI every second
    setInterval(() => {
        updateUI();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', init);