# PRODUCT REQUIREMENT DOCUMENT & SYSTEM SPECIFICATION

## Project: OMNI-STAY (Comprehensive Property & Hospitality Operations Engine)

**Author:** Product Owner

**Date:** July 13, 2026

**Document Status:** Production-Ready Blueprint

---

## 1. STRATEGIC OVERVIEW & SYSTEM ARCHITECTURE

Omni-Stay is an end-to-end, multi-tenant property management, hospitality marketplace, and operations ecosystem. The platform serves six distinct core user archetypes across desktop, mobile web, and native mobile applications. This document outlines every functional requirement, interface element, state, and interaction loop without technical code or structural architecture.

### 1.1 Core System Roles & Permissions

* **Guest:** The consumer renting the space. Access via Mobile App / Mobile Web.
* **Host (Individual / Asset Owner):** The property owner listing spaces. Access via Desktop / Mobile Web.
* **Property Manager (PM):** Corporate operators managing multiple host portfolios. Access via Desktop Portal.
* **Cleaner:** Internal or third-party field staff executing turnovers. Access via Mobile App.
* **Maintenance:** Internal or third-party field staff fixing assets. Access via Mobile App.
* **Finance:** Corporate backend users managing ledgers, taxes, and payouts. Access via Desktop Portal.
* **Support:** Customer service agents handling disputes, interventions, and overrides. Access via Desktop Portal.
* **Super Admin:** Platform operators with global system override rights. Access via Desktop Portal.

---

## 2. GUEST APPS & WEB PORTAL (MOBILE-FIRST)

### 2.1 Unauthenticated Guest (Landing & Discovery)

#### 2.1.1 Global Homepage / Search Canvas

* **Header Navigation:**
* `Logo` (Clicking returns to home).
* `Currency Dropdown` (USD, EUR, GBP, EGP, AED) - Updates all prices instantly.
* `Language Dropdown` (EN, AR, FR, DE, ES) - Updates UI strings instantly.
* `Become a Host` button - Redirects to Host Onboarding.
* `Login / Sign Up` button - Opens Modal 2.1.3.


* **Search Bar Widget (Sticky on Scroll):**
* *Field 1: Location Input.* Auto-completing text input with active clear button `(X)`. On click, shows dropdown of "Recent Searches" and "Popular Nearby Destinations".
* *Field 2: Date Picker.* Dual-calendar inline overlay. Disables past dates. Shows holiday surges with small dot indicator under specific dates. Displays `Check-in` and `Check-out`.
* *Field 3: Guest Selector.* Dropdown with counters: Adults (+/-), Children (+/-), Infants (+/-), Pets (+/-). Explicit `Apply` button.
* *Action:* `Search Button` (Magnifying glass icon + "Find Spaces").


* **Hero Visual Matrix:**
* Curated dynamic categories slider: "Beachfront", "Design/Architectural", "Tiny Homes", "Urban Lofts", "Historic".
* Dynamic grid displaying top 12 properties globally based on proximity and historical high ratings. Each card features:
* Image carousel with swipe gestures and indicator dots.
* `Heart Icon` (Save to wishlist - triggers Login Modal if unauthenticated).
* Line 1: City, Country (e.g., "New Cairo, Egypt").
* Line 2: Distance (e.g., "4.2 kilometers away").
* Line 3: Available dates (e.g., "Jul 18–23").
* Line 4: Price per night in bold, followed by total price before taxes in faint grey text.
* Rating star icon with value (e.g., "4.92").





#### 2.1.2 Search Results & Map Split-View

* **Toggle Switch:** `List View` vs `Map View` (visible on mobile footer, side-by-side on desktop).
* **Filter Pill Row:**
* `Price Range`: Sliders with minimum/maximum text boxes and a histogram showing frequency distribution.
* `Property Type`: Checkboxes for Entire Home, Private Room, Shared Space.
* `Amenities`: Multi-select tags (Wi-Fi, Pool, Air Conditioning, EV Charger, Gym).
* `Instant Book`: Toggle switch.
* `Clear All` button and `Show [X] Results` button.


* **Map Interface:** Integrated interactive pin canvas.
* Standard Pins: Display the exact night rate (e.g., "$120").
* Hovered/Selected Pin: Turns black, raises z-index, displays mini property preview card (Image, Title, Price, Rating).
* Cluster Pins: Numbers showing density (e.g., "45+"). Clicking zooms map into cluster boundary.



#### 2.1.3 Authentication Modal (Universal Entry)

