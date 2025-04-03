import { DailyProvider, useCallObject } from "@daily-co/daily-react";
import { useEffect } from "react";
import { createStore, Provider } from "jotai";
import Video from "./component/Video";
import NewVideo from "./component/NewVideo";
function App() {
  // useEffect(() => {
  //   const disableContextMenu = (event: MouseEvent) => event.preventDefault();
  //   const disableKeys = (event: KeyboardEvent) => {
  //     if (event.metaKey && event.altKey && event.key === "i") {
  //       event.preventDefault();
  //     }
  //     if (
  //       event.key === "F12" ||
  //       (event.ctrlKey && event.shiftKey && event.key === "I")
  //     ) {
  //       event.preventDefault();
  //     }
  //   };

  //   document.addEventListener("contextmenu", disableContextMenu);
  //   document.addEventListener("keydown", disableKeys);

  //   return () => {
  //     document.removeEventListener("contextmenu", disableContextMenu);
  //     document.removeEventListener("keydown", disableKeys);
  //   };
  // }, []);
  const jotaiStore = createStore();
  const callObject = useCallObject({});

  return (
    <Provider store={jotaiStore}>
      <DailyProvider callObject={callObject} jotaiStore={jotaiStore}>
        {/* <Video /> */}
        <NewVideo />
      </DailyProvider>
    </Provider>
  );
}

export default App;
