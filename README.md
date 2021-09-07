<!DOCTYPE html>
<html lang="en">
<head>
<title>CSS Template</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* {
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
}

/* Style the header */
header {
  background-color: #666;
  padding: 30px;
  text-align: center;
  font-size: 35px;
  color: white;
}

/* Create two columns/boxes that floats next to each other */
nav {
  float: left;
  width: 30%;
  height: 300px; /* only for demonstration, should be removed */
  background: #ccc;
  padding: 20px;
}

/* Style the list inside the menu */
nav ul {
  list-style-type: none;
  padding: 0;
}

article {
  float: left;
  padding: 20px;
  width: 70%;
  background-color: #f1f1f1;
  height: 300px; /* only for demonstration, should be removed */
}

/* Clear floats after the columns */
section::after {
  content: "";
  display: table;
  clear: both;
}

/* Style the footer */
footer {
  background-color: #777;
  padding: 10px;
  text-align: center;
  color: white;
}

/* Responsive layout - makes the two columns/boxes stack on top of each other instead of next to each other, on small screens */
@media (max-width: 600px) {
  nav, article {
    width: 100%;
    height: auto;
  }
}
</style>
</head>
<body>

<h2>Online English lessons</h2>
<p> On smaller screens, the columns will stack on top of each other.</p>
<p>Resize the browser window to see the responsive effect (you will learn more about this in our next chapter - HTML Responsive.)</p>

<header>
  <h2>Exam training</h2>
</header>

<section>
  <nav>
    <ul>
      <li><a href="#">IELTS/B</a></li>
      <li><a href="#">TOEFL</a></li>
      <li><a href="#">BULATS, PET, KET. I also conduct CEFR tests</a></li>
    </ul>
  </nav>
  
  <article>
    <h1>IELTS</h1>
    <p>The International English Language Testing System is designed to help you work, study or migrate to a country where English is the majority language.</p>
    <p><a href="https://docs.google.com/document/d/e/2PACX-1vRlBYG73opkNETHTCl7__XKpxBUH9tDsIHRATwa8b_6EW1-IupzLx6DMow5yJuirLNKt-dvJ5woPuXp/pub"> IELTS lessons, tailored</a>
    <p><a href="/IELTSMap/index.html"</a></p>
  </article>
</section>

<footer>
  <p>Footer</p>
</footer>

</body>
</html>