* **Header:** "Log in or sign up" with a dismiss `(X)` button.
* **Input Fields:**
* Country Code Dropdown + Phone Number Input Field.
* `Continue` Button (Primary Color).


* **Divider:** "or continue with" line.
* **Social OAuth Buttons:** Google, Apple, Facebook (Full width icons + text).
* **Email Redirection Link:** "Continue with Email".
* *Email States:* If email doesn't exist, morphs into "Create Account" layout: First Name, Last Name, Date of Birth Input, Password, Password Confirmation, and marketing opt-in checkbox.


* **OTP Verification Screen (Triggered instantly after phone/email entry):**
* 6 single-digit square inputs with auto-focus shifting.
* Countdown timer text: "Resend code in 00:59".
* `Resend` link (disabled until timer hits 00:00).
* `Verify & Proceed` button.



### 2.2 Authenticated Guest Engine

#### 2.2.1 Property Detail Page (Deep-Dive)

* **Media Gallery Matrix:**
* Desktop: 5-photo mosaic (1 large hero photo left, 4 grid photos right). `View All Photos` button in bottom right corner with count indicator.
* Mobile: Full-bleed image carousel with horizontal indicator bar.


* **Listing Core Header:**
* Title (H1, e.g., "Minimalist Glass Villa with Panoramic Views").
* Sub-header row: Review score, hyperlinked review count, location link, Host profile badge image.


* **Property Detail Specifications Block:**
* Icon row: Max guests count $\cdot$ Bedroom count $\cdot$ Bed count $\cdot$ Bath count.
* `Host Badge Widget`: Displays host image, name, years hosting, and "Superhost" banner if applicable.
* `AI-Generated Listing Synthesis`: 3 bullet points summarizing common review sentiments (e.g., "Guests consistently mention ultra-fast Wi-Fi, crystal-clear pool maintenance, and deep check-in clarity").


* **Description Content Box:** Expands via `Show More` link.
* **Sleeping Arrangement Carousel:** Cards showing individual rooms with specific bed configurations illustrated via icons (e.g., "Bedroom 1: 1 King Bed").
* **Amenities Grid:** Displays up to 10 priority icons. `Show All [X] Amenities` button launches overlay showing items categorized by Room, Utilities, Safety, and Outdoor.
* **Booking Widget (Sticky Sidecar or Bottom Sheet):**
* Price display with strike-through discounts if active.
* Check-in/Check-out box selectors. Launches dropdown calendar.
* Guests dropdown selector.
* `Reserve` Button (Changes to `Instant Book` if property supports automatic confirmation).
* Itemized billing breakdown list:
* Nightly fee total ($\text{Rate} \times \text{Nights}$)
* Cleaning fee
* Omni-Stay platform service fee
* Occupancy taxes
* *Total Price Gross Line* (Bold)


* Cancellation policy disclosure text (e.g., "Free cancellation for 48 hours").



#### 2.2.2 Checkout & Reservation Workflow

* **Step 1: Review Trip Details**
* Dates summary, Guest count configuration.
* Ground Rules declaration block (No smoking, No parties). Guest must click `Agree & Continue` checkbox.


* **Step 2: Guest Profile Verification**
* If profile photo missing: Camera activation widget upload interface.
* Government ID verification state flag check: If unverified, opens upload portal for Passport/Driver's License with front/back camera photo capture canvas.


* **Step 3: Payment Configuration**
* Saved Credit Card selection list (Displays card brand logo, last 4 digits, expiration date).
* `Add New Card` Interface: Number, Expiry, CVV, Cardholder Name, Billing ZIP.
* Alternative Payment Engine Selectors: Apple Pay, Google Pay, PayPal, Klarna (Split Pay).
* Coupon Code Accordion: Input field + `Apply` button.


* **Step 4: Message to Host**
* Text area box with placeholder text: "Let your host know why you are visiting...".


* **Step 5: Final Submission**
* `Confirm & Pay` button. Standard loading state shows an animated spinner and a sequence of text strings: "Securing authorization...", "Verifying space availability...", "Reserving your stay...".



#### 2.2.3 Guest Dashboard & Trip Management Hub

* **Tabs Layout:** `Upcoming`, `Past`, `Wishlists`, `Messages`.
* **Trip Card (Upcoming State):**
* Property banner image, booking reference ID, active countdown banner (e.g., "Starts in 3 days").
* `Manage Booking` Actions Matrix:
* `Get Directions` button (Launches native Apple/Google Maps).
* `Check-in Instructions` button (Disabled until 24 hours prior to check-in).
* `Contact Host` button (Opens direct message chat screen).
* `Modify Reservation` button (Launches date/guest change flow).
* `Cancel Stay` button (Launches multi-step cancellation penalty calculator modal).




