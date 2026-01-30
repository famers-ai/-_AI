# ⚖️ Legal Risk Analysis: Location-Based Services

## 1. Overview
Implementing "Use My Location" via the browser's Geolocation API (`navigator.geolocation`) is the industry standard and generally safe, provided specific privacy principles are followed. Below is an analysis of the legal risks and best practices.

## 2. Key Legal Frameworks
- **GDPR (Europe)**: Location data is "Personal Data". Requires explicit consent and clear purpose.
- **CCPA/CPRA (California)**: Consumers have the right to know what data is collected and to opt-out.
- **PIPA (Korea)**: Location information is sensitive; requires consent and unrelated usage is prohibited.

## 3. Risk Assessment of Current Implementation

### ✅ Low Risk Factors (Current Approach)
1.  **Voluntary Action**: The feature is triggered only when the user *clicks* the button.
2.  **Browser Consent**: The browser (Chrome, Safari, etc.) handles the mandatory "Allow/Block" permission popup, serving as a primary consent mechanism.
3.  **Ephemeral Usage**: We are transmitting coordinates (`lat`, `lon`) to the backend to fetch weather data, but **we are not storing `lat`/`lon` in the user's permanent profile** in the database.
4.  **No Tracking**: We are not tracking movement history.

### ⚠️ Potential Risks & Mitigations

| Risk | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Lack of Transparency** | User doesn't know *why* location is needed. | **Implemented**: The UI clearly implies it's for "Weather & Location" data. <br>**Recommended**: Add a line in Privacy Policy (see below). |
| **Data Retention** | Accidentally logging coordinates in server logs. | **Action**: Ensure backend logs do not store precise GPS coordinates for long periods. |
| **Third-Party Leakage** | Sending coordinates to unreliable 3rd parties. | **Safe**: We only send to Open-Meteo (a reputable weather API provider) and do not sell data. |

## 4. Recommended Privacy Policy Clause
To fully mitigate legal risks, add the following clause to your Privacy Policy:

> **Location Information**  
> We may collect your device's geolocation (latitude/longitude) solely for the purpose of providing local weather data and localized farming insights. This data is processed in real-time and is not stored permanently on our servers or linked to your historical profile without your explicit consent. You may revoke permission at any time via your browser settings.

## 5. Technical Implementation Verification
- **Frontend**: `navigator.geolocation.getCurrentPosition` is used, which enforces the browser permission prompt.
- **Backend**: The API receives `lat`/`lon` to query Open-Meteo, but the `sensor_readings` table does not automatically save these coordinates unless the user explicitly saves a record.

## 6. Conclusion
The "Use My Location" button is **legally safe** and **highly recommended** for UX, provided that:
1.  It remains **opt-in** (user click).
2.  We do not store the exact GPS history.
3.  The privacy policy is updated to reflect this usage.
