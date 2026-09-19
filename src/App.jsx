import React, { useEffect, useMemo, useState } from "react";
import aeroMintLogo from "./aeromint-logo.png";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aeromint-v3-backend-production.up.railway.app";

const tg = window.Telegram?.WebApp;

const fmt = (n, digits = 4) => Number(n || 0).toFixed(digits);

function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06A1.7 1.7 0 0 0 11.64 6 1.7 1.7 0 0 0 12.67 4.4V4h2.4v.4A1.7 1.7 0 0 0 16.1 6a1.7 1.7 0 0 0 1.88.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.24v2.4h-.24A1.7 1.7 0 0 0 19.4 15Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    wallet: <><path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7"/><path d="M16 14h.01"/></>,
    pickaxe: <><path d="m14 4 6 6"/><path d="M13 5 5 13"/><path d="m3 21 8-8"/><path d="m7 17 2 2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/><path d="M8 13h2M12 13h2M16 13h.01M8 17h2M12 17h2"/></>,
    coins: <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 11v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"/></>,
    gift: <><rect x="3" y="10" width="18" height="10" rx="2"/><path d="M12 10v10M2 7h20v3H2z"/><path d="M12 7H8.5a2.5 2.5 0 1 1 2.5-2.5V7ZM12 7h3.5A2.5 2.5 0 1 0 13 4.5V7Z"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.14"/><path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    play: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3V9Z"/></>,
    plusUser: <><path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M19 8v6M16 11h6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    headset: <><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v5a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2ZM20 13v5a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z"/></>,
    crown: <><path d="m3 8 4 4 5-7 5 7 4-4-2 12H5L3 8Z"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/></>,
  };
  return <svg {...common}>{paths[name] || paths.info}</svg>;
}

function Header() {
  return (
    <header className="top-header">
      <div className="brand">
        <img src={aeroMintLogo} alt="AeroMint" className="brand-logo" />
        <div>
          <div className="brand-name"><span>Aero</span> <b>Mint</b></div>
          <div className="brand-tag">Mine <i>•</i> Earn <i>•</i> Grow</div>
        </div>
      </div>
      <div className="header-actions">
        <button className="icon-button notification" aria-label="Notifications"><Icon name="bell" size={27}/><span /></button>
        <button className="icon-button" aria-label="Settings"><Icon name="settings" size={28}/></button>
      </div>
    </header>
  );
}

