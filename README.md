# CBC-BTC Manager

A modern React application built for Christ Bible College (CBC) to manage student academic records, course evaluations, and campus stay schedules.

---

## 🚀 Key Features

* **Student Profile Management:** Create, edit, search, and delete student profiles complete with photo uploads, phone numbers, and district details.
* **PDF Report Generation:** Export detailed student directory lists into professionally formatted PDFs using `jsPDF` and `jspdf-autotable`.
* **Academic Evaluations:** Track detailed subject evaluations and progress across multiple departments.
* **Stay & Calendar Management:** Monitor student post-graduation stay windows with date filters and scheduling views.
* **Sticky Navigation Layout:** Features a pinned, multi-tier sticky header (College Navbar, Announcement Ticker, and Manager Sub-tabs) for seamless navigation while scrolling.

---

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI elements (Header, Footer, Navbar, Social Bar, etc.)
├── screens/             # Page views (HomeScreen, StudentFormScreen, AcademicEvaluationsScreen, StayCalendarScreen, etc.)
├── App.js               # Main application state and screen router
├── App.css              # Global layout, variables, and sticky styling rules
├── index.js             # Application entry point
└── index.css            # Base styles and resets



⚙️ Getting Started & Available Scripts
This project was bootstrapped with Create React App. In the project directory, you can run:

npm start
Runs the app in the development mode.

Open http://localhost:3000 to view it in your browser.

The page will reload when you make changes.

You may also see any lint errors in the console.

npm test
Launches the test runner in the interactive watch mode.

npm run build
Builds the app for production to the build folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your app is ready to be deployed!

🛠️ Technologies Used
React.js (Functional components, Hooks, LocalStorage state persistence)

jsPDF & jsPDF-AutoTable (Client-side PDF report generation)

CSS3 (Sticky positioning, Flexbox, responsive grid systems)