* **Active Check-In State Interface (Visible during stay dates):**
* Home feed replaces default layout with a dedicated unified command dashboard:
* `Wi-Fi Password Widget`: Click to copy text directly to clipboard.
* `Digital Key Interface`: If property has integrated smart locks, a large central button changes states: `Hold to Unlock Door` (Sends encrypted signal to physical lock; provides haptic buzz and visual green success circle).
* `House Manual Accordion`: Expanding sections detailing specific appliance instructions, trash disposal rules, parking stall designations.
* `Request Support / Maintenance` button (Launches ticket submission wizard).





#### 2.2.4 Real-Time Chat & Communications Engine

* **Inbox List View:** Conversations ordered chronologically by latest message. Cards show sender profile image, sender name, timestamp, message excerpt snippet, and unread indicator dot.
* **Chat Workspace Interface:**
* Top Bar: Recipient name, active reservation reference link with dates, call action icon (initiates obfuscated voice call layout).
* Message Feed Panel: Guest messages right-aligned (blue background), Host/System messages left-aligned (grey background). Status text indicators beneath individual message blocks: "Sent", "Delivered", "Read".
* Input Tool Strip: Text input box, attachment utility icon (Camera, Gallery, File Documents), Quick Responses menu button (Predefined text snippets like "I have arrived safely", "Where are extra towels?").
* `Send` Button.



#### 2.2.5 Reviews & Feedback Portal

* **Trigger Condition:** Automated launch at 11:00 AM on check-out date.
* **Step 1: Star Breakdown Dimensions (1 to 5 Stars selection grids):**
* Overall Experience, Cleanliness, Accuracy, Communication, Location, Value, Check-in Process.


* **Step 2: Text Feedback Field:**
* Public Review Textbox (Visible on public property profile).
* Private Host Feedback Textbox (Only visible to the specific Host/PM).


* **Step 3: Tag Selector Matrix:**
* Positive tags: "Spotless", "Stylish", "Responsive", "Quiet".
* Negative tags: "Noisy", "Delayed Check-in", "Missing Amenities".


* **Submission Action:** `Publish Review` button.

---

## 3. HOST & PROPERTY MANAGER ENTERPRISE ENGINE

### 3.1 Host Onboarding & Property Creation Canvas

* **Step 1: Space Categorization**
* Visual grid selectors for property class (Apartment, House, Villa, Unique Cabin).
* Radio button selection for listing occupancy scope (Entire Place, Private Room, Shared Space).


* **Step 2: Geographic Mapping**
* Text input field for address lookup.
* Interactive map display with a movable drop-pin tool to set the precise physical coordinate. Text instructions: "Drag pin exactly over the roof of your building".
* Address breakdown text fields for manual corrections (Street Address, Apartment/Suite Number, City, State/Province, Postal Code).


* **Step 3: Structural Breakdown Inventory**
* Counter increments for: Maximum Guests, Bedrooms, Beds, Bathrooms.


* **Step 4: Amenities Check-Box Checklist Matrix**
* Categorized lists: Essentials, Features, Safety, Logistics.


* **Step 5: Media Import Canvas**
* Drag-and-drop file upload target area box. Supports raw image organization.
* Uploaded thumbnail grid: Allows reordering cards via click-and-drag.
* Individual Image Edit options: Add descriptive caption text, set as primary hero image cover, delete.


* **Step 6: Listing Content Copywriting**
* Listing Title Input Field (Max 50 characters).
* Listing Description Textarea (Max 5000 characters).


* **Step 7: Rule Configuration**
* Checkboxes: Pets Allowed, Smoking Allowed, Parties Allowed, Children Suitable.
* Check-in Window inputs: Start Time Dropdown / End Time Dropdown.


* **Step 8: Pricing & Initial Availability Configuration**
* Base Nightly Price Input field (Currency locked to selected market base).
* Minimum Nightly Stay counter, Maximum Nightly Stay counter.
* Smart Pricing Toggle switch (Enables system dynamic optimization engine based on localized seasonal demand metrics).


* **Final Action:** `Publish Listing` button / `Save Draft & Exit` button.

### 3.2 Host & PM Master Dashboard

