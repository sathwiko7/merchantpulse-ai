import { useEffect, useState } from "react";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ====================================================
  FETCH ANALYTICS
  ====================================================
  */

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/analytics"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();

      console.log("MERCHANTPULSE ANALYTICS:", data);

      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
      setError("Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /*
  ====================================================
  LOADING
  ====================================================
  */

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          Loading analytics...
        </div>
      </div>
    );
  }

  /*
  ====================================================
  ERROR
  ====================================================
  */

  if (error || !analytics) {
    return (
      <div className="analytics-page">
        <div className="empty-state">
          {error || "Unable to load analytics."}
        </div>
      </div>
    );
  }

  /*
  ====================================================
  BASIC DATA
  ====================================================
  */

  const basic =
    analytics.basic ||
    analytics.basicMetrics ||
    analytics.metrics ||
    {};


  /*
  ====================================================
  IMPORTANT:
  SUPPORT BOTH POSSIBLE BACKEND PROPERTY NAMES
  ====================================================
  */

  const totalTransactions = Number(
    basic.totalTransactions ??
    basic.transactions ??
    basic.total ??
    analytics.totalTransactions ??
    0
  );

  const failedTransactions = Number(
    basic.failedTransactions ??
    basic.failed ??
    basic.failedCount ??
    analytics.failedTransactions ??
    0
  );

  const successfulTransactions = Number(
    basic.successfulTransactions ??
    basic.successful ??
    basic.success ??
    analytics.successfulTransactions ??
    (totalTransactions - failedTransactions)
  );

  const failureRate = Number(
    basic.failureRate ??
    basic.failure_rate ??
    analytics.failureRate ??
    0
  );

  const totalRevenue = Number(
    basic.totalRevenue ??
    basic.revenue ??
    basic.totalRevenueGenerated ??
    analytics.totalRevenue ??
    analytics.revenue ??
    0
  );

  const failedRevenue = Number(
    basic.failedRevenue ??
    basic.revenueAtRisk ??
    basic.failedRevenueAmount ??
    basic.revenue_at_risk ??
    analytics.failedRevenue ??
    analytics.revenueAtRisk ??
    0
  );


  /*
  ====================================================
  PAYMENT METHODS
  ====================================================
  */

  const rawPaymentMethods =
    analytics.paymentMethods || {};

  let methodEntries = [];

  if (Array.isArray(rawPaymentMethods)) {

    methodEntries = rawPaymentMethods.map(
      (item) => ({
        name:
          item.method ||
          item.paymentMethod ||
          item.name ||
          "Unknown",

        rate: Number(
          item.failureRate ??
          item.rate ??
          item.failure_rate ??
          0
        ),
      })
    );

  } else {

    methodEntries = Object.entries(
      rawPaymentMethods
    ).map(([method, value]) => {

      let rate = 0;

      if (
        typeof value === "number" ||
        typeof value === "string"
      ) {
        rate = Number(value);
      }

      if (
        value &&
        typeof value === "object"
      ) {
        rate = Number(
          value.failureRate ??
          value.rate ??
          value.failure_rate ??
          0
        );
      }

      return {
        name: method,
        rate: Number.isFinite(rate)
          ? rate
          : 0,
      };
    });
  }


  /*
  ====================================================
  TIME WINDOWS
  ====================================================
  */

  const rawTimeWindows =
    analytics.timeWindows || {};

  let timeEntries = [];

  if (Array.isArray(rawTimeWindows)) {

    timeEntries = rawTimeWindows.map(
      (item) => ({
        name:
          item.timeWindow ||
          item.time ||
          item.window ||
          item.name ||
          "Unknown",

        rate: Number(
          item.failureRate ??
          item.rate ??
          item.failure_rate ??
          0
        ),
      })
    );

  } else {

    timeEntries = Object.entries(
      rawTimeWindows
    ).map(([time, value]) => {

      let rate = 0;

      if (
        typeof value === "number" ||
        typeof value === "string"
      ) {
        rate = Number(value);
      }

      if (
        value &&
        typeof value === "object"
      ) {
        rate = Number(
          value.failureRate ??
          value.rate ??
          value.failure_rate ??
          0
        );
      }

      return {
        name: time,
        rate: Number.isFinite(rate)
          ? rate
          : 0,
      };
    });
  }


  /*
  ====================================================
  INSIGHTS
  ====================================================
  */

  const insights = Array.isArray(
    analytics.insights
  )
    ? analytics.insights
    : [];


  /*
  ====================================================
  ANOMALIES
  ====================================================
  */

  const anomalies = Array.isArray(
    analytics.anomalies
  )
    ? analytics.anomalies
    : [];


  /*
  ====================================================
  FORMAT CURRENCY
  ====================================================
  */

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;


  /*
  ====================================================
  FIND HIGHEST METHOD
  ====================================================
  */

  const highestMethod =
    methodEntries.length > 0
      ? methodEntries.reduce(
          (highest, current) =>
            current.rate > highest.rate
              ? current
              : highest
        )
      : null;


  /*
  ====================================================
  FIND HIGHEST TIME WINDOW
  ====================================================
  */

  const highestTime =
    timeEntries.length > 0
      ? timeEntries.reduce(
          (highest, current) =>
            current.rate > highest.rate
              ? current
              : highest
        )
      : null;


  /*
  ====================================================
  RENDER
  ====================================================
  */

  return (
    <div className="analytics-page">

      {/* =================================================
          REFRESH
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          className="refresh-button"
          onClick={fetchAnalytics}
        >
          ↻ Refresh data
        </button>
      </div>


      {/* =================================================
          OVERVIEW
      ================================================= */}

      <section className="analytics-overview">

        <div className="analytics-overview-card">

          <span>
            Total transactions
          </span>

          <strong>
            {totalTransactions.toLocaleString(
              "en-IN"
            )}
          </strong>

          <small>
            All processed payments
          </small>

        </div>


        <div className="analytics-overview-card">

          <span>
            Successful
          </span>

          <strong className="success-value">
            {successfulTransactions.toLocaleString(
              "en-IN"
            )}
          </strong>

          <small>
            Payments completed
          </small>

        </div>


        <div className="analytics-overview-card">

          <span>
            Failure rate
          </span>

          <strong className="danger-value">
            {failureRate.toFixed(2)}%
          </strong>

          <small>
            {failedTransactions.toLocaleString(
              "en-IN"
            )} failed payments
          </small>

        </div>


        <div className="analytics-overview-card">

          <span>
            Revenue at risk
          </span>

          <strong className="gold-value">
            {formatCurrency(failedRevenue)}
          </strong>

          <small>
            From failed payments
          </small>

        </div>

      </section>


      {/* =================================================
          REVENUE
      ================================================= */}

      <section className="analytics-card">

        <div className="analytics-card-header">

          <div>
            <span className="eyebrow">
              REVENUE INTELLIGENCE
            </span>

            <h2>
              Revenue performance
            </h2>
          </div>

        </div>


        <div className="analytics-overview">

          <div className="analytics-overview-card">

            <span>
              Total revenue
            </span>

            <strong>
              {formatCurrency(totalRevenue)}
            </strong>

            <small>
              Revenue processed
            </small>

          </div>


          <div className="analytics-overview-card">

            <span>
              Revenue at risk
            </span>

            <strong className="danger-value">
              {formatCurrency(failedRevenue)}
            </strong>

            <small>
              From failed payments
            </small>

          </div>

        </div>

      </section>


      {/* =================================================
          PAYMENT METHOD + TIME
      ================================================= */}

      <section className="analytics-grid">

        {/* PAYMENT METHODS */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <span className="eyebrow">
                PAYMENT PERFORMANCE
              </span>

              <h2>
                Failure by method
              </h2>

            </div>

          </div>


          <div className="analytics-list">

            {methodEntries.map(
              ({ name, rate }) => (

                <div
                  className="analytics-row"
                  key={name}
                >

                  <div className="analytics-row-top">

                    <strong>
                      {name}
                    </strong>

                    <span className="analytics-percentage">
                      {rate.toFixed(2)}%
                    </span>

                  </div>


                  <div className="analytics-bar">

                    <div
                      className="analytics-bar-fill"
                      style={{
                        width: `${Math.min(
                          rate * 10,
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  <small>
                    Failure rate
                  </small>

                </div>

              )
            )}

          </div>

        </div>


        {/* TIME WINDOWS */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <span className="eyebrow">
                TIME ANALYSIS
              </span>

              <h2>
                Failure by time
              </h2>

            </div>

          </div>


          <div className="analytics-list">

            {timeEntries.map(
              ({ name, rate }) => (

                <div
                  className="analytics-row"
                  key={name}
                >

                  <div className="analytics-row-top">

                    <strong>
                      {name}
                    </strong>

                    <span className="analytics-percentage">
                      {rate.toFixed(2)}%
                    </span>

                  </div>


                  <div className="analytics-bar">

                    <div
                      className="analytics-bar-fill"
                      style={{
                        width: `${Math.min(
                          rate * 10,
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  <small>
                    Failure rate
                  </small>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          AI INSIGHTS
      ================================================= */}

      <section className="analytics-card insights-card">

        <div className="analytics-card-header">

          <div>

            <span className="eyebrow">
              MERCHANTPULSE AI
            </span>

            <h2>
              Intelligence
            </h2>

          </div>


          <div className="engine-online">

            <span className="status-dot" />

            Engine online

          </div>

        </div>


        <div className="analytics-insights">

          {insights.map(
            (insight, index) => (

              <div
                className="analytics-insight"
                key={index}
              >

                <div className="insight-icon">

                  {insight.priority === "HIGH"
                    ? "!"
                    : "↗"}

                </div>


                <div className="insight-content">

                  <div className="insight-title-row">

                    <strong>
                      {insight.title}
                    </strong>

                    <span>
                      {insight.priority}
                    </span>

                  </div>


                  <p>
                    {insight.description}
                  </p>


                  <small>
                    → {insight.recommendation}
                  </small>

                </div>

              </div>

            )
          )}

        </div>

      </section>


      {/* =================================================
          ANOMALY DETECTION
      ================================================= */}

      <section className="analytics-card">

        <div className="analytics-card-header">

          <div>

            <span className="eyebrow">
              ANOMALY DETECTION
            </span>

            <h2>
              Transaction behaviour
            </h2>

          </div>

          <div className="engine-online">

            <span className="status-dot" />

            Monitoring

          </div>

        </div>


        {anomalies.length === 0 ? (

          <div className="analytics-insight">

            <div className="insight-icon">
              ✓
            </div>

            <div className="insight-content">

              <div className="insight-title-row">

                <strong>
                  No significant anomaly detected
                </strong>

                <span>
                  LOW
                </span>

              </div>

              <p>
                Current transaction patterns do not
                indicate a significant anomaly.
              </p>

              <small>
                → Continue monitoring transaction
                behaviour for emerging patterns.
              </small>

            </div>

          </div>

        ) : (

          anomalies.map(
            (anomaly, index) => (

              <div
                className="analytics-insight"
                key={index}
              >

                <div className="insight-icon">
                  !
                </div>

                <div className="insight-content">

                  <strong>
                    {anomaly.title ||
                      "Anomaly detected"}
                  </strong>

                  <p>
                    {anomaly.description ||
                      anomaly.message ||
                      ""}
                  </p>

                </div>

              </div>

            )
          )

        )}

      </section>


      {/* =================================================
          BUSINESS TAKEAWAY
      ================================================= */}

      <section className="analytics-takeaway">

        <span className="eyebrow">
          BUSINESS TAKEAWAY
        </span>

        <h2>
          Where should the merchant focus first?
        </h2>

        <p>
          MerchantPulse identifies payment methods and
          time periods with elevated failure rates,
          helping merchants prioritize recovery efforts
          and reduce revenue leakage.
        </p>


        <div className="analytics-overview">

          <div className="analytics-overview-card">

            <span>
              Highest-risk method
            </span>

            <strong>
              {highestMethod?.name || "—"}
            </strong>

          </div>


          <div className="analytics-overview-card">

            <span>
              Highest-risk period
            </span>

            <strong>
              {highestTime?.name || "—"}
            </strong>

          </div>


          <div className="analytics-overview-card">

            <span>
              Revenue at risk
            </span>

            <strong className="gold-value">
              {formatCurrency(failedRevenue)}
            </strong>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Analytics;