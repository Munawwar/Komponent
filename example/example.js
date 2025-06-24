import htm from "htm";
import { createElement, render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
const html = htm.bind(createElement);

import hljs from 'https://unpkg.com/@highlightjs/cdn-assets@11.11.1/es/core.min.js';
import javascript from 'https://unpkg.com/@highlightjs/cdn-assets@11.11.1/es/languages/javascript.min.js';
import { memo } from "../lib/komponent.js";

const UnMemoizedButton = ({ obj, onClick }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  return html`<button class="badge" onclick=${onClick}>${obj.text} - ${renderCount.current}</button>`;
};

const MemoizedButton = memo(UnMemoizedButton);

function App() {
  const [renderNumber, triggerRender] = useState(1);
  const onClickUnMemoized = () => {
    console.log("onClickUnMemoized");
  };
  const onClickMemoized = () => {
    console.log(`onClickMemoized. Changing onClick handler does not trigger re-render, yet event handler is the latest! Render number is ${renderNumber}`);
  };

  useEffect(() => {
    hljs.highlightAll();
  });

  return html`
    <p>What benefit does Komponent provide?
    <br/>
    Try triggering app re-render and see what happens.</p>
    <br/>
    <span style="margin-right: 10px;">Render number: ${renderNumber}</span>
    <button onclick=${() => triggerRender((val) => val + 1)}>Trigger app re-render</button> 
    <br/><br/>

    <label>Prevent unnecessary re-renders</label>
    <label>(even handles callback / function props)</label>
    <div class="demoContainer">
      <${UnMemoizedButton} obj=${{ text: "Unmemoized Button" }} onClick=${onClickUnMemoized} />
      <${MemoizedButton} obj=${{ text: "Memoized Button" }} onClick=${onClickMemoized} />
    </div>
    <details>
      <summary>Code</summary>
      <pre><code class="language-jsx">${`import { memo } from "komponent";

const UnMemoizedButton = ({ obj, onClick }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  return html\`<button class="badge" onclick=\${onClick}>\${obj.text} - \${renderCount.current}</button>\`;
};

const MemoizedButton = memo(UnMemoizedButton);

function App() {
  const [renderNumber, triggerRender] = useState(1);
  const onClickUnMemoized = () => {
    console.log("onClickUnMemoized");
  };
  const onClickMemoized = () => {
    console.log(\`onClickMemoized. Changing onClick handler does not trigger re-render, yet event handler is the latest! Render number is \${renderNumber}\`);
  };

  return (
    <UnMemoizedButton obj={{ text: 'UnMemoizedButton Button' }} onClick=\${onClickUnMemoized} />
    <MemoizedButton obj={{ text: 'Memoized Button' }} onClick=\${onClickMemoized} />
  )
}`}
      </code></pre>
    </details>
    <p>
      Note that the onClick prop being passed to both buttons component is not using a useCallback / useMemo.
      Meaning a new function is created as onClick handler on each render.
      <br/><br/>
      Yet it does not trigger a re-render of the memoized component,
      and even nicer, a proxy makes sure that preact doesn't need to reattach
      new event listener and the latest onClick handler is always used!</p>
    <br/><br/>

    <label>useKState(initialState)</label>
    <pre><code class="language-jsx">${`import { useKState, useKEffect } from "komponent";

function Component(props) {
  const [getValue, setValue, hasValueChanged] = useKState({
      prop1: ['a', 'b', 'c'],
      prop2: {a: 1, b: 2, c: 3},
  });
  // you can use \`hasValueChanged\` for debugging changes to the state
  
  // Create a useEffect that won't re-run on every change to \`value\`
  // but only when \`props.something\` changes.
  useKEffect(() => {
    // Yet there is no stale-closure problem, because the getter function returns
    // the latest value
    console.log("Runs only when \`props.something\` changes:", getValue());
  }, [getValue, props.something]);

  // To create a useEffect that runs on every change to \`value\`,
  // you can get the value out of the getter first by doing \`getValue()\`
  useKEffect(() => {
    console.log("Runs on every value change or props.something changes:", getValue());
  }, [getValue(), props.something]);
};`}
      </code></pre>
    <br/><br/>

    <label>useKEffect(setup, dependencies?)</label>
    <p>
      useKEffect does a deep equality check dependencies before running the effect.
      <br/><br/>
      The interface is the same as useEffect except that when \`dependencies\` array is not provided,
      the effect will run only once on component mount.
    </p>
    <br/><br/>

    <label>useKMemo(calculateValue, dependencies?)</label>
    <p>
      useKMemo does a deep equality check dependencies and the returned value before returning the memoized value.
      <br/><br/>
      The interface is the same as useMemo when you pass dependencies. When no dependencies is passed it only
      compares (with deep equality) the new value with the previous value returned by the calculatedValue function.
    </p>
    <br/><br/>
  `;
}

hljs.registerLanguage('javascript', javascript);

const root = document.getElementById("root");
render(html`<${App} />`, root);