#### 3.2.1 Operational Command Center Home

* **Metric Flashcards Block (Current day, week, or month filters):**
* Occupancy Rate percentage indicator.
* Total Gross Revenue currency value.
* Average Daily Rate (ADR).
* Net Revenue Per Available Room (RevPAR).
* Pending Action items list: "3 Check-ins Today", "1 Maintenance Ticket Open", "2 Pending Bookings".


* **Real-time Operations Timeline View:** Chronological feed stack showing events happening across properties (e.g., "Unit 402: Guest Checked Out", "Unit 101: Cleaner Jane assigned").

#### 3.2.2 Unified Multi-Calendar Workspace (PMS Core)

* **Grid Layout Grid Framework:**
* Y-Axis lists individual properties (Thumbnails, titles, and unit numbers).
* X-Axis displays date blocks (Day, Week, Month views available via toggle buttons).


* **Reservation Block Visual Elements:**
* Colored horizontal bars stretch across dates.
* Confirmed Stays: Green blocks displaying Guest Name, nights count, total reservation value.
* Pending Approvals: Striped yellow blocks blinking until confirmed or rejected.
* Blocked Dates (Owner stay / Maintenance offline): Solid grey textured blocks.


* **Interaction Actions:**
* Clicking an empty grid space opens a popup option menu: `Create Manual Reservation` / `Block Specific Dates`.
* Clicking a reservation bar opens an overlay panel details drawer: Displays full booking parameters, pricing details, direct link to guest chat, and a `Cancel Booking` manual override action button.
* Drag-and-Drop capability: PM can drag a guest reservation bar from one row to an identical matching unit tier row on alternative properties to seamlessly reassign rooms instantly.



#### 3.2.3 Listing Performance Optimization Suite

* **Properties Tabulation View:** Table containing columns for Property Details, Status Toggle (Active, Paused, Unlisted), Linked Channels (Airbnb, Booking.com, VRBO, Direct Engine icons indicating status), Completion score gauge.
* **Global Pricing Control View:**
* Allows bulk application of rules across chosen properties: "Increase base rate by 15% for all beach properties for August weekend slots".
* Discounts Engine Configuration panel: Early-bird tier configurations, Last-minute rate drop triggers, Long-term stay progressive discounts matrix.



#### 3.2.4 PM Unified Team Allocator Portal

* **Workforce Scheduling Matrix View:**
* List view of field staff members (Cleaners, Maintenance Engineers).
* Status markers: Active, Idle, On Break, Offline.
* Task queue assigner tools: Drag tasks (e.g., "Turnover Unit 3B") onto a specific team member name node.


* **Automated Rules Engine Builder Portal:**
* Rule Configurator Template: "When a guest checks out of [All Properties], automatically assign a [Turnover Cleaning Task] to [Cleaner Pool] with a deadline of [4 Hours after check-out time]".



---

## 4. FIELD STAFF APPS (NATIVE MOBILE MOBILE LAYOUTS)

### 4.1 Cleaner Operations Interface

#### 4.1.1 Shift & Assignment Home

* **Header Profile:** Cleaner profile image, shift status toggle switch (`Clocked In` / `Clocked Out`).
* **Daily Task Queue Card Stack:**
* Organized strictly by deadline urgency.
* Card Parameters: Unit Number, Physical Complex Address, Check-out status flag (e.g., "Guest Has Vacated"), Target Completion Time Window (e.g., "11:00 AM - 3:00 PM").
* Primary Interaction Action: `Start Task` button.



#### 4.1.2 Interactive Step-by-Step Cleaning Wizard

* **Top Bar Alert Grid:** Displays unit specifics (e.g., "Allergic to down feathers - use alternative bedding sheets").
* **Granular Checklist Framework (Requires confirmation click on every row item):**
* *Section A: Living Space* $\rightarrow$ Dust furniture [Checkbox], Vacuum carpets [Checkbox], Clean window track lines [Checkbox].
* *Section B: Linens & Bedding* $\rightarrow$ Remove soiled sheets [Checkbox], Install fresh sanitized linen kit [Checkbox].


* **Media Verification Gates:**
* Before moving to next task block, cleaner must click the integrated camera icon to take specific validation photos: Finished Bed Configuration Photo, Stocked Toiletry Amenities Shelf Photo.


* **Inventory Restock Alert Module:**
* Counter tools for depleted onboard items: Coffee Pods (-/0/+), Toilet Paper rolls used (-/0/+), Towels replaced (-/0/+).


