const fs = require("fs");
const path = require("path");
const { generateInsights } = require("./insightEngine");

const dataPath = path.join(
  __dirname,
  "../data/transactions.json"
);

const data = JSON.parse(
  fs.readFileSync(dataPath, "utf-8")
);

const transactions = data.transactions;

/*
====================================================
BASIC METRICS
====================================================
*/

function calculateBasicMetrics() {

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

  const failureRate =
    totalTransactions > 0
      ? (failedTransactions / totalTransactions) * 100
      : 0;

  return {
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    totalRevenue,
    failedRevenue,
    failureRate: Number(
      failureRate.toFixed(2)
    )
  };
}


/*
====================================================
PAYMENT METHOD ANALYSIS
====================================================
*/

function analyzePaymentMethods() {

  const methods = {};

  transactions.forEach((transaction) => {

    const method = transaction.paymentMethod;

    if (!methods[method]) {

      methods[method] = {
        total: 0,
        failed: 0,
        revenueAtRisk: 0
      };

    }

    methods[method].total++;

    if (transaction.status === "FAILED") {

      methods[method].failed++;

      methods[method].revenueAtRisk +=
        transaction.amount;

    }

  });


  return Object.entries(methods)
    .map(([method, stats]) => {

      const failureRate =
        stats.total > 0
          ? (stats.failed / stats.total) * 100
          : 0;

      return {
        method,

        totalTransactions: stats.total,

        failedTransactions: stats.failed,

        failureRate: Number(
          failureRate.toFixed(2)
        ),

        revenueAtRisk: stats.revenueAtRisk
      };

    })
    .sort(
      (a, b) =>
        b.failureRate - a.failureRate
    );
}


/*
====================================================
TIME WINDOW ANALYSIS
====================================================
*/

function analyzeTimeWindows() {

  const windows = {
    "00-06": {
      total: 0,
      failed: 0,
      revenueAtRisk: 0
    },

    "06-12": {
      total: 0,
      failed: 0,
      revenueAtRisk: 0
    },

    "12-18": {
      total: 0,
      failed: 0,
      revenueAtRisk: 0
    },

    "18-24": {
      total: 0,
      failed: 0,
      revenueAtRisk: 0
    }
  };


  transactions.forEach((transaction) => {

    const hour =
      new Date(transaction.timestamp)
        .getHours();

    let window;

    if (hour < 6) {
      window = "00-06";
    }

    else if (hour < 12) {
      window = "06-12";
    }

    else if (hour < 18) {
      window = "12-18";
    }

    else {
      window = "18-24";
    }


    windows[window].total++;


    if (transaction.status === "FAILED") {

      windows[window].failed++;

      windows[window].revenueAtRisk +=
        transaction.amount;

    }

  });


  return Object.entries(windows)
    .map(([window, stats]) => {

      const failureRate =
        stats.total > 0
          ? (stats.failed / stats.total) * 100
          : 0;

      return {

        window,

        totalTransactions: stats.total,

        failedTransactions: stats.failed,

        failureRate: Number(
          failureRate.toFixed(2)
        ),

        revenueAtRisk:
          stats.revenueAtRisk

      };

    })
    .sort(
      (a, b) =>
        b.failureRate - a.failureRate
    );
}


/*
====================================================
UPI EVENING ANOMALY ANALYSIS
====================================================
*/

