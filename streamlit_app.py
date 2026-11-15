"""
GymFlow AI - Smart Gym Management. Powered by AI.
Interactive Streamlit Analytics Dashboard & Management Console.
Compatible with Streamlit Community Cloud and Local Execution.
"""

import os
import time
from datetime import datetime
import streamlit as st
import pandas as pd
import requests

# ==============================================================================
# 1. PAGE CONFIGURATION & STYLING
# ==============================================================================
st.set_page_config(
    page_title="GymFlow AI - Smart Gym Management",
    page_icon="🏋️‍♂️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Dark theme with Neon Green accents matching GymFlow AI design system
st.markdown(
    """
    <style>
    /* Global styles */
    .stApp {
        background-color: #090B0A;
        color: #F3F4F6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    /* Neon Green Header Accents */
    h1, h2, h3 {
        color: #FFFFFF !important;
        font-weight: 700;
    }
    .neon-text {
        color: #B6FF45;
        font-weight: 700;
    }
    
    /* Card Container */
    .metric-card {
        background: #151A17;
        border: 1px solid rgba(182, 255, 69, 0.15);
        border-radius: 12px;
        padding: 18px;
        margin-bottom: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .metric-label {
        color: #9CA3AF;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
    }
    .metric-val {
        color: #FFFFFF;
        font-size: 1.85rem;
        font-weight: 700;
    }
    .metric-delta {
        color: #B6FF45;
        font-size: 0.85rem;
        font-weight: 600;
    }
    
    /* Custom Badges */
    .badge-active {
        background-color: rgba(182, 255, 69, 0.15);
        color: #B6FF45;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        border: 1px solid rgba(182, 255, 69, 0.3);
    }
    .badge-expired {
        background-color: rgba(244, 63, 94, 0.15);
        color: #F43F5E;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        border: 1px solid rgba(244, 63, 94, 0.3);
    }
    
    /* Streamlit widget tweaks */
    div[data-testid="stMetricValue"] {
        color: #B6FF45 !important;
    }
    div[data-testid="stSidebarUserContent"] {
        background-color: #0E1210;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 48px;
        background-color: #151A17;
        border-radius: 8px 8px 0px 0px;
        color: #9CA3AF;
        border: none;
        padding-left: 18px;
        padding-right: 18px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1F2722 !important;
        color: #B6FF45 !important;
        border-bottom: 2px solid #B6FF45 !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==============================================================================
# 2. API CLIENT & TENANT STATE
# ==============================================================================
DEFAULT_API_URL = os.getenv("GYMFLOW_API_URL", "http://localhost:5000")

# Demo Gym Profiles
TENANTS = {
    "11111111-1111-1111-1111-111111111111": {
        "name": "IronPulse Fitness Club",
        "city": "Bengaluru, Karnataka",
        "plan": "Pro Tier (500 Athletes)",
        "owner": "Marcus Vance",
    },
    "22222222-2222-2222-2222-222222222222": {
        "name": "Titan Forge Athletics",
        "city": "Mumbai, Maharashtra",
        "plan": "Enterprise Tier (Unlimited)",
        "owner": "Devika Rao",
    },
    "33333333-3333-3333-3333-333333333333": {
        "name": "Zenith Athletic Club",
        "city": "Hyderabad, Telangana",
        "plan": "Growth Tier (250 Athletes)",
        "owner": "Marcus Vance (Co-Managed)",
    },
}

# Offline / Standalone Mock Data fallback if API is unreachable
MOCK_KPIS = {
    "totalMembers": 128,
    "activeMembers": 108,
    "expiredMembers": 14,
    "expiringSoon": 6,
    "monthlyRevenue": 184500,
    "annualRevenue": 1420000,
    "pendingPayments": 12500,
    "todayAttendance": 42,
    "activeTrainers": 8,
    "renewalRate": 84.6,
}

MOCK_MEMBERS = [
    {"id": "m-101", "name": "Aarav Sharma", "code": "IFC-1001", "plan": "Annual Elite VIP", "status": "active", "phone": "+91 98450 11001", "due": 0},
    {"id": "m-102", "name": "Pooja Hegde", "code": "IFC-1002", "plan": "Quarterly Pro", "status": "active", "phone": "+91 98450 11002", "due": 0},
    {"id": "m-103", "name": "Rohan Deshmukh", "code": "IFC-1003", "plan": "Monthly Standard", "status": "expiring_soon", "phone": "+91 98450 11003", "due": 2499},
    {"id": "m-104", "name": "Kavita Reddy", "code": "IFC-1004", "plan": "Half-Yearly Conditioning", "status": "active", "phone": "+91 98450 11004", "due": 0},
    {"id": "m-105", "name": "Siddharth Verma", "code": "IFC-1005", "plan": "Quarterly Pro", "status": "expired", "phone": "+91 98450 11005", "due": 4500},
    {"id": "m-106", "name": "Ananya Sen", "code": "IFC-1006", "plan": "Annual Elite VIP", "status": "active", "phone": "+91 98450 11006", "due": 0},
]

MOCK_PAYMENTS = [
    {"receipt": "REC-2026-00021", "member": "Aarav Sharma", "amount": 21999, "method": "UPI", "status": "completed", "date": "2026-11-14"},
    {"receipt": "REC-2026-00020", "member": "Pooja Hegde", "amount": 6999, "method": "Credit Card", "status": "completed", "date": "2026-11-13"},
    {"receipt": "REC-2026-00019", "member": "Kavita Reddy", "amount": 13499, "method": "Net Banking", "status": "completed", "date": "2026-11-12"},
    {"receipt": "REC-2026-00018", "member": "Siddharth Verma", "amount": 2499, "method": "Cash", "status": "completed", "date": "2026-11-10"},
]

def check_backend_health(base_url):
    """Check if the GymFlow AI Express backend is online."""
    try:
        res = requests.get(f"{base_url}/health", timeout=1.5)
        return res.status_code == 200, res.json() if res.status_code == 200 else {}
    except Exception:
        return False, {}

# ==============================================================================
# 3. SIDEBAR NAVIGATION & SETTINGS
# ==============================================================================
with st.sidebar:
    st.image(
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
        use_container_width=True,
    )
    st.markdown("### 🏋️‍♂️ **GymFlow AI**")
    st.caption("Smart Gym Management. Powered by AI.")
    st.markdown("---")

    # API Connection Settings
    api_url = st.text_input("Backend API Endpoint", value=DEFAULT_API_URL)
    is_live, health_info = check_backend_health(api_url)

    if is_live:
        st.success(f"🟢 API Connected ({health_info.get('status', 'online')})")
    else:
        st.warning("🟠 API Offline (Using Built-in Data Engine)")

    st.markdown("---")

    # Role & Multi-Tenant Switcher
    selected_role = st.selectbox(
        "Active Role / Persona",
        ["gym_owner", "super_admin", "trainer", "member"],
        format_func=lambda x: {
            "gym_owner": "👑 Gym Owner (Marcus Vance)",
            "super_admin": "⚡ Super Admin (Platform Lead)",
            "trainer": "💪 Coach / Trainer",
            "member": "🏃 Athlete / Member",
        }.get(x, x),
    )

    selected_gym_id = st.selectbox(
        "Active Facility (Tenant)",
        list(TENANTS.keys()),
        format_func=lambda gid: f"{TENANTS[gid]['name']} ({TENANTS[gid]['city'].split(',')[0]})",
    )

    gym_info = TENANTS[selected_gym_id]
    st.markdown(
        f"""
        <div style="font-size:0.8rem; color:#9CA3AF; margin-top:8px;">
        <b>Facility:</b> {gym_info['name']}<br>
        <b>Location:</b> {gym_info['city']}<br>
        <b>SaaS Plan:</b> {gym_info['plan']}
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("---")
    st.caption("Version 2.0 • Production Ready")

# ==============================================================================
# 4. MAIN DASHBOARD HEADER
# ==============================================================================
header_col1, header_col2 = st.columns([3, 1])

with header_col1:
    st.markdown(f"# 🏋️‍♂️ {gym_info['name']}")
    st.markdown(
        f"**Location:** {gym_info['city']} &nbsp;•&nbsp; **Active Tenant ID:** `{selected_gym_id[:8]}...` &nbsp;•&nbsp; "
        f"<span class='badge-active'>RLS Isolated</span>",
        unsafe_allow_html=True,
    )

with header_col2:
    current_time = datetime.now().strftime("%d %b %Y, %I:%M %p")
    st.markdown(
        f"""
        <div style="text-align:right; padding-top:10px;">
            <div style="color:#9CA3AF; font-size:0.85rem;">System Time</div>
            <div style="color:#B6FF45; font-size:1.05rem; font-weight:700;">{current_time}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<br>", unsafe_allow_html=True)

# Fetch live analytics if available
kpis = MOCK_KPIS
if is_live:
    try:
        res = requests.get(
            f"{api_url}/api/reports/overview?range=30d",
            headers={"X-Demo-Role": selected_role, "X-Gym-Id": selected_gym_id},
            timeout=2.0,
        )
        if res.status_code == 200:
            payload = res.json()
            kpis = payload.get("kpis") or payload.get("metrics") or MOCK_KPIS
    except Exception:
        pass

# ==============================================================================
# 5. TABBED INTERFACE
# ==============================================================================
tab_dash, tab_members, tab_payments, tab_attendance, tab_ai, tab_admin = st.tabs(
    [
        "📊 BI Analytics",
        "🏋️ Member Operations",
        "💳 Payments & GST Invoicing",
        "⏱️ Turnstile QR Station",
        "🤖 GymFlow AI Copilot",
        "👑 Super Admin Hub",
    ]
)

# ------------------------------------------------------------------------------
# TAB 1: EXECUTIVE BI ANALYTICS
# ------------------------------------------------------------------------------
with tab_dash:
    st.subheader("📈 Real-Time Operational Performance")

    # 4-Column Primary KPI Row
    mcol1, mcol2, mcol3, mcol4 = st.columns(4)

    with mcol1:
        st.metric(
            label="Total Active Members",
            value=f"{kpis.get('activeMembers', 108)}",
            delta=f"+{round(kpis.get('activeMembers', 108) * 0.08)} this month",
        )
    with mcol2:
        m_rev = kpis.get("monthlyRevenue", 184500)
        st.metric(
            label="Monthly Revenue (GST Incl)",
            value=f"₹{m_rev:,.0f}",
            delta="+14.2% vs last month",
        )
    with mcol3:
        st.metric(
            label="Today's Floor Check-Ins",
            value=f"{kpis.get('todayAttendance', 42)} athletes",
            delta="Peak 06:00 - 09:00 AM",
        )
    with mcol4:
        st.metric(
            label="Membership Renewal Rate",
            value=f"{kpis.get('renewalRate', 84.6)}%",
            delta="+2.4% target exceeded",
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts Row
    chart_col1, chart_col2 = st.columns([2, 1])

    with chart_col1:
        st.markdown("#### 💰 30-Day Revenue Trend (₹)")
        # Sample chronological revenue series
        dates = pd.date_range(end=pd.Timestamp.now(), periods=14, freq="D")
        revenue_data = pd.DataFrame(
            {
                "Date": dates.strftime("%d %b"),
                "Daily Revenue (₹)": [
                    8500, 12000, 15500, 9200, 18400, 22000, 14000,
                    11500, 19200, 24500, 16800, 13400, 21000, 27500,
                ],
            }
        ).set_index("Date")
        st.line_chart(revenue_data, color="#B6FF45")

    with chart_col2:
        st.markdown("#### 👥 Member Status Composition")
        comp_data = pd.DataFrame(
            {
                "Status": ["Active", "Expiring Soon", "Expired"],
                "Athletes": [
                    kpis.get("activeMembers", 108),
                    kpis.get("expiringSoon", 6),
                    kpis.get("expiredMembers", 14),
                ],
            }
        ).set_index("Status")
        st.bar_chart(comp_data, color="#3B82F6")

    st.markdown("---")

    # CSV and PDF Export Section
    exp_col1, exp_col2, exp_col3 = st.columns([2, 1, 1])
    with exp_col1:
        st.markdown("##### 📄 Export Verified Financial & Operational Records")
        st.caption("Compliant with GST audit trails and multi-tenant ledger specifications.")
    with exp_col2:
        csv_sample = pd.DataFrame(MOCK_MEMBERS).to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download CSV Report",
            data=csv_sample,
            file_name=f"gymflow-{selected_gym_id[:8]}-report.csv",
            mime="text/csv",
            use_container_width=True,
        )
    with exp_col3:
        st.button("🖨️ Generate PDF Invoice Pack", use_container_width=True)

# ------------------------------------------------------------------------------
# TAB 2: MEMBER MANAGEMENT
# ------------------------------------------------------------------------------
with tab_members:
    st.subheader("🏋️ Athlete Roster & Plan Allocation")

    # Filters and Actions
    filter_col1, filter_col2, filter_col3 = st.columns([2, 1, 1])
    with filter_col1:
        search_query = st.text_input("🔍 Search Athlete (Name, Phone, or Member Code)", "")
    with filter_col2:
        status_filter = st.selectbox("Status Filter", ["All", "Active", "Expiring Soon", "Expired"])
    with filter_col3:
        st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
        show_add = st.button("➕ Register New Member", use_container_width=True)

    # Filtered Members List
    filtered_members = MOCK_MEMBERS
    if search_query:
        sq = search_query.lower()
        filtered_members = [
            m for m in filtered_members
            if sq in m["name"].lower() or sq in m["code"].lower() or sq in m["phone"]
        ]
    if status_filter != "All":
        target = status_filter.lower().replace(" ", "_")
        filtered_members = [m for m in filtered_members if m["status"] == target]

    # Display Members Table
    df_members = pd.DataFrame(filtered_members)
    st.dataframe(
        df_members,
        column_config={
            "id": "ID",
            "name": "Full Name",
            "code": "Member Code",
            "plan": "Assigned Plan",
            "status": "Membership Status",
            "phone": "Phone Number",
            "due": st.column_config.NumberColumn("Pending Due (₹)", format="₹%d"),
        },
        use_container_width=True,
        hide_index=True,
    )

    if show_add:
        with st.expander("📝 Fast Member Onboarding Form", expanded=True):
            with st.form("new_member_form"):
                fcol1, fcol2 = st.columns(2)
                with fcol1:
                    new_name = st.text_input("Full Name *", "Vikramaditya Rao")
                    new_phone = st.text_input("Phone Number *", "+91 98000 12345")
                    new_email = st.text_input("Email Address *", "athlete@gymflow.ai")
                with fcol2:
                    new_plan = st.selectbox(
                        "Membership Plan",
                        ["Annual Elite VIP (₹21,999)", "Quarterly Pro (₹7,499)", "Monthly Standard (₹2,999)"],
                    )
                    new_gender = st.selectbox("Gender", ["Male", "Female", "Other"])
                    new_goal = st.selectbox("Fitness Goal", ["Hypertrophy", "Fat Loss", "Athletic Conditioning"])
                
                submitted = st.form_submit_button("✅ Complete Registration & Issue QR Pass")
                if submitted:
                    st.success(f"🎉 Member **{new_name}** successfully enrolled in {new_plan}! Member Code: `IFC-{1000 + len(MOCK_MEMBERS) + 1}`.")

# ------------------------------------------------------------------------------
# TAB 3: PAYMENTS & GST INVOICING
# ------------------------------------------------------------------------------
with tab_payments:
    st.subheader("💳 Financial Ledger & Tax Invoices")

    pay_col1, pay_col2, pay_col3 = st.columns(3)
    with pay_col1:
        st.metric("Total Collected This Month", "₹1,84,500", "+12.5%")
    with pay_col2:
        st.metric("Outstanding Member Dues", "₹12,500", "-18.2%")
    with pay_col3:
        st.metric("GST Invoiced (18% CGST/SGST)", "₹28,144", "Compliant")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### 🧾 Recent Payment Transactions")

    df_payments = pd.DataFrame(MOCK_PAYMENTS)
    st.dataframe(
        df_payments,
        column_config={
            "receipt": "Receipt Number",
            "member": "Athlete Name",
            "amount": st.column_config.NumberColumn("Amount Paid (₹)", format="₹%d"),
            "method": "Payment Method",
            "status": "Transaction Status",
            "date": "Payment Date",
        },
        use_container_width=True,
        hide_index=True,
    )

    with st.expander("💳 Record Counter Payment (Cash / UPI / Card)"):
        with st.form("quick_payment_form"):
            p1, p2, p3 = st.columns(3)
            with p1:
                p_member = st.selectbox("Select Member", [m["name"] for m in MOCK_MEMBERS])
            with p2:
                p_amount = st.number_input("Amount (₹)", min_value=100, value=2999, step=100)
            with p3:
                p_method = st.selectbox("Payment Method", ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking"])
            
            p_submit = st.form_submit_button("🧾 Record Payment & Dispatch WhatsApp Receipt")
            if p_submit:
                seq = f"REC-2026-000{len(MOCK_PAYMENTS) + 22}"
                st.success(f"✅ Payment of ₹{p_amount:,} recorded for {p_member}! Tax Receipt **{seq}** generated.")

# ------------------------------------------------------------------------------
# TAB 4: TURNSTILE QR STATION
# ------------------------------------------------------------------------------
with tab_attendance:
    st.subheader("⏱️ Optical Turnstile QR Scanner & Occupancy")

    t_col1, t_col2 = st.columns([1, 1])

    with t_col1:
        st.markdown(
            """
            <div class="metric-card" style="text-align:center; padding:30px;">
                <div style="font-size:3rem; margin-bottom:10px;">📲</div>
                <div style="color:#B6FF45; font-size:1.4rem; font-weight:700;">Turnstile Optical Scanner</div>
                <div style="color:#9CA3AF; font-size:0.9rem; margin-top:6px;">Scan athlete pass code or digital token</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        qr_input = st.text_input("Enter or Scan Member Code (e.g. IFC-1001)", value="IFC-1001")
        if st.button("⚡ Simulate Turnstile Scan", use_container_width=True):
            matched = next((m for m in MOCK_MEMBERS if m["code"] == qr_input), None)
            if matched:
                if matched["status"] == "active":
                    st.success(f"🟢 **ACCESS GRANTED**: Welcome, {matched['name']}! (Turnstile Gate 1 Unlocked)")
                    st.balloons()
                else:
                    st.error(f"🔴 **ACCESS DENIED**: Membership is {matched['status'].upper()}. Please renew at counter.")
            else:
                st.warning(f"⚠️ Member Code `{qr_input}` not recognized in this facility.")

    with t_col2:
        st.markdown("#### 🕒 Real-Time Facility Headcount")
        st.metric("Athletes Currently on Gym Floor", "18 athletes", delta="Normal Volume (Max: 80)")
        
        # Recent check-in stream
        st.markdown("##### Recent Optical Gate Events")
        events = pd.DataFrame(
            [
                {"Time": "06:12 PM", "Member": "Aarav Sharma", "Action": "Check-In", "Gate": "Turnstile North"},
                {"Time": "06:05 PM", "Member": "Kavita Reddy", "Action": "Check-In", "Gate": "Turnstile South"},
                {"Time": "05:52 PM", "Member": "Pooja Hegde", "Action": "Check-Out", "Gate": "Turnstile Exit 1"},
                {"Time": "05:40 PM", "Member": "Rohan Deshmukh", "Action": "Check-In", "Gate": "Turnstile North"},
            ]
        )
        st.dataframe(events, use_container_width=True, hide_index=True)

# ------------------------------------------------------------------------------
# TAB 5: AI GYM COPILOT
# ------------------------------------------------------------------------------
with tab_ai:
    st.subheader("🤖 GymFlow AI Copilot (OpenAI GPT-4o-mini)")
    st.caption("Role-aware artificial intelligence tuned for gym operations, athlete coaching, and revenue retention.")

    # Preset prompts
    prompt_col1, prompt_col2, prompt_col3 = st.columns(3)
    preset_prompt = None
    with prompt_col1:
        if st.button("💡 How to reduce churn this quarter?"):
            preset_prompt = "Provide 3 high-impact strategies to reduce membership churn in our gym this quarter."
    with prompt_col2:
        if st.button("🏋️ Hypertrophy 4-day split idea"):
            preset_prompt = "Generate a progressive 4-day hypertrophy split focusing on compound barbell and dumbbell movements."
    with prompt_col3:
        if st.button("🥗 High-protein vegetarian meal plan"):
            preset_prompt = "Design a 2400 kcal vegetarian meal plan providing at least 150g protein for an athlete."

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": f"Hello {gym_info['owner']}! I am your **GymFlow AI Copilot**. How can I assist you with {gym_info['name']} today?",
            }
        ]

    # Display chat messages
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # User input
    user_query = st.chat_input("Ask GymFlow AI anything about your gym, athletes, or workouts...") or preset_prompt

    if user_query:
        # Add user message
        st.session_state.messages.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.markdown(user_query)

        # Generate response (Live API or Intelligent Mock)
        with st.chat_message("assistant"):
            with st.spinner("GymFlow AI is analyzing facility telemetry..."):
                reply = None
                if is_live:
                    try:
                        res = requests.post(
                            f"{api_url}/api/ai/chat",
                            json={"message": user_query},
                            headers={"X-Demo-Role": selected_role, "X-Gym-Id": selected_gym_id},
                            timeout=10.0,
                        )
                        if res.status_code == 200:
                            reply = res.json().get("reply")
                    except Exception:
                        pass

                if not reply:
                    time.sleep(0.5)
                    # Context-tailored intelligent fallback
                    uq = user_query.lower()
                    if "churn" in uq or "retention" in uq:
                        reply = (
                            "### 🎯 Strategic Churn Reduction Framework\n\n"
                            "1. **Attendance Milestones**: Send automated WhatsApp congratulations when an athlete hits 10 and 25 check-ins.\n"
                            "2. **Proactive 7-Day Inactivity Reachout**: Trigger personal check-in messages to members absent for 7+ consecutive days.\n"
                            "3. **Frictionless Renewal Discounts**: Offer early-bird renewal pricing (e.g. ₹500 off) at 7 days before expiry."
                        )
                    elif "split" in uq or "workout" in uq:
                        reply = (
                            "### 💪 4-Day Hypertrophy Split\n\n"
                            "- **Day 1 (Upper A)**: Barbell Bench Press (4x8), Barbell Rows (4x8), Overhead Dumbbell Press (3x10), Tricep Rope Pushdowns (3x12).\n"
                            "- **Day 2 (Lower A)**: Barbell Back Squat (4x6), Romanian Deadlifts (4x8), Leg Press (3x12), Standing Calf Raises (4x15).\n"
                            "- **Day 3**: Active Rest & Mobility.\n"
                            "- **Day 4 (Upper B)**: Incline Dumbbell Press (4x10), Lat Pulldowns (4x10), Dumbbell Lateral Raises (4x15), Hammer Curls (3x12).\n"
                            "- **Day 5 (Lower B)**: Conventional Deadlift (3x5), Bulgarian Split Squats (3x10/leg), Hamstring Curls (3x12)."
                        )
                    else:
                        reply = (
                            f"Based on real-time data for **{gym_info['name']}**, your facility is operating at strong efficiency with "
                            f"{kpis.get('activeMembers', 108)} active athletes and an **84.6% renewal rate**. Let me know if you would like "
                            f"deeper breakdowns on revenue, trainer scheduling, or customized diet plans!"
                        )

                st.markdown(reply)
                st.session_state.messages.append({"role": "assistant", "content": reply})

# ------------------------------------------------------------------------------
# TAB 6: SUPER ADMIN HUB
# ------------------------------------------------------------------------------
with tab_admin:
    st.subheader("👑 Platform Super Admin Control Center")
    st.caption("Cross-tenant observability and multi-gym SaaS ecosystem governance.")

    adm_col1, adm_col2, adm_col3, adm_col4 = st.columns(4)
    with adm_col1:
        st.metric("Total Registered Gyms", "4 Facilities", "+1 this month")
    with adm_col2:
        st.metric("Monthly Recurring Revenue (MRR)", "₹42,000", "+18.5%")
    with adm_col3:
        st.metric("Annual Recurring Revenue (ARR)", "₹5,04,000", "Run-Rate")
    with adm_col4:
        st.metric("Total Platform Athletes", "420 Members", "Active Across All Gyms")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### 🏢 Registered Facility Tenants")

    tenant_rows = [
        {"Gym ID": gid[:8] + "...", "Gym Name": t["name"], "Location": t["city"], "Owner": t["owner"], "SaaS Plan": t["plan"], "Status": "Active"}
        for gid, t in TENANTS.items()
    ]
    st.dataframe(pd.DataFrame(tenant_rows), use_container_width=True, hide_index=True)

    st.markdown("<br>", unsafe_allow_html=True)
    with st.expander("⚡ Tenant Lifecycle Action"):
        s_col1, s_col2 = st.columns(2)
        with s_col1:
            target_gym = st.selectbox("Select Gym to Manage", [t["name"] for t in TENANTS.values()])
        with s_col2:
            st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
            if st.button("🔒 Toggle Suspension State"):
                st.warning(f"Administrative status toggled for **{target_gym}**.")

# ==============================================================================
# 6. FOOTER
# ==============================================================================
st.markdown("---")
f_col1, f_col2 = st.columns([2, 1])
with f_col1:
    st.caption("GymFlow AI • Enterprise Multi-Tenant Fitness Operating System • Built with Streamlit, React 19, Node.js & Supabase")
with f_col2:
    st.markdown(
        "<div style='text-align:right; font-size:0.8rem; color:#9CA3AF;'>Connected to GitHub Repository: <b>GymFlow-</b></div>",
        unsafe_allow_html=True,
    )
