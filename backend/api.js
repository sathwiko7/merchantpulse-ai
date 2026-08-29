const http = require("http");
const fs = require("fs");
const path = require("path");

const { runAnalytics } = require("./services/analyticsEngine");
const { calculateRecovery } = require("./services/recoveryEngine");
const { generateInsights } = require("./services/insightEngine");

const PORT = 5000;


/*
====================================================
LOAD DATA
====================================================
*/

function loadDataset() {

  const filePath = path.join(
    __dirname,
    "data",
    "transactions.json"
  );

  return JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );

}


/*
====================================================
PREPARE ANALYTICS FOR INSIGHT ENGINE
====================================================
*/

function prepareInsightData(analytics) {

  const basic =
    analytics.basicMetrics ||
    analytics.basic ||
    {};

  let paymentMethods =
    analytics.paymentMethods ||
    [];

  let timeWindows =
    analytics.timeWindows ||
    [];

  /*
  ----------------------------------------------
  PAYMENT METHODS
  ----------------------------------------------
  */

  if (!Array.isArray(paymentMethods)) {

    paymentMethods =
      Object.entries(paymentMethods).map(
        ([method, failureRate]) => ({
          method,
          failureRate: Number(failureRate) || 0,
        })
      );

  }


  /*
  ----------------------------------------------
  TIME WINDOWS
  ----------------------------------------------
  */

  if (!Array.isArray(timeWindows)) {

    timeWindows =
      Object.entries(timeWindows).map(
        ([window, failureRate]) => ({
          window,
          failureRate: Number(failureRate) || 0,
        })
      );

  }


  /*
  ----------------------------------------------
  BASIC METRICS
  ----------------------------------------------
  */

  const basicMetrics = {

    ...basic,

    failedRevenue:
      Number(
        basic.failedRevenue ??
        basic.revenueAtRisk ??
        0
      ),

    failureRate:
      Number(
        basic.failureRate ?? 0
      ),

  };


  /*
  ----------------------------------------------
  ANOMALY
  ----------------------------------------------
  */

  const anomaly =
    analytics.anomaly ||
    analytics.anomalies ||
    null;


  return {

    ...analytics,

    basicMetrics,

    paymentMethods,

    timeWindows,

    anomaly,

  };

}


/*
====================================================
GENERATE INSIGHTS
====================================================
*/

function getInsights(analytics) {

  try {

    const insightData =
      prepareInsightData(analytics);

    return generateInsights(
      insightData
    );

  } catch (error) {

    console.error(
      "Insight generation error:",
      error
    );

    return [];

  }

}


/*
====================================================
SERVER
====================================================
*/

const server = http.createServer((req, res) => {

  /*
  ==================================================
  CORS
  ==================================================
  */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );
res.setHeader(
  "Access-Control-Allow-Methods",
  "GET, OPTIONS"
);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /*
  ==================================================
  OPTIONS
  ==================================================
  */

  if (req.method === "OPTIONS") {

    res.writeHead(204);
    res.end();

    return;
  }


  /*
  ==================================================
  ANALYTICS API
  ==================================================
  */

  if (
    req.method === "GET" &&
    req.url === "/api/analytics"
  ) {

    try {

      /*
      ----------------------------------------------
      RUN EXISTING ANALYTICS
      ----------------------------------------------
      */

      const analytics =
        runAnalytics();


      /*
      ----------------------------------------------
      GENERATE AI INSIGHTS
      ----------------------------------------------
      */

      const insights =
        getInsights(analytics);


      /*
      ----------------------------------------------
      RETURN ANALYTICS + INSIGHTS
      ----------------------------------------------
      */

      const response = {

        ...analytics,

        insights,

      };


      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify(response)
      );

    } catch (error) {

      console.error(
        "Analytics API error:",
        error
      );

      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          error:
            "Failed to generate analytics",
        })
      );
    }

    return;
  }


  /*
  ==================================================
  INSIGHTS API
  ==================================================
  */

  if (
    req.method === "GET" &&
    req.url === "/api/insights"
  ) {

    try {

      /*
      ----------------------------------------------
      RUN ANALYTICS
      ----------------------------------------------
      */

      const analytics =
        runAnalytics();


      /*
      ----------------------------------------------
      GENERATE INSIGHTS
      ----------------------------------------------
      */

      const insights =
        getInsights(analytics);


      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          insights,
          count:
            insights.length,
        })
      );

    } catch (error) {

      console.error(
        "Insights API error:",
        error
      );

      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          error:
            "Failed to generate insights",
        })
      );

    }

    return;
  }


  /*
  ==================================================
  TRANSACTIONS API
  ==================================================
  */

  if (
    req.method === "GET" &&
    req.url === "/api/transactions"
  ) {

    try {

      const dataset =
        loadDataset();

      const transactions =
        dataset.transactions || [];


      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          transactions: dataset,
          count: transactions.length,
        })
      );

    } catch (error) {

      console.error(
        "Transactions API error:",
        error
      );

      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          error:
            "Failed to load transactions",
        })
      );
    }

    return;
  }

  /*
====================================================
RECOVERY API
====================================================
*/

