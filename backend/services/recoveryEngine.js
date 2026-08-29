/*
====================================================
MERCHANTPULSE RECOVERY ENGINE
====================================================

Determines whether a failed transaction has a
potential recovery opportunity.

The recovery score is explainable and uses:

1. Transaction amount
2. Payment-method failure behaviour
3. Time-window failure behaviour
4. Overall merchant failure rate
5. Anomaly information

The result is used by the Recovery dashboard.
====================================================
*/


function calculateRecovery(transaction, analytics) {

  /*
  ==================================================
  1. SUCCESSFUL TRANSACTION
  ==================================================
  */

  if (transaction.status !== "FAILED") {

    return {

      eligible: false,

      priority: "NONE",

      recoveryProbability: 0,

      estimatedRecovery: 0,

      recommendedAction:
        "No recovery action required.",

      reason:
        "Transaction completed successfully.",

      paymentMethod:
        transaction.paymentMethod || "UNKNOWN",

      transactionAmount:
        Number(transaction.amount || 0)

    };

  }


  /*
  ==================================================
  2. BASIC TRANSACTION INFORMATION
  ==================================================
  */

  const amount =
    Number(transaction.amount || 0);

  const paymentMethod =
    transaction.paymentMethod || "UNKNOWN";


  /*
  ==================================================
  3. ANALYTICS SAFETY
  ==================================================

  Prevent the recovery engine from crashing if
  analytics data is unavailable.
  ==================================================
  */

  const safeAnalytics =
    analytics || {};

  const basic =
    safeAnalytics.basicMetrics || {};

  const paymentMethods =
    Array.isArray(
      safeAnalytics.paymentMethods
    )
      ? safeAnalytics.paymentMethods
      : [];

  const timeWindows =
    Array.isArray(
      safeAnalytics.timeWindows
    )
      ? safeAnalytics.timeWindows
      : [];

  const anomaly =
    safeAnalytics.anomaly || null;


  /*
  ==================================================
  4. DETERMINE TIME WINDOW
  ==================================================
  */

  const date =
    new Date(transaction.timestamp);

  const hour =
    date.getHours();

  let timeWindow;

  if (hour >= 0 && hour < 6) {

    timeWindow = "00-06";

  }
  else if (hour >= 6 && hour < 12) {

    timeWindow = "06-12";

  }
  else if (hour >= 12 && hour < 18) {

    timeWindow = "12-18";

  }
  else {

    timeWindow = "18-24";

  }


  /*
  ==================================================
  5. FIND PAYMENT-METHOD ANALYTICS
  ==================================================
  */

  const methodData =
    paymentMethods.find(
      (item) =>
        String(item.method).toUpperCase() ===
        String(paymentMethod).toUpperCase()
    );


  const methodFailureRate =
    Number(
      methodData?.failureRate || 0
    );


  /*
  ==================================================
  6. FIND TIME-WINDOW ANALYTICS
  ==================================================
  */

  const windowData =
    timeWindows.find(
      (item) =>
        String(item.window) ===
        String(timeWindow)
    );


  const windowFailureRate =
    Number(
      windowData?.failureRate || 0
    );


  /*
  ==================================================
  7. OVERALL FAILURE RATE
  ==================================================
  */

  const overallFailureRate =
    Number(
      basic.failureRate || 0
    );


  /*
  ==================================================
  8. STARTING RECOVERY SCORE
  ==================================================

  A failed payment begins with a reasonable
  baseline recovery opportunity.
  ==================================================
  */

  let recoveryProbability = 60;


  /*
  ==================================================
  9. EXPLAINABLE SCORE BREAKDOWN
  ==================================================
  */

  const scoreFactors = [];


  /*
  ==================================================
  FACTOR A — PAYMENT METHOD
  ==================================================

  Higher observed failure rate means the payment
  segment is experiencing more failures.

  That doesn't automatically mean recovery is worse.

  It means retry / alternate-method intervention
  may have meaningful value.
  ==================================================
  */

  if (methodFailureRate >= 9) {

    recoveryProbability += 10;

    scoreFactors.push({
      factor: "Payment method",
      value: `${methodFailureRate}% failure rate`,
      impact: "+10",
      explanation:
        `${paymentMethod} is a high-failure payment segment.`
    });

  }
  else if (methodFailureRate >= 7) {

    recoveryProbability += 6;

    scoreFactors.push({
      factor: "Payment method",
      value: `${methodFailureRate}% failure rate`,
      impact: "+6",
      explanation:
        `${paymentMethod} shows elevated failure behaviour.`
    });

  }
  else if (methodFailureRate > 0) {

    recoveryProbability += 3;

    scoreFactors.push({
      factor: "Payment method",
      value: `${methodFailureRate}% failure rate`,
      impact: "+3",
      explanation:
        `${paymentMethod} has an observed failure pattern.`
    });

  }


  /*
  ==================================================
  FACTOR B — TIME WINDOW
  ==================================================
  */

  if (windowFailureRate >= 10) {

    recoveryProbability += 10;

    scoreFactors.push({
      factor: "Time window",
      value:
        `${timeWindow} (${windowFailureRate}%)`,
      impact: "+10",
      explanation:
        `${timeWindow} is an elevated-failure period.`
    });

  }
  else if (windowFailureRate >= 8) {

    recoveryProbability += 6;

    scoreFactors.push({
      factor: "Time window",
      value:
        `${timeWindow} (${windowFailureRate}%)`,
      impact: "+6",
      explanation:
        `${timeWindow} shows elevated payment failures.`
    });

  }
  else if (windowFailureRate > 0) {

    recoveryProbability += 3;

    scoreFactors.push({
      factor: "Time window",
      value:
        `${timeWindow} (${windowFailureRate}%)`,
      impact: "+3",
      explanation:
        `${timeWindow} has an observed failure pattern.`
    });

  }


  /*
  ==================================================
  FACTOR C — OVERALL MERCHANT FAILURE RATE
  ==================================================
  */

  if (overallFailureRate >= 10) {

    recoveryProbability += 8;

    scoreFactors.push({
      factor: "Merchant failure rate",
      value:
        `${overallFailureRate}%`,
      impact: "+8",
      explanation:
        "Overall payment failures are significantly elevated."
    });

  }
  else if (overallFailureRate >= 5) {

    recoveryProbability += 5;

    scoreFactors.push({
      factor: "Merchant failure rate",
      value:
        `${overallFailureRate}%`,
      impact: "+5",
      explanation:
        "Overall payment failures require attention."
    });

  }


  /*
  ==================================================
  FACTOR D — TRANSACTION VALUE
  ==================================================

  Higher-value failed transactions receive higher
  recovery priority because recovering them has
  greater revenue impact.

  This affects the recovery opportunity score
  slightly and strongly affects priority.
  ==================================================
  */

  if (amount >= 10000) {

    recoveryProbability += 7;

    scoreFactors.push({
      factor: "Transaction value",
      value:
        `₹${amount.toLocaleString("en-IN")}`,
      impact: "+7",
      explanation:
        "High-value transaction represents significant revenue exposure."
    });

  }
  else if (amount >= 5000) {

    recoveryProbability += 5;

    scoreFactors.push({
      factor: "Transaction value",
      value:
        `₹${amount.toLocaleString("en-IN")}`,
      impact: "+5",
      explanation:
        "Higher transaction value increases recovery opportunity."
    });

  }
  else if (amount >= 2000) {

    recoveryProbability += 2;

    scoreFactors.push({
      factor: "Transaction value",
      value:
        `₹${amount.toLocaleString("en-IN")}`,
      impact: "+2",
      explanation:
        "Transaction value provides a moderate recovery opportunity."
    });

  }


  /*
  ==================================================
  FACTOR E — ANOMALY
  ==================================================
  */

  if (
    anomaly &&
    anomaly.detected === true
  ) {

    recoveryProbability += 5;

    scoreFactors.push({
      factor: "Anomaly",
      value: "Detected",
      impact: "+5",
      explanation:
        "The transaction belongs to a segment showing unusual behaviour."
    });

  }


  /*
  ==================================================
  10. CAP SCORE
  ==================================================
  */

  recoveryProbability =
    Math.round(
      Math.min(
        Math.max(
          recoveryProbability,
          20
        ),
        95
      )
    );


  /*
  ==================================================
  11. DETERMINE PRIORITY
  ==================================================

  Priority considers both:

  - Recovery probability
  - Revenue exposure
  ==================================================
  */

  let priority = "MEDIUM";


  if (
    amount >= 5000 ||
    recoveryProbability >= 80
  ) {

    priority = "HIGH";

  }
  else if (
    amount < 2000 &&
    recoveryProbability < 70
  ) {

    priority = "LOW";

  }


  /*
  ==================================================
  12. RECOMMENDED ACTION
  ==================================================
  */

  let recommendedAction =
    "Retry payment";


  if (paymentMethod === "UPI") {

    recommendedAction =
      "Retry UPI payment";

  }
  else if (paymentMethod === "NETBANKING") {

    recommendedAction =
      "Retry payment or suggest another method";

  }
  else if (paymentMethod === "CARD") {

    recommendedAction =
      "Retry card payment";

  }
  else if (paymentMethod === "WALLET") {

    recommendedAction =
      "Retry wallet payment";

  }


  /*
  ==================================================
  13. HIGH-RISK ALTERNATIVE PAYMENT ACTION
  ==================================================
  */

  if (
    priority === "HIGH" &&
    paymentMethod === "NETBANKING"
  ) {

    recommendedAction =
      "Retry payment; if unsuccessful, suggest UPI or card";

  }


  /*
  ==================================================
  14. BUILD EXPLAINABLE REASON
  ==================================================
  */

  const reasonParts = [];

  reasonParts.push(
    "The payment failed and represents a potential recovery opportunity."
  );


  if (methodFailureRate > 0) {

    reasonParts.push(
      `${paymentMethod} has an observed failure rate of ${methodFailureRate}%.`
    );

  }


  if (windowFailureRate > 0) {

    reasonParts.push(
      `The transaction occurred during ${timeWindow}, where the observed failure rate is ${windowFailureRate}%.`
    );

  }


  if (amount >= 5000) {

    reasonParts.push(
      `The transaction value of ₹${amount.toLocaleString("en-IN")} increases its revenue recovery priority.`
    );

  }


  if (
    anomaly &&
    anomaly.detected === true
  ) {

    reasonParts.push(
      "The transaction belongs to an anomalous payment segment."
    );

  }


  /*
  ==================================================
  15. ESTIMATED RECOVERY
  ==================================================
  */

  const estimatedRecovery =
    Math.round(
      amount *
      (recoveryProbability / 100)
    );


  /*
  ==================================================
  16. FINAL RESULT
  ==================================================
  */

  return {

    eligible: true,

    priority,

    recoveryProbability,

    estimatedRecovery,

    recommendedAction,

    reason:
      reasonParts.join(" "),

    paymentMethod,

    timeWindow,

    transactionAmount:
      amount,

    /*
    ================================================
    EXPLAINABILITY DATA
    ================================================
    */

    scoreFactors,

    analyticsContext: {

      methodFailureRate,

      windowFailureRate,

      overallFailureRate,

      anomalyDetected:
        Boolean(
          anomaly &&
          anomaly.detected === true
        )

    }

  };

}


module.exports = {
  calculateRecovery
};