* **Final Action Panel:**
* `Complete Turnover & Sign-Off` button. If any checkbox was skipped, validation warning sounds a red accent alert box highlighting skipped steps.



### 4.2 Maintenance Engineer Interface

#### 4.2.1 Ticket Queue Pipeline

* **Dashboard View:** Columns dividing items by severity tiers: `Emergency`, `Standard Ops`, `Scheduled Preventive`.
* **Ticket Detail Layout:**
* Source Creator identifier: (Reported by Guest, Reported by Cleaner, System IoT Smart Sensor Triggered).
* Detailed Issue Notes field: "Air conditioning unit blowing warm air in Master Bedroom".
* Media Files attachment deck: Image files showing malfunctioning appliance or broken structural element.
* Asset History Log link: Shows maintenance intervention records for that specific appliance model serial number.



#### 4.2.2 Resolution & Parts Tracking Workflow

* **Action Status Toggle Strip:** `Accept Ticket` $\rightarrow$ `Arrived On-Site` $\rightarrow$ `Waiting for Parts` $\rightarrow$ `Resolved`.
* **Parts & Expenses Ledger Input Form:**
* Item Name Input Field, Vendor Source Input Field, Receipt Upload Camera capture tool box, Unit Price Input field.


* **IoT Re-Calibration Button Widget:**
* For smart assets (e.g., Smart Thermostats, Connected Water Meter Valves): `Run Diagnostic Test Link`. Sends ping to device and shows real-time return data status (Green checkmark: "Device Operational / Factory Reset Complete").


* **Final Action Panel:**
* `Close Ticket & Log Hours` entry field (Hours/Minutes counter tools).



---

## 5. BACKOFFICE, FINANCE & ADMIN OPERATIONS ENGINE (DESKTOP)

### 5.1 Finance & Treasury Operations Control Center

#### 5.1.1 Multi-Channel Ledger Engine

* **System Balances Matrix:** Grand totals displaying Funds Held in Escrow, Settled Receivables, Pending Merchant Payout Transactions, Platform Fee Collections Retained.
* **Transaction Ledger Master Table View:**
* Columns: Txn ID, Timestamp, Property Reference Identifier, User ID, Transaction Class (Guest Payment, Host Payout, Cleaner Compensation, Maintenance Expense, Platform Fee Component), Payment Processor ID Reference, Gross Amount, Net Amount, Tax Component Withheld.
* Action Tools: Export to CSV/Excel button, `Initiate Chargeback Reversal` button, `Issue Partial Refund` slider overlay input.



#### 5.1.2 Automated Host Payout Engine Settings

* **Payout Rule Matrix Editor:**
* Payout Trigger Selectors: "Release funds exactly 24 hours post guest check-in date" vs "Monthly batch settlement cycles".
* Tax Withholding Configuration Profiles: 1099-K management wizard interface, automated local VAT/Occupancy Tax calculation percentages broken down by local municipal geo-fenced boundaries.


* **Manual Hold Intercept Console:**
* List view showing flagged suspect transactions. Finance controller can click `Place Fraud Hold` or `Force Release Payout` action buttons.



### 5.2 Customer Support Hub (CRM Workflow)

#### 5.2.1 Active Incident Queue Console

* **Triaging Layout Matrix:** Split screen layout.
* Left Rail: Escalated tickets ordered by SLA breach countdown clocks (e.g., "SLA Breach in 04m 12s"). Red text indicates severe issue types (e.g., "Guest locked out at midnight").
* Center View Workspace: The full comprehensive interactive case context view.



#### 5.2.2 Case Resolution Dashboard

* **Tab System:**
* `Timeline Context`: Integrated combination log displaying chat logs, automated system notification events, lock status logs.
* `Reservation Parameters Override Panel`: Allows agent to alter check-out dates, add custom discounts, or wipe platform booking fees manually with explanation text inputs.
* `Relocation Selector Matrix`: If property is uninhabitable, launches real-time nearby vacant unit map matrix to transfer guest with single click `Execute Relocation Transfer` action command button.


* **Communication Bridge Command Tool:**
* Agent can toggle sending format directly: `Send message as System App Alert`, `Send message as Direct SMS Text`, `Intervene into current active WhatsApp conversation string`.



### 5.3 Super Admin Global Management Suite

#### 5.3.1 System Settings & Safety Control Dashboard

* **System-Wide Kill Switch Interface:**
* Protected master switches: `Freeze New Bookings Globally`, `Disable Smart Lock Access Network` (Triggers visual alert banner warning of extreme emergency protocol implementation).