function SectionTitle({ title, subtitle, right, onBack }) {
  return (
    <div className="section-title">
      <button className="back-button" onClick={onBack || (() => {})} aria-label="Back"><Icon name="back" size={34}/></button>
      <div className="section-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

function BalanceCard({ balance, label = "AMT Balance" }) {
  return (
    <div className="balance-card">
      <div className="balance-icon"><Icon name="wallet" size={29}/></div>
      <div className="balance-copy">
        <span>{label}</span>
        <strong>{fmt(balance)} <em>AMT</em></strong>
        <small>≈ 0.00 (Not a real currency value)</small>
      </div>
      <Icon name="arrow" size={28}/>
    </div>
  );
}

function Mining({ data, onRefresh, onStart, busy }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const session = data?.session;
  const active = Boolean(data?.active && session);
  const ends = session?.endsAt ? new Date(session.endsAt).getTime() : 0;
  const remaining = active ? Math.max(0, Math.ceil((ends - now) / 1000)) : 0;
  const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const max = Number(session?.maxReward || 24);
  const earned = Number(data?.earned || 0);
  const progress = Math.min(100, max ? (earned / max) * 100 : 0);

  return (
    <main className="screen">
      <SectionTitle title="Mining" subtitle="Earn AMT by mining"
        right={<button className="outline-pill"><Icon name="info" size={20}/> How It Works?</button>}
      />

      <BalanceCard balance={data?.balance} />

      <section className="hero-mining">
        <div className="hero-visual">
          <div className="energy-ring" />
          <img src={aeroMintLogo} alt="" />
        </div>
        <div className="hero-text">
          <h2>{active ? "Mining Active" : "Start Mining"}</h2>
          <h3>{active ? "Earn AMT Every Hour" : "Earn AMT Every Hour"}</h3>
          <p>The more you mine, the more you earn. Keep the bot active and get rewards!</p>
        </div>
        <button className={`main-action ${active ? "active" : ""}`} onClick={active ? onRefresh : onStart} disabled={busy}>
          <Icon name={active ? "clock" : "pickaxe"} size={31}/>
          <span>{busy ? "Please wait..." : active ? `Mining ${hh}:${mm}:${ss}` : "Start Mining"}</span>
          {!active && <Icon name="arrow" size={28}/>}
        </button>
        <div className="stats-grid">
          <Stat icon="pickaxe" label="Mining Rate" value="+1.00 AMT / hour" accent />
          <Stat icon="clock" label="Daily Mining" value="24.00 AMT" sub="(est.)" accent />
          <Stat icon="coins" label="Total Mined" value={`${fmt(data?.totalMined)} AMT`} />
          <Stat icon="calendar" label="Active Time" value={active ? `${hh}:${mm}:${ss}` : "00:00:00"} />
        </div>
      </section>

      <section className="progress-card">
        <h3>Mining Progress</h3>
        <div className="progress-row">
          <div className="progress-circle" style={{"--p": `${progress}%`}}>
            <div><b>{Math.round(progress)}%</b></div>
          </div>
          <div className="progress-main">
            <div className="progress-numbers"><b>{earned.toFixed(4)}</b> / {max.toFixed(2)} AMT</div>
            <div className="progress-track"><span style={{width: `${progress}%`}} /></div>
            <p>Next reward at {max.toFixed(2)} AMT</p>
          </div>
          <div className="bonus-box"><Icon name="gift" size={27}/><span>Bonus<br/><b>+0.50 AMT</b></span></div>
        </div>
      </section>

      <div className="online-strip">
        <Icon name="info" size={23}/>
        <div><b>Keep the bot online</b><small>Mining continues as long as the bot is active.</small></div>
        <span className="online-pill"><Icon name="check" size={18}/> Online</span>
      </div>

      {active && remaining === 0 && (
        <div className="completion-message">Mining Session Completed! You earned {max.toFixed(2)} AMT</div>
      )}
    </main>
  );
}

function Stat({icon,label,value,sub,accent}) {
  return <div className="stat"><Icon name={icon} size={30}/><span>{label}</span><b className={accent ? "accent" : ""}>{value}</b>{sub && <small>{sub}</small>}</div>;
}

function Tasks({ tasks, balance, refresh, onOpenTask }) {
  const [tab, setTab] = useState("all");
  const tabs = [["all","All Tasks","grid"],["social","Social","share"],["daily","Daily","calendar"],["special","Special","gift"]];
  const filtered = useMemo(() => {
    if (tab === "all") return tasks || [];
    return (tasks || []).filter(t => String(t.category || "social").toLowerCase() === tab);
  }, [tasks, tab]);

  return (
    <main className="screen">
      <SectionTitle title="Tasks" subtitle="Complete tasks and earn AMT"
        right={<div className="mini-balance"><Icon name="wallet" size={23}/><span>Your Balance<br/><b>{fmt(balance)} <em>AMT</em></b></span></div>}
      />
      <section className="feature-banner">
        <div className="feature-icon"><Icon name="gift" size={36}/></div>
        <div><h2>Complete Tasks<br/>Earn More <span>AMT</span></h2><p>Simple tasks, real rewards. Complete daily tasks and grow your balance!</p></div>
        <img src={aeroMintLogo} alt="" />
      </section>
      <div className="task-tabs">
        {tabs.map(([id,label,icon]) => <button key={id} className={tab===id ? "selected":""} onClick={()=>setTab(id)}><Icon name={icon} size={25}/>{label}</button>)}
      </div>
      <div className="task-list">
        {filtered.length === 0 ? <div className="empty-card">No tasks available in this category.</div> : filtered.map(task => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask}/>
        ))}
      </div>
      <button className="ghost-refresh" onClick={refresh}>Refresh Tasks</button>
    </main>
  );
}

