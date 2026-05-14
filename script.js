const bankPrice = {
    ABC: { buy: 0.01, sell: -0.005 },
    NEW: { buy: 0.02, sell: -0.01 },
    AME: { buy: 0.015, sell: -0.015 },
    RED: { buy: 0.005, sell: -0.005 }
};

let sourceCurrency = "RUB";
let toCurrency = "USD";
let bankCurrency = "NEW";

const fromInput = document.getElementById("from-amount");
const toInput = document.getElementById("to-amount");
const fromRateLabel = document.getElementById("from-rate-text");
const toRateLabel = document.getElementById("to-rate-text");
const buyBox = document.getElementById("buy-value");
const sellBox = document.getElementById("sell-value");

const offlineAlert = document.createElement("div");
offlineAlert.innerText = "İnternet bağlantısı yoxdur!";
offlineAlert.className = "offline-msg hidden";
document.querySelector(".converter-container").append(offlineAlert);


function checkInput(input) {
    let val = input.value;
    val = val.replace(/[^0-9.]/g, '');
     
    let parts = val.split('.');
    if(parts[1] && parts[1].length > 4) {
    val = parts[0] + '.' + parts[1].slice(0, 4);
}
    if (parseFloat(val) > 10000) {
        val = "10000";
    }
    input.value = val;
}

function updateBank(principal, exchangeRate) {
    if (principal === 0 || !exchangeRate) {
        buyBox.innerText = "0.0000";
        sellBox.innerText = "0.0000";
        return;
    }

    const bankInfo = bankPrice[bankCurrency];
    const mainConversion = principal * exchangeRate;

    const endBuy = mainConversion * (1 + bankInfo.buy);
    const endSell = mainConversion * (1 + bankInfo.sell);

    buyBox.innerText = endBuy.toFixed(4);
    sellBox.innerText = endSell.toFixed(4);
}

function startConversion() {
    const amount = parseFloat(fromInput.value) || 0;

    if (navigator.onLine === false) {
        offlineAlert.classList.remove("hidden");
        
        const storageKey = sourceCurrency + "_" + toCurrency;
        const cachedData = localStorage.getItem(storageKey);

        if (cachedData) {
            const rate = parseFloat(cachedData);
            toInput.value = (amount * rate).toFixed(4);
            fromRateLabel.innerText = "1 " + sourceCurrency + " = " + rate + " " + toCurrency;
            toRateLabel.innerText = "1 " + toCurrency + " = " + (1 / rate).toFixed(4) + " " + sourceCurrency;
            updateBank(amount, rate);
        }
        return;
    }

    offlineAlert.classList.add("hidden");
    const apiPath = "https://open.er-api.com/v6/latest/" + sourceCurrency;

    fetch(apiPath)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            const rate = data.rates[toCurrency];
            
            localStorage.setItem(sourceCurrency + "_" + toCurrency, rate);

       
            toInput.value = (amount * rate).toFixed(4);
            fromRateLabel.innerText = "1 " + sourceCurrency + " = " + rate.toFixed(4) + " " + toCurrency;
            toRateLabel.innerText = "1 " + toCurrency + " = " + (1 / rate).toFixed(4) + " " + sourceCurrency;

            updateBank(amount, rate);
        })
        .catch(function(error) {
            console.error("Xəta baş verdi:", error);
        });
}


fromInput.addEventListener("input", function() {
    checkInput(fromInput);
    startConversion();
});

toInput.addEventListener("input", function() {
    checkInput(toInput);
    const amount = parseFloat(toInput.value) || 0;
    const key = fromCurrency + "_" + toCurrency;
    const cachedRate = parseFloat(localStorage.getItem(key));

    if (cachedRate) {
        const principal = amount / cachedRate;
        fromInput.value = principal.toFixed(4);
        updateBank(principal, cachedRate);
    }
});

const fromCurrencyBtns = document.querySelectorAll("#from-tabs .tab-btn");
for (let i = 0; i < fromCurrencyBtns.length; i++) {
    fromCurrencyBtns[i].addEventListener("click", function() {
        fromCurrency = fromCurrencyBtns[i].getAttribute("data-currency");
        startConversion();
    });
}

const toCurrencyBtns = document.querySelectorAll("#to-tabs .tab-btn");
for (let j = 0; j < toCurrencyBtns.length; j++) {
    toCurrencyBtns[j].addEventListener("click", function() {
        toCurrency = toCurrencyBtns[j].getAttribute("data-currency");
        startConversion();
    });
}

const bankChoiceBtns = document.querySelectorAll("#bank-tabs .tab-btn");
for (let k = 0; k < bankChoiceBtns.length; k++) {
    bankChoiceBtns[k].addEventListener("click", function() {
        currentBank = bankChoiceBtns[k].getAttribute("data-bank");
        startConversion();
    });
}


window.addEventListener("offline", function() {
    offlineAlert.classList.remove("hidden");
});
window.addEventListener("online", function() {
    offlineAlert.classList.add("hidden");
    startConversion();
});

startConversion();