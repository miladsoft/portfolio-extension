// Initialize global variables first
let selectedPairs = new Set(['btcusdt']); // Default selected pair
let websocket = null;

const top100Cryptos = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'SHIBUSDT',
    'LTCUSDT', 'TRXUSDT', 'AVAXUSDT', 'UNIUSDT', 'LINKUSDT', 'XLMUSDT', 'ATOMUSDT', 'ALGOUSDT', 'VETUSDT', 'MANAUSDT',
    'ICPUSDT', 'FILUSDT', 'SANDUSDT', 'THETAUSDT', 'AXSUSDT', 'FTMUSDT', 'HBARUSDT', 'EGLDUSDT', 'HNTUSDT', 'FTTUSDT',
    'GRTUSDT', 'KSMUSDT', 'LUNAUSDT', 'NEARUSDT', 'CAKEUSDT', 'AAVEUSDT', 'RUNEUSDT', 'MKRUSDT', 'ZILUSDT', 'ENJUSDT',
    'CHZUSDT', 'SNXUSDT', 'COMPUSDT', 'YFIUSDT', '1INCHUSDT', 'OMGUSDT', 'ZRXUSDT', 'BATUSDT', 'BNTUSDT', 'QTUMUSDT',
    'IOSTUSDT', 'ONTUSDT', 'DGBUSDT', 'SCUSDT', 'ICXUSDT', 'STMXUSDT', 'ZENUSDT', 'ANKRUSDT', 'SRMUSDT', 'CRVUSDT',
    'SUSHIUSDT', 'LRCUSDT', 'OCEANUSDT', 'RSRUSDT', 'KAVAUSDT', 'BALUSDT', 'BANDUSDT', 'CVCUSDT', 'CTSIUSDT', 'DENTUSDT',
    'STORJUSDT', 'KNCUSDT', 'MTLUSDT', 'NKNUSDT', 'WRXUSDT', 'TWTUSDT', 'BTSUSDT', 'ARDRUSDT', 'LPTUSDT', 'COTIUSDT',
    'MITHUSDT', 'MBLUSDT', 'DOCKUSDT', 'CTKUSDT', 'AKROUSDT', 'TROYUSDT', 'DIAUSDT', 'PONDUSDT', 'LINAUSDT', 'FETUSDT',
    'PERLUSDT', 'RIFUSDT', 'STPTUSDT', 'MDTUSDT', 'AVAUSDT', 'XVSUSDT', 'ALPHAUSDT', 'UNFIUSDT', 'FLMUSDT', 'ORNUSDT',
    'UTKUSDT', 'TRBUSDT', 'DODOUSDT', 'REEFUSDT', 'LITUSDT', 'SFPUSDT', 'DUSKUSDT', 'COVERUSDT', 'FORTHUSDT', 'RAMPUSDT'
];

// Local storage functions
function saveSelectedPairs() {
    localStorage.setItem('selectedPairs', JSON.stringify(Array.from(selectedPairs)));
}

function loadSelectedPairs() {
    const storedPairs = localStorage.getItem('selectedPairs');
    if (storedPairs) {
        selectedPairs = new Set(JSON.parse(storedPairs));
    }
}

// Initialize tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function numberWithCommas(x) {
    return parseFloat(x).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function createPriceCard(symbol, price, change24h) {
    return `
        <div class="crypto-card" data-symbol="${symbol}">
            <div class="crypto-header">
                <span class="crypto-name">${symbol.replace('USDT', '/USDT')}</span>
                <span class="price-change ${change24h >= 0 ? 'positive' : 'negative'}">
                    ${change24h >= 0 ? '↑' : '↓'} ${Math.abs(change24h).toFixed(2)}%
                </span>
            </div>
            <div class="crypto-price">$${numberWithCommas(price)}</div>
        </div>
    `;
}

function connectWebSocket() {
    if (websocket) {
        websocket.close();
    }

    const pairs = Array.from(selectedPairs);
    if (pairs.length === 0) return;

    const streams = pairs.map(pair => `${pair}@ticker`).join('/');
    websocket = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.e === '24hrTicker') {
            const price = parseFloat(data.c);
            const change24h = parseFloat(data.P);
            const symbol = data.s;
            
            const container = document.getElementById('binance-prices');
            if (!container) return;

            const existingCard = container.querySelector(`[data-symbol="${symbol}"]`);
            const newCardHTML = createPriceCard(symbol, price, change24h);
            
            if (existingCard) {
                existingCard.outerHTML = newCardHTML;
            } else {
                container.insertAdjacentHTML('beforeend', newCardHTML);
            }
        }
    };

    websocket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setTimeout(connectWebSocket, 5000);
    };

    websocket.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        setTimeout(connectWebSocket, 5000);
    };
}

function renderCryptoList(cryptos) {
    const cryptoList = document.getElementById('cryptoList');
    if (!cryptoList) return;

    cryptoList.innerHTML = '';

    cryptos.forEach(crypto => {
        const cryptoItem = document.createElement('label');
        cryptoItem.className = 'crypto-item';
        
        const isChecked = selectedPairs.has(crypto.toLowerCase());
        
        cryptoItem.innerHTML = `
            <input type="checkbox" value="${crypto.toLowerCase()}" ${isChecked ? 'checked' : ''}>
            ${crypto.replace('USDT', '/USDT')}
        `;

        const checkbox = cryptoItem.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedPairs.add(checkbox.value);
            } else {
                selectedPairs.delete(checkbox.value);
            }
            saveSelectedPairs();
            connectWebSocket();
        });

        cryptoList.appendChild(cryptoItem);
    });
}

function populateCryptoList() {
    const searchInput = document.getElementById('cryptoSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCryptos = top100Cryptos.filter(crypto => 
            crypto.toLowerCase().includes(searchTerm)
        );
        renderCryptoList(filteredCryptos);
    });

    renderCryptoList(top100Cryptos);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadSelectedPairs();
    initializeTabs();
    populateCryptoList();
    connectWebSocket();
});