function TaskCard({task,onOpen}) {
  const icon = task.icon || (String(task.category).toLowerCase()==="daily" ? "calendar" : "users");
  const completed = task.completed || task.status === "claimed" || task.status === "completed";
  return (
    <article className="task-card">
      <div className="task-icon"><Icon name={icon} size={29}/></div>
      <div className="task-copy">
        <h3>{task.title}</h3>
        <p>{task.description || "Complete this task and earn your AMT reward."}</p>
        <strong><img src={aeroMintLogo} alt="" /> +{Number(task.reward || task.reward_amt || 0).toFixed(2)} AMT</strong>
      </div>
      <div className="task-action">
        <span className="task-count">{completed ? "1/1" : "0/1"}</span>
        <button className={completed ? "completed-btn" : "go-btn"} onClick={()=>onOpen(task)} disabled={completed}>
          {completed
            ? <><Icon name="check" size={17}/> Completed</>
            : String(task.status || task.user_status || "available").toLowerCase() === "started"
              ? <>Verify <Icon name="check" size={18}/></>
              : String(task.status || task.user_status || "available").toLowerCase() === "verified"
                ? <>Claim <Icon name="arrow" size={18}/></>
                : <>Go <Icon name="arrow" size={18}/></>}
        </button>
      </div>
    </article>
  );
}

function Referrals({data, onCopy}) {
  const link = data?.referralLink || "";
  return (
    <main className="screen">
      <SectionTitle title="Referrals" subtitle="Invite friends and earn together"
        right={<div className="mini-balance"><Icon name="users" size={23}/><span>Your Referral Link<br/><b>{fmt(data?.totalReferrals || 0, 4)} <em>AMT</em></b></span></div>}
      />
      <section className="feature-banner referral-banner">
        <div className="feature-icon"><Icon name="gift" size={36}/></div>
        <div><h2>Invite Friends<br/><span>Get Rewarded!</span></h2><p>Share your referral link with friends. You both earn AMT!</p></div>
        <div className="people-orbit"><Icon name="users" size={72}/></div>
      </section>
      <section className="ref-stats">
        <RefStat icon="users" label="Total Referrals" value={data?.totalReferrals || 0}/>
        <RefStat icon="user" label="Active Referrals" value={data?.activeReferrals || 0}/>
        <RefStat icon="gift" label="Referral Bonus" value={`+${Number(data?.referralBonus || 0.5).toFixed(2)} AMT`} accent/>
        <RefStat icon="share" label="Your Link Clicks" value={data?.linkClicks || 0}/>
      </section>
      <section className="ref-link-card">
        <div className="ref-link-head"><div className="round-icon"><Icon name="link" size={29}/></div><h3>Your Referral Link</h3></div>
        <div className="ref-link-line"><div>{link || "Referral link will appear here."}</div><button onClick={()=>onCopy(link)}><Icon name="wallet" size={20}/> Copy</button></div>
        <div className="ref-buttons"><button className="outline-action" onClick={()=>onCopy(link)}><Icon name="share" size={22}/> Share Link</button><button className="main-action small" onClick={()=>onCopy(link)}><Icon name="share" size={22}/> Invite Friends</button></div>
      </section>
      <section className="how-card">
        <div><h2>How It Works <Icon name="info" size={20}/></h2>
          {[["1","Share your referral link","Send your link to friends and family."],["2","They join and start mining","Your friend creates an account and starts mining."],["3","You both earn rewards","Get bonus AMT for every active referral."]].map(([n,a,b])=><div className="step" key={n}><span>{n}</span><div><b>{a}</b><small>{b}</small></div></div>)}
        </div>
        <div className="how-art"><img src={aeroMintLogo} alt=""/></div>
      </section>
      <div className="more-friends"><Icon name="gift" size={27}/><div><b>More Friends = More Rewards</b><small>The more people you invite, the more you earn!</small></div><button>View Details <Icon name="arrow" size={17}/></button></div>
    </main>
  );
}
function RefStat({icon,label,value,accent}) { return <div><Icon name={icon} size={29}/><span>{label}</span><b className={accent?"accent":""}>{value}</b></div>; }

