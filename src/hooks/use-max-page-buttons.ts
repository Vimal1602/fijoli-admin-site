import { useEffect, useState } from "react";

/** How many pagination number buttons to show (3 on mobile, 5 on md+). */
export function useMaxPageButtons(mobile = 3, desktop = 5) {
  const [maxPageButtons, setMaxPageButtons] = useState(mobile);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMaxPageButtons(mq.matches ? desktop : mobile);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [mobile, desktop]);

  return maxPageButtons;
}
