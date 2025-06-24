# Preact komponent

Proof-of-concept tools to make react calm down and render less!

(DO NOT use in a production codebase)

Examples - https://munawwar.github.io/komponent/example/example.html

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

### useKState(initialState)

`useKState` provides a way to manage state that prevents unnecessary re-renders while avoiding stale closure problems, by providing a stable getter `getValue` instead of providing the value itself.

`getValue` doesn't go "stale", and calling it always gives you the current value in time. Also since `getValue` doesn't change across renders you can use it in useEffect dependency
(i.e. if your linter is yelling at you) without worrying about excessive rendering.

When you set a value with `setValue` the component will only re-render if the new data is not deeply equal to the previous data.

```jsx
import { useKState, useKEffect } from "./lib/komponent.js";

function Component(props) {
  const [getValue, setValue, hasValueChanged] = useKState({
      prop1: ['a', 'b', 'c'],
      prop2: {a: 1, b: 2, c: 3},
  });
  // you can use `hasValueChanged` for debugging changes to the state
  
  // Create a useEffect that won't re-run on every change to `value`
  // but only when `props.something` changes.
  useKEffect(() => {
    // Yet there is no stale-closure problem, because the getter function returns
    // the latest value
    console.log("Runs only when `props.something` changes:", getValue());
  }, [getValue, props.something]);

  // To create a useEffect that runs on every change to `value`,
  // you can get the value out of the getter first by doing `getValue()`
  useKEffect(() => {
    console.log("Runs on every value change or props.something changes:", getValue());
  }, [getValue(), props.something]);
}
```

### useKEffect(setup, dependencies?)

`useKEffect` performs a deep equality check on dependencies before running the effect.

The interface is the same as `useEffect` except that when the `dependencies` array is not provided, the effect will run only once on component mount.

```jsx
import { useKEffect } from "./lib/komponent.js";

function Component({ complexObject }) {
  // This effect will only run when complexObject actually changes deeply,
  // not on every render when a new object reference is passed
  useKEffect(() => {
    console.log("Complex object changed:", complexObject);
  }, [complexObject]);

  // Effect without dependencies runs only once on mount
  useKEffect(() => {
    console.log("Component mounted");
  });
}
```

### useKMemo(calculateValue, dependencies?)

`useKMemo` performs a deep equality check on both dependencies and the returned value before returning the memoized value.

The interface is the same as `useMemo` when you pass dependencies. When no dependencies are passed, it only compares (with deep equality) the new value with the previous value returned by the `calculateValue` function.

```jsx
import { useKMemo } from "./lib/komponent.js";

function Component({ items, filter }) {
  // Only recalculates when items or filter actually change deeply
  const filteredItems = useKMemo(() => {
    return items.filter(item => item.category === filter.category);
  }, [items, filter]);

  // Without dependencies, only recalculates if the result would be different
  const expensiveCalculation = useKMemo(() => {
    return performExpensiveOperation();
  });

  return html`<div>${filteredItems.map(item => html`<span>${item.name}</span>`)}</div>`;
}
```

## Run Demo Locally

```bash
npm run dev
# open http://localhost:3050/example/example.html in a browser
```