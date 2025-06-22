# Preact komponent

Proof-of-concept tools to make react calm down and render less!

(DO NOT use in a production codebase)

Examples - https://munawwar.github.io/preact-combobox/example/example.html

(The code for the examples is in the git repo `example/` directory).

## Installation

TODO: Clone repo for now. Or try esm.sh or unkpg.

## Usage

### memo()

```jsx
import { memo } from "./lib/komponent.js";

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

  return (
    <UnMemoizedButton obj={{ text: 'UnMemoizedButton Button' }} onClick={onClickUnMemoized} />
    <MemoizedButton obj={{ text: 'Memoized Button' }} onClick={onClickMemoized} />
  )
}
```

Every render will re-render the UnMemoized button because we are passing a new object to `obj` prop every time. But MemoizedButton won't re-render because it's deeply equal every time.

Note that the onClick prop being passed to both buttons component is not using a useCallback / useMemo.
Meaning a new function is created as onClick handler on each render.

Yet it does not trigger a re-render of the memoized component,
and even nicer, a proxy makes sure that preact doesn't need to reattach
new event listener and the latest onClick handler is always used!</p>

### useDeepState(initialValue)
TODO:

### useDeepEffect(effect, dependencies)
TODO:

### useDeepMemo(calculateValue, dependencies?)
TODO:

## Run Demo Locally

```bash
npm run dev
# open http://localhost:3050/example/example.html in a browser
```