if (
  req.method === "GET" &&
  req.url === "/api/recovery"
) {

  try {

    /*
    ----------------------------------------------
    LOAD DATASET
    ----------------------------------------------
    */

    const dataset = loadDataset();

    const transactions =
      dataset.transactions || [];


    /*
    ----------------------------------------------
    RUN ANALYTICS
    ----------------------------------------------
    */

    const analytics =
      runAnalytics();


    /*
    ----------------------------------------------
    CALCULATE RECOVERY FOR FAILED PAYMENTS
    ----------------------------------------------
    */

    const opportunities = transactions
      .filter(
        (transaction) =>
          transaction.status === "FAILED"
      )
      .map(
        (transaction) => {

          const recovery =
            calculateRecovery(
              transaction,
              analytics
            );

          return {
            transaction,
            recovery
          };

        }
      );


    /*
    ----------------------------------------------
    SUMMARY
    ----------------------------------------------
    */

    const totalFailed =
      opportunities.length;

    const highPriority =
      opportunities.filter(
        (item) =>
          item.recovery.priority === "HIGH"
      ).length;

    const mediumPriority =
      opportunities.filter(
        (item) =>
          item.recovery.priority === "MEDIUM"
      ).length;

    const lowPriority =
      opportunities.filter(
        (item) =>
          item.recovery.priority === "LOW"
      ).length;

    const eligible =
      opportunities.filter(
        (item) =>
          item.recovery.eligible
      ).length;

    const estimatedRecovery =
      opportunities.reduce(
        (total, item) =>
          total +
          Number(
            item.recovery.estimatedRecovery || 0
          ),
        0
      );


    /*
    ----------------------------------------------
    SORT BY PRIORITY + RECOVERY VALUE
    ----------------------------------------------
    */

    const priorityOrder = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    opportunities.sort(
      (a, b) => {

        const priorityDifference =
          priorityOrder[
            b.recovery.priority
          ] -
          priorityOrder[
            a.recovery.priority
          ];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          Number(
            b.recovery.estimatedRecovery || 0
          ) -
          Number(
            a.recovery.estimatedRecovery || 0
          )
        );

      }
    );


    /*
    ----------------------------------------------
    RESPONSE
    ----------------------------------------------
    */

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({

        summary: {
          totalFailed,
          eligible,
          highPriority,
          mediumPriority,
          lowPriority,
          estimatedRecovery
        },

        opportunities

      })
    );

  } catch (error) {

    console.error(
      "Recovery API error:",
      error
    );

    res.writeHead(500, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        error:
          "Failed to generate recovery opportunities"
      })
    );

  }

  return;
}

/*
====================================================
RECOVERY API
====================================================
Returns recovery opportunities for failed payments.
====================================================
*/