function detectUpiEveningAnomaly() {

  const normalTransactions =
    transactions.filter((transaction) => {

      const date =
        new Date(transaction.timestamp);

      const hour =
        date.getHours();

      return !(
        transaction.paymentMethod === "UPI" &&
        hour >= 18 &&
        hour <= 21
      );

    });


  const affectedTransactions =
    transactions.filter((transaction) => {

      const date =
        new Date(transaction.timestamp);

      const hour =
        date.getHours();

      return (
        transaction.paymentMethod === "UPI" &&
        hour >= 18 &&
        hour <= 21
      );

    });


  const normalFailures =
    normalTransactions.filter(
      (t) => t.status === "FAILED"
    ).length;


  const affectedFailures =
    affectedTransactions.filter(
      (t) => t.status === "FAILED"
    ).length;


  const normalFailureRate =
    normalTransactions.length > 0
      ? (
          normalFailures /
          normalTransactions.length
        ) * 100
      : 0;


  const affectedFailureRate =
    affectedTransactions.length > 0
      ? (
          affectedFailures /
          affectedTransactions.length
        ) * 100
      : 0;


  const increase =
    normalFailureRate > 0
      ? (
          (
            affectedFailureRate -
            normalFailureRate
          ) /
          normalFailureRate
        ) * 100
      : 0;


  const revenueAtRisk =
    affectedTransactions
      .filter(
        (t) => t.status === "FAILED"
      )
      .reduce(
        (sum, t) => sum + t.amount,
        0
      );


  return {

    detected:
      affectedFailureRate >
      normalFailureRate * 2,

    paymentMethod: "UPI",

    timeWindow: "18:00 - 21:00",

    normalFailureRate:
      Number(
        normalFailureRate.toFixed(2)
      ),

    affectedFailureRate:
      Number(
        affectedFailureRate.toFixed(2)
      ),

    increasePercentage:
      Number(
        increase.toFixed(2)
      ),

    affectedTransactions:
      affectedTransactions.length,

    affectedFailures,

    revenueAtRisk

  };

}


/*
====================================================
RUN COMPLETE ANALYSIS
====================================================
*/

function runAnalytics() {

  const basicMetrics =
    calculateBasicMetrics();

  const paymentMethods =
    analyzePaymentMethods();

  const timeWindows =
    analyzeTimeWindows();

  const anomaly =
    detectUpiEveningAnomaly();


  const analytics = {

    basicMetrics,

    paymentMethods,

    timeWindows,

    anomaly

  };


  const insights =
    generateInsights(analytics);


  return {

    ...analytics,

    insights

  };

}


/*
====================================================
RUN ENGINE
====================================================
*/

const results =
  runAnalytics();


console.log(
  "\n===================================="
);

console.log(
  "      MERCHANTPULSE ANALYTICS"
);

console.log(
  "====================================\n"
);


console.log(
  "BASIC METRICS"
);

console.log(
  "----------------------------"
);

console.log(
  `Transactions: ${results.basicMetrics.totalTransactions}`
);

console.log(
  `Failed: ${results.basicMetrics.failedTransactions}`
);

console.log(
  `Failure Rate: ${results.basicMetrics.failureRate}%`
);

console.log(
  `Revenue: ₹${results.basicMetrics.totalRevenue}`
);

console.log(
  `Revenue At Risk: ₹${results.basicMetrics.failedRevenue}`
);


console.log(
  "\nPAYMENT METHODS"
);

console.log(
  "----------------------------"
);

results.paymentMethods.forEach(
  (method) => {

    console.log(
      `${method.method}: ${method.failureRate}% failure rate`
    );

  }
);


console.log(
  "\nTIME WINDOWS"
);

console.log(
  "----------------------------"
);

results.timeWindows.forEach(
  (window) => {

    console.log(
      `${window.window}: ${window.failureRate}% failure rate`
    );

  }
);


console.log(
  "\nANOMALY DETECTION"
);

console.log(
  "----------------------------"
);


if (results.anomaly.detected) {

  console.log(
    "🚨 ANOMALY DETECTED"
  );

  console.log(
    `Payment Method: ${results.anomaly.paymentMethod}`
  );

  console.log(
    `Time Window: ${results.anomaly.timeWindow}`
  );

  console.log(
    `Normal Failure Rate: ${results.anomaly.normalFailureRate}%`
  );

  console.log(
    `Affected Failure Rate: ${results.anomaly.affectedFailureRate}%`
  );

  console.log(
    `Increase: ${results.anomaly.increasePercentage}%`
  );

  console.log(
    `Affected Transactions: ${results.anomaly.affectedTransactions}`
  );

  console.log(
    `Revenue At Risk: ₹${results.anomaly.revenueAtRisk}`
  );

}

else {

  console.log(
    "No significant anomaly detected."
  );

}

console.log(
  "\nINSIGHTS"
);

console.log(
  "----------------------------"
);

results.insights.forEach(
  (insight) => {

    console.log(
      `\n[${insight.severity}] ${insight.title}`
    );

    console.log(
      insight.message
    );

    console.log(
      `Recommendation: ${insight.recommendation}`
    );

  }
);


console.log(
  "\n====================================\n"
);


module.exports = {
  runAnalytics
};