* **Identity Verification Resolution Drawer:**
* Compares submitted user government ID side-by-side with profile image photo.
* `Approve Profile` button / `Reject Identity Profile` button (Launches rejection template reason list box dropdown selector).



#### 5.3.2 Third-Party Integrations Channel Manager Portal

* **API / Webhook Mapping Grid:**
* Connected channels state: Airbnb Integration (Active API link), Booking.com Channel (Syncing Status indicator), Stripe Gateway API Engine (Operational status indicator).
* Frequency sync sliders: Adjust calendar sync cadence from 1 minute to 60 minutes intervals.



---

## 6. END-TO-END AUTOMATED NOTIFICATION & MESSAGING MATRIX

This matrix details every transaction system communication trigger across the lifecycle of the system ecosystem.

### 6.1 Guest Lifecycle Notification Journeys

| Triggering Event Condition | Channel | Exact Text Copy & System Interface Strings | UI Action Buttons Enclosed |
| --- | --- | --- | --- |
| **Successful Account Account Setup** | Email | "Welcome to Omni-Stay! Your account is officially active. Let's find your next perfect escape." | `Explore Spaces Link` |
| **Successful Account Account Setup** | SMS | "Your Omni-Stay verification is complete! Welcome to the seamless stay era." | None |
| **Booking Request Received by Host** | Email | "Your request for stay reservation [RefID] has been submitted to the property host. You will receive an update within 24 hours." | `View Booking Progress` |
| **Booking Instantly Confirmed** | Email | "Pack your bags! Your stay at [Property Name] is fully confirmed for [Dates]. Your receipt reference is [TxnID]." | `Add to Calendar`, `Get Directions` |
| **Booking Instantly Confirmed** | Push | "Confirmed! 🌴 Your reservation at [Property Name] is officially secured." | Opens App Home |
| **Booking Instantly Confirmed** | WhatsApp | "Hello [Guest Name]! Your booking for [Property Name] is locked in for [Dates]. Check-in instructions will arrive here 24 hours before your trip begins!" | `View Trip Details Link` |
| **Host Rejection of Booking** | Email | "We are sorry, the host was unable to accept your stay request for [Property Name]. No charges have been finalized on your payment method." | `Find Alternative Stays` |
| **Host Rejection of Booking** | Push | "Booking update: Your request for [Property Name] could not be accepted. Tap to see similar options." | Opens Search View |
| **Check-in Document Window Opens (T-24 Hours)** | Push | "24 Hours until arrival! Tap here to complete your digital check-in and access lock door codes." | Opens Digital Check-In Portal |
| **Check-in Document Window Opens (T-24 Hours)** | WhatsApp | "Hi [Guest Name], your check-in window is officially open. Click the link to view entry key configurations and house access manuals: [Link]" | `Open House Manual` |
| **Smart Lock Key Activation** | Push | "Your digital room key is now active. Stand within 2 feet of the front door lock and hold down the unlock command button." | Opens Digital Key Interface |
| **Payment Authorization Failure** | Email | "Urgent Billing Action Required: The payment processing attempt for your upcoming stay reservation [RefID] failed. Update your card profile within 3 hours to prevent booking cancellation." | `Update Payment Method` |
| **Payment Authorization Failure** | SMS | "Omni-Stay Alert: Payment failed for reservation [RefID]. Update your billing card information immediately here: [Link]" | `Resolve Payment Link` |
| **Check-out Reminder Alert (T-2 Hours)** | Push | "Friendly reminder: Check-out time is at 11:00 AM. Please ensure trash is placed in bins, lights turned off, and lock the door upon departure." | `Mark Check-Out Complete` |
| **Review Window Open** | Email | "How was your stay at [Property Name]? Share your feedback today to help the community and guide future travelers." | `Leave a Review Now` |

### 6.2 Host & Property Manager Lifecycle Journeys

