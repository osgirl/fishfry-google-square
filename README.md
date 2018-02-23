# StMM Fish Fry - Google Sheets & Square

To be added here: CI status

## Prerequisites
* [git](https://git-scm.com/) - code repository
* [nodejs](https://nodejs.org/en/) - used for build system
* [clasp](https://www.npmjs.com/package/@google/clasp) - used to develop Google Apps locally 

## Installation
```bash
$ git clone https://github.com/kofc7186/fishfry-google-square.git
cd fishfry-google-square
npm install @google/clasp
```

## Run Locally
```bash
TODO:
```

## API Documentation
The hosted JSDoc files can be found [here](https://kofc7186.github.io/fishfry-google-square/fishfry-google-square/0.1.0/).

To generate updated documentation:
```bash
TODO:
```

## Google Documents
- [Google Drive Folder](https://drive.google.com/drive/folders/19A6FMlMWftvgrWq8Eycxfsb-8LMs2GeC)
- [Master Fish Fry Sheet](https://docs.google.com/spreadsheets/d/1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU/edit)
- [Label Template](https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit) 

### Google JavaScript Classes

These are classes used to interact with the Google infrastructure.

- [Logger](https://developers.google.com/apps-script/reference/base/logger) - used to write out text to the debugging logs 
- [PropertiesService](https://developers.google.com/apps-script/reference/properties/properties-service) - Allows scripts to store simple data in key-value pairs scoped to one script, one user of a script, or one document in which an add-on is used.
- [HtmlService](https://developers.google.com/apps-script/reference/html/html-service) - Service for returning HTML and other text content from a script.
- [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app) - Fetch resources and communicate with other hosts over the Internet.
- [SpreadsheetApp](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app) - This class allows users to open Google Sheets files and to create new ones. 
- [DocumentApp](https://developers.google.com/apps-script/reference/document/document-app) - The document service creates and opens Documents that can be edited. 

## Source Code

```
src
├── doPost.js - webhook callback for Square
├── fishfry.js - entry point for Google Sheets
├── html - form templates
├── orm.js - 
└── printLabels.js - generate label from order
```