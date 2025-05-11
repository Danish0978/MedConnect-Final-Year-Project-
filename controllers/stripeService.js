const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (amountPKR, metadata) => {
    try {
      // Step 1: Validate minimum PKR amount (Rs. 2)
      if (amountPKR < 2) {
        throw new Error(`Minimum payment is Rs. 2.00`);
      }
  
      // Step 2: Create USD payment intent (guaranteed to work)
      const amountUSD = (amountPKR / 278).toFixed(2); // Current exchange rate
      const amountCents = Math.round(amountUSD * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd', // Using USD avoids PKR restrictions
        metadata: {
          ...metadata,
          originalAmountPKR: amountPKR,
          exchangeRate: 278,
          currencyUsed: 'USD (converted from PKR)'
        }
      });
  
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        convertedAmount: amountUSD,
        originalAmount: amountPKR
      };
    } catch (error) {
      console.error('Stripe Error:', {
        raw: error.raw?.message,
        code: error.code,
        type: error.type
      });
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  };

// Verify Payment via Webhook
exports.verifyPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === "succeeded";
  } catch (error) {
    return false;
  }
};