import { useEffect, useState } from "react";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Recovery Intelligence state
  const [recoveryData, setRecoveryData] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryPrioritized, setRecoveryPrioritized] = useState(false);

  // =====================================================
  // FETCH TRANSACTIONS
  // =====================================================

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/transactions"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const result = await response.json();

      setTransactions(
        result.transactions?.transactions || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch transactions:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const query = search.toLowerCase();

      const matchesSearch =
        transaction.id
          ?.toLowerCase()
          .includes(query) ||
        transaction.customer
          ?.toLowerCase()
          .includes(query) ||
        transaction.city
          ?.toLowerCase()
          .includes(query) ||
        transaction.category
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        transaction.status === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" ||
        transaction.paymentMethod === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    }
  );

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalTransactions =
    transactions.length;

  const successfulTransactions =
    transactions.filter(
      (t) => t.status === "SUCCESS"
    ).length;

  const failedTransactions =
    transactions.filter(
      (t) => t.status === "FAILED"
    ).length;

  const failedRevenue =
    transactions
      .filter(
        (t) => t.status === "FAILED"
      )
      .reduce(
        (sum, t) =>
          sum + Number(t.amount || 0),
        0
      );

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    return new Date(timestamp).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // TRANSACTION DETAIL
  // =====================================================

  const openTransaction = async (transaction) => {
    setSelectedTransaction(transaction);

    // Reset previous recovery data and priority state
    setRecoveryData(null);
    setRecoveryPrioritized(false);

    // Only failed payments need recovery intelligence
    if (transaction.status !== "FAILED") {
      return;
    }

    try {
      setRecoveryLoading(true);

     const response = await fetch(
  `http://localhost:5000/api/transactions/${transaction.id}`
);
      if (!response.ok) {
        throw new Error(
          "Failed to fetch recovery intelligence"
        );
      }

      const result = await response.json();

      setRecoveryData(
        result.recovery ||
        result
      );
    } catch (error) {
      console.error(
        "Recovery Intelligence error:",
        error
      );

      setRecoveryData(null);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const prioritizeRecovery = () => {
    if (!selectedTransaction || !recoveryData) return;

    setRecoveryPrioritized(true);

    console.log(
      "Recovery prioritized:",
      selectedTransaction.id
    );
  };

  const closeTransaction = () => {
    setSelectedTransaction(null);
    setRecoveryData(null);
    setRecoveryLoading(false);
    setRecoveryPrioritized(false);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="transactions-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-header">

        <div>

          <div className="eyebrow">
            TRANSACTION INTELLIGENCE
          </div>

          <h1>
            Transactions
          </h1>

          <p>
            Monitor payments and identify
            revenue recovery opportunities.
          </p>

        </div>

        <button
          className="refresh-button"
          onClick={fetchTransactions}
        >
          ↻ Refresh
        </button>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="transaction-summary">

        <div className="transaction-stat">

          <span>
            Total Transactions
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


        <div className="transaction-stat">

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


        <div className="transaction-stat">

          <span>
            Failed
          </span>

          <strong className="danger-value">
            {failedTransactions.toLocaleString(
              "en-IN"
            )}
          </strong>

          <small>
            Require attention
          </small>

        </div>


        <div className="transaction-stat">

          <span>
            Revenue At Risk
          </span>

          <strong>
            {formatCurrency(
              failedRevenue
            )}
          </strong>

          <small>
            From failed payments
          </small>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="transaction-filters">

        <div className="search-wrapper">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search transaction, customer, city..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >

          <option value="ALL">
            All Status
          </option>

          <option value="SUCCESS">
            Successful
          </option>

          <option value="FAILED">
            Failed
          </option>

        </select>


        <select
          value={methodFilter}
          onChange={(e) =>
            setMethodFilter(e.target.value)
          }
        >

          <option value="ALL">
            All Methods
          </option>

          <option value="UPI">
            UPI
          </option>

          <option value="CARD">
            Card
          </option>

          <option value="NETBANKING">
            Netbanking
          </option>

          <option value="WALLET">
            Wallet
          </option>

        </select>

      </div>


      {/* =================================================
          TRANSACTION TABLE
      ================================================= */}

      <div className="transactions-card">

        <div className="table-header">

          <div>

            <span className="eyebrow">
              PAYMENT ACTIVITY
            </span>

            <h2>
              Transaction history
            </h2>

          </div>

          <span className="transaction-count">
            {filteredTransactions.length} records
          </span>

        </div>


        {loading ? (

          <div className="loading-state">

            <div className="loading-spinner">
              ◌
            </div>

            Loading transaction intelligence...

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Transaction
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Method
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredTransactions.map(
                  (transaction) => (

                    <tr
                      key={transaction.id}
                      className={
                        transaction.status ===
                        "FAILED"
                          ? "failed-row"
                          : ""
                      }
                    >

                      {/* TRANSACTION */}

                      <td>

                        <button
                          className="transaction-id-button"
                          onClick={() =>
                            openTransaction(
                              transaction
                            )
                          }
                        >
                          {transaction.id}
                        </button>

                      </td>


                      {/* CUSTOMER */}

                      <td>

                        <div className="customer-cell">

                          <div className="customer-avatar">

                            {transaction.customer
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>

                          <span>
                            {transaction.customer}
                          </span>

                        </div>

                      </td>


                      {/* AMOUNT */}

                      <td>

                        <strong>
                          {formatCurrency(
                            transaction.amount
                          )}
                        </strong>

                      </td>


                      {/* METHOD */}

                      <td>

                        <span className="method-badge">
                          {transaction.paymentMethod}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td>

                        {transaction.status ===
                        "SUCCESS" ? (

                          <span className="status success">
                            ● Successful
                          </span>

                        ) : (

                          <span className="status failed">
                            ● Failed
                          </span>

                        )}

                      </td>


                      {/* CITY */}

                      <td>
                        {transaction.city}
                      </td>


                      {/* CATEGORY */}

                      <td>
                        {transaction.category}
                      </td>


                      {/* ACTION */}

                      <td>

                        <button
                          className="view-button"
                          onClick={() =>
                            openTransaction(
                              transaction
                            )
                          }
                        >
                          View →
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {filteredTransactions.length ===
              0 && (

              <div className="empty-state">

                <div>
                  ◌
                </div>

                <strong>
                  No transactions found
                </strong>

                <p>
                  Try changing your search
                  or filters.
                </p>

              </div>

            )}

          </div>

        )}

      </div>


      {/* =================================================
          TRANSACTION DETAIL OVERLAY
      ================================================= */}

      {selectedTransaction && (

        <div
          className="transaction-overlay"
          onClick={closeTransaction}
        >

          <div
            className="transaction-detail-panel"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* PANEL HEADER */}

            <div className="detail-header">

              <div>

                <span className="eyebrow">
                  TRANSACTION DETAIL
                </span>

                <h2>
                  {selectedTransaction.id}
                </h2>

              </div>

              <button
                className="detail-close"
                onClick={closeTransaction}
              >
                ×
              </button>

            </div>


            {/* STATUS */}

            <div
              className={`detail-status ${
                selectedTransaction.status ===
                "FAILED"
                  ? "detail-failed"
                  : "detail-success"
              }`}
            >

              <span>

                {selectedTransaction.status ===
                "FAILED"
                  ? "● Payment Failed"
                  : "● Payment Successful"}

              </span>

            </div>


            {/* AMOUNT */}

            <div className="detail-amount">

              <span>
                Transaction amount
              </span>

              <strong>
                {formatCurrency(
                  selectedTransaction.amount
                )}
              </strong>

            </div>


            {/* DETAILS */}

            <div className="detail-grid">

              <div>

                <span>
                  Customer
                </span>

                <strong>
                  {selectedTransaction.customer}
                </strong>

              </div>


              <div>

                <span>
                  Payment Method
                </span>

                <strong>
                  {selectedTransaction.paymentMethod}
                </strong>

              </div>


              <div>

                <span>
                  City
                </span>

                <strong>
                  {selectedTransaction.city}
                </strong>

              </div>


              <div>

                <span>
                  Category
                </span>

                <strong>
                  {selectedTransaction.category}
                </strong>

              </div>


              <div>

                <span>
                  Device
                </span>

                <strong>
                  {selectedTransaction.device ||
                    "—"}
                </strong>

              </div>


              <div>

                <span>
                  Date
                </span>

                <strong>
                  {formatDate(
                    selectedTransaction.timestamp
                  )}
                </strong>

              </div>

            </div>


            {/* =================================================
                RECOVERY INTELLIGENCE
            ================================================= */}

            {selectedTransaction.status ===
              "FAILED" && (

              <div className="recovery-opportunity">

                <div className="eyebrow">
                  RECOVERY INTELLIGENCE
                </div>


                <h3>
                  Revenue recovery opportunity
                </h3>


                {recoveryLoading ? (

                  <div className="recovery-loading">

                    <div className="loading-spinner">
                      ◌
                    </div>

                    Analyzing payment recovery...

                  </div>

                ) : recoveryData ? (

                  <>

                    {/* RECOVERY STATUS */}

                    <div className="recovery-status">

                      <span>
                        Recovery eligibility
                      </span>

                      <strong>
                        {recoveryData.eligible
                          ? "Eligible"
                          : "Not eligible"}
                      </strong>

                    </div>


                    {/* PRIORITY */}

                    <div className="recovery-priority">

                      <span>
                        Priority
                      </span>

                      <strong>
                        {recoveryData.priority ||
                          "—"}
                      </strong>

                    </div>


                    {/* RECOVERY PROBABILITY */}

                    <div className="recovery-probability">

                      <span>
                        Recovery probability
                      </span>

                      <strong>
                        {recoveryData.recoveryProbability != null
                          ? `${recoveryData.recoveryProbability}%`
                          : "—"}
                      </strong>

                    </div>


                    {/* ESTIMATED RECOVERY */}

                    <div className="recovery-value">

                      <span>
                        Estimated recoverable
                      </span>

                      <strong>
                        {formatCurrency(
                          recoveryData.estimatedRecovery
                        )}
                      </strong>

                    </div>


                    {/* RECOMMENDED ACTION */}

                    <div className="recovery-action">

                      <span>
                        Recommended action
                      </span>

                      <strong>
                        {recoveryData.recommendedAction ||
                          "Review payment"}
                      </strong>

                    </div>


                    {/* REASON */}

                    {recoveryData.reason && (

                      <p className="recovery-reason">
                        {recoveryData.reason}
                      </p>

                    )}


                    {/* PAYMENT CONTEXT */}

                    <div className="recovery-context">

                      {recoveryData.paymentMethod && (

                        <span>
                          Method:{" "}
                          <strong>
                            {recoveryData.paymentMethod}
                          </strong>
                        </span>

                      )}

                      {recoveryData.timeWindow && (

                        <span>
                          Time:{" "}
                          <strong>
                            {recoveryData.timeWindow}
                          </strong>
                        </span>

                      )}

                    </div>


                    <button
                      type="button"
                      className="recovery-button"
                      onClick={prioritizeRecovery}
                      disabled={recoveryPrioritized}
                    >
                      {recoveryPrioritized
                        ? "✓ Recovery Prioritized"
                        : "Prioritize Recovery →"}
                    </button>

                    {recoveryPrioritized && (
                      <div className="recovery-prioritized-message">
                        <strong>Recovery prioritized</strong>
                        <span>
                          Recovery workflow has been prioritized for {selectedTransaction.id}.
                        </span>
                      </div>
                    )}

                  </>

                ) : (

                  <div className="recovery-error">

                    <p>
                      Recovery intelligence is
                      currently unavailable.
                    </p>

                    <small>
                      Please make sure the
                      Recovery API is running.
                    </small>

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {selectedTransaction.status ===
              "SUCCESS" && (

              <div className="success-detail">

                <div className="eyebrow">
                  PAYMENT HEALTH
                </div>

                <h3>
                  Transaction completed successfully
                </h3>

                <p>
                  No recovery action is required
                  for this transaction.
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default Transactions;