| Triggering Event Condition | Channel | Exact Text Copy & System Interface Strings | UI Action Buttons Enclosed |
| --- | --- | --- | --- |
| **New Booking Request Received** | Email | "You have received a stay booking request from [Guest Name] for [Property Name]. Review their profile to accept or decline." | `Accept Booking`, `Decline Request` |
| **New Booking Request Received** | Push | "Action Required: New reservation request pending for [Property Name]! 📥" | Opens Booking Review Panel |
| **Instant Booking Finalized** | Email | "Great news! [Guest Name] just booked [Property Name] instantly via automated match. Your updated multi-calendar is inside." | `View Calendar Location` |
| **Instant Booking Finalized** | SMS | "Omni-Stay: Unit [UnitNumber] has been booked for [Dates] by [Guest Name]." | None |
| **Guest Review Submitted** | Push | "[Guest Name] left you a review! Read what they said about their experience." | Opens Reviews Dashboard |
| **High Demand Pricing Warning Trigger** | Push | "Market Analytics Alert: Demand in your property's submarket has increased by 34%. Tap to optimize nightly base rates." | Opens Smart Pricing Controls |
| **Payout Disbursed Successfully** | Email | "Treasury Update: Payout funds totaling [Amount] for reservation [RefID] have been initiated to your linked bank account routing file." | `View Ledger Statement` |

### 6.3 Field Staff (Cleaner & Maintenance) Notification Journeys

| Triggering Event Condition | Channel | Exact Text Copy & System Interface Strings | UI Action Buttons Enclosed |
| --- | --- | --- | --- |
| **New Task Assignment Dispatched** | Push | "New Assignment: You have been designated for Turnover Duty at Unit [UnitNumber]. Deadline: Today, [Time]." | Opens Task Step-Wizard |
| **New Task Assignment Dispatched** | SMS | "Omni-Stay Staff: New cleaning job assigned for Unit [UnitNumber]. Details here: [Link]" | `Open Job Profile Link` |
| **Task Deadline Approaching (T-30 Mins)** | Push | "Warning: Task deadline for Unit [UnitNumber] expires in 30 minutes. Upload mandatory verification imagery immediately." | Opens Photo Upload Gate |
| **Urgent Maintenance Report** | Push | "🚨 EMERGENCY TICKET: Guest reports major utility issue at Unit [UnitNumber]. Route to site immediately." | Opens Navigation Blueprint |

---

## 7. ANCILLARY USER JOURNEYS & INTERACTIVE FLOW DIAGRAMS

### 7.1 Comprehensive Multi-Role Interactive Flow Mapping

This diagram maps out how an event flows between roles and system interfaces simultaneously:

```
[Guest Actions Checkout] 
       │
       ▼
[System Payments Engine] ──(Success)──► [Guest UI: Booking Confirmed Screen]
       │                                 ▲
       │                                 │ (Triggers Notification Suite)
       │                                 ▼
       ├──► [Host UI: Calendar Blocked / Payout Ledger Entry Created]
       │
       └──► [Automated Operations Assigner Engine]
                 │
                 ▼
            [Cleaner App UI: New Job Card Appears in Daily Queue]

```

### 7.2 Detailed User Account Settings Suite

* **Personal Info Panel:** Form fields for Legal Name, Date of Birth, Gender Select, Email Address, Contact Phone, Emergency Contact Profile (Name, Relationship, Phone).
* **Security & Credentials Hub:**
* `Change Password Interface`: Old Password, New Password, Confirm New Password inputs.
* `Two-Factor Authentication (2FA) Toggle`: Enforces OTP requirement upon secondary login attempts.
* `Connected Devices Table`: Displays current active login sessions showing browser brand, geolocation ip signature, and a `Revoke Access Session` action button next to each row entries.


* **Payment Payout Preferences Interface:**
* Guest Section: Manage default payment options, view accrued travel credit balances.
* Host Section: Connected Bank Account routing setup field parameters (IBAN, SWIFT, Account Holder Name). Tax Identification forms upload modules.



---

## 8. STEP-BY-STEP ERROR HANDLING & EDGE-CASE PROTOCOLS

The following sections define every interface behavior, message display configuration, and fallback alternative system state when standard happy path logic conditions cannot be satisfied.

### 8.1 Payment Processor Processing Fault Interventions

* **Scenario:** Guest hits `Confirm & Pay` button, but processing terminal returns card decline, insufficient funds, or gateway time-out.
* **UI Presentation Resolution:**
* The payment checkout button ceases loading animation, shakes horizontally, and updates color scheme to bold crimson accenting.
* An explicit floating alert system block dialogue element renders above the card choice block containing the text context:
> 🛑 **Transaction Incomplete:** Your card issuer declined this transaction due to insufficient funding reserves. Please update your balance allocation or select an alternative operational credit card instrument.


* The layout remains active so the user does not lose entering parameters or details configurations previously entered.



### 8.2 Smart Lock System Structural Failure Redirection