function Account({user, balance, transactions, referrals}) {
  const name = user?.first_name || user?.firstName || "AeroMiner";
  const username = user?.username ? `@${user.username}` : "@AeroMintXBot";
  return (
    <main className="screen">
      <SectionTitle title="Account" subtitle="Manage your profile and settings" />
      <section className="profile-card">
        <div className="avatar"><span>{name.slice(0,1).toUpperCase()}</span></div>
        <div className="profile-main"><h2>{name} <span className="verified">✓</span></h2><p>{username}</p><b className="member-pill">● Active Member</b><small>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "Recently"}</small></div>
        <div className="profile-logo"><img src={aeroMintLogo} alt="AeroMint"/></div>
        <div className="account-id"><small>Account ID</small><b>{user?.id ? `AMT-${String(user.id).padStart(6,"0")}` : "AMT-001234"}</b><span>▢</span></div>
        <div className="profile-metrics"><span><Icon name="users" size={25}/> Total Referrals <b>{referrals?.totalReferrals || 0}</b></span><span><Icon name="pickaxe" size={25}/> Mining Power <b>+1.00 AMT/h</b></span></div>
      </section>

      <section className="wallet-card"><div className="round-icon"><Icon name="wallet" size={30}/></div><div><h3>Wallet Balance <Icon name="info" size={18}/></h3><b>{fmt(balance)} <em>AMT</em></b><small>≈ $0.00 (Not a real currency value)</small></div><button className="main-action small" disabled><Icon name="wallet" size={20}/> Withdraw <Icon name="arrow" size={19}/></button></section>

      <section className="settings-card">
        {[
          ["user","Profile Information","Update your personal details"],
          ["shield","Security","Change password & security settings"],
          ["link","Linked Accounts","Connect Telegram, X (Twitter), etc."],
          ["history","Transaction History","View your mining, rewards and activity"],
          ["users","Referral Details","Your referral link and earnings"],
          ["headset","Help & Support","Get help or contact us"],
          ["info","About AeroMint","Version 1.0.0"],
        ].map(([icon,title,sub])=><button className="settings-row" key={title}><div className="round-icon"><Icon name={icon} size={24}/></div><span><b>{title}</b><small>{sub}</small></span><Icon name="arrow" size={23}/></button>)}
        <div className="premium-row"><div className="round-icon"><Icon name="crown" size={25}/></div><span><b>Upgrade to Premium</b><small>Get more mining power, higher rewards and special benefits!</small></span><button disabled><Icon name="crown" size={18}/> Upgrade <Icon name="arrow" size={17}/></button></div>
      </section>

      {transactions?.length > 0 && <section className="transactions"><h3>Recent Transactions</h3>{transactions.slice(0,5).map(t=><div key={t.id}><span>{t.description || t.type}</span><b>+{Number(t.amount||0).toFixed(4)} AMT</b></div>)}</section>}
    </main>
  );
}

function BottomNav({page,setPage}) {
  return <nav className="bottom-nav">
    {[["mining","pickaxe","Mining"],["tasks","calendar","Tasks"],["referrals","users","Referrals"],["account","user","Account"]].map(([id,icon,label])=>
      <button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon name={icon} size={28}/><span>{label}</span></button>
    )}
  </nav>;
}

