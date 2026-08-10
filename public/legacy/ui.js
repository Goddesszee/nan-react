// ── ui.js — NAN Premium UI layer ──
// Handles: home screen, 4-tab nav, goPage routing, greeting
// All original JS in app.js is untouched

// ── Page routing — maps new tab names to existing page IDs ──
function goBack(){
  if(window._prevPage) goPage(window._prevPage);
  else goPage('home');
}
function goPage(name) {
  // Agent Wallet's own connect hero now only lives behind the top-nav pill's
  // dropdown — don't show it as an in-app page when disconnected, redirect
  // to Swap instead.
  //
  // IMPORTANT: agentWalletAddr is only populated by prior user actions
  // (visiting this page before, sending, etc) — a fresh session/tab that
  // hasn't done any of those yet will have it unset even when a real,
  // funded agent wallet already exists server-side. Don't trust it blindly:
  // kick off a background resolve and only fall back to Swap once we've
  // actually confirmed there's no wallet, instead of assuming there isn't
  // one just because this tab hasn't fetched it yet.
  if (name === 'agent-wallet' && !(typeof agentWalletAddr !== 'undefined' && agentWalletAddr)) {
    const _addr = (typeof userAddr !== 'undefined' && userAddr) ? userAddr : localStorage.getItem('nan_dynamic_address');
    if (_addr) {
      fetch('https://nan-production.up.railway.app/api/agent-wallets', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'get-or-create', userAddress: _addr }),
        signal: AbortSignal.timeout(8000)
      }).then(r => r.json()).then(d => {
        if (d.success && d.wallet?.walletAddress) {
          agentWalletAddr = d.wallet.walletAddress;
          window.agentWalletAddr = agentWalletAddr;
          localStorage.setItem('nan_agent_addr', agentWalletAddr);
          // A real wallet was found after all — if the user is still trying
          // to view Agent Wallet (didn't navigate elsewhere meanwhile),
          // send them there properly now instead of leaving them on Swap.
          if (window._currentPage === 'swap' || window._currentPage === 'agent-wallet') goPage('agent-wallet');
        }
      }).catch(() => {});
    }
    name = 'swap';
  }
  window._prevPage = window._currentPage || 'home';
  window._currentPage = name;
  // Check userAddr OR Dynamic localStorage fallback
  const _userAddr = (typeof userAddr !== 'undefined' && userAddr) 
    ? userAddr 
    : localStorage.getItem('nan_dynamic_address');
  if (_userAddr && !userAddr) { userAddr = _userAddr; window.userAddr = _userAddr; }
  if (!_userAddr) { if(typeof toast==='function') toast('Connect wallet first', 'error'); return; }

  // Hide all pages
  document.querySelectorAll('.page:not(.page-land)').forEach(p => p.classList.remove('active'));

  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Map tab → page
  const pageMap = {
    home:       'page-agent-wallet',
    send:       'page-send',
    earn:       'page-lend',
    more:       'page-more',
    swap:       'page-swap',
    bridge:     'page-bridge',
    arcname:    'page-arcname',
    bulk:       'page-bulk',
    naira:      'page-naira',
    history:    'page-history',
    lend:       'page-lend',
    payreq:     'page-payreq',
    'payreq-new': 'page-payreq-new',
    'payreq-view': 'page-payreq-view',
    'pay-now':  'page-pay-now',
    multichain: 'page-multichain',
    market:     'page-market',
    'agent-wallet': 'page-agent-wallet',
    'agent-ai':     'page-agent-ai',
    'agent-escrow': 'page-agent-escrow',
    'agent-recurring': 'page-agent-recurring',
    'agent-invoice': 'page-agent-invoice',
    'agent-send': 'page-agent-send',
    'agent-trust': 'page-agent-trust',
    'agent-activity': 'page-agent-activity',
    'agent-nanopay': 'page-agent-nanopay',
    dashboard:      'page-dashboard',
  };

  const navMap = {
    home: 'nav-home',
    send: 'nav-swap',
    swap: 'nav-swap',
    bridge: 'nav-bridge',
    earn: 'nav-bridge',
    lend: 'nav-bridge',
    more: 'nav-more',
    arcname: 'nav-more',
    bulk:    'nav-more',
    naira:      'nav-more',
    history:    'nav-history',
    payreq:     'nav-more',
    'payreq-new': 'nav-more',
    multichain:  'nav-more',
    market:      'nav-more',
    'agent-wallet': 'nav-agent',
    'agent-escrow': 'nav-agent',
    'agent-recurring': 'nav-agent',
    'agent-invoice': 'nav-agent',
    'agent-send': 'nav-agent',
    'agent-trust': 'nav-agent',
    'agent-activity': 'nav-agent',
    'agent-nanopay': 'nav-agent',
    'career-agent': 'nav-career',
    'supplier-agent': 'nav-supplier',
    marketplace: 'nav-marketplace',
    gigs: 'nav-gigs',
    dashboard: 'nav-home',
  };

  const pageId = pageMap[name] || ('page-' + name);
  const navId  = navMap[name]  || 'nav-more';

  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  const navBtn = document.getElementById(navId);
  if (navBtn) navBtn.classList.add('active');

  // Sync desktop sidebar
  const desktopNavMap = {
    home: 'dnav-home', send: 'dnav-send', earn: 'dnav-earn',
    lend: 'dnav-earn', swap: 'dnav-swap', bridge: 'dnav-bridge',
    history: 'dnav-history',
    more: 'dnav-more', arcname: 'dnav-more', bulk: 'dnav-more',
    naira: 'dnav-more', payreq: 'dnav-more', 'payreq-new': 'dnav-more',
    'agent-wallet': 'dnav-more',
    'agent-escrow': 'dnav-more',
    'agent-recurring': 'dnav-more',
    'agent-invoice': 'dnav-more',
    'agent-send': 'dnav-more',
    'agent-trust': 'dnav-more',
    'agent-activity': 'dnav-more',
    'agent-nanopay': 'dnav-more',
    dashboard: 'dnav-home',
  };
  document.querySelectorAll('#desktopNav .dnav-btn').forEach(b => b.classList.remove('active'));
  const dnavId = desktopNavMap[name] || 'dnav-more';
  const dnavBtn = document.getElementById(dnavId);
  if (dnavBtn) dnavBtn.classList.add('active');

  // Update desktop topbar page name + context pill
  updateTopbarPageInfo(name);

  // Mobile only: hide the floating AI button while already on the AI chat page
  // (it was overlapping the chat input and bottom nav). Restored on other pages.
  if (window.innerWidth <= 768) {
    const aiBtn = document.getElementById('aiBtn');
    if (aiBtn) {
      if (name === 'agent-ai') {
        aiBtn.style.setProperty('display', 'none', 'important');
      } else {
        aiBtn.style.removeProperty('display');
      }
    }
  }

  // Trigger page-specific init
  // Keep the sidebar wallet label (address vs generic "Wallet") in sync on
  // every navigation, not just once right after login — the same class of
  // bug found earlier tonight (agentWalletAddr, initBridgeUI) where a
  // one-time check ran before the wallet had actually finished connecting
  // and never got a chance to correct itself later.
  if (typeof nanUpdateSidebarWalletLabel === 'function') nanUpdateSidebarWalletLabel();
  if (name === 'earn' || name === 'lend') initLendUI();
  if (name === 'history') renderHistory();
  if (name === 'arcname') renderArcDirectory();
  if (name === 'swap') { refreshBalances(); if(typeof fetchLiveFX==='function') fetchLiveFX(); }
  if (name === 'bulk') { renderBulkRecipients(); updateBulkSummary(); if(typeof renderPayrollGroups==='function') renderPayrollGroups(); if(typeof payrollSwitchTab==='function') payrollSwitchTab('dashboard'); }
  if (name === 'home') updateHomeScreen();
  if (name === 'dashboard') { refreshBalances(); if(typeof renderDashboard==='function') renderDashboard(); }
  if (name === 'payreq') renderPaymentRequests();
  if (name === 'multichain') { if(typeof mcRefresh==='function') setTimeout(mcRefresh, 100); }
  if (name === 'payreq-new') initNewPRForm();
  if (name === 'agent-wallet') setTimeout(function(){ if(typeof agentPageRefresh==='function') agentPageRefresh(); }, 80);
  // initBridgeUI originally only ran once at initial page load, before a
  // MetaMask wallet would have finished connecting — so the Gateway deposit
  // box stayed permanently hidden for MetaMask users (Circle users worked
  // by coincidence, since their address is set synchronously earlier).
  // Re-running it on every navigation to Bridge fixes that regardless of
  // when the wallet actually connected.
  if (name === 'bridge') setTimeout(function(){ if(typeof initBridgeUI==='function') initBridgeUI(); }, 80);
  if (name === 'agent-ai') setTimeout(function(){
    if(typeof renderAgentMsgs==='function') renderAgentMsgs();
    if(typeof renderAgentChips==='function') renderAgentChips();
    if(typeof scrollAgentBottom==='function') scrollAgentBottom();
    const inp = document.getElementById('agentInput');
    if(inp) inp.focus();
  }, 80);
}

