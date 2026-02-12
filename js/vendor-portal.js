// Vendor portal client logic (simplified demo)

document.addEventListener('DOMContentLoaded', function(){
  // Mock vendor name
  const vendorNameEl = document.getElementById('vendorName');
  if(vendorNameEl) vendorNameEl.textContent = 'Aisha - Stall 12';

  // Order quantity controls
  const inc = document.getElementById('increaseQty');
  const dec = document.getElementById('decreaseQty');
  const qty = document.getElementById('crateQuantity');
  const summaryQty = document.getElementById('summaryQty');
  if(inc && dec && qty){
    inc.addEventListener('click', function(){ qty.value = Number(qty.value)+1; summaryQty.textContent = qty.value; });
    dec.addEventListener('click', function(){ if(Number(qty.value)>1) qty.value = Number(qty.value)-1; summaryQty.textContent = qty.value; });
  }

  // Place order button
  const placeBtn = document.getElementById('placeOrderBtn');
  if(placeBtn){
    placeBtn.addEventListener('click', function(){
      customAlert('Order placed (demo)', 'Order');
    });
  }
});