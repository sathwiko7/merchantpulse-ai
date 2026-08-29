/*
====================================================
MERCHANTPULSE INTELLIGENCE ENGINE
====================================================
Explainable decision intelligence for merchant
payment behaviour.

This engine is intentionally deterministic and
explainable: every finding is based on observed
transaction analytics and includes evidence,
confidence, impact and a recommended action.
====================================================
*/

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, Number(value) || 0)
  );
}


function addInsight(insights, insight) {

  insights.push({

    ...insight,

    confidence:
      clamp(
        insight.confidence ?? 70,
        0,
        100
      ),

    evidence:
      insight.evidence || [],

    generatedBy:
      "MerchantPulse Decision Engine",

  });

}


function generateInsights(analytics) {

  const insights = [];

  const basic =
    analytics.basicMetrics || {};

  const paymentMethods =
    analytics.paymentMethods || [];

  const timeWindows =
    analytics.timeWindows || [];

  const anomaly =
    analytics.anomaly;


  /*
  ====================================================
  1. REVENUE RISK
  ====================================================
  */

  const failedRevenue =
    Number(
      basic.failedRevenue || 0
    );

  if (failedRevenue > 0) {

    const failureRate =
      Number(
        basic.failureRate || 0
      );


    addInsight(insights, {

      type:
        "REVENUE_RISK",

      severity:
        failureRate >= 10
          ? "HIGH"
          : "MEDIUM",

      title:
        "Revenue at risk detected",

      message:
        `₹${failedRevenue.toLocaleString("en-IN")} is currently at risk from failed payments.`,

      recommendation:
        "Prioritize failed-payment recovery to reduce revenue leakage.",

      confidence:
        failureRate >= 10
          ? 92
          : 84,

      evidence: [

        `Failed revenue: ₹${failedRevenue.toLocaleString("en-IN")}`,

        `Overall failure rate: ${failureRate}%`,

      ],

    });

  }


  /*
  ====================================================
  2. PAYMENT METHOD INSIGHT
  ====================================================
  */

  if (
    paymentMethods.length > 0
  ) {

    const sortedMethods =
      [...paymentMethods].sort(
        (a, b) =>
          Number(
            b.failureRate || 0
          ) -
          Number(
            a.failureRate || 0
          )
      );


    const highestRiskMethod =
      sortedMethods[0];


    const lowestRiskMethod =
      sortedMethods[
        sortedMethods.length - 1
      ];


    const highestRate =
      Number(
        highestRiskMethod.failureRate || 0
      );


    const lowestRate =
      Number(
        lowestRiskMethod.failureRate || 0
      );


    const gap =
      Math.max(
        0,
        highestRate - lowestRate
      );


    addInsight(insights, {

      type:
        "PAYMENT_METHOD",

      severity:
        highestRate >= 10
          ? "HIGH"
          : "MEDIUM",

      title:
        `${highestRiskMethod.method} has the highest failure rate`,

      message:
        `${highestRiskMethod.method} currently has a ${highestRate}% failure rate, ${gap.toFixed(2)} percentage points above the lowest observed method.`,

      recommendation:
        `Investigate ${highestRiskMethod.method} failures first and compare retry performance against other payment methods.`,

      confidence:
        clamp(
          76 +
          (
            gap >= 3
              ? 12
              : gap >= 1
              ? 7
              : 3
          ),
          0,
          95
        ),

      evidence: [

        `${highestRiskMethod.method}: ${highestRate}% failure rate`,

        `${lowestRiskMethod.method}: ${lowestRate}% failure rate`,

        `Observed gap: ${gap.toFixed(2)} percentage points`,

      ],

    });

  }


  /*
  ====================================================
  3. TIME WINDOW INSIGHT
  ====================================================
  */

  if (
    timeWindows.length > 0
  ) {

    const sortedWindows =
      [...timeWindows].sort(
        (a, b) =>
          Number(
            b.failureRate || 0
          ) -
          Number(
            a.failureRate || 0
          )
      );


    const highestRiskWindow =
      sortedWindows[0];


    const highestRate =
      Number(
        highestRiskWindow.failureRate || 0
      );


    const averageRate =
      timeWindows.reduce(
        (sum, item) =>
          sum +
          Number(
            item.failureRate || 0
          ),
        0
      ) /
      timeWindows.length;


    const elevation =
      highestRate -
      averageRate;


    addInsight(insights, {

      type:
        "TIME_PATTERN",

      severity:
        elevation >= 2 ||
        highestRate >= 10
          ? "HIGH"
          : "MEDIUM",

      title:
        `Highest failure period: ${highestRiskWindow.window}`,

      message:
        `${highestRiskWindow.window} has the highest failure rate at ${highestRate}%, which is ${Math.abs(elevation).toFixed(2)} percentage points ${elevation >= 0 ? "above" : "below"} the average time-window rate.`,

      recommendation:
        `Monitor payment performance closely during ${highestRiskWindow.window} and prioritize recovery for failures in this period.`,

      confidence:
        clamp(
          78 +
          (
            elevation >= 3
              ? 12
              : elevation >= 1
              ? 7
              : 2
          ),
          0,
          95
        ),

      evidence: [

        `Highest period: ${highestRiskWindow.window}`,

        `Failure rate: ${highestRate}%`,

        `Average time-window rate: ${averageRate.toFixed(2)}%`,

      ],

    });

  }


  /*
  ====================================================
  4. OVERALL FAILURE RATE
  ====================================================
  */

  const failureRate =
    Number(
      basic.failureRate || 0
    );


  if (
    failureRate >= 10
  ) {

    addInsight(insights, {

      type:
        "FAILURE_RATE",

      severity:
        "HIGH",

      title:
        "Payment failure rate is high",

      message:
        `Overall payment failure rate is ${failureRate}%.`,

      recommendation:
        "Investigate payment failures immediately and prioritize recovery for high-value transactions.",

      confidence:
        94,

      evidence: [

        `Overall failure rate: ${failureRate}%`,

        "Threshold for high-risk monitoring: 10%",

      ],

    });

  }


  else if (
    failureRate >= 5
  ) {

    addInsight(insights, {

      type:
        "FAILURE_RATE",

      severity:
        "MEDIUM",

      title:
        "Payment failures require attention",

      message:
        `Overall payment failure rate is ${failureRate}%.`,

      recommendation:
        "Monitor failed transactions and identify recurring failure patterns.",

      confidence:
        88,

      evidence: [

        `Overall failure rate: ${failureRate}%`,

        "Threshold for attention: 5%",

      ],

    });

  }


  /*
  ====================================================
  5. ANOMALY
  ====================================================
  */

  if (
    anomaly &&
    anomaly.detected
  ) {

    const affectedRate =
      Number(
        anomaly.affectedFailureRate || 0
      );


    addInsight(insights, {

      type:
        "ANOMALY",

      severity:
        "HIGH",

      title:
        "Payment anomaly detected",

      message:
        `${anomaly.paymentMethod} payments during ${anomaly.timeWindow} show an elevated failure rate of ${affectedRate}%.`,

      recommendation:
        "Investigate the affected payment segment and consider targeted recovery actions.",

      confidence:
        clamp(
          Number(
            anomaly.confidence || 90
          ),
          70,
          99
        ),

      evidence: [

        `Payment method: ${anomaly.paymentMethod}`,

        `Time window: ${anomaly.timeWindow}`,

        `Affected failure rate: ${affectedRate}%`,

      ],

    });

  }


  else {

    addInsight(insights, {

      type:
        "ANOMALY",

      severity:
        "LOW",

      title:
        "No significant anomaly detected",

      message:
        "Current transaction patterns do not indicate a significant anomaly.",

      recommendation:
        "Continue monitoring transaction behaviour for emerging patterns.",

      confidence:
        72,

      evidence: [

        "No significant anomaly was returned by the analytics engine.",

      ],

    });

  }


  /*
  ====================================================
  6. PRIORITIZED ACTION
  ====================================================
  */

  const highSeverityCount =
    insights.filter(
      (item) =>
        item.severity === "HIGH"
    ).length;


  const topInsight =
    insights.find(
      (item) =>
        item.severity === "HIGH"
    ) ||
    insights[0];


  if (topInsight) {

    addInsight(insights, {

      type:
        "PRIORITY_ACTION",

      severity:
        highSeverityCount >= 2
          ? "HIGH"
          : "MEDIUM",

      title:
        "Recommended focus area",

      message:
        topInsight.title,

      recommendation:
        topInsight.recommendation,

      confidence:
        clamp(
          Number(
            topInsight.confidence || 75
          ),
          70,
          95
        ),

      evidence: [

        `Priority findings detected: ${highSeverityCount}`,

        ...(topInsight.evidence || [])
          .slice(0, 2),

      ],

    });

  }


  /*
  ====================================================
  RETURN
  ====================================================
  */

  return insights;

}


module.exports = {
  generateInsights
};