if (
  req.method === "GET" &&
  req.url === "/api/recovery"
) {

  try {

    const dataset = loadDataset();

    const transactions =
      dataset.transactions || [];

    const analytics =
      runAnalytics();

    const opportunities =
      transactions
        .filter(
          transaction =>
            transaction.status === "FAILED"
        )
        .map(transaction => {

          const recovery =
            calculateRecovery(
              transaction,
              analytics
            );

          return {
            id: transaction.id,
            amount: Number(transaction.amount || 0),
            paymentMethod:
              transaction.paymentMethod || "UNKNOWN",
            timestamp: transaction.timestamp,
            status: transaction.status,
            ...recovery
          };

        });


    /*
    ================================================
    PRIORITY COUNTS
    ================================================
    */

    const highPriority =
      opportunities.filter(
        item => item.priority === "HIGH"
      );

    const mediumPriority =
      opportunities.filter(
        item => item.priority === "MEDIUM"
      );

    const lowPriority =
      opportunities.filter(
        item => item.priority === "LOW"
      );


    /*
    ================================================
    TOTAL ESTIMATED RECOVERY
    ================================================
    */

    const estimatedRecovery =
      opportunities.reduce(
        (total, item) =>
          total + item.estimatedRecovery,
        0
      );


    /*
    ================================================
    RESPONSE
    ================================================
    */

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({

        summary: {

          totalFailed:
            opportunities.length,

          eligible:
            opportunities.filter(
              item => item.eligible
            ).length,

          highPriority:
            highPriority.length,

          mediumPriority:
            mediumPriority.length,

          lowPriority:
            lowPriority.length,

          estimatedRecovery

        },

        opportunities

      })
    );

  } catch (error) {

    console.error(
      "Recovery API error:",
      error
    );

    res.writeHead(500, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        error:
          "Failed to generate recovery data"
      })
    );

  }

  return;
}

/*
====================================================
RECOVERY ACTION API
====================================================
Simulates an actual recovery attempt for a
failed transaction.
====================================================
*/

