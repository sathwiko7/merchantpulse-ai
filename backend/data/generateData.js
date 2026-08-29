const fs = require("fs");

const paymentMethods = ["UPI", "CARD", "NETBANKING", "WALLET"];
const statuses = ["SUCCESS", "FAILED"];
const categories = [
  "Electronics",
  "Fashion",
  "Food",
  "Beauty",
  "Home"
];

const cities = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai"
];

const devices = ["Mobile", "Desktop", "Tablet"];

const customers = [
  "Priya",
  "Karan",
  "Rahul",
  "Ananya",
  "Arjun",
  "Sneha",
  "Vikram",
  "Meera",
  "Rohan",
  "Neha"
];

const transactions = [];

const startDate = new Date("2026-08-01T00:00:00");

let transactionNumber = 1000;

for (let day = 0; day < 30; day++) {

  for (let i = 0; i < 40; i++) {

    const date = new Date(startDate);

    date.setDate(startDate.getDate() + day);

    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);

    date.setHours(hour);
    date.setMinutes(minute);

    const paymentMethod =
      paymentMethods[
        Math.floor(Math.random() * paymentMethods.length)
      ];

    const amount =
      Math.floor(Math.random() * 9500) + 500;

    /*
      NORMAL PAYMENT FAILURE RATE
      --------------------------------
      Most transactions should succeed.
    */

    let failureProbability = 0.08;

    /*
      ANOMALY
      --------------------------------
      On the last 3 days,
      UPI failures increase heavily
      between 6 PM and 9 PM.
    */

    if (
      day >= 27 &&
      paymentMethod === "UPI" &&
      hour >= 18 &&
      hour <= 21
    ) {
      failureProbability = 0.55;
    }

    const status =
      Math.random() < failureProbability
        ? "FAILED"
        : "SUCCESS";

    const transaction = {
      id: `TXN-${transactionNumber++}`,

      timestamp: date.toISOString(),

      customer:
        customers[
          Math.floor(Math.random() * customers.length)
        ],

      amount,

      paymentMethod,

      status,

      category:
        categories[
          Math.floor(Math.random() * categories.length)
        ],

      city:
        cities[
          Math.floor(Math.random() * cities.length)
        ],

      device:
        devices[
          Math.floor(Math.random() * devices.length)
        ],

      refunded: false
    };

    transactions.push(transaction);
  }
}

/*
  SUMMARY
*/

const totalTransactions = transactions.length;

const successfulTransactions =
  transactions.filter(
    (t) => t.status === "SUCCESS"
  ).length;

const failedTransactions =
  transactions.filter(
    (t) => t.status === "FAILED"
  ).length;

const totalRevenue = transactions
  .filter((t) => t.status === "SUCCESS")
  .reduce(
    (sum, t) => sum + t.amount,
    0
  );

const failedRevenue = transactions
  .filter((t) => t.status === "FAILED")
  .reduce(
    (sum, t) => sum + t.amount,
    0
  );

const dataset = {
  merchant: {
    name: "Demo Merchant",
    industry: "E-commerce"
  },

  generatedAt: new Date().toISOString(),

  summary: {
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    totalRevenue,
    failedRevenue
  },

  transactions
};

fs.writeFileSync(
  "./data/transactions.json",
  JSON.stringify(dataset, null, 2)
);

console.log("====================================");
console.log("MerchantPulse dataset generated!");
console.log("====================================");

console.log(`Transactions: ${totalTransactions}`);
console.log(`Successful: ${successfulTransactions}`);
console.log(`Failed: ${failedTransactions}`);
console.log(`Revenue: ₹${totalRevenue}`);
console.log(`Failed Revenue: ₹${failedRevenue}`);

console.log("====================================");