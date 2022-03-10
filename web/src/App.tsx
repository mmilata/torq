import React from 'react';
import logo from './logo.svg';
import { Routes, Route, Link } from "react-router-dom";
import './App.css';

function App() {
        return (
                <div className="App">
                        <header className="App-header">
                                <img src={logo} className="App-logo" alt="logo" />
                                <div>
                                        <h1>Welcome to React Router!</h1>
                                        <Routes>
                                                <Route path="/" element={<Home />} />
                                                <Route path="about" element={<About />} />
                                        </Routes>
                                </div>                <a
                                        className="App-link"
                                        href="https://reactjs.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                >
                                        Learn React
                                </a>
                        </header>
                </div>
        );
}

function Home() {
        return (
                <>
                        <main>
                                <h2>Welcome to the homepage!</h2>
                                <p>You can do this, I believe in you.</p>
                        </main>
                        <nav>
                                <Link to="/about">About</Link>
                        </nav>
                </>
        );
}

function About() {
        return (
                <>
                        <main>
                                <h2>Who are we?</h2>
                                <p>
                                        That feels like an existential question, don't you
                                        think?
                                </p>
                        </main>
                        <nav>
                                <Link to="/">Home</Link>
                        </nav>
                </>
        );
}

export default App;
