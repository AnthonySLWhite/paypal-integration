import React from 'react';
import logo from './logo.svg';

function App() {
    const name = 'Fonzye';
    return (
        <div
            className="App"
            style={{
                // backgroundColor: 'red',
                minWidth: '100%',
                minHeight: '100%',
            }}
        >
            <Navbar />
        </div>
    );
}

function Navbar(props) {
    return (
        <header>
            <ul>
                <li>Login</li>
                <li>App area</li>
            </ul>
        </header>
    );
}

export default App;
