import { useEffect, useState } from "react";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://merchantpulse-ai.onrender.com/api/analytics"
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

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="analytics-page">
        <div className="empty-state">
          {error || "Unable to load analytics."}
        </div>
      </div>
    );
  }

  /* =========================================================
     BASIC DATA
  ========================================================= */

  const basic =
    analytics.basic ||
    analytics.basicMetrics ||
    analytics.metrics ||
    {};

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
      totalTransactions - failedTransactions
  );

  const failureRate = Number(
    basic.failureRate ??
      basic.failure_rate ??
      analytics.failureRate ??
      (totalTransactions
        ? (failedTransactions / totalTransactions) * 100
        : 0)
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

  /* =========================================================
     PAYMENT METHODS
  ========================================================= */

  const rawPaymentMethods = analytics.paymentMethods || {};

  let methodEntries = [];

  if (Array.isArray(rawPaymentMethods)) {
    methodEntries = rawPaymentMethods.map((item) => ({
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
    }));
  } else {
    methodEntries = Object.entries(rawPaymentMethods).map(
      ([method, value]) => {
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
          rate: Number.isFinite(rate) ? rate : 0,
        };
      }
    );
  }

  /* =========================================================
     TIME WINDOWS
  ========================================================= */

  const rawTimeWindows = analytics.timeWindows || {};

  let timeEntries = [];

  if (Array.isArray(rawTimeWindows)) {
    timeEntries = rawTimeWindows.map((item) => ({
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
    }));
  } else {
    timeEntries = Object.entries(rawTimeWindows).map(
      ([time, value]) => {
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
          rate: Number.isFinite(rate) ? rate : 0,
        };
      }
    );
  }

  /* =========================================================
     INSIGHTS
  ========================================================= */

  const insights = Array.isArray(analytics.insights)
    ? analytics.insights
    : [];

  const anomalies = Array.isArray(analytics.anomalies)
    ? analytics.anomalies
    : [];

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const highestMethod =
    methodEntries.length > 0
      ? methodEntries.reduce((highest, current) =>
          current.rate > highest.rate ? current : highest
        )
      : null;

  const highestTime =
    timeEntries.length > 0
      ? timeEntries.reduce((highest, current) =>
          current.rate > highest.rate ? current : highest
        )
      : null;

  /* =========================================================
     GRAPH DATA
  ========================================================= */

  const graphTimeEntries = timeEntries.slice(0, 12);

  const linePoints = (() => {
  if (!graphTimeEntries.length) return "";

  const width = 760;
  const height = 260;
  const paddingX = 55;
  const paddingY = 30;

  const values = graphTimeEntries.map((item) =>
    Number(item.rate || 0)
  );

  const maxValue = Math.max(...values, 10);

  return values
    .map((value, index) => {
      const x =
        paddingX +
        (index * (width - paddingX * 2)) /
          Math.max(values.length - 1, 1);

      const y =
        height -
        paddingY -
        (value / maxValue) *
          (height - paddingY * 2);

      return `${x},${y}`;
    })
    .join(" ");
})();