// ── Show page (called internally by app.js) ──
function showPage(name) {
  // If app.js calls showPage('send') after connect, redirect to home
  if (name === 'send') {
    goPage('home');
    return;
  }
  goPage(name);
}

// ── Update home screen balances + greeting ──
function updateHomeScreen() {
  const usdc = parseFloat(usdcBal) || 0;
  const eurc = parseFloat(eurcBal) || 0;
  const total = usdc + (eurc * (1 / (FX || 0.9258)));

  const balEl = document.getElementById('homeBalAmt');
  const ngnEl = document.getElementById('homeBalNgn');
  const usdcEl = document.getElementById('homeUsdcBal');
  const eurcEl = document.getElementById('homeEurcBal');

  if (balEl) balEl.textContent = total.toFixed(2);
  if (ngnEl) ngnEl.textContent = '≈ ₦' + (total * 1620).toLocaleString('en-NG', {maximumFractionDigits: 0}) + ' NGN';
  if (usdcEl) usdcEl.textContent = usdc.toFixed(2) + ' USDC';
  if (eurcEl) eurcEl.textContent = eurc.toFixed(2) + ' EURC';

  // Greeting
  const greetEl = document.getElementById('homeGreetName');
  if (greetEl) {
    const name = otpEmail ? otpEmail.split('@')[0] : 'there';
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    document.getElementById('homeGreet').textContent = greet + ',';
    greetEl.textContent = name.charAt(0).toUpperCase() + name.slice(1) + ' ✦';
  }
}

