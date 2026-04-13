---
title: Building a Football Score Updates API with Node.js and Web Scraping
date: 2020-07-21 11:34:11 +0530
author: codevardhan
image: /images/football_api/featured.png
tags: [node-js, web-scraping, api, javascript]
---


# Building a Football Score Updates API with Node.js and Web Scraping

## Football Score Updates API

In the world of football, staying up to date with the latest match scores and updates is crucial for fans, sports journalists, and developers alike. In this technical blog post, we'll explore how to build a Football Score Updates API using Node.js and web scraping techniques. Our API will fetch real-time match information from the popular Flash Score website, allowing users to access comprehensive data on matches happening in various countries and leagues.

## Technologies Used
To create our Football Score Updates API, we'll leverage the following technologies:

- Node.js: A powerful JavaScript runtime environment that allows us to build server-side applications.
- Express: A popular Node.js framework for building web APIs that simplifies routing and request handling.

- Puppeteer: A Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.

## Setting Up the Project
Let's start by setting up our project:

Initialize a new Node.js project by running npm init in your project directory. Follow the prompts to create a package.json file.

Install the required dependencies by running the following command:

```bash
npm install express cors puppeteer
```
Create an index.js file in your project directory to serve as the entry point for our application.

Open index.js and import the required modules:

```javascript
import express from 'express';
import cors from 'cors';
```
Initialize an Express application and set the port:

```javascript
const app = express();
const PORT = process.env.PORT || 3000;
```
Enable CORS middleware to handle Cross-Origin Resource Sharing:

```javascript
app.use(cors());
```
Define a route in your Express application to handle the match updates request, and relegate the scraping work to another function to maintain code cleanliness.

```javascript
app.get('/:country/:comp', async (req, res, next) => {
  try {
    const { country, comp } = req.params;
    const data = await getDataFromCompName(country, comp);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
```
Start the server by calling app.listen(PORT, ...):

```javascript
app.listen(PORT, () => console.log(`🚀 Server ready at http://localhost:${PORT}/`));
```
Now, our Express server is ready to handle incoming requests and fetch match updates using the getDataFromCompName function.

## Web Scraping the Flash Score Website
Next, we'll implement the web scraping logic using Puppeteer to fetch the latest match updates from the Flash Score website.

Define a route in your Express application to handle the match updates request:

```javascript
app.get('/matches', async (req, res) => {
  try {
    const { country, league } = req.query;
    const data = await getDataFromCompName(country, league);

    res.json({ matches: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
```
Implement the getDataFromCompName function to perform the web scraping:

```javascript
async function getDataFromCompName(country, league) {
  const url = `https://www.flashscore.in/football/${country}/${league}`;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'font' || req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const data = await page.evaluate(() => {

      const sections = document.querySelector('section.event.event--live.event--summary');
      const divs = Array.from(sections.getElementsByTagName('div'));
      const match_info = [];
      for (let i = 0; i < divs.length; i += 1) {
        const current = divs[i];
        if (current.id !== '') {
          match_info.push(current.innerText.split('\n'));
        }
      }
      return match_info;
    });
    await browser.close();
    return parseJSON(data);
  } catch (error) {
    console.error(error);
    return [];
  }
}
```
Implement the parseJSON function to process the scraped data:

```javascript
function parseJSON(match_info) {
  const final_json = [];

  if (match_info.length === 0) {
    return ['No matches have taken place in the last 24 hours.'];
  }

  match_info.forEach((match) => {
    const match_info_json = {};
    final_json.push(new MatchInstance(match_info_json));
  });

  return final_json;
}
```
Define the MatchInstance class to represent a single match instance:

```javascript
class MatchInstance {
  constructor(match_info_json) {
    this.status = match_info_json.status;
    this.time = match_info_json.time;
    this.team_1 = match_info_json.team_1;
    this.team_2 = match_info_json.team_2;
    this.score_1 = match_info_json.score_1;
    this.score_2 = match_info_json.score_2;
    this.fh_score = match_info_json.fh_score;
  }
}
```
## Testing the API
Start the Express server by adding the following code to the end of index.js:

```javascript
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```
Run the API by executing the following command in your terminal:

```bash
node index.js
```

Open your terminal and provide a curl request to "http://localhost:3000/matches?country=your_country&league=your_league" to retrieve the latest match updates for your desired country and league.

You should receive a JSON response containing the match data.

## Customization and Enhancements
Our basic Football Score Updates API is now up and running. However, there are several customization and enhancement options you can explore:
- Additional Endpoints: Extend the API to provide additional endpoints for accessing team information, player statistics, or historical match data.
- Error Handling: Implement robust error handling to provide clear and meaningful error messages to API consumers.
- Caching: Introduce a caching mechanism to reduce the number of requests made to the Flash Score website and improve the API's performance.
- Authentication: Implement authentication mechanisms, such as API keys or JWT tokens, to secure the API and control access to the match data.

## Conclusion
In this blog post, we've explored how to build a Football Score Updates API using Node.js and Puppeteer. By leveraging the power of Express and Puppeteer, we were able to scrape real-time match updates from the Flash Score website and deliver them as JSON responses. This API serves as a foundation for providing football enthusiasts with the latest match information, enabling them to stay connected to the game they love.

Feel free to explore further and customize the API according to your specific requirements. Happy coding!

*Note: When scraping websites, it's important to be mindful of their terms of service and to respect their usage policies. Always ensure that you're scraping responsibly and within legal and ethical boundaries.*