const lineDots = (() => {
  if (!graphTimeEntries.length) return [];

  const width = 760;
  const height = 260;
  const paddingX = 55;
  const paddingY = 30;

  const values = graphTimeEntries.map((item) =>
    Number(item.rate || 0)
  );

  const maxValue = Math.max(...values, 10);

  return values.map((value, index) => {
    const x =
      paddingX +
      (index * (width - paddingX * 2)) /
        Math.max(values.length - 1, 1);

    const y =
      height -
      paddingY -
      (value / maxValue) *
        (height - paddingY * 2);

    return {
      x,
      y,
      value,
      label: graphTimeEntries[index].name,
    };
  });
})();

  /* =========================================================
     DONUT GRAPH
  ========================================================= */

  const donutTotal =
    methodEntries.reduce(
      (sum, item) => sum + Math.max(Number(item.rate) || 0, 0),
      0
    ) || 1;

  let donutOffset = 0;

  const donutSegments = methodEntries.map((item, index) => {
    const percentage =
      (Math.max(Number(item.rate) || 0, 0) /
        donutTotal) *
      100;

    const segment = {
      name: item.name,
      rate: item.rate,
      percentage,
      offset: donutOffset,
      index,
    };

    donutOffset += percentage;

    return segment;
  });

  const donutGradient =
    donutSegments.length > 0
      ? donutSegments
          .map((segment) => {
            const colors = [
              "#d8bd70",
              "#a99b68",
              "#77705a",
              "#514d43",
              "#38362f",
            ];

            const start = segment.offset;
            const end =
              segment.offset + segment.percentage;

            return `${colors[segment.index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ")
      : "#38362f 0% 100%";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="analytics-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

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
          ↻ Refresh analytics
        </button>
      </div>

      {/* =====================================================
          PAGE INTRO
      ===================================================== */}

      <div style={{ marginBottom: "32px" }}>
        <span className="eyebrow">
          ANALYTICS
        </span>

        <h1
          style={{
            margin: "8px 0 8px",
            fontSize: "42px",
            fontWeight: 500,
          }}
        >
          Payment Analytics
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.65,
            fontSize: "16px",
          }}
        >
          Comprehensive insights into payment performance.
        </p>
      </div>

      {/* =====================================================
          OVERVIEW CARDS
      ===================================================== */}

      <section className="analytics-overview">

        <div className="analytics-overview-card">
          <span>Total transactions</span>

          <strong>
            {totalTransactions.toLocaleString("en-IN")}
          </strong>

          <small>
            All processed payments
          </small>
        </div>

        <div className="analytics-overview-card">

          <span>Successful</span>

          <strong className="success-value">
            {successfulTransactions.toLocaleString("en-IN")}
          </strong>

          <small>
            Payments completed
          </small>

        </div>

        <div className="analytics-overview-card">

          <span>Failed</span>

          <strong className="danger-value">
            {failedTransactions.toLocaleString("en-IN")}
          </strong>

          <small>
            Require attention
          </small>

        </div>

        <div className="analytics-overview-card">

          <span>Failure rate</span>

          <strong className="danger-value">
            {failureRate.toFixed(2)}%
          </strong>

          <small>
            {failedTransactions.toLocaleString("en-IN")} failed payments
          </small>

        </div>

      </section>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section
        className="analytics-grid"
        style={{
          marginTop: "24px",
          alignItems: "stretch",
        }}
      >

        {/* ===================================================
            FAILURE OVER TIME
        =================================================== */}

        <div
          className="analytics-card"
          style={{
            minHeight: "390px",
          }}
        >

          <div className="analytics-card-header">

            <div>

              <span className="eyebrow">
                PAYMENT PERFORMANCE
              </span>

              <h2>
                Failure over time
              </h2>

            </div>

            <div className="engine-online">
              <span className="status-dot" />
              Live data
            </div>

          </div>

          {graphTimeEntries.length > 0 ? (

            <div
              style={{
                width: "100%",
                overflow: "hidden",
                marginTop: "20px",
              }}
            >

              <svg
                viewBox="0 0 760 300"
                width="100%"
                height="300"
                preserveAspectRatio="none"
              >

                {/* GRID */}

                {[0, 1, 2, 3, 4].map((line) => {

                  const y =
                    30 +
                    line * 50;

                  return (
                    <line
                      key={line}
                      x1="55"
                      x2="735"
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Y LABELS */}

                {[10, 7.5, 5, 2.5, 0].map(
                  (value, index) => {

                    const y =
                      35 + index * 50;

                    return (
                      <text
                        key={value}
                        x="5"
                        y={y}
                        fill="rgba(255,255,255,0.42)"
                        fontSize="11"
                      >
                        {value}%
                      </text>
                    );
                  }
                )}

                {/* AREA */}

                {linePoints && (
                  <polygon
                    points={`55,280 ${linePoints} 735,280`}
                    fill="rgba(216,189,112,0.08)"
                  />
                )}

                {/* LINE */}

                {linePoints && (
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#d8bd70"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* DOTS */}

                {lineDots.map((point, index) => (
                  <g key={index}>

                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#17150f"
                      stroke="#d8bd70"
                      strokeWidth="2"
                    />

                    <title>
                      {point.label}: {point.value.toFixed(2)}%
                    </title>

                  </g>
                ))}

                {/* X LABELS */}

                {lineDots.map((point, index) => {

                  const showLabel =
                    lineDots.length <= 8 ||
                    index % 2 === 0;

                  if (!showLabel) return null;

                  return (
                    <text
                      key={index}
                      x={point.x}
                      y="298"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.42)"
                      fontSize="10"
                    >
                      {String(point.label).slice(0, 10)}
                    </text>
                  );
                })}

              </svg>

            </div>

          ) : (

            <div className="empty-state">
              No time-based failure data available.
            </div>

          )}

        </div>


        {/* ===================================================
            FAILURE BY METHOD
        =================================================== */}

        <div
          className="analytics-card"
          style={{
            minHeight: "390px",
          }}
        >

          <div className="analytics-card-header">

            <div>

              <span className="eyebrow">
                PAYMENT METHODS
              </span>

              <h2>
                Failure by method
              </h2>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "35px",
              marginTop: "20px",
              flexWrap: "wrap",
            }}
          >

            {/* DONUT */}

            <div
              style={{
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: `conic-gradient(${donutGradient})`,
                position: "relative",
                flexShrink: 0,
              }}
            >

              <div
                style={{
                  position: "absolute",
                  inset: "28px",
                  borderRadius: "50%",
                  background: "#11100d",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                <strong
                  style={{
                    fontSize: "26px",
                  }}
                >
                  {failureRate.toFixed(2)}%
                </strong>

                <span
                  style={{
                    fontSize: "11px",
                    opacity: 0.5,
                    marginTop: "4px",
                  }}
                >
                  overall
                </span>

              </div>

            </div>


            {/* LEGEND */}

            <div
              style={{
                minWidth: "180px",
              }}
            >

              {methodEntries.map(
                (method, index) => {

                  const colors = [
                    "#d8bd70",
                    "#a99b68",
                    "#77705a",
                    "#514d43",
                    "#38362f",
                  ];

                  return (
                    <div
                      key={method.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "20px",
                        padding: "11px 0",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.06)",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                        }}
                      >

                        <span
                          style={{
                            width: "9px",
                            height: "9px",
                            borderRadius: "50%",
                            background:
                              colors[
                                index % colors.length
                              ],
                            display: "inline-block",
                          }}
                        />

                        <span
                          style={{
                            fontSize: "13px",
                          }}
                        >
                          {method.name}
                        </span>

                      </div>

                      <strong
                        style={{
                          fontSize: "13px",
                        }}
                      >
                        {Number(method.rate).toFixed(2)}%
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          REVENUE PERFORMANCE
      ===================================================== */}

      <section
        className="analytics-card"
        style={{
          marginTop: "24px",
        }}
      >

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


          <div className="analytics-overview-card">

            <span>
              Highest-risk method
            </span>

            <strong>
              {highestMethod?.name || "—"}
            </strong>

            <small>
              {highestMethod
                ? `${highestMethod.rate.toFixed(2)}% failure rate`
                : "No data"}
            </small>

          </div>


          <div className="analytics-overview-card">

            <span>
              Highest-risk period
            </span>

            <strong>
              {highestTime?.name || "—"}
            </strong>

            <small>
              {highestTime
                ? `${highestTime.rate.toFixed(2)}% failure rate`
                : "No data"}
            </small>

          </div>

        </div>

      </section>


      {/* =====================================================
          AI INSIGHTS
      ===================================================== */}

      <section
        className="analytics-card insights-card"
        style={{
          marginTop: "24px",
        }}
      >

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

          {insights.length === 0 ? (

            <div className="analytics-insight">

              <div className="insight-icon">
                ✓
              </div>

              <div className="insight-content">

                <strong>
                  No additional insights available
                </strong>

                <p>
                  MerchantPulse is monitoring current
                  payment behaviour.
                </p>

              </div>

            </div>

          ) : (

            insights.map((insight, index) => (

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

            ))

          )}

        </div>

      </section>


      {/* =====================================================
          ANOMALY DETECTION
      ===================================================== */}

      <section
        className="analytics-card"
        style={{
          marginTop: "24px",
        }}
      >

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

          anomalies.map((anomaly, index) => (

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

          ))

        )}

      </section>


      {/* =====================================================
          BUSINESS TAKEAWAY
      ===================================================== */}

      <section
        className="analytics-takeaway"
        style={{
          marginTop: "24px",
        }}
      >

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