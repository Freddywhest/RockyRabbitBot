# Steps to get `webAppInitData/Query`

## **Using telegram web:**

1. Set `USE_QUERY_ID` in your .env file to `True`

2. Launch WEB Telegram with your browser (e.g. Chrome)

3. Click the F12 to open `Inspect tool` for you Chromium browser (e.g Brave, Chrome, Arc, Microsoft Edge, etc..)

4. Launch the Rocky Rabbit app from your telegram web

5. Click on the `Console` tab in the `Inspect tool`

6. Type `allow pasting` in the `Console` and press enter

7. Copy and Paste `new URLSearchParams(document.querySelector('iframe').src.split('#')[1]).get('tgWebAppData')` in the console and press enter

8. Copy the returned string in the `Console` after finishing `Step 6`

The string looks like: `user=%7B%22id4345646456451%2C%22first_name%22%3A%dfgdfgdfg%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%dfghsgrdfgdfg%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-457567675675&chat_type=sender&auth_date=175657657&hash=66487465e9877w98rf7sdfsdjh48484343herfuh4y4rwseifs`

9. Paste it in the `queryIds.json` file. Example below:

```json
{
  "Account1": "user=%7B%22id4345646456451%2C%22first_name%22%3A%dfgdfgdfg%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%dfghsgrdfgdfg%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-457567675675&chat_type=sender&auth_date=175657657&hash=66487465e9877w98rf7sdfsdjh48484343herfuh4y4rwseifs"
}
```

10. Now start the bot using `node index.js`
