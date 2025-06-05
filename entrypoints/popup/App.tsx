import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <header className="flex items-center justify-between w-full max-w-4xl p-4 bg-white shadow-md">
          <img src={wxtLogo} className="h-8" alt="WXT Logo" />
          <img src={reactLogo} className="h-8" alt="React Logo" />
          <h1 className="text-2xl font-bold">WXT + React</h1>
        </header>
        <main className="flex flex-col items-center justify-center flex-1 p-4">
          <h2 className="text-xl font-semibold mb-4">
            Welcome to WXT with React!
          </h2>
          <p className="mb-4">Click the button to increment the count:</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setCount(count + 1)}
          >
            Count: {count}
          </button>
          <p className="mt-4 text-gray-600">
            Edit <code>App.tsx</code> to see changes.
          </p>
        </main>
        <footer className="w-full max-w-4xl p-4 text-center text-gray-500">
          <p className="text-sm">
            Powered by{" "}
            <a href="https://wxt.dev" className="text-blue-500 hover:underline">
              WXT
            </a>{" "}
            and{" "}
            <a
              href="https://reactjs.org"
              className="text-blue-500 hover:underline"
            >
              React
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
