# Setup Cloud Print

In order to setup Google Cloud Print to function, you'll need to perform the following steps for **each** Google Account.
Detailed instructions are posted in the [Google Identity Platform](https://developers.google.com/identity/protocols/OAuth2).

1. Register a new API Project on [Google API Console](https://developers.google.com/google-apps/tasks/firstapp#register)
1. For the API Project you created:
    - enable the [Task API](https://developers.google.com/google-apps/tasks/)
    - create **OAuth client ID** credentials for a **Web application**
    - Setup the **OAuth consent screen** with an appropriate name
1. In the Google Sheet:
    - Open the Script Editor Page (Tools > Script editor...)
    - Open the Properties pane (File > Project properties)
    - Navigate to **Script Properties**, then create or edit the Property names:
        - CLIENT_ID = Client ID from the API Project
        - CLIENT_SECRET = Client secret from the API Project
    - Navigate to Libraries (Resources** > Libraries...)
        - Add a library **MswhXl8fVhTFUH_Q3UOJbXvxhMjh3Sh48** and press the **Add** button
        - Select version **24** from the Version drop-down list
        - Press **Save**
    - Close the Script Editor Page
1. In the Google Sheet, navigate to the **CloudPrint** menu option, and select **Authorization URL**.
    - If you get a **redirect_uri_mismatch** error:
        - Copy the **redirect URI**
        - Navigate to the **authorized redirect UIRs** link at the bottom of the error message
        - Paste in the **redirect URI** URL into the **Authorized redirect URIs** section. Note, the URI should end with **/usercallback**
        - Press the **Save** button
        - Refresh the page which displayed the **redirect_uri_mismatch**
    - Choose the appropriate Google Account you wish to authorize access to the CloudPrint
        - Select **ALLOW**
    - The text should display "You can now use Google Cloud Print from Apps Script"
1. Verify the printer is shared with your Google Account
    - Navigate to [Google Cloud Print](https://www.google.com/cloudprint/#printers)
    - Select **Accept** in the prompt for the Google Account which is trying to share a printer with you
1. Refresh the Google Sheet Page:
    - navigate to the **CloudPrint** menu option **Clear OAuth Cache**
    - **Show Printers**
    - You should see **TODO** returned
