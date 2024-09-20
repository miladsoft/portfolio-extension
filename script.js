     const exchanges = {
        binance: {
            url: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
            priceElement: document.getElementById('price-binance'),
            statusElement: document.getElementById('status-binance'),
            parseData: (data) => parseFloat(data.p).toFixed(2)
        },
        bitfinex: {
            url: 'wss://api-pub.bitfinex.com/ws/2',
            priceElement: document.getElementById('price-bitfinex'),
            statusElement: document.getElementById('status-bitfinex'),
            subscribeMessage: JSON.stringify({
                event: "subscribe",
                channel: "ticker",
                pair: "BTCUSD"
            }),
            parseData: (data) => Array.isArray(data) && data[1] && Array.isArray(data[1]) ? parseFloat(data[1][6]).toFixed(2) : null
        },
        kraken: {
            url: 'wss://ws.kraken.com',
            priceElement: document.getElementById('price-kraken'),
            statusElement: document.getElementById('status-kraken'),
            subscribeMessage: JSON.stringify({
                event: "subscribe",
                pair: ["XBT/USD"],
                subscription: { name: "ticker" }
            }),
            parseData: (data) => data[1] && data[1].c ? parseFloat(data[1].c[0]).toFixed(2) : null
        }
    };

    function connectToExchange(exchange) {
        const ws = new WebSocket(exchange.url);

        ws.onopen = () => {
            exchange.statusElement.innerText = 'WebSocket connected';
            if (exchange.subscribeMessage) {
                ws.send(exchange.subscribeMessage);
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const price = exchange.parseData(data);
            if (price) {
                exchange.priceElement.innerText = `$${price}`;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            exchange.priceElement.innerText = 'Error fetching price.';
            exchange.statusElement.innerText = 'WebSocket error occurred. Trying to reconnect...';
            exchange.statusElement.classList.add('error');
            attemptReconnect(exchange);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            exchange.statusElement.innerText = 'WebSocket connection closed. Reconnecting...';
            exchange.priceElement.innerText = 'Connection closed.';
            attemptReconnect(exchange);
        };
    }

    function attemptReconnect(exchange) {
        setTimeout(() => {
            console.log('Reconnecting to WebSocket...');
            exchange.statusElement.innerText = 'Reconnecting...';
            connectToExchange(exchange);
        }, 2000);
    }

    function fetchMempoolPrice() {
        const mempoolPriceElement = document.getElementById('price-mempool');
        const mempoolStatusElement = document.getElementById('status-mempool');

        fetch('https://mempool.space/api/v1/prices')
            .then(response => response.json())
            .then(data => {
                mempoolPriceElement.innerText = `$${data.USD}`;
                mempoolStatusElement.innerText = 'Updated just now';
            })
            .catch(error => {
                console.error('Error fetching Mempool.space price:', error);
                mempoolPriceElement.innerText = 'Error fetching price.';
                mempoolStatusElement.innerText = 'Retrying...';
            });
    }

    Object.values(exchanges).forEach(connectToExchange);
    fetchMempoolPrice(); 
    setInterval(fetchMempoolPrice, 5000);
 