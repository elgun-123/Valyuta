const bankPrice = {
    ABC: { buy: -0.01, sell: 0.005 },
    NEW: { buy: -0.02, sell: 0.01 },
    AME: { buy: -0.015, sell: 0.015 },
    RED: { buy: -0.005, sell: 0.005 }
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
    if (parts[1] && parts[1].length > 4) {
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

    let bankInfo;
    if (sourceCurrency === toCurrency) {
        bankInfo = { buy: 0, sell: 0 };
    } else {
        bankInfo = bankPrice[bankCurrency];
    }

    const mainConversion = principal * exchangeRate;

    const endBuy = mainConversion * (1 + bankInfo.buy);
    const endSell = mainConversion * (1 + bankInfo.sell);

    buyBox.innerText = endBuy.toFixed(4);
    sellBox.innerText = endSell.toFixed(4);
}

function startConversion() {
    const amount = parseFloat(fromInput.value) || 0;
    const storageKey = sourceCurrency + "_" + toCurrency;

    if (navigator.onLine === false) {
        offlineAlert.classList.remove("hidden");

        const cachedData = localStorage.getItem(storageKey);

        if (cachedData) {
            const rate = parseFloat(cachedData);
            toInput.value = (amount * rate).toFixed(4);
            fromRateLabel.innerText = "1 " + sourceCurrency + " = " + rate + " " + toCurrency;
            toRateLabel.innerText = "1 " + toCurrency + " = " + (1 / rate).toFixed(4) + " " + sourceCurrency;
            updateBank(amount, rate);
        } else {
            toInput.value = "";
            fromRateLabel.innerText = "Yaddaşda məlumat yoxdur";
            toRateLabel.innerText = "";
            buyBox.innerText = "0.0000";
            sellBox.innerText = "0.0000";
        }
        return;
    }

    offlineAlert.classList.add("hidden");
    const apiPath = "https://open.er-api.com/v6/latest/" + sourceCurrency;

    fetch(apiPath)
        .then(response => response.json())
        .then(data => {
            const rate = data.rates[toCurrency];

            localStorage.setItem(storageKey, rate);

            toInput.value = (amount * rate).toFixed(4);
            fromRateLabel.innerText = "1 " + sourceCurrency + " = " + rate.toFixed(4) + " " + toCurrency;
            toRateLabel.innerText = "1 " + toCurrency + " = " + (1 / rate).toFixed(4) + " " + sourceCurrency;

            updateBank(amount, rate);
        })
        .catch(error => console.error("Xəta:", error));
}

fromInput.addEventListener("input", function () {
    checkInput(fromInput);
    startConversion();
});

toInput.addEventListener("input", function () {
    checkInput(toInput);
    const amount = parseFloat(toInput.value) || 0;
    const key = sourceCurrency + "_" + toCurrency;
    const cachedRate = parseFloat(localStorage.getItem(key));

    if (cachedRate) {
        const principal = amount / cachedRate;
        fromInput.value = principal.toFixed(4);
        updateBank(principal, cachedRate);
    }
});

const fromCurrencyBtns = document.querySelectorAll("#from-tabs .tab-btn");
fromCurrencyBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelector("#from-tabs .tab-btn.active")?.classList.remove("active");
        this.classList.add("active");
        sourceCurrency = this.getAttribute("data-currency");
        startConversion();
    });
});

const toCurrencyBtns = document.querySelectorAll("#to-tabs .tab-btn");
toCurrencyBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelector("#to-tabs .tab-btn.active")?.classList.remove("active");
        this.classList.add("active");
        toCurrency = this.getAttribute("data-currency");
        startConversion();
    });
});

const bankChoiceBtns = document.querySelectorAll("#bank-tabs .tab-btn");
bankChoiceBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelector("#bank-tabs .tab-btn.active")?.classList.remove("active");
        this.classList.add("active");
        bankCurrency = this.getAttribute("data-bank");
        startConversion();
    });
});

window.addEventListener("offline", () => offlineAlert.classList.remove("hidden"));
window.addEventListener("online", () => {
    offlineAlert.classList.add("hidden");
    startConversion();
});

startConversion();