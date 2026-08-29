import { useEffect, useState } from "react";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function Recovery() {

  const [summary, setSummary] = useState({
    totalFailed: 0,
    eligible: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    estimatedRecovery: 0,
  });

  const [opportunities, setOpportunities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedOpportunity, setSelectedOpportunity] =
    useState(null);

  const [recoveryStatus, setRecoveryStatus] =
    useState({});

  const initiateRecovery = (opportunity) => {
    setRecoveryStatus((previous) => ({
      ...previous,
      [opportunity.id]: {
        status: "INITIATED",
        message:
          "Recovery workflow initiated for this transaction.",
      },
    }));

    setSelectedOpportunity(opportunity);
  };


  /*
  ==================================================
  FETCH RECOVERY DATA
  ==================================================
  */

  const fetchRecovery = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(
        "http://localhost:5000/api/recovery"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch recovery data"
        );
      }

      const data =
        await response.json();


      /*
      ================================================
      FLATTEN TRANSACTION + RECOVERY
      ================================================
      */

      const formattedOpportunities =
        Array.isArray(data?.opportunities)
          ? data.opportunities.map((item) => {
              // The backend returns each opportunity as:
              // { transaction: {...}, recovery: {...} }
              // Keep this defensive so the UI also works if the
              // API ever returns a flat opportunity object.
              const transaction =
                item?.transaction && typeof item.transaction === "object"
                  ? item.transaction
                  : item?.data?.transaction &&
                    typeof item.data.transaction === "object"
                  ? item.data.transaction
                  : {};

              const recovery =
                item?.recovery && typeof item.recovery === "object"
                  ? item.recovery
                  : item?.data?.recovery &&
                    typeof item.data.recovery === "object"
                  ? item.data.recovery
                  : {};

              const flat =
                item && typeof item === "object" ? item : {};

              return {
                ...flat,
                ...transaction,
                ...recovery,
                id:
                  transaction.id ??
                  flat.id ??
                  recovery.id ??
                  `recovery-${Math.random().toString(36).slice(2)}`,
                timestamp:
                  transaction.timestamp ??
                  flat.timestamp ??
                  recovery.timestamp,
                customer:
                  transaction.customer ??
                  flat.customer ??
                  recovery.customer,
                amount:
                  transaction.amount ??
                  flat.amount ??
                  recovery.transactionAmount ??
                  0,
                paymentMethod:
                  transaction.paymentMethod ??
                  flat.paymentMethod ??
                  recovery.paymentMethod,
                status:
                  transaction.status ??
                  flat.status ??
                  recovery.status,
                category:
                  transaction.category ??
                  flat.category ??
                  recovery.category,
                city:
                  transaction.city ??
                  flat.city ??
                  recovery.city,
                device:
                  transaction.device ??
                  flat.device ??
                  recovery.device,
                refunded:
                  transaction.refunded ??
                  flat.refunded ??
                  recovery.refunded,
                eligible:
                  recovery.eligible ??
                  flat.eligible ??
                  transaction.eligible,
                priority:
                  recovery.priority ??
                  flat.priority ??
                  transaction.priority,
                recoveryProbability:
                  recovery.recoveryProbability ??
                  flat.recoveryProbability ??
                  transaction.recoveryProbability ??
                  0,
                estimatedRecovery:
                  recovery.estimatedRecovery ??
                  flat.estimatedRecovery ??
                  transaction.estimatedRecovery ??
                  0,
                recommendedAction:
                  recovery.recommendedAction ??
                  flat.recommendedAction ??
                  transaction.recommendedAction,
                reason:
                  recovery.reason ??
                  flat.reason ??
                  transaction.reason,
                timeWindow:
                  recovery.timeWindow ??
                  flat.timeWindow ??
                  transaction.timeWindow,
              };
            })
          : [];


      setSummary(
        data?.summary || {
          totalFailed: 0,
          eligible: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          estimatedRecovery: 0,
        }
      );


      setOpportunities(
        formattedOpportunities
      );

    }

    catch (err) {

      console.error(
        "Recovery error:",
        err
      );

      setError(
        "Unable to load recovery opportunities."
      );

    }

    finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchRecovery();

  }, []);


  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {

    return (

      <div className="recovery-page">

        <div className="panel">

          <div className="eyebrow">
            MERCHANTPULSE AI
          </div>

          <h2>
            Analyzing recovery opportunities...
          </h2>

          <p>
            Evaluating failed payments, recovery
            probability and revenue impact.
          </p>

        </div>

      </div>

    );

  }


  /*
  ==================================================
  ERROR
  ==================================================
  */

  if (error) {

    return (

      <div className="recovery-page">

        <div className="panel">

          <div className="eyebrow">
            MERCHANTPULSE AI
          </div>

          <h2>
            Recovery unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            className="refresh-button"
            onClick={fetchRecovery}
          >
            ↻ Try again
          </button>

        </div>

      </div>

    );

  }


  /*
  ==================================================
  MAIN PAGE
  ==================================================
  */

  return (

    <div className="recovery-page">


      {/* ==========================================
          HEADER
      ========================================== */}

      <section className="recovery-hero">

        <div>

          <span className="eyebrow">
            MERCHANTPULSE AI
          </span>

          <h1>
            Revenue Recovery
          </h1>

          <p>
            Identify failed payments with the highest
            potential for revenue recovery.
          </p>

        </div>


        <button
          className="refresh-button"
          onClick={fetchRecovery}
        >
          ↻ Refresh recovery
        </button>

      </section>


      {/* ==========================================
          SUMMARY
      ========================================== */}

      <section className="recovery-summary">


        <div className="recovery-stat">

          <span>
            Failed Payments
          </span>

          <strong>
            {Number(
              summary.totalFailed || 0
            ).toLocaleString("en-IN")}
          </strong>

          <small>
            payment failures analyzed
          </small>

        </div>


        <div className="recovery-stat">

          <span>
            Recovery Eligible
          </span>

          <strong>
            {Number(
              summary.eligible || 0
            ).toLocaleString("en-IN")}
          </strong>

          <small>
            potential recovery opportunities
          </small>

        </div>


        <div className="recovery-stat high">

          <span>
            High Priority
          </span>

          <strong>
            {Number(
              summary.highPriority || 0
            ).toLocaleString("en-IN")}
          </strong>

          <small>
            should be addressed first
          </small>

        </div>


        <div className="stat-card recovery-estimated-card">

          <span>
            Estimated Recovery
          </span>

          <strong>
            {formatCurrency(
              summary.estimatedRecovery
            )}
          </strong>

          <small>
            potential revenue recovered
          </small>

        </div>

      </section>


      {/* ==========================================
          RECOVERY OPPORTUNITIES
      ========================================== */}

      <section className="panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              RECOVERY OPPORTUNITIES
            </span>

            <h2>
              Failed payments worth recovering
            </h2>

            <p className="recovery-list-hint">
              Select an opportunity to view
              transaction intelligence.
            </p>

          </div>


          <span className="panel-note">
            {opportunities.length} opportunities
          </span>

        </div>


        {opportunities.length === 0 ? (

          <div className="empty-state">

            No recovery opportunities found.

          </div>

        ) : (

          <div className="recovery-opportunities">

            {opportunities.map(
              (opportunity, index) => {

                const priority =
                  String(
                    opportunity.priority ||
                    "LOW"
                  ).toUpperCase();


                return (

                  <div
                    className={`recovery-opportunity recovery-clickable ${priority.toLowerCase()}`}
                    key={
                      opportunity.id ||
                      `recovery-${index}`
                    }
                    onClick={() =>
                      setSelectedOpportunity(
                        opportunity
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {

                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {

                        setSelectedOpportunity(
                          opportunity
                        );

                      }

                    }}
                  >


                    {/* LEFT */}

                    <div className="recovery-opportunity-main">

                      <div className="recovery-transaction">

                        <strong>
                          {opportunity.id}
                        </strong>

                        <span>
                          {opportunity.customer}
                        </span>

                      </div>


                      <div className="recovery-meta">

                        <span>
                          {opportunity.paymentMethod}
                        </span>

                        <span>
                          {opportunity.city}
                        </span>

                        <span>
                          {opportunity.category}
                        </span>

                      </div>

                    </div>


                    {/* AMOUNT */}

                    <div className="recovery-column">

                      <span>
                        Amount
                      </span>

                      <strong>
                        {formatCurrency(
                          opportunity.amount
                        )}
                      </strong>

                    </div>


                    {/* PROBABILITY */}

                    <div className="recovery-column">

                      <span>
                        Recovery probability
                      </span>

                      <strong>
                        {Number(
                          opportunity.recoveryProbability ||
                          0
                        )}%
                      </strong>

                    </div>


                    {/* PRIORITY */}

                    <div className="recovery-column">

                      <span>
                        Priority
                      </span>

                      <span
                        className={`recovery-priority ${priority.toLowerCase()}`}
                      >
                        {priority}
                      </span>

                    </div>


                    {/* ESTIMATED RECOVERY */}

                    <div className="recovery-column">

                      <span>
                        Estimated recovery
                      </span>

                      <strong className="gold-value">

                        {formatCurrency(
                          opportunity.estimatedRecovery
                        )}

                      </strong>

                    </div>


                    {/* ACTION */}

                    <div className="recovery-action">

                      <span>
                        Recommended action
                      </span>

                      <strong>
                        {opportunity.recommendedAction}
                      </strong>

                    </div>


                    {/* INITIATE RECOVERY */}

                    <div
                      className="recovery-action-controls"
                      onClick={(event) => event.stopPropagation()}
                    >

                      <span>
                        Recovery action
                      </span>

                      <button
                        type="button"
                        className="refresh-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          initiateRecovery(opportunity);
                        }}
                      >
                        {recoveryStatus[opportunity.id]?.status ===
                        "INITIATED"
                          ? "✓ Recovery Initiated"
                          : "Initiate Recovery →"}
                      </button>

                    </div>


                  </div>

                );

              }
            )}

          </div>

        )}

      </section>


      {/* ==========================================
          TRANSACTION INTELLIGENCE
      ========================================== */}

      {selectedOpportunity && (

        <section className="panel recovery-detail-panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                TRANSACTION INTELLIGENCE
              </span>

              <h2>
                {selectedOpportunity.id}
              </h2>

              <p>
                Explainable recovery decision
                generated from transaction behaviour.
              </p>

            </div>


            <button
              className="refresh-button"
              onClick={() =>
                setSelectedOpportunity(null)
              }
            >
              ← Back to opportunities
            </button>

          </div>


          {/* ========================================
              TRANSACTION OVERVIEW
          ======================================== */}

          <div className="recovery-detail-grid">


            <div className="recovery-detail-card">

              <span>
                Transaction amount
              </span>

              <strong>
                {formatCurrency(
                  selectedOpportunity.amount
                )}
              </strong>

            </div>


            <div className="recovery-detail-card">

              <span>
                Payment method
              </span>

              <strong>
                {selectedOpportunity.paymentMethod ||
                  "UNKNOWN"}
              </strong>

            </div>


            <div className="recovery-detail-card">

              <span>
                Recovery probability
              </span>

              <strong>
                {selectedOpportunity.recoveryProbability ||
                  0}%
              </strong>

            </div>


            <div className="recovery-detail-card">

              <span>
                Priority
              </span>

              <strong>
                {selectedOpportunity.priority ||
                  "NONE"}
              </strong>

            </div>


            <div className="recovery-detail-card">

              <span>
                Estimated recovery
              </span>

              <strong>
                {formatCurrency(
                  selectedOpportunity.estimatedRecovery
                )}
              </strong>

            </div>


            <div className="recovery-detail-card">

              <span>
                Failure period
              </span>

              <strong>
                {selectedOpportunity.timeWindow ||
                  "UNKNOWN"}
              </strong>

            </div>

          </div>


          {recoveryStatus[selectedOpportunity.id]?.status ===
            "INITIATED" && (
            <div className="recovery-reason-box">

              <span className="eyebrow">
                RECOVERY WORKFLOW
              </span>

              <h3>
                Recovery initiated
              </h3>

              <p>
                {recoveryStatus[selectedOpportunity.id]
                  ?.message ||
                  "Recovery workflow initiated for this transaction."}
              </p>

            </div>
          )}


          {/* ========================================
              DECISION REASON
          ======================================== */

          <div className="recovery-reason-box">

            <span className="eyebrow">
              MERCHANTPULSE DECISION
            </span>

            <h3>
              Why this transaction is recoverable
            </h3>

            <p>
              {selectedOpportunity.reason ||
                "This failed payment matches transaction patterns where a retry may have a reasonable chance of success."}
            </p>

          </div>
}

          {/* ========================================
              SCORE FACTORS
          ======================================== */}

          <div className="recovery-score-panel">

            <div className="panel-heading">

              <div>

                <span className="eyebrow">
                  EXPLAINABLE SCORE
                </span>

                <h3>
                  Why MerchantPulse gave this score
                </h3>

              </div>

              <span className="panel-note">
                {selectedOpportunity.recoveryProbability ||
                  0}% recovery probability
              </span>

            </div>


            <div className="recovery-score-factors">

              {Array.isArray(
                selectedOpportunity.scoreFactors
              ) &&
              selectedOpportunity.scoreFactors.length >
                0 ? (

                selectedOpportunity.scoreFactors.map(
                  (factor, index) => (

                    <div
                      className="recovery-factor"
                      key={`${factor.factor}-${index}`}
                    >

                      <div className="recovery-factor-top">

                        <strong>
                          {factor.factor}
                        </strong>

                        <span className="factor-impact">
                          {factor.impact}
                        </span>

                      </div>


                      <div className="recovery-factor-value">
                        {factor.value}
                      </div>


                      <p>
                        {factor.explanation}
                      </p>

                    </div>

                  )
                )

              ) : (

                <div className="empty-state">

                  Score factors are not available
                  for this transaction.

                </div>

              )}

            </div>

          </div>


          {/* ========================================
              ANALYTICS CONTEXT
          ======================================== */}

          {selectedOpportunity.analyticsContext && (

            <div className="recovery-context-box">

              <span className="eyebrow">
                ANALYTICS CONTEXT
              </span>

              <div className="recovery-context-grid">

                <div>

                  <span>
                    Payment method failure
                  </span>

                  <strong>
                    {selectedOpportunity
                      .analyticsContext
                      .methodFailureRate || 0}%
                  </strong>

                </div>


                <div>

                  <span>
                    Time-window failure
                  </span>

                  <strong>
                    {selectedOpportunity
                      .analyticsContext
                      .windowFailureRate || 0}%
                  </strong>

                </div>


                <div>

                  <span>
                    Overall failure rate
                  </span>

                  <strong>
                    {selectedOpportunity
                      .analyticsContext
                      .overallFailureRate || 0}%
                  </strong>

                </div>


                <div>

                  <span>
                    Anomaly
                  </span>

                  <strong>
                    {selectedOpportunity
                      .analyticsContext
                      .anomalyDetected
                      ? "Detected"
                      : "None"}
                  </strong>

                </div>

              </div>

            </div>

          )}


          {/* ========================================
              RECOMMENDED ACTION
          ======================================== */}

          <div className="recovery-action-box">

            <div>
              <span className="eyebrow">
                RECOMMENDED ACTION
              </span>

              <h3>
                {selectedOpportunity.recommendedAction ||
                  "Retry payment"}
              </h3>

              <p>
                MerchantPulse recommends this action
                using the transaction's payment method,
                timing, value and observed failure
                behaviour.
              </p>
            </div>

            <div className="recovery-probability">
              <span>
                Recovery probability
              </span>

              <strong>
                {selectedOpportunity.recoveryProbability ||
                  0}%
              </strong>
            </div>

          </div>


          {/* ========================================
              WHY THIS WAS PRIORITIZED
          ======================================== */}

          <div
            className="recovery-explanation"
            style={{
              marginTop: "24px",
              padding: "24px",
              border: "1px solid rgba(197, 166, 88, 0.22)",
              borderRadius: "16px",
            }}
          >

            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  WHY THIS WAS PRIORITIZED
                </span>

                <h3>
                  Recovery decision factors
                </h3>
              </div>
            </div>

            <div
              className="explanation-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "18px",
                marginTop: "18px",
              }}
            >

              <div>
                <span>Payment method</span>
                <strong>
                  {selectedOpportunity.paymentMethod ||
                    "Unknown"}
                </strong>
              </div>

              <div>
                <span>Time window</span>
                <strong>
                  {selectedOpportunity.timeWindow ||
                    "Unknown"}
                </strong>
              </div>

              <div>
                <span>Method failure rate</span>
                <strong>
                  {selectedOpportunity.analyticsContext
                    ?.methodFailureRate || 0}%
                </strong>
              </div>

              <div>
                <span>Time-window failure</span>
                <strong>
                  {selectedOpportunity.analyticsContext
                    ?.windowFailureRate || 0}%
                </strong>
              </div>

              <div>
                <span>Overall failure rate</span>
                <strong>
                  {selectedOpportunity.analyticsContext
                    ?.overallFailureRate || 0}%
                </strong>
              </div>

              <div>
                <span>Anomaly</span>
                <strong>
                  {selectedOpportunity.analyticsContext
                    ?.anomalyDetected
                    ? "Detected"
                    : "None"}
                </strong>
              </div>

            </div>

          </div>

        </section>

      )}


      {/* ==========================================
          PRIORITY BREAKDOWN
      ========================================== */}

      <section className="recovery-priority-section">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              RECOVERY PRIORITIZATION
            </span>

            <h2>
              Where should the merchant focus first?
            </h2>

          </div>

        </div>


        <div className="recovery-priority-grid">


          {/* HIGH */}

          <div className="priority-card high">

            <div className="priority-number">
              {summary.highPriority}
            </div>

            <div>

              <span>
                HIGH PRIORITY
              </span>

              <p>
                High-value failed payments that
                should be addressed first.
              </p>

            </div>

          </div>


          {/* MEDIUM */}

          <div className="priority-card medium">

            <div className="priority-number">
              {summary.mediumPriority}
            </div>

            <div>

              <span>
                MEDIUM PRIORITY
              </span>

              <p>
                Recovery opportunities that should
                be monitored and retried.
              </p>

            </div>

          </div>


          {/* LOW */}

          <div className="priority-card low">

            <div className="priority-number">
              {summary.lowPriority}
            </div>

            <div>

              <span>
                LOW PRIORITY
              </span>

              <p>
                Lower-value opportunities with
                smaller revenue impact.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ==========================================
          RECOVERY STRATEGY
      ========================================== */}

      <section className="panel recovery-strategy">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">
              RECOVERY STRATEGY
            </span>

            <h2>
              Turn failed payments into recoverable revenue
            </h2>

          </div>

        </div>


        <div className="recovery-strategy-grid">


          <div>

            <span className="strategy-number">
              01
            </span>

            <h3>
              Prioritize
            </h3>

            <p>
              Start with high-priority failed
              transactions where the potential
              revenue impact is greatest.
            </p>

          </div>


          <div>

            <span className="strategy-number">
              02
            </span>

            <h3>
              Retry intelligently
            </h3>

            <p>
              Use the recommended recovery action
              based on payment method and observed
              failure behaviour.
            </p>

          </div>


          <div>

            <span className="strategy-number">
              03
            </span>

            <h3>
              Measure recovery
            </h3>

            <p>
              Track estimated recovery potential
              to understand where recovery efforts
              can create the most business value.
            </p>

          </div>

        </div>

      </section>


      {/* ==========================================
          BUSINESS TAKEAWAY
      ========================================== */}

      <section className="recovery-takeaway">

        <span className="eyebrow">
          BUSINESS TAKEAWAY
        </span>

        <h2>
          {formatCurrency(
            summary.estimatedRecovery
          )} in potential revenue recovery
        </h2>

        <p>
          MerchantPulse ranks failed transactions
          by recovery priority so merchants can
          focus their recovery efforts on the
          opportunities with the greatest potential
          impact.
        </p>

      </section>


      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer>

        <span>
          ● MerchantPulse Recovery Engine
        </span>

        <span>
          Automated recovery intelligence
        </span>

        <span>
          Live transaction analysis
        </span>

      </footer>

    </div>

  );

}


export default Recovery;