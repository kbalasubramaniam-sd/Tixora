# FedEx Shipment Booking API

A complete guide to integrating FedEx Ship API for booking shipments programmatically.

---

## Prerequisites

- FedEx Developer account at [developer.fedex.com](https://developer.fedex.com)
- Registered application with `client_id` and `client_secret`
- FedEx account number

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://apis-sandbox.fedex.com` |
| Production | `https://apis.fedex.com` |

---

## Step 1 — Authentication

FedEx uses **OAuth 2.0 client credentials** flow.

**Endpoint:** `POST /oauth/token`

```http
POST https://apis.fedex.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

> Token expires in **3600 seconds (1 hour)**. Cache and refresh as needed.

---

## Step 2 — Create a Shipment

**Endpoint:** `POST /ship/v1/shipments`

```http
POST https://apis.fedex.com/ship/v1/shipments
Content-Type: application/json
Authorization: Bearer {access_token}
X-locale: en_US
```

### Request Body

```json
{
  "labelResponseOptions": "URL_ONLY",
  "accountNumber": {
    "value": "YOUR_ACCOUNT_NUMBER"
  },
  "requestedShipment": {
    "shipper": {
      "contact": {
        "personName": "John Doe",
        "phoneNumber": "1234567890",
        "companyName": "Acme Corp"
      },
      "address": {
        "streetLines": ["123 Main Street"],
        "city": "Memphis",
        "stateOrProvinceCode": "TN",
        "postalCode": "38116",
        "countryCode": "US"
      }
    },
    "recipients": [
      {
        "contact": {
          "personName": "Jane Smith",
          "phoneNumber": "9876543210",
          "companyName": "Beta Inc"
        },
        "address": {
          "streetLines": ["456 Elm Street"],
          "city": "Dallas",
          "stateOrProvinceCode": "TX",
          "postalCode": "75201",
          "countryCode": "US"
        }
      }
    ],
    "serviceType": "FEDEX_GROUND",
    "packagingType": "YOUR_PACKAGING",
    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
    "requestedPackageLineItems": [
      {
        "weight": {
          "units": "LB",
          "value": 5
        },
        "dimensions": {
          "length": 12,
          "width": 8,
          "height": 6,
          "units": "IN"
        }
      }
    ],
    "labelSpecification": {
      "labelFormatType": "COMMON2D",
      "imageType": "PDF",
      "labelStockType": "PAPER_85X11_TOP_HALF_LABEL"
    },
    "shippingChargesPayment": {
      "paymentType": "SENDER",
      "payor": {
        "responsibleParty": {
          "accountNumber": {
            "value": "YOUR_ACCOUNT_NUMBER"
          }
        }
      }
    }
  }
}
```

### Response

```json
{
  "output": {
    "transactionShipments": [
      {
        "masterTrackingNumber": "123456789012",
        "serviceType": "FEDEX_GROUND",
        "pieceResponses": [
          {
            "trackingNumber": "123456789012",
            "packageDocuments": [
              {
                "contentType": "LABEL",
                "url": "https://www.fedex.com/document/...",
                "expirationTimeStamp": "2025-04-03T00:00:00"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Reference Tables

### Service Types

| Value | Description |
|-------|-------------|
| `FEDEX_GROUND` | Standard ground delivery |
| `FEDEX_2_DAY` | 2-day delivery |
| `FEDEX_2_DAY_AM` | 2-day delivery by 10:30 AM |
| `PRIORITY_OVERNIGHT` | Next business day by 10:30 AM |
| `STANDARD_OVERNIGHT` | Next business day by 3 PM |
| `FIRST_OVERNIGHT` | Next business day by 8 AM |
| `INTERNATIONAL_PRIORITY` | International express |
| `INTERNATIONAL_ECONOMY` | International standard |

### Pickup Types

| Value | Description |
|-------|-------------|
| `DROPOFF_AT_FEDEX_LOCATION` | Drop off at FedEx location |
| `USE_SCHEDULED_PICKUP` | Use existing scheduled pickup |
| `CONTACT_FEDEX_TO_SCHEDULE` | FedEx schedules a pickup |

### Label Image Types

| Value | Description |
|-------|-------------|
| `PDF` | Standard PDF label |
| `PNG` | PNG image |
| `ZPL` | Zebra thermal printer format |
| `EPL2` | EPL2 thermal printer format |

### Payment Types

| Value | Description |
|-------|-------------|
| `SENDER` | Shipper pays |
| `RECIPIENT` | Recipient pays |
| `THIRD_PARTY` | Third party pays |
| `COLLECT` | Collected on delivery |

---

## Step 3 — Extract Tracking Number & Label

```javascript
const data = await shipRes.json();

const trackingNumber = data.output
  .transactionShipments[0]
  .masterTrackingNumber;

const labelUrl = data.output
  .transactionShipments[0]
  .pieceResponses[0]
  .packageDocuments[0]
  .url;

console.log('Tracking Number:', trackingNumber);
console.log('Label URL:', labelUrl);
```

---

## Step 4 — Track a Shipment

**Endpoint:** `POST /track/v1/trackingnumbers`

```json
{
  "includeDetailedScans": true,
  "trackingInfo": [
    {
      "trackingNumberInfo": {
        "trackingNumber": "123456789012"
      }
    }
  ]
}
```

---

## Step 5 — Rate Quote (Optional)

Use before booking to get shipping cost estimates.

**Endpoint:** `POST /rate/v1/rates/quotes`

```json
{
  "accountNumber": { "value": "YOUR_ACCOUNT_NUMBER" },
  "requestedShipment": {
    "shipper": { "address": { "postalCode": "38116", "countryCode": "US" } },
    "recipient": { "address": { "postalCode": "75201", "countryCode": "US" } },
    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
    "requestedPackageLineItems": [
      { "weight": { "units": "LB", "value": 5 } }
    ]
  }
}
```

---

## Error Handling

```javascript
async function bookShipment(payload, token) {
  try {
    const res = await fetch('https://apis.fedex.com/ship/v1/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('FedEx Error:', err.errors);
      throw new Error(err.errors[0].message);
    }

    return await res.json();
  } catch (error) {
    console.error('Shipment booking failed:', error.message);
    throw error;
  }
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `AUTHENTICATION.ERRORVALIDATINGCREDENTIAL` | Invalid client ID or secret |
| `SHIPMENT.VALIDATE.ADDRESS.NOTFOUND` | Invalid address |
| `PACKAGE.WEIGHT.INVALID` | Weight out of range |
| `SERVICE.UNAVAILABLE.ERROR` | Service not available for this route |
| `ACCOUNT.UNREGISTERED` | Account number not registered |

---

## Full JavaScript Example

```javascript
const FEDEX_CLIENT_ID     = 'YOUR_CLIENT_ID';
const FEDEX_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const FEDEX_ACCOUNT       = 'YOUR_ACCOUNT_NUMBER';
const BASE_URL            = 'https://apis-sandbox.fedex.com'; // swap for production

async function getToken() {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${FEDEX_CLIENT_ID}&client_secret=${FEDEX_CLIENT_SECRET}`
  });
  const { access_token } = await res.json();
  return access_token;
}

async function createShipment() {
  const token = await getToken();

  const payload = {
    labelResponseOptions: 'URL_ONLY',
    accountNumber: { value: FEDEX_ACCOUNT },
    requestedShipment: {
      shipper: {
        contact: { personName: 'John Doe', phoneNumber: '1234567890' },
        address: { streetLines: ['123 Main St'], city: 'Memphis', stateOrProvinceCode: 'TN', postalCode: '38116', countryCode: 'US' }
      },
      recipients: [{
        contact: { personName: 'Jane Smith', phoneNumber: '9876543210' },
        address: { streetLines: ['456 Elm St'], city: 'Dallas', stateOrProvinceCode: 'TX', postalCode: '75201', countryCode: 'US' }
      }],
      serviceType: 'FEDEX_GROUND',
      packagingType: 'YOUR_PACKAGING',
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      requestedPackageLineItems: [{ weight: { units: 'LB', value: 5 } }],
      labelSpecification: { labelFormatType: 'COMMON2D', imageType: 'PDF', labelStockType: 'PAPER_85X11_TOP_HALF_LABEL' },
      shippingChargesPayment: { paymentType: 'SENDER', payor: { responsibleParty: { accountNumber: { value: FEDEX_ACCOUNT } } } }
    }
  };

  const res = await fetch(`${BASE_URL}/ship/v1/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return {
    trackingNumber: data.output.transactionShipments[0].masterTrackingNumber,
    labelUrl: data.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].url
  };
}

createShipment().then(console.log).catch(console.error);
```

---

## Resources

- [FedEx Developer Portal](https://developer.fedex.com)
- [FedEx API Reference](https://developer.fedex.com/api/en-us/catalog.html)
- [FedEx Sandbox Testing](https://developer.fedex.com/api/en-us/guides/api-reference.html)