export default function App() {
  const [page,setPage] = useState("mining");
  const [user,setUser] = useState(null);
  const [dashboard,setDashboard] = useState(null);
  const [mining,setMining] = useState(null);
  const [tasks,setTasks] = useState([]);
  const [referrals,setReferrals] = useState(null);
  const [transactions,setTransactions] = useState([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  const initData = tg?.initData || "";
  const headers = { "Content-Type":"application/json", "X-Telegram-Init-Data":initData, "X-Telegram-Start-Param": tg?.initDataUnsafe?.start_param || "" };

  async function api(path, options={}) {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers:{...headers,...(options.headers||{})} });
    const data = await res.json().catch(()=>({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function loadApp() {
    setError("");
    try {
      if (tg) { tg.ready(); tg.expand(); }
      const auth = await api("/api/auth/telegram",{method:"POST",body:JSON.stringify({initData})});
      const me = await api("/api/me");
      const dash = await api("/api/dashboard");
      const mine = await api("/api/mining");
      const taskData = await api("/api/tasks");
      const refs = await api("/api/referrals");
      const tx = await api("/api/transactions");
      setUser(auth.user || me.user || me);
      setDashboard(dash);
      setMining(mine);
      setTasks(taskData.tasks || []);
      setReferrals(refs);
      setTransactions(tx.transactions || []);
    } catch (e) {
      setError(e.message || "Unable to load AeroMint.");
    } finally { setLoading(false); }
  }

  useEffect(()=>{ loadApp(); },[]);

  async function startMining() {
    setBusy(true);
    try { await api("/api/mining/start",{method:"POST"}); await loadApp(); }
    catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  async function refreshTasks(){ try { const d=await api("/api/tasks"); setTasks(d.tasks||[]); } catch(e){setError(e.message)} }

  async function openTask(task) {
    const type = String(task.verification_type || "none").toLowerCase();
    const status = String(task.status || task.user_status || "available").toLowerCase();
    const actionUrl = task.action_url || "";

    try {
      // First click: start the task and open its destination.
      if (status === "available") {
        await api(`/api/tasks/${task.id}/start`, { method: "POST" });

        if (actionUrl) {
          if (tg?.openTelegramLink && /^https?:\\/\\/t\\.me\\//i.test(actionUrl)) {
            tg.openTelegramLink(actionUrl);
          } else {
            window.open(actionUrl, "_blank", "noopener,noreferrer");
          }
        }

        await loadApp();
        return;
      }

      // Second click: verify membership/acknowledgement, then claim the reward.
      if (status === "started") {
        const verify = await api(`/api/tasks/${task.id}/verify`, { method: "POST" });
        if (verify.ok) {
          await api(`/api/tasks/${task.id}/claim`, { method: "POST" });
        }
        await loadApp();
        return;
      }

      if (status === "verified") {
        await api(`/api/tasks/${task.id}/claim`, { method: "POST" });
        await loadApp();
        return;
      }

      // Daily/no-verification tasks can still be completed in one click.
      if (type === "none" || type === "daily") {
        await api(`/api/tasks/${task.id}/start`, { method: "POST" });
        const verify = await api(`/api/tasks/${task.id}/verify`, { method: "POST" });
        if (verify.ok) await api(`/api/tasks/${task.id}/claim`, { method: "POST" });
        await loadApp();
      }
    } catch (e) {
      setError(e.message || "Unable to complete task.");
    }
  }

  async function copyReferral(link) {
    if (!link) return;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(link);
      if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
    } catch {}
  }

  const balance = dashboard?.balance ?? user?.balance ?? 0;

  if (loading) return <div className="app-shell"><div className="loading"><img src={aeroMintLogo} alt="AeroMint"/><div className="spinner"/><p>Loading AeroMint...</p></div></div>;

  return (
    <div className="app-shell">
      <Header/>
      {error && <div className="error-bar">{error}<button onClick={()=>setError("")}>×</button></div>}
      {page==="mining" && <Mining data={{...(mining||{}),balance,totalMined:dashboard?.totalMined ?? user?.total_mined}} onStart={startMining} onRefresh={loadApp} busy={busy}/>}
      {page==="tasks" && <Tasks tasks={tasks} balance={balance} refresh={refreshTasks} onOpenTask={openTask}/>}
      {page==="referrals" && <Referrals data={referrals} onCopy={copyReferral}/>}
      {page==="account" && <Account user={user} balance={balance} transactions={transactions} referrals={referrals}/>}
      <BottomNav page={page} setPage={setPage}/>
    </div>
  );
}
