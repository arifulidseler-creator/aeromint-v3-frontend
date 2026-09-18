import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aeromint-v3-backend-production.up.railway.app";

const tg = window.Telegram?.WebApp;

const TABS = [
  { id: "mining", label: "Mining", icon: "⛏️" },
  { id: "tasks", label: "Tasks", icon: "🎯" },
  { id: "referrals", label: "Referrals", icon: "👥" },
  { id: "account", label: "Account", icon: "👤" },
];

function formatAmount(value) {
  const number = Number(value || 0);
  return number.toFixed(2);
}

function formatTime(seconds) {
  const total = Math.max(0, Number(seconds || 0));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return [hours, minutes, secs]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

function getInitData() {
  return tg?.initData || "";
}

function getStartParam() {
  const telegramParam = tg?.initDataUnsafe?.start_param;

  if (telegramParam) {
    return telegramParam;
  }

  const params = new URLSearchParams(window.location.search);

  return (
    params.get("startapp") ||
    params.get("start_param") ||
    params.get("ref") ||
    ""
  );
}

function getErrorMessage(error) {
  if (!error) return "Something went wrong.";

  if (typeof error === "string") return error;

  return error.message || "Something went wrong.";
}

function getTaskId(task) {
  return task?.id ?? task?.task_id;
}

function getTaskReward(task) {
  return Number(task?.reward ?? task?.reward_amount ?? 0);
}

function getTaskStatus(task) {
  return (
    task?.status ||
    task?.user_status ||
    task?.completion_status ||
    (task?.completed ? "completed" : "")
  );
}

function isTaskCompleted(task) {
  const status = String(getTaskStatus(task)).toLowerCase();

  return (
    task?.completed === true ||
    task?.claimed === true ||
    status === "completed" ||
    status === "claimed"
  );
}

function isTaskStarted(task) {
  const status = String(getTaskStatus(task)).toLowerCase();

  return (
    task?.started === true ||
    status === "started" ||
    status === "pending" ||
    status === "verified"
  );
}

function App() {
  const [page, setPage] = useState("mining");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [mining, setMining] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [referrals, setReferrals] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [taskTab, setTaskTab] = useState("all");

  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  const [countdown, setCountdown] = useState(0);

  const telegramUser = getTelegramUser();

  const api = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": getInitData(),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Request failed with status ${response.status}`
        );
      }

      return data;
    },
    []
  );

  const loadUser = useCallback(async () => {
    const result = await api("/api/me");

    setUser(result?.user || result || null);

    return result;
  }, [api]);

  const loadDashboard = useCallback(async () => {
    const result = await api("/api/dashboard");

    setDashboard(result);

    return result;
  }, [api]);

  const loadMining = useCallback(async () => {
    const result = await api("/api/mining");

    const data = result?.mining || result;

    setMining(data);

    return data;
  }, [api]);

  const loadTasks = useCallback(async () => {
    const result = await api("/api/tasks");

    const data = Array.isArray(result)
      ? result
      : result?.tasks || result?.data || [];

    setTasks(data);

    return data;
  }, [api]);

  const loadReferrals = useCallback(async () => {
    const result = await api("/api/referrals");

    const data = result?.referrals || result;

    setReferrals(data);

    return data;
  }, [api]);

  const loadTransactions = useCallback(async () => {
    const result = await api("/api/transactions");

    const data = Array.isArray(result)
      ? result
      : result?.transactions || result?.data || [];

    setTransactions(data);

    return data;
  }, [api]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadUser(),
      loadDashboard(),
      loadMining(),
      loadTasks(),
      loadReferrals(),
      loadTransactions(),
    ]);
  }, [
    loadUser,
    loadDashboard,
    loadMining,
    loadTasks,
    loadReferrals,
    loadTransactions,
  ]);

  const authenticate = useCallback(async () => {
    const initData = getInitData();

    if (!initData) {
      throw new Error(
        "Please open AeroMint from the Telegram Mini App."
      );
    }

    const result = await api("/api/auth/telegram", {
      method: "POST",
      body: JSON.stringify({
        initData,
        referralCode: getStartParam() || undefined,
      }),
    });

    if (result?.user) {
      setUser(result.user);
    }

    return result;
  }, [api]);

  useEffect(() => {
    if (tg) {
      tg.ready();

      try {
        tg.expand();
      } catch {
        // Ignore Telegram UI errors.
      }
    }

    let mounted = true;

    async function start() {
      try {
        setLoading(true);
        setError("");

        await authenticate();
        await refreshAll();

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, [authenticate, refreshAll]);

  useEffect(() => {
    if (!mining) {
      setCountdown(0);
      return undefined;
    }

    const active =
      mining?.active === true ||
      mining?.is_active === true ||
      mining?.status === "active";

    if (!active) {
      setCountdown(0);
      return undefined;
    }

    const endValue =
      mining?.ends_at ||
      mining?.end_time ||
      mining?.endsAt ||
      mining?.session_ends_at;

    if (endValue) {
      const end = new Date(endValue).getTime();

      const update = () => {
        const remaining = Math.max(
          0,
          Math.floor((end - Date.now()) / 1000)
        );

        setCountdown(remaining);
      };

      update();

      const timer = setInterval(update, 1000);

      return () => clearInterval(timer);
    }

    const remaining =
      Number(
        mining?.remaining_seconds ??
          mining?.seconds_remaining ??
          mining?.time_remaining ??
          0
      );

    setCountdown(remaining);

    return undefined;
  }, [mining]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const balance = useMemo(() => {
    return Number(
      user?.balance ??
        user?.amt_balance ??
        dashboard?.balance ??
        dashboard?.amt_balance ??
        0
    );
  }, [user, dashboard]);

  const miningRate = useMemo(() => {
    return Number(
      mining?.rate_per_hour ??
        mining?.mining_rate_per_hour ??
        dashboard?.mining_rate_per_hour ??
        1
    );
  }, [mining, dashboard]);

  const miningToday = useMemo(() => {
    return Number(
      mining?.today_earned ??
        mining?.earned_today ??
        mining?.today ??
        0
    );
  }, [mining]);

  const miningProgress = useMemo(() => {
    const value =
      mining?.progress ??
      mining?.progress_percent ??
      mining?.percentage ??
      null;

    if (value !== null && value !== undefined) {
      return Math.max(0, Math.min(100, Number(value)));
    }

    const sessionHours = 24;
    const remainingHours = countdown / 3600;

    if (countdown > 0) {
      return Math.max(
        0,
        Math.min(
          100,
          ((sessionHours - remainingHours) / sessionHours) * 100
        )
      );
    }

    return 0;
  }, [mining, countdown]);

  const miningActive =
    mining?.active === true ||
    mining?.is_active === true ||
    mining?.status === "active";

  const miningCompleted =
    mining?.completed === true ||
    mining?.status === "completed";

  const filteredTasks = useMemo(() => {
    if (taskTab === "all") {
      return tasks;
    }

    return tasks.filter((task) => {
      const category = String(
        task?.category || task?.type || task?.task_type || ""
      ).toLowerCase();

      if (taskTab === "social") {
        return (
          category.includes("social") ||
          category.includes("telegram") ||
          category.includes("video")
        );
      }

      if (taskTab === "daily") {
        return (
          category.includes("daily") ||
          task?.daily === true ||
          task?.frequency === "daily"
        );
      }

      if (taskTab === "special") {
        return (
          category.includes("special") ||
          category.includes("referral") ||
          category.includes("bonus")
        );
      }

      return true;
    });
  }, [tasks, taskTab]);

  async function handleStartMining() {
    if (actionLoading) return;

    try {
      setActionLoading("mining");
      setError("");
      setMessage("");

      const result = await api("/api/mining/start", {
        method: "POST",
      });

      setMining(result?.mining || result);

      await Promise.all([loadDashboard(), loadUser()]);

      setMessage("Mining started successfully! ⚡");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleSyncMining() {
    if (actionLoading) return;

    try {
      setActionLoading("mining-sync");
      setError("");

      const result = await api("/api/mining/sync", {
        method: "POST",
      });

      setMining(result?.mining || result);

      await Promise.all([loadDashboard(), loadUser()]);

      if (result?.completed || result?.message) {
        setMessage(
          result?.message ||
            "Mining Session Completed! You earned 24.00 AMT"
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleClaimMining() {
    if (actionLoading) return;

    try {
      setActionLoading("mining-claim");
      setError("");

      const result = await api("/api/mining/claim", {
        method: "POST",
      });

      setMining(result?.mining || result);

      await Promise.all([
        loadDashboard(),
        loadUser(),
        loadTransactions(),
      ]);

      setMessage(
        result?.message ||
          "Mining Session Completed! You earned 24.00 AMT"
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDailyClaim() {
    if (actionLoading) return;

    try {
      setActionLoading("daily");
      setError("");

      const result = await api("/api/daily/claim", {
        method: "POST",
      });

      await Promise.all([
        loadUser(),
        loadDashboard(),
        loadTransactions(),
      ]);

      setMessage(result?.message || "Daily reward claimed! +0.50 AMT");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleTaskStart(task) {
    const taskId = getTaskId(task);

    if (!taskId || actionLoading) return;

    try {
      setActionLoading(`task-start-${taskId}`);
      setError("");

      await api(`/api/tasks/${taskId}/start`, {
        method: "POST",
      });

      await loadTasks();

      setMessage("Task started.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleTaskVerify(task) {
    const taskId = getTaskId(task);

    if (!taskId || actionLoading) return;

    try {
      setActionLoading(`task-verify-${taskId}`);
      setError("");

      const result = await api(`/api/tasks/${taskId}/verify`, {
        method: "POST",
        body: JSON.stringify({
          verificationType:
            task?.verification_type ||
            task?.verificationType ||
            "none",
        }),
      });

      await loadTasks();

      if (result?.verified || result?.message) {
        setMessage(result?.message || "Task verified.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleTaskClaim(task) {
    const taskId = getTaskId(task);

    if (!taskId || actionLoading) return;

    try {
      setActionLoading(`task-claim-${taskId}`);
      setError("");

      const result = await api(`/api/tasks/${taskId}/claim`, {
        method: "POST",
      });

      await Promise.all([
        loadTasks(),
        loadUser(),
        loadDashboard(),
        loadTransactions(),
      ]);

      setMessage(
        result?.message ||
          `Reward claimed! +${formatAmount(getTaskReward(task))} AMT`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function copyReferralLink() {
    const code =
      referrals?.referral_code ||
      referrals?.referralCode ||
      user?.referral_code ||
      user?.referralCode ||
      "";

    if (!code) {
      setError("Referral code is not available yet.");
      return;
    }

    const botUsername =
      referrals?.bot_username ||
      referrals?.botUsername ||
      "AeroMintXBot";

    const link = `https://t.me/${botUsername}?start=ref_${code}`;

    try {
      await navigator.clipboard.writeText(link);
      setMessage("Referral link copied!");
    } catch {
      setError("Could not copy the referral link.");
    }
  }

  function openTaskLink(task) {
    const url =
      task?.url ||
      task?.link ||
      task?.task_url ||
      task?.telegram_url ||
      "";

    if (!url) {
      return false;
    }

    if (tg?.openTelegramLink && url.includes("t.me/")) {
      tg.openTelegramLink(url);
    } else if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    return true;
  }

  async function handleTaskAction(task) {
    const taskId = getTaskId(task);

    if (!taskId) return;

    if (isTaskCompleted(task)) {
      return;
    }

    if (!isTaskStarted(task)) {
      openTaskLink(task);
      await handleTaskStart(task);
      return;
    }

    await handleTaskVerify(task);
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-logo">⚡</div>
        <h2>AeroMint</h2>
        <p>Loading your account...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="app-loading">
        <div className="loading-logo">⚡</div>
        <h2>AeroMint</h2>

        <p className="error-text">{error}</p>

        <button
          className="primary-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>

          <div>
            <div className="brand-name">AeroMint</div>
            <div className="brand-subtitle">AMT Rewards</div>
          </div>
        </div>

        <div className="header-balance">
          <span>AMT</span>
          <strong>{formatAmount(balance)}</strong>
        </div>
      </header>

      {error && (
        <div className="alert error-alert">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {message && (
        <div className="alert success-alert">
          <span>✓</span>
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <main className="main-content">
        {page === "mining" && (
          <MiningPage
            user={user}
            balance={balance}
            mining={mining}
            miningRate={miningRate}
            miningToday={miningToday}
            miningProgress={miningProgress}
            miningActive={miningActive}
            miningCompleted={miningCompleted}
            countdown={countdown}
            actionLoading={actionLoading}
            onStart={handleStartMining}
            onSync={handleSyncMining}
            onClaim={handleClaimMining}
          />
        )}

        {page === "tasks" && (
          <TasksPage
            tasks={filteredTasks}
            allTasks={tasks}
            taskTab={taskTab}
            setTaskTab={setTaskTab}
            actionLoading={actionLoading}
            onTaskAction={handleTaskAction}
            onTaskVerify={handleTaskVerify}
            onTaskClaim={handleTaskClaim}
            onDailyClaim={handleDailyClaim}
          />
        )}

        {page === "referrals" && (
          <ReferralPage
            referrals={referrals}
            user={user}
            onCopy={copyReferralLink}
          />
        )}

        {page === "account" && (
          <AccountPage
            user={user}
            balance={balance}
            transactions={transactions}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${page === tab.id ? "active" : ""}`}
            onClick={() => setPage(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function MiningPage({
  balance,
  mining,
  miningRate,
  miningToday,
  miningProgress,
  miningActive,
  miningCompleted,
  countdown,
  actionLoading,
  onStart,
  onSync,
  onClaim,
}) {
  return (
    <section className="page mining-page">
      <div className="page-heading">
        <div>
          <h1>Mining</h1>
          <p>Earn AMT every hour</p>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-label">Your Balance</div>
        <div className="balance-value">
          {formatAmount(balance)}
          <span> AMT</span>
        </div>
      </div>

      <div className="mining-card">
        <div className="mining-status">
          <div
            className={`status-dot ${
              miningActive ? "active" : ""
            }`}
          />

          <span>
            {miningActive
              ? "Mining Active"
              : miningCompleted
              ? "Session Completed"
              : "Mining Inactive"}
          </span>
        </div>

        <div className="mining-amount">
          <strong>+{formatAmount(miningRate)}</strong>
          <span> AMT / hour</span>
        </div>

        {miningActive ? (
          <>
            <div className="countdown-label">
              Time Remaining
            </div>

            <div className="countdown">
              {formatTime(countdown)}
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>Mining Progress</span>
                <strong>
                  {Math.round(miningProgress)}%
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${miningProgress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mining-stats">
              <div>
                <span>Today</span>
                <strong>
                  {formatAmount(miningToday)} AMT
                </strong>
              </div>

              <div>
                <span>Daily Max</span>
                <strong>24.00 AMT</strong>
              </div>
            </div>

            {countdown <= 0 && (
              <button
                className="primary-btn"
                disabled={actionLoading === "mining-sync"}
                onClick={onSync}
              >
                {actionLoading === "mining-sync"
                  ? "Syncing..."
                  : "Complete Session"}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="mining-illustration">⚡</div>

            <p className="mining-description">
              Start a 24-hour mining session and earn up to
              24.00 AMT.
            </p>

            <button
              className="primary-btn mining-start-btn"
              disabled={Boolean(actionLoading)}
              onClick={onStart}
            >
              {actionLoading === "mining"
                ? "Starting..."
                : "Start Mining"}
            </button>

            {miningCompleted && (
              <button
                className="secondary-btn"
                disabled={Boolean(actionLoading)}
                onClick={onClaim}
              >
                {actionLoading === "mining-claim"
                  ? "Claiming..."
                  : "Claim 24.00 AMT"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="info-card">
        <div className="info-icon">ℹ️</div>

        <div>
          <strong>How Mining Works</strong>

          <p>
            Start one 24-hour session. Your mining rate is
            {` ${formatAmount(miningRate)} AMT/hour`}.
          </p>

          <p>
            When the session ends, claim your earned AMT and
            start another session.
          </p>
        </div>
      </div>
    </section>
  );
}

function TasksPage({
  tasks,
  allTasks,
  taskTab,
  setTaskTab,
  actionLoading,
  onTaskAction,
  onTaskVerify,
  onTaskClaim,
  onDailyClaim,
}) {
  const dailyTask = allTasks.find((task) => {
    const title = String(task?.title || "").toLowerCase();

    return (
      title.includes("daily check") ||
      task?.task_type === "daily_checkin"
    );
  });

  return (
    <section className="page tasks-page">
      <div className="page-heading">
        <div>
          <h1>Tasks</h1>
          <p>Complete tasks and earn AMT</p>
        </div>
      </div>

      <div className="task-tabs">
        {[
          ["all", "All"],
          ["social", "Social"],
          ["daily", "Daily"],
          ["special", "Special"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={taskTab === id ? "active" : ""}
            onClick={() => setTaskTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {taskTab === "daily" && dailyTask && (
        <button
          className="daily-check-card"
          onClick={onDailyClaim}
          disabled={Boolean(actionLoading)}
        >
          <div className="task-icon">🎁</div>

          <div className="task-info">
            <strong>Daily Check-in</strong>
            <span>Claim your daily reward</span>
          </div>

          <div className="task-reward">
            +0.50
            <small>AMT</small>
          </div>
        </button>
      )}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div>🎯</div>
            <h3>No tasks available</h3>
            <p>New tasks will appear here.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const taskId = getTaskId(task);
            const completed = isTaskCompleted(task);
            const started = isTaskStarted(task);
            const reward = getTaskReward(task);

            return (
              <div
                className={`task-card ${
                  completed ? "completed" : ""
                }`}
                key={taskId}
              >
                <div className="task-icon">
                  {task?.icon ||
                    (task?.task_type === "daily_checkin"
                      ? "🎁"
                      : task?.task_type === "referral_count"
                      ? "👥"
                      : "🎯")}
                </div>

                <div className="task-info">
                  <strong>
                    {task?.title || "AeroMint Task"}
                  </strong>

                  <span>
                    {task?.description ||
                      "Complete this task to earn AMT."}
                  </span>

                  <div className="task-reward-mobile">
                    +{formatAmount(reward)} AMT
                  </div>
                </div>

                <div className="task-action-area">
                  <div className="task-reward">
                    +{formatAmount(reward)}
                    <small>AMT</small>
                  </div>

                  {completed ? (
                    <button
                      className="completed-btn"
                      disabled
                    >
                      ✓ Completed
                    </button>
                  ) : (
                    <button
                      className="task-btn"
                      disabled={
                        actionLoading ===
                          `task-start-${taskId}` ||
                        actionLoading ===
                          `task-verify-${taskId}` ||
                        actionLoading ===
                          `task-claim-${taskId}`
                      }
                      onClick={() => {
                        if (started) {
                          onTaskVerify(task);
                        } else {
                          onTaskAction(task);
                        }
                      }}
                    >
                      {actionLoading ===
                      `task-start-${taskId}`
                        ? "Starting..."
                        : actionLoading ===
                          `task-verify-${taskId}`
                        ? "Verifying..."
                        : started
                        ? "Verify"
                        : task?.url || task?.link
                        ? "Go"
                        : "Start"}
                    </button>
                  )}

                  {!completed &&
                    started &&
                    String(getTaskStatus(task)).toLowerCase() ===
                      "verified" && (
                      <button
                        className="secondary-btn small"
                        disabled={
                          actionLoading ===
                          `task-claim-${taskId}`
                        }
                        onClick={() => onTaskClaim(task)}
                      >
                        {actionLoading ===
                        `task-claim-${taskId}`
                          ? "Claiming..."
                          : "Claim"}
                      </button>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function ReferralPage({ referrals, user, onCopy }) {
  const referralCode =
    referrals?.referral_code ||
    referrals?.referralCode ||
    user?.referral_code ||
    user?.referralCode ||
    "—";

  const total =
    Number(
      referrals?.total ??
        referrals?.total_referrals ??
        referrals?.referral_count ??
        0
    ) || 0;

  const qualified =
    Number(
      referrals?.qualified ??
        referrals?.qualified_referrals ??
        referrals?.qualified_count ??
        0
    ) || 0;

  const earned =
    Number(
      referrals?.earned ??
        referrals?.referral_earnings ??
        referrals?.total_earned ??
        0
    ) || 0;

  const nextMilestone =
    referrals?.next_milestone ??
    Math.ceil((qualified + 1) / 5) * 5;

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        ((qualified % 5) / 5) * 100
      )
    );

  return (
    <section className="page referral-page">
      <div className="page-heading">
        <div>
          <h1>Referrals</h1>
          <p>Invite friends and earn AMT</p>
        </div>
      </div>

      <div className="referral-hero">
        <div className="referral-icon">👥</div>

        <h2>Invite Friends</h2>

        <p>
          Share your referral link and earn rewards when
          referrals qualify.
        </p>

        <div className="referral-code">
          <span>Your Referral Code</span>
          <strong>{referralCode}</strong>
        </div>

        <button
          className="primary-btn"
          onClick={onCopy}
        >
          🔗 Copy Referral Link
        </button>
      </div>

      <div className="referral-stats">
        <div className="stat-card">
          <span>Total Referrals</span>
          <strong>{total}</strong>
        </div>

        <div className="stat-card">
          <span>Qualified</span>
          <strong>{qualified}</strong>
        </div>

        <div className="stat-card">
          <span>Earned</span>
          <strong>{formatAmount(earned)} AMT</strong>
        </div>
      </div>

      <div className="milestone-card">
        <div className="milestone-header">
          <div>
            <strong>Referral Milestone</strong>
            <span>
              {qualified} / {nextMilestone} qualified referrals
            </span>
          </div>

          <div className="milestone-reward">
            +2.00 AMT
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p>
          Earn a 2.00 AMT bonus at each 5-referral milestone.
        </p>
      </div>

      <div className="info-card">
        <div className="info-icon">💡</div>

        <div>
          <strong>How Referrals Work</strong>

          <p>
            Your friend joins AeroMint using your referral
            link and starts mining.
          </p>

          <p>
            Qualified referrals earn the referral reward,
            with milestone bonuses at 5, 10, 15, 20 and
            25 qualified referrals.
          </p>
        </div>
      </div>
    </section>
  );
}

function AccountPage({
  user,
  balance,
  transactions,
}) {
  const firstName =
    user?.first_name ||
    user?.firstName ||
    "AeroMint User";

  const username =
    user?.username ||
    user?.telegram_username ||
    "";

  return (
    <section className="page account-page">
      <div className="page-heading">
        <div>
          <h1>Account</h1>
          <p>Your AeroMint account</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {(firstName?.[0] || "A").toUpperCase()}
        </div>

        <div>
          <h2>{firstName}</h2>

          {username && (
            <p>
              @{String(username).replace(/^@/, "")}
            </p>
          )}

          <small>AeroMint Member</small>
        </div>
      </div>

      <div className="account-balance-card">
        <span>Available Balance</span>

        <strong>
          {formatAmount(balance)}
          <small> AMT</small>
        </strong>
      </div>

      <div className="transactions-section">
        <div className="section-title">
          <h2>Transactions</h2>
          <span>{transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div>💳</div>
            <h3>No transactions yet</h3>
            <p>
              Your AMT reward transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction, index) => {
              const amount = Number(
                transaction?.amount ??
                  transaction?.value ??
                  0
              );

              const positive = amount >= 0;

              const type =
                transaction?.type ||
                transaction?.transaction_type ||
                "Reward";

              const description =
                transaction?.description ||
                transaction?.reason ||
                type;

              const date =
                transaction?.created_at ||
                transaction?.createdAt ||
                transaction?.timestamp;

              return (
                <div
                  className="transaction-item"
                  key={
                    transaction?.id ||
                    transaction?.transaction_id ||
                    index
                  }
                >
                  <div
                    className={`transaction-icon ${
                      positive ? "positive" : "negative"
                    }`}
                  >
                    {positive ? "+" : "−"}
                  </div>

                  <div className="transaction-info">
                    <strong>{description}</strong>

                    <span>
                      {date
                        ? new Date(date).toLocaleString()
                        : "Recent"}
                    </span>
                  </div>

                  <div
                    className={`transaction-amount ${
                      positive ? "positive" : "negative"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {formatAmount(amount)} AMT
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