* **Scenario:** Guest holds down the `Unlock Door` button widget inside the active check-in dashboard app frame, but physical field lock hardware device returns an offline error state loop or battery critical depletion state code.
* **UI Presentation Resolution:**
* The green circular loading badge boundary swaps into a blinking orange warning triangular hazard badge element.
* A bottom sheet pop-up drawer slides up onto view layout displaying text copy:
> ⚠️ **Hardware Connectivity Alert:** The smart digital locking system is temporarily unresponsive.
> **Immediate Back-up Entry:** Slide open the physical keypad lock compartment beneath the door handle and enter physical mechanical combination sequence code: **[9-4-2-1-#]**.


* An auxiliary inline button titled `Call Emergency Support Support Agent` provides direct routing to the active triage command queue panel instantly.



### 8.3 Simultaneous Double Booking Intercept Protocol

* **Scenario:** Two individual global guests hit the final confirmation button click event within fractions of a single second window frame on the exact same unit item for overlapping date durations.
* **UI Presentation Resolution:**
* The first guest clearing the settlement ledger pipeline locks the calendar instance.
* The secondary lagging user transaction intercept is canceled prior to funds withdrawal processing.
* The checkout view morphs immediately into a dedicated alternative routing canvas layout:
> 🗺️ **High-Demand Date Collision:** Another traveler has just finalized reservation parameters for these exact dates ahead of your session completion.
> **No charges have been executed against your bank account.**


* The interface instantly pre-loads three matching comparative visual property alternative profile cards located within an 800-meter geo-spatial radius showing identical pricing tiers to maximize retention success rates.



### 8.4 Cleaner Safety Incident Declaration Loop

* **Scenario:** Cleaner arrives at a scheduled property site location, initiates task steps, but discovers structural property damage rendering clean operations impossible (e.g., burst pipes, shattered glass doors).
* **UI Presentation Resolution:**
* A persistent red button marked `Report Major Property Damage / Safety Hazard` is accessible inside the task wizard dashboard tracking window frame.
* Clicking triggers an instant operational modal override workflow sequence:
* *Prompt 1:* Select Hazard Classification Category (Plumbing Failure, Structural Vandalism, Hazardous Waste Contamination).
* *Prompt 2:* Camera Capture Canvas window forces minimum collection execution of 3 unique photographic validation angles before allowing progression.
* *Prompt 3:* Text description field box requiring entry notes.


* Upon clicking `Submit Hazard Escalation`, the following events occur instantly:
* The clean assignment task drops from the active cleaner queue frame.
* A priority emergency maintenance ticket drops instantly inside the Maintenance Engineer dashboard queue tier.
* A customer support incident case object automatically maps into the active CRM workflow panel tracking queue.
* An internal system system alert tag flags the property profile asset offline, blocking incoming reservation possibilities until safety clearance sign-off is logged.





### 8.5 Disrupted Host Payout Routing Protocol

* **Scenario:** System tries to execute payment disbursement distribution routines to a host account ledger profile containing incorrect, expired, or unverified banking credentials.
* **UI Presentation Resolution:**
* The host master dashboard command screen shows a fixed, dismiss-resistant orange warning marquee ticker element across the top layout view frame:
> 💳 **Payout Distribution Stalled:** Your monthly generated revenue settlement totaling **$4,821.50** is currently frozen in escrow because your banking account routing validation profile is unverified or missing required tax documentation updates.


* The text highlights a direct click hyperlink path titled `Launch Financial Verification Portal` which routes the host straight to the banking profile setup screen where invalid fields are outlined in blinking red accent containers.



### 8.6 Lost Core Network Connectivity Offline Framework

* **Scenario:** A field cleaner or maintenance tech worker drops cellular data carrier coverage signals while deep inside a concrete subterranean structural unit layout during active assignment task executions.
* **UI Presentation Resolution:**
* The mobile application framework switches visual modes into an explicit local offline data collection state layout cache framework.
* An operational indicator badge text element reads: `Running in Offline Local Cache Mode`.
* All checklist check interactions, photo acquisitions, and timestamps continue recording locally onto secure local sandbox storage allocations.
* The app prevents account logging out out structures while offline cache queues contain unsynced payload rows.
* As soon as cellular data signals recover, the top bar changes to a green state text reading `Syncing Data with Omni-Stay Cloud Assets...`, passing data packages silently up to cloud servers without requiring user interactive instructions.



---

## END OF PRODUCT SPECIFICATION BIBLE (OMNI-STAY)