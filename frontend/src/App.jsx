import { useEffect, useState } from "react";
import "./App.css";
import Transactions from "./Transactions";
import Analytics from "./Analytics";
import Insights from "./Insights";
import Recovery from "./Recovery";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}


function App() {

  const [data, setData] = useState(null);
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("overview");


  /*
  ==================================================
  FETCH ANALYTICS
  ==================================================
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

      const result = await response.json();

      setData(result);

    } catch (error) {
      console.error(
        "Failed to fetch analytics:",
        error
      );

      setError(
        "Unable to connect to MerchantPulse API."
      );

    } finally {
      setLoading(false);
    }
  };


  /*
  ==================================================
  FETCH RECOVERY
  ==================================================
  */

  const fetchRecovery = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/recovery"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recovery data");
    }

    const result = await response.json();

    setRecoveryData(result);

  } catch (error) {
    console.error(
      "Failed to fetch recovery data:",
      error
    );
  }
};

  /*
  ==================================================
  INITIAL LOAD
  ==================================================
  */

useEffect(() => {
  fetchAnalytics();
  fetchRecovery();
}, []);

  /*
  ==================================================
  LOADING SCREEN
  ==================================================
  */

  if (loading) {

    return (

      <div className="loading-screen">

        <div className="loading-mark">
          M
        </div>

        <p>
          MerchantPulse AI
        </p>

        <span>
          Analyzing merchant data...
        </span>

      </div>

    );

  }


  /*
  ==================================================
  ERROR SCREEN
  ==================================================
  */

  if (error) {

    return (

      <div className="error-screen">

        <div className="error-card">

          <div className="brand-small">
            MERCHANTPULSE AI
          </div>

          <h1>
            Connection failed
          </h1>

          <p>
            {error}
          </p>

          <p className="error-help">
            Make sure the backend is running with:
          </p>

          <code>
            node api.js
          </code>

          <button
            onClick={fetchAnalytics}
          >
            Try again
          </button>

        </div>

      </div>

    );

  }


  /*
  ==================================================
  DATA
  ==================================================
  */

  const basic =
    data?.basicMetrics || {};

  const paymentMethods =
    data?.paymentMethods || [];

  const timeWindows =
    data?.timeWindows || [];

  const insights =
    data?.insights || [];


  /*
  ==================================================
  MAIN APP
  ==================================================
  */

  return (

    <div className="app">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">


        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            M
          </div>

          <div>

            <strong>
              MerchantPulse
            </strong>

            <span>
              AI Intelligence
            </span>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav>


          {/* OVERVIEW */}

          <button
            className={`nav-item ${
              activePage === "overview"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("overview")
            }
          >

            <span>
              ⌂
            </span>

            Overview

          </button>


          {/* ANALYTICS */}

          <button
            className={`nav-item ${
              activePage === "analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("analytics")
            }
          >

            <span>
              ◈
            </span>

            Analytics

          </button>


          {/* INSIGHTS */}

          <button
            className={`nav-item ${
              activePage === "insights"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("insights")
            }
          >

            <span>
              ✦
            </span>

            Insights

          </button>


          {/* RECOVERY */}

          <button
            className={`nav-item ${
              activePage === "recovery"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("recovery")
            }
          >

            <span>
              ↗
            </span>

            Recovery

          </button>


          {/* TRANSACTIONS */}

          <button
            className={`nav-item ${
              activePage === "transactions"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("transactions")
            }
          >

            <span>
              ◎
            </span>

            Transactions

          </button>


        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">


          <div className="engine-status">

            <span className="status-dot"></span>

            <div>

              <strong>
                AI Engine
              </strong>

              <small>
                Online
              </small>

            </div>

          </div>


          <div className="merchant-profile">

            <div className="profile-circle">
              M
            </div>

            <div>

              <strong>
                Demo Merchant
              </strong>

              <small>
                MerchantPulse
              </small>

            </div>

          </div>


        </div>


      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main">


        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="topbar">

          <div>

            <span className="eyebrow">
              MERCHANT INTELLIGENCE
            </span>


            <h1>

              {activePage === "transactions"
                ? "Transactions"
                : activePage === "analytics"
                ? "Analytics"
                : activePage === "insights"
                ? "Insights"
                : activePage === "recovery"
                ? "Recovery"
                : "Good evening"}


              {activePage === "overview" && (
                <span>
                  ✦
                </span>
              )}

            </h1>


            <p>

              {activePage === "transactions"
                ? "Explore and analyze every merchant transaction."
                : activePage === "analytics"
                ? "Understand payment behaviour and identify where revenue is being lost."
                : activePage === "overview"
                ? "Here's what MerchantPulse found across your revenue today."
                : activePage === "insights"
                ? "MerchantPulse AI intelligence for your business."
                : "Turn failed payments into recovery opportunities."}

            </p>

          </div>


          <button
            className="refresh-button"
            onClick={fetchAnalytics}
          >

            ↻ &nbsp; Refresh data

          </button>

        </header>


        {/* ==================================================
            OVERVIEW PAGE
        ================================================== */}

        {activePage === "overview" && (

          <>


            {/* =================================================
                METRICS
            ================================================= */}

            <section className="metrics-grid">


              {/* REVENUE */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    Revenue
                  </span>

                  <div className="metric-symbol gold">
                    ₹
                  </div>

                </div>


                <h2>

                  {formatCurrency(
                    basic.totalRevenue
                  )}

                </h2>


                <p>

                  {Number(
                    basic.totalTransactions || 0
                  ).toLocaleString(
                    "en-IN"
                  )}{" "}

                  transactions analyzed

                </p>

              </div>


              {/* REVENUE AT RISK */}

              <div className="metric-card risk">

                <div className="metric-top">

                  <span>
                    Revenue At Risk
                  </span>

                  <div className="metric-symbol red">
                    !
                  </div>

                </div>


                <h2>

                  {formatCurrency(
                    basic.failedRevenue
                  )}

                </h2>


                <p>
                  From failed payments
                </p>

              </div>


              {/* FAILED PAYMENTS */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    Failed Payments
                  </span>

                  <div className="metric-symbol amber">
                    ↘
                  </div>

                </div>


                <h2>
                  {basic.failedTransactions || 0}
                </h2>


                <p>
                  {basic.failureRate || 0}%
                  {" "}failure rate
                </p>

              </div>


              {/* RECOVERY POTENTIAL */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    Recovery Potential
                  </span>

                  <div className="metric-symbol green">
                    ✦
                  </div>

                </div>

<h2>
  {formatCurrency(
    recoveryData?.summary?.estimatedRecovery || 0
  )}
</h2>
                <p>
                  Identified by AI
                </p>

              </div>


            </section>


            {/* =================================================
                CONTENT GRID
            ================================================= */}

            <section className="content-grid">


              {/* =================================================
                  INTELLIGENCE
              ================================================= */}

              <div className="panel intelligence-panel">

                <div className="panel-heading">

                  <div>

                    <span className="eyebrow">
                      MERCHANTPULSE AI
                    </span>

                    <h2>
                      Intelligence
                    </h2>

                  </div>


                  <div className="online-label">

                    <span></span>

                    Engine online

                  </div>

                </div>


                <div className="insights">

                  {insights.map(
                    (insight, index) => (

                      <div
                        className={`insight-card ${
                          String(
                            insight.severity || "LOW"
                          ).toLowerCase()
                        }`}
                        key={index}
                      >


                        <div className="insight-icon">

                          {insight.severity === "HIGH"
                            ? "!"
                            : insight.severity === "MEDIUM"
                            ? "↗"
                            : "✓"}

                        </div>


                        <div className="insight-content">

                          <div className="insight-title-row">

                            <h3>
                              {insight.title}
                            </h3>

                            <span className="severity">
                              {insight.severity}
                            </span>

                          </div>


                          <p>
                            {insight.message}
                          </p>


                          <div className="recommendation">

                            <span>
                              →
                            </span>

                            {insight.recommendation}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* =================================================
                  PAYMENT METHODS
              ================================================= */}

              <div className="panel">

                <div className="panel-heading">

                  <div>

                    <span className="eyebrow">
                      PAYMENT PERFORMANCE
                    </span>

                    <h2>
                      Failure by method
                    </h2>

                  </div>

                </div>


                <div className="method-list">

                  {paymentMethods.map(
                    (method) => (

                      <div
                        className="method-row"
                        key={method.method}
                      >

                        <div className="method-info">

                          <strong>
                            {method.method}
                          </strong>

                          <span>
                            Failure rate
                          </span>

                        </div>


                        <div className="method-value">

                          <strong>
                            {method.failureRate}%
                          </strong>


                          <div className="bar">

                            <div
                              style={{
                                width: `${Math.min(
                                  Number(
                                    method.failureRate || 0
                                  ) * 8,
                                  100
                                )}%`,
                              }}
                            ></div>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>


            </section>


            {/* =================================================
                TIME WINDOWS
            ================================================= */}

            <section className="panel time-panel">

              <div className="panel-heading">

                <div>

                  <span className="eyebrow">
                    TRANSACTION PATTERNS
                  </span>

                  <h2>
                    Failure by time window
                  </h2>

                </div>


                <span className="panel-note">
                  AI pattern analysis
                </span>

              </div>


              <div className="time-grid">

                {timeWindows.map(
                  (window) => (

                    <div
                      className="time-card"
                      key={window.window}
                    >

                      <span>
                        {window.window}
                      </span>

                      <strong>
                        {window.failureRate}%
                      </strong>


                      <div className="time-bar">

                        <div
                          style={{
                            height: `${Math.min(
                              Number(
                                window.failureRate || 0
                              ) * 8,
                              100
                            )}%`,
                          }}
                        ></div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer>

              <span>
                ● MerchantPulse Intelligence Engine
              </span>

              <span>

                {Number(
                  basic.totalTransactions || 0
                ).toLocaleString(
                  "en-IN"
                )}{" "}

                transactions analyzed

              </span>

              <span>
                Live analytics
              </span>

            </footer>


          </>

        )}


        {/* ==================================================
            TRANSACTIONS PAGE
        ================================================== */}

        {activePage === "transactions" && (
          <Transactions />
        )}


        {/* ==================================================
            ANALYTICS PAGE
        ================================================== */}

        {activePage === "analytics" && (
          <Analytics />
        )}


        {/* ==================================================
            INSIGHTS PAGE
        ================================================== */}

        {activePage === "insights" && (
  <Insights />
)}


{/* ==================================================
    RECOVERY PAGE
================================================== */}

{activePage === "recovery" && (
  <Recovery />
)}


      </main>

    </div>

  );

}


export default App;