// ── Hook into updateBalDisplay after app.js loads ──
window.addEventListener('load', function() {
  const _origUpdateBalDisplay = window.updateBalDisplay;
  window.updateBalDisplay = function () {
    if (_origUpdateBalDisplay) _origUpdateBalDisplay();
    updateHomeScreen();
  };
});

// ── Desktop nav visibility ──
function updateDesktopNav() {
  const isDesktop = window.innerWidth >= 769;
  const dNav = document.getElementById('desktopNav');
  const isLanding = document.getElementById('page-land')?.classList.contains('active');
  if (!dNav) return;
  if (isDesktop && !isLanding) {
    dNav.style.display = 'flex';
  } else {
    dNav.style.display = 'none';
  }
}

window.addEventListener('resize', updateDesktopNav);
document.addEventListener('DOMContentLoaded', updateDesktopNav);
// Also run immediately in case DOM is already loaded
updateDesktopNav();

// ── Desktop topbar: page name + context pill ──
function updateTopbarPageInfo(page) {
  if (window.innerWidth < 769) return;
  const nameEl  = document.getElementById('topbarPageName');
  const pillEl  = document.getElementById('topbarContextPill');
  const wrapEl  = document.getElementById('topbarPageInfo');
  if (!nameEl || !pillEl || !wrapEl) return;

  const labels = {
    home:'Home', send:'Send', earn:'Earn', lend:'Earn',
    history:'History', swap:'Swap', bridge:'Bridge',
    arcname:'.arc Name', more:'More', naira:'Naira',
    bulk:'Payroll', payreq:'Pay Requests',
    explore:'Explore',
    groupsavings:'Group Savings',
    dashboard:'Dashboard',
    'agent-escrow': 'Escrow',
    'agent-recurring': 'Recurring Payments',
    'agent-invoice': 'Invoicing',
    'agent-send': 'Agent-to-Agent',
    'agent-trust': 'Trusted Contacts',
    'agent-activity': 'Activity Log',
    'agent-nanopay': 'Nanopayments',
  };

  nameEl.textContent = labels[page] || page.charAt(0).toUpperCase()+page.slice(1);
  wrapEl.style.display = 'flex';

  // Show nav links
  const navEl = document.getElementById('topbarNav');
  if (navEl) navEl.style.display = 'flex';

  // Context pill per page
  pillEl.style.display = 'none';
  if (page === 'home') {
    const bal = document.getElementById('homeBalAmt');
    if (bal && bal.textContent !== '—') {
      pillEl.textContent = '$' + bal.textContent;
      pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.08);border:1px solid rgba(37,99,235,.2);color:var(--accent3);font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
    }
  } else if (page === 'send') {
    const usdc = parseFloat(usdcBal)||0;
    const eurc = parseFloat(eurcBal)||0;
    const total = (usdc + eurc).toFixed(2);
    pillEl.textContent = 'Balance: ' + total + ' USDC';
    pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);color:var(--accent3);font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
  } else if (page === 'earn' || page === 'lend') {
    pillEl.textContent = 'APY 4.80%';
    pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);color:#2563EB;font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
  } else if (page === 'swap') {
    pillEl.textContent = 'USDC ↔ EURC';
    pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);color:var(--accent3);font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
  } else if (page === 'bridge') {
    pillEl.textContent = 'CCTP V2';
    pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);color:#60A5FA;font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
    // Refresh gateway balance every time user opens bridge page
    if(typeof refreshGatewayBalance==='function') setTimeout(refreshGatewayBalance, 100);
    // Show/hide deposit section based on wallet type
    const depSec=document.getElementById('gatewayDepositSection');
    if(depSec) depSec.style.display=(typeof isCircleWallet!=='undefined'&&isCircleWallet)?'block':'none';
  } else if (page === 'history') {
    pillEl.textContent = 'On-chain';
    pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);color:#2563EB;font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
  } else if (page === 'dashboard') {
    const bal = document.getElementById('dashTotalBal');
    if (bal && bal.textContent !== '$0.00') {
      pillEl.textContent = bal.textContent;
      pillEl.style.cssText = 'display:inline-block;background:rgba(37,99,235,.08);border:1px solid rgba(37,99,235,.2);color:var(--accent3);font-family:"JetBrains Mono",monospace;font-size:.58rem;padding:3px 9px;border-radius:100px;';
    }
  }
}

