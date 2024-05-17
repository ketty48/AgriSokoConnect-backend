
function calculateTransactionAmount(quantity, pricePerTon) {
    return quantity * pricePerTon;
}

function calculateTaxAmount(transactionAmount) {
    const taxRate = 0.18;
    return transactionAmount * taxRate;
}

export { calculateTransactionAmount, calculateTaxAmount };
