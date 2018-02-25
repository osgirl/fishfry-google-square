# StMM Fish Fry - Google Sheets & Square

To be added here: CI status

- [Prerequisites](#prerequisites)
- [Square Maintenance](#square-maintenance)
- [Google Apps Maintenance](#google-apps-maintenance)
    - [API Documentation](#api-documentation)

## Prerequisites
* [git](https://git-scm.com/) - code repository
* [nodejs](https://nodejs.org/en/) - used for build system
* [clasp](https://www.npmjs.com/package/@google/clasp) - used to develop Google Apps locally 

## Square Maintenance
### Add SQUARE_ACCESS_TOKEN

In order to sync with Square, you'll need the **SQUARE_ACCESS_TOKEN** for the respective storefront.

```bash
TODO:
```

### Setup webhooks on Square
```bash
TODO:
```

## Google Apps Maintenance

### Main Google Documents
- [Google Drive Folder](https://drive.google.com/drive/folders/19A6FMlMWftvgrWq8Eycxfsb-8LMs2GeC)
- [Master Fish Fry Sheet](https://docs.google.com/spreadsheets/d/1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU/edit)
- [Label Template](https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit) 

### Setup webhooks on Google Apps
```bash
TODO:
```

### How to edit Google Sheet scripts locally

If you want to make a copy, this should work (without being connected to square).
1. Clone the Git repository:
    ```bash
    git clone https://github.com/kofc7186/fishfry-google-square.git
    cd fishfry-google-square
    npm install @google/clasp -g
    ```
1. Make a copy of **Master Fish Fry Sheet**
1. In the new copy that was just created:
    -   select "File/Project Properties"
        - Under info tab, there is a field "script ID"
        - Copy the "script ID" to your clipboard
1. Edit the **.clasp.json** in the root directory of the repo with the value you copied in the previous step
1. Install the NodeJS package from the git repo:
    ```bash
    npm install
    ```
1. Authenticate and authorize clasp to manipulate the project with the google account that has access to the new copy:
    ```bash
    clasp login
    ```
    This launches a browser and asks you to login via oauth.
1. Enable **Apps Script API** by visiting [Apps Script API](https://script.google.com/home/usersettings) and toggle **Google Apps Script API** to **ON**.  
1. Modify files locally, then push/pull the changes between your desktop and Google Apps
    - **clasp push** will push the code on your local machine to the Google App
    - **clasp pull** will pull the code from Google App to your local machine

### API Documentation
The hosted JSDoc files can be found [here](https://kofc7186.github.io/fishfry-google-square/fishfry-google-square/0.1.0/).

To generate updated documentation:
```bash
TODO:
```

### Google Apps JavaScript Classes

These are classes used to interact with the Google infrastructure.

- [Logger](https://developers.google.com/apps-script/reference/base/logger) 
    - used to write out text to the debugging logs 
- [PropertiesService](https://developers.google.com/apps-script/reference/properties/properties-service) 
    - Allows scripts to store simple data in key-value pairs scoped to one script, one user of a script, or one document in which an add-on is used.
    - Used to retrieve the **SQUARE_ACCESS_TOKEN** attribute to communicate with Square
- [HtmlService](https://developers.google.com/apps-script/reference/html/html-service) 
    - Service for returning HTML and other text content from a script.
    - Used to render HTML forms for user input
    - Used to render response to websocket from Square 
- [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app) 
    - Fetch resources and communicate with other hosts over the Internet.
    - Used to make RESTful calls to Square
- [SpreadsheetApp](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app) 
    - This class allows users to open Google Sheets files and to create new ones.
    - Used to manipulate the main Google Sheet 
- [DocumentApp](https://developers.google.com/apps-script/reference/document/document-app) 
    - The document service creates and opens Documents that can be edited.
    - Used to retrieve the Print template, create new document based on data from Sheet
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
    - Prevents concurrent access to sections of code.
    - Used to retrive atomic human interpretable order number (i.e. auto-increment)
- [Utilities](https://developers.google.com/apps-script/reference/utilities/utilities)
    - This service provides utilities for string encoding/decoding, date formatting, JSON manipulation, and other miscellaneous tasks.
    - Used for date/time formatting
    
### Source Code

```
└── src
    ├── FormatOrder.js - used to take input from Square API and format it to insert into Google Sheets
    ├── Worksheet.js - manipulation to the Worksheet Transactions
    ├── doPost.js - webhook callback for Square
    ├── html - form templates
    ├── menuItems.js - objects for items customers may order, and what ingredients are contained within each order
    ├── orm.js - helper functions to manipulate the Google Sheet and Workbooks within
    ├── printLabels.js - generate label from an order, as well as send the label to the printer spool
    ├── simulateSquare.js - testing helper to simulate data from Square
    ├── squareAPI.js - simulate responses from Square's RESTful APIs (used in test only) 
    └── triggers.js - JavaScript trigger functions (i.e. entry point for Google Sheets)
```