if (
  req.method === "POST" &&
  req.url.startsWith("/api/recovery/") &&
  req.url.endsWith("/execute")
) {

  try {

    /*
    ----------------------------------------------
    GET TRANSACTION ID
    ----------------------------------------------
    */

    const transactionId =
      decodeURIComponent(
        req.url
          .replace("/api/recovery/", "")
          .replace("/execute", "")
      );


    /*
    ----------------------------------------------
    LOAD DATASET
    ----------------------------------------------
    */

    const dataset =
      loadDataset();

    const transactions =
      dataset.transactions || [];


    /*
    ----------------------------------------------
    FIND TRANSACTION
    ----------------------------------------------
    */

    const transaction =
      transactions.find(
        item => item.id === transactionId
      );


    /*
    ----------------------------------------------
    TRANSACTION NOT FOUND
    ----------------------------------------------
    */

    if (!transaction) {

      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          success: false,
          error: "Transaction not found",
          transactionId
        })
      );

      return;
    }


    /*
    ----------------------------------------------
    CHECK TRANSACTION STATUS
    ----------------------------------------------
    */

    if (transaction.status !== "FAILED") {

      res.writeHead(400, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          success: false,
          error:
            "Only failed transactions can be recovered."
        })
      );

      return;
    }


    /*
    ----------------------------------------------
    RUN ANALYTICS
    ----------------------------------------------
    */

    const analytics =
      runAnalytics();


    /*
    ----------------------------------------------
    CALCULATE RECOVERY INTELLIGENCE
    ----------------------------------------------
    */

    const recovery =
      calculateRecovery(
        transaction,
        analytics
      );


    /*
    ----------------------------------------------
    SIMULATE RECOVERY ATTEMPT
    ----------------------------------------------
    */

    const recoveryChance =
      recovery.recoveryProbability / 100;

    const recovered =
      Math.random() < recoveryChance;


    /*
    ----------------------------------------------
    RESPONSE
    ----------------------------------------------
    */

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({

        success: true,

        transactionId,

        status:
          recovered
            ? "RECOVERED"
            : "FAILED",

        recovered,

        amount:
          Number(transaction.amount || 0),

        recoveredAmount:
          recovered
            ? Number(transaction.amount || 0)
            : 0,

        recoveryProbability:
          recovery.recoveryProbability,

        recommendedAction:
          recovery.recommendedAction,

        message:
          recovered
            ? "Payment recovered successfully."
            : "Recovery attempt failed. Try another payment method.",

        attemptedAt:
          new Date().toISOString()

      })
    );


  } catch (error) {

    console.error(
      "Recovery action error:",
      error
    );

    res.writeHead(500, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({

        success: false,

        error:
          "Failed to execute recovery attempt"

      })
    );

  }

  return;
}

  /*
  ==================================================
  TRANSACTION DETAIL + RECOVERY
  ==================================================
  */

  if (
    req.method === "GET" &&
    req.url.startsWith(
      "/api/transactions/"
    )
  ) {

    try {

      /*
      ----------------------------------------------
      GET ID
      ----------------------------------------------
      */

      const transactionId =
        decodeURIComponent(
          req.url.replace(
            "/api/transactions/",
            ""
          )
        );


      /*
      ----------------------------------------------
      LOAD DATASET
      ----------------------------------------------
      */

      const dataset =
        loadDataset();


      /*
      ----------------------------------------------
      GET TRANSACTION ARRAY
      ----------------------------------------------
      */

      const transactions =
        dataset.transactions || [];


      /*
      ----------------------------------------------
      FIND TRANSACTION
      ----------------------------------------------
      */

      const transaction =
        transactions.find(
          (item) =>
            item.id === transactionId
        );


      /*
      ----------------------------------------------
      NOT FOUND
      ----------------------------------------------
      */

      if (!transaction) {

        res.writeHead(404, {
          "Content-Type":
            "application/json",
        });

        res.end(
          JSON.stringify({
            error:
              "Transaction not found",

            transactionId,
          })
        );

        return;
      }


      /*
      ----------------------------------------------
      RUN ANALYTICS
      ----------------------------------------------
      */

      const analytics =
        runAnalytics();


      /*
      ----------------------------------------------
      CALCULATE RECOVERY
      ----------------------------------------------
      */

      const recovery =
        calculateRecovery(
          transaction,
          analytics
        );


      /*
      ----------------------------------------------
      RESPONSE
      ----------------------------------------------
      */

      res.writeHead(200, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({

          transaction,

          recovery,

        })
      );

    } catch (error) {

      console.error(
        "Transaction detail API error:",
        error
      );

      res.writeHead(500, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          error:
            "Failed to load transaction",
        })
      );
    }

    return;
  }


  /*
  ==================================================
  HEALTH CHECK
  ==================================================
  */

  if (
    req.method === "GET" &&
    req.url === "/"
  ) {

    res.writeHead(200, {
      "Content-Type":
        "application/json",
    });

    res.end(
      JSON.stringify({

        status:
          "online",

        service:
          "MerchantPulse API",

      })
    );

    return;
  }


  /*
  ==================================================
  NOT FOUND
  ==================================================
  */

  res.writeHead(404, {
    "Content-Type":
      "application/json",
  });

  res.end(
    JSON.stringify({

      error:
        "Route not found",

    })
  );

});


/*
====================================================
START SERVER
====================================================
*/

server.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "===================================="
    );

    console.log(
      "       MERCHANTPULSE API"
    );

    console.log(
      "===================================="
    );

    console.log(
      `Server running on http://localhost:${PORT}`
    );

    console.log("");

    console.log("Analytics:");

    console.log(
      `http://localhost:${PORT}/api/analytics`
    );

    console.log("");

    console.log("Insights:");

    console.log(
      `http://localhost:${PORT}/api/insights`
    );

    console.log("");

    console.log("Transactions:");

    console.log(
      `http://localhost:${PORT}/api/transactions`
    );

    console.log("");

    console.log("Transaction Detail:");

    console.log(
      `http://localhost:${PORT}/api/transactions/TXN-1000`
    );

    console.log("");

    console.log(
      "===================================="
    );

  }
);