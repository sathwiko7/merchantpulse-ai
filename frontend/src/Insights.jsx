import { useEffect, useState } from "react";
import "./App.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getEvidence(insight) {
  const evidence =
    insight?.evidence ||
    insight?.reason ||
    "Based on observed transaction behaviour.";

  return String(evidence)
    .replace(/Overall/g, "\nOverall");
}

function getPriority(insight) {
  return String(insight?.priority || "MEDIUM").toUpperCase();
}

function getConfidence(insight) {
  const value = Number(insight?.confidence);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/analytics"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const result = await response.json();

      setData(result);
    } catch (err) {
      console.error("Insights error:", err);
      setError(err.message || "Unable to load insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen">
          <div className="loading-mark">M</div>

          <h2>MerchantPulse AI</h2>

          <p>
            Generating merchant insights...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error) {
    return (
      <div className="page">
        <div className="error-card">
          <span className="eyebrow">
            INSIGHTS ENGINE
          </span>

          <h2>
            Unable to load insights
          </h2>

          <p>
            {error}
          </p>

          <button onClick={fetchInsights}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     DATA
     ========================================================= */

  const basic = data?.basicMetrics || {};

  const paymentMethods =
    data?.paymentMethods || [];

  const timeWindows =
    data?.timeWindows || [];

  const insights =
    Array.isArray(data?.insights)
      ? data.insights
      : [];

  /* =========================================================
     FIND HIGHEST PRIORITY INSIGHT
     ========================================================= */

  const highPriorityInsight =
    insights.find(
      (item) =>
        getPriority(item) === "HIGH"
    ) || insights[0];

  /* =========================================================
     MAIN UI
     ========================================================= */

  return (
    <div className="page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="hero">

        <span className="eyebrow">
          INTELLIGENCE ENGINE
        </span>

        <h1>
          AI-powered analysis
        </h1>

        <p>
          MerchantPulse automatically evaluates
          revenue risk, payment methods, time-based
          failure patterns, overall failure rates
          and transaction anomalies.
        </p>

      </section>


      {/* =====================================================
          PRIORITY RECOMMENDATION
      ===================================================== */}

      {highPriorityInsight && (
        <section className="priority-panel">

          <span className="eyebrow">
            PRIORITY RECOMMENDATION
          </span>

          <h2>
            What should be addressed first?
          </h2>

          <div className="priority-badge">
            {getPriority(highPriorityInsight)}
          </div>

          <h3>
            {highPriorityInsight.title}
          </h3>

          <p className="priority-description">
            {highPriorityInsight.description}
          </p>

          <div className="evidence-box">

            <span>
              EVIDENCE
            </span>

            <p>
              {getEvidence(highPriorityInsight)}
            </p>

          </div>

          <div className="confidence">

            <div className="confidence-header">

              <span>
                Confidence
              </span>

              <strong>
                {getConfidence(highPriorityInsight)}%
              </strong>

            </div>

            <div className="confidence-bar">

              <div
                style={{
                  width: `${getConfidence(
                    highPriorityInsight
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="recommendation">

            <span>
              →
            </span>

            <span>
              {highPriorityInsight.recommendation ||
                "Investigate this area first and prioritize recovery opportunities."}
            </span>

          </div>

        </section>
      )}


      {/* =====================================================
          AI FINDINGS
      ===================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              AI FINDINGS
            </span>

            <h2>
              What needs attention?
            </h2>

          </div>

          <span className="panel-count">
            {insights.length} insights detected
          </span>

        </div>


        <div className="insights-list">

          {insights.length === 0 ? (

            <div className="empty-state">
              No significant insights detected.
            </div>

          ) : (

            insights.map((insight, index) => {

              const priority =
                getPriority(insight);

              const confidence =
                getConfidence(insight);

              return (

                <div
                  className={`insight-card ${priority.toLowerCase()}`}
                  key={`${insight.title || "insight"}-${index}`}
                >

                  {/* =========================================
                      TOP ROW
                  ========================================= */}

                  <div className="insight-top">

                    <div className="insight-icon">

                      {priority === "HIGH"
                        ? "!"
                        : priority === "LOW"
                        ? "✓"
                        : "↗"}

                    </div>

                    <div className="insight-title">

                      <h3>
                        {insight.title}
                      </h3>

                    </div>

                    <span
                      className={`priority-label ${priority.toLowerCase()}`}
                    >
                      {priority}
                    </span>

                  </div>


                  {/* =========================================
                      DESCRIPTION
                  ========================================= */}

                  {insight.description && (
                    <p className="insight-description">
                      {insight.description}
                    </p>
                  )}


                  {/* =========================================
                      EVIDENCE
                  ========================================= */}

                  <div className="evidence-box">

                    <span>
                      EVIDENCE
                    </span>

                    <p>
                      {getEvidence(insight)}
                    </p>

                  </div>


                  {/* =========================================
                      CONFIDENCE
                  ========================================= */}

                  <div className="confidence">

                    <div className="confidence-header">

                      <span>
                        Confidence
                      </span>

                      <strong>
                        {confidence}%
                      </strong>

                    </div>

                    <div className="confidence-bar">

                      <div
                        style={{
                          width: `${confidence}%`,
                        }}
                      />

                    </div>

                  </div>


                  {/* =========================================
                      RECOMMENDATION
                  ========================================= */}

                  <div className="recommendation">

                    <span>
                      →
                    </span>

                    <span>
                      {insight.recommendation ||
                        "Investigate this pattern and monitor performance."}
                    </span>

                  </div>

                </div>
              );
            })

          )}

        </div>

      </section>


      {/* =====================================================
          ANALYTICS SNAPSHOT
      ===================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              ANALYTICS SNAPSHOT
            </span>

            <h2>
              What the engine is observing
            </h2>

          </div>

        </div>


        <div className="analytics-snapshot-grid">

          <div className="snapshot-card">

            <span>
              Revenue at risk
            </span>

            <strong>
              {formatCurrency(
                basic.failedRevenue ??
                basic.revenueAtRisk ??
                0
              )}
            </strong>

            <small>
              Failed transaction exposure
            </small>

          </div>


          <div className="snapshot-card">

            <span>
              Overall failure rate
            </span>

            <strong>
              {Number(
                basic.failureRate || 0
              ).toFixed(2)}%
            </strong>

            <small>
              Merchant-wide failure behaviour
            </small>

          </div>


          <div className="snapshot-card">

            <span>
              Payment methods
            </span>

            <strong>
              {paymentMethods.length}
            </strong>

            <small>
              Methods analysed
            </small>

          </div>


          <div className="snapshot-card">

            <span>
              Time windows
            </span>

            <strong>
              {timeWindows.length}
            </strong>

            <small>
              Failure periods analysed
            </small>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW MERCHANTPULSE THINKS
      ===================================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              DECISION INTELLIGENCE
            </span>

            <h2>
              How MerchantPulse identifies opportunities
            </h2>

          </div>

        </div>


        <div className="insight-process-grid">

          <div className="insight-process-card">

            <span>
              01
            </span>

            <h3>
              Detect
            </h3>

            <p>
              Identify unusual failure rates,
              revenue leakage and risky payment
              segments.
            </p>

          </div>


          <div className="insight-process-card">

            <span>
              02
            </span>

            <h3>
              Compare
            </h3>

            <p>
              Compare payment methods and time
              windows to find where failures are
              concentrated.
            </p>

          </div>


          <div className="insight-process-card">

            <span>
              03
            </span>

            <h3>
              Prioritize
            </h3>

            <p>
              Rank the most important risks so
              merchants know what should be
              investigated first.
            </p>

          </div>


          <div className="insight-process-card">

            <span>
              04
            </span>

            <h3>
              Recommend
            </h3>

            <p>
              Turn detected patterns into practical
              recovery and monitoring recommendations.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <span>
          ● MerchantPulse Intelligence Engine
        </span>

        <span>
          Automated decision intelligence
        </span>

        <span>
          Live analytics
        </span>

      </footer>

    </div>
  );
}

export default Insights;