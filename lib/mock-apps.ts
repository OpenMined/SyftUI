import { getAssetPath } from "./utils";

export interface App {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  author: string;
  publisher?: string;
  stars: number;
  downloads: number;
  tags: string[];
  verified: boolean;
  icon: string;
  installed: boolean;
  enabled?: boolean;
  autoUpdate?: boolean;
  lastUsed?: string;
  version?: string;
  lastUpdated?: string;
  screenshots?: string[];
  pricing?: string;
  website?: string;
  repository?: string;
  license?: string;
  reviews?: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

// Mock data for marketplace apps
export const mockApps: App[] = [
  {
    id: "1",
    name: "Inbox",
    description: "Send, receive and broadcast API requests between datasites",
    longDescription: `# Inbox API

The Inbox API is a component of the SyftBox ecosystem designed to send and receive API requests between datasites. This app is compatible with MacOS and Linux.

## Features

* Receive and process API requests from others.
* Send API requests to any datasite.
* Broadcast API requests to all datasites.
* Send email and desktop notifications for new API requests.

## Usage

### What is an API?

An API is any folder containing a \`run.sh\` entry script.

### Sending API Requests

You can share your API with datasites in two ways:

1. **Send to a Single Datasite**  
   Copy your API folder into the target datasite's \`inbox/\` directory.

2. **Broadcast to All Datasites**  
   Place your API folder in the \`/SyftBox/apis/broadcast/\` directory.
   The system will:
   * Validate your API.
   * Send it to all datasites with the Inbox API installed.

After an API is sent, datasite owners will receive notifications (desktop and email). They can then review the code of your API request and choose to **approve** or **reject** it. Approved requests execute automatically if the recipient's SyftBox client is active.`,
    author: "OpenMined",
    publisher: "OpenMined Organization",
    version: "0.1.2",
    lastUpdated: "2023-12-20",
    stars: 3,
    downloads: 8964,
    tags: ["api", "datasite", "syftbox", "communication"],
    verified: true,
    icon: "📬",
    installed: true,
    enabled: true,
    lastUsed: "2 hours ago",
    screenshots: [
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
    ],
    pricing: "Free",
    website: "https://github.com/OpenMined/inbox",
    repository: "https://github.com/OpenMined/inbox",
    license: "Apache-2.0",
    reviews: [
      {
        id: "1",
        author: "Data Scientist X",
        rating: 5,
        date: "2023-11-20",
        comment: "Essential tool for our multi-organization data collaboration project. Makes API sharing seamless.",
      },
      {
        id: "2",
        author: "Privacy Engineer Y",
        rating: 4,
        date: "2023-10-15",
        comment: "Very useful for our privacy-preserving data analysis workflow. Easy to integrate.",
      }
    ]
  },
  {
    id: "2",
    name: "Sync Status Indicators",
    description: "Add sync status indicators to all datasite files in MacOS native file manager",
    longDescription: `# Sync Status Indicators
This app adds sync status indicators to all datasite files in the MacOS native file manager. It provides a visual representation of the sync status of your files, making it easier to manage and monitor your data.
## Features
* Visual indicators for sync status
* Easy integration with MacOS native file manager
* User-friendly interface
* Customizable settings
* Supports multiple datasites
* Real-time updates
* Notifications for sync status changes
* Lightweight and efficient
* Minimal impact on system performance

## Installation
1. Install the app from the marketplace.
2. Once installed, the app will automatically integrate with your MacOS native file manager.
3. You can customize the settings to suit your preferences.
4. Enjoy the convenience of sync status indicators for all your datasite files!

## Usage
* Open the MacOS native file manager.
* Navigate to your datasite files.
* Observe the sync status indicators next to each file.
* Use the indicators to quickly identify the sync status of your files.

## Troubleshooting
* If you encounter any issues, please refer to the FAQ section in the app settings.`,
    author: "OpenMined",
    stars: 0,
    downloads: 7577,
    tags: ["sync", "UI", "UX"],
    verified: true,
    icon: "📡",
    installed: false,
    lastUsed: "Never",
    screenshots: [
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
      `${getAssetPath("/placeholder.svg")}`,
    ],
    reviews: [
      {
        id: "1",
        author: "john@acme.com",
        rating: 5,
        date: "2023-12-01",
        comment: "Great app! The sync status indicators are a game changer for managing my datasite files. Highly recommend!",
      },
      {
        id: "2",
        author: "greg@gmail.com",
        rating: 4,
        date: "2023-12-02",
        comment: "Very helpful for keeping track of file statuses.",
      },
      {
        id: "3",
        author: "newuser@example.com",
        rating: 5,
        date: "2024-01-01",
        comment: "The indicators are very intuitive and helpful!",
      },
      {
        id: "4",
        author: "newuser2@example.com",
        rating: 3,
        date: "2024-01-02",
        comment: "Good app, but could impact performance.",
      },
    ]
  },
  {
    id: "3",
    name: "FL Aggregator",
    description: "Perform Federated Learning over SyftBox",
    author: "OpenMined",
    publisher: "OpenMined Organization",
    version: "1.2.0",
    lastUpdated: "2024-01-15",
    stars: 1,
    downloads: 9910,
    tags: ["federated-learning", "aggregator", "server", "pets"],
    verified: true,
    icon: "🌐",
    installed: true,
    enabled: true,
    lastUsed: "Yesterday",
    pricing: "Free",
    license: "MIT"
  },
  {
    id: "4",
    name: "FL Client",
    description: "Client for FL Aggregator",
    author: "OpenMined",
    stars: 0,
    downloads: 3603,
    tags: ["federated-learning", "client", "pets"],
    verified: true,
    icon: "👥",
    installed: false
  },
  {
    id: "5",
    name: "Github App Updater",
    description: "SyftBox app for auto-updating apps with a Github repository",
    author: "OpenMined",
    publisher: "OpenMined Organization",
    version: "0.4.1",
    lastUpdated: "2024-02-10",
    stars: 0,
    downloads: 4660,
    tags: ["github", "app", "updater"],
    verified: true,
    icon: "🐙",
    installed: true,
    enabled: true,
    lastUsed: "Last week",
    pricing: "Free",
    license: "MIT",
    repository: "https://github.com/OpenMined/github-app-updater"
  },
  {
    id: "6",
    name: "Ftop",
    description: "Federated Table of Processes",
    author: "OpenMined",
    stars: 1,
    downloads: 8627,
    tags: ["ftop", "syftbox", "data"],
    verified: true,
    icon: "📈",
    installed: false
  },
  {
    id: "7",
    name: "Logged In",
    description: "Publish your last login time to the SyftBox network",
    author: "Hooli",
    publisher: "Hooli Inc.",
    website: "https://hooli.com",
    repository: "https://github.com/OpenMined/logged_in",
    version: "0.1.0",
    lastUpdated: "2024-01-20",
    stars: 0,
    downloads: 1618,
    tags: ["data", "syftbox"],
    verified: false,
    icon: "🔐",
    installed: false,
  },
  {
    id: "8",
    name: "Pretrained Model Aggregator",
    description: "Create an aggregation pipeline for pretrained MNIST models using SyftBox",
    author: "OpenMined",
    stars: 1,
    downloads: 2464,
    tags: ["MNIST", "pretrained", "model", "aggregator", "server"],
    verified: true,
    icon: "📊",
    installed: false
  },
  {
    id: "9",
    name: "Ring",
    description: "Perform Homomorphic Encryption over the SyftBox network",
    author: "OpenMined",
    stars: 1,
    downloads: 4517,
    tags: ["ring", "he", "homomorphic-encryption", "encryption"],
    verified: true,
    icon: "💍",
    installed: false
  }
];