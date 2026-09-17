import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aeromint-v3-backend-production.up.railway.app";

const tg = window.Telegram?.WebApp;

function getTelegramInitData() {
  return tg?.initData || "";
}

async function api(path, options = {}) {
  const initData = getTelegramInitData();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(initData
        ? {
            "X-Telegram-Init-Data": initData
          }
        : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

function App() {
  const [page, setPage] = useState("mining");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [mining, setMining] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [referrals, setReferrals] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const telegramUser = useMemo(() => {
    return tg?.initDataUnsafe?.user || null;
  }, []);

  useEffect(() => {
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
      tg.setHeaderColor("#07110d");
    }

    if (tg.setBackgroundColor) {
      tg.setBackgroundColor("#07110d");
    }
  }, []);

  async function loadApp() {
    try {
      setLoading(true);
      setError("");

      await api("/api/auth/telegram", {
        method: "POST"
      });

      const [
        meData,
        dashboardData,
        miningData,
        tasksData,
        referralsData,
        transactionsData
      ] = await Promise.all([
        api("/api/me"),
        api("/api/dashboard"),
        api("/api/mining"),
        api("/api/tasks"),
        api("/api/referrals"),
        api("/api/transactions")
      ]);

      setMe(meData);
      setDashboard(dashboardData);
      setMining(miningData);
      setTasks(tasksData?.tasks || tasksData || []);
      setReferrals(referralsData);
      setTransactions(
        transactionsData?.transactions ||
          transactionsData ||
          []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to connect to AeroMint backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApp();
  }, []);

  async function startMining() {
    try {
      setError("");

      const data = await api("/api/mining/start", {
        method: "POST"
      });

      setMining(data);
      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  async function syncMining() {
    try {
      const data = await api("/api/mining/sync", {
        method: "POST"
      });

      setMining(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function claimMining() {
    try {
      setError("");

      const data = await api("/api/mining/claim", {
        method: "POST"
      });

      setMining(data);
      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  async function startTask(taskId) {
    try {
      setError("");

      await api(`/api/tasks/${taskId}/start`, {
        method: "POST"
      });

      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifyTask(taskId) {
    try {
      setError("");

      await api(`/api/tasks/${taskId}/verify`, {
        method: "POST"
      });

      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  async function claimTask(taskId) {
    try {
      setError("");

      await api(`/api/tasks/${taskId}/claim`, {
        method: "POST"
      });

      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  async function claimDaily() {
    try {
      setError("");

      await api("/api/daily/claim", {
        method: "POST"
      });

      await loadApp();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-logo">A</div>
        <h1>AeroMint</h1>
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand">
          <div className="brand-logo">A</div>

          <div>
            <div className="brand-name">AeroMint</div>
            <div className="brand-subtitle">
              AMT Reward System
            </div>
          </div>
        </div>

        <div className="balance-mini">
          <span>AMT</span>
          <strong>
            {Number(
              me?.balance ??
                dashboard?.balance ??
                0
            ).toFixed(2)}
          </strong>
        </div>
      </header>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <main className="main-content">
        {page === "mining" && (
          <MiningPage
            me={me}
            dashboard={dashboard}
            mining={mining}
            onStart={startMining}
            onSync={syncMining}
            onClaim={claimMining}
          />
        )}

        {page === "tasks" && (
          <TasksPage
            tasks={tasks}
            onStart={startTask}
            onVerify={verifyTask}
            onClaim={claimTask}
            onDaily={claimDaily}
          />
        )}

        {page === "referral" && (
          <ReferralPage
            me={me}
            referrals={referrals}
          />
        )}

        {page === "account" && (
          <AccountPage
            me={me}
            transactions={transactions}
            telegramUser={telegramUser}
          />
        )}
      </main>

      <BottomNavigation
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

function MiningPage({
  me,
  dashboard,
  mining,
  onStart,
  onSync,
  onClaim
}) {
  const active =
    mining?.active ||
    mining?.session?.status === "active";

  const session =
    mining?.session ||
    mining?.mining_session ||
    null;

  const earned = Number(
    session?.earned ??
      mining?.earned ??
      0
  );

  const rate = Number(
    mining?.ratePerHour ??
      mining?.rate_per_hour ??
      1
  );

  const maxReward = Number(
    mining?.maxReward ??
      mining?.max_reward ??
      24
  );

  const progress =
    maxReward > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (earned / maxReward) * 100
          )
        )
      : 0;

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      onSync();
    }, 60000);

    return () => clearInterval(timer);
  }, [active]);

  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          AEROMINT MINING
        </span>

        <h2>Start Mining</h2>

        <p>
          Earn AMT automatically while your
          mining session is active.
        </p>
      </div>

      <div className="balance-card">
        <span>Your Balance</span>

        <strong>
          {Number(
            me?.balance ??
              dashboard?.balance ??
              0
          ).toFixed(2)}
          <small> AMT</small>
        </strong>
      </div>

      <div className="mining-card">
        <div className="mining-icon">
          ⚡
        </div>

        <div className="mining-rate">
          <span>Mining Rate</span>

          <strong>
            +{rate.toFixed(2)} AMT
            <small>/ hour</small>
          </strong>
        </div>

        <div className="mining-status">
          {active ? (
            <>
              <span className="status-dot active" />
              Mining Active
            </>
          ) : (
            <>
              <span className="status-dot" />
              Ready to Mine
            </>
          )}
        </div>

        <div className="progress-area">
          <div className="progress-label">
            <span>Today&apos;s Mining</span>
            <strong>
              {earned.toFixed(2)} /{" "}
              {maxReward.toFixed(2)} AMT
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`
              }}
            />
          </div>

          <div className="progress-percent">
            {progress.toFixed(0)}%
          </div>
        </div>

        {active ? (
          <button
            className="primary-button active-button"
            onClick={onSync}
          >
            ⏱ Mining in Progress
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={onStart}
          >
            ⚡ Start Mining
          </button>
        )}

        {earned >= maxReward && (
          <button
            className="secondary-button"
            onClick={onClaim}
          >
            Claim Mining Reward
          </button>
        )}
      </div>

      <div className="info-grid">
        <div className="info-card">
          <span>Session</span>
          <strong>24 Hours</strong>
        </div>

        <div className="info-card">
          <span>Maximum</span>
          <strong>24.00 AMT</strong>
        </div>
      </div>
    </section>
  );
}

function TasksPage({
  tasks,
  onStart,
  onVerify,
  onClaim,
  onDaily
}) {
  const [filter, setFilter] =
    useState("all");

  const filteredTasks = tasks.filter(
    (task) => {
      if (filter === "all") return true;

      return (
        String(task.category || "")
          .toLowerCase() === filter
      );
    }
  );

  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          EARN MORE AMT
        </span>

        <h2>Tasks</h2>

        <p>
          Complete tasks and earn additional
          AMT rewards.
        </p>
      </div>

      <div className="task-tabs">
        {[
          ["all", "All"],
          ["social", "Social"],
          ["daily", "Daily"],
          ["special", "Special"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={
              filter === value
                ? "task-tab selected"
                : "task-tab"
            }
            onClick={() =>
              setFilter(value)
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-card">
            No tasks available.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={onStart}
              onVerify={onVerify}
              onClaim={onClaim}
              onDaily={onDaily}
            />
          ))
        )}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onStart,
  onVerify,
  onClaim,
  onDaily
}) {
  const status =
    task.status ||
    task.user_status ||
    "";

  const completed =
    status === "completed";

  const verified =
    status === "verified";

  return (
    <article className="task-card">
      <div className="task-icon">
        {task.category === "daily"
          ? "🎁"
          : task.category === "social"
          ? "📱"
          : "⭐"}
      </div>

      <div className="task-content">
        <div className="task-title-row">
          <h3>{task.title}</h3>

          <span className="task-reward">
            +{Number(task.reward || 0).toFixed(2)}
            AMT
          </span>
        </div>

        <p>
          {task.description ||
            "Complete this task to earn AMT."}
        </p>

        <div className="task-actions">
          {completed ? (
            <span className="completed-badge">
              ✓ Completed
            </span>
          ) : task.is_daily ? (
            <button
              className="task-button"
              onClick={onDaily}
            >
              Claim
            </button>
          ) : verified ? (
            <button
              className="task-button"
              onClick={() => onClaim(task.id)}
            >
              Claim
            </button>
          ) : status === "started" ? (
            <button
              className="task-button"
              onClick={() =>
                onVerify(task.id)
              }
            >
              Verify
            </button>
          ) : (
            <button
              className="task-button"
              onClick={() =>
                onStart(task.id)
              }
            >
              Go
            </button>
          )}

          {task.action_url && !completed && (
            <a
              className="task-link"
              href={task.action_url}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ReferralPage({
  me,
  referrals
}) {
  const referralCode =
    referrals?.referralCode ||
    referrals?.referral_code ||
    me?.referralCode ||
    me?.referral_code ||
    "";

  const referralCount = Number(
    referrals?.qualifiedCount ??
      referrals?.qualified_count ??
      referrals?.count ??
      0
  );

  const referralLink =
    referrals?.referralLink ||
    referrals?.referral_link ||
    "";

  async function copyReferral() {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(
        referralLink
      );
    } catch {
      // Clipboard may be unavailable
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          INVITE & EARN
        </span>

        <h2>Referral</h2>

        <p>
          Invite friends and earn AMT rewards.
        </p>
      </div>

      <div className="referral-card">
        <div className="referral-icon">
          👥
        </div>

        <h3>
          Invite Friends
        </h3>

        <p>
          Your referral reward is
          <strong> 0.50 AMT</strong> per
          qualified referral.
        </p>

        <div className="referral-count">
          <span>Qualified Referrals</span>
          <strong>{referralCount}</strong>
        </div>

        <div className="referral-code-box">
          <span>Your Referral Code</span>
          <strong>
            {referralCode || "Loading..."}
          </strong>
        </div>

        {referralLink && (
          <button
            className="primary-button"
            onClick={copyReferral}
          >
            🔗 Copy Referral Link
          </button>
        )}
      </div>

      <div className="milestone-card">
        <h3>Referral Milestones</h3>

        <div className="milestone">
          <span>5 Referrals</span>
          <strong>+2.00 AMT</strong>
        </div>

        <div className="milestone">
          <span>10 Referrals</span>
          <strong>+2.00 AMT</strong>
        </div>

        <div className="milestone">
          <span>15 Referrals</span>
          <strong>+2.00 AMT</strong>
        </div>
      </div>
    </section>
  );
}

function AccountPage({
  me,
  transactions,
  telegramUser
}) {
  const name =
    me?.firstName ||
    me?.first_name ||
    telegramUser?.first_name ||
    "User";

  const username =
    me?.username ||
    telegramUser?.username ||
    "";

  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow">
          YOUR ACCOUNT
        </span>

        <h2>Account</h2>

        <p>
          Manage your AeroMint account and
          transaction history.
        </p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h3>{name}</h3>

          {username && (
            <p>@{username}</p>
          )}
        </div>
      </div>

      <div className="account-balance-card">
        <span>Current Balance</span>

        <strong>
          {Number(me?.balance || 0).toFixed(2)}
          <small> AMT</small>
        </strong>
      </div>

      <div className="transactions-card">
        <div className="section-title">
          <h3>Transactions</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-card">
            No transactions yet.
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map(
              (transaction) => (
                <div
                  className="transaction"
                  key={
                    transaction.id ||
                    transaction.reference_key
                  }
                >
                  <div>
                    <strong>
                      {transaction.description ||
                        transaction.type ||
                        "AMT Transaction"}
                    </strong>

                    <span>
                      {transaction.created_at
                        ? new Date(
                            transaction.created_at
                          ).toLocaleString()
                        : ""}
                    </span>
                  </div>

                  <strong
                    className={
                      Number(
                        transaction.amount
                      ) >= 0
                        ? "amount-positive"
                        : "amount-negative"
                    }
                  >
                    {Number(
                      transaction.amount || 0
                    ) >= 0
                      ? "+"
                      : ""}
                    {Number(
                      transaction.amount || 0
                    ).toFixed(2)}{" "}
                    AMT
                  </strong>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function BottomNavigation({
  page,
  setPage
}) {
  const items = [
    ["mining", "⚡", "Mining"],
    ["tasks", "🎯", "Tasks"],
    ["referral", "👥", "Referral"],
    ["account", "👤", "Account"]
  ];

  return (
    <nav className="bottom-navigation">
      {items.map(
        ([value, icon, label]) => (
          <button
            key={value}
            className={
              page === value
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage(value)
            }
          >
            <span className="nav-icon">
              {icon}
            </span>

            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  